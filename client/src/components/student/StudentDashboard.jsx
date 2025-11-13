import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Card, CardContent,
  CardActions, LinearProgress, Chip, Stack, Button, Tab, Tabs,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress
} from '@mui/material';
import {
  SentimentVerySatisfied, SentimentSatisfied, SentimentDissatisfied,
  DeleteOutline, CheckCircleOutline, School, Timeline, EmojiEmotions
} from '@mui/icons-material';
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

const StudentDashboard = ({ user }) => {
  const [marks, setMarks] = useState([]);
  const [studyPlans, setStudyPlans] = useState([]);
  const [moodEntries, setMoodEntries] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [studyPlanDialog, setStudyPlanDialog] = useState(false);
  const [moodDialog, setMoodDialog] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '' });
  const [loading, setLoading] = useState(true);

  const [newStudyPlan, setNewStudyPlan] = useState({
    subject: '', topic: '', description: '', dueDate: '', estimatedHours: ''
  });

  const [newMood, setNewMood] = useState({
    mood: 'happy', energy: 5, stress: 1, note: ''
  });

  useEffect(() => { fetchStudentData(); }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [marksRes, plansRes, moodRes] = await Promise.all([
        api.get('/students/marks').catch(err => ({ data: [] })),
        api.get('/students/study-plans').catch(err => ({ data: [] })),
        api.get('/students/mood-entries').catch(err => ({ data: [] }))
      ]);

      setMarks(marksRes.data || []);
      setStudyPlans(plansRes.data || []);
      setMoodEntries(moodRes.data || []);

    } catch (error) {
      console.error('Error fetching student data:', error);
      setSnack({ open: true, message: 'Failed to load data. Please refresh the page.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  const submitStudyPlan = async () => {
    try {
      await api.post('/students/study-plans', newStudyPlan);
      setSnack({ open: true, message: 'Study plan created!' });
      setStudyPlanDialog(false);
      setNewStudyPlan({
        subject: '',
        topic: '',
        description: '',
        dueDate: '',
        estimatedHours: ''
      });
      fetchStudentData();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to create study plan' });
    }
  };

  const submitMood = async () => {
    try {
      await api.post('/students/mood-entries', newMood);
      setSnack({ open: true, message: 'Mood logged!' });
      setMoodDialog(false);
      setNewMood({ mood: 'happy', energy: 5, stress: 1, note: '' });
      fetchStudentData();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to log mood' });
    }
  };

  const completeStudyPlan = async (planId) => {
    try {
      await api.patch(`/students/study-plans/${planId}`, { completed: true });
      setSnack({ open: true, message: 'Study plan completed!' });
      fetchStudentData();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to update study plan' });
    }
  };

  const deleteStudyPlan = async (planId) => {
    try {
      await api.delete(`/students/study-plans/${planId}`);
      setSnack({ open: true, message: 'Study plan deleted' });
      fetchStudentData();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to delete study plan' });
    }
  };

  // Helper functions for academic progress
  const getTermsFromMarks = () => {
    const terms = [...new Set(marks.map(m => m.term).filter(Boolean))];
    return terms.sort();
  };

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

  const renderProgressChart = () => {
    if (!marks || marks.length === 0) {
      return (
        <Typography color="text.secondary" align="center">
          No data available for charts
        </Typography>
      );
    }

    // Get all unique subjects
    const allSubjects = [...new Set(marks.map(m => m.subjectId?.name).filter(Boolean))];
    const terms = getTermsFromMarks();

    if (terms.length === 0 || allSubjects.length === 0) {
      return (
        <Typography color="text.secondary" align="center">
          No term or subject data available
        </Typography>
      );
    }

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
      return avg;
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
                },
                x: {
                  title: { display: true, text: 'Term' }
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
                },
                x: {
                  title: { display: true, text: 'Subject' }
                }
              }
            }}
          />
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <School color="primary" />
            <Box>
              <Typography variant="h4">{marks.length}</Typography>
              <Typography variant="body2" color="textSecondary">Total Marks</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Timeline color="secondary" />
            <Box>
              <Typography variant="h4">{studyPlans.length}</Typography>
              <Typography variant="body2" color="textSecondary">Study Plans</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmojiEmotions color="success" />
            <Box>
              <Typography variant="h4">{moodEntries.length}</Typography>
              <Typography variant="body2" color="textSecondary">Mood Entries</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Academic Progress" />
          <Tab label="Study Plans" />
          <Tab label="Mood Tracker" />
        </Tabs>

        {/* Academic Progress */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Graph Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Academic Performance Overview</Typography>
              {marks.length > 0 && getTermsFromMarks().length > 0 ? (
                <Box sx={{ height: 400, mt: 2 }}>
                  {renderProgressChart()}
                </Box>
              ) : (
                <Box sx={{ mt: 2, p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">No marks data available for chart. Marks will appear here once they are entered by your teachers.</Typography>
                </Box>
              )}
            </Paper>

            {/* Term-based Tables */}
            {getTermsFromMarks().length > 0 ? (
              getTermsFromMarks().map(term => (
                <Paper key={term} sx={{ p: 3, mb: 3 }}>
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
                        {marks
                          .filter(m => m.term === term)
                          .map(mark => {
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
                        {marks.filter(m => m.term === term).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <Typography color="text.secondary">No marks recorded for {term}</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* Term Summary */}
                  {(() => {
                    const termMarks = marks.filter(m => m.term === term);
                    const avg = termMarks.length 
                      ? (termMarks.reduce((sum, m) => sum + (Number(m.marks) || 0), 0) / termMarks.length).toFixed(1)
                      : 0;
                    return (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="subtitle2">
                          <strong>{term} Average:</strong> {avg}%
                        </Typography>
                      </Box>
                    );
                  })()}
                </Paper>
              ))
            ) : (
              <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary">No academic progress data available</Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* Study Plans */}
        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            <Button variant="contained" sx={{ mb: 2 }} onClick={() => setStudyPlanDialog(true)}>
              Create New Study Plan
            </Button>
            <Grid container spacing={2}>
              {studyPlans.map(plan => (
                <Grid item xs={12} md={6} key={plan._id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{plan.subject}</Typography>
                      <Typography variant="subtitle1" color="textSecondary">{plan.topic}</Typography>
                      <Typography variant="body2" paragraph>{plan.description}</Typography>
                      <Typography variant="caption" display="block">Due: {new Date(plan.dueDate).toLocaleDateString()}</Typography>
                      <Typography variant="caption" display="block">Estimated hours: {plan.estimatedHours}</Typography>
                      <Chip label={plan.completed ? "Completed" : "In Progress"} color={plan.completed ? "success" : "primary"} size="small" />
                    </CardContent>
                    <CardActions>
                      {!plan.completed && (
                        <IconButton color="success" onClick={() => completeStudyPlan(plan._id)}>
                          <CheckCircleOutline />
                        </IconButton>
                      )}
                      <IconButton color="error" onClick={() => deleteStudyPlan(plan._id)}>
                        <DeleteOutline />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Mood Tracker */}
        {activeTab === 2 && (
          <Box sx={{ p: 2 }}>
            <Button variant="contained" sx={{ mb: 2 }} onClick={() => setMoodDialog(true)}>
              Log Today's Mood
            </Button>
            <Grid container spacing={2}>
              {moodEntries.map(entry => (
                <Grid item xs={12} sm={6} md={4} key={entry._id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {entry.mood === 'happy' && <SentimentVerySatisfied color="success" fontSize="large" />}
                        {entry.mood === 'neutral' && <SentimentSatisfied color="primary" fontSize="large" />}
                        {entry.mood === 'sad' && <SentimentDissatisfied color="error" fontSize="large" />}
                        {entry.mood === 'stressed' && <SentimentDissatisfied color="warning" fontSize="large" />}
                        {!['happy', 'neutral', 'sad', 'stressed'].includes(entry.mood) && (
                          <SentimentSatisfied color="disabled" fontSize="large" />
                        )}
                        <Typography sx={{ ml: 1 }}>{entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}</Typography>
                      </Box>
                      <Typography variant="body2">Energy Level: {entry.energy ?? '—'}</Typography>
                      <Typography variant="body2">Stress Level: {entry.stress ?? '—'}</Typography>
                      {entry.note && <Typography variant="body2">Notes: {entry.note}</Typography>}
                      <Typography variant="caption">{new Date(entry.createdAt).toLocaleString()}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Dialogs & Snackbar */}
      <Dialog open={studyPlanDialog} onClose={() => setStudyPlanDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Study Plan</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Subject" fullWidth value={newStudyPlan.subject} onChange={e => setNewStudyPlan({ ...newStudyPlan, subject: e.target.value })} />
            <TextField label="Topic" fullWidth value={newStudyPlan.topic} onChange={e => setNewStudyPlan({ ...newStudyPlan, topic: e.target.value })} />
            <TextField label="Description" fullWidth multiline rows={3} value={newStudyPlan.description} onChange={e => setNewStudyPlan({ ...newStudyPlan, description: e.target.value })} />
            <TextField label="Due Date" type="date" fullWidth value={newStudyPlan.dueDate} onChange={e => setNewStudyPlan({ ...newStudyPlan, dueDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Estimated Hours" type="number" fullWidth value={newStudyPlan.estimatedHours} onChange={e => setNewStudyPlan({ ...newStudyPlan, estimatedHours: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudyPlanDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitStudyPlan}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={moodDialog} onClose={() => setMoodDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Log Today's Mood</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Mood</InputLabel>
              <Select value={newMood.mood} onChange={e => setNewMood({ ...newMood, mood: e.target.value })}>
                <MenuItem value="happy">Happy 😊</MenuItem>
                <MenuItem value="neutral">Neutral 😐</MenuItem>
                <MenuItem value="sad">Sad 😢</MenuItem>
                <MenuItem value="stressed">Stressed 😰</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Energy Level" type="number" fullWidth value={newMood.energy} onChange={e => setNewMood({ ...newMood, energy: Number(e.target.value) })} />
            <TextField label="Stress Level" type="number" fullWidth value={newMood.stress} onChange={e => setNewMood({ ...newMood, stress: Number(e.target.value) })} />
            <TextField label="Notes" fullWidth multiline rows={3} value={newMood.note} onChange={e => setNewMood({ ...newMood, note: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoodDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitMood}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ open: false, message: '' })} message={snack.message} />
    </Container>
  );
};

export default StudentDashboard;
