import axios from 'axios';

// Use environment variables for the API URL
// Base URL should be just the API base (e.g., http://localhost:5000/api)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Auth endpoints are under /api/auth
const AUTH_API_URL = `${API_BASE_URL}/auth`;

/**
 * Handles the authentication process (login or register).
 * @param {string} endpoint - The API endpoint ('login' or 'register').
 * @param {object} formData - The user's form data.
 * @returns {Promise<object>} The user data from the API response.
 * @throws {Error} If the API call fails.
 */
const authenticate = async (endpoint, formData) => {
  try {
    const response = await axios.post(`${AUTH_API_URL}/${endpoint}`, formData);

    if (response.data.token && response.data.user) {
      return response.data;
    } else {
      throw new Error('Invalid response from server.');
    }
  } catch (err) {
    // If the server responded with an error, use its message
    if (err.response && err.response.data && err.response.data.error) {
      throw new Error(err.response.data.error);
    }
    // If it's a network error (server down, CORS, etc.)
    if (err.request) {
      throw new Error('Network Error: Could not connect to the server. Is it running?');
    }
    // For other types of errors
    throw new Error(`An unexpected error occurred during ${endpoint}.`);
  }
};

export default authenticate;