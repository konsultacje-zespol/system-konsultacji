import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal/Modal.jsx';
import Button from '../Button/Button.jsx';
import TextArea from '../TextArea/TextArea.jsx';
import styles from './ConfirmDialog.module.scss';

// confirmation modal with optional reason input and async submit handling
export default function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  variant = 'default',
  reason,
  onConfirm,
  error,
}) {
  const { t } = useTranslation();
  const [reasonText, setReasonText] = useState('');
  const [isPending, setIsPending] = useState(false);

  // reset reason input each time the dialog opens
  useEffect(() => {
    if (open) {
      setReasonText('');
    }
  }, [open]);

  // check whether a required reason meets the minimum length (ignoring whitespace)
  function isReasonTooShort() {
    if (!reason || !reason.required) {
      return false;
    }
    const minLength = reason.minLength || 1;
    return reasonText.trim().length < minLength;
  }

  // execute the async confirm handler while locking the confirm button
  async function handleConfirm() {
    setIsPending(true);
    try {
      await onConfirm(reasonText);
    } catch {
      // swallow rejection so the parent displays the error without clearing user input
    } finally {
      setIsPending(false);
    }
  }

  // map dialog variant to the corresponding confirm button style
  const confirmVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {description && <p>{description}</p>}

      {/* render optional reason textarea and minimum length hint */}
      {reason && (
        <div>
          <TextArea
            label={reason.required ? `${reason.label} *` : reason.label}
            value={reasonText}
            onChange={(event) => setReasonText(event.target.value)}
            maxLength={reason.maxLength}
            required={reason.required}
          />
          {reason.required && reason.minLength && (
            <p className={styles.hint}>{t('confirmDialog.minLength', { count: reason.minLength })}</p>
          )}
        </div>
      )}

      {/* announce error message immediately to screen readers */}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {/* cancel and confirm action buttons */}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant={confirmVariant} onClick={handleConfirm} isLoading={isPending} disabled={isReasonTooShort()}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}