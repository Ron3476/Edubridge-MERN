import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

const Navbar = ({ user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    navigate('/login');
  };

  // Navbar for non-logged-in users
  if (!user) {
    return (
      <AppBar position="static" sx={{ 
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2), 0 0 40px rgba(157, 78, 221, 0.15)',
        borderBottom: '2px solid rgba(0, 212, 255, 0.3)'
      }}>
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              background: 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 800,
              fontSize: '1.5rem',
              letterSpacing: '-0.02em'
            }}
          >
            EduBridge
          </Typography>
          <Button
            variant="outlined"
            sx={{ 
              color: '#00d4ff', 
              borderColor: 'rgba(0, 212, 255, 0.5)', 
              mr: 1,
              '&:hover': {
                borderColor: '#00d4ff',
                background: 'rgba(0, 212, 255, 0.1)',
                transform: 'translateY(-2px)'
              }
            }}
            component={Link}
            to="/login"
          >
            Login
          </Button>
          <Button 
            variant="contained" 
            sx={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)',
              color: '#000',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #5dffff 0%, #c77dff 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 32px rgba(0, 212, 255, 0.5)'
              }
            }}
            component={Link} 
            to="/register"
          >
            Register
          </Button>
        </Toolbar>
      </AppBar>
    );
  }

  // Navbar for logged-in users (safe with optional chaining)
  return (
    <AppBar position="static" sx={{ 
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2), 0 0 40px rgba(157, 78, 221, 0.15)',
      borderBottom: '2px solid rgba(0, 212, 255, 0.3)'
    }}>
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            background: 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 800,
            fontSize: '1.5rem',
            letterSpacing: '-0.02em'
          }}
        >
          EduBridge
        </Typography>
        <Box>
          <IconButton 
            size="large" 
            onClick={handleMenu} 
            sx={{ 
              color: '#00d4ff',
              '&:hover': {
                background: 'rgba(0, 212, 255, 0.1)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <AccountCircle sx={{ 
              filter: 'drop-shadow(0 0 10px rgba(0,212,255,0.6))',
              fontSize: '2rem'
            }} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), 0 0 40px rgba(0, 212, 255, 0.1)',
                color: '#1a202c',
                mt: 1,
                '& .MuiMenuItem-root': {
                  '&:hover': {
                    background: 'rgba(0, 212, 255, 0.1)',
                    color: '#00d4ff'
                  }
                }
              }
            }}
          >
            <MenuItem component={Link} to="/">Dashboard</MenuItem>
            {user?.role === 'student' && (
              <>
                <MenuItem component={Link} to="/notes">Notes</MenuItem>
                <MenuItem component={Link} to="/study-plans">Study Plans</MenuItem>
                <MenuItem component={Link} to="/mood">Mood Tracker</MenuItem>
              </>
            )}
            {user?.role === 'teacher' && (
              <>
                <MenuItem component={Link} to="/manage-marks">Manage Marks</MenuItem>
                <MenuItem component={Link} to="/reports">Reports</MenuItem>
              </>
            )}
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
