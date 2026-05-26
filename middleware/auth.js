const jwt = require('jsonwebtoken');
const User = require('../models/userModel/User');

// Cache t?m th?i d? tránh truy v?n database nhi?u l?n cho cùng user
const userCache = new Map();
const CACHE_TTL = parseInt(process.env.AUTH_CACHE_TTL || '300000', 10);
const CACHE_MAX_SIZE = parseInt(process.env.AUTH_CACHE_MAX_SIZE || '100', 10); 

// Xác th?c JWT token t? header Authorization
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token truy c?p không du?c cung c?p'
            });
        }

        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            console.error('JWT_SECRET is not set in environment variables');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        const cacheKey = `user_${decoded.userId}`;
        const cached = userCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            req.user = cached.user;
            return next();
        }
        
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Ngu?i dùng không t?n t?i'
            });
        }

        userCache.set(cacheKey, {
            user,
            timestamp: Date.now()
        });
        
        if (userCache.size > CACHE_MAX_SIZE) {
            const now = Date.now();
            for (const [key, value] of userCache.entries()) {
                if (now - value.timestamp > CACHE_TTL) {
                    userCache.delete(key);
                }
            }
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token dã h?t h?n'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không h?p l?'
            });
        }
        return res.status(403).json({
            success: false,
            message: 'Token không h?p l? ho?c dã h?t h?n'
        });
    }
};

const getCurrentRole = (req) => {
    if (req.workspaceRole) {
        return req.workspaceRole;
    }
    return req.user?.role || null;
};

// Ki?m tra quy?n admin c?p toàn h? th?ng
const requireAdmin = (req, res, next) => {
    if (req.workspaceRole) {
        return res.status(403).json({
            success: false,
            message: 'Tính nang này ch? dành cho Admin ? global scope'
        });
    }
    const userRole = String(req.user.role).toLowerCase();
    if (userRole !== 'ad' && userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Ch? admin m?i có quy?n truy c?p'
        });
    }
    next();
};

const requirePMOrAdmin = (req, res, next) => {
    const currentRole = getCurrentRole(req);
    if (req.workspaceRole) {
        if (currentRole !== 'pm') {
            return res.status(403).json({
                success: false,
                message: 'Ch? Project Manager trong workspace m?i có quy?n truy c?p'
            });
        }
    } else {
        if (!['ad', 'pm'].includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: 'Ch? Project Manager ho?c Admin m?i có quy?n truy c?p'
            });
        }
    }
    next();
};

// Ki?m tra quy?n Team Leader tr? lên (TL, PM, Admin)
const requireLeaderOrAbove = (req, res, next) => {
    const currentRole = getCurrentRole(req);
    if (req.workspaceRole) {
        if (!['pm', 'tl'].includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: 'B?n không có quy?n truy c?p tính nang này'
            });
        }
    } else {
        if (!['ad', 'pm', 'tl'].includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: 'B?n không có quy?n truy c?p tính nang này'
            });
        }
    }
    next();
};

// Ki?m tra quy?n xem, áp d?ng cho t?t c? role có trong h? th?ng
const requireViewPermission = (req, res, next) => {
    const currentRole = getCurrentRole(req);
    if (req.workspaceRole) {
        if (!['pm', 'tl', 'mb', 'clt'].includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: 'B?n không có quy?n xem tính nang này'
            });
        }
    } else {
        if (!['ad', 'pm', 'tl', 'mb'].includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: 'B?n không có quy?n xem tính nang này'
            });
        }
    }
    next();
};

const requireEditPermission = (req, res, next) => {
    const currentRole = getCurrentRole(req);
    if (req.workspaceRole) {
        if (!['pm', 'tl'].includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: 'B?n không có quy?n ch?nh s?a tính nang này'
            });
        }
    } else {
        if (!['ad', 'pm', 'tl'].includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: 'B?n không có quy?n ch?nh s?a tính nang này'
            });
        }
    }
    next();
};

// Ki?m tra quy?n qu?n lý thành viên trong project/workspace
const requireMemberManagement = (req, res, next) => {
    const currentRole = getCurrentRole(req);
    if (req.workspaceRole) {
        if (!['pm', 'tl'].includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: 'Ch? Project Manager ho?c Team Leader trong workspace m?i có quy?n qu?n lý thành viên'
            });
        }
    } else {
        if (!['ad', 'pm', 'tl'].includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: 'B?n không có quy?n qu?n lý thành viên'
            });
        }
    }
    next();
};

// Ki?m tra quy?n xem danh sách thành viên
const requireViewMembers = (req, res, next) => {
    const currentRole = getCurrentRole(req);
    if (req.workspaceRole) {
        if (!['pm', 'tl', 'mb', 'clt'].includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: 'B?n không có quy?n xem danh sách thành viên'
            });
        }
    } else {
        if (!['ad', 'pm', 'tl', 'mb'].includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: 'B?n không có quy?n xem danh sách thành viên'
            });
        }
    }
    next();
};

// Ki?m tra quy?n tìm ki?m thành viên (t?t c? role d?u có quy?n)
const requireSearchMembers = (req, res, next) => {
    const currentRole = getCurrentRole(req);
    if (req.workspaceRole) {
        if (!['pm', 'tl', 'mb', 'clt'].includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: 'B?n không có quy?n tìm ki?m thành viên'
            });
        }
    } else {
        if (!['ad', 'pm', 'tl', 'mb'].includes(currentRole)) {
            return res.status(403).json({
                success: false,
                message: 'B?n không có quy?n tìm ki?m thành viên'
            });
        }
    }
    next();
};

// T?o JWT token ch?a userId v?i th?i gian h?t h?n
const generateToken = (userId) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requirePMOrAdmin,
    requireLeaderOrAbove,
    requireViewPermission,
    requireEditPermission,
    requireMemberManagement,
    requireViewMembers,
    requireSearchMembers,
    generateToken,
    getCurrentRole
};
