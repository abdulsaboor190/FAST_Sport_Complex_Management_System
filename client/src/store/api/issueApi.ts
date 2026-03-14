import { API_BASE_URL } from '../../config';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type IssueCategory = 'Facility' | 'Equipment' | 'Booking' | 'Safety' | 'Other';
export type IssueStatus = 'Open' | 'Acknowledged' | 'InProgress' | 'Resolved' | 'Closed';
export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface IssueUserRef {
  id: string;
  name: string;
  fastId: string;
  role: string;
}

export interface IssueRef {
  id: string;
  category: IssueCategory;
  title: string;
  description: string | null;
  priority: IssuePriority;
  status: IssueStatus;
  location: string | null;
  attachments: string[] | null;
  resolution: string | null;
  satisfactionRating: number | null;
  createdAt: string;
  updatedAt: string;
  reporter: IssueUserRef;
  assignee: IssueUserRef | null;
  facility?: { id: string; name: string; category: string } | null;
  equipment?: { id: string; name: string } | null;
}

export interface IssueComment {
  id: string;
  issueId: string;
  message: string;
  internal: boolean;
  createdAt: string;
  author: IssueUserRef;
}

export interface IssueActivity {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
  actor: IssueUserRef | null;
}

export interface IssueDetail extends IssueRef {
  activities: IssueActivity[];
  comments: IssueComment[];
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

export const issueApi = createApi({
  reducerPath: 'issueApi',
  baseQuery,
  tagTypes: ['Issues', 'Issue'],
  endpoints: (builder) => ({
    createIssue: builder.mutation<IssueRef, FormData>({
      query: (body) => ({
        url: '/issues',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Issues'],
    }),
    getMyIssues: builder.query<IssueRef[], void>({
      query: () => '/issues/me',
      providesTags: ['Issues'],
    }),
    getIssues: builder.query<IssueRef[], { status?: IssueStatus; category?: IssueCategory; priority?: IssuePriority; q?: string }>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params.status) search.set('status', params.status);
        if (params.category) search.set('category', params.category);
        if (params.priority) search.set('priority', params.priority);
        if (params.q) search.set('q', params.q);
        return `/issues?${search.toString()}`;
      },
      providesTags: ['Issues'],
    }),
    getIssue: builder.query<IssueDetail, string>({
      query: (id) => `/issues/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Issue', id }],
    }),
    updateIssue: builder.mutation<IssueRef, { id: string; body: Partial<{ status: IssueStatus; priority: IssuePriority; assigneeId: string | null; resolution: string }>}>({
      query: ({ id, body }) => ({
        url: `/issues/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => ['Issues', { type: 'Issue', id }],
    }),
    addComment: builder.mutation<IssueComment, { id: string; body: { message: string; internal?: boolean } }>({
      query: ({ id, body }) => ({
        url: `/issues/${id}/comments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Issue', id }],
    }),
    setSatisfaction: builder.mutation<IssueRef, { id: string; rating: number }>({
      query: ({ id, rating }) => ({
        url: `/issues/${id}/satisfaction`,
        method: 'POST',
        body: { rating },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Issue', id }, 'Issues'],
    }),
  }),
});

export const {
  useCreateIssueMutation,
  useGetMyIssuesQuery,
  useGetIssuesQuery,
  useGetIssueQuery,
  useUpdateIssueMutation,
  useAddCommentMutation,
  useSetSatisfactionMutation,
} = issueApi;

