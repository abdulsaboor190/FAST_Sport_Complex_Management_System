import { API_BASE_URL } from '../../config';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type EquipmentStatus = 'Available' | 'CheckedOut' | 'UnderMaintenance';
export type EquipmentCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor';
export type MaintenanceTaskType = 'RoutineInspection' | 'Repair' | 'DeepCleaning' | 'Replacement';
export type MaintenanceTaskStatus = 'Planned' | 'InProgress' | 'Completed' | 'Cancelled';

export interface EquipmentCategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  _count?: { items: number };
}

export interface EquipmentItem {
  id: string;
  categoryId: string;
  name: string;
  sportType: string | null;
  brand: string | null;
  specifications: Record<string, unknown> | null;
  photos: string[] | null;
  purchaseDate: string | null;
  warrantyUntil: string | null;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  qrCode: string;
  currentHolderId: string | null;
  lowStockThreshold: number | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string; code: string };
  currentHolder?: { id: string; name: string; fastId: string } | null;
  transactions?: EquipmentTransaction[];
  maintenanceTasks?: EquipmentMaintenanceTask[];
}

export interface EquipmentTransaction {
  id: string;
  equipmentId: string;
  userId: string;
  type: 'CheckOut' | 'CheckIn' | 'Reservation';
  plannedReturnAt: string | null;
  returnedAt: string | null;
  damageReported: string | null;
  notes: string | null;
  lateFee: number | null;
  damageFee: number | null;
  conditionOnReturn: EquipmentCondition | null;
  createdAt: string;
  equipment?: EquipmentItem & { category?: { name: string } };
  user?: { name: string; fastId: string };
}

export interface EquipmentMaintenanceTask {
  id: string;
  equipmentId: string;
  type: MaintenanceTaskType;
  status: MaintenanceTaskStatus;
  scheduledFor: string;
  completedAt: string | null;
  assignedTo: string | null;
  checklist: unknown;
  cost: number | null;
  invoiceUrl: string | null;
  notes: string | null;
  equipment?: EquipmentItem & { category?: { name: string } };
}

export interface EquipmentStats {
  totalEquipment: number;
  byCategory: { categoryId: string; categoryName: string; count: number }[];
  byStatus: { status: string; count: number }[];
  recentCheckouts: EquipmentTransaction[];
  maintenanceDue: EquipmentMaintenanceTask[];
  lowStock: EquipmentItem[];
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

export const equipmentApi = createApi({
  reducerPath: 'equipmentApi',
  baseQuery,
  tagTypes: ['Equipment', 'EquipmentCategories', 'EquipmentItem', 'EquipmentTransactions', 'Maintenance', 'EquipmentStats'],
  endpoints: (builder) => ({
    getCategories: builder.query<EquipmentCategory[], void>({
      query: () => '/equipment/categories',
      providesTags: ['EquipmentCategories'],
    }),
    getEquipment: builder.query<
      EquipmentItem[],
      { categoryId?: string; status?: EquipmentStatus; condition?: EquipmentCondition; search?: string }
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params.categoryId) search.set('categoryId', params.categoryId);
        if (params.status) search.set('status', params.status);
        if (params.condition) search.set('condition', params.condition);
        if (params.search) search.set('search', params.search);
        return `/equipment?${search.toString()}`;
      },
      providesTags: ['Equipment'],
    }),
    getEquipmentByQr: builder.query<EquipmentItem, string>({
      query: (qrCode) => `/equipment/by-qr/${encodeURIComponent(qrCode)}`,
      providesTags: (_r, _e, qrCode) => [{ type: 'EquipmentItem', id: `qr-${qrCode}` }],
    }),
    getEquipmentById: builder.query<EquipmentItem, string>({
      query: (id) => `/equipment/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'EquipmentItem', id }],
    }),
    createEquipment: builder.mutation<EquipmentItem, Record<string, unknown>>({
      query: (body) => ({ url: '/equipment', method: 'POST', body }),
      invalidatesTags: ['Equipment', 'EquipmentStats'],
    }),
    updateEquipment: builder.mutation<EquipmentItem, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/equipment/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'EquipmentItem', id }, 'Equipment', 'EquipmentStats'],
    }),
    uploadEquipmentPhotos: builder.mutation<{ photos: string[] }, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/equipment/${id}/photos`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'EquipmentItem', id }, 'Equipment'],
    }),
    checkout: builder.mutation<EquipmentTransaction, { equipmentId?: string; qrCode?: string; plannedReturnAt: string; notes?: string; damageReported?: string }>({
      query: (body) => ({ url: '/equipment/checkout', method: 'POST', body: { ...body, acceptTerms: true } }),
      invalidatesTags: ['Equipment', 'EquipmentItem', 'EquipmentTransactions', 'EquipmentStats'],
    }),
    checkin: builder.mutation<
      EquipmentTransaction,
      { transactionId?: string; qrCode?: string; conditionOnReturn?: EquipmentCondition; damageReported?: string; notes?: string }
    >({
      query: (body) => ({ url: '/equipment/checkin', method: 'POST', body }),
      invalidatesTags: ['Equipment', 'EquipmentItem', 'EquipmentTransactions', 'EquipmentStats'],
    }),
    getMyTransactions: builder.query<EquipmentTransaction[], void>({
      query: () => '/equipment/transactions/me',
      providesTags: ['EquipmentTransactions'],
    }),
    getMaintenanceList: builder.query<
      EquipmentMaintenanceTask[],
      { from?: string; to?: string; status?: MaintenanceTaskStatus; equipmentId?: string }
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params.from) search.set('from', params.from);
        if (params.to) search.set('to', params.to);
        if (params.status) search.set('status', params.status);
        if (params.equipmentId) search.set('equipmentId', params.equipmentId);
        return `/equipment/maintenance/list?${search.toString()}`;
      },
      providesTags: ['Maintenance'],
    }),
    createMaintenance: builder.mutation<
      EquipmentMaintenanceTask,
      { equipmentId: string; type: MaintenanceTaskType; scheduledFor: string; assignedTo?: string; checklist?: unknown[]; notes?: string }
    >({
      query: (body) => ({ url: '/equipment/maintenance', method: 'POST', body }),
      invalidatesTags: ['Maintenance', 'EquipmentStats'],
    }),
    updateMaintenance: builder.mutation<
      EquipmentMaintenanceTask,
      { id: string; status?: MaintenanceTaskStatus; completedAt?: string | null; cost?: number | null; invoiceUrl?: string | null; notes?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/equipment/maintenance/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Maintenance', 'EquipmentStats'],
    }),
    getEquipmentStats: builder.query<EquipmentStats, void>({
      query: () => '/equipment/admin/stats',
      providesTags: ['EquipmentStats'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetEquipmentQuery,
  useGetEquipmentByQrQuery,
  useGetEquipmentByIdQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useUploadEquipmentPhotosMutation,
  useCheckoutMutation,
  useCheckinMutation,
  useGetMyTransactionsQuery,
  useGetMaintenanceListQuery,
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
  useGetEquipmentStatsQuery,
} = equipmentApi;
