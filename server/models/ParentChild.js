const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const parentChildSchema = new Schema({
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    childId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ParentChild', parentChildSchema);
