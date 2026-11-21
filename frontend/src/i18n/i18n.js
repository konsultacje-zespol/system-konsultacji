import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pl from './pl.json';
import en from './en.json';

function getStartLanguage() {
  const savedLanguage = localStorage.getItem('lang');
  if (savedLanguage === 'en') {
    return 'en';
  }
  return 'pl';
}

// sync the HTML document language attribute on startup
const startLanguage = getStartLanguage();
document.documentElement.lang = startLanguage;

// initialize i18next with Polish and English translation bundles
i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
  },
  lng: startLanguage,
  fallbackLng: 'pl',
  interpolation: {
    // disable escaping since react already prevents XSS injection
    escapeValue: false,
  },
});

export default i18n;