import { Navigate } from 'react-router-dom';
import Spinner from '../components/Spinner/Spinner.jsx';
import { useAuth } from './AuthProvider.jsx';
import { roleHome } from './role-home.js';

// "/" sends a logged-in user to their role home, and a guest to /login
export default function HomeRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={roleHome(user.role)} replace />;
}
