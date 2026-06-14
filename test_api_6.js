require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
    try {
        const token = jwt.sign({ id: 1, role: 'pm' }, process.env.JWT_SECRET || 'PMT_SECRET_KEY', { expiresIn: '1d' });
        const res = await axios.get('http://localhost:3036/api/workspaces/my?search=sdc&sort=recent', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("SUCCESS:", res.data);
    } catch (e) {
        console.log("ERROR:", e.message);
    }
})();
