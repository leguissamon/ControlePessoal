// O _id do MongoDB é um texto com 24 caracteres hexadecimais.
function idValido(id) {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

module.exports = { idValido };