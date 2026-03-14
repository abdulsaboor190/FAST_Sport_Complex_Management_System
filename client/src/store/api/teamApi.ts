import { API_BASE_URL } from '../../config';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import type { Tournament } from './tournamentApi';

export interface Player {
    id: string;
    name: string;
    fastId?: string;
    position?: string;
    jerseyNo?: number;
}

export interface Team {
    id: string;
    name: string;
    department?: string;
    coachUserId?: string;
    logoUrl?: string;
    players: Player[];
    registrations: {
        tournament: Tournament;
        status: string;
    }[];
}

export interface RegisterTeamRequest {
    tournamentId: string;
    name: string;
    department?: string;
    players: {
        name: string;
        fastId?: string;
        position?: string;
        jerseyNo?: number;
    }[];
    logoUrl?: string;
}

export const teamApi = createApi({
    reducerPath: 'teamApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE_URL + '/teams',
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.accessToken;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Team', 'Tournament'],
    endpoints: (builder) => ({
        registerTeam: builder.mutation<{ team: Team; registration: any }, RegisterTeamRequest>({
            query: (body) => ({
                url: '/register',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Team', 'Tournament'],
        }),
        getMyTeams: builder.query<Team[], void>({
            query: () => '/my',
            providesTags: ['Team'],
        }),
    }),
});

export const { useRegisterTeamMutation, useGetMyTeamsQuery } = teamApi;
