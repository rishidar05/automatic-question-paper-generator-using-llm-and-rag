const axios = require('axios');

async function testHelp() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:3000/api/login', {
            email: 'test@example.com', // Assuming this user exists from previous steps
            password: 'password123'
        });

        const token = loginRes.data.requireOtp ? 'NEED_OTP' : loginRes.data.token;
        console.log('Login response:', loginRes.data);

        // If OTP is needed, we can't easily script without reading the DB/Email.
        // But wait, the user said "Failed to solve", implying they are logged in and on the Solver page.
        // Let's create a temp user without OTP if needed, or check users.db

    } catch (err) {
        console.error('Login failed:', err.response?.data || err.message);
    }
}

testHelp();
