const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // X? lý l?i JWT h?t h?n ho?c không h?p l?
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token không h?p l?'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token dã h?t h?n'
        });
    }

    // X? lý l?i duplicate key t? database
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
            success: false,
            message: 'D? li?u dã t?n t?i'
        });
    }

    // X? lý l?i foreign key không h?p l?
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            message: 'Tham chi?u không h?p l?'
        });
    }

    // X? lý l?i validation t? middleware
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // X? lý l?i upload file t? Multer
    if (err.name === 'MulterError') {
        let message = 'L?i khi upload file';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Kích thu?c file vu?t quá gi?i h?n cho phép (5MB)';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'S? lu?ng file vu?t quá gi?i h?n';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'File không du?c ch?p nh?n';
        }
        return res.status(400).json({
            success: false,
            message: message
        });
    }

    // X? lý l?i khi file không dúng d?nh d?ng cho phép
    if (err.message && err.message.includes('Ch? ch?p nh?n file ?nh')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // X? lý l?i chung, tr? v? thông tin chi ti?t trong development
    const statusCode = err.statusCode || 500;
    const message = err.message || 'L?i server n?i b?';

    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
