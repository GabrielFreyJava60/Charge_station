import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { techSupportAPI } from '@/api/client';
import { ErrorLog, TechSupportStats, ErrorFilters } from '@/types';

interface TechSupportState {
  errors: ErrorLog[];
  stats: TechSupportStats | null;
  loading: boolean;
  error: string | null;
}

export const fetchErrors = createAsyncThunk<ErrorLog[], ErrorFilters | undefined, { rejectValue: string }>(
  'techSupport/fetchErrors',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await techSupportAPI.getErrors(params);
      return data.errors;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки логов');
    }
  },
);

export const fetchStats = createAsyncThunk<TechSupportStats, void, { rejectValue: string }>(
  'techSupport/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await techSupportAPI.getStats();
      return data.stats;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки статистики');
    }
  },
);

const initialState: TechSupportState = {
  errors: [],
  stats: null,
  loading: false,
  error: null,
};

const techSupportSlice = createSlice({
  name: 'techSupport',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchErrors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchErrors.fulfilled, (state, action) => {
        state.loading = false;
        state.errors = action.payload;
      })
      .addCase(fetchErrors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export default techSupportSlice.reducer;
