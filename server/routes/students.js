const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const { Mark, StudyNote, StudyPlan, MoodEntry } = require('../models');

// Update study plan
router.patch('/study-plans/:id', auth, async (req, res) => {
    try {
        const plan = await StudyPlan.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: { completed: req.body.completed } },
            { new: true }
        );
        if (!plan) {
            return res.status(404).json({ error: 'Study plan not found' });
        }
        res.json(plan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete study plan
router.delete('/study-plans/:id', auth, async (req, res) => {
    try {
        const plan = await StudyPlan.findOneAndDelete({ 
            _id: req.params.id,
            userId: req.user.id
        });
        if (!plan) {
            return res.status(404).json({ error: 'Study plan not found' });
        }
        res.json({ message: 'Study plan deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student's marks
router.get('/marks', auth, async (req, res) => {
    try {
        const marks = await Mark.find({ studentId: req.user.id })
            .populate('subjectId')
            .sort('-createdAt');
        res.json(marks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student's study notes
router.get('/notes', auth, async (req, res) => {
    try {
        const notes = await StudyNote.find({ userId: req.user.id })
            .sort('-createdAt');
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create study note
router.post('/notes', auth, async (req, res) => {
    try {
        const note = new StudyNote({
            userId: req.user.id,
            content: req.body.content
        });
        await note.save();
        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student's study plans
router.get('/study-plans', auth, async (req, res) => {
    try {
        const plans = await StudyPlan.find({ userId: req.user.id })
            .sort('-createdAt');
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create study plan
router.post('/study-plans', auth, async (req, res) => {
    try {
        const plan = new StudyPlan({
            userId: req.user.id,
            subject: req.body.subject,
            topic: req.body.topic,
            description: req.body.description,
            dueDate: req.body.dueDate,
            estimatedHours: req.body.estimatedHours
        });
        await plan.save();
        res.status(201).json(plan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student's mood entries
router.get('/mood-entries', auth, async (req, res) => {
    try {
        const entries = await MoodEntry.find({ userId: req.user.id })
            .sort('-createdAt');
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create mood entry
router.post('/mood-entries', auth, async (req, res) => {
    try {
        const entry = new MoodEntry({
            userId: req.user.id,
            mood: req.body.mood,
            energy: req.body.energy,
            stress: req.body.stress,
            note: req.body.note ?? req.body.notes
        });
        await entry.save();
        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;