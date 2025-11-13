import { createSlice } from '@reduxjs/toolkit';

// Helper to get initial state from localStorage
const getInitialState = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    return {
      user: user || null,
      token: token || null,
      isAuthenticated: !!(user && token),
    };
  } catch {
    return { user: null, token: null, isAuthenticated: false };
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setCredentials(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.clear();
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;