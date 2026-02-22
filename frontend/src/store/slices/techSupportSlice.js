import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { techSupportAPI } from '../../api/client';

export const fetchErrors = createAsyncThunk('techSupport/fetchErrors', async (params, { rejectWithValue }) => {
  try {
    const { data } = await techSupportAPI.getErrors(params);
    return data.errors;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки логов');
  }
});

export const fetchStats = createAsyncThunk('techSupport/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const { data } = await techSupportAPI.getStats();
    return data.stats;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки статистики');
  }
});

const techSupportSlice = createSlice({
  name: 'techSupport',
  initialState: {
    errors: [],
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchErrors.pending, (state) => { state.loading = true; })
      .addCase(fetchErrors.fulfilled, (state, action) => { state.loading = false; state.errors = action.payload; })
      .addCase(fetchErrors.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchStats.fulfilled, (state, action) => { state.stats = action.payload; });
  },
});

export default techSupportSlice.reducer;
