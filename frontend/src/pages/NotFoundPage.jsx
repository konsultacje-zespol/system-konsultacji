import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider.jsx';
import { roleHome } from '../auth/role-home.js';
import styles from './NotFoundPage.module.scss';

// 404 page shown when the requested route does not exist
export default function NotFoundPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // pick the redirect target and link label based on authentication state
  const homePath = user ? roleHome(user.role) : '/login';
  const homeLabel = user ? t('notFound.goHome') : t('notFound.goLogin');

  return (
    <main className={`page-container ${styles.page}`}>
      {/* display localized not found heading, message, and return link */}
      <h1>{t('pages.notFound')}</h1>
      <p className={styles.text}>{t('notFound.description')}</p>
      <Link to={homePath}>{homeLabel}</Link>
    </main>
  );
}