import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

// Import translation files
import en from './translations/en.json';
import hi from './translations/hi.json';
import gu from './translations/gu.json';
import mr from './translations/mr.json';

const resources = {
  en: {
    translation: en,
  },
  hi: {
    translation: hi,
  },
  gu: {
    translation: gu,
  },
  mr: {
    translation: mr,
  },
};

// Get device language
const getDeviceLanguage = () => {
  const locales = RNLocalize.getLocales();
  if (locales.length > 0) {
    const deviceLanguage = locales[0].languageCode;
    // Check if we support this language
    if (deviceLanguage in resources) {
      return deviceLanguage;
    }
  }
  return 'en'; // Default to English
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n; 