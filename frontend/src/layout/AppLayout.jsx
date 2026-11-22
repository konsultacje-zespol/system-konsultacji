import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';

// shared application layout wrapping route pages with the navigation bar
export default function AppLayout() {
  return (
    <>
      {/* persistent top navigation bar */}
      <Navbar />
      {/* render the active child route for the current URL */}
      <Outlet />
    </>
  );
}