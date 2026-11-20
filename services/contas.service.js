const contaModel = require('../models/contas.model');
const lancamentoModel = require('../models/lancamentos.model');
const usuarioService = require('./usuarios.service');
const { ErroHttp } = require('../utils/erros');

async function criar(dados) {
  const { usuarioId, nome } = dados ?? {};

  if (!usuarioId || !nome) {
    throw new ErroHttp(400, 'Os campos "usuarioId" e "nome" são obrigatórios.');
  }

  const usuario = await usuarioService.buscarPorId(usuarioId);

  return contaModel.inserir({ usuarioId: usuario._id.toString(), nome });
}

async function listar(query = {}) {
  const filtro = {};
  if (query.usuarioId) filtro.usuarioId = String(query.usuarioId);
  return contaModel.buscarTodas(filtro);
}

async function buscarPorId(id) {
  const conta = await contaModel.buscarPorId(id);

  if (!conta) {
    throw new ErroHttp(404, 'Conta não encontrada.');
  }

  return conta;
}

// Só o nome pode mudar.
async function atualizar(id, dados) {
  await buscarPorId(id);
  const { nome } = dados ?? {};

  if (!nome) {
    throw new ErroHttp(400, 'O campo "nome" é obrigatório.');
  }

  return contaModel.atualizar(id, { nome });
}

async function remover(id) {
  const conta = await buscarPorId(id);
  const lancamentos = await lancamentoModel.buscarTodas({ contaId: conta._id.toString() });

  if (lancamentos.length > 0) {
    throw new ErroHttp(409, 'Não é possível excluir: a conta possui lançamentos.');
  }

  await contaModel.remover(id);
}

// Saldo (em centavos) = receitas - despesas da conta.
async function calcularSaldo(contaId) {
  const lancamentos = await lancamentoModel.buscarTodas({ contaId: String(contaId) });
  return lancamentos.reduce(
    (saldo, l) => (l.tipo === 'receita' ? saldo + l.valor : saldo - l.valor),
    0
  );
}

async function saldo(id) {
  const conta = await buscarPorId(id);
  const contaId = conta._id.toString();

  return { contaId, nome: conta.nome, saldo: await calcularSaldo(contaId) };
}

// Extrato por período: ?de=AAAA-MM-DD&ate=AAAA-MM-DD (os dois são opcionais).
async function extrato(id, { de, ate } = {}) {
  const conta = await buscarPorId(id);
  const contaId = conta._id.toString();

  const todos = await lancamentoModel.buscarTodas({ contaId });
  const lancamentos = todos
    .filter((l) => (de ? l.data >= de : true))
    .filter((l) => (ate ? l.data <= ate : true))
    .sort((a, b) => a.data.localeCompare(b.data));

  const totalReceitas = lancamentos
    .filter((l) => l.tipo === 'receita')
    .reduce((soma, l) => soma + l.valor, 0);
  const totalDespesas = lancamentos
    .filter((l) => l.tipo === 'despesa')
    .reduce((soma, l) => soma + l.valor, 0);

  return {
    contaId,
    periodo: { de: de ?? null, ate: ate ?? null },
    totalReceitas,
    totalDespesas,
    resultadoDoPeriodo: totalReceitas - totalDespesas,
    lancamentos,
  };
}

module.exports = { criar, listar, buscarPorId, atualizar, remover, calcularSaldo, saldo, extrato };