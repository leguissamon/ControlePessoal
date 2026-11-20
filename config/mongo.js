require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const nomeDoBanco = process.env.MONGO_DB;

if (!uri || !nomeDoBanco) {
  throw new Error('Defina MONGODB_URI e MONGO_DB no arquivo .env');
}

// Um único MongoClient para a API toda: ele mantém um pool de conexões
// e deve ser criado uma vez e reutilizado.
const client = new MongoClient(uri);
let db = null;

async function conectar() {
  if (!db) {
    await client.connect();
    db = client.db(nomeDoBanco);
  }
  return db;
}

// Usado pelos models para pegar o banco já conectado.
function getDb() {
  if (!db) {
    throw new Error('Banco não conectado. Chame conectar() antes de usar.');
  }
  return db;
}

async function desconectar() {
  await client.close();
  db = null;
}

module.exports = { conectar, getDb, desconectar };