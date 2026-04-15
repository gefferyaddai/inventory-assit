const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const controller = require('../controllers/categoryController');

router.get('/',     auth,                       controller.getAll);
router.post('/',    auth, requireRole('Admin'), controller.create);
router.put('/:id',  auth, requireRole('Admin'), controller.update);
router.delete('/:id', auth, requireRole('Admin'), controller.remove);

module.exports = router;
