import { LanguageCode, LanguageOption } from '../types';
import { de } from './locales/de';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { it } from './locales/it';
import { el } from './locales/el';
import { ru } from './locales/ru';

export const LANGUAGES: LanguageOption[] = [
  { code: 'de', label: 'Deutsch', nativeName: 'Deutsch', englishName: 'German', flag: '🇩🇪' },
  { code: 'en', label: 'Englisch', nativeName: 'English', englishName: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Französisch', nativeName: 'Français', englishName: 'French', flag: '🇫🇷' },
  { code: 'el', label: 'Griechisch', nativeName: 'Ελληνικά', englishName: 'Greek', flag: '🇬🇷' },
  { code: 'it', label: 'Italienisch', nativeName: 'Italiano', englishName: 'Italian', flag: '🇮🇹' },
  { code: 'ru', label: 'Russisch', nativeName: 'Русский', englishName: 'Russian', flag: '🇷🇺' },
  { code: 'es', label: 'Spanisch', nativeName: 'Español', englishName: 'Spanish', flag: '🇪🇸' },
];

export const translations = {
  de,
  en,
  fr,
  el,
  it,
  ru,
  es,
};

export type TranslationKey = keyof typeof de;
