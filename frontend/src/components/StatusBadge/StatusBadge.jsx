import { useTranslation } from 'react-i18next';
import styles from './StatusBadge.module.scss';

// icon symbols mapped to booking and notification statuses
const ICONS = {
  CONFIRMED: '✓',
  CANCELLED_BY_STUDENT: '✕',
  CANCELLED_BY_LECTURER: '✕',
  PENDING: '…',
  SENT: '✓',
  FAILED: '!',
};

// style classes mapped to each status, paired with icons and text for accessibility
const COLOR_CLASSES = {
  CONFIRMED: styles.success,
  CANCELLED_BY_STUDENT: styles.muted,
  CANCELLED_BY_LECTURER: styles.danger,
  PENDING: styles.muted,
  SENT: styles.success,
  FAILED: styles.danger,
};

// displays a styled badge with an icon and localized label for a given status
export default function StatusBadge({ status }) {
  const { t } = useTranslation();

  // resolve icon and color class with safe fallbacks for unknown statuses
  const icon = ICONS[status] || '•';
  const colorClass = COLOR_CLASSES[status] || styles.muted;

  return (
    <span className={`${styles.badge} ${colorClass}`}>
      {/* decorative status icon hidden from screen readers */}
      <span aria-hidden="true">{icon}</span>
      {t(`status.${status}`)}
    </span>
  );
}