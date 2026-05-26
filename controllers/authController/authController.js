const User = require('../../models/userModel/User');
const { generateToken } = require('../../middleware/auth');

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

            // T?o JWT token d? user có th? dang nh?p ngay
            const token = generateToken(user.id);

            res.status(201).json({
                success: true,
                message: 'Ðang ký thành công',
                data: {
                    user: user.toJSON(),
                    token
                }
            });

        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Register error:', error);
            }
            
            if (error.message === 'Email dã du?c s? d?ng') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            next(error);
        }
    }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nh?p email và m?t kh?u'
                });
            }

            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ho?c m?t kh?u không dúng'
                });
            }

            const isValidPassword = await user.validatePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ho?c m?t kh?u không dúng'
                });
            }

            const token = generateToken(user.id);

            res.json({
                success: true,
                message: 'Ðang nh?p thành công',
                data: {
                    user: user.toJSON(),
                    token
                }
            });

        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Login error:', error);
            }
            next(error);
        }
    }

    static async getProfile(req, res, next) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Ngu?i dùng không t?n t?i'
                });
            }

            res.json({
                success: true,
                data: {
                    user: user.toJSON()
                }
            });

        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Get profile error:', error);
            }
            next(error);
        }
    }

    static async updateProfile(req, res, next) {
        try {
            const { 
                username, 
                email, 
                phone, 
                id_card, 
                address, 
                date_of_birth, 
                gender, 
                marital_status, 
                ethnicity, 
                occupation,
                avatar
            } = req.body;
            const userId = req.user.id;

            const currentUser = await User.findById(userId);
            if (!currentUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Ngu?i dùng không t?n t?i'
                });
            }

            if (email && email !== currentUser.email) {
                const existingUser = await User.findByEmail(email);
                if (existingUser && existingUser.id !== userId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email dã du?c s? d?ng b?i ngu?i dùng khác'
                    });
                }
            }

            const updateData = {};
            if (username !== undefined) updateData.username = username;
            if (email !== undefined) updateData.email = email;
            if (phone !== undefined) updateData.phone = phone;
            if (id_card !== undefined) updateData.id_card = id_card;
            if (address !== undefined) updateData.address = address;
            if (date_of_birth !== undefined && date_of_birth !== '') {
                updateData.date_of_birth = date_of_birth;
                if (process.env.NODE_ENV === 'development') {
                    console.log('Updating date_of_birth:', date_of_birth);
                }
            }
            if (gender !== undefined) updateData.gender = gender;
            if (marital_status !== undefined) updateData.marital_status = marital_status;
            if (ethnicity !== undefined) updateData.ethnicity = ethnicity;
            if (occupation !== undefined) updateData.occupation = occupation;
            if (Object.keys(updateData).length > 0) {
                await currentUser.update(updateData);
            }

            const updatedUser = await User.findById(userId);

            res.json({
                success: true,
                message: 'C?p nh?t profile thành công',
                data: {
                    user: updatedUser.toJSON()
                }
            });

        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Update profile error:', error);
            }

            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'Email dã du?c s? d?ng b?i ngu?i dùng khác'
                });
            }
            
            next(error);
        }
    }

    static async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nh?p m?t kh?u hi?n t?i và m?t kh?u m?i'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'M?t kh?u m?i ph?i có ít nh?t 6 ký t?'
                });
            }

            const user = await User.findById(req.user.id);

            const isValidPassword = await user.validatePassword(currentPassword);
            if (!isValidPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'M?t kh?u hi?n t?i không dúng'
                });
            }

            const bcrypt = require('bcryptjs');
            const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
            const hashedPassword = await bcrypt.hash(newPassword, bcryptRounds);
            
            await user.update({ password: hashedPassword });

            res.json({
                success: true,
                message: 'Ð?i m?t kh?u thành công'
            });

        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Change password error:', error);
            }
            next(error);
        }
    }

    static async uploadAvatar(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Không có file du?c upload'
                });
            }

            const userId = req.user.id;
            const user = await User.findById(userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Ngu?i dùng không t?n t?i'
                });
            }

            if (user.avatar) {
                const fs = require('fs');
                const path = require('path');
                const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', user.avatar);
                if (fs.existsSync(oldAvatarPath)) {
                    fs.unlinkSync(oldAvatarPath);
                    if (process.env.NODE_ENV === 'development') {
                        console.log('Ðã xóa avatar cu:', user.avatar);
                    }
                }
            }

            const avatarPath = req.file.filename;

            if (!avatarPath || avatarPath.trim() === '') {
                const fs = require('fs');
                const path = require('path');
                const filePath = path.join(__dirname, '../../uploads/avatars', req.file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                return res.status(400).json({
                    success: false,
                    message: 'Tên file không h?p l?'
                });
            }
            
            if (process.env.NODE_ENV === 'development') {
                console.log('Ðang luu avatar:', {
                    userId: userId,
                    avatarPath: avatarPath,
                    fileSize: req.file.size,
                    mimetype: req.file.mimetype,
                    fileObject: req.file
                });
            }

            if (process.env.NODE_ENV === 'development') {
                console.log('Tru?c khi update - user.avatar:', user.avatar);
                console.log('avatarPath s? du?c luu:', avatarPath);
                console.log('avatarPath type:', typeof avatarPath);
            }

            const avatarValue = String(avatarPath).trim();
            if (!avatarValue) {
                throw new Error('Ðu?ng d?n avatar không h?p l?');
            }
            
            await user.update({ avatar: avatarValue });

            if (process.env.NODE_ENV === 'development') {
                console.log('Sau khi update - user.avatar:', user.avatar);
            }

            const updatedUser = await User.findById(userId);
            
            if (!updatedUser) {
                throw new Error('Không th? l?y thông tin user sau khi c?p nh?t');
            }

            if (process.env.NODE_ENV === 'development') {
                console.log('Sau khi query l?i t? database:', {
                    userId: userId,
                    avatarInDB: updatedUser.avatar,
                    expectedAvatar: avatarPath,
                    match: updatedUser.avatar === avatarPath
                });

                const db = require('../../config/db');
                const [rows] = await db.execute('SELECT avatar FROM users WHERE id = ?', [userId]);
                console.log('Query tr?c ti?p t? database:', rows[0]);
            }

            if (updatedUser.avatar !== avatarPath) {
                console.error('L?i: Avatar không kh?p!', {
                    expected: avatarPath,
                    actual: updatedUser.avatar
                });
                throw new Error(`Avatar không du?c luu dúng vào database. Expected: ${avatarPath}, Actual: ${updatedUser.avatar}`);
            }

            res.json({
                success: true,
                message: 'Upload avatar thành công và dã luu vào database',
                data: {
                    user: updatedUser.toJSON(),
                    avatarUrl: `/uploads/avatars/${avatarPath}`
                }
            });

        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Upload avatar error:', error);
                console.error('Error stack:', error.stack);
            }

            if (req.file) {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const filePath = path.join(__dirname, '../../uploads/avatars', req.file.filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        if (process.env.NODE_ENV === 'development') {
                            console.log('Ðã xóa file do l?i:', req.file.filename);
                        }
                    }
                } catch (deleteError) {
                    console.error('L?i khi xóa file:', deleteError);
                }
            }

            const statusCode = error.statusCode || 500;
            const message = error.message || 'L?i khi upload avatar';
            
            return res.status(statusCode).json({
                success: false,
                message: message,
                ...(process.env.NODE_ENV === 'development' && { 
                    error: error.message,
                    stack: error.stack 
                })
            });
        }
    }
}

module.exports = AuthController;
