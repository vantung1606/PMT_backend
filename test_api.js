require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
    try {
        const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'PMT_SECRET_KEY', { expiresIn: '1d' });
        const res = await axios.get('http://localhost:3036/api/workspaces/my?search=sdc&sort=recent', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
})();
