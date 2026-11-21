import { createBrowserRouter } from 'react-router-dom';
import PlaceholderPage from './pages/PlaceholderPage.jsx';

// application route definitions using placeholder pages until real views are built
export const router = createBrowserRouter([
  { path: '/login', element: <PlaceholderPage titleKey="pages.login" /> },
  { path: '/', element: <PlaceholderPage titleKey="pages.home" showLanguageButton /> },

  { path: '/student/dashboard', element: <PlaceholderPage titleKey="pages.studentDashboard" /> },
  { path: '/student/lecturers/:lecturerId', element: <PlaceholderPage titleKey="pages.lecturerProfile" /> },
  { path: '/student/bookings', element: <PlaceholderPage titleKey="pages.myBookings" /> },

  { path: '/lecturer/schedule', element: <PlaceholderPage titleKey="pages.lecturerSchedule" /> },
  { path: '/lecturer/office-hours', element: <PlaceholderPage titleKey="pages.officeHours" /> },
  { path: '/lecturer/office-hours/new', element: <PlaceholderPage titleKey="pages.newOfficeHour" /> },

  { path: '/admin/seed', element: <PlaceholderPage titleKey="pages.adminSeed" /> },
  { path: '/admin/notifications', element: <PlaceholderPage titleKey="pages.adminNotifications" /> },

  { path: '/403', element: <PlaceholderPage titleKey="pages.forbidden" /> },
  { path: '*', element: <PlaceholderPage titleKey="pages.notFound" /> },
]);