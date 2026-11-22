import { Navigate, Outlet } from 'react-router-dom';
import Spinner from '../components/Spinner/Spinner.jsx';
import { useAuth } from './AuthProvider.jsx';

// wraps a group of routes that only one role may open.
// while /auth/me is loading we show a spinner; then we redirect or render the child route.
export default function RequireRole({ role }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to="/403" replace />;
  }

  // <Outlet /> is where React Router puts the matching child route
  return <Outlet />;
}
