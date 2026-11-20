const categoriaModel = require('../models/categorias.model');
const lancamentoModel = require('../models/lancamentos.model');
const usuarioService = require('./usuarios.service');
const { ErroHttp } = require('../utils/erros');

const TIPOS_VALIDOS = ['normal', 'lazer', 'reserva'];

function validarTipo(tipo) {
  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new ErroHttp(400, `O campo "tipo" deve ser um destes: ${TIPOS_VALIDOS.join(', ')}.`);
  }
}

async function criar(dados) {
  const { usuarioId, nome, tipo } = dados ?? {};

  if (!usuarioId || !nome) {
    throw new ErroHttp(400, 'Os campos "usuarioId" e "nome" são obrigatórios.');
  }

  const tipoFinal = tipo || 'normal';
  validarTipo(tipoFinal);

  // Garante que o usuário existe (lança 404 se não existir).
  const usuario = await usuarioService.buscarPorId(usuarioId);

  return categoriaModel.inserir({
    usuarioId: usuario._id.toString(),
    nome,
    tipo: tipoFinal,
  });
}

// Filtro opcional por usuário: ?usuarioId=...
async function listar(query = {}) {
  const filtro = {};
  if (query.usuarioId) filtro.usuarioId = String(query.usuarioId);
  return categoriaModel.buscarTodas(filtro);
}

async function buscarPorId(id) {
  const categoria = await categoriaModel.buscarPorId(id);

  if (!categoria) {
    throw new ErroHttp(404, 'Categoria não encontrada.');
  }

  return categoria;
}

async function atualizar(id, dados) {
  const atual = await buscarPorId(id);
  const { nome, tipo } = dados ?? {};

  if (!nome) {
    throw new ErroHttp(400, 'O campo "nome" é obrigatório.');
  }

  const tipoFinal = tipo || atual.tipo;
  validarTipo(tipoFinal);

  return categoriaModel.atualizar(id, { nome, tipo: tipoFinal });
}

// Só exclui se não houver lançamentos usando a categoria.
async function remover(id) {
  const categoria = await buscarPorId(id);
  const lancamentos = await lancamentoModel.buscarTodas({ categoriaId: categoria._id.toString() });

  if (lancamentos.length > 0) {
    throw new ErroHttp(409, 'Não é possível excluir: a categoria possui lançamentos.');
  }

  await categoriaModel.remover(id);
}

module.exports = { criar, listar, buscarPorId, atualizar, remover };