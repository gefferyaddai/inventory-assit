const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const controller = require('../controllers/warehouseController');

router.get('/',          auth,                       controller.getAll);
router.get('/:id',       auth,                       controller.getById);
router.post('/',         auth, requireRole('Admin'), controller.create);
router.put('/:id',       auth, requireRole('Admin'), controller.update);
router.delete('/:id',    auth, requireRole('Admin'), controller.remove);
router.get('/:id/stock', auth,                       controller.getStock);

module.exports = router;
