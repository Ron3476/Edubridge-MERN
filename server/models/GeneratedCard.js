const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const generatedCardSchema = new Schema({
    noteId: {
        type: Schema.Types.ObjectId,
        ref: 'StudyNote',
        required: true,
        index: true
    },
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard']
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('GeneratedCard', generatedCardSchema);
