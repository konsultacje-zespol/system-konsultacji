import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '../api/auth.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { roleHome } from '../auth/role-home.js';
import Button from '../components/Button/Button.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher.jsx';
import styles from './Navbar.module.scss';

// navigation menu items mapped by user role
const NAV_ITEMS = {
  STUDENT: [
    { labelKey: 'nav.findLecturer', path: '/student/dashboard' },
    { labelKey: 'nav.myBookings', path: '/student/bookings' },
  ],
  LECTURER: [
    { labelKey: 'nav.myWeek', path: '/lecturer/schedule' },
    { labelKey: 'nav.officeHours', path: '/lecturer/office-hours' },
  ],
  ADMIN: [
    { labelKey: 'nav.manageSeed', path: '/admin/seed' },
    { labelKey: 'nav.notificationLog', path: '/admin/notifications' },
  ],
};

// formats the user's full name, prepending their academic title if present
function formatUserName(user) {
  if (user.title) {
    return `${user.title} ${user.firstName} ${user.lastName}`;
  }
  return `${user.firstName} ${user.lastName}`;
}

// top navigation bar displaying role-specific links, user info, and logout control
export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // resolve menu items and home route for the current user
  const items = user ? NAV_ITEMS[user.role] || [] : [];
  const homePath = user ? roleHome(user.role) : '/login';

  // log out the user, clear cached queries, and redirect to the login page
  async function handleLogout() {
    try {
      await logout();
    } catch {
      // ignore request failures so the local session is still cleared
    }
    // tell the app right away that nobody is logged in — AuthProvider re-renders with user = null,
    // so the login page does not send us back (queryClient.clear() would not notify AuthProvider)
    queryClient.setQueryData(['me'], null);
    // remove the previous user's data (bookings, schedule…), but keep the "me" entry set to null
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'me' });
    navigate('/login', { replace: true });
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label={t('nav.label')}>
        {/* app logo linking to the user's home route */}
        <NavLink to={homePath} className={styles.logo}>
          {t('common.appShortName')}
        </NavLink>

        {/* role-specific navigation links with active route styling */}
        <ul className={styles.items}>
          {items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
              >
                {t(item.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* right-side controls: language toggle, user identity, and logout button */}
        <div className={styles.right}>
          <LanguageSwitcher />
          {user && (
            <>
              <span className={styles.user}>
                {formatUserName(user)}
                <span className={styles.role}> · {t(`common.role.${user.role}`)}</span>
              </span>
              <Button variant="secondary" onClick={handleLogout}>
                {t('nav.logout')}
              </Button>
            </>
          )}
        </div>
      </nav>
      {/* notice banner indicating demo environment */}
      <p className={styles.demoBanner}>{t('common.demoBanner')}</p>
    </header>
  );
}