const { db } = require('../data/db');
const { ErroHttp } = require('../utils/erros');

// Saldo (em centavos) = receitas - despesas da conta
function saldoDaConta(contaId) {
  return db.lancamentos
    .filter((l) => l.contaId === contaId)
    .reduce((saldo, l) => (l.tipo === 'receita' ? saldo + l.valor : saldo - l.valor), 0);
}
const reais = (centavos) => `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`;

// Regra 3: uma despesa não pode deixar a conta com saldo negativo
function validarSaldoParaDespesa(conta, valor) {
  const saldo = saldoDaConta(conta.id);
  if (saldo - valor < 0) {
    throw new ErroHttp(
      422,
      `Saldo insuficiente: a conta tem ${reais(saldo)} e a despesa é de ${reais(valor)}.`
    );
  }
}

// Excluir uma receita reduz o saldo, então também não pode negativar a conta
function validarExclusao(lancamento) {
  if (lancamento.tipo === 'receita' && saldoDaConta(lancamento.contaId) - lancamento.valor < 0) {
    throw new ErroHttp(422, 'Não é possível excluir esta receita: a conta ficaria com saldo negativo.');
  }
}
module.exports = { saldoDaConta, validarSaldoParaDespesa, validarExclusao };