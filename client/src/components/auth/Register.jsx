import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import authenticate from '../../authService.js';
import { setCredentials } from '../../store/slices/authSlice.js';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material';

const Register = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    admissionNumber: '',
    level: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError('');
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setLoading(true);

    // Create a clean copy of the data to send to the server
    const dataToSend = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };

    // Only include student-specific fields if the role is 'student'
    if (formData.role === 'student') {
      dataToSend.admissionNumber = formData.admissionNumber;
      dataToSend.level = formData.level;
    }

    try {
      const data = await authenticate('register', dataToSend);
      dispatch(setCredentials(data));
      // The navigation will be handled by the main App component now
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={6} sx={{ p: 4, mt: 8 }}>
        <Typography component="h1" variant="h5" align="center">
          Register
        </Typography>
        {error && (
          <Typography color="error" align="center" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange}
          />
          <TextField
            select
            margin="normal"
            required
            fullWidth
            name="role"
            label="Role"
            value={formData.role}
            onChange={handleChange}
          >
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="teacher">Teacher</MenuItem>
            <MenuItem value="parent">Parent</MenuItem>
          </TextField>

          {formData.role === 'student' && (
            <React.Fragment>
              <TextField
                margin="normal"
                required
                fullWidth
                name="admissionNumber"
                label="Admission Number"
                value={formData.admissionNumber}
                onChange={handleChange}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Level</InputLabel>
                <Select
                  name="level"
                  value={formData.level}
                  label="Level"
                  onChange={handleChange}
                >
                  <MenuItem value="Junior Secondary School">Junior Secondary School</MenuItem>
                  <MenuItem value="Senior Secondary School">Senior Secondary School</MenuItem>
                </Select>
              </FormControl>
            </React.Fragment>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Register'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;