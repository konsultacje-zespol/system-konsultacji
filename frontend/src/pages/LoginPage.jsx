import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getMockUsers, mockLogin } from '../api/auth.js';
import { getErrorCode } from '../api/errors.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { roleHome } from '../auth/role-home.js';
import Button from '../components/Button/Button.jsx';
import EmptyState from '../components/EmptyState/EmptyState.jsx';
import ErrorState from '../components/ErrorState/ErrorState.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher.jsx';
import Select from '../components/Select/Select.jsx';
import Spinner from '../components/Spinner/Spinner.jsx';
import styles from './LoginPage.module.scss';

// formats the user's full name, prepending their academic title if present
function formatUserName(user) {
  if (user.title) {
    return `${user.title} ${user.firstName} ${user.lastName}`;
  }
  return `${user.firstName} ${user.lastName}`;
}

// finds the first featured account matching the given role
function findFeaturedUser(featured, role) {
  return featured.find((user) => user.role === role) || null;
}

// filters the user list by a specific role
function usersWithRole(users, role) {
  return users.filter((user) => user.role === role);
}

// demo login page offering quick-login buttons and a full account selector
export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [loadingUserId, setLoadingUserId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');

  // fetch available demo accounts once without retrying on failure
  const mockUsersQuery = useQuery({
    queryKey: ['mock-users'],
    queryFn: getMockUsers,
    staleTime: Infinity,
    retry: false,
  });

  // show a spinner while checking the existing session
  if (isAuthLoading) {
    return (
      <div className={styles.page}>
        <Spinner />
      </div>
    );
  }

  // redirect already authenticated users to their role-specific home page
  if (user) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  // authenticate as the chosen demo user, update the auth cache, and navigate home
  async function handleLogin(userId) {
    setLoadingUserId(userId);
    try {
      const result = await mockLogin(userId);
      // seed the cached session user to avoid an extra /auth/me request
      queryClient.setQueryData(['me'], result.user);
      navigate(roleHome(result.user.role));
    } catch (error) {
      toast.error(t(`errors.${getErrorCode(error)}`));
    } finally {
      setLoadingUserId(null);
    }
  }

  // render loading, error, or login controls based on the mock users query state
  function renderBody() {
    if (mockUsersQuery.isPending) {
      return <Spinner />;
    }

    if (mockUsersQuery.isError) {
      const status = mockUsersQuery.error.response ? mockUsersQuery.error.response.status : null;
      // treat 404 as demo authentication being disabled on the backend
      if (status === 404) {
        return <EmptyState title={t('login.demoDisabled')} />;
      }
      return <ErrorState code={getErrorCode(mockUsersQuery.error)} onRetry={() => mockUsersQuery.refetch()} />;
    }

    const featured = mockUsersQuery.data.featured;
    const users = mockUsersQuery.data.users;
    const featuredStudent = findFeaturedUser(featured, 'STUDENT');
    const featuredLecturer = findFeaturedUser(featured, 'LECTURER');
    const featuredAdmin = findFeaturedUser(featured, 'ADMIN');

    return (
      <>
        {/* quick-login buttons for featured student, lecturer, and admin accounts */}
        <div className={styles.featured}>
          {featuredStudent && (
            <Button
              className={styles.featuredButton}
              isLoading={loadingUserId === featuredStudent.id}
              disabled={loadingUserId !== null && loadingUserId !== featuredStudent.id}
              onClick={() => handleLogin(featuredStudent.id)}
            >
              <span className={styles.featuredLabel}>{t('login.asStudent')}</span>
              <span className={styles.featuredName}>{formatUserName(featuredStudent)}</span>
            </Button>
          )}
          {featuredLecturer && (
            <Button
              className={styles.featuredButton}
              isLoading={loadingUserId === featuredLecturer.id}
              disabled={loadingUserId !== null && loadingUserId !== featuredLecturer.id}
              onClick={() => handleLogin(featuredLecturer.id)}
            >
              <span className={styles.featuredLabel}>{t('login.asLecturer')}</span>
              <span className={styles.featuredName}>{formatUserName(featuredLecturer)}</span>
            </Button>
          )}
          {featuredAdmin && (
            <Button
              className={styles.featuredButton}
              isLoading={loadingUserId === featuredAdmin.id}
              disabled={loadingUserId !== null && loadingUserId !== featuredAdmin.id}
              onClick={() => handleLogin(featuredAdmin.id)}
            >
              <span className={styles.featuredLabel}>{t('login.asAdmin')}</span>
              <span className={styles.featuredName}>{formatUserName(featuredAdmin)}</span>
            </Button>
          )}
        </div>

        {/* dropdown selector for signing in as any remaining demo account */}
        <div className={styles.otherUser}>
          <div className={styles.otherRow}>
            <Select
              label={t('login.otherUser')}
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
            >
              <option value="">{t('login.chooseAccount')}</option>
              <optgroup label={t('login.group.STUDENT')}>
                {usersWithRole(users, 'STUDENT').map((account) => (
                  <option key={account.id} value={account.id}>
                    {formatUserName(account)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t('login.group.LECTURER')}>
                {usersWithRole(users, 'LECTURER').map((account) => (
                  <option key={account.id} value={account.id}>
                    {formatUserName(account)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t('login.group.ADMIN')}>
                {usersWithRole(users, 'ADMIN').map((account) => (
                  <option key={account.id} value={account.id}>
                    {formatUserName(account)}
                  </option>
                ))}
              </optgroup>
            </Select>
            <Button
              isLoading={selectedUserId !== '' && loadingUserId === selectedUserId}
              disabled={selectedUserId === '' || (loadingUserId !== null && loadingUserId !== selectedUserId)}
              onClick={() => handleLogin(selectedUserId)}
            >
              {t('login.submit')}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={styles.page}>
      {/* language toggle positioned at the top of the login view */}
      <div className={styles.language}>
        <LanguageSwitcher />
      </div>
      {/* main login card with app title, description, and account controls */}
      <main className={styles.main}>
        <h1>{t('common.appName')}</h1>
        <p className={styles.description}>{t('login.description')}</p>
        {renderBody()}
      </main>
    </div>
  );
}