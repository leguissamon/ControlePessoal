const express = require('express');
const usuariosRoutes = require('./routes/usuarios.routes');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensagem: 'API de Controle Financeiro no ar' });
});

app.use('/usuarios', usuariosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});