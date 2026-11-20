const { ObjectId } = require('mongodb');
const { getDb } = require('../config/mongo');
const { idValido } = require('../utils/ids');

// Pega a coleção "categorias" do banco já conectado.
const colecao = () => getDb().collection('categorias');

async function inserir(usuario) {
  const resultado = await colecao().insertOne(usuario);
  return { _id: resultado.insertedId, ...usuario };
}

// O filtro é opcional: buscarTodas() traz tudo, buscarTodas({ campo: valor }) filtra.
async function buscarTodas(filtro = {}) {
  return colecao().find(filtro).toArray();
}

async function buscarPorId(id) {
  if (!idValido(id)) return null;
  return colecao().findOne({ _id: new ObjectId(id) });
}

// Devolve o documento já atualizado, ou null se não existir.
async function atualizar(id, dados) {
  if (!idValido(id)) return null;
  return colecao().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: dados },
    { returnDocument: 'after' }
  );
}

// Devolve true se removeu, false se não encontrou.
async function remover(id) {
  if (!idValido(id)) return false;
  const resultado = await colecao().deleteOne({ _id: new ObjectId(id) });
  return resultado.deletedCount > 0;
}

module.exports = { inserir, buscarTodas, buscarPorId, atualizar, remover };