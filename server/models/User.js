const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    admissionNumber: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
        validate: {
            validator: function(v) {
                // Only require admission number if role is student
                if (this.role === 'student') {
                    return v && v.length > 0;
                }
                return true;
            },
            message: 'Admission number is required for students'
        }
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'parent', 'admin'],
        default: 'student',
        required: true,
        index: true
    },
    level: {
        type: String,
        enum: ['Junior Secondary School', 'Senior Secondary School'],
        validate: {
            validator: function(v) {
                // Only require level if role is student
                if (this.role === 'student') {
                    return v && (v === 'Junior Secondary School' || v === 'Senior Secondary School');
                }
                return true;
            },
            message: 'Level must be either "Junior Secondary School" or "Senior Secondary School" for students'
        }
    },
    term: {
        type: String,
        validate: {
            validator: function(v) {
                // Only require term if role is student
                if (this.role === 'student') {
                    return v && v.length > 0;
                }
                return true;
            },
            message: 'Term is required for students'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('User', userSchema);
