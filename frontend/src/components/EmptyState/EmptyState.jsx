import styles from './EmptyState.module.scss';

// placeholder component shown when a list or section has no content
export default function EmptyState({ title, text, action }) {
  return (
    <div className={styles.emptyState}>
      {/* primary heading describing the empty state */}
      <p className={styles.title}>{title}</p>
      {/* optional supporting description */}
      {text && <p className={styles.text}>{text}</p>}
      {/* optional call-to-action element (e.g. a button) */}
      {action && <div>{action}</div>}
    </div>
  );
}