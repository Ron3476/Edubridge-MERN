const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moodEntrySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mood: {
        type: String,
        enum: ['happy', 'neutral', 'sad', 'stressed', 'okay'],
        required: true
    },
    energy: {
        type: Number,
        min: 0,
        max: 10
    },
    stress: {
        type: Number,
        min: 0,
        max: 10
    },
    note: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('MoodEntry', moodEntrySchema);
