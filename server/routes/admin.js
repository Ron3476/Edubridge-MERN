const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { auth, checkRole } = require('../middleware/auth');
const { User, Subject, Mark, ParentChild } = require('../models');

// Debug middleware
router.use((req, res, next) => {
    console.log('Admin route accessed:', req.path);
    console.log('User:', req.user);
    next();
});

// Get all users
router.get('/users', auth, checkRole(['admin']), async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get dashboard stats
router.get('/stats', auth, checkRole(['admin']), async (req, res) => {
    try {
        const [
            totalStudents,
            totalTeachers,
            totalParents,
            totalSubjects
        ] = await Promise.all([
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'teacher' }),
            User.countDocuments({ role: 'parent' }),
            Subject.countDocuments()
        ]);

        res.json({
            totalStudents,
            totalTeachers,
            totalParents,
            totalSubjects
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create user (admin only)
// Note: Only existing admins can create new admin accounts through this route
router.post('/users', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { name, email, password, role, admissionNumber, level } = req.body;

        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        // Admins can create any role including other admins (this route is already protected by admin auth)

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user object
        const userData = {
            name,
            email,
            password: hashedPassword,
            role
        };

        if (role === 'student') {
            if (!admissionNumber) {
                return res.status(400).json({ error: 'Admission number is required for students' });
            }
            userData.admissionNumber = admissionNumber;
            if (level) {
                userData.level = level;
            }
        }

        const user = new User(userData);
        await user.save();
        
        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;
        res.status(201).json(userResponse);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update user
router.put('/users/:id', auth, checkRole(['admin']), async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        // Hash password if provided and not empty
        if (updateData.password && updateData.password.trim() !== '') {
            updateData.password = await bcrypt.hash(updateData.password, 12);
        } else {
            // Remove password from update if it's empty (don't update password)
            delete updateData.password;
        }

        // Clean up fields for non-students
        if (updateData.role && updateData.role !== 'student') {
            delete updateData.admissionNumber;
            delete updateData.level;
            delete updateData.term;
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;
        res.json(userResponse);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete user
router.delete('/users/:id', auth, checkRole(['admin']), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get marks for a specific student (admin)
router.get('/students/:id/marks', auth, checkRole(['admin']), async (req, res) => {
    try {
        const marks = await Mark.find({ studentId: req.params.id })
            .populate('subjectId')
            .populate('studentId', 'name email admissionNumber')
            .sort('-createdAt');
        res.json(marks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all marks (admin) - for reports
router.get('/marks/all', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { term, level, subjectId, studentId } = req.query;
        
        let query = {};
        if (term) query.term = term;
        if (level) query.level = level;
        if (subjectId) query.subjectId = subjectId;
        if (studentId) query.studentId = studentId;

        const marks = await Mark.find(query)
            .populate('studentId', 'name email admissionNumber term level')
            .populate('subjectId', 'name')
            .sort({ createdAt: -1 });

        res.json(marks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update mark (admin)
router.put('/marks/:markId', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { marks, term, level } = req.body;
        const updateData = {};
        if (marks !== undefined) updateData.marks = marks;
        if (term !== undefined) updateData.term = term;
        if (level !== undefined) updateData.level = level;

        const mark = await Mark.findByIdAndUpdate(
            req.params.markId,
            { $set: updateData },
            { new: true }
        ).populate('studentId', 'name email admissionNumber')
         .populate('subjectId', 'name');

        if (!mark) {
            return res.status(404).json({ error: 'Mark not found' });
        }

        res.json(mark);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete mark (admin)
router.delete('/marks/:markId', auth, checkRole(['admin']), async (req, res) => {
    try {
        const mark = await Mark.findByIdAndDelete(req.params.markId);
        if (!mark) {
            return res.status(404).json({ error: 'Mark not found' });
        }
        res.json({ message: 'Mark deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export marks report to CSV (admin)
router.get('/reports/marks', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { term, level, subjectId, studentId } = req.query;
        
        let query = {};
        if (term) query.term = term;
        if (level) query.level = level;
        if (subjectId) query.subjectId = subjectId;
        if (studentId) query.studentId = studentId;

        const marks = await Mark.find(query)
            .populate('studentId', 'name email admissionNumber term level')
            .populate('subjectId', 'name')
            .sort({ createdAt: -1 });

        // Create CSV content
        let csvContent = 'Student Name,Admission Number,Email,Subject,Term,Level,Marks (%),Date\n';
        
        marks.forEach(mark => {
            const studentName = `"${((mark.studentId?.name || 'N/A').replace(/"/g, '""'))}"`;
            const admissionNumber = `"${((mark.studentId?.admissionNumber || 'N/A').replace(/"/g, '""'))}"`;
            const email = `"${((mark.studentId?.email || 'N/A').replace(/"/g, '""'))}"`;
            const subject = `"${((mark.subjectId?.name || 'N/A').replace(/"/g, '""'))}"`;
            const term = `"${((mark.term || 'N/A').replace(/"/g, '""'))}"`;
            const level = `"${((mark.level || 'N/A').replace(/"/g, '""'))}"`;
            const marksValue = mark.marks || 0;
            const date = `"${(mark.createdAt || new Date()).toISOString()}"`;
            
            csvContent += `${studentName},${admissionNumber},${email},${subject},${term},${level},${marksValue},${date}\n`;
        });

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="marks_report_${Date.now()}.csv"`);
        res.send(csvContent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Link a parent to a student (admin) - supports single or multiple children
router.post('/parent-child', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { parentId, childId: childIdentifier, childIds } = req.body;
        
        // Basic validation
        const parent = await User.findById(parentId);
        if (!parent || parent.role !== 'parent') {
            return res.status(400).json({ error: 'Invalid parent' });
        }

        // Handle bulk linking (multiple children)
        if (childIds && Array.isArray(childIds) && childIds.length > 0) {
            const results = [];
            const errors = [];

            for (const childIdentifier of childIds) {
                try {
                    let child = null;

                    if (childIdentifier) {
                        if (mongoose.Types.ObjectId.isValid(childIdentifier)) {
                            child = await User.findById(childIdentifier);
                        }
                        if (!child) {
                            child = await User.findOne({ admissionNumber: childIdentifier });
                        }
                    }

                    if (!child || child.role !== 'student') {
                        errors.push({ childId: childIdentifier, error: 'Invalid child' });
                        continue;
                    }

                    // Prevent duplicates
                    const existing = await ParentChild.findOne({ parentId, childId: child._id });
                    if (existing) {
                        errors.push({ childId: childIdentifier, error: 'Relationship already exists' });
                        continue;
                    }

                    const rel = new ParentChild({ parentId, childId: child._id });
                    await rel.save();
                    results.push(rel);
                } catch (err) {
                    errors.push({ childId: childIdentifier, error: err.message });
                }
            }

            return res.status(201).json({
                success: true,
                linked: results.length,
                failed: errors.length,
                results: results,
                errors: errors
            });
        }

        // Handle single child linking (backward compatibility)
        let child = null;
        if (childIdentifier) {
            if (mongoose.Types.ObjectId.isValid(childIdentifier)) {
                child = await User.findById(childIdentifier);
            }
            if (!child) {
                child = await User.findOne({ admissionNumber: childIdentifier });
            }
        }

        if (!child || child.role !== 'student') {
            return res.status(400).json({ error: 'Invalid child' });
        }

        // Prevent duplicates
        const existing = await ParentChild.findOne({ parentId, childId: child._id });
        if (existing) {
            return res.status(400).json({ error: 'Relationship already exists' });
        }

        const rel = new ParentChild({ parentId, childId: child._id });
        await rel.save();
        res.status(201).json(rel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Unlink parent-child (admin)
router.delete('/parent-child', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { parentId, childId: childIdentifier } = req.body;
        let childId = null;

        if (childIdentifier) {
            if (mongoose.Types.ObjectId.isValid(childIdentifier)) {
                childId = childIdentifier;
            } else {
                const child = await User.findOne({ admissionNumber: childIdentifier, role: 'student' });
                if (child) {
                    childId = child._id;
                }
            }
        }

        if (!childId) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const rel = await ParentChild.findOneAndDelete({ parentId, childId });
        if (!rel) return res.status(404).json({ error: 'Relationship not found' });
        res.json({ message: 'Unlinked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;