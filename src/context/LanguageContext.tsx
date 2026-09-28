import React, { createContext, useContext, useState } from 'react';
import { TranslationStrings, fr, en } from '../i18n';

export type Language = 'fr' | 'en';

const SUPPORTED_LANGUAGES: Language[] = ['fr', 'en'];

const translations: Record<Language, TranslationStrings> = {
  fr,
  en,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationStrings;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('allora_language') as Language | null;
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
    const navPrefix = navigator.language.slice(0, 2).toLowerCase() as Language;
    if (SUPPORTED_LANGUAGES.includes(navPrefix)) return navPrefix;
    return 'fr'; // Français - langue par défaut
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('allora_language', lang);
  };

  const t = translations[language] || fr;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
