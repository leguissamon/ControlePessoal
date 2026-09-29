const { Router } = require('express');
const { db, proximoId } = require('../data/db');
const { ErroHttp } = require('../utils/erros');
const { saldoDaConta } = require('../services/regras');

const router = Router();

function buscarUsuario(id) {
  const usuario = db.usuarios.find((u) => u.id === id);
  if (!usuario) {
    throw new ErroHttp(404, 'Usuário não encontrado.');
  }
  return usuario;
}

// Criar conta
router.post('/', (req, res) => {
  const { usuarioId, nome } = req.body ?? {};

  if (!usuarioId || !nome) {
    throw new ErroHttp(400, 'Os campos "usuarioId" e "nome" são obrigatórios.');
  }

  buscarUsuario(Number(usuarioId)); // garante que o usuário existe

  const conta = { id: proximoId('contas'), usuarioId: Number(usuarioId), nome };
  db.contas.push(conta);

  res.status(201).json(conta);
});
// Listar contas (filtro opcional por usuário: ?usuarioId=1)
router.get('/', (req, res) => {
  let contas = db.contas;

  if (req.query.usuarioId) {
    const usuarioId = Number(req.query.usuarioId);
    contas = contas.filter((c) => c.usuarioId === usuarioId);
  }

  res.json(contas);
});

// Buscar conta por id
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const conta = db.contas.find((c) => c.id === id);

  if (!conta) {
    throw new ErroHttp(404, 'Conta não encontrada.');
  }

  res.json(conta);
});

// Atualizar conta (só o nome pode mudar)
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const conta = db.contas.find((c) => c.id === id);

  if (!conta) {
    throw new ErroHttp(404, 'Conta não encontrada.');
  }

  const { nome } = req.body ?? {};

  if (!nome) {
    throw new ErroHttp(400, 'O campo "nome" é obrigatório.');
  }

  conta.nome = nome;
  res.json(conta);
});

// Excluir conta (só se não tiver lançamentos)
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const conta = db.contas.find((c) => c.id === id);

  if (!conta) {
    throw new ErroHttp(404, 'Conta não encontrada.');
  }

  db.contas.splice(db.contas.indexOf(conta), 1);
  res.status(204).send();
});

// Saldo da conta
router.get('/:id/saldo', (req, res) => {
  const id = Number(req.params.id);
  const conta = db.contas.find((c) => c.id === id);

  if (!conta) {
    throw new ErroHttp(404, 'Conta não encontrada.');
  }

  res.json({ contaId: conta.id, nome: conta.nome, saldo: saldoDaConta(conta.id) });
});
// Extrato da conta (todos os lançamentos, por enquanto sem filtro)
router.get('/:id/extrato', (req, res) => {
  const id = Number(req.params.id);
  const conta = db.contas.find((c) => c.id === id);

  if (!conta) {
    throw new ErroHttp(404, 'Conta não encontrada.');
  }

  const { de, ate } = req.query;

  const lancamentos = db.lancamentos
    .filter((l) => l.contaId === conta.id)
    .filter((l) => (de ? l.data >= de : true))
    .filter((l) => (ate ? l.data <= ate : true))
    .sort((a, b) => a.data.localeCompare(b.data));

  const receitas = lancamentos.filter((l) => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0);   
  const despesas = lancamentos.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0);  

  res.json({
    contaId: conta.id,
    periodo: { de: de ?? null, ate: ate ?? null },
    totalReceitas: receitas,        
    totalDespesas: despesas,       
    resultadoDoPeriodo: receitas - despesas,  
    lancamentos,
  });
});

module.exports = router;