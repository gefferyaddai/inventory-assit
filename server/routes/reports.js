const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/reportController');

router.get('/inventory-value',     auth, controller.inventoryValue);
router.get('/low-stock',           auth, controller.lowStock);
router.get('/transaction-volume',  auth, controller.transactionVolume);
router.get('/supplier-performance',auth, controller.supplierPerformance);

module.exports = router;
