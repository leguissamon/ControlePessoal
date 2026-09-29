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
// Soma as receitas do usuário no mês (formato "AAAA-MM") em todas as contas dele
function rendaDoMes(usuarioId, mes) {
  return db.lancamentos
    .filter((l) => l.usuarioId === usuarioId && l.tipo === 'receita' && l.data.slice(0, 7) === mes)
    .reduce((soma, l) => soma + l.valor, 0);
}
// Soma as despesas em categorias do tipo "lazer" do usuário, no mês
function gastoLazerDoMes(usuarioId, mes) {
  return db.lancamentos
    .filter((l) => l.usuarioId === usuarioId && l.tipo === 'despesa' && l.data.slice(0, 7) === mes)
    .filter((l) => {
      const categoria = db.categorias.find((c) => c.id === l.categoriaId);
      return categoria.tipo === 'lazer';
    })
    .reduce((soma, l) => soma + l.valor, 0);
}
const PERCENTUAL_LAZER_MAXIMO = 10;

// Regra 1: gastos com lazer não podem passar de 10% da renda mensal
function validarLimiteLazer(conta, categoria, valor, data) {
  if (categoria.tipo !== 'lazer') return;

  const mes = data.slice(0, 7);
  const renda = rendaDoMes(conta.usuarioId, mes);
  const gastoAtual = gastoLazerDoMes(conta.usuarioId, mes);
  const limite = Math.floor((renda * PERCENTUAL_LAZER_MAXIMO) / 100);

  if (gastoAtual + valor > limite) {
    throw new ErroHttp(
      422,
      `Limite de lazer excedido: o teto do mês é ${reais(limite)} (${PERCENTUAL_LAZER_MAXIMO}% da renda de ${reais(renda)}) e já foram gastos ${reais(gastoAtual)}.`
    );
  }
}
module.exports = { saldoDaConta, validarSaldoParaDespesa, validarExclusao, validarLimiteLazer };