import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '@/api/client';
import { User } from '@/types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface LoginResponse {
  userId: string;
  email: string;
  role: User['role'];
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
}

export const loginUser = createAsyncThunk<LoginResponse, LoginCredentials, { rejectValue: string }>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('accessToken', data.accessToken || data.idToken);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Ошибка входа');
    }
  },
);

export const registerUser = createAsyncThunk<unknown, Record<string, unknown>, { rejectValue: string }>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.register(userData);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Ошибка регистрации');
    }
  },
);

const saved = localStorage.getItem('user');

const initialState: AuthState = {
  user: saved ? (JSON.parse(saved) as User) : null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false;
        state.user = {
          userId: action.payload.userId,
          email: action.payload.email,
          role: action.payload.role,
        };
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
