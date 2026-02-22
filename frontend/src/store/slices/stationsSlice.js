import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { stationsAPI } from '../../api/client';

export const fetchStations = createAsyncThunk('stations/fetchAll', async (status, { rejectWithValue }) => {
  try {
    const { data } = await stationsAPI.list(status || undefined);
    return data.stations;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Не удалось загрузить станции');
  }
});

export const fetchStationDetail = createAsyncThunk('stations/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await stationsAPI.get(id);
    return data.station;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Станция не найдена');
  }
});

const stationsSlice = createSlice({
  name: 'stations',
  initialState: {
    list: [],
    currentStation: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentStation(state) { state.currentStation = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStations.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStations.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchStations.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchStationDetail.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStationDetail.fulfilled, (state, action) => { state.loading = false; state.currentStation = action.payload; })
      .addCase(fetchStationDetail.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearCurrentStation } = stationsSlice.actions;
export default stationsSlice.reducer;
