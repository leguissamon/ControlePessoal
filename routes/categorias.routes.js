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

module.exports = router;