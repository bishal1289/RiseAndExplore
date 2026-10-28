import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { AuthProvider, useAuth } from './AuthContext';
import { ConfirmProvider } from './components/Confirm';
import { AdminLayout } from './components/AdminLayout';
import { ListSkeleton } from './components/ui';
import Login from './pages/Login';
import { ForgotPassword, ResetPassword } from './pages/PasswordPages';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const MediaLibrary = lazy(() => import('./pages/MediaLibrary'));
const EventsList = lazy(() => import('./pages/EventsList'));
const EventEditor = lazy(() => import('./pages/EventEditor'));
const GalleryManager = lazy(() => import('./pages/GalleryManager'));
const HomepageEditor = lazy(() => import('./pages/HomepageEditor'));
const ProgramsAdmin = lazy(() => import('./pages/ProgramsAdmin'));
const TestimonialsAdmin = lazy(() => import('./pages/TestimonialsAdmin'));
const Inbox = lazy(() => import('./pages/Inbox'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const Users = lazy(() => import('./pages/Users'));
const Trash = lazy(() => import('./pages/Trash'));
const Guide = lazy(() => import('./pages/Guide'));
const EventPreview = lazy(() => import('./pages/EventPreview'));

function RequireAuth({ children, owner }: { children: ReactNode; owner?: boolean }) {
  const { user, loading, isOwner } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="mx-auto max-w-md p-10">
        <ListSkeleton rows={3} />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (owner && !isOwner) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

const page = (el: ReactNode, owner = false) => (
  <RequireAuth owner={owner}>
    <AdminLayout>
      <Suspense fallback={<ListSkeleton />}>{el}</Suspense>
    </AdminLayout>
  </RequireAuth>
);

export default function AdminRoot() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <Helmet>
          <title>RISE Admin</title>
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: '999px', background: '#0F2238', color: '#fff', fontWeight: 600, padding: '12px 20px' },
          }}
        />
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route index element={page(<Dashboard />)} />
          <Route path="media" element={page(<MediaLibrary />)} />
          <Route path="events" element={page(<EventsList />)} />
          <Route path="events/new" element={page(<EventEditor />)} />
          <Route path="events/:id" element={page(<EventEditor />)} />
          <Route
            path="events/:id/preview"
            element={
              <RequireAuth>
                <Suspense fallback={<ListSkeleton />}>
                  <EventPreview />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route path="gallery" element={page(<GalleryManager />)} />
          <Route path="homepage" element={page(<HomepageEditor />)} />
          <Route path="programs" element={page(<ProgramsAdmin />)} />
          <Route path="testimonials" element={page(<TestimonialsAdmin />)} />
          <Route path="volunteers" element={page(<Inbox kind="volunteers" />)} />
          <Route path="messages" element={page(<Inbox kind="messages" />)} />
          <Route path="settings" element={page(<SettingsPage />, true)} />
          <Route path="users" element={page(<Users />, true)} />
          <Route path="trash" element={page(<Trash />)} />
          <Route path="guide" element={page(<Guide />)} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </ConfirmProvider>
    </AuthProvider>
  );
}
