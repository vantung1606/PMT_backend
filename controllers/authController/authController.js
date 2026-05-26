const User = require('../../models/userModel/User');
const { generateToken } = require('../../middleware/auth');

class AuthController {
  static async register(req, res, next) {
    try {
      const { username, email, password, role, phone } = req.body;
      const effectiveRole = role === 'admin' ? 'admin' : 'user';
      const user = await User.create({ username, email, password, phone, role: effectiveRole });
      res.status(201).json({ success: true, message: 'Đăng ký thành công', data: { user: user.toJSON() } });
    } catch (error) {
      if (error.message === 'Email đã được sử dụng') {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await User.findByEmail(email);
      if (!user) return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });

      const token = generateToken(user.id);
      res.json({ success: true, message: 'Đăng nhập thành công', data: { user: user.toJSON(), token } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
