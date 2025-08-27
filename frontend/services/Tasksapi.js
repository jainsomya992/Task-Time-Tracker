// src/services/tasksApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5050/api/' }), // Make sure this URL matches your backend API's base path
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: () => 'tasks', // This will be appended to the base URL: http://localhost:3000/api/tasks
    }),
    addTask: builder.mutation({
      query: (task) => ({
        url: 'tasks',
        method: 'POST',
        body: task,
      }),
    }),
    // Add other endpoints for editing, deleting, etc.
  }),
});

// Export the auto-generated hooks
export const { useGetTasksQuery, useAddTaskMutation } = tasksApi;