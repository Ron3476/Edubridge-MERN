const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const flashCardSchema = new Schema({
    studyPlanId: {
        type: Schema.Types.ObjectId,
        ref: 'StudyPlan',
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

module.exports = mongoose.model('FlashCard', flashCardSchema);
