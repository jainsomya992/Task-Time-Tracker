// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import { tasksApi } from '../services/Tasksapi';

export const store = configureStore({
  reducer: {
    [tasksApi.reducerPath]: tasksApi.reducer,
  },
  // Adding the middleware enables caching, invalidation, polling, and other features
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tasksApi.middleware),
});