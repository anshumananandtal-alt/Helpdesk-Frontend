import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../auth/sessionSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})
