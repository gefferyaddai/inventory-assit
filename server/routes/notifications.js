const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/notificationController');

router.get('/', auth, controller.getAll);

module.exports = router;
