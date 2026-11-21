const lancamentoModel = require('../models/lancamentos.model');
const contaService = require('./contas.service');
const categoriaService = require('./categorias.service');
const regras = require('./regras');
const { ErroHttp } = require('../utils/erros');

const TIPOS_VALIDOS = ['receita', 'despesa'];

// Aceita só datas reais no formato AAAA-MM-DD (ex.: 2026-09-27)
function dataValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

// Confere os campos do corpo (usado no cadastro e na edição)
function validarDados(dados) {
  const { contaId, categoriaId, tipo, valor, data, descricao } = dados ?? {};

  if (!contaId || !categoriaId || !tipo || valor === undefined || !data) {
    throw new ErroHttp(400, 'Os campos "contaId", "categoriaId", "tipo", "valor" e "data" são obrigatórios.');
  }

  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new ErroHttp(400, `O campo "tipo" deve ser um destes: ${TIPOS_VALIDOS.join(', ')}.`);
  }

  if (!Number.isInteger(valor) || valor <= 0) {
    throw new ErroHttp(400, 'O campo "valor" deve ser um número inteiro maior que zero (em centavos).');
  }

  if (!dataValida(data)) {
    throw new ErroHttp(400, 'O campo "data" deve ser uma data válida no formato AAAA-MM-DD.');
  }

  return { contaId, categoriaId, tipo, valor, data, descricao: descricao || '' };
}

// Busca a conta e a categoria e garante que são do mesmo usuário
async function buscarContaECategoria(contaId, categoriaId) {
  const conta = await contaService.buscarPorId(contaId);
  const categoria = await categoriaService.buscarPorId(categoriaId);

  if (categoria.usuarioId !== conta.usuarioId) {
    throw new ErroHttp(422, 'A conta e a categoria precisam pertencer ao mesmo usuário.');
  }

  return { conta, categoria };
}

async function criar(dados) {
  const { contaId, categoriaId, tipo, valor, data, descricao } = validarDados(dados);
  const { conta, categoria } = await buscarContaECategoria(contaId, categoriaId);

  if (tipo === 'despesa') {
    await regras.validarSaldoParaDespesa(conta, valor);
    await regras.validarLimiteLazer(conta.usuarioId, categoria, valor, data);
    await regras.validarReservaMinima(conta.usuarioId, categoria, valor, data);
  }

  return lancamentoModel.inserir({
    usuarioId: conta.usuarioId,
    contaId: conta._id.toString(),
    categoriaId: categoria._id.toString(),
    tipo,
    valor,
    data,
    descricao,
  });
}

// Filtros opcionais: ?usuarioId=...&contaId=...&categoriaId=...
async function listar(query = {}) {
  const filtro = {};

  for (const campo of ['usuarioId', 'contaId', 'categoriaId']) {
    if (query[campo]) filtro[campo] = String(query[campo]);
  }

  return lancamentoModel.buscarTodas(filtro);
}

async function buscarPorId(id) {
  const lancamento = await lancamentoModel.buscarPorId(id);

  if (!lancamento) {
    throw new ErroHttp(404, 'Lançamento não encontrado.');
  }

  return lancamento;
}

// O corpo tem os mesmos campos do cadastro
async function atualizar(id, dados) {
  const lancamento = await buscarPorId(id);
  const { contaId, categoriaId, tipo, valor, data, descricao } = validarDados(dados);
  const { conta, categoria } = await buscarContaECategoria(contaId, categoriaId);

  await regras.validarEdicao(lancamento, { tipo, valor, data }, conta, categoria);

  return lancamentoModel.atualizar(id, {
    usuarioId: conta.usuarioId,
    contaId: conta._id.toString(),
    categoriaId: categoria._id.toString(),
    tipo,
    valor,
    data,
    descricao,
  });
}

async function remover(id) {
  const lancamento = await buscarPorId(id);

  await regras.validarExclusao(lancamento);
  await lancamentoModel.remover(id);
}

module.exports = { criar, listar, buscarPorId, atualizar, remover };