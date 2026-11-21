const lancamentoModel = require('../models/lancamentos.model');
const categoriaModel = require('../models/categorias.model');
const contaService = require('./contas.service');
const { ErroHttp } = require('../utils/erros');

const PERCENTUAL_LAZER_MAXIMO = 10;
const PERCENTUAL_RESERVA_MINIMO = 20;

const reais = (centavos) => `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`;

// Soma, no mês (formato "AAAA-MM"), a renda do usuário e os gastos de lazer e fora da reserva.
// Se "ignorarId" for informado, esse lançamento fica de fora (usado na edição).
async function resumoDoMes(usuarioId, mes, ignorarId) {
  const [lancamentos, categorias] = await Promise.all([
    lancamentoModel.buscarTodas({ usuarioId }),
    categoriaModel.buscarTodas({ usuarioId }),
  ]);

  const tipoDaCategoria = new Map(categorias.map((c) => [c._id.toString(), c.tipo]));
  const doMes = lancamentos.filter(
    (l) => l.data.slice(0, 7) === mes && l._id.toString() !== ignorarId
  );

  const resumo = { renda: 0, gastoLazer: 0, gastoNaoReserva: 0 };

  for (const l of doMes) {
    if (l.tipo === 'receita') {
      resumo.renda += l.valor;
      continue;
    }
    const tipo = tipoDaCategoria.get(l.categoriaId);
    if (tipo === 'lazer') resumo.gastoLazer += l.valor;
    if (tipo !== 'reserva') resumo.gastoNaoReserva += l.valor;
  }

  return resumo;
}

// Regra 3: uma despesa não pode deixar a conta com saldo negativo
async function validarSaldoParaDespesa(conta, valor, ignorarId) {
  const saldo = await contaService.calcularSaldo(conta._id.toString(), ignorarId);

  if (saldo - valor < 0) {
    throw new ErroHttp(
      422,
      `Saldo insuficiente: a conta tem ${reais(saldo)} e a despesa é de ${reais(valor)}.`
    );
  }
}

// Excluir uma receita reduz o saldo, então também não pode negativar a conta
async function validarExclusao(lancamento) {
  if (lancamento.tipo !== 'receita') return;

  const saldo = await contaService.calcularSaldo(lancamento.contaId);

  if (saldo - lancamento.valor < 0) {
    throw new ErroHttp(422, 'Não é possível excluir esta receita: a conta ficaria com saldo negativo.');
  }
}

// Regra 1: gastos com lazer não podem passar de 10% da renda mensal
async function validarLimiteLazer(usuarioId, categoria, valor, data, ignorarId) {
  if (categoria.tipo !== 'lazer') return;

  const { renda, gastoLazer } = await resumoDoMes(usuarioId, data.slice(0, 7), ignorarId);
  const limite = Math.floor((renda * PERCENTUAL_LAZER_MAXIMO) / 100);

  if (gastoLazer + valor > limite) {
    throw new ErroHttp(
      422,
      `Limite de lazer excedido: o teto do mês é ${reais(limite)} (${PERCENTUAL_LAZER_MAXIMO}% da renda de ${reais(renda)}) e já foram gastos ${reais(gastoLazer)}.`
    );
  }
}

// Regra 2: no mínimo 20% da renda deve sobrar pra reserva.
// Na prática: gastos que não são de reserva não podem passar de 80% da renda do mês.
async function validarReservaMinima(usuarioId, categoria, valor, data, ignorarId) {
  if (categoria.tipo === 'reserva') return;

  const { renda, gastoNaoReserva } = await resumoDoMes(usuarioId, data.slice(0, 7), ignorarId);
  const limite = Math.floor((renda * (100 - PERCENTUAL_RESERVA_MINIMO)) / 100);

  if (gastoNaoReserva + valor > limite) {
    throw new ErroHttp(
      422,
      `Reserva mínima comprometida: ${PERCENTUAL_RESERVA_MINIMO}% da renda do mês (${reais(renda)}) deve ser guardada. O teto de gastos é ${reais(limite)} e já há ${reais(gastoNaoReserva)} gastos.`
    );
  }
}

// Edição: confere as regras como se o lançamento antigo nunca tivesse existido
// e o novo estivesse sendo registrado agora.
async function validarEdicao(antigo, novo, conta, categoria) {
  const ignorarId = antigo._id.toString();
  const contaId = conta._id.toString();

  if (novo.tipo === 'despesa') {
    await validarSaldoParaDespesa(conta, novo.valor, ignorarId);
    await validarLimiteLazer(conta.usuarioId, categoria, novo.valor, novo.data, ignorarId);
    await validarReservaMinima(conta.usuarioId, categoria, novo.valor, novo.data, ignorarId);
  }

  // Mudou de conta: a conta de origem perde o efeito do lançamento antigo e não pode ficar negativa.
  if (antigo.contaId !== contaId) {
    const saldoOrigem = await contaService.calcularSaldo(antigo.contaId, ignorarId);
    if (saldoOrigem < 0) {
      throw new ErroHttp(422, 'Não é possível alterar: a conta de origem ficaria com saldo negativo.');
    }
  }

  // Mesma conta e agora é receita: saldo final = saldo sem o antigo + a nova receita.
  if (novo.tipo === 'receita' && antigo.contaId === contaId) {
    const saldo = await contaService.calcularSaldo(contaId, ignorarId);
    if (saldo + novo.valor < 0) {
      throw new ErroHttp(422, 'Não é possível alterar esta receita: a conta ficaria com saldo negativo.');
    }
  }
}

module.exports = {
  validarSaldoParaDespesa,
  validarExclusao,
  validarLimiteLazer,
  validarReservaMinima,
  validarEdicao,
};