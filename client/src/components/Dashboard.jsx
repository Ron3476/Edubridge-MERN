import React from 'react';
import { useSelector } from 'react-redux';
import AdminDashboard from './admin/AdminDashboard';
import TeacherDashboard from './teacher/TeacherDashboard';
import StudentDashboard from './student/StudentDashboard';
import ParentDashboard from './parent/ParentDashboard';
import { Box, CircularProgress } from '@mui/material';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  // The user object might not be available on the very first render
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'teacher':
      return <TeacherDashboard user={user} />;
    case 'student':
      return <StudentDashboard user={user} />;
    case 'parent':
      return <ParentDashboard user={user} />;
    default:
      return <p>Role not recognized. Please contact admin.</p>;
  }
};

export default Dashboard;
