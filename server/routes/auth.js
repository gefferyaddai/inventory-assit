const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/authController');

router.post('/login', controller.login);
router.get('/me', auth, controller.me);
router.post('/logout', controller.logout);

module.exports = router;
