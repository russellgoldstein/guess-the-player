import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
    endpoints: (builder) => ({
        getUser: builder.query<any, void>({
            query: () => 'users',
        }),
        getGames: builder.query<any, void>({
            query: () => 'games',
        }),
        // Add more endpoints as needed
    }),
});

export const { useGetUserQuery, useGetGamesQuery } = api; 