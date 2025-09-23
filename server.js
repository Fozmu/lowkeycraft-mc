const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('src'));

// API endpoint for password verification
app.post('/api/verify-password', (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            message: 'Password is required'
        });
    }

    const isValid = password === process.env.STAFF_PASSWORD;

    if (isValid) {
        // Set secure cookie for 24 hours
        res.cookie('staffAuthenticated', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'strict'
        });
    }

    res.json({
        success: isValid,
        message: isValid ? 'Access granted' : 'Invalid password'
    });
});

// API endpoint to check authentication status
app.get('/api/check-auth', (req, res) => {
    const isAuthenticated = req.cookies.staffAuthenticated === 'true';

    res.json({
        authenticated: isAuthenticated
    });
});

// API endpoint to logout
app.post('/api/logout', (req, res) => {
    res.clearCookie('staffAuthenticated');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.get('*', (req, res) => {
    const filePath = path.join(__dirname, 'src', req.path);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('File not found');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});