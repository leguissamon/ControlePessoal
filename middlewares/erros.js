function naoEncontrado(req, res) {
  res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
}

// Middleware de erro: o Express reconhece pelos 4 parâmetros (err, req, res, next)
function tratadorDeErros(err, req, res, next) {
  if (err.status) {
    return res.status(err.status).json({ erro: err.message });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { naoEncontrado, tratadorDeErros };