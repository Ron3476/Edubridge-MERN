const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');
const { auth, checkRole } = require('../middleware/auth'); // Correct middleware import
const { Subject, Mark, User, Attendance } = require('../models');

// Configure multer for file uploads (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Get teacher's subjects
router.get('/subjects', auth, checkRole(['teacher']), async (req, res) => {
    try {
        const subjects = await Subject.find({ teacherId: req.user.id });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new subject
router.post('/subjects', auth, checkRole(['teacher']), async (req, res) => {
    try {
        const subject = new Subject({
            name: req.body.name,
            teacherId: req.user.id
        });
        await subject.save();
        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get students for a subject
router.get('/subjects/:subjectId/students', auth, checkRole(['teacher']), async (req, res) => {
    try {
        const students = await User.find({ role: 'student' });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all students (for teacher selection)
router.get('/students', auth, checkRole(['teacher']), async (req, res) => {
    try {
        const students = await User.find({ role: 'student' });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add marks for a student
router.post('/marks', auth, checkRole(['teacher']), async (req, res) => {
    try {
        const mark = new Mark({
            studentId: req.body.studentId,
            subjectId: req.body.subjectId,
            marks: req.body.marks,
            level: req.body.level,
            term: req.body.term
        });
        await mark.save();
        res.status(201).json(mark);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get marks for a subject
router.get('/subjects/:subjectId/marks', auth, checkRole(['teacher']), async (req, res) => {
    try {
        const marks = await Mark.find({ subjectId: req.params.subjectId })
            .populate('studentId', 'name admissionNumber')
            .populate('subjectId', 'name')
            .sort('-createdAt');
        res.json(marks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update marks
router.put('/marks/:markId', auth, checkRole(['teacher']), async (req, res) => {
    try {
        const mark = await Mark.findByIdAndUpdate(
            req.params.markId,
            { marks: req.body.marks },
            { new: true }
        );
        res.json(mark);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route   GET /api/teachers/my-marks
// @desc    Get all marks entered by the logged-in teacher
// @access  Private (Teacher)
router.get('/my-marks', auth, checkRole(['teacher']), async (req, res) => {
  try {
    // Find all subjects taught by this teacher
    const subjects = await Subject.find({ teacherId: req.user.id });
    if (!subjects.length) {
      return res.json([]); // No subjects, so no marks
    }
    const subjectIds = subjects.map(s => s._id);

    // Find all marks associated with those subjects
    const marks = await Mark.find({ subjectId: { $in: subjectIds } })
      .populate('studentId', 'name admissionNumber') // Get student's name and admission #
      .populate('subjectId', 'name') // Get subject's name
      .sort({ createdAt: -1 });

    res.json(marks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/teachers/marks/stats
// @desc    Aggregate marks statistics for subjects taught by the logged-in teacher
// @access  Private (Teacher)
router.get('/marks/stats', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const subjects = await Subject.find({ teacherId: req.user.id }).select('name');
    if (!subjects.length) {
      return res.json({ stats: [] });
    }

    const subjectMap = subjects.reduce((acc, subj) => {
      acc[subj._id.toString()] = subj.name;
      return acc;
    }, {});
    const subjectIds = subjects.map((s) => s._id);

    const aggregates = await Mark.aggregate([
      { $match: { subjectId: { $in: subjectIds } } },
      {
        $group: {
          _id: '$subjectId',
          average: { $avg: '$marks' },
          highest: { $max: '$marks' },
          lowest: { $min: '$marks' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const stats = aggregates.map((entry) => ({
      subjectId: entry._id,
      subjectName: subjectMap[entry._id.toString()] || 'Unknown Subject',
      average: Number(entry.average?.toFixed(1) ?? 0),
      highest: entry.highest ?? 0,
      lowest: entry.lowest ?? 0,
      assessments: entry.count ?? 0,
    }));

    res.json({ stats });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/teachers/enroll
// @desc    Enroll a student to a term and level
// @access  Private (Teacher)
router.post('/enroll', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const { studentId, term, level } = req.body;

    // Validate required fields
    if (!studentId || !term || !level) {
      return res.status(400).json({ error: 'Student ID, term, and level are required' });
    }

    // Validate level
    if (level !== 'Junior Secondary School' && level !== 'Senior Secondary School') {
      return res.status(400).json({ 
        error: 'Level must be either "Junior Secondary School" or "Senior Secondary School"' 
      });
    }

    // Check if student exists and is actually a student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    if (student.role !== 'student') {
      return res.status(400).json({ error: 'User is not a student' });
    }

    // Update student's term and level
    student.term = term;
    student.level = level;
    await student.save();

    res.status(200).json({ 
      message: 'Student enrolled successfully',
      student: {
        _id: student._id,
        name: student.name,
        admissionNumber: student.admissionNumber,
        email: student.email,
        term: student.term,
        level: student.level
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET /api/teachers/enrollments
// @desc    Get all enrolled students with their term and level
// @access  Private (Teacher)
router.get('/enrollments', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const students = await User.find({ 
      role: 'student',
      term: { $exists: true, $ne: null },
      level: { $exists: true, $ne: null }
    })
    .select('name email admissionNumber term level createdAt')
    .sort({ name: 1 });

    res.json(students);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   PUT /api/teachers/enrollments/:studentId
// @desc    Update a student's enrollment (term and/or level)
// @access  Private (Teacher)
router.put('/enrollments/:studentId', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const { term, level } = req.body;

    // Check if student exists
    const student = await User.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    if (student.role !== 'student') {
      return res.status(400).json({ error: 'User is not a student' });
    }

    // Update fields if provided
    if (term !== undefined) {
      student.term = term;
    }
    if (level !== undefined) {
      // Validate level
      if (level !== 'Junior Secondary School' && level !== 'Senior Secondary School') {
        return res.status(400).json({ 
          error: 'Level must be either "Junior Secondary School" or "Senior Secondary School"' 
        });
      }
      student.level = level;
    }

    await student.save();

    res.json({ 
      message: 'Student enrollment updated successfully',
      student: {
        _id: student._id,
        name: student.name,
        admissionNumber: student.admissionNumber,
        email: student.email,
        term: student.term,
        level: student.level
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   POST /api/teachers/import-students
// @desc    Import students from CSV file (from registry department)
// @access  Private (Teacher)
// Expected CSV format: name, email, admissionNumber, term, level
router.post('/import-students', auth, checkRole(['teacher']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    const buffer = req.file.buffer;
    const stream = Readable.from(buffer.toString());
    const rows = [];

    // First, collect all rows
    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', async () => {
          // Process rows sequentially
          for (const row of rows) {
            try {
              // Validate required fields
              const { name, email, admissionNumber, term, level } = row;
              
              if (!name || !email || !admissionNumber || !term || !level) {
                errors.push({
                  row: JSON.stringify(row),
                  error: 'Missing required fields: name, email, admissionNumber, term, level'
                });
                continue;
              }

              // Validate level
              if (level !== 'Junior Secondary School' && level !== 'Senior Secondary School') {
                errors.push({
                  row: JSON.stringify(row),
                  error: `Invalid level: ${level}. Must be "Junior Secondary School" or "Senior Secondary School"`
                });
                continue;
              }

              // Check if student already exists
              let student = await User.findOne({ 
                $or: [
                  { email: email.trim() },
                  { admissionNumber: admissionNumber.trim() }
                ]
              });

              if (student) {
                // Update existing student's enrollment
                student.term = term.trim();
                student.level = level.trim();
                if (student.name !== name.trim()) {
                  student.name = name.trim();
                }
                await student.save();
                results.push({
                  action: 'updated',
                  student: {
                    name: student.name,
                    email: student.email,
                    admissionNumber: student.admissionNumber,
                    term: student.term,
                    level: student.level
                  }
                });
              } else {
                // Create new student (without password - they'll need to register or admin will set password)
                // For now, we'll create with a temporary password that needs to be changed
                const bcrypt = require('bcryptjs');
                const tempPassword = await bcrypt.hash(admissionNumber.trim() + Date.now(), 12);
                
                student = new User({
                  name: name.trim(),
                  email: email.trim(),
                  password: tempPassword, // Temporary password
                  role: 'student',
                  admissionNumber: admissionNumber.trim(),
                  term: term.trim(),
                  level: level.trim()
                });
                
                await student.save();
                results.push({
                  action: 'created',
                  student: {
                    name: student.name,
                    email: student.email,
                    admissionNumber: student.admissionNumber,
                    term: student.term,
                    level: student.level
                  }
                });
              }
            } catch (err) {
              errors.push({
                row: JSON.stringify(row),
                error: err.message
              });
            }
          }

          res.json({
            message: 'Import completed',
            success: results.length,
            errors: errors.length,
            results: results,
            errorsList: errors // Array of error objects
          });
          resolve();
        })
        .on('error', (err) => {
          res.status(500).json({ error: 'Error processing CSV file: ' + err.message });
          reject(err);
        });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error: ' + err.message });
  }
});

// @route   GET /api/teachers/export-students
// @desc    Export enrolled students to CSV
// @access  Private (Teacher)
router.get('/export-students', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const students = await User.find({ 
      role: 'student',
      term: { $exists: true, $ne: null },
      level: { $exists: true, $ne: null }
    })
    .select('name email admissionNumber term level createdAt')
    .sort({ name: 1 });

    // Create CSV content
    let csvContent = 'Name,Email,Admission Number,Term,Level,Created At\n';
    
    students.forEach(student => {
      const name = `"${(student.name || '').replace(/"/g, '""')}"`;
      const email = `"${(student.email || '').replace(/"/g, '""')}"`;
      const admissionNumber = `"${(student.admissionNumber || '').replace(/"/g, '""')}"`;
      const term = `"${(student.term || '').replace(/"/g, '""')}"`;
      const level = `"${(student.level || '').replace(/"/g, '""')}"`;
      const createdAt = `"${(student.createdAt || '').toISOString()}"`;
      
      csvContent += `${name},${email},${admissionNumber},${term},${level},${createdAt}\n`;
    });

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="enrolled_students_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET /api/teachers/marks/all
// @desc    Get all marks (for reports) - filtered by teacher's subjects
// @access  Private (Teacher)
router.get('/marks/all', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const { term, level, subjectId } = req.query;
    
    // Find all subjects taught by this teacher
    const subjects = await Subject.find({ teacherId: req.user.id });
    if (!subjects.length) {
      return res.json([]);
    }
    const subjectIds = subjects.map(s => s._id);

    // Build query
    let query = { subjectId: { $in: subjectIds } };
    if (term) query.term = term;
    if (level) query.level = level;
    if (subjectId && subjectIds.includes(subjectId)) {
      query.subjectId = subjectId;
    }

    const marks = await Mark.find(query)
      .populate('studentId', 'name email admissionNumber term level')
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 });

    res.json(marks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   DELETE /api/teachers/marks/:markId
// @desc    Delete a mark (only if it belongs to teacher's subject)
// @access  Private (Teacher)
router.delete('/marks/:markId', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const mark = await Mark.findById(req.params.markId).populate('subjectId');
    if (!mark) {
      return res.status(404).json({ error: 'Mark not found' });
    }

    // Verify the mark belongs to a subject taught by this teacher
    const subject = await Subject.findOne({ _id: mark.subjectId, teacherId: req.user.id });
    if (!subject) {
      return res.status(403).json({ error: 'You do not have permission to delete this mark' });
    }

    await Mark.findByIdAndDelete(req.params.markId);
    res.json({ message: 'Mark deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET /api/teachers/reports/marks
// @desc    Export marks report to CSV
// @access  Private (Teacher)
router.get('/reports/marks', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const { term, level, subjectId } = req.query;
    
    // Find all subjects taught by this teacher
    const subjects = await Subject.find({ teacherId: req.user.id });
    if (!subjects.length) {
      return res.status(400).json({ error: 'No subjects found' });
    }
    const subjectIds = subjects.map(s => s._id);

    // Build query
    let query = { subjectId: { $in: subjectIds } };
    if (term) query.term = term;
    if (level) query.level = level;
    if (subjectId && subjectIds.includes(subjectId)) {
      query.subjectId = subjectId;
    }

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
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ==================== ATTENDANCE ROUTES ====================

// Mark attendance for a student
router.post('/attendance', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const { studentId, subjectId, date, status, term, level, notes } = req.body;

    if (!studentId || !subjectId || !date || !status) {
      return res.status(400).json({ error: 'Student ID, Subject ID, date, and status are required' });
    }

    // Verify subject belongs to teacher
    const subject = await Subject.findOne({ _id: subjectId, teacherId: req.user.id });
    if (!subject) {
      return res.status(403).json({ error: 'You do not have permission to mark attendance for this subject' });
    }

    // Check if attendance already exists for this student, subject, and date
    const existing = await Attendance.findOne({ studentId, subjectId, date: new Date(date) });
    
    if (existing) {
      // Update existing attendance
      existing.status = status;
      if (term) existing.term = term;
      if (level) existing.level = level;
      if (notes !== undefined) existing.notes = notes;
      await existing.save();
      return res.json(existing);
    }

    // Create new attendance record
    const attendance = new Attendance({
      studentId,
      subjectId,
      date: new Date(date),
      status,
      term: term || null,
      level: level || null,
      notes: notes || null,
      markedBy: req.user.id
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Attendance already marked for this student, subject, and date' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Mark attendance for multiple students (bulk)
router.post('/attendance/bulk', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const { subjectId, date, term, level, attendanceList } = req.body;

    if (!subjectId || !date || !attendanceList || !Array.isArray(attendanceList)) {
      return res.status(400).json({ error: 'Subject ID, date, and attendance list are required' });
    }

    // Verify subject belongs to teacher
    const subject = await Subject.findOne({ _id: subjectId, teacherId: req.user.id });
    if (!subject) {
      return res.status(403).json({ error: 'You do not have permission to mark attendance for this subject' });
    }

    const results = [];
    const errors = [];
    const attendanceDate = new Date(date);

    for (const item of attendanceList) {
      try {
        const { studentId, status, notes } = item;
        
        if (!studentId || !status) {
          errors.push({ studentId, error: 'Student ID and status are required' });
          continue;
        }

        // Check if attendance already exists
        const existing = await Attendance.findOne({ 
          studentId, 
          subjectId, 
          date: attendanceDate 
        });

        if (existing) {
          // Update existing
          existing.status = status;
          if (term) existing.term = term;
          if (level) existing.level = level;
          if (notes !== undefined) existing.notes = notes;
          await existing.save();
          results.push(existing);
        } else {
          // Create new
          const attendance = new Attendance({
            studentId,
            subjectId,
            date: attendanceDate,
            status,
            term: term || null,
            level: level || null,
            notes: notes || null,
            markedBy: req.user.id
          });
          await attendance.save();
          results.push(attendance);
        }
      } catch (err) {
        errors.push({ studentId: item.studentId, error: err.message });
      }
    }

    res.json({
      message: 'Bulk attendance marked',
      success: results.length,
      errors: errors.length,
      results,
      errorsList: errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance records
router.get('/attendance', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const { subjectId, studentId, date, term, level, startDate, endDate } = req.query;

    // Get teacher's subjects
    const subjects = await Subject.find({ teacherId: req.user.id });
    const subjectIds = subjects.map(s => s._id);

    // Build query
    let query = { subjectId: { $in: subjectIds } };
    
    if (subjectId && subjectIds.includes(subjectId)) {
      query.subjectId = subjectId;
    }
    if (studentId) query.studentId = studentId;
    if (term) query.term = term;
    if (level) query.level = level;
    if (date) {
      const dateObj = new Date(date);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: dateObj, $lt: nextDay };
    }
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('studentId', 'name admissionNumber email')
      .populate('subjectId', 'name')
      .populate('markedBy', 'name')
      .sort('-date');

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance statistics
router.get('/attendance/stats', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const { subjectId, term, level, startDate, endDate } = req.query;

    // Get teacher's subjects
    const subjects = await Subject.find({ teacherId: req.user.id });
    const subjectIds = subjects.map(s => s._id);

    let query = { subjectId: { $in: subjectIds } };
    if (subjectId && subjectIds.includes(subjectId)) {
      query.subjectId = subjectId;
    }
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
          _id: '$studentId',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
        }
      }
    ]);

    // Populate student info
    const statsWithStudentInfo = await Promise.all(
      stats.map(async (stat) => {
        const student = await User.findById(stat._id).select('name admissionNumber email');
        return {
          studentId: stat._id,
          student: student,
          total: stat.total,
          present: stat.present,
          absent: stat.absent,
          late: stat.late,
          excused: stat.excused,
          attendanceRate: stat.total > 0 ? ((stat.present + stat.excused) / stat.total * 100).toFixed(1) : 0
        };
      })
    );

    res.json(statsWithStudentInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update attendance
router.put('/attendance/:id', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate('subjectId');
    
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Verify subject belongs to teacher
    const subject = await Subject.findOne({ _id: attendance.subjectId._id, teacherId: req.user.id });
    if (!subject) {
      return res.status(403).json({ error: 'You do not have permission to update this attendance' });
    }

    const { status, notes } = req.body;
    if (status) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;

    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete attendance
router.delete('/attendance/:id', auth, checkRole(['teacher']), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate('subjectId');
    
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Verify subject belongs to teacher
    const subject = await Subject.findOne({ _id: attendance.subjectId._id, teacherId: req.user.id });
    if (!subject) {
      return res.status(403).json({ error: 'You do not have permission to delete this attendance' });
    }

    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;