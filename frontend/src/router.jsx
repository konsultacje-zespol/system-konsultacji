import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './layout/AppLayout.jsx';
import HomeRedirect from './auth/HomeRedirect.jsx';
import RequireRole from './auth/RequireRole.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForbiddenPage from './pages/ForbiddenPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import DevPage from './pages/DevPage.jsx';

const routes = [
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <HomeRedirect /> },

  {
    element: <AppLayout />,
    children: [
      {
        element: <RequireRole role="STUDENT" />,
        children: [
          { path: '/student/dashboard', element: <PlaceholderPage titleKey="pages.studentDashboard" /> },
          { path: '/student/lecturers/:lecturerId', element: <PlaceholderPage titleKey="pages.lecturerProfile" /> },
          { path: '/student/bookings', element: <PlaceholderPage titleKey="pages.myBookings" /> },
        ],
      },
      {
        element: <RequireRole role="LECTURER" />,
        children: [
          { path: '/lecturer/schedule', element: <PlaceholderPage titleKey="pages.lecturerSchedule" /> },
          { path: '/lecturer/office-hours', element: <PlaceholderPage titleKey="pages.officeHours" /> },
          { path: '/lecturer/office-hours/new', element: <PlaceholderPage titleKey="pages.newOfficeHour" /> },
        ],
      },
      {
        element: <RequireRole role="ADMIN" />,
        children: [
          { path: '/admin/seed', element: <PlaceholderPage titleKey="pages.adminSeed" /> },
          { path: '/admin/notifications', element: <PlaceholderPage titleKey="pages.adminNotifications" /> },
        ],
      },
      { path: '/403', element: <ForbiddenPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

// the component preview page exists only in `npm run dev`
if (import.meta.env.DEV) {
  routes.push({ path: '/dev', element: <DevPage /> });
}

export const router = createBrowserRouter(routes);
