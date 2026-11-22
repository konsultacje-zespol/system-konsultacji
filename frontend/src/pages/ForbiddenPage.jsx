import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider.jsx';
import { roleHome } from '../auth/role-home.js';
import styles from './ForbiddenPage.module.scss';

// 403 page shown when a user lacks permission to access a route
export default function ForbiddenPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // pick the redirect target and link label based on authentication state
  const homePath = user ? roleHome(user.role) : '/login';
  const homeLabel = user ? t('forbidden.goHome') : t('forbidden.goLogin');

  return (
    <main className={`page-container ${styles.page}`}>
      {/* display localized forbidden heading, message, and return link */}
      <h1>{t('pages.forbidden')}</h1>
      <p className={styles.text}>{t('forbidden.description')}</p>
      <Link to={homePath}>{homeLabel}</Link>
    </main>
  );
}