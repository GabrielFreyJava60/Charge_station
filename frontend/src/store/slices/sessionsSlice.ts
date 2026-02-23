import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sessionsAPI } from '@/api/client';
import { Session, StartChargingParams } from '@/types';

interface SessionsState {
  activeSession: Session | null;
  history: Session[];
  loading: boolean;
  error: string | null;
}

export const fetchActiveSession = createAsyncThunk<Session | null, void, { rejectValue: string }>(
  'sessions/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await sessionsAPI.getActive();
      return data.session;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки сессии');
    }
  },
);

export const fetchSessionHistory = createAsyncThunk<Session[], void, { rejectValue: string }>(
  'sessions/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await sessionsAPI.getHistory();
      return data.sessions;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки истории');
    }
  },
);

export const startCharging = createAsyncThunk<Session, StartChargingParams, { rejectValue: string }>(
  'sessions/start',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await sessionsAPI.start(params);
      return data.session;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Не удалось запустить зарядку');
    }
  },
);

export const stopCharging = createAsyncThunk<Session, string, { rejectValue: string }>(
  'sessions/stop',
  async (sessionId, { rejectWithValue }) => {
    try {
      const { data } = await sessionsAPI.stop(sessionId);
      return data.session;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Не удалось остановить зарядку');
    }
  },
);

const initialState: SessionsState = {
  activeSession: null,
  history: [],
  loading: false,
  error: null,
};

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    clearSessionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveSession.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = action.payload;
      })
      .addCase(fetchActiveSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      })
      .addCase(fetchSessionHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })
      .addCase(startCharging.fulfilled, (state, action) => {
        state.activeSession = action.payload;
        state.error = null;
      })
      .addCase(startCharging.rejected, (state, action) => {
        state.error = action.payload ?? 'Unknown error';
      })
      .addCase(stopCharging.fulfilled, (state) => {
        state.activeSession = null;
      })
      .addCase(stopCharging.rejected, (state, action) => {
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export const { clearSessionError } = sessionsSlice.actions;
export default sessionsSlice.reducer;
