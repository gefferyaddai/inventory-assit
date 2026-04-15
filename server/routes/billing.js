const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const controller = require('../controllers/billingController');

router.get('/subscription',    auth, requireRole('Admin'), controller.getSubscription);
router.post('/create-checkout',auth, requireRole('Admin'), controller.createCheckout);
router.post('/portal',         auth, requireRole('Admin'), controller.portal);
router.post('/webhook', express.raw({ type: 'application/json' }), controller.webhook);

module.exports = router;
