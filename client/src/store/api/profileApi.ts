import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { User } from '../slices/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { accessToken: string | null } }).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

export const profileApi = createApi({
  reducerPath: 'profileApi',
  baseQuery,
  endpoints: (builder) => ({
    getProfile: builder.query<User, void>({
      query: () => '/profile/me',
    }),
    updateProfile: builder.mutation<
      User,
      { name?: string; fastId?: string; email?: string }
    >({
      query: (body) => ({ url: '/profile/me', method: 'PATCH', body }),
    }),
    changePassword: builder.mutation<
      { message: string },
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({ url: '/profile/me/change-password', method: 'POST', body }),
    }),
    uploadAvatar: builder.mutation<{ avatarUrl: string }, FormData>({
      query: (formData) => ({
        url: '/profile/me/avatar',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
} = profileApi;
