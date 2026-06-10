const { body, validationResult } = require('express-validator');

// Ki?m tra d? li?u d?u vào khi dang ký tài kho?n
const validateRegister = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Tên ngu?i dùng là b?t bu?c')
    .matches(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF\s]+$/)
    .withMessage('Tên ngu?i dùng ch? du?c ch?a ch? cái, s?, d?u g?ch du?i và kho?ng tr?ng'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email là b?t bu?c')
    .isEmail()
    .withMessage('Email không h?p l?')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('M?t kh?u là b?t bu?c')
    .isLength({ min: 6, max: 100 })
    .withMessage('M?t kh?u ph?i có t? 6-100 ký t?')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('M?t kh?u ph?i ch?a ít nh?t 1 ch? thu?ng, 1 ch? hoa và 1 s?'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('S? di?n tho?i ph?i có 10-11 ch? s?'),

  body('role')
    .optional()
    .isIn(['mb', 'pm', 'admin'])
    .withMessage('Vai trò không h?p l?'),

  // X? lý k?t qu? validation và tr? v? l?i n?u có
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'D? li?u không h?p l?',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

// Ki?m tra d? li?u d?u vào khi dang nh?p
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email là b?t bu?c')
    .isEmail()
    .withMessage('Email không h?p l?')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('M?t kh?u là b?t bu?c'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'D? li?u không h?p l?',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

// Ki?m tra d? li?u khi c?p nh?t thông tin cá nhân
const validateUpdateProfile = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Tên ngu?i dùng ph?i có t? 3-50 ký t?')
    .matches(/^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF\s]+$/)
    .withMessage('Tên ngu?i dùng ch? du?c ch?a ch? cái, s?, d?u g?ch du?i và kho?ng tr?ng'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email không h?p l?')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('S? di?n tho?i ph?i có 10-11 ch? s?'),

  body('id_card')
    .optional()
    .trim()
    .matches(/^[0-9]{9,12}$/)
    .withMessage('Can cu?c công dân ph?i có 9-12 ch? s?'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Ð?a ch? không du?c quá 500 ký t?'),

  body('date_of_birth')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Ngày sinh ph?i có d?nh d?ng YYYY-MM-DD'),

  body('gender')
    .optional()
    .isIn(['Nam', 'N?', 'Không mu?n ti?t l?'])
    .withMessage('Gi?i tính không h?p l?'),

  body('marital_status')
    .optional()
    .isIn(['Ð?c thân', 'Ðã k?t hôn', 'Ðã ly hôn', 'Góa ch?ng', 'Góa v?'])
    .withMessage('Tình tr?ng hôn nhân không h?p l?'),

  body('ethnicity')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Dân t?c không du?c quá 50 ký t?'),

  body('occupation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Ngh? nghi?p không du?c quá 100 ký t?'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'D? li?u không h?p l?',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

// Ki?m tra d? li?u khi d?i m?t kh?u
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('M?t kh?u hi?n t?i là b?t bu?c'),

  body('newPassword')
    .notEmpty()
    .withMessage('M?t kh?u m?i là b?t bu?c')
    .isLength({ min: 6, max: 100 })
    .withMessage('M?t kh?u m?i ph?i có t? 6-100 ký t?')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('M?t kh?u m?i ph?i ch?a ít nh?t 1 ch? thu?ng, 1 ch? hoa và 1 s?'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'D? li?u không h?p l?',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword
};
