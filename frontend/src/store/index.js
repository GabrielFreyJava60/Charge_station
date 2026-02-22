import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import stationsReducer from './slices/stationsSlice';
import sessionsReducer from './slices/sessionsSlice';
import healthReducer from './slices/healthSlice';
import adminReducer from './slices/adminSlice';
import techSupportReducer from './slices/techSupportSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    stations: stationsReducer,
    sessions: sessionsReducer,
    health: healthReducer,
    admin: adminReducer,
    techSupport: techSupportReducer,
  },
  devTools: import.meta.env.DEV,
});

export default store;
