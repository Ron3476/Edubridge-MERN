import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/theme.css'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import store from './store'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './styles/muiTheme'
import ErrorBoundary from './components/ErrorBoundary'

// Suppress extension-related errors in console
const originalError = console.error;
console.error = (...args) => {
  const errorMessage = args[0]?.toString() || '';
  // Filter out common browser extension errors
  if (
    errorMessage.includes('message channel closed') ||
    errorMessage.includes('Extension context invalidated') ||
    errorMessage.includes('chrome-extension://')
  ) {
    return; // Suppress these errors
  }
  originalError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
          </ThemeProvider>
        </Provider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)