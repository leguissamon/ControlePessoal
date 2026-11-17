// O "type" diz que tipo de erro aconteceu, sem depender do texto da mensagem.
const TIPOS_DE_ERRO = {
  400: 'validation_error',
  404: 'not_found',
  409: 'conflict',
  422: 'business_rule_violation',
};

function tipoDoErro(status) {
  return TIPOS_DE_ERRO[status] || 'error';
}

function naoEncontrado(req, res) {
  res.status(404).json({
    type: 'not_found',
    message: `Rota ${req.method} ${req.originalUrl} não encontrada.`,
  });
}

// Middleware de erro: o Express reconhece pelos 4 parâmetros (err, req, res, next)
function tratadorDeErros(err, req, res, next) {
  // JSON malformado no corpo da requisição (erro do express.json)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      type: 'validation_error',
      message: 'O corpo da requisição não é um JSON válido.',
    });
  }

  if (err.status) {
    return res.status(err.status).json({ type: tipoDoErro(err.status), message: err.message });
  }

  console.error(err);
  res.status(500).json({ type: 'internal_error', message: 'Erro interno do servidor.' });
}

module.exports = { naoEncontrado, tratadorDeErros };