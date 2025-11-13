const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const { ParentChild, User, Mark } = require('../models');

// Get children and their marks for the logged in parent
router.get('/children', auth, checkRole(['parent']), async (req, res) => {
    try {
        // Find parent-child relationships
        const relations = await ParentChild.find({ parentId: req.user.id }).populate('childId');
        const children = [];

        for (const rel of relations) {
            const child = rel.childId.toObject();
            // Fetch marks for the child
            const marks = await Mark.find({ studentId: child._id }).populate('subjectId').sort('-createdAt');
            child.marks = marks;
            children.push(child);
        }

        res.json(children);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;