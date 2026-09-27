const { Router } = require('express');
const { db, proximoId } = require('../data/db');
const { ErroHttp } = require('../utils/erros');

const router = Router();

function buscarUsuario(id) {
  const usuario = db.usuarios.find((u) => u.id === id);
  if (!usuario) {
    throw new ErroHttp(404, 'Usuário não encontrado.');
  }
  return usuario;
}

// Criar conta
router.post('/', (req, res) => {
  const { usuarioId, nome } = req.body ?? {};

  if (!usuarioId || !nome) {
    throw new ErroHttp(400, 'Os campos "usuarioId" e "nome" são obrigatórios.');
  }

  buscarUsuario(Number(usuarioId)); // garante que o usuário existe

  const conta = { id: proximoId('contas'), usuarioId: Number(usuarioId), nome };
  db.contas.push(conta);

  res.status(201).json(conta);
});
// Listar contas (filtro opcional por usuário: ?usuarioId=1)
router.get('/', (req, res) => {
  let contas = db.contas;

  if (req.query.usuarioId) {
    const usuarioId = Number(req.query.usuarioId);
    contas = contas.filter((c) => c.usuarioId === usuarioId);
  }

  res.json(contas);
});

// Buscar conta por id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const conta = db.contas.find((c) => c.id === id);

  if (!conta) {
    throw new ErroHttp(404, 'Conta não encontrada.');
  }

  res.json(conta);
});
module.exports = router;