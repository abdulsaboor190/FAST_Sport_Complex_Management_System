import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { profileApi } from './api/profileApi';
import { facilitiesApi } from './api/facilitiesApi';
import { bookingsApi } from './api/bookingsApi';
import { tournamentApi } from './api/tournamentApi';
import { teamApi } from './api/teamApi';
import { equipmentApi } from './api/equipmentApi';
import { coachApi } from './api/coachApi';
import { eventsApi } from './api/eventsApi';
import { analyticsApi } from './api/analyticsApi';
import { issueApi } from './api/issueApi';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [facilitiesApi.reducerPath]: facilitiesApi.reducer,
    [bookingsApi.reducerPath]: bookingsApi.reducer,
    [tournamentApi.reducerPath]: tournamentApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
    [equipmentApi.reducerPath]: equipmentApi.reducer,
    [coachApi.reducerPath]: coachApi.reducer,
    [eventsApi.reducerPath]: eventsApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [issueApi.reducerPath]: issueApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      profileApi.middleware,
      facilitiesApi.middleware,
      bookingsApi.middleware,
      tournamentApi.middleware,
      teamApi.middleware,
      equipmentApi.middleware,
      coachApi.middleware,
      eventsApi.middleware,
      analyticsApi.middleware,
      issueApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
