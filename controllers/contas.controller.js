const contaService = require('../services/contas.service');

async function criar(req, res) {
  const conta = await contaService.criar(req.body);
  res.status(201).json(conta);
}

async function listar(req, res) {
  const contas = await contaService.listar(req.query);
  res.json({ data: contas, meta: { total: contas.length } });
}

async function buscarPorId(req, res) {
  const conta = await contaService.buscarPorId(req.params.id);
  res.json(conta);
}

async function atualizar(req, res) {
  const conta = await contaService.atualizar(req.params.id, req.body);
  res.json(conta);
}

async function remover(req, res) {
  await contaService.remover(req.params.id);
  res.status(204).send();
}

async function saldo(req, res) {
  const resultado = await contaService.saldo(req.params.id);
  res.json(resultado);
}

async function extrato(req, res) {
  const resultado = await contaService.extrato(req.params.id, req.query);
  res.json(resultado);
}

module.exports = { criar, listar, buscarPorId, atualizar, remover, saldo, extrato };