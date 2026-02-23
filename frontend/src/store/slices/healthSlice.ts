import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '@/api/client';
import { HealthResponse } from '@/types';

interface HealthCheckOptions {
  full?: boolean;
}

interface HealthState {
  response: HealthResponse | null;
  loading: boolean;
  error: string | null;
  lastChecked: string | null;
}

export const checkHealth = createAsyncThunk<HealthResponse, HealthCheckOptions | undefined, { rejectValue: string }>(
  'health/check',
  async (options, { rejectWithValue }) => {
    try {
      const params = options?.full ? { full: 'true' } : {};
      const { data } = await client.get('/health', { params });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Сервис недоступен');
    }
  },
);

const initialState: HealthState = {
  response: null,
  loading: false,
  error: null,
  lastChecked: null,
};

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    clearHealth(state) {
      state.response = null;
      state.error = null;
      state.lastChecked = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkHealth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkHealth.fulfilled, (state, action) => {
        state.loading = false;
        state.response = action.payload;
        state.lastChecked = new Date().toISOString();
      })
      .addCase(checkHealth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
        state.lastChecked = new Date().toISOString();
      });
  },
});

export const { clearHealth } = healthSlice.actions;
export default healthSlice.reducer;
