import { useId } from 'react';
import styles from './TextArea.module.scss';

// reusable controlled textarea component with label, error state, and optional character counter
export default function TextArea({ label, error, id, value, maxLength, rows = 4, className = '', ...textAreaProps }) {
  // generate a unique id fallback to link the label, textarea, and error message
  const generatedId = useId();
  const textAreaId = id || generatedId;
  const errorId = `${textAreaId}-error`;

  // calculate current character count from the controlled value
  const currentLength = value ? value.length : 0;

  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={textAreaId} className={styles.label}>
        {label}
      </label>
      {/* render native textarea with validation aria attributes */}
      <textarea
        {...textAreaProps}
        id={textAreaId}
        value={value}
        maxLength={maxLength}
        rows={rows}
        className={error ? `${styles.textArea} ${styles.textAreaError}` : styles.textArea}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {/* footer row displaying either the validation error or a spacer alongside the character counter */}
      <div className={styles.footer}>
        {error ? (
          <p id={errorId} className={styles.error}>
            {error}
          </p>
        ) : (
          <span />
        )}
        {maxLength && (
          <span className={styles.counter}>
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}