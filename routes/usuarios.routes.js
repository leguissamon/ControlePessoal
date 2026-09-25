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

// Criar usuário
router.post('/', (req, res) => {
  const { nome, email } = req.body ?? {};

  if (!nome || !email) {
    throw new ErroHttp(400, 'Os campos "nome" e "email" são obrigatórios.');
  }

  const usuario = { id: proximoId('usuarios'), nome, email };
  db.usuarios.push(usuario);

  res.status(201).json(usuario);
});

// Listar usuários
router.get('/', (req, res) => {
  res.json(db.usuarios);
});

// Buscar usuário por id
router.get('/:id', (req, res) => {
  const usuario = buscarUsuario(Number(req.params.id));
  res.json(usuario);
});

// Atualizar usuário
router.put('/:id', (req, res) => {
  const usuario = buscarUsuario(Number(req.params.id));
  const { nome, email } = req.body ?? {};

  if (!nome || !email) {
    throw new ErroHttp(400, 'Os campos "nome" e "email" são obrigatórios.');
  }

  usuario.nome = nome;
  usuario.email = email;

  res.json(usuario);
});

// Excluir usuário
router.delete('/:id', (req, res) => {
  const usuario = buscarUsuario(Number(req.params.id));
  db.usuarios.splice(db.usuarios.indexOf(usuario), 1);
  res.status(204).send();
});

module.exports = router;