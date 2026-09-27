const { Router } = require('express');
const { db, proximoId } = require('../data/db');
const { ErroHttp } = require('../utils/erros');

const router = Router();

const TIPOS_VALIDOS = ['normal', 'lazer', 'reserva'];

function buscarUsuario(id) {
  const usuario = db.usuarios.find((u) => u.id === id);
  if (!usuario) {
    throw new ErroHttp(404, 'Usuário não encontrado.');
  }
  return usuario;
}

// Criar categoria
router.post('/', (req, res) => {
  const { usuarioId, nome, tipo } = req.body ?? {};

  if (!usuarioId || !nome) {
    throw new ErroHttp(400, 'Os campos "usuarioId" e "nome" são obrigatórios.');
  }

  const tipoFinal = tipo || 'normal';
  if (!TIPOS_VALIDOS.includes(tipoFinal)) {
    throw new ErroHttp(400, `O campo "tipo" deve ser um destes: ${TIPOS_VALIDOS.join(', ')}.`);
  }

  buscarUsuario(Number(usuarioId));

  const categoria = { id: proximoId('categorias'), usuarioId: Number(usuarioId), nome, tipo: tipoFinal };
  db.categorias.push(categoria);

  res.status(201).json(categoria);
});

// Listar categorias (filtro opcional por usuário: ?usuarioId=1)
router.get('/', (req, res) => {
  let categorias = db.categorias;

  if (req.query.usuarioId) {
    const usuarioId = Number(req.query.usuarioId);
    categorias = categorias.filter((c) => c.usuarioId === usuarioId);
  }

  res.json(categorias);
});

// Buscar categoria por id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const categoria = db.categorias.find((c) => c.id === id);

  if (!categoria) {
    throw new ErroHttp(404, 'Categoria não encontrada.');
  }

  res.json(categoria);
});

// Atualizar categoria
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const categoria = db.categorias.find((c) => c.id === id);

  if (!categoria) {
    throw new ErroHttp(404, 'Categoria não encontrada.');
  }

  const { nome, tipo } = req.body ?? {};

  if (!nome) {
    throw new ErroHttp(400, 'O campo "nome" é obrigatório.');
  }

  const tipoFinal = tipo || categoria.tipo;
  if (!TIPOS_VALIDOS.includes(tipoFinal)) {
    throw new ErroHttp(400, `O campo "tipo" deve ser um destes: ${TIPOS_VALIDOS.join(', ')}.`);
  }

  categoria.nome = nome;
  categoria.tipo = tipoFinal;

  res.json(categoria);
});
module.exports = router;