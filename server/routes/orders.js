const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const controller = require('../controllers/orderController');

router.get('/',               auth, requireRole('Admin'), controller.getAll);
router.get('/:id',            auth, requireRole('Admin'), controller.getById);
router.post('/',              auth, requireRole('Admin'), controller.create);
router.patch('/:id/status',   auth, requireRole('Admin'), controller.updateStatus);
router.delete('/:id',         auth, requireRole('Admin'), controller.cancel);

module.exports = router;
