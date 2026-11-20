require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { conectar } = require('./config/mongo');
const usuariosRoutes = require('./routes/usuarios.routes');
const { naoEncontrado, tratadorDeErros } = require('./middlewares/erros');
const contasRoutes = require('./routes/contas.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const lancamentosRoutes = require('./routes/lancamentos.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensagem: 'API de Controle Financeiro no ar' });
});

app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/v1/contas', contasRoutes);
app.use('/api/v1/categorias', categoriasRoutes);
app.use('/api/v1/lancamentos', lancamentosRoutes);

app.use(naoEncontrado);
app.use(tratadorDeErros);

async function iniciar() {
  await conectar();
  console.log('Conectado ao MongoDB');

  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

iniciar().catch((erro) => {
  console.error('Não foi possível iniciar a API:', erro.message);
  process.exit(1);
});