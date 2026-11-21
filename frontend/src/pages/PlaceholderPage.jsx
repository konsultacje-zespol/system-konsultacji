import { useTranslation } from 'react-i18next';
import { useLanguage } from '../i18n/useLanguage.js';

// temporary placeholder page for routes that are not implemented yet
export default function PlaceholderPage({ titleKey, showLanguageButton = false }) {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  // toggles the active language between Polish and English
  function handleLanguageClick() {
    if (language === 'pl') {
      changeLanguage('en');
      return;
    }
    changeLanguage('pl');
  }

  return (
    <main className="page-container">
      <p>{t('common.appName')}</p>
      <h1>{t(titleKey)}</h1>

      {showLanguageButton && (
        <button type="button" onClick={handleLanguageClick}>
          {t('common.switchLanguage')}
        </button>
      )}
    </main>
  );
}