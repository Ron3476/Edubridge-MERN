const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, admissionNumber, level } = req.body;

        // Check JWT_SECRET
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not set in environment variables');
            return res.status(500).json({ error: 'Server configuration error. Please contact administrator.' });
        }

        // Add validation for required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Please enter all required fields.' });
        }

        // Block admin registration through public route
        // Admins can only be created by existing admins
        if (role === 'admin') {
            return res.status(403).json({ error: 'Admin accounts can only be created by existing administrators. Please contact an administrator.' });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Validate admission number for students
        if (role === 'student' && !admissionNumber) {
            return res.status(400).json({ error: 'Admission number is required for students' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user object - only include student-specific fields if role is student
        const userData = {
            name,
            email,
            password: hashedPassword,
            role
        };

        if (role === 'student') {
            userData.admissionNumber = admissionNumber;
            if (level) {
                userData.level = level;
            }
        }

        // Create user
        user = new User(userData);

        await user.save();
        console.log('User registered successfully:', user.email);

        // Create token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ token, user: { 
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            level: user.level
        }});
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check JWT_SECRET
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not set in environment variables');
            return res.status(500).json({ error: 'Server configuration error. Please contact administrator.' });
        }

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('User logged in successfully:', user.email);
        res.json({ token, user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            level: user.level
        }});
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;