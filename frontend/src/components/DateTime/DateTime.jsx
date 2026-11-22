import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../i18n/useLanguage.js';
import { formatDate, formatDateTime, formatTime } from '../../lib/dates.js';
import styles from './DateTime.module.scss';

// select the appropriate formatter based on the requested display format
function formatValue(iso, format, language) {
  if (format === 'date') {
    return formatDate(iso, language);
  }
  if (format === 'time') {
    return formatTime(iso, language);
  }
  return formatDateTime(iso, language);
}

// displays a UTC ISO timestamp in Polish local time using the active language
export default function DateTime({ iso, format = 'datetime', showLabel = false }) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const text = formatValue(iso, format, language);

  // keep the machine-readable ISO string on the semantic time element
  return (
    <time dateTime={iso} className={styles.dateTime}>
      {text}
      {/* optionally append the localized timezone label */}
      {showLabel && <span className={styles.label}> ({t('common.polishTime')})</span>}
    </time>
  );
}