import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { stationsAPI } from '@/api/client';
import { Station } from '@/types';

interface StationsState {
  list: Station[];
  currentStation: Station | null;
  loading: boolean;
  error: string | null;
}

export const fetchStations = createAsyncThunk<Station[], string | undefined, { rejectValue: string }>(
  'stations/fetchAll',
  async (status, { rejectWithValue }) => {
    try {
      const { data } = await stationsAPI.list(status || undefined);
      return data.stations;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Не удалось загрузить станции');
    }
  },
);

export const fetchStationDetail = createAsyncThunk<Station, string, { rejectValue: string }>(
  'stations/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await stationsAPI.get(id);
      return data.station;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Станция не найдена');
    }
  },
);

const initialState: StationsState = {
  list: [],
  currentStation: null,
  loading: false,
  error: null,
};

const stationsSlice = createSlice({
  name: 'stations',
  initialState,
  reducers: {
    clearCurrentStation(state) {
      state.currentStation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchStations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      })
      .addCase(fetchStationDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStationDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentStation = action.payload;
      })
      .addCase(fetchStationDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export const { clearCurrentStation } = stationsSlice.actions;
export default stationsSlice.reducer;
