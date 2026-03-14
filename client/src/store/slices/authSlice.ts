import { createSlice } from '@reduxjs/toolkit';

export type Role = 'Student' | 'Faculty' | 'Coach' | 'Admin';

export interface User {
  id: string;
  fastId: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: { payload: { user: User; accessToken: string } }) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    setAccessToken: (state, action: { payload: string }) => {
      state.accessToken = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setUser: (state, action: { payload: User | null }) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
    updateUser: (state, action: { payload: Partial<User> }) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
});

export const { setCredentials, setAccessToken, setUser, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
