import { useTranslation } from 'react-i18next';
import styles from './LocationLabel.module.scss';

// mode is 'IN_PERSON' or 'ONLINE' (LocationMode from the API)
export default function LocationLabel({ mode, location }) {
  const { t } = useTranslation();

  // show plain text for in-person locations
  if (mode !== 'ONLINE') {
    return <span className={styles.text}>{location}</span>;
  }

  // students get only the text "Microsoft Teams" before booking (the API hides the link),
  // so anything that is not an https:// link is shown as plain text
  const isLink = typeof location === 'string' && location.startsWith('https://');
  if (!isLink) {
    return <span className={styles.text}>{location}</span>;
  }

  // open the meeting link in a new tab safely without exposing window.opener
  return (
    <a href={location} target="_blank" rel="noopener noreferrer" className={styles.link}>
      {t('common.joinTeams')}
    </a>
  );
}
