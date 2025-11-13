import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Tabs, Tab, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Snackbar, IconButton, List, ListItem, ListItemText, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Grid, Chip, LinearProgress
} from '@mui/material';
import { Refresh, GetApp, Email } from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from '../../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedChild, setSelectedChild] = useState(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '' });
  const [filterTerm, setFilterTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchParentData(); }, []);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/parents/children');
      setChildren(res.data);
      if (res.data.length > 0) setSelectedChild(res.data[0]);
    } catch (error) {
      console.error('Error fetching parent data:', error);
      setSnack({ open: true, message: 'Failed to load children data' });
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchParentData();

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  const exportChildMarksCSV = (child) => {
    if (!child.marks || !child.marks.length) return setSnack({ open: true, message: 'No marks to export' });
    const headers = ['Subject','Marks','Level','Term','Date'];
    const rows = child.marks.map(m => [
      m.subjectId?.name || '', m.marks, m.level, m.term,
      new Date(m.createdAt).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${child.name.replace(/\s+/g,'_')}_marks.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openContactDialog = (child) => {
    setSelectedChild(child);
    setContactMessage(`Hello,\n\nI would like to discuss ${child.name}'s progress.`);
    setContactDialogOpen(true);
  };

  const sendContact = () => {
    const subject = encodeURIComponent(`Request regarding ${selectedChild?.name}`);
    const body = encodeURIComponent(contactMessage);
    window.location.href = `mailto:support@school.example?subject=${subject}&body=${body}`;
    setContactDialogOpen(false);
  };

  // Helper functions for academic progress
  const getGrade = (marks) => {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B';
    if (marks >= 60) return 'C';
    if (marks >= 50) return 'D';
    return 'F';
  };

  const getGradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return 'success';
    if (grade === 'B') return 'info';
    if (grade === 'C') return 'warning';
    return 'error';
  };

  const renderChildProgressChart = (marks, childName) => {
    // Get all unique subjects
    const allSubjects = [...new Set(marks.map(m => m.subjectId?.name).filter(Boolean))];
    const terms = [...new Set(marks.map(m => m.term).filter(Boolean))].sort();

    // Prepare data for line chart (average per term)
    const termAverages = terms.map(term => {
      const termMarks = marks.filter(m => m.term === term);
      const avg = termMarks.length 
        ? termMarks.reduce((sum, m) => sum + (Number(m.marks) || 0), 0) / termMarks.length
        : 0;
      return parseFloat(avg.toFixed(1));
    });

    // Prepare data for bar chart (subject-wise performance)
    const subjectData = allSubjects.map(subject => {
      const subjectMarks = marks.filter(m => m.subjectId?.name === subject);
      const avg = subjectMarks.length
        ? subjectMarks.reduce((sum, m) => sum + (Number(m.marks) || 0), 0) / subjectMarks.length
        : 0;
      return parseFloat(avg.toFixed(1));
    });

    return (
      <Grid container spacing={3}>
        {/* Line Chart - Term Progress */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Progress by Term</Typography>
          <Line
            data={{
              labels: terms.length > 0 ? terms : ['No Data'],
              datasets: [{
                label: 'Average Marks (%)',
                data: termAverages.length > 0 ? termAverages : [0],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointBackgroundColor: 'rgb(75, 192, 192)',
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, position: 'top' },
                title: { display: false }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: { display: true, text: 'Marks (%)' }
                }
              }
            }}
          />
        </Grid>

        {/* Bar Chart - Subject Performance */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Performance by Subject</Typography>
          <Bar
            data={{
              labels: allSubjects.length > 0 ? allSubjects : ['No Data'],
              datasets: [{
                label: 'Average Marks (%)',
                data: subjectData.length > 0 ? subjectData : [0],
                backgroundColor: [
                  'rgba(75, 192, 192, 0.6)',
                  'rgba(54, 162, 235, 0.6)',
                  'rgba(255, 206, 86, 0.6)',
                  'rgba(255, 99, 132, 0.6)',
                  'rgba(153, 102, 255, 0.6)',
                ],
                borderColor: [
                  'rgba(75, 192, 192, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(255, 99, 132, 1)',
                  'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                title: { display: false }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: { display: true, text: 'Marks (%)' }
                }
              }
            }}
          />
        </Grid>
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Parent Dashboard</Typography>

      <Paper sx={{ width:'100%', mb:2 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', p:1 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Academic Progress" />
            <Tab label="Attendance" />
            <Tab label="Reports" />
          </Tabs>
          <IconButton onClick={refresh} title="Refresh"><Refresh /></IconButton>
        </Box>

        {/* Academic Progress Tab */}
        {activeTab===0 && (
          <Box sx={{ p:3 }}>
            {children.map(child => {
              let childMarks = child.marks || [];
              // Apply filters
              if (filterTerm) {
                childMarks = childMarks.filter(m => m.term === filterTerm);
              }
              if (filterLevel) {
                childMarks = childMarks.filter(m => m.level === filterLevel);
              }
              const terms = [...new Set(childMarks.map(m => m.term).filter(Boolean))].sort();
              
              return (
                <Paper key={child._id} sx={{ mb:3, p:3 }}>
                  <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'start', mb:2 }}>
                    <Box>
                      <Typography variant="h6">{child.name}</Typography>
                      <Typography variant="subtitle2" color="textSecondary">Admission: {child.admissionNumber}</Typography>
                    </Box>
                    <Box sx={{ display:'flex', gap:1 }}>
                      <Button size="small" startIcon={<GetApp />} onClick={()=>exportChildMarksCSV(child)}>Export CSV</Button>
                      <Button size="small" startIcon={<Email />} onClick={()=>openContactDialog(child)}>Contact</Button>
                    </Box>
                  </Box>

                  {childMarks.length > 0 ? (
                    <>
                      {/* Graph Section */}
                      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
                        <Typography variant="h6" gutterBottom>{child.name}'s Academic Performance Overview</Typography>
                        <Box sx={{ height: 400, mt: 2 }}>
                          {renderChildProgressChart(childMarks, child.name)}
                        </Box>
                      </Paper>

                      {/* Term-based Tables */}
                      {terms.length > 0 ? (
                        terms.map(term => {
                          const termMarks = childMarks.filter(m => m.term === term);
                          const avg = termMarks.length 
                            ? (termMarks.reduce((sum, m) => sum + (Number(m.marks) || 0), 0) / termMarks.length).toFixed(1)
                            : 0;
                          
                          return (
                            <Paper key={term} sx={{ p: 3, mb: 2, bgcolor: 'background.default' }}>
                              <Typography variant="h6" gutterBottom>{term} - Academic Progress</Typography>
                              <TableContainer>
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell><strong>Subject</strong></TableCell>
                                      <TableCell align="right"><strong>Marks (%)</strong></TableCell>
                                      <TableCell><strong>Level</strong></TableCell>
                                      <TableCell><strong>Date</strong></TableCell>
                                      <TableCell><strong>Grade</strong></TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {termMarks.map(mark => {
                                      const markValue = Number(mark.marks) || 0;
                                      const grade = getGrade(markValue);
                                      return (
                                        <TableRow key={mark._id}>
                                          <TableCell>{mark.subjectId?.name || 'Unknown Subject'}</TableCell>
                                          <TableCell align="right">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                              <LinearProgress
                                                variant="determinate"
                                                value={Math.max(0, Math.min(100, markValue))}
                                                sx={{ width: 100, height: 8, borderRadius: 1 }}
                                                color={getGradeColor(grade)}
                                              />
                                              <Typography sx={{ minWidth: 50 }}>{markValue}%</Typography>
                                            </Box>
                                          </TableCell>
                                          <TableCell>{mark.level || 'N/A'}</TableCell>
                                          <TableCell>{new Date(mark.createdAt).toLocaleDateString()}</TableCell>
                                          <TableCell>
                                            <Chip 
                                              label={grade} 
                                              color={getGradeColor(grade)} 
                                              size="small" 
                                            />
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                              
                              {/* Term Summary */}
                              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                                <Typography variant="subtitle2">
                                  <strong>{term} Average:</strong> {avg}%
                                </Typography>
                              </Box>
                            </Paper>
                          );
                        })
                      ) : (
                        <Typography color="textSecondary">No term-based data available</Typography>
                      )}
                    </>
                  ) : (
                    <Typography color="textSecondary">No marks available</Typography>
                  )}

                  {/* Filters */}
                  <Box sx={{ mt:2, display:'flex', gap:1 }}>
                    <FormControl size="small">
                      <InputLabel>Term</InputLabel>
                      <Select value={filterTerm} label="Term" onChange={e=>setFilterTerm(e.target.value)} sx={{ minWidth:120 }}>
                        <MenuItem value="">All Terms</MenuItem>
                        {terms.map(term => (
                          <MenuItem key={term} value={term}>{term}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small">
                      <InputLabel>Level</InputLabel>
                      <Select value={filterLevel} label="Level" onChange={e=>setFilterLevel(e.target.value)} sx={{ minWidth:200 }}>
                        <MenuItem value="">All Levels</MenuItem>
                        <MenuItem value="Junior Secondary School">Junior Secondary School</MenuItem>
                        <MenuItem value="Senior Secondary School">Senior Secondary School</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}

        {/* Attendance Tab */}
        {activeTab===1 && (
          <Box sx={{ p:2 }}>
            {children.map(child => {
              const attendance = child.attendance || [];
              const total = attendance.length;
              const present = attendance.filter(a => a.present).length;
              const percent = total ? Math.round((present/total)*100) : null;
              return (
                <Paper key={child._id} sx={{ mb:2, p:2 }}>
                  <Typography variant="h6">{child.name}</Typography>
                  {total ? (
                    <Box>
                      <Typography variant="body2">Attendance: {present}/{total} ({percent}%)</Typography>
                      <Box sx={{ mt:1 }}>
                        <Typography variant="subtitle2">Recent</Typography>
                        <List>
                          {attendance.slice(0,5).map((a, idx)=>(
                            <ListItem key={idx}>
                              <ListItemText primary={new Date(a.date).toLocaleDateString()} secondary={a.present?'Present':'Absent'} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </Box>
                  ) : <Typography color="textSecondary">Attendance data not available</Typography>}
                </Paper>
              );
            })}
          </Box>
        )}

        {/* Reports Tab */}
        {activeTab===2 && (
          <Box sx={{ p:2 }}>
            {children.map(child => {
              const marks = child.marks || [];
              const avg = marks.length ? (marks.reduce((sum,m)=>sum+Number(m.marks),0)/marks.length).toFixed(1) : 'N/A';
              const highest = marks.length ? Math.max(...marks.map(m=>Number(m.marks))) : 'N/A';
              const lowest = marks.length ? Math.min(...marks.map(m=>Number(m.marks))) : 'N/A';
              return (
                <Paper key={child._id} sx={{ mb:2, p:2 }}>
                  <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <Box>
                      <Typography variant="h6">{child.name}</Typography>
                      <Typography variant="caption" color="textSecondary">Admission: {child.admissionNumber}</Typography>
                    </Box>
                    <Button size="small" startIcon={<GetApp />} onClick={()=>exportChildMarksCSV(child)}>Download Marks CSV</Button>
                  </Box>
                  <Box sx={{ mt:1 }}>
                    <Typography>Average: {avg}%</Typography>
                    <Typography>Highest: {highest}%</Typography>
                    <Typography>Lowest: {lowest}%</Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onClose={()=>setContactDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Contact School / Teacher about {selectedChild?.name}</DialogTitle>
        <DialogContent>
          <TextField
            label="Message"
            fullWidth
            multiline
            rows={6}
            value={contactMessage}
            onChange={e=>setContactMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setContactDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={sendContact}>Send</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={()=>setSnack({open:false,message:''})} message={snack.message} />
    </Container>
  );
};

export default ParentDashboard;
