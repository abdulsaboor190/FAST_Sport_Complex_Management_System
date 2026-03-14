import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface AnalyticsOverview {
  bookings: { today: number; week: number; month: number };
  activeUsers: number;
  revenueToday: number;
  upcomingEvents: number;
}

export interface FacilityUtilizationRow {
  facilityId: string;
  facilityName: string;
  category: string;
  bookedMinutes: number;
  utilizationRate: number;
  underUtilized: boolean;
}

export interface FacilityUtilizationResponse {
  from: string;
  to: string;
  facilities: FacilityUtilizationRow[];
}

export interface BookingTrendsResponse {
  from: string;
  to: string;
  granularity: 'day' | 'week' | 'month';
  series: Array<{ period: string; total: number; cancelled: number; cancellationRate: number }>;
}

export interface PopularSportsResponse {
  from: string;
  to: string;
  data: Array<{ sport: string; count: number }>;
}

export interface PeakHeatmapResponse {
  from: string;
  to: string;
  facilityId: string | null;
  matrix: number[][];
}

export interface UserEngagementResponse {
  from: string;
  to: string;
  mostActiveUsers: Array<{ id: string; name: string; fastId: string; role: string; bookings: number }>;
  newUsers: number;
  returningUsers: number;
}

export interface EquipmentAnalyticsResponse {
  from: string;
  to: string;
  mostCheckedOut: Array<{
    equipmentId: string;
    name: string;
    category: string;
    checkouts: number;
    avgDurationMinutes: number | null;
    damageRate: number;
  }>;
  maintenanceCount: number;
}

export interface RevenueAnalyticsResponse {
  from: string;
  to: string;
  totals: {
    totalRevenue: number;
    bookingRevenue: number;
    tournamentRevenue: number;
    coachingRevenue: number;
    equipmentRevenue: number;
    eventRevenue: number;
    refunds: number;
    forecastNext7Days: number;
  };
  counts: {
    bookings: number;
    tournamentRegistrations: number;
    coachSessions: number;
    eventRegistrations: number;
  };
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

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery,
  tagTypes: ['Analytics'],
  endpoints: (builder) => ({
    getOverview: builder.query<AnalyticsOverview, void>({
      query: () => '/analytics/overview',
      providesTags: ['Analytics'],
    }),
    getFacilityUtilization: builder.query<FacilityUtilizationResponse, { from: string; to: string }>({
      query: ({ from, to }) => `/analytics/facility-utilization?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      providesTags: ['Analytics'],
    }),
    getBookingTrends: builder.query<BookingTrendsResponse, { from: string; to: string; granularity?: 'day' | 'week' | 'month' }>({
      query: ({ from, to, granularity = 'day' }) =>
        `/analytics/booking-trends?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&granularity=${granularity}`,
      providesTags: ['Analytics'],
    }),
    getPopularSports: builder.query<PopularSportsResponse, { from: string; to: string }>({
      query: ({ from, to }) => `/analytics/popular-sports?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      providesTags: ['Analytics'],
    }),
    getPeakHeatmap: builder.query<PeakHeatmapResponse, { from: string; to: string; facilityId?: string }>({
      query: ({ from, to, facilityId }) => {
        const p = new URLSearchParams({ from, to });
        if (facilityId) p.set('facilityId', facilityId);
        return `/analytics/peak-heatmap?${p.toString()}`;
      },
      providesTags: ['Analytics'],
    }),
    getUserEngagement: builder.query<UserEngagementResponse, { from: string; to: string }>({
      query: ({ from, to }) => `/analytics/user-engagement?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      providesTags: ['Analytics'],
    }),
    getEquipmentAnalytics: builder.query<EquipmentAnalyticsResponse, { from: string; to: string }>({
      query: ({ from, to }) => `/analytics/equipment?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      providesTags: ['Analytics'],
    }),
    getRevenueAnalytics: builder.query<RevenueAnalyticsResponse, { from: string; to: string }>({
      query: ({ from, to }) => `/analytics/revenue?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetOverviewQuery,
  useGetFacilityUtilizationQuery,
  useGetBookingTrendsQuery,
  useGetPopularSportsQuery,
  useGetPeakHeatmapQuery,
  useGetUserEngagementQuery,
  useGetEquipmentAnalyticsQuery,
  useGetRevenueAnalyticsQuery,
} = analyticsApi;

