const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const controller = require('../controllers/reorderController');

router.get('/',               auth,                       controller.getAll);
router.patch('/:id/dismiss',  auth, requireRole('Admin'), controller.dismiss);
router.patch('/:id/convert',  auth, requireRole('Admin'), controller.convert);

module.exports = router;
