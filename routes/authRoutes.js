const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController/authController');
const { validateRegister } = require('../middleware/validation');

router.post('/register', validateRegister, AuthController.register);

module.exports = router;
