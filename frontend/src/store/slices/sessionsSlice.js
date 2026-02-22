import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sessionsAPI } from '../../api/client';

export const fetchActiveSession = createAsyncThunk('sessions/fetchActive', async (_, { rejectWithValue }) => {
  try {
    const { data } = await sessionsAPI.getActive();
    return data.session;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки сессии');
  }
});

export const fetchSessionHistory = createAsyncThunk('sessions/fetchHistory', async (_, { rejectWithValue }) => {
  try {
    const { data } = await sessionsAPI.getHistory();
    return data.sessions;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки истории');
  }
});

export const startCharging = createAsyncThunk('sessions/start', async (params, { rejectWithValue }) => {
  try {
    const { data } = await sessionsAPI.start(params);
    return data.session;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Не удалось запустить зарядку');
  }
});

export const stopCharging = createAsyncThunk('sessions/stop', async (sessionId, { rejectWithValue }) => {
  try {
    const { data } = await sessionsAPI.stop(sessionId);
    return data.session;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Не удалось остановить зарядку');
  }
});

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState: {
    activeSession: null,
    history: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearSessionError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveSession.pending, (state) => { state.loading = true; })
      .addCase(fetchActiveSession.fulfilled, (state, action) => { state.loading = false; state.activeSession = action.payload; })
      .addCase(fetchActiveSession.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchSessionHistory.fulfilled, (state, action) => { state.history = action.payload; })
      .addCase(startCharging.fulfilled, (state, action) => { state.activeSession = action.payload; state.error = null; })
      .addCase(startCharging.rejected, (state, action) => { state.error = action.payload; })
      .addCase(stopCharging.fulfilled, (state, action) => { state.activeSession = null; })
      .addCase(stopCharging.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearSessionError } = sessionsSlice.actions;
export default sessionsSlice.reducer;
