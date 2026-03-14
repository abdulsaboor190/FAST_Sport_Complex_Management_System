import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Facility {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  capacity: number;
  imageUrl: string | null;
  rules: string | null;
  equipmentInfo: string | null;
  slotDurationMinutes: number;
  minBookingSlots: number;
  maxBookingSlots: number;
  peakStartTime: string | null;
  peakEndTime: string | null;
  pricePerSlotOffPeak: number;
  pricePerSlotPeak: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookedSlot {
  id: string;
  start: string;
  end: string;
  userId: string;
  status: string;
}

export interface AvailableRange {
  start: string;
  end: string;
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

export const facilitiesApi = createApi({
  reducerPath: 'facilitiesApi',
  baseQuery,
  tagTypes: ['Facilities', 'Slots', 'AvailableRanges'],
  endpoints: (builder) => ({
    getFacilities: builder.query<Facility[], void>({
      query: () => '/facilities',
      providesTags: ['Facilities'],
    }),
    getFacility: builder.query<Facility, string>({
      query: (id) => `/facilities/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Facilities', id }],
    }),
    getBookedSlots: builder.query<
      { date: string; facilityId: string; slots: BookedSlot[] },
      { facilityId: string; date: string }
    >({
      query: ({ facilityId, date }) =>
        `/facilities/availability/slots?facilityId=${encodeURIComponent(facilityId)}&date=${date}`,
      providesTags: (_r, _e, { facilityId, date }) => [
        { type: 'Slots', id: `${facilityId}-${date}` },
      ],
    }),
    getAvailableRanges: builder.query<
      { date: string; facilityId: string; slots: AvailableRange[] },
      { facilityId: string; date: string }
    >({
      query: ({ facilityId, date }) =>
        `/facilities/availability/available-ranges?facilityId=${encodeURIComponent(facilityId)}&date=${date}`,
      providesTags: (_r, _e, { facilityId, date }) => [
        { type: 'AvailableRanges', id: `${facilityId}-${date}` },
      ],
    }),
  }),
});

export const {
  useGetFacilitiesQuery,
  useGetFacilityQuery,
  useGetBookedSlotsQuery,
  useGetAvailableRangesQuery,
} = facilitiesApi;
