import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#00d4ff',
      light: '#5dffff',
      dark: '#00a3cc',
      contrastText: '#fff',
    },
    secondary: {
      main: '#9d4edd',
      light: '#c77dff',
      dark: '#7209b7',
      contrastText: '#fff',
    },
    background: {
      default: '#f8fafc',
      paper: 'rgba(255, 255, 255, 0.8)',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
    },
    success: {
      main: '#00ff88',
      light: '#5dffaa',
      dark: '#00cc6a',
    },
    warning: {
      main: '#ffb800',
      light: '#ffd54f',
      dark: '#ff8f00',
    },
    error: {
      main: '#ff006e',
      light: '#ff4d9a',
      dark: '#cc0058',
    },
    info: {
      main: '#00d4ff',
      light: '#5dffff',
      dark: '#00a3cc',
    },
  },
  typography: {
    fontFamily: ['Inter', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'].join(','),
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
      background: 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '0em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.5px',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e0 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2), 0 0 40px rgba(157, 78, 221, 0.15)',
          borderBottom: '2px solid rgba(0, 212, 255, 0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px rgba(0, 212, 255, 0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15), 0 0 30px rgba(0, 212, 255, 0.1)',
            borderColor: 'rgba(0, 212, 255, 0.3)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          textTransform: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(0, 212, 255, 0.4), 0 0 20px rgba(157, 78, 221, 0.2)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5dffff 0%, #c77dff 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 32px rgba(0, 212, 255, 0.5), 0 0 30px rgba(157, 78, 221, 0.3)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #9d4edd 0%, #7209b7 100%)',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(157, 78, 221, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #c77dff 0%, #9d4edd 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 32px rgba(157, 78, 221, 0.5)',
          },
        },
        outlined: {
          borderColor: 'rgba(0, 212, 255, 0.5)',
          color: '#00d4ff',
          '&:hover': {
            borderColor: '#00d4ff',
            background: 'rgba(0, 212, 255, 0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 255, 0.1)',
          borderRadius: 20,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-6px) scale(1.02)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 40px rgba(0, 212, 255, 0.2)',
            borderColor: 'rgba(0, 212, 255, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.5)',
            '& fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00d4ff',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#4a5568',
            '&.Mui-focused': {
              color: '#00d4ff',
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: '#4a5568',
          fontWeight: 600,
          textTransform: 'none',
          '&.Mui-selected': {
            color: '#00d4ff',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)',
          height: 3,
          borderRadius: 3,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          background: 'rgba(0, 212, 255, 0.1)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          color: '#00d4ff',
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), 0 0 40px rgba(0, 212, 255, 0.1)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            background: 'rgba(0, 212, 255, 0.1)',
            color: '#00d4ff',
            fontWeight: 600,
            borderBottom: '2px solid rgba(0, 212, 255, 0.3)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 212, 255, 0.1)',
          color: '#1a202c',
        },
      },
    },
  },
});

export default theme;
