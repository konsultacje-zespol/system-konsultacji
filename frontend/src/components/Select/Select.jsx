import { useId } from 'react';
import styles from './Select.module.scss';

// reusable select dropdown component with label and accessible error state
export default function Select({ label, error, id, className = '', children, ...selectProps }) {
  // generate a unique id fallback to link the label, select, and error message
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      {/* render native select with option children and validation aria attributes */}
      <select
        {...selectProps}
        id={selectId}
        className={error ? `${styles.select} ${styles.selectError}` : styles.select}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      >
        {children}
      </select>
      {/* show validation error message when present */}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}