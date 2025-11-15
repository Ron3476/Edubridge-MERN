import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
  Snackbar,
  IconButton,
  Chip
} from '@mui/material';
import { Add, Edit, Delete, School, Assessment, BarChart, PersonAdd, CloudUpload, GetApp, Description, EventNote, CheckCircle, Cancel, Schedule, Block } from '@mui/icons-material';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Subjects state
  const [subjects, setSubjects] = useState([]);
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '' });
  
  // Marks state
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [markDialog, setMarkDialog] = useState(false);
  const [newMark, setNewMark] = useState({
    studentId: '',
    subjectId: '',
    marks: '',
    level: '',
    term: ''
  });
  
  // Stats state
  const [stats, setStats] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '' });
  
  // Enrollment state
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentDialog, setEnrollmentDialog] = useState(false);
  const [editEnrollmentDialog, setEditEnrollmentDialog] = useState(false);
  const [newEnrollment, setNewEnrollment] = useState({
    studentId: '',
    term: '',
    level: ''
  });
  const [editingStudent, setEditingStudent] = useState(null);
  
  // Import/Export state
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [importDialog, setImportDialog] = useState(false);
  
  // Reports state
  const [allMarks, setAllMarks] = useState([]);
  const [reportFilters, setReportFilters] = useState({
    term: '',
    level: '',
    subjectId: ''
  });
  const [editMarkDialog, setEditMarkDialog] = useState(false);
  const [editingMark, setEditingMark] = useState(null);

  // Attendance state
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [attendanceDialog, setAttendanceDialog] = useState(false);
  const [bulkAttendanceDialog, setBulkAttendanceDialog] = useState(false);
  const [newAttendance, setNewAttendance] = useState({
    studentId: '',
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    term: '',
    level: '',
    notes: ''
  });
  const [bulkAttendance, setBulkAttendance] = useState({
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    term: '',
    level: '',
    attendanceList: []
  });
  const [attendanceFilters, setAttendanceFilters] = useState({
    subjectId: '',
    term: '',
    level: '',
    date: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      const [subjectsRes, marksRes, studentsRes, statsRes, enrollmentsRes] = await Promise.all([
        api.get('/teachers/subjects').catch(() => ({ data: [] })),
        api.get('/teachers/my-marks').catch(() => ({ data: [] })),
        api.get('/teachers/students').catch(() => ({ data: [] })),
        api.get('/teachers/marks/stats').catch(() => ({ data: { stats: [] } })),
        api.get('/teachers/enrollments').catch(() => ({ data: [] }))
      ]);

      setSubjects(subjectsRes.data || []);
      setMarks(marksRes.data || []);
      setStudents(studentsRes.data || []);
      setStats(statsRes.data || { stats: [] });
      setEnrollments(enrollmentsRes.data || []);
      
      // Fetch attendance if on attendance tab
      if (activeTab === 6) {
        fetchAttendance();
        fetchAttendanceStats();
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setErrorMsg('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 6) {
      fetchAttendance();
      fetchAttendanceStats();
    }
  };

  const fetchAttendance = async () => {
    try {
      const params = new URLSearchParams();
      if (attendanceFilters.subjectId) params.append('subjectId', attendanceFilters.subjectId);
      if (attendanceFilters.term) params.append('term', attendanceFilters.term);
      if (attendanceFilters.level) params.append('level', attendanceFilters.level);
      if (attendanceFilters.date) params.append('date', attendanceFilters.date);
      
      const res = await api.get(`/teachers/attendance?${params.toString()}`);
      setAttendance(res.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setSnack({ open: true, message: 'Failed to load attendance' });
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const params = new URLSearchParams();
      if (attendanceFilters.subjectId) params.append('subjectId', attendanceFilters.subjectId);
      if (attendanceFilters.term) params.append('term', attendanceFilters.term);
      if (attendanceFilters.level) params.append('level', attendanceFilters.level);
      
      const res = await api.get(`/teachers/attendance/stats?${params.toString()}`);
      setAttendanceStats(res.data || []);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  // Subject management
  const openSubjectDialog = () => {
    setNewSubject({ name: '' });
    setSubjectDialog(true);
  };

  const closeSubjectDialog = () => {
    setSubjectDialog(false);
    setNewSubject({ name: '' });
  };

  const createSubject = async () => {
    try {
      if (!newSubject.name.trim()) {
        setSnack({ open: true, message: 'Subject name is required' });
        return;
      }
      await api.post('/teachers/subjects', newSubject);
      setSnack({ open: true, message: 'Subject created successfully' });
      closeSubjectDialog();
      fetchAllData();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to create subject' });
    }
  };

  // Mark management
  const openMarkDialog = () => {
    setNewMark({
      studentId: '',
      subjectId: subjects[0]?._id || '',
      marks: '',
      level: '',
      term: ''
    });
    setMarkDialog(true);
  };

  const closeMarkDialog = () => {
    setMarkDialog(false);
    setNewMark({
      studentId: '',
      subjectId: '',
      marks: '',
      level: '',
      term: ''
    });
  };

  const submitMark = async () => {
    try {
      if (!newMark.studentId || !newMark.subjectId || !newMark.marks) {
        setSnack({ open: true, message: 'Please fill all required fields' });
        return;
      }
      await api.post('/teachers/marks', newMark);
      setSnack({ open: true, message: 'Mark added successfully' });
      closeMarkDialog();
      fetchAllData();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to add mark' });
    }
  };

  // Enrollment management
  const openEnrollmentDialog = () => {
    setNewEnrollment({
      studentId: '',
      term: '',
      level: ''
    });
    setEnrollmentDialog(true);
  };

  const closeEnrollmentDialog = () => {
    setEnrollmentDialog(false);
    setNewEnrollment({
      studentId: '',
      term: '',
      level: ''
    });
  };

  const openEditEnrollmentDialog = (student) => {
    setEditingStudent(student);
    setNewEnrollment({
      studentId: student._id,
      term: student.term || '',
      level: student.level || ''
    });
    setEditEnrollmentDialog(true);
  };

  const closeEditEnrollmentDialog = () => {
    setEditEnrollmentDialog(false);
    setEditingStudent(null);
    setNewEnrollment({
      studentId: '',
      term: '',
      level: ''
    });
  };

  const submitEnrollment = async () => {
    try {
      if (!newEnrollment.studentId || !newEnrollment.term || !newEnrollment.level) {
        setSnack({ open: true, message: 'Please fill all required fields' });
        return;
      }
      await api.post('/teachers/enroll', newEnrollment);
      setSnack({ open: true, message: 'Student enrolled successfully' });
      closeEnrollmentDialog();
      fetchAllData();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to enroll student' });
    }
  };

  const updateEnrollment = async () => {
    try {
      if (!newEnrollment.term || !newEnrollment.level) {
        setSnack({ open: true, message: 'Please fill all required fields' });
        return;
      }
      await api.put(`/teachers/enrollments/${editingStudent._id}`, {
        term: newEnrollment.term,
        level: newEnrollment.level
      });
      setSnack({ open: true, message: 'Enrollment updated successfully' });
      closeEditEnrollmentDialog();
      fetchAllData();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to update enrollment' });
    }
  };

  // Import/Export handlers
  const handleImport = async () => {
    if (!importFile) {
      setSnack({ open: true, message: 'Please select a CSV file' });
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await api.post('/teachers/import-students', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResults({
        success: response.data.success || 0,
        errors: response.data.errors || 0,
        errorsList: response.data.errorsList || []
      });
      
      // Clear import results after 10 seconds
      setTimeout(() => {
        setImportResults(null);
      }, 10000);
      
      setSnack({ 
        open: true, 
        message: `Import completed! ${response.data.success} students processed successfully.` 
      });
      
      setImportFile(null);
      fetchAllData(); // Refresh enrollments
    } catch (error) {
      setSnack({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to import students' 
      });
      setImportResults({
        success: 0,
        errors: 1,
        errorsList: [{ error: error.response?.data?.error || 'Import failed' }]
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/teachers/export-students', {
        responseType: 'blob'
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `enrolled_students_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnack({ open: true, message: 'Students exported successfully' });
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to export students' });
    }
  };

  // Reports handlers
  const fetchAllMarks = async (filters = reportFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters.term) params.append('term', filters.term);
      if (filters.level) params.append('level', filters.level);
      if (filters.subjectId) params.append('subjectId', filters.subjectId);

      const response = await api.get(`/teachers/marks/all?${params.toString()}`);
      setAllMarks(response.data);
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to fetch marks' });
    }
  };

  const handleDownloadReport = async () => {
    try {
      const params = new URLSearchParams();
      if (reportFilters.term) params.append('term', reportFilters.term);
      if (reportFilters.level) params.append('level', reportFilters.level);
      if (reportFilters.subjectId) params.append('subjectId', reportFilters.subjectId);

      const response = await api.get(`/teachers/reports/marks?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marks_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnack({ open: true, message: 'Report downloaded successfully' });
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to download report' });
    }
  };

  const openEditMarkDialog = (mark) => {
    setEditingMark(mark);
    setEditMarkDialog(true);
  };

  // Attendance management functions
  const openAttendanceDialog = () => {
    setNewAttendance({
      studentId: '',
      subjectId: subjects[0]?._id || '',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      term: '',
      level: '',
      notes: ''
    });
    setAttendanceDialog(true);
  };

  const openBulkAttendanceDialog = () => {
    if (!subjects[0]) {
      setSnack({ open: true, message: 'Please create a subject first' });
      return;
    }
    setBulkAttendance({
      subjectId: subjects[0]._id,
      date: new Date().toISOString().split('T')[0],
      term: '',
      level: '',
      attendanceList: students.map(s => ({ studentId: s._id, status: 'present', notes: '' }))
    });
    setBulkAttendanceDialog(true);
  };

  const submitAttendance = async () => {
    try {
      if (!newAttendance.studentId || !newAttendance.subjectId || !newAttendance.date || !newAttendance.status) {
        setSnack({ open: true, message: 'Please fill all required fields' });
        return;
      }
      await api.post('/teachers/attendance', newAttendance);
      setSnack({ open: true, message: 'Attendance marked successfully' });
      setAttendanceDialog(false);
      fetchAttendance();
      fetchAttendanceStats();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to mark attendance' });
    }
  };

  const submitBulkAttendance = async () => {
    try {
      if (!bulkAttendance.subjectId || !bulkAttendance.date) {
        setSnack({ open: true, message: 'Subject and date are required' });
        return;
      }
      const response = await api.post('/teachers/attendance/bulk', bulkAttendance);
      setSnack({ open: true, message: `Attendance marked for ${response.data.success} student(s)` });
      setBulkAttendanceDialog(false);
      fetchAttendance();
      fetchAttendanceStats();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to mark attendance' });
    }
  };

  const updateAttendanceStatus = async (attendanceId, status) => {
    try {
      await api.put(`/teachers/attendance/${attendanceId}`, { status });
      setSnack({ open: true, message: 'Attendance updated' });
      fetchAttendance();
      fetchAttendanceStats();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to update attendance' });
    }
  };

  const deleteAttendance = async (attendanceId) => {
    try {
      await api.delete(`/teachers/attendance/${attendanceId}`);
      setSnack({ open: true, message: 'Attendance record deleted' });
      fetchAttendance();
      fetchAttendanceStats();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to delete attendance' });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle color="success" />;
      case 'absent': return <Cancel color="error" />;
      case 'late': return <Schedule color="warning" />;
      case 'excused': return <Block color="info" />;
      default: return <CheckCircle />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      case 'excused': return 'info';
      default: return 'default';
    }
  };

  const closeEditMarkDialog = () => {
    setEditMarkDialog(false);
    setEditingMark(null);
  };

  const handleUpdateMark = async () => {
    try {
      if (!editingMark || editingMark.marks === undefined || editingMark.marks === '') {
        setSnack({ open: true, message: 'Please enter valid marks' });
        return;
      }
      await api.put(`/teachers/marks/${editingMark._id}`, {
        marks: editingMark.marks
      });
      setSnack({ open: true, message: 'Mark updated successfully' });
      closeEditMarkDialog();
      fetchAllMarks();
      fetchAllData(); // Refresh other data
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to update mark' });
    }
  };

  const handleDeleteMark = async (markId) => {
    if (!window.confirm('Are you sure you want to delete this mark? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/teachers/marks/${markId}`);
      setSnack({ open: true, message: 'Mark deleted successfully' });
      fetchAllMarks();
      fetchAllData(); // Refresh other data
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to delete mark' });
    }
  };

  // Fetch marks when Reports tab is opened
  useEffect(() => {
    if (activeTab === 4) {
      fetchAllMarks();
    }
  }, [activeTab, subjects.length]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Teacher Dashboard
      </Typography>

      {errorMsg && (
        <Paper sx={{ p: 2, mt: 2, mb: 2, backgroundColor: '#fdecea' }}>
          <Typography color="error">{errorMsg}</Typography>
        </Paper>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<School />} label="My Subjects" />
          <Tab icon={<Assessment />} label="Enter Marks" />
          <Tab icon={<PersonAdd />} label="Enroll Students" />
          <Tab icon={<CloudUpload />} label="Import/Export" />
          <Tab icon={<Description />} label="Reports" />
          <Tab icon={<BarChart />} label="Statistics" />
        </Tabs>

        {/* Subjects Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">My Subjects</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={openSubjectDialog}>
                Add Subject
              </Button>
            </Box>
            {subjects.length === 0 ? (
              <Typography color="text.secondary">No subjects yet. Create your first subject!</Typography>
            ) : (
              <List>
                {subjects.map((subject) => (
                  <React.Fragment key={subject._id}>
                    <ListItem>
                      <ListItemText primary={subject.name} />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}

        {/* Enter Marks Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Marks I've Entered</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={openMarkDialog}>
                Add Mark
              </Button>
            </Box>
            {marks.length === 0 ? (
              <Typography color="text.secondary">No marks entered yet.</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Admission No.</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell align="right">Marks (%)</TableCell>
                      <TableCell>Term</TableCell>
                      <TableCell>Level</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marks.map((mark) => (
                      <TableRow key={mark._id}>
                        <TableCell>{mark.studentId?.name || 'N/A'}</TableCell>
                        <TableCell>{mark.studentId?.admissionNumber || 'N/A'}</TableCell>
                        <TableCell>{mark.subjectId?.name || 'N/A'}</TableCell>
                        <TableCell align="right">{mark.marks}</TableCell>
                        <TableCell>{mark.term || 'N/A'}</TableCell>
                        <TableCell>{mark.level || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Enroll Students Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Enrolled Students</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={openEnrollmentDialog}>
                Enroll Student
              </Button>
            </Box>
            {enrollments.length === 0 ? (
              <Typography color="text.secondary">No students enrolled yet. Enroll your first student!</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student Name</TableCell>
                      <TableCell>Admission Number</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Term</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {enrollments.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.admissionNumber || 'N/A'}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.term || 'N/A'}</TableCell>
                        <TableCell>{student.level || 'N/A'}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openEditEnrollmentDialog(student)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Import/Export Tab */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Import Students from Registry Department</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Import student enrollment data from CSV file. The CSV should have columns: name, email, admissionNumber, term, level
            </Typography>
            
            <Grid container spacing={3}>
              {/* Import Section */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <CloudUpload sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Import Students
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <input
                        accept=".csv"
                        style={{ display: 'none' }}
                        id="csv-file-input"
                        type="file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setImportFile(e.target.files[0]);
                          }
                        }}
                      />
                      <label htmlFor="csv-file-input">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUpload />}
                          fullWidth
                          sx={{ mb: 2 }}
                        >
                          {importFile ? importFile.name : 'Choose CSV File'}
                        </Button>
                      </label>
                      {importFile && (
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleImport}
                          disabled={importing}
                          startIcon={importing ? <CircularProgress size={20} /> : <CloudUpload />}
                        >
                          {importing ? 'Importing...' : 'Import Students'}
                        </Button>
                      )}
                    </Box>
                    
                    {importResults && (
                      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Import Results:
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          ✓ Successfully processed: {importResults.success} students
                        </Typography>
                        {importResults.errors > 0 && (
                          <Typography variant="body2" color="error">
                            ✗ Errors: {importResults.errors}
                          </Typography>
                        )}
                        {importResults.errors > 0 && importResults.errorsList && (
                          <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                            {importResults.errorsList.map((err, idx) => (
                              <Typography key={idx} variant="caption" display="block" color="error">
                                {err.error}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Export Section */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <GetApp sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Export Students
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Download all enrolled students as a CSV file
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<GetApp />}
                      onClick={handleExport}
                    >
                      Export to CSV
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* CSV Format Example */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>CSV Format Example</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Your CSV file should have the following format:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        bgcolor: 'background.default',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.875rem'
                      }}
                    >
{`name,email,admissionNumber,term,level
John Doe,john.doe@example.com,ADM001,Term 1,Junior Secondary School
Jane Smith,jane.smith@example.com,ADM002,Term 1,Senior Secondary School`}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Reports Tab */}
        {activeTab === 4 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Marks Reports</Typography>
              <Button
                variant="contained"
                startIcon={<GetApp />}
                onClick={handleDownloadReport}
              >
                Download CSV Report
              </Button>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField
                label="Term"
                size="small"
                value={reportFilters.term}
                onChange={(e) => {
                  setReportFilters({ ...reportFilters, term: e.target.value });
                  fetchAllMarks({ ...reportFilters, term: e.target.value });
                }}
                placeholder="e.g., Term 1"
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Level</InputLabel>
                <Select
                  value={reportFilters.level}
                  label="Level"
                  onChange={(e) => {
                    setReportFilters({ ...reportFilters, level: e.target.value });
                    fetchAllMarks({ ...reportFilters, level: e.target.value });
                  }}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="Junior Secondary School">Junior Secondary School</MenuItem>
                  <MenuItem value="Senior Secondary School">Senior Secondary School</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={reportFilters.subjectId}
                  label="Subject"
                  onChange={(e) => {
                    setReportFilters({ ...reportFilters, subjectId: e.target.value });
                    fetchAllMarks({ ...reportFilters, subjectId: e.target.value });
                  }}
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                onClick={() => {
                  setReportFilters({ term: '', level: '', subjectId: '' });
                  fetchAllMarks({ term: '', level: '', subjectId: '' });
                }}
              >
                Clear Filters
              </Button>
            </Box>

            {/* Marks Table */}
            {allMarks.length === 0 ? (
              <Typography color="text.secondary">No marks found. Try adjusting your filters.</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student Name</TableCell>
                      <TableCell>Admission No.</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell align="right">Marks (%)</TableCell>
                      <TableCell>Term</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allMarks.map((mark) => (
                      <TableRow key={mark._id}>
                        <TableCell>{mark.studentId?.name || 'N/A'}</TableCell>
                        <TableCell>{mark.studentId?.admissionNumber || 'N/A'}</TableCell>
                        <TableCell>{mark.subjectId?.name || 'N/A'}</TableCell>
                        <TableCell align="right">{mark.marks}</TableCell>
                        <TableCell>{mark.term || 'N/A'}</TableCell>
                        <TableCell>{mark.level || 'N/A'}</TableCell>
                        <TableCell>{new Date(mark.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openEditMarkDialog(mark)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMark(mark._id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Statistics Tab */}
        {activeTab === 5 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Marks Statistics</Typography>
            {stats?.stats?.length === 0 ? (
              <Typography color="text.secondary">No statistics available yet.</Typography>
            ) : (
              <Grid container spacing={2}>
                {stats?.stats?.map((stat) => (
                  <Grid item xs={12} md={6} key={stat.subjectId}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>{stat.subjectName}</Typography>
                        <Typography variant="body2">Average: {stat.average}%</Typography>
                        <Typography variant="body2">Highest: {stat.highest}%</Typography>
                        <Typography variant="body2">Lowest: {stat.lowest}%</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Assessments: {stat.assessments}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Attendance Tab */}
        {activeTab === 6 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Attendance Management</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<Add />} onClick={openAttendanceDialog}>
                  Mark Single
                </Button>
                <Button variant="contained" startIcon={<Add />} onClick={openBulkAttendanceDialog}>
                  Mark Bulk
                </Button>
              </Box>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={attendanceFilters.subjectId}
                  label="Subject"
                  onChange={(e) => {
                    setAttendanceFilters({ ...attendanceFilters, subjectId: e.target.value });
                    setTimeout(() => {
                      fetchAttendance();
                      fetchAttendanceStats();
                    }, 100);
                  }}
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map(subject => (
                    <MenuItem key={subject._id} value={subject._id}>{subject.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Term"
                size="small"
                value={attendanceFilters.term}
                onChange={(e) => {
                  setAttendanceFilters({ ...attendanceFilters, term: e.target.value });
                  setTimeout(() => {
                    fetchAttendance();
                    fetchAttendanceStats();
                  }, 100);
                }}
                placeholder="e.g., Term 1"
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Level</InputLabel>
                <Select
                  value={attendanceFilters.level}
                  label="Level"
                  onChange={(e) => {
                    setAttendanceFilters({ ...attendanceFilters, level: e.target.value });
                    setTimeout(() => {
                      fetchAttendance();
                      fetchAttendanceStats();
                    }, 100);
                  }}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="Junior Secondary School">Junior Secondary School</MenuItem>
                  <MenuItem value="Senior Secondary School">Senior Secondary School</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Date"
                type="date"
                size="small"
                value={attendanceFilters.date}
                onChange={(e) => {
                  setAttendanceFilters({ ...attendanceFilters, date: e.target.value });
                  setTimeout(() => {
                    fetchAttendance();
                    fetchAttendanceStats();
                  }, 100);
                }}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  setAttendanceFilters({ subjectId: '', term: '', level: '', date: '' });
                  setTimeout(() => {
                    fetchAttendance();
                    fetchAttendanceStats();
                  }, 100);
                }}
              >
                Clear
              </Button>
            </Box>

            {/* Attendance Statistics */}
            {attendanceStats.length > 0 && (
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Attendance Statistics</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Present</TableCell>
                        <TableCell align="right">Absent</TableCell>
                        <TableCell align="right">Late</TableCell>
                        <TableCell align="right">Excused</TableCell>
                        <TableCell align="right">Rate (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceStats.map((stat) => (
                        <TableRow key={stat.studentId}>
                          <TableCell>{stat.student?.name || 'N/A'}</TableCell>
                          <TableCell align="right">{stat.total}</TableCell>
                          <TableCell align="right">{stat.present}</TableCell>
                          <TableCell align="right">{stat.absent}</TableCell>
                          <TableCell align="right">{stat.late}</TableCell>
                          <TableCell align="right">{stat.excused}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${stat.attendanceRate}%`} 
                              color={parseFloat(stat.attendanceRate) >= 80 ? 'success' : parseFloat(stat.attendanceRate) >= 60 ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* Attendance Records */}
            <Typography variant="h6" gutterBottom>Attendance Records</Typography>
            {attendance.length === 0 ? (
              <Typography color="text.secondary">No attendance records found. Mark attendance to get started.</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Term</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.studentId?.name || 'N/A'}</TableCell>
                        <TableCell>{record.subjectId?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            icon={getStatusIcon(record.status)}
                            label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            color={getStatusColor(record.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{record.term || 'N/A'}</TableCell>
                        <TableCell>{record.notes || '-'}</TableCell>
                        <TableCell align="right">
                          <FormControl size="small" sx={{ minWidth: 100, mr: 1 }}>
                            <Select
                              value={record.status}
                              onChange={(e) => updateAttendanceStatus(record._id, e.target.value)}
                            >
                              <MenuItem value="present">Present</MenuItem>
                              <MenuItem value="absent">Absent</MenuItem>
                              <MenuItem value="late">Late</MenuItem>
                              <MenuItem value="excused">Excused</MenuItem>
                            </Select>
                          </FormControl>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (window.confirm('Delete this attendance record?')) {
                                deleteAttendance(record._id);
                              }
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      {/* Create Subject Dialog */}
      <Dialog open={subjectDialog} onClose={closeSubjectDialog}>
        <DialogTitle>Create New Subject</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Subject Name"
            fullWidth
            variant="outlined"
            value={newSubject.name}
            onChange={(e) => setNewSubject({ name: e.target.value })}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSubjectDialog}>Cancel</Button>
          <Button onClick={createSubject} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Add Mark Dialog */}
      <Dialog open={markDialog} onClose={closeMarkDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Mark for Student</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={newMark.subjectId}
                label="Subject"
                onChange={(e) => setNewMark({ ...newMark, subjectId: e.target.value })}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Student</InputLabel>
              <Select
                value={newMark.studentId}
                label="Student"
                onChange={(e) => setNewMark({ ...newMark, studentId: e.target.value })}
              >
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name} ({student.admissionNumber || student.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Marks (%)"
              type="number"
              fullWidth
              value={newMark.marks}
              onChange={(e) => setNewMark({ ...newMark, marks: e.target.value })}
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              label="Term"
              fullWidth
              value={newMark.term}
              onChange={(e) => setNewMark({ ...newMark, term: e.target.value })}
              placeholder="e.g., Term 1, Term 2"
            />
            <TextField
              label="Level"
              fullWidth
              value={newMark.level}
              onChange={(e) => setNewMark({ ...newMark, level: e.target.value })}
              placeholder="e.g., Form 1, Form 2"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMarkDialog}>Cancel</Button>
          <Button onClick={submitMark} variant="contained">Add Mark</Button>
        </DialogActions>
      </Dialog>

      {/* Enroll Student Dialog */}
      <Dialog open={enrollmentDialog} onClose={closeEnrollmentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Enroll Student</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Student</InputLabel>
              <Select
                value={newEnrollment.studentId}
                label="Student"
                onChange={(e) => setNewEnrollment({ ...newEnrollment, studentId: e.target.value })}
              >
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name} ({student.admissionNumber || student.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Term"
              fullWidth
              required
              value={newEnrollment.term}
              onChange={(e) => setNewEnrollment({ ...newEnrollment, term: e.target.value })}
              placeholder="e.g., Term 1, Term 2, Term 3"
            />
            <FormControl fullWidth required>
              <InputLabel>Level</InputLabel>
              <Select
                value={newEnrollment.level}
                label="Level"
                onChange={(e) => setNewEnrollment({ ...newEnrollment, level: e.target.value })}
              >
                <MenuItem value="Junior Secondary School">Junior Secondary School</MenuItem>
                <MenuItem value="Senior Secondary School">Senior Secondary School</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEnrollmentDialog}>Cancel</Button>
          <Button onClick={submitEnrollment} variant="contained">Enroll</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Enrollment Dialog */}
      <Dialog open={editEnrollmentDialog} onClose={closeEditEnrollmentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Update Enrollment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Student Name"
              fullWidth
              disabled
              value={editingStudent?.name || ''}
            />
            <TextField
              label="Term"
              fullWidth
              required
              value={newEnrollment.term}
              onChange={(e) => setNewEnrollment({ ...newEnrollment, term: e.target.value })}
              placeholder="e.g., Term 1, Term 2, Term 3"
            />
            <FormControl fullWidth required>
              <InputLabel>Level</InputLabel>
              <Select
                value={newEnrollment.level}
                label="Level"
                onChange={(e) => setNewEnrollment({ ...newEnrollment, level: e.target.value })}
              >
                <MenuItem value="Junior Secondary School">Junior Secondary School</MenuItem>
                <MenuItem value="Senior Secondary School">Senior Secondary School</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditEnrollmentDialog}>Cancel</Button>
          <Button onClick={updateEnrollment} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Mark Dialog */}
      <Dialog open={editMarkDialog} onClose={closeEditMarkDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Mark</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Student Name"
              fullWidth
              disabled
              value={editingMark?.studentId?.name || ''}
            />
            <TextField
              label="Subject"
              fullWidth
              disabled
              value={editingMark?.subjectId?.name || ''}
            />
            <TextField
              label="Marks (%)"
              fullWidth
              required
              type="number"
              value={editingMark?.marks || ''}
              onChange={(e) => setEditingMark({ ...editingMark, marks: e.target.value })}
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              label="Term"
              fullWidth
              disabled
              value={editingMark?.term || 'N/A'}
            />
            <TextField
              label="Level"
              fullWidth
              disabled
              value={editingMark?.level || 'N/A'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditMarkDialog}>Cancel</Button>
          <Button onClick={handleUpdateMark} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Mark Single Attendance Dialog */}
      <Dialog open={attendanceDialog} onClose={() => setAttendanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark Attendance</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Subject</InputLabel>
              <Select
                value={newAttendance.subjectId}
                label="Subject"
                onChange={(e) => setNewAttendance({ ...newAttendance, subjectId: e.target.value })}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Student</InputLabel>
              <Select
                value={newAttendance.studentId}
                label="Student"
                onChange={(e) => setNewAttendance({ ...newAttendance, studentId: e.target.value })}
              >
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name} ({student.admissionNumber || student.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Date"
              type="date"
              fullWidth
              required
              value={newAttendance.date}
              onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                value={newAttendance.status}
                label="Status"
                onChange={(e) => setNewAttendance({ ...newAttendance, status: e.target.value })}
              >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="late">Late</MenuItem>
                <MenuItem value="excused">Excused</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Term"
              fullWidth
              value={newAttendance.term}
              onChange={(e) => setNewAttendance({ ...newAttendance, term: e.target.value })}
              placeholder="e.g., Term 1"
            />
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={newAttendance.level}
                label="Level"
                onChange={(e) => setNewAttendance({ ...newAttendance, level: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Junior Secondary School">Junior Secondary School</MenuItem>
                <MenuItem value="Senior Secondary School">Senior Secondary School</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={newAttendance.notes}
              onChange={(e) => setNewAttendance({ ...newAttendance, notes: e.target.value })}
              placeholder="Optional notes..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttendanceDialog(false)}>Cancel</Button>
          <Button onClick={submitAttendance} variant="contained">Mark Attendance</Button>
        </DialogActions>
      </Dialog>

      {/* Mark Bulk Attendance Dialog */}
      <Dialog open={bulkAttendanceDialog} onClose={() => setBulkAttendanceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Mark Bulk Attendance</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Subject</InputLabel>
              <Select
                value={bulkAttendance.subjectId}
                label="Subject"
                onChange={(e) => setBulkAttendance({ ...bulkAttendance, subjectId: e.target.value })}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Date"
              type="date"
              fullWidth
              required
              value={bulkAttendance.date}
              onChange={(e) => setBulkAttendance({ ...bulkAttendance, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Term"
              fullWidth
              value={bulkAttendance.term}
              onChange={(e) => setBulkAttendance({ ...bulkAttendance, term: e.target.value })}
              placeholder="e.g., Term 1"
            />
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={bulkAttendance.level}
                label="Level"
                onChange={(e) => setBulkAttendance({ ...bulkAttendance, level: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Junior Secondary School">Junior Secondary School</MenuItem>
                <MenuItem value="Senior Secondary School">Senior Secondary School</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Mark attendance for all students:</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bulkAttendance.attendanceList.map((item, index) => {
                    const student = students.find(s => s._id === item.studentId);
                    return (
                      <TableRow key={item.studentId}>
                        <TableCell>{student?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={item.status}
                              onChange={(e) => {
                                const updated = [...bulkAttendance.attendanceList];
                                updated[index].status = e.target.value;
                                setBulkAttendance({ ...bulkAttendance, attendanceList: updated });
                              }}
                            >
                              <MenuItem value="present">Present</MenuItem>
                              <MenuItem value="absent">Absent</MenuItem>
                              <MenuItem value="late">Late</MenuItem>
                              <MenuItem value="excused">Excused</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.notes || ''}
                            onChange={(e) => {
                              const updated = [...bulkAttendance.attendanceList];
                              updated[index].notes = e.target.value;
                              setBulkAttendance({ ...bulkAttendance, attendanceList: updated });
                            }}
                            placeholder="Optional"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkAttendanceDialog(false)}>Cancel</Button>
          <Button onClick={submitBulkAttendance} variant="contained">Mark All</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ open: false, message: '' })}
        message={snack.message}
      />
    </Container>
  );
};

export default TeacherDashboard;
