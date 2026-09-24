const { Router } = require('express');
const { db, proximoId } = require('../data/db');

const router = Router();

// Criar usuário
router.post('/', (req, res) => {
  const { nome, email } = req.body ?? {};

  if (!nome || !email) {
    return res.status(400).json({ erro: 'Os campos "nome" e "email" são obrigatórios.' });
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
  const id = Number(req.params.id);
  const usuario = db.usuarios.find((u) => u.id === id);

  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' });
  }

  res.json(usuario);
});

// Atualizar usuário
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const usuario = db.usuarios.find((u) => u.id === id);

  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' });
  }

  const { nome, email } = req.body ?? {};

  if (!nome || !email) {
    return res.status(400).json({ erro: 'Os campos "nome" e "email" são obrigatórios.' });
  }

  usuario.nome = nome;
  usuario.email = email;

  res.json(usuario);
});

// Excluir usuário
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const indice = db.usuarios.findIndex((u) => u.id === id);

  if (indice === -1) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' });
  }

  db.usuarios.splice(indice, 1);

  res.status(204).send();
});
module.exports = router;