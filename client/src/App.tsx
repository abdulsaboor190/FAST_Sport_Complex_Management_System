import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useGetMeQuery, useRefreshMutation } from '@/store/api/authApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAccessToken, setUser } from '@/store/slices/authSlice';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { Profile } from '@/pages/dashboard/Profile';
import { Facilities } from '@/pages/dashboard/Facilities';
import { BookFacility } from '@/pages/dashboard/BookFacility';
import { MyBookings } from '@/pages/dashboard/MyBookings';
import { TournamentList } from '@/pages/dashboard/tournaments/TournamentList';
import { CreateTournament } from '@/pages/dashboard/tournaments/CreateTournament';
import { TournamentDetails } from '@/pages/dashboard/tournaments/TournamentDetails';
import { RegisterTeam } from '@/pages/dashboard/tournaments/RegisterTeam';
import { Placeholder } from '@/pages/dashboard/Placeholder';
import { EquipmentCatalog } from '@/pages/dashboard/equipment/EquipmentCatalog';
import { EquipmentDetail } from '@/pages/dashboard/equipment/EquipmentDetail';
import { EquipmentScan } from '@/pages/dashboard/equipment/EquipmentScan';
import { EquipmentByQr } from '@/pages/dashboard/equipment/EquipmentByQr';
import { EquipmentTransactions } from '@/pages/dashboard/equipment/EquipmentTransactions';
import { EquipmentMaintenance } from '@/pages/dashboard/equipment/EquipmentMaintenance';
import { EquipmentAdminDashboard } from '@/pages/dashboard/equipment/EquipmentAdminDashboard';
import { CreateEquipment } from '@/pages/dashboard/equipment/CreateEquipment';
import { CoachList } from '@/pages/dashboard/coaches/CoachList';
import { CoachDetail } from '@/pages/dashboard/coaches/CoachDetail';
import { MySessions } from '@/pages/dashboard/coaches/MySessions';
import { CoachPerformance } from '@/pages/dashboard/coaches/CoachPerformance';
import { EventList } from '@/pages/dashboard/events/EventList';
import { EventDetail } from '@/pages/dashboard/events/EventDetail';
import { EventCheckIn } from '@/pages/dashboard/events/EventCheckIn';
import { MyRegistrations } from '@/pages/dashboard/events/MyRegistrations';
import { CreateEvent } from '@/pages/dashboard/events/CreateEvent';
import { AnalyticsDashboard } from '@/pages/dashboard/analytics/AnalyticsDashboard';
import { AnalyticsReports } from '@/pages/dashboard/analytics/AnalyticsReports';
import { MyIssues } from '@/pages/dashboard/issues/MyIssues';
import { ReportIssue } from '@/pages/dashboard/issues/ReportIssue';
import { Settings } from '@/pages/dashboard/Settings';
import { FacilityPublicDetail } from '@/pages/public/FacilityPublicDetail';

export default function App() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const user = useAppSelector((state) => state.auth.user);
  const restoreAttempted = useRef(false);
  const [refresh] = useRefreshMutation();
  const { data: me, isSuccess } = useGetMeQuery(undefined, { skip: !accessToken });

  useEffect(() => {
    if (restoreAttempted.current) return;
    if (accessToken) return;
    restoreAttempted.current = true;
    refresh()
      .unwrap()
      .then((res) => dispatch(setAccessToken(res.accessToken)))
      .catch(() => { });
  }, [accessToken, refresh, dispatch]);

  useEffect(() => {
    if (isSuccess && me && accessToken && !user) {
      dispatch(setUser(me));
    }
  }, [isSuccess, me, accessToken, user, dispatch]);

  return (
    <Routes>
      {/* Public-facing routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/facilities" element={<Facilities />} />
        <Route path="/facilities/:slug" element={<FacilityPublicDetail />} />
        <Route path="/tournaments" element={<TournamentList />} />
        <Route path="/tournaments/:id" element={<TournamentDetails />} />
        <Route path="/events" element={<EventList />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/equipment" element={<EquipmentCatalog />} />
        <Route path="/equipment/:id" element={<EquipmentDetail />} />
        <Route path="/coaches" element={<CoachList />} />
        <Route path="/coaches/:id" element={<CoachDetail />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="facilities" element={<Facilities />} />
        <Route path="book" element={<BookFacility />} />
        <Route path="bookings" element={<MyBookings />} />
        <Route path="issues">
          <Route index element={<MyIssues />} />
          <Route path="new" element={<ReportIssue />} />
        </Route>
        <Route path="coaches">
          <Route index element={<CoachList />} />
          <Route path="sessions" element={<MySessions />} />
          <Route path="performance" element={<CoachPerformance />} />
          <Route path=":id" element={<CoachDetail />} />
        </Route>
        <Route path="events">
          <Route index element={<EventList />} />
          <Route path="my-registrations" element={<MyRegistrations />} />
          <Route path="create" element={<CreateEvent />} />
          <Route path=":id" element={<EventDetail />} />
          <Route path=":id/checkin" element={<EventCheckIn />} />
        </Route>
        <Route path="analytics">
          <Route index element={<AnalyticsDashboard />} />
          <Route path="reports" element={<AnalyticsReports />} />
        </Route>
        <Route path="tournaments">
          <Route index element={<TournamentList />} />
          <Route path="create" element={<CreateTournament />} />
          <Route path=":id" element={<TournamentDetails />} />
          <Route path=":id/register" element={<RegisterTeam />} />
        </Route>
        <Route path="equipment">
          <Route index element={<EquipmentCatalog />} />
          <Route path="scan" element={<EquipmentScan />} />
          <Route path="my-checkouts" element={<EquipmentTransactions />} />
          <Route path="maintenance" element={<EquipmentMaintenance />} />
          <Route path="admin" element={<EquipmentAdminDashboard />} />
          <Route path="create" element={<CreateEquipment />} />
          <Route path="qr/:qrCode" element={<EquipmentByQr />} />
          <Route path=":id" element={<EquipmentDetail />} />
        </Route>
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
