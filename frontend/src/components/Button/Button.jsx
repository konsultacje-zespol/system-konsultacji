import styles from './Button.module.scss';

// reusable button component with variant styles and loading state support
export default function Button({
  variant = 'primary',
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...otherProps
}) {
  // block clicks while loading to prevent duplicate requests
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...otherProps}
      type={type}
      className={`${styles.button} ${styles[variant]} ${className}`}
      disabled={isDisabled}
      aria-busy={isLoading}
    >
      {children}
      {/* show ellipsis indicator while loading */}
      {isLoading && <span aria-hidden="true">…</span>}
    </button>
  );
}