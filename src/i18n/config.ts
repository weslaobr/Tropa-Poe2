/**
 * i18n/config.ts — i18next initialization
 *
 * IMPORTANT RULE: UI strings (buttons, menus, labels) are translated.
 * Game content strings (gem names, passive names, item names, modifiers)
 * must NEVER be translated — they come directly from the GGG API/build file
 * in English and should remain so.
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ptBR from './locales/pt-BR.json'
import en from './locales/en.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      'en':    { translation: en  },
    },
    lng: 'pt-BR',            // Default language
    fallbackLng: 'en',       // Fall back to English if key missing
    interpolation: {
      escapeValue: false,    // React already handles XSS
    },
    // Disable warnings for intentionally missing game-term keys
    saveMissing: false,
  })

export default i18n
