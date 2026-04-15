const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const controller = require('../controllers/transactionController');

router.get('/',     auth, requireRole('Admin'),      controller.getAll);
router.get('/mine', auth, requireRole('StockClerk'), controller.getMine);
router.post('/',    auth, requireRole('StockClerk'), controller.create);

module.exports = router;
