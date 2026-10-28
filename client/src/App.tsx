import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout, PageFallback } from './layout/Layout';
import Home from './pages/Home';

const About = lazy(() => import('./pages/About'));
const Programs = lazy(() => import('./pages/Programs'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Gallery = lazy(() => import('./pages/Gallery'));
const GetInvolved = lazy(() => import('./pages/GetInvolved'));
const Shop = lazy(() => import('./pages/Shop'));
const Donate = lazy(() => import('./pages/Donate'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminRoot = lazy(() => import('./admin/AdminRoot'));

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'programs', element: <Programs /> },
      { path: 'events', element: <Events /> },
      { path: 'events/:slug', element: <EventDetail /> },
      { path: 'gallery', element: <Gallery /> },
      { path: 'get-involved', element: <GetInvolved /> },
      { path: 'shop', element: <Shop /> },
      { path: 'donate', element: <Donate /> },
      { path: 'contact', element: <Contact /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: 'admin/*',
    element: (
      <Suspense fallback={<PageFallback />}>
        <AdminRoot />
      </Suspense>
    ),
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
