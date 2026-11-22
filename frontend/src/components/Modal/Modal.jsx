import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Modal.module.scss';

// accessible modal component built on the native html dialog element
export default function Modal({ open, onClose, title, children }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const titleId = useId();

  // sync the open prop with the native dialog showModal and close methods
  useEffect(() => {
    const dialog = dialogRef.current;

    if (open && !dialog.open) {
      dialog.showModal();
      return;
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // the browser fires "close" when the user presses Esc (and also after our dialog.close()).
  // we tell the parent, so it can set its own "open" state to false.
  useEffect(() => {
    const dialog = dialogRef.current;

    function handleDialogClose() {
      onClose();
    }

    dialog.addEventListener('close', handleDialogClose);
    // cleanup: remove the old listener before adding a new one (onClose can change between renders)
    return () => dialog.removeEventListener('close', handleDialogClose);
  }, [onClose]);

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId}>
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <button type="button" className={styles.closeButton} aria-label={t('common.close')} onClick={onClose}>
          ×
        </button>
      </div>
      {/* the content is rendered only while the modal is open, so a closed modal keeps no old data */}
      {open && <div className={styles.content}>{children}</div>}
    </dialog>
  );
}
