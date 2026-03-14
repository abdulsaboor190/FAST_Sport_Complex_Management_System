import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type CoachSessionType = 'Individual' | 'Group' | 'Team';
export type CoachSessionStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'NoShow';

export interface CoachListItem {
  id: string;
  userId: string;
  bio: string | null;
  specializations: string[] | null;
  qualifications: string | null;
  experience: string | null;
  achievements: string | null;
  hourlyRate: number;
  isActive: boolean;
  user: { id: string; name: string; fastId: string; avatarUrl: string | null };
  avgRating: number | null;
  reviewCount: number;
}

export interface CoachAvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: 'Available' | 'Break';
}

export interface CoachDetail extends CoachListItem {
  availability: CoachAvailabilitySlot[];
  sessions: Array<{
    id: string;
    review: { id: string; rating: number; review: string | null; user: { name: string } } | null;
  }>;
  reviewCount: number;
}

export interface CoachSession {
  id: string;
  coachId: string;
  startTime: string;
  endTime: string;
  sessionType: CoachSessionType;
  status: CoachSessionStatus;
  amount: number;
  specialRequirements: string | null;
  coach: { id: string; user: { name: string; avatarUrl: string | null } };
  student?: { name: string; fastId: string };
  review?: { id: string; rating: number; review: string | null };
}

export interface SlotsResponse {
  date: string;
  slots: { start: string; end: string }[];
  booked: { start: string; end: string }[];
}

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { accessToken: string | null } }).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

export const coachApi = createApi({
  reducerPath: 'coachApi',
  baseQuery,
  tagTypes: ['Coaches', 'Coach', 'CoachSessions', 'CoachSlots', 'CoachPerformance'],
  endpoints: (builder) => ({
    getCoaches: builder.query<CoachListItem[], void>({
      query: () => '/coaches',
      providesTags: ['Coaches'],
    }),
    getCoach: builder.query<CoachDetail, string>({
      query: (id) => `/coaches/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Coach', id }],
    }),
    getCoachSlots: builder.query<SlotsResponse, { coachId: string; date: string }>({
      query: ({ coachId, date }) => `/coaches/${coachId}/slots?date=${date}`,
      providesTags: (_r, _e, { coachId, date }) => [{ type: 'CoachSlots', id: `${coachId}-${date}` }],
    }),
    getMyProfile: builder.query<CoachDetail | { availability: CoachAvailabilitySlot[] }, void>({
      query: () => '/coaches/profile/me',
      providesTags: ['Coach'],
    }),
    updateMyProfile: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/coaches/profile/me', method: 'PUT', body }),
      invalidatesTags: ['Coach', 'Coaches'],
    }),
    getMyAvailability: builder.query<CoachAvailabilitySlot[], void>({
      query: () => '/coaches/profile/me/availability',
      providesTags: ['Coach'],
    }),
    addAvailability: builder.mutation<
      CoachAvailabilitySlot,
      { dayOfWeek: number; startTime: string; endTime: string; type?: string }
    >({
      query: (body) => ({ url: '/coaches/profile/me/availability', method: 'POST', body }),
      invalidatesTags: ['Coach'],
    }),
    removeAvailability: builder.mutation<void, string>({
      query: (slotId) => ({ url: `/coaches/profile/me/availability/${slotId}`, method: 'DELETE' }),
      invalidatesTags: ['Coach'],
    }),
    bookSession: builder.mutation<
      CoachSession,
      { coachId: string; startTime: string; endTime: string; sessionType: CoachSessionType; specialRequirements?: string }
    >({
      query: (body) => ({ url: '/coaches/sessions', method: 'POST', body }),
      invalidatesTags: ['CoachSlots', 'CoachSessions'],
    }),
    getMySessions: builder.query<CoachSession[], void>({
      query: () => '/coaches/sessions/me',
      providesTags: ['CoachSessions'],
    }),
    cancelSession: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/coaches/sessions/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: ['CoachSessions', 'CoachSlots'],
    }),
    updateSessionStatus: builder.mutation<CoachSession, { id: string; status: CoachSessionStatus }>({
      query: ({ id, status }) => ({ url: `/coaches/sessions/${id}`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['CoachSessions', 'CoachSlots'],
    }),
    submitReview: builder.mutation<unknown, { sessionId: string; rating: number; review?: string }>({
      query: ({ sessionId, ...body }) => ({ url: `/coaches/sessions/${sessionId}/review`, method: 'POST', body }),
      invalidatesTags: ['Coach', 'Coaches', 'CoachSessions'],
    }),
    getCoachPerformance: builder.query<
      Array<{ coachId: string; coachName: string; totalSessions: number; avgRating: number | null; revenue: number }>,
      void
    >({
      query: () => '/coaches/admin/performance',
      providesTags: ['CoachPerformance'],
    }),
  }),
});

export const {
  useGetCoachesQuery,
  useGetCoachQuery,
  useGetCoachSlotsQuery,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useGetMyAvailabilityQuery,
  useAddAvailabilityMutation,
  useRemoveAvailabilityMutation,
  useBookSessionMutation,
  useGetMySessionsQuery,
  useCancelSessionMutation,
  useUpdateSessionStatusMutation,
  useSubmitReviewMutation,
  useGetCoachPerformanceQuery,
} = coachApi;
