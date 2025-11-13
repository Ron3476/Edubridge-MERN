const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const markSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    subjectId: {
        type: Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
        index: true
    },
    marks: {
        type: Number,
        required: true
    },
    level: {
        type: String
    },
    term: {
        type: String,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Compound index for student, subject, and term
markSchema.index({ studentId: 1, subjectId: 1, term: 1 });

module.exports = mongoose.model('Mark', markSchema);
