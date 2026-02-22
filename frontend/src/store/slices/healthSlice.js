import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../api/client';

export const checkHealth = createAsyncThunk('health/check', async (options, { rejectWithValue }) => {
  try {
    const params = options?.full ? { full: 'true' } : {};
    const { data } = await client.get('/health', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Сервис недоступен');
  }
});

const healthSlice = createSlice({
  name: 'health',
  initialState: {
    response: null,
    loading: false,
    error: null,
    lastChecked: null,
  },
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
        state.error = action.payload;
        state.lastChecked = new Date().toISOString();
      });
  },
});

export const { clearHealth } = healthSlice.actions;
export default healthSlice.reducer;
