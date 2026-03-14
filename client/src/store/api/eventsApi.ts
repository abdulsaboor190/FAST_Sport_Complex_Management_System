import { API_BASE_URL } from '../../config';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type EventType = 'Workshop' | 'Seminar' | 'SportsDay' | 'FitnessChallenge';
export type EventStatus = 'Draft' | 'Published' | 'Completed' | 'Cancelled';

export interface Event {
  id: string;
  type: EventType;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  startTime: string;
  endTime: string;
  venue: string | null;
  registrationRequired: boolean;
  capacity: number | null;
  entryFee: number;
  agenda: unknown;
  speakers: unknown;
  status: EventStatus;
  _count?: { registrations: number; checkIns?: number };
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  registeredAt: string;
  event?: Event;
  user?: { name: string; fastId: string };
  checkedIn?: boolean;
}

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { accessToken: string | null } }).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

export const eventsApi = createApi({
  reducerPath: 'eventsApi',
  baseQuery,
  tagTypes: ['Events', 'Event', 'EventRegistrations', 'MyRegistrations'],
  endpoints: (builder) => ({
    getEvents: builder.query<Event[], { from?: string; to?: string; type?: EventType; status?: EventStatus }>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params.from) search.set('from', params.from);
        if (params.to) search.set('to', params.to);
        if (params.type) search.set('type', params.type);
        if (params.status) search.set('status', params.status ?? 'Published');
        return `/events?${search.toString()}`;
      },
      providesTags: ['Events'],
    }),
    getEvent: builder.query<Event, string>({
      query: (id) => `/events/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Event', id }],
    }),
    getEventByRegistration: builder.query<EventRegistration, string>({
      query: (registrationId) => `/events/by-registration/${registrationId}`,
      providesTags: ['Event'],
    }),
    createEvent: builder.mutation<Event, Record<string, unknown>>({
      query: (body) => ({ url: '/events', method: 'POST', body }),
      invalidatesTags: ['Events'],
    }),
    updateEvent: builder.mutation<Event, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/events/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Event', id }, 'Events'],
    }),
    registerForEvent: builder.mutation<EventRegistration, { eventId: string; paymentRef?: string }>({
      query: ({ eventId, paymentRef }) => ({ url: `/events/${eventId}/register`, method: 'POST', body: { paymentRef } }),
      invalidatesTags: ['Event', 'MyRegistrations', 'Events'],
    }),
    unregisterFromEvent: builder.mutation<void, string>({
      query: (eventId) => ({ url: `/events/${eventId}/register`, method: 'DELETE' }),
      invalidatesTags: ['Event', 'MyRegistrations', 'Events'],
    }),
    getMyRegistrations: builder.query<EventRegistration[], void>({
      query: () => '/events/registrations/me',
      providesTags: ['MyRegistrations'],
    }),
    checkIn: builder.mutation<unknown, { eventId: string; registrationId?: string; userId?: string }>({
      query: ({ eventId, registrationId, userId }) => ({
        url: `/events/${eventId}/checkin`,
        method: 'POST',
        body: { registrationId, userId },
      }),
      invalidatesTags: ['Event', 'EventRegistrations'],
    }),
    submitEventFeedback: builder.mutation<unknown, { eventId: string; rating?: number; feedback?: string }>({
      query: ({ eventId, ...body }) => ({ url: `/events/${eventId}/feedback`, method: 'POST', body }),
      invalidatesTags: ['Event'],
    }),
    getEventRegistrations: builder.query<(EventRegistration & { checkedIn: boolean })[], string>({
      query: (eventId) => `/events/${eventId}/registrations`,
      providesTags: (_r, _e, id) => [{ type: 'EventRegistrations', id }],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useGetEventQuery,
  useGetEventByRegistrationQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useRegisterForEventMutation,
  useUnregisterFromEventMutation,
  useGetMyRegistrationsQuery,
  useCheckInMutation,
  useSubmitEventFeedbackMutation,
  useGetEventRegistrationsQuery,
} = eventsApi;
