const { Router } = require('express');
const controller = require('../controllers/contas.controller');

const router = Router();

router.post('/', controller.criar);
router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.remover);
router.get('/:id/saldo', controller.saldo);
router.get('/:id/extrato', controller.extrato);

module.exports = router;