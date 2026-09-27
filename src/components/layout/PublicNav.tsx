import {
  NavLink,
} from 'react-router-dom'

import {
  useLanguage,
} from '../../i18n/LanguageContext'

function PublicNav() {
  const {
    language,
  } = useLanguage()

  const isArabic =
    language === 'ar'

  const navItems = [
    {
      label:
        isArabic
          ? 'الرئيسية'
          : 'Accueil',

      to: '/',

      end: true,
    },
    {
      label:
        isArabic
          ? 'الخدمات الرقمية'
          : 'Services numériques',

      to:
        '/services-numeriques',

      end: false,
    },
  ]

  return (
    <nav
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
      className="hidden items-center gap-2 md:flex"
      aria-label={
        isArabic
          ? 'التنقل الرئيسي'
          : 'Navigation principale'
      }
    >
      {navItems.map(
        (
          item,
        ) => (
          <NavLink
            key={
              item.to
            }
            to={
              item.to
            }
            end={
              item.end
            }
            className={({
              isActive,
            }) =>
              [
                'flex h-10 items-center justify-center rounded-xl px-4 text-sm font-black transition-all duration-200',
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700',
              ].join(
                ' ',
              )
            }
          >
            {
              item.label
            }
          </NavLink>
        ),
      )}
    </nav>
  )
}

export default PublicNav