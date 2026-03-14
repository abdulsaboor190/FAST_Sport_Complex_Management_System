import { API_BASE_URL } from '../../config';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type BookingStatus = 'Confirmed' | 'Pending' | 'Cancelled';
export type RefundStatus = 'None' | 'Pending' | 'Approved' | 'Processed';

export interface Booking {
  id: string;
  facilityId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  purpose: string | null;
  participantCount: number | null;
  specialRequirements: string | null;
  totalAmount: number;
  cancelledAt: string | null;
  cancelledById: string | null;
  cancelReason: string | null;
  refundAmount: number | null;
  refundStatus: RefundStatus | null;
  createdAt: string;
  updatedAt: string;
  facility?: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
  };
  user?: { id: string; name: string; email: string; fastId: string };
}

export interface CreateBookingBody {
  facilityId: string;
  startTime: string;
  endTime: string;
  purpose?: string;
  participantCount?: number;
  specialRequirements?: string;
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

export const bookingsApi = createApi({
  reducerPath: 'bookingsApi',
  baseQuery,
  tagTypes: ['MyBookings', 'Slots'],
  endpoints: (builder) => ({
    getMyBookings: builder.query<Booking[], { upcoming?: boolean; past?: boolean; status?: string } | void>({
      query: (params) => {
        const p = params ?? {};
        const search = new URLSearchParams();
        if (p.upcoming) search.set('upcoming', 'true');
        if (p.past) search.set('past', 'true');
        if (p.status) search.set('status', p.status);
        const q = search.toString();
        return `/bookings/my${q ? `?${q}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((b) => ({ type: 'MyBookings' as const, id: b.id })),
              { type: 'MyBookings', id: 'LIST' },
            ]
          : [{ type: 'MyBookings', id: 'LIST' }],
    }),
    getBooking: builder.query<Booking, string>({
      query: (id) => `/bookings/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'MyBookings', id }],
    }),
    createBooking: builder.mutation<Booking, CreateBookingBody>({
      query: (body) => ({ url: '/bookings', method: 'POST', body }),
      invalidatesTags: [{ type: 'MyBookings', id: 'LIST' }, 'Slots'],
    }),
    cancelBooking: builder.mutation<
      { message: string; refundAmount: number; refundTier: string; refundStatus: string },
      { id: string; reason?: string }
    >({
      query: ({ id, reason }) => ({ url: `/bookings/${id}/cancel`, method: 'POST', body: { reason } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'MyBookings', id }, { type: 'MyBookings', id: 'LIST' }, 'Slots'],
    }),
  }),
});

export const {
  useGetMyBookingsQuery,
  useGetBookingQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
} = bookingsApi;
