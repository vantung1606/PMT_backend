const multer = require('multer');
const path = require('path');
const fs = require('fs');

// T?o thu m?c n?u chua t?n t?i d? luu file upload
const uploadsDir = path.join(__dirname, '../uploads');
const avatarsDir = path.join(__dirname, '../uploads/avatars');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// C?u hình noi luu và tên file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    // Format tên file: userId_timestamp.extension d? tránh trùng l?p
    const userId = req.user?.id || req.user?.userId || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${userId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// Ch? cho phép upload file ?nh v?i các d?nh d?ng ph? bi?n
const fileFilter = (req, file, cb) => {
  // Ki?m tra có file không
  if (!file) {
    return cb(new Error('Không có file du?c upload'));
  }

  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Ch? ch?p nh?n file ?nh (jpeg, jpg, png, gif, webp)'));
  }
};

// C?u hình Multer v?i gi?i h?n kích thu?c và b? l?c file
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload;

