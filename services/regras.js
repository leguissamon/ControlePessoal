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
// Soma as despesas do usuário no mês, exceto as de categorias do tipo "reserva"
function gastoNaoReservaDoMes(usuarioId, mes) {
  return db.lancamentos
    .filter((l) => l.usuarioId === usuarioId && l.tipo === 'despesa' && l.data.slice(0, 7) === mes)
    .filter((l) => {
      const categoria = db.categorias.find((c) => c.id === l.categoriaId);
      return categoria.tipo !== 'reserva';
    })
    .reduce((soma, l) => soma + l.valor, 0);
}
const PERCENTUAL_RESERVA_MINIMO = 20;

// Regra 2: no mínimo 20% da renda deve sobrar pra reserva.
// Na prática: gastos que não são de reserva não podem passar de 80% da renda do mês.
function validarReservaMinima(conta, categoria, valor, data) {
  if (categoria.tipo === 'reserva') return;

  const mes = data.slice(0, 7);
  const renda = rendaDoMes(conta.usuarioId, mes);
  const gastoAtual = gastoNaoReservaDoMes(conta.usuarioId, mes);
  const percentualMaximo = 100 - PERCENTUAL_RESERVA_MINIMO;
  const limite = Math.floor((renda * percentualMaximo) / 100);

  if (gastoAtual + valor > limite) {
    throw new ErroHttp(
      422,
      `Reserva mínima comprometida: ${PERCENTUAL_RESERVA_MINIMO}% da renda do mês (${reais(renda)}) deve ser guardada. O teto de gastos é ${reais(limite)} e já há ${reais(gastoAtual)} gastos.`
    );
  }
}
// Edição: valida como se o lançamento antigo nunca tivesse existido
// e o novo estivesse sendo registrado agora.
function validarEdicao(antigo, novo, conta, categoria) {
  const posicao = db.lancamentos.indexOf(antigo);
  db.lancamentos.splice(posicao, 1); // tira o antigo só durante a conferência

  try {
    if (novo.tipo === 'despesa') {
      validarSaldoParaDespesa(conta, novo.valor);
      validarLimiteLazer(conta, categoria, novo.valor, novo.data);
      validarReservaMinima(conta, categoria, novo.valor, novo.data);
    }

    // Sem o antigo, a conta de origem perde o efeito dele (era uma receita, por exemplo).
    if (antigo.contaId !== novo.contaId && saldoDaConta(antigo.contaId) < 0) {
      throw new ErroHttp(422, 'Não é possível alterar: a conta de origem ficaria com saldo negativo.');
    }

    // Mesma conta e agora é receita: saldo final = saldo sem o antigo + a nova receita.
    if (novo.tipo === 'receita' && antigo.contaId === novo.contaId && saldoDaConta(novo.contaId) + novo.valor < 0) {
      throw new ErroHttp(422, 'Não é possível alterar esta receita: a conta ficaria com saldo negativo.');
    }
  } finally {
    db.lancamentos.splice(posicao, 0, antigo); // devolve o antigo, aconteça o que acontecer
  }
}
module.exports = { saldoDaConta, validarSaldoParaDespesa, validarExclusao, validarLimiteLazer, validarReservaMinima, validarEdicao };