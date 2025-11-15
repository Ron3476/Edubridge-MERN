import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Tabs, Tab, IconButton, Snackbar, Checkbox, ListItemText,
  Chip, OutlinedInput
} from '@mui/material';
import {
  Person, School, Group, Edit, Delete, Add, Link as LinkIcon, GetApp, Description
} from '@mui/icons-material';
// Use centralized API service
import api from '../../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0, totalTeachers: 0, totalParents: 0, totalSubjects: 0
  });
  const [marksModalOpen, setMarksModalOpen] = useState(false);
  const [selectedStudentMarks, setSelectedStudentMarks] = useState([]);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkParentId, setLinkParentId] = useState(null);
  const [linkChildId, setLinkChildId] = useState('');
  const [selectedChildIds, setSelectedChildIds] = useState([]);
  const [students, setStudents] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: '' });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '', email: '', role: 'student', admissionNumber: '', level: '', password: ''
  });
  const [roleFilter, setRoleFilter] = useState('');
  
  // Reports state
  const [allMarks, setAllMarks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [reportFilters, setReportFilters] = useState({
    term: '',
    level: '',
    subjectId: '',
    studentId: ''
  });
  const [editMarkDialog, setEditMarkDialog] = useState(false);
  const [editingMark, setEditingMark] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchStudents();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (activeTab === 2) {
      fetchAllMarks();
    }
  }, [activeTab]);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/users');
      const studentList = res.data.filter(u => u.role === 'student');
      setStudents(studentList);
    } catch (error) {
      handleError(error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/admin/users');
      const teacherList = res.data.filter(u => u.role === 'teacher');
      // Note: In a real app, you'd have a subjects endpoint
      // For now, we'll fetch subjects from teachers if available
    } catch (error) {
      handleError(error);
    }
  };

  const handleError = (error) => console.error('Admin Dashboard Error:', error.response || error);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) { handleError(error); }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (error) { handleError(error); }
  };

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  const fetchStudentMarks = async (studentId, studentName) => {
    try {
      const res = await api.get(`/admin/students/${studentId}/marks`);
      setSelectedStudentMarks(res.data);
      setSelectedStudentName(studentName);
      setMarksModalOpen(true);
    } catch (error) { handleError(error); }
  };

  const openEditModal = (user) => { 
    const userCopy = { ...user };
    // Don't include password in edit form (it's hashed anyway)
    delete userCopy.password;
    setEditUser(userCopy); 
    setEditModalOpen(true); 
  };
  const closeEditModal = () => { setEditModalOpen(false); setEditUser(null); };

  const submitEdit = async () => {
    try {
      const payload = { ...editUser }; 
      delete payload._id;
      // Remove password if it's empty (don't update password)
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
      }
      await api.put(`/admin/users/${editUser._id}`, payload);
      setSnack({ open: true, message: 'User updated' });
      closeEditModal(); fetchUsers();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Update failed' });
    }
  };

  const deleteUser = async (userId) => { // Consider using a MUI Dialog for confirmation instead of window.confirm
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setSnack({ open: true, message: 'User deleted' });
      fetchUsers();
    } catch (error) { setSnack({ open: true, message: error.response?.data?.error || 'Delete failed' }); }
  };

  const openLinkModal = (parent) => { 
    setLinkParentId(parent._id); 
    setLinkChildId(''); 
    setSelectedChildIds([]);
    setLinkModalOpen(true); 
  };
  const closeLinkModal = () => { 
    setLinkModalOpen(false); 
    setLinkParentId(null); 
    setLinkChildId(''); 
    setSelectedChildIds([]);
  };
  const submitLink = async () => {
    try {
      if (!linkParentId) {
        setSnack({ open: true, message: 'Parent not selected' });
        return;
      }

      // Use bulk linking if multiple children selected, otherwise use single child
      if (selectedChildIds.length > 0) {
        const response = await api.post('/admin/parent-child', { 
          parentId: linkParentId, 
          childIds: selectedChildIds 
        });
        
        if (response.data.success) {
          const { linked, failed } = response.data;
          let message = `Successfully linked ${linked} child${linked !== 1 ? 'ren' : ''}`;
          if (failed > 0) {
            message += ` (${failed} failed)`;
          }
          setSnack({ open: true, message });
          closeLinkModal();
          fetchUsers(); // Refresh to show updated relationships
        }
      } else if (linkChildId) {
        // Backward compatibility: single child by admission number
        await api.post('/admin/parent-child', { parentId: linkParentId, childId: linkChildId });
        setSnack({ open: true, message: 'Parent linked to student' }); 
        closeLinkModal();
        fetchUsers();
      } else {
        setSnack({ open: true, message: 'Please select at least one student' });
      }
    } catch (error) { 
      setSnack({ open: true, message: error.response?.data?.error || 'Link failed' }); 
    }
  };

  const closeAddModal = () => setAddModalOpen(false);
  const submitAddUser = async () => {
    try {
      const payload = { ...newUser };
      if (payload.role !== 'student') {
        delete payload.admissionNumber;
        delete payload.level;
      }
      await api.post('/admin/users', payload);
      setSnack({ open: true, message: 'User added successfully' });
      closeAddModal();
      fetchUsers();
    } catch (error) { setSnack({ open: true, message: error.response?.data?.error || 'Failed to add user' }); }
  };

  const handleNewUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleEditUserChange = (e) => {
    setEditUser({ ...editUser, [e.target.name]: e.target.value });
  };

  // Reports handlers
  const fetchAllMarks = async (filters = reportFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters.term) params.append('term', filters.term);
      if (filters.level) params.append('level', filters.level);
      if (filters.subjectId) params.append('subjectId', filters.subjectId);
      if (filters.studentId) params.append('studentId', filters.studentId);

      const response = await api.get(`/admin/marks/all?${params.toString()}`);
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
      if (reportFilters.studentId) params.append('studentId', reportFilters.studentId);

      const response = await api.get(`/admin/reports/marks?${params.toString()}`, {
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

  const handleUpdateMark = async () => {
    try {
      if (!editingMark || editingMark.marks === undefined || editingMark.marks === '') {
        setSnack({ open: true, message: 'Please enter valid marks' });
        return;
      }
      await api.put(`/admin/marks/${editingMark._id}`, {
        marks: editingMark.marks,
        term: editingMark.term,
        level: editingMark.level
      });
      setSnack({ open: true, message: 'Mark updated successfully' });
      setEditMarkDialog(false);
      setEditingMark(null);
      fetchAllMarks();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to update mark' });
    }
  };

  const handleDeleteMark = async (markId) => {
    if (!window.confirm('Are you sure you want to delete this mark? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/admin/marks/${markId}`);
      setSnack({ open: true, message: 'Mark deleted successfully' });
      fetchAllMarks();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to delete mark' });
    }
  };

  const exportUsersCSV = () => {
    const filtered = users.filter(u => roleFilter ? u.role === roleFilter : true);
    if (!filtered.length) return setSnack({ open: true, message: 'No users to export' });

    const headers = ['Name','Email','Role','AdmissionNumber','Level'];
    const rows = filtered.map(u => [u.name, u.email, u.role, u.admissionNumber || '', u.level || '']);
    const csv = [headers, ...rows].map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display:'flex', alignItems:'center', gap:2 }}>
            <School color="primary" />
            <Box><Typography variant="h4">{stats.totalStudents}</Typography><Typography variant="body2" color="textSecondary">Students</Typography></Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display:'flex', alignItems:'center', gap:2 }}>
            <Person color="secondary" />
            <Box><Typography variant="h4">{stats.totalTeachers}</Typography><Typography variant="body2" color="textSecondary">Teachers</Typography></Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display:'flex', alignItems:'center', gap:2 }}>
            <Group color="success" />
            <Box><Typography variant="h4">{stats.totalParents}</Typography><Typography variant="body2" color="textSecondary">Parents</Typography></Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width:'100%', mb:2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="Users" />
          <Tab label="Subjects" />
          <Tab label="Reports" />
        </Tabs>

        {/* Users Tab */}
        {activeTab===0 && (
          <TableContainer component={Box} sx={{ p:2 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
              <Box sx={{ display:'flex', gap:1 }}>
                <FormControl size="small">
                  <InputLabel>Role</InputLabel>
                  <Select value={roleFilter} label="Role" onChange={e=>setRoleFilter(e.target.value)} sx={{ minWidth:140 }}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="teacher">Teacher</MenuItem>
                    <MenuItem value="parent">Parent</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
                <Button size="small" startIcon={<GetApp />} onClick={exportUsersCSV}>Export Users</Button>
              </Box>
              <Button variant="contained" startIcon={<Add />} onClick={()=>{setNewUser({name:'',email:'',role:'student',admissionNumber:'',level:'',password:''}); setAddModalOpen(true);}}>Add User</Button>
            </Box>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.filter(u => roleFilter ? u.role===roleFilter:true).map(user => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={()=>fetchStudentMarks(user._id, user.name)}><Person /></IconButton>
                      <IconButton size="small" onClick={()=>openEditModal(user)}><Edit /></IconButton>
                      <IconButton size="small" color="error" onClick={()=>deleteUser(user._id)}><Delete /></IconButton>
                      {user.role==='parent' && <IconButton size="small" color="primary" onClick={()=>openLinkModal(user)}><LinkIcon /></IconButton>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Subjects Tab */}
        {activeTab===1 && <Box sx={{p:2}}><Typography variant="h6">Manage Subjects</Typography></Box>}
        
        {/* Reports Tab */}
        {activeTab===2 && (
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
                <InputLabel>Student</InputLabel>
                <Select
                  value={reportFilters.studentId}
                  label="Student"
                  onChange={(e) => {
                    setReportFilters({ ...reportFilters, studentId: e.target.value });
                    fetchAllMarks({ ...reportFilters, studentId: e.target.value });
                  }}
                >
                  <MenuItem value="">All Students</MenuItem>
                  {students.map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.name} ({student.admissionNumber || 'N/A'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                onClick={() => {
                  setReportFilters({ term: '', level: '', subjectId: '', studentId: '' });
                  fetchAllMarks({ term: '', level: '', subjectId: '', studentId: '' });
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
      </Paper>

      {/* Marks Dialog */}
      <Dialog open={marksModalOpen} onClose={()=>setMarksModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{selectedStudentName} - Marks</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell><TableCell>Marks</TableCell><TableCell>Level</TableCell><TableCell>Term</TableCell><TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedStudentMarks.map(m => (
                <TableRow key={m._id}>
                  <TableCell>{m.subjectId?.name || 'N/A'}</TableCell>
                  <TableCell>{m.marks}</TableCell>
                  <TableCell>{m.level}</TableCell>
                  <TableCell>{m.term}</TableCell>
                  <TableCell>{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editModalOpen} onClose={closeEditModal} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editUser && (
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Full Name"
                name="name"
                value={editUser.name || ''}
                onChange={handleEditUserChange}
                fullWidth
                required
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={editUser.email || ''}
                onChange={handleEditUserChange}
                fullWidth
                required
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={editUser.password || ''}
                onChange={handleEditUserChange}
                fullWidth
                helperText="Leave blank to keep current password"
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select 
                  name="role" 
                  value={editUser.role || 'student'} 
                  label="Role" 
                  onChange={handleEditUserChange}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="parent">Parent</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              {editUser.role === 'student' && (
                <>
                  <TextField
                    label="Admission Number"
                    name="admissionNumber"
                    value={editUser.admissionNumber || ''}
                    onChange={handleEditUserChange}
                    fullWidth
                  />
                  <FormControl fullWidth>
                    <InputLabel>Level/Grade</InputLabel>
                    <Select
                      name="level"
                      value={editUser.level || ''}
                      label="Level/Grade"
                      onChange={handleEditUserChange}
                    >
                      <MenuItem value="Junior Secondary School">Junior Secondary School</MenuItem>
                      <MenuItem value="Senior Secondary School">Senior Secondary School</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Term"
                    name="term"
                    value={editUser.term || ''}
                    onChange={handleEditUserChange}
                    fullWidth
                    placeholder="e.g., Term 1"
                  />
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditModal}>Cancel</Button>
          <Button onClick={submitEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addModalOpen} onClose={closeAddModal}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Full Name"
              name="name"
              value={newUser.name}
              onChange={handleNewUserChange}
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={newUser.email}
              onChange={handleNewUserChange}
              fullWidth
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={newUser.password}
              onChange={handleNewUserChange}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select name="role" value={newUser.role} label="Role" onChange={handleNewUserChange}>
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="parent">Parent</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            {newUser.role === 'student' && (
              <>
                <TextField
                  label="Admission Number"
                  name="admissionNumber"
                  value={newUser.admissionNumber}
                  onChange={handleNewUserChange}
                  fullWidth
                />
                <TextField
                  label="Level/Grade"
                  name="level"
                  value={newUser.level}
                  onChange={handleNewUserChange}
                  fullWidth
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddModal}>Cancel</Button>
          <Button onClick={submitAddUser} variant="contained">Add User</Button>
        </DialogActions>
      </Dialog>

      {/* Link Parent to Child Dialog */}
      <Dialog open={linkModalOpen} onClose={closeLinkModal} maxWidth="sm" fullWidth>
        <DialogTitle>Link Parent to Student(s)</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Select one or more students to link to this parent
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel id="students-select-label">Select Students</InputLabel>
              <Select
                labelId="students-select-label"
                id="students-select"
                multiple
                value={selectedChildIds}
                onChange={(e) => setSelectedChildIds(e.target.value)}
                input={<OutlinedInput label="Select Students" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const student = students.find(s => s._id === value);
                      return (
                        <Chip 
                          key={value} 
                          label={student ? `${student.name} (${student.admissionNumber || 'N/A'})` : value}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    <Checkbox checked={selectedChildIds.indexOf(student._id) > -1} />
                    <ListItemText 
                      primary={student.name}
                      secondary={`${student.admissionNumber || 'No admission number'} - ${student.level || 'No level'}`}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              OR
            </Typography>

            <TextField
              label="Student Admission Number (Alternative)"
              type="text"
              fullWidth
              value={linkChildId}
              onChange={(e) => {
                setLinkChildId(e.target.value);
                setSelectedChildIds([]); // Clear multi-select when typing
              }}
              placeholder="Enter admission number for single student"
              helperText="Use this if you prefer to enter admission number manually"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLinkModal}>Cancel</Button>
          <Button 
            onClick={submitLink} 
            variant="contained"
            disabled={selectedChildIds.length === 0 && !linkChildId}
          >
            Link {selectedChildIds.length > 0 ? `${selectedChildIds.length} Student${selectedChildIds.length > 1 ? 's' : ''}` : 'Student'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Mark Dialog */}
      <Dialog open={editMarkDialog} onClose={() => setEditMarkDialog(false)} maxWidth="sm" fullWidth>
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
              value={editingMark?.term || ''}
              onChange={(e) => setEditingMark({ ...editingMark, term: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={editingMark?.level || ''}
                label="Level"
                onChange={(e) => setEditingMark({ ...editingMark, level: e.target.value })}
              >
                <MenuItem value="Junior Secondary School">Junior Secondary School</MenuItem>
                <MenuItem value="Senior Secondary School">Senior Secondary School</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMarkDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateMark} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={()=>setSnack({open:false,message:''})} message={snack.message} />
    </Container>
  );
};

export default AdminDashboard;
