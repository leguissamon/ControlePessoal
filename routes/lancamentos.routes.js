const { Router } = require('express');
const { db, proximoId } = require('../data/db');
const { ErroHttp } = require('../utils/erros');

const router = Router();

const TIPOS_VALIDOS = ['receita', 'despesa'];

function buscarConta(id) {
  const conta = db.contas.find((c) => c.id === id);
  if (!conta) {
    throw new ErroHttp(404, 'Conta não encontrada.');
  }
  return conta;
}

function buscarCategoria(id) {
  const categoria = db.categorias.find((c) => c.id === id);
  if (!categoria) {
    throw new ErroHttp(404, 'Categoria não encontrada.');
  }
  return categoria;
}

// Aceita só datas reais no formato AAAA-MM-DD (ex.: 2026-09-27)
function dataValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

// Registrar lançamento
router.post('/', (req, res) => {
  const { contaId, categoriaId, tipo, valor, data, descricao } = req.body ?? {};

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

  const conta = buscarConta(Number(contaId));
  const categoria = buscarCategoria(Number(categoriaId));

  if (categoria.usuarioId !== conta.usuarioId) {
    throw new ErroHttp(422, 'A conta e a categoria precisam pertencer ao mesmo usuário.');
  }

  const lancamento = {
    id: proximoId('lancamentos'),
    usuarioId: conta.usuarioId,
    contaId: conta.id,
    categoriaId: categoria.id,
    tipo,
    valor,
    data,
    descricao: descricao || '',
  };
  db.lancamentos.push(lancamento);

  res.status(201).json(lancamento);
});

// Listar lançamentos (filtros opcionais: ?contaId=1&categoriaId=2)
router.get('/', (req, res) => {
  let lancamentos = db.lancamentos;

  if (req.query.contaId) {
    const contaId = Number(req.query.contaId);
    lancamentos = lancamentos.filter((l) => l.contaId === contaId);
  }

  if (req.query.categoriaId) {
    const categoriaId = Number(req.query.categoriaId);
    lancamentos = lancamentos.filter((l) => l.categoriaId === categoriaId);
  }

  res.json(lancamentos);
});

// Buscar lançamento por id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const lancamento = db.lancamentos.find((l) => l.id === id);

  if (!lancamento) {
    throw new ErroHttp(404, 'Lançamento não encontrado.');
  }

  res.json(lancamento);
});

// Excluir lançamento
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const lancamento = db.lancamentos.find((l) => l.id === id);

  if (!lancamento) {
    throw new ErroHttp(404, 'Lançamento não encontrado.');
  }

  db.lancamentos.splice(db.lancamentos.indexOf(lancamento), 1);
  res.status(204).send();
});
module.exports = router;