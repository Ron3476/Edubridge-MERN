const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edubridge';
mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('Database:', MONGODB_URI);
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Please ensure MongoDB is running and the connection string is correct.');
    process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers')); // Corrected path
app.use('/api/admin', require('./routes/admin'));
app.use('/api/parents', require('./routes/parents'));

// Check for required environment variables
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET is not set. Authentication will fail!');
    console.warn('Please set JWT_SECRET in your .env file.');
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});
