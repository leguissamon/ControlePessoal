const usuarioModel = require('../models/usuarios.model');
const { ErroHttp } = require('../utils/erros');

function validarDados(dados) {
  const { nome, email } = dados ?? {};

  if (!nome || !email) {
    throw new ErroHttp(400, 'Os campos "nome" e "email" são obrigatórios.');
  }

  return { nome, email };
}

async function criar(dados) {
  const usuario = validarDados(dados);
  return usuarioModel.inserir(usuario);
}

async function listar() {
  return usuarioModel.buscarTodas();
}

async function buscarPorId(id) {
  const usuario = await usuarioModel.buscarPorId(id);

  if (!usuario) {
    throw new ErroHttp(404, 'Usuário não encontrado.');
  }

  return usuario;
}

async function atualizar(id, dados) {
  const campos = validarDados(dados);
  const usuario = await usuarioModel.atualizar(id, campos);

  if (!usuario) {
    throw new ErroHttp(404, 'Usuário não encontrado.');
  }

  return usuario;
}

async function remover(id) {
  const removido = await usuarioModel.remover(id);

  if (!removido) {
    throw new ErroHttp(404, 'Usuário não encontrado.');
  }
}

module.exports = { criar, listar, buscarPorId, atualizar, remover };