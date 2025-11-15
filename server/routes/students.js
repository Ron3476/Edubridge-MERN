const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const { Mark, StudyNote, StudyPlan, MoodEntry, FlashCard, MoodRecommendation, Attendance } = require('../models');

// Function to generate recommendations based on mood, energy, and stress
const generateMoodRecommendations = (mood, energy, stress) => {
    const recommendations = [];
    
    // Mood-based recommendations
    if (mood === 'sad') {
        recommendations.push({
            text: "Consider taking a short break and doing something you enjoy. A walk outside or listening to music can help lift your spirits.",
            category: "Wellbeing"
        });
        recommendations.push({
            text: "Try breaking down your study tasks into smaller, manageable chunks. This can make them feel less overwhelming.",
            category: "Study Tips"
        });
        if (energy < 5) {
            recommendations.push({
                text: "Low energy detected. Consider a healthy snack, some light exercise, or a short power nap to recharge.",
                category: "Energy Boost"
            });
        }
    } else if (mood === 'stressed') {
        recommendations.push({
            text: "High stress detected. Try deep breathing exercises or a 5-minute meditation break to help calm your mind.",
            category: "Stress Relief"
        });
        recommendations.push({
            text: "Prioritize your tasks and focus on one thing at a time. Remember, it's okay to take breaks.",
            category: "Study Tips"
        });
        if (stress >= 8) {
            recommendations.push({
                text: "Your stress level is quite high. Consider talking to a teacher, counselor, or trusted adult about what's causing you stress.",
                category: "Support"
            });
        }
    } else if (mood === 'happy') {
        recommendations.push({
            text: "Great to see you're feeling positive! This is a good time to tackle challenging subjects or review difficult concepts.",
            category: "Study Tips"
        });
        if (energy >= 7) {
            recommendations.push({
                text: "You have high energy! Consider using this time for active learning like flashcards, practice problems, or group study.",
                category: "Study Tips"
            });
        }
    } else if (mood === 'neutral') {
        recommendations.push({
            text: "A neutral mood is perfect for steady, focused study sessions. Try the Pomodoro technique: 25 minutes study, 5 minutes break.",
            category: "Study Tips"
        });
    }
    
    // Energy-based recommendations
    if (energy !== undefined) {
        if (energy < 4) {
            recommendations.push({
                text: "Low energy detected. Consider a healthy snack, staying hydrated, or a 10-minute walk to boost your energy levels.",
                category: "Energy Boost"
            });
        } else if (energy >= 8) {
            recommendations.push({
                text: "High energy! This is perfect for tackling challenging subjects or completing longer study sessions.",
                category: "Study Tips"
            });
        }
    }
    
    // Stress-based recommendations
    if (stress !== undefined) {
        if (stress >= 7) {
            recommendations.push({
                text: "High stress level. Try the 4-7-8 breathing technique: inhale for 4, hold for 7, exhale for 8. Repeat 4 times.",
                category: "Stress Relief"
            });
            recommendations.push({
                text: "When stressed, focus on what you can control. Break tasks into smaller steps and celebrate small wins.",
                category: "Study Tips"
            });
        } else if (stress <= 3) {
            recommendations.push({
                text: "Low stress level - great! This is an ideal time for focused, deep study sessions.",
                category: "Study Tips"
            });
        }
    }
    
    // General study recommendations
    recommendations.push({
        text: "Remember to take regular breaks. Studies show that taking breaks improves focus and retention.",
        category: "Study Tips"
    });
    
    return recommendations;
};

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
        
        // Generate and save recommendations
        const recommendations = generateMoodRecommendations(
            entry.mood, 
            entry.energy, 
            entry.stress
        );
        
        const recommendationDocs = recommendations.map(rec => ({
            moodEntryId: entry._id,
            recommendation: rec.text,
            category: rec.category,
            provider: 'system'
        }));
        
        if (recommendationDocs.length > 0) {
            await MoodRecommendation.insertMany(recommendationDocs);
        }
        
        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get recommendations for a mood entry
router.get('/mood-entries/:id/recommendations', auth, async (req, res) => {
    try {
        const entry = await MoodEntry.findOne({ 
            _id: req.params.id, 
            userId: req.user.id 
        });
        
        if (!entry) {
            return res.status(404).json({ error: 'Mood entry not found' });
        }
        
        const recommendations = await MoodRecommendation.find({ 
            moodEntryId: req.params.id 
        }).sort('-createdAt');
        
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete mood entry
router.delete('/mood-entries/:id', auth, async (req, res) => {
    try {
        const entry = await MoodEntry.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user.id 
        });
        
        if (!entry) {
            return res.status(404).json({ error: 'Mood entry not found' });
        }
        
        // Also delete associated recommendations
        await MoodRecommendation.deleteMany({ moodEntryId: req.params.id });
        
        res.json({ message: 'Mood entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all recommendations for the student
router.get('/mood-recommendations', auth, async (req, res) => {
    try {
        // Get all mood entries for the user
        const entries = await MoodEntry.find({ userId: req.user.id });
        const entryIds = entries.map(e => e._id);
        
        const recommendations = await MoodRecommendation.find({ 
            moodEntryId: { $in: entryIds } 
        })
        .populate({
            path: 'moodEntryId',
            select: 'mood energy stress createdAt',
            strictPopulate: false
        })
        .sort('-createdAt')
        .limit(20); // Get most recent 20 recommendations
        
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get flashcards for a study plan
router.get('/flashcards/:studyPlanId', auth, async (req, res) => {
    try {
        // Verify the study plan belongs to the user
        const plan = await StudyPlan.findOne({ 
            _id: req.params.studyPlanId, 
            userId: req.user.id 
        });
        if (!plan) {
            return res.status(404).json({ error: 'Study plan not found' });
        }
        
        const flashcards = await FlashCard.find({ studyPlanId: req.params.studyPlanId })
            .sort('-createdAt');
        res.json(flashcards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all flashcards for the student (across all study plans)
router.get('/flashcards', auth, async (req, res) => {
    try {
        // Get all study plans for the user
        const plans = await StudyPlan.find({ userId: req.user.id });
        const planIds = plans.map(p => p._id);
        
        const flashcards = await FlashCard.find({ studyPlanId: { $in: planIds } })
            .populate('studyPlanId', 'subject topic')
            .sort('-createdAt');
        res.json(flashcards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create flashcard
router.post('/flashcards', auth, async (req, res) => {
    try {
        const { studyPlanId, question, answer, difficulty } = req.body;
        
        if (!studyPlanId || !question || !answer) {
            return res.status(400).json({ error: 'Study plan ID, question, and answer are required' });
        }
        
        // Verify the study plan belongs to the user
        const plan = await StudyPlan.findOne({ 
            _id: studyPlanId, 
            userId: req.user.id 
        });
        if (!plan) {
            return res.status(404).json({ error: 'Study plan not found' });
        }
        
        const flashcard = new FlashCard({
            studyPlanId,
            question,
            answer,
            difficulty: difficulty || 'medium'
        });
        await flashcard.save();
        res.status(201).json(flashcard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete flashcard
router.delete('/flashcards/:id', auth, async (req, res) => {
    try {
        const flashcard = await FlashCard.findById(req.params.id);
        if (!flashcard) {
            return res.status(404).json({ error: 'Flashcard not found' });
        }
        
        // Verify the study plan belongs to the user
        const plan = await StudyPlan.findOne({ 
            _id: flashcard.studyPlanId, 
            userId: req.user.id 
        });
        if (!plan) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        await FlashCard.findByIdAndDelete(req.params.id);
        res.json({ message: 'Flashcard deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student's attendance
router.get('/attendance', auth, async (req, res) => {
    try {
        const { subjectId, term, level, startDate, endDate } = req.query;
        
        let query = { studentId: req.user.id };
        if (subjectId) query.subjectId = subjectId;
        if (term) query.term = term;
        if (level) query.level = level;
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const attendance = await Attendance.find(query)
            .populate('subjectId', 'name')
            .populate('markedBy', 'name')
            .sort('-date');

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student's attendance statistics
router.get('/attendance/stats', auth, async (req, res) => {
    try {
        const { term, level, startDate, endDate } = req.query;
        
        let query = { studentId: req.user.id };
        if (term) query.term = term;
        if (level) query.level = level;
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const stats = await Attendance.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$subjectId',
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
                    excused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
                }
            }
        ]);

        // Populate subject info
        const Subject = require('../models/Subject');
        const statsWithSubjectInfo = await Promise.all(
            stats.map(async (stat) => {
                const subject = await Subject.findById(stat._id).select('name');
                return {
                    subjectId: stat._id,
                    subject: subject,
                    total: stat.total,
                    present: stat.present,
                    absent: stat.absent,
                    late: stat.late,
                    excused: stat.excused,
                    attendanceRate: stat.total > 0 ? ((stat.present + stat.excused) / stat.total * 100).toFixed(1) : 0
                };
            })
        );

        res.json(statsWithSubjectInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;