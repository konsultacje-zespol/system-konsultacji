import { useId } from 'react';
import styles from './TextField.module.scss';

// reusable text input component with label and accessible error state
export default function TextField({ label, error, id, className = '', ...inputProps }) {
  // generate a unique id fallback to link the label, input, and error message
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      {/* render native input with validation aria attributes */}
      <input
        {...inputProps}
        id={inputId}
        className={error ? `${styles.input} ${styles.inputError}` : styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {/* show validation error message when present */}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}