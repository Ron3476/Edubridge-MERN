const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moodRecommendationSchema = new Schema({
    moodEntryId: {
        type: Schema.Types.ObjectId,
        ref: 'MoodEntry',
        required: true,
        index: true
    },
    recommendation: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Wellbeing', 'Study Tips', 'Energy Boost', 'Stress Relief', 'Support', 'General'],
        default: 'General'
    },
    provider: {
        type: String,
        default: 'system'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('MoodRecommendation', moodRecommendationSchema);
