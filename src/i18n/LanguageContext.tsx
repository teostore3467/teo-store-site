import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  translations,
  type Language,
} from './translations'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
  t: (typeof translations)[Language]

  currencyLabel: string
  formatCurrencyText: (text: string) => string
}

const LanguageContext =
  createContext<LanguageContextValue | null>(null)

type LanguageProviderProps = {
  children: ReactNode
}

function getInitialLanguage(): Language {
  const savedLanguage =
    localStorage.getItem('teo-language')

  if (
    savedLanguage === 'fr' ||
    savedLanguage === 'ar'
  ) {
    return savedLanguage
  }

  return 'fr'
}

export function LanguageProvider({
  children,
}: LanguageProviderProps) {
  const [language, setLanguage] =
    useState<Language>(getInitialLanguage)

  useEffect(() => {
    localStorage.setItem(
      'teo-language',
      language,
    )

    document.documentElement.lang =
      language

    document.documentElement.dir =
      language === 'ar'
        ? 'rtl'
        : 'ltr'
  }, [language])

  const toggleLanguage = () => {
    setLanguage((currentLanguage) =>
      currentLanguage === 'fr'
        ? 'ar'
        : 'fr',
    )
  }

  const currencyLabel =
    language === 'ar'
      ? 'أوقية جديدة'
      : 'MRU'

  const formatCurrencyText = (
    text: string,
  ) => {
    if (language === 'ar') {
      return text.replace(
        /\bMRU\b/g,
        'أوقية جديدة',
      )
    }

    return text
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: translations[language],
      currencyLabel,
      formatCurrencyText,
    }),
    [
      language,
      currencyLabel,
    ],
  )

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(
    LanguageContext,
  )

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider',
    )
  }

  return context
}