const db = require('../../config/db');
const bcrypt = require('bcryptjs');

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.password = data.password;
        this.phone = data.phone;

        if (!data.role) {
            this.role = 'user';
        } else {
            const rawRole = String(data.role).toLowerCase();
            this.role = (rawRole === 'admin' || rawRole === 'ad') ? 'admin' : 'user';
        }
        this.id_card = data.id_card;
        this.address = data.address;
        this.date_of_birth = data.date_of_birth;
        this.gender = data.gender;
        this.marital_status = data.marital_status;
        this.ethnicity = data.ethnicity;
        this.occupation = data.occupation;
        this.avatar = data.avatar;
        this.created_at = data.created_at;
    }

    // ================= Tóm t?t các phuong th?c x? lý User =================
    // - create: T?o user m?i, ki?m tra trùng email, mã hóa m?t kh?u tru?c khi luu vào CSDL.
    // - findByEmail: Tìm user theo email.
    // - findById: Tìm user theo ID.
    // - validatePassword: Ki?m tra m?t kh?u h?p l?.
    // - toJSON: Tr? v? thông tin user (?n password).
    // - update: C?p nh?t thông tin user (ch? tru?ng h?p cho phép), t? d?ng c?p nh?t avatar, ki?m soát log debug ? môi tru?ng phát tri?n.
    // - delete: Xóa user kh?i h? th?ng.
    // - findAll: L?y danh sách t?t c? user, s?p x?p theo th?i gian t?o m?i nh?t tru?c.
    // ======================================================================

    static async create(userData) {
        try {
            const { username, email, password, phone, role = 'user' } = userData;
            
            // Ki?m tra email dã t?n t?i chua
            const existingUser = await this.findByEmail(email);
            if (existingUser) {
                throw new Error('Email dã du?c s? d?ng');
            }

            // Mã hóa password
            const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
            const hashedPassword = await bcrypt.hash(password, bcryptRounds);

            const query = `
                INSERT INTO users (username, email, password, phone, role) 
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const [result] = await db.execute(query, [username, email, hashedPassword, phone, role]);
            
            return new User({
                id: result.insertId,
                username,
                email,
                phone,
                role,
                created_at: new Date()
            });
        } catch (error) {
            throw error;
        }
    }

    // Tìm user theo email
    static async findByEmail(email) {
        try {
            const query = 'SELECT * FROM users WHERE email = ?';
            const [rows] = await db.execute(query, [email]);
            
            if (rows.length === 0) {
                return null;
            }
            
            return new User(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Tìm user theo ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM users WHERE id = ?';
            const [rows] = await db.execute(query, [id]);
            
            if (rows.length === 0) {
                return null;
            }
            
            return new User(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Ki?m tra password
    async validatePassword(password) {
        return await bcrypt.compare(password, this.password);
    }

    // L?y thông tin user (không bao g?m password)
    toJSON() {
        // X? lý date format
        let formattedDate = this.date_of_birth;
        if (this.date_of_birth) {
            // N?u date có format ISO (có T), l?y ph?n date
            if (this.date_of_birth.toString().includes('T')) {
                formattedDate = this.date_of_birth.toISOString().split('T')[0];
            } else {
                formattedDate = this.date_of_birth;
            }
        }

        return {
            id: this.id,
            username: this.username,
            email: this.email,
            phone: this.phone,
            role: this.role,
            id_card: this.id_card,
            address: this.address,
            date_of_birth: formattedDate,
            gender: this.gender,
            marital_status: this.marital_status,
            ethnicity: this.ethnicity,
            occupation: this.occupation,
            avatar: this.avatar,
            created_at: this.created_at
        };
    }

    // C?p nh?t thông tin user
    async update(updateData) {
        try {
            const allowedFields = [
                'username', 
                'email', 
                'password',
                'phone', 
                'role',
                'id_card',
                'address',
                'date_of_birth',
                'gender',
                'marital_status',
                'ethnicity',
                'occupation',
                'avatar'
            ];
            const fields = [];
            const values = [];

            for (const [key, value] of Object.entries(updateData)) {
                if (!allowedFields.includes(key)) {
                    continue; // B? qua các tru?ng không du?c phép
                }
                
                // X? lý d?c bi?t cho avatar
                if (key === 'avatar') {
                    // Avatar có th? là string (du?ng d?n file) ho?c null/empty string (d? xóa)
                    // Ch? c?p nh?t n?u value du?c cung c?p (không ph?i undefined)
                    if (value !== undefined) {
                        fields.push(`${key} = ?`);
                        // X? lý giá tr?: null, empty string, ho?c undefined -> null; ngu?c l?i -> string dã trim
                        const avatarValue = (value === '' || value === null) ? null : String(value).trim();
                        values.push(avatarValue);
                        if (process.env.NODE_ENV === 'development') {
                            console.log('Updating avatar in User model:', {
                                key: key,
                                originalValue: value,
                                processedValue: avatarValue,
                                type: typeof value,
                                willBeAdded: true
                            });
                        }
                    } else {
                        if (process.env.NODE_ENV === 'development') {
                            console.log('Avatar skipped - value is undefined');
                        }
                    }
                } 
                // V?i các tru?ng khác, b? qua giá tr? undefined, null ho?c r?ng
                else if (value !== undefined && value !== null && value !== '') {
                    fields.push(`${key} = ?`);
                    values.push(value);
                }
            }

            if (fields.length === 0) {
                throw new Error('Không có tru?ng nào d? c?p nh?t');
            }

            values.push(this.id);
            const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            
            if (process.env.NODE_ENV === 'development') {
                console.log('User update query:', query);
                console.log('User update values:', values);
                console.log('User update values count:', values.length);
            }
            
            const [result] = await db.execute(query, values);
            
            if (process.env.NODE_ENV === 'development') {
                console.log('User update result:', {
                    affectedRows: result.affectedRows,
                    changedRows: result.changedRows
                });
                console.log('User update successful');
            }
            
            // Ki?m tra xem có dòng nào du?c c?p nh?t không
            if (result.affectedRows === 0) {
                throw new Error('Không có dòng nào du?c c?p nh?t trong database');
            }
            
            // C?p nh?t object hi?n t?i v?i giá tr? dã du?c x? lý
            for (const [key, value] of Object.entries(updateData)) {
                if (allowedFields.includes(key)) {
                    if (key === 'avatar') {
                        this.avatar = value === '' ? null : value;
                    } else {
                        this[key] = value;
                    }
                }
            }
            
            if (process.env.NODE_ENV === 'development') {
                console.log('User object after update:', {
                    id: this.id,
                    avatar: this.avatar
                });
            }
            
            return this;
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('User update error:', error);
            }
            throw error;
        }
    }

    // Xóa user
    async delete() {
        try {
            const query = 'DELETE FROM users WHERE id = ?';
            await db.execute(query, [this.id]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // L?y t?t c? users
    static async findAll() {
        try {
            const query = 'SELECT * FROM users ORDER BY created_at DESC';
            const [rows] = await db.execute(query);
            
            return rows.map(row => new User(row));
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;
