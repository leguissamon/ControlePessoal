const { db } = require('../data/db');

// Saldo (em centavos) = receitas - despesas da conta
function saldoDaConta(contaId) {
  return db.lancamentos
    .filter((l) => l.contaId === contaId)
    .reduce((saldo, l) => (l.tipo === 'receita' ? saldo + l.valor : saldo - l.valor), 0);
}

module.exports = { saldoDaConta };