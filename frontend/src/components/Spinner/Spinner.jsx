import { useTranslation } from 'react-i18next';
import styles from './Spinner.module.scss';

// loading indicator component with accessible status announcement
export default function Spinner({ label }) {
  const { t } = useTranslation();

  // announce loading state to screen readers without shifting focus
  return (
    <div role="status" className={styles.spinner}>
      {/* visual spinning icon hidden from assistive technologies */}
      <span className={styles.circle} aria-hidden="true" />
      {/* display custom label or fallback localized loading text */}
      <span>{label || t('common.loading')}</span>
    </div>
  );
}