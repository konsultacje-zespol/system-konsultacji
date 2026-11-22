import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../i18n/useLanguage.js';
import styles from './LanguageSwitcher.module.scss';

// toggle control for switching the active language between Polish and English
export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  // group buttons and expose active state to screen readers via aria-pressed
  return (
    <div role="group" aria-label={t('languageSwitcher.label')} className={styles.switcher}>
      <button
        type="button"
        className={language === 'pl' ? `${styles.option} ${styles.active}` : styles.option}
        aria-pressed={language === 'pl'}
        onClick={() => changeLanguage('pl')}
      >
        PL
      </button>
      <span className={styles.separator} aria-hidden="true">
        |
      </span>
      <button
        type="button"
        className={language === 'en' ? `${styles.option} ${styles.active}` : styles.option}
        aria-pressed={language === 'en'}
        onClick={() => changeLanguage('en')}
      >
        EN
      </button>
    </div>
  );
}