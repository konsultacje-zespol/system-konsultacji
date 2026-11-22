import { useTranslation } from 'react-i18next';
import Button from '../Button/Button.jsx';
import styles from './ErrorState.module.scss';

// code comes from getErrorCode(error), e.g. 'NETWORK_ERROR'
export default function ErrorState({ code, onRetry }) {
  const { t } = useTranslation();

  // an unknown code (missing in pl.json / en.json) falls back to the general server error text
  const message = t(`errors.${code}`, { defaultValue: t('errors.INTERNAL_ERROR') });

  return (
    <div role="alert" className={styles.errorState}>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
