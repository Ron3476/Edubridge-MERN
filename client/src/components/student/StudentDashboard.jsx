import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Card, CardContent,
  CardActions, LinearProgress, Chip, Stack, Button, Tab, Tabs,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Checkbox
} from '@mui/material';
import {
  SentimentVerySatisfied, SentimentSatisfied, SentimentDissatisfied,
  DeleteOutline, CheckCircleOutline, School, Timeline, EmojiEmotions,
  Style, Add, NavigateNext, NavigateBefore, EventNote, CheckCircle, Cancel, Schedule, Block
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
  const [flashcards, setFlashcards] = useState([]);
  const [moodRecommendations, setMoodRecommendations] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [studyPlanDialog, setStudyPlanDialog] = useState(false);
  const [moodDialog, setMoodDialog] = useState(false);
  const [flashcardDialog, setFlashcardDialog] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '' });
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedMoodEntries, setSelectedMoodEntries] = useState([]);
  const [selectedFlashcards, setSelectedFlashcards] = useState([]);

  const [newStudyPlan, setNewStudyPlan] = useState({
    subject: '', topic: '', description: '', dueDate: '', estimatedHours: ''
  });

  const [newMood, setNewMood] = useState({
    mood: 'happy', energy: 5, stress: 1, note: ''
  });

  const [newFlashcard, setNewFlashcard] = useState({
    studyPlanId: '', question: '', answer: '', difficulty: 'medium'
  });

  useEffect(() => { fetchStudentData(); }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [marksRes, plansRes, moodRes, flashcardsRes, attendanceRes, attendanceStatsRes] = await Promise.all([
        api.get('/students/marks').catch(err => ({ data: [] })),
        api.get('/students/study-plans').catch(err => ({ data: [] })),
        api.get('/students/mood-entries').catch(err => ({ data: [] })),
        api.get('/students/flashcards').catch(err => ({ data: [] })),
        api.get('/students/attendance').catch(err => ({ data: [] })),
        api.get('/students/attendance/stats').catch(err => ({ data: [] }))
      ]);

      setMarks(marksRes.data || []);
      setStudyPlans(plansRes.data || []);
      const newMoodEntries = moodRes.data || [];
      const newFlashcards = flashcardsRes.data || [];
      setMoodEntries(newMoodEntries);
      setFlashcards(newFlashcards);
      setAttendance(attendanceRes.data || []);
      setAttendanceStats(attendanceStatsRes.data || []);
      
      // Clear selections for items that no longer exist
      setSelectedMoodEntries(prev => prev.filter(id => newMoodEntries.some(e => e._id === id)));
      setSelectedFlashcards(prev => prev.filter(id => newFlashcards.some(c => c._id === id)));

      // Fetch recommendations for all mood entries
      if (moodRes.data && moodRes.data.length > 0) {
        const recommendationsMap = {};
        await Promise.all(
          moodRes.data.map(async (entry) => {
            try {
              const recRes = await api.get(`/students/mood-entries/${entry._id}/recommendations`);
              recommendationsMap[entry._id] = recRes.data || [];
            } catch (err) {
              recommendationsMap[entry._id] = [];
            }
          })
        );
        setMoodRecommendations(recommendationsMap);
      }

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
      const response = await api.post('/students/mood-entries', newMood);
      setSnack({ open: true, message: 'Mood logged! Check your recommendations below.' });
      setMoodDialog(false);
      setNewMood({ mood: 'happy', energy: 5, stress: 1, note: '' });
      
      // Fetch recommendations for the new entry
      if (response.data && response.data._id) {
        try {
          const recRes = await api.get(`/students/mood-entries/${response.data._id}/recommendations`);
          setMoodRecommendations(prev => ({
            ...prev,
            [response.data._id]: recRes.data || []
          }));
        } catch (err) {
          console.error('Error fetching recommendations:', err);
        }
      }
      
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

  const submitFlashcard = async () => {
    try {
      if (!newFlashcard.studyPlanId || !newFlashcard.question || !newFlashcard.answer) {
        setSnack({ open: true, message: 'Please fill in all required fields' });
        return;
      }
      await api.post('/students/flashcards', newFlashcard);
      setSnack({ open: true, message: 'Flashcard created!' });
      setFlashcardDialog(false);
      setNewFlashcard({ studyPlanId: '', question: '', answer: '', difficulty: 'medium' });
      fetchStudentData();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to create flashcard' });
    }
  };

  const deleteFlashcard = async (cardId) => {
    try {
      await api.delete(`/students/flashcards/${cardId}`);
      setSnack({ open: true, message: 'Flashcard deleted' });
      fetchStudentData();
      if (currentCardIndex >= flashcards.length - 1 && currentCardIndex > 0) {
        setCurrentCardIndex(currentCardIndex - 1);
      }
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to delete flashcard' });
    }
  };

  const deleteMoodEntry = async (entryId) => {
    try {
      await api.delete(`/students/mood-entries/${entryId}`);
      setSnack({ open: true, message: 'Mood entry deleted' });
      // Remove from local state
      setMoodRecommendations(prev => {
        const newRecs = { ...prev };
        delete newRecs[entryId];
        return newRecs;
      });
      fetchStudentData();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to delete mood entry' });
    }
  };

  const deleteMultipleMoodEntries = async () => {
    if (selectedMoodEntries.length === 0) return;
    
    try {
      await Promise.all(
        selectedMoodEntries.map(id => api.delete(`/students/mood-entries/${id}`))
      );
      setSnack({ open: true, message: `${selectedMoodEntries.length} mood entr${selectedMoodEntries.length > 1 ? 'ies' : 'y'} deleted` });
      setSelectedMoodEntries([]);
      // Clean up recommendations from state
      setMoodRecommendations(prev => {
        const newRecs = { ...prev };
        selectedMoodEntries.forEach(id => delete newRecs[id]);
        return newRecs;
      });
      fetchStudentData();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to delete mood entries' });
    }
  };

  const deleteMultipleFlashcards = async () => {
    if (selectedFlashcards.length === 0) return;
    
    try {
      await Promise.all(
        selectedFlashcards.map(id => api.delete(`/students/flashcards/${id}`))
      );
      setSnack({ open: true, message: `${selectedFlashcards.length} flashcard${selectedFlashcards.length > 1 ? 's' : ''} deleted` });
      setSelectedFlashcards([]);
      // Adjust current card index if needed
      if (currentCardIndex >= flashcards.length - selectedFlashcards.length && currentCardIndex > 0) {
        setCurrentCardIndex(Math.max(0, currentCardIndex - selectedFlashcards.length));
      }
      fetchStudentData();
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.error || 'Failed to delete flashcards' });
    }
  };

  const handleMoodEntrySelect = (entryId) => {
    setSelectedMoodEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleFlashcardSelect = (cardId) => {
    setSelectedFlashcards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleSelectAllMoodEntries = () => {
    if (selectedMoodEntries.length === moodEntries.length) {
      setSelectedMoodEntries([]);
    } else {
      setSelectedMoodEntries(moodEntries.map(e => e._id));
    }
  };

  const handleSelectAllFlashcards = () => {
    if (selectedFlashcards.length === flashcards.length) {
      setSelectedFlashcards([]);
    } else {
      setSelectedFlashcards(flashcards.map(c => c._id));
    }
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
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
          <Box sx={{ height: 300, position: 'relative' }}>
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
          </Box>
        </Grid>

        {/* Bar Chart - Subject Performance */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Performance by Subject</Typography>
          <Box sx={{ height: 300, position: 'relative' }}>
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
          </Box>
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
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmojiEmotions color="success" />
            <Box>
              <Typography variant="h4">{moodEntries.length}</Typography>
              <Typography variant="body2" color="textSecondary">Mood Entries</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Style color="warning" />
            <Box>
              <Typography variant="h4">{flashcards.length}</Typography>
              <Typography variant="body2" color="textSecondary">Flashcards</Typography>
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
          <Tab label="Flashcards" />
        </Tabs>

        {/* Academic Progress */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Graph Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Academic Performance Overview</Typography>
              {marks.length > 0 && getTermsFromMarks().length > 0 ? (
                <Box sx={{ mt: 2 }}>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Button variant="contained" onClick={() => setMoodDialog(true)}>
                Log Today's Mood
              </Button>
              {moodEntries.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Checkbox
                    checked={selectedMoodEntries.length === moodEntries.length && moodEntries.length > 0}
                    indeterminate={selectedMoodEntries.length > 0 && selectedMoodEntries.length < moodEntries.length}
                    onChange={handleSelectAllMoodEntries}
                  />
                  <Typography variant="body2">
                    {selectedMoodEntries.length > 0 ? `${selectedMoodEntries.length} selected` : 'Select all'}
                  </Typography>
                  {selectedMoodEntries.length > 0 && (
                    <Button 
                      variant="outlined" 
                      color="error" 
                      startIcon={<DeleteOutline />}
                      onClick={() => {
                        if (window.confirm(`Delete ${selectedMoodEntries.length} mood entr${selectedMoodEntries.length > 1 ? 'ies' : 'y'}?`)) {
                          deleteMultipleMoodEntries();
                        }
                      }}
                    >
                      Delete Selected ({selectedMoodEntries.length})
                    </Button>
                  )}
                </Box>
              )}
            </Box>
            <Grid container spacing={2}>
              {moodEntries.map(entry => {
                const recommendations = moodRecommendations[entry._id] || [];
                return (
                  <Grid item xs={12} sm={6} md={4} key={entry._id}>
                    <Card sx={{ border: selectedMoodEntries.includes(entry._id) ? 2 : 0, borderColor: 'primary.main' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Checkbox
                              checked={selectedMoodEntries.includes(entry._id)}
                              onChange={() => handleMoodEntrySelect(entry._id)}
                              size="small"
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {entry.mood === 'happy' && <SentimentVerySatisfied color="success" fontSize="large" />}
                              {entry.mood === 'neutral' && <SentimentSatisfied color="primary" fontSize="large" />}
                              {entry.mood === 'sad' && <SentimentDissatisfied color="error" fontSize="large" />}
                              {entry.mood === 'stressed' && <SentimentDissatisfied color="warning" fontSize="large" />}
                              {!['happy', 'neutral', 'sad', 'stressed'].includes(entry.mood) && (
                                <SentimentSatisfied color="disabled" fontSize="large" />
                              )}
                              <Typography sx={{ ml: 1 }}>{entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}</Typography>
                            </Box>
                          </Box>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => {
                              if (window.confirm('Delete this mood entry?')) {
                                deleteMoodEntry(entry._id);
                              }
                            }}
                          >
                            <DeleteOutline />
                          </IconButton>
                        </Box>
                        <Typography variant="body2">Energy Level: {entry.energy ?? '—'}/10</Typography>
                        <Typography variant="body2">Stress Level: {entry.stress ?? '—'}/10</Typography>
                        {entry.note && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Note:</strong> {entry.note}
                          </Typography>
                        )}
                        <Typography variant="caption" display="block" sx={{ mt: 1, mb: 1 }}>
                          {new Date(entry.createdAt).toLocaleString()}
                        </Typography>
                        
                        {/* Recommendations Section */}
                        {recommendations.length > 0 && (
                          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              💡 Recommendations
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {recommendations.map((rec, idx) => (
                                <Box key={idx} sx={{ mb: 1.5 }}>
                                  <Chip 
                                    label={rec.category || 'General'} 
                                    size="small" 
                                    sx={{ mb: 0.5 }}
                                    color={
                                      rec.category === 'Stress Relief' ? 'error' :
                                      rec.category === 'Energy Boost' ? 'warning' :
                                      rec.category === 'Support' ? 'error' :
                                      'primary'
                                    }
                                  />
                                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                    {rec.recommendation}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            {moodEntries.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <EmojiEmotions sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>No Mood Entries Yet</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Start tracking your mood to get personalized study and wellbeing recommendations!
                </Typography>
                <Button variant="contained" onClick={() => setMoodDialog(true)}>
                  Log Your First Mood
                </Button>
              </Paper>
            )}
          </Box>
        )}

        {/* Flashcards */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Study with Flashcards</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {flashcards.length > 0 && (
                  <>
                    <Checkbox
                      checked={selectedFlashcards.length === flashcards.length && flashcards.length > 0}
                      indeterminate={selectedFlashcards.length > 0 && selectedFlashcards.length < flashcards.length}
                      onChange={handleSelectAllFlashcards}
                    />
                    <Typography variant="body2">
                      {selectedFlashcards.length > 0 ? `${selectedFlashcards.length} selected` : 'Select all'}
                    </Typography>
                    {selectedFlashcards.length > 0 && (
                      <Button 
                        variant="outlined" 
                        color="error" 
                        startIcon={<DeleteOutline />}
                        onClick={() => {
                          if (window.confirm(`Delete ${selectedFlashcards.length} flashcard${selectedFlashcards.length > 1 ? 's' : ''}?`)) {
                            deleteMultipleFlashcards();
                          }
                        }}
                      >
                        Delete Selected ({selectedFlashcards.length})
                      </Button>
                    )}
                  </>
                )}
                <Button variant="contained" startIcon={<Add />} onClick={() => setFlashcardDialog(true)}>
                  Create Flashcard
                </Button>
              </Box>
            </Box>

            {flashcards.length > 0 ? (
              <Box>
                {/* Flashcard Study View */}
                <Paper 
                  sx={{ 
                    p: 4, 
                    mb: 3, 
                    minHeight: 300, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    perspective: '1000px',
                    '&:hover': { boxShadow: 6 }
                  }}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <Box sx={{ 
                    textAlign: 'center',
                    width: '100%',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.6s',
                    backfaceVisibility: 'hidden',
                    display: isFlipped ? 'none' : 'block'
                  }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      Question
                    </Typography>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                      {flashcards[currentCardIndex]?.question}
                    </Typography>
                    <Chip 
                      label={flashcards[currentCardIndex]?.studyPlanId?.subject || 'N/A'} 
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label={flashcards[currentCardIndex]?.difficulty || 'medium'} 
                      size="small" 
                      color={flashcards[currentCardIndex]?.difficulty === 'easy' ? 'success' : flashcards[currentCardIndex]?.difficulty === 'hard' ? 'error' : 'warning'}
                    />
                  </Box>
                  <Box sx={{ 
                    textAlign: 'center',
                    width: '100%',
                    transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.6s',
                    backfaceVisibility: 'hidden',
                    display: isFlipped ? 'block' : 'none'
                  }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      Answer
                    </Typography>
                    <Typography variant="h5">
                      {flashcards[currentCardIndex]?.answer}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ position: 'absolute', bottom: 16, right: 16 }}>
                    Click to flip
                  </Typography>
                </Paper>

                {/* Navigation Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Button 
                    startIcon={<NavigateBefore />} 
                    onClick={prevCard}
                    disabled={currentCardIndex === 0}
                  >
                    Previous
                  </Button>
                  <Typography variant="body1">
                    Card {currentCardIndex + 1} of {flashcards.length}
                  </Typography>
                  <Button 
                    endIcon={<NavigateNext />} 
                    onClick={nextCard}
                    disabled={currentCardIndex === flashcards.length - 1}
                  >
                    Next
                  </Button>
                </Box>

                {/* All Flashcards List */}
                <Typography variant="h6" gutterBottom>All Flashcards</Typography>
                <Grid container spacing={2}>
                  {flashcards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={4} key={card._id}>
                      <Card sx={{ border: selectedFlashcards.includes(card._id) ? 2 : 0, borderColor: 'primary.main' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Checkbox
                                checked={selectedFlashcards.includes(card._id)}
                                onChange={() => handleFlashcardSelect(card._id)}
                                size="small"
                              />
                              <Chip 
                                label={card.studyPlanId?.subject || 'N/A'} 
                                size="small" 
                                sx={{ mr: 1 }}
                              />
                              <Chip 
                                label={card.difficulty || 'medium'} 
                                size="small" 
                                color={card.difficulty === 'easy' ? 'success' : card.difficulty === 'hard' ? 'error' : 'warning'}
                              />
                            </Box>
                          </Box>
                          <Typography variant="subtitle2" gutterBottom>Question:</Typography>
                          <Typography variant="body2" paragraph>{card.question}</Typography>
                          <Typography variant="subtitle2" gutterBottom>Answer:</Typography>
                          <Typography variant="body2" paragraph>{card.answer}</Typography>
                          <Button 
                            size="small" 
                            color="error" 
                            startIcon={<DeleteOutline />}
                            onClick={() => {
                              if (window.confirm('Delete this flashcard?')) {
                                deleteFlashcard(card._id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                          <Button 
                            size="small" 
                            sx={{ ml: 1 }}
                            onClick={() => {
                              setCurrentCardIndex(index);
                              setIsFlipped(false);
                            }}
                          >
                            Study This
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Style sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>No Flashcards Yet</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Create flashcards from your study plans to help you memorize key concepts!
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setFlashcardDialog(true)}>
                  Create Your First Flashcard
                </Button>
              </Paper>
            )}
          </Box>
        )}

        {/* Attendance Tab */}
        {activeTab === 4 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>My Attendance</Typography>
            
            {/* Attendance Statistics */}
            {attendanceStats.length > 0 && (
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Attendance by Subject</Typography>
                <Grid container spacing={2}>
                  {attendanceStats.map((stat) => (
                    <Grid item xs={12} sm={6} md={4} key={stat.subjectId}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>{stat.subject?.name || 'N/A'}</Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Total:</Typography>
                            <Typography variant="body2" fontWeight="bold">{stat.total}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="success.main">Present:</Typography>
                            <Typography variant="body2" fontWeight="bold">{stat.present}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="error.main">Absent:</Typography>
                            <Typography variant="body2" fontWeight="bold">{stat.absent}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="warning.main">Late:</Typography>
                            <Typography variant="body2" fontWeight="bold">{stat.late}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="body2" color="info.main">Excused:</Typography>
                            <Typography variant="body2" fontWeight="bold">{stat.excused}</Typography>
                          </Box>
                          <Chip 
                            label={`${stat.attendanceRate}% Attendance Rate`}
                            color={parseFloat(stat.attendanceRate) >= 80 ? 'success' : parseFloat(stat.attendanceRate) >= 60 ? 'warning' : 'error'}
                            sx={{ width: '100%' }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* Attendance Records */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>Attendance Records</Typography>
            {attendance.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <EventNote sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>No Attendance Records Yet</Typography>
                <Typography variant="body2" color="text.secondary">
                  Your attendance will appear here once your teachers start marking it.
                </Typography>
              </Paper>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Term</TableCell>
                      <TableCell>Marked By</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.map((record) => {
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
                      return (
                        <TableRow key={record._id}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
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
                          <TableCell>{record.markedBy?.name || 'N/A'}</TableCell>
                          <TableCell>{record.notes || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
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

      <Dialog open={flashcardDialog} onClose={() => setFlashcardDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Flashcard</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Study Plan</InputLabel>
              <Select 
                value={newFlashcard.studyPlanId} 
                label="Study Plan"
                onChange={e => setNewFlashcard({ ...newFlashcard, studyPlanId: e.target.value })}
              >
                {studyPlans.map(plan => (
                  <MenuItem key={plan._id} value={plan._id}>
                    {plan.subject} - {plan.topic}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField 
              label="Question" 
              fullWidth 
              multiline 
              rows={2}
              value={newFlashcard.question} 
              onChange={e => setNewFlashcard({ ...newFlashcard, question: e.target.value })} 
            />
            <TextField 
              label="Answer" 
              fullWidth 
              multiline 
              rows={3}
              value={newFlashcard.answer} 
              onChange={e => setNewFlashcard({ ...newFlashcard, answer: e.target.value })} 
            />
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select 
                value={newFlashcard.difficulty} 
                label="Difficulty"
                onChange={e => setNewFlashcard({ ...newFlashcard, difficulty: e.target.value })}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlashcardDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitFlashcard}>Create</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ open: false, message: '' })} message={snack.message} />
    </Container>
  );
};

export default StudentDashboard;
