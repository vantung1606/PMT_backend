const { body, validationResult } = require('express-validator');

const collectErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map((error) => ({ field: error.path, message: error.msg }))
    });
  }
  next();
};

const validateRegister = [
  body('username').trim().notEmpty().withMessage('Tên người dùng là bắt buộc'),
  body('email').trim().notEmpty().withMessage('Email là bắt buộc').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc').isLength({ min: 6, max: 100 }).withMessage('Mật khẩu phải có từ 6-100 ký tự'),
  collectErrors
];

const validateLogin = [
  body('email').trim().notEmpty().withMessage('Email là bắt buộc').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
  collectErrors
];

module.exports = { validateRegister, validateLogin };
