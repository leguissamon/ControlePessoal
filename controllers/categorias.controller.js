const categoriaService = require('../services/categorias.service');

async function criar(req, res) {
  const categoria = await categoriaService.criar(req.body);
  res.status(201).json(categoria);
}

async function listar(req, res) {
  const categorias = await categoriaService.listar(req.query);
  res.json({ data: categorias, meta: { total: categorias.length } });
}

async function buscarPorId(req, res) {
  const categoria = await categoriaService.buscarPorId(req.params.id);
  res.json(categoria);
}

async function atualizar(req, res) {
  const categoria = await categoriaService.atualizar(req.params.id, req.body);
  res.json(categoria);
}

async function remover(req, res) {
  await categoriaService.remover(req.params.id);
  res.status(204).send();
}

module.exports = { criar, listar, buscarPorId, atualizar, remover };