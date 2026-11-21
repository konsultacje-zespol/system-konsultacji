import { useTranslation } from 'react-i18next';

// custom hook for reading and updating the active app language
export function useLanguage() {
  const { i18n } = useTranslation();

  // switches the language in i18next, localStorage, and the HTML lang attribute
  function changeLanguage(newLanguage) {
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('lang', newLanguage);
    document.documentElement.lang = newLanguage;
  }

  return { language: i18n.language, changeLanguage };
}