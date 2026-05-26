const User = require('../../models/userModel/User');

class AuthController {
  static async register(req, res, next) {
    try {
      const { username, email, password, role, phone } = req.body;
      const effectiveRole = role === 'admin' ? 'admin' : 'user';

      const user = await User.create({
        username,
        email,
        password,
        phone,
        role: effectiveRole
      });

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: { user: user.toJSON() }
      });
    } catch (error) {
      if (error.message === 'Email đã được sử dụng') {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }
}

module.exports = AuthController;
