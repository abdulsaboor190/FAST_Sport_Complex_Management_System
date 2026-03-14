import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

export interface Tournament {
    id: string;
    name: string;
    sport: string;
    startDate: string;
    endDate: string;
    format: 'SingleElimination' | 'DoubleElimination' | 'RoundRobin' | 'GroupStage';
    status: 'Draft' | 'RegistrationOpen' | 'RegistrationClosed' | 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';
    registrationOpen: boolean;
    registrationDeadline?: string;
    maxTeams: number;
    entryFee: number;
    rules?: string;
    prizes?: any;
    posterUrl?: string;
    announcement?: string;
    _count?: {
        registrations: number;
    };
}

export const tournamentApi = createApi({
    reducerPath: 'tournamentApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/tournaments',
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.accessToken;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Tournament'],
    endpoints: (builder) => ({
        getTournaments: builder.query<Tournament[], { status?: string; upcoming?: boolean } | void>({
            query: (params) => ({
                url: '/',
                params: params || undefined,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Tournament' as const, id })),
                        { type: 'Tournament', id: 'LIST' },
                    ]
                    : [{ type: 'Tournament', id: 'LIST' }],
        }),
        getTournament: builder.query<Tournament, string>({
            query: (id) => `/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Tournament', id }],
        }),
        createTournament: builder.mutation<Tournament, Partial<Tournament>>({
            query: (body) => ({
                url: '/',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Tournament', id: 'LIST' }],
        }),
        updateTournament: builder.mutation<Tournament, { id: string; data: Partial<Tournament> }>({
            query: ({ id, data }) => ({
                url: `/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Tournament', id },
                { type: 'Tournament', id: 'LIST' },
            ],
        }),
        deleteTournament: builder.mutation<void, string>({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
                body: { id },
            }),
            invalidatesTags: [{ type: 'Tournament', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetTournamentsQuery,
    useGetTournamentQuery,
    useCreateTournamentMutation,
    useUpdateTournamentMutation,
    useDeleteTournamentMutation,
} = tournamentApi;
