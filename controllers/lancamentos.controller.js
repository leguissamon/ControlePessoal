const lancamentoService = require('../services/lancamentos.service');

async function criar(req, res) {
  const lancamento = await lancamentoService.criar(req.body);
  res.status(201).json(lancamento);
}

async function listar(req, res) {
  const lancamentos = await lancamentoService.listar(req.query);
  res.json({ data: lancamentos, meta: { total: lancamentos.length } });
}

async function buscarPorId(req, res) {
  const lancamento = await lancamentoService.buscarPorId(req.params.id);
  res.json(lancamento);
}

async function atualizar(req, res) {
  const lancamento = await lancamentoService.atualizar(req.params.id, req.body);
  res.json(lancamento);
}

async function remover(req, res) {
  await lancamentoService.remover(req.params.id);
  res.status(204).send();
}

module.exports = { criar, listar, buscarPorId, atualizar, remover };