import { configureStore } from '@reduxjs/toolkit'
import logger from 'redux-logger'
import authReducer from '@/store/slices/authSlice'
import stationsReducer from '@/store/slices/stationsSlice'
import sessionsReducer from '@/store/slices/sessionsSlice'
import healthReducer from '@/store/slices/healthSlice'
import adminReducer from '@/store/slices/adminSlice'
import techSupportReducer from '@/store/slices/techSupportSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    stations: stationsReducer,
    sessions: sessionsReducer,
    health: healthReducer,
    admin: adminReducer,
    techSupport: techSupportReducer,
  },
  middleware: (getDefaultMiddleware) =>
    import.meta.env.DEV
      ? getDefaultMiddleware().concat(logger)
      : getDefaultMiddleware(),
  devTools: import.meta.env.DEV,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store

export default store
