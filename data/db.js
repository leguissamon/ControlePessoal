const db = {
  usuarios: [],
  contas: [],
  categorias: [],
  lancamentos: [],
};

const contadores = {
  usuarios: 1,
  contas: 1,
  categorias: 1,
  lancamentos: 1,
};

function proximoId(recurso) {
  const id = contadores[recurso];
  contadores[recurso] += 1;
  return id;
}

module.exports = { db, proximoId };