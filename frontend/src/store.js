// src/app/store.js

import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../services/apiSlice';

export const store = configureStore({
  reducer: {
    // Add the API slice reducer to the store
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  // Add the API middleware to enable caching, invalidation, etc.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});