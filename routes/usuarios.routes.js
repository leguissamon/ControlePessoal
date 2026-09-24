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
module.exports = router;