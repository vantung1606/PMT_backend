const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController/authController');
const { validateRegister, validateLogin } = require('../middleware/validation');

router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);

module.exports = router;
