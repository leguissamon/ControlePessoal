const usuarioService = require('../services/usuarios.service');

async function criar(req, res) {
  const usuario = await usuarioService.criar(req.body);
  res.status(201).json(usuario);
}

async function listar(req, res) {
  const usuarios = await usuarioService.listar();
  res.json({ data: usuarios, meta: { total: usuarios.length } });
}

async function buscarPorId(req, res) {
  const usuario = await usuarioService.buscarPorId(req.params.id);
  res.json(usuario);
}

async function atualizar(req, res) {
  const usuario = await usuarioService.atualizar(req.params.id, req.body);
  res.json(usuario);
}

async function remover(req, res) {
  await usuarioService.remover(req.params.id);
  res.status(204).send();
}

module.exports = { criar, listar, buscarPorId, atualizar, remover };