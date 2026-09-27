import { Link } from 'react-router-dom'

import { useLanguage } from '../../i18n/LanguageContext'
import Container from './Container'

function PublicFooter() {
  const { language } = useLanguage()

  const isArabic = language === 'ar'

  const storeLinks = [
    {
      label: isArabic
        ? 'الخدمات الرقمية'
        : 'Services numériques',
      to: '/services-numeriques',
    },
    {
      label: isArabic
        ? 'متابعة الطلب'
        : 'Suivre une commande',
      to: '/connexion',
    },
    {
      label: isArabic
        ? 'طرق الدفع'
        : 'Paiements',
      to: '/services-numeriques',
    },
  ]

  const helpLinks = [
    {
      label: isArabic
        ? 'الأسئلة الشائعة'
        : 'FAQ',
      to: '/',
    },
    {
      label: isArabic
        ? 'الدعم'
        : 'Support',
      to: '/connexion',
    },
    {
      label: isArabic
        ? 'تسجيل الدخول'
        : 'Connexion',
      to: '/connexion',
    },
  ]

  const companyLinks = [
    {
      label: isArabic
        ? 'من نحن'
        : 'À propos',
      to: '/',
    },
    {
      label: isArabic
        ? 'الخصوصية'
        : 'Confidentialité',
      to: '/',
    },
    {
      label: isArabic
        ? 'الشروط'
        : 'Conditions',
      to: '/',
    },
  ]

  return (
    <footer
      className="relative overflow-hidden text-white"
      style={{
        background:
          'linear-gradient(135deg, #07101f 0%, #0b1530 58%, #111c3b 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full blur-3xl"
        style={{
          backgroundColor: 'rgba(37, 99, 235, 0.14)',
        }}
      />

      <Container className="relative">
        <div className="grid gap-10 py-12 sm:grid-cols-2 sm:py-14 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr] lg:gap-12">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black text-white shadow-lg"
                style={{
                  background:
                    'linear-gradient(135deg, #2563eb 0%, #4f46e5 65%, #7c3aed 100%)',
                }}
              >
                T
              </div>

              <div>
                <p className="text-sm font-black tracking-tight">
                  TEO STORE
                </p>

                <p className="text-[10px] font-medium text-white/45">
                  {isArabic
                    ? 'الخدمات الرقمية'
                    : 'Digital Services'}
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/50">
              {isArabic
                ? 'منصة بسيطة وسريعة وآمنة لشراء خدماتك الرقمية المفضلة.'
                : 'Une plateforme simple, rapide et sécurisée pour acheter vos services numériques préférés.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold text-white/55">
                {isArabic
                  ? 'دفع آمن'
                  : 'Paiement sécurisé'}
              </span>

              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold text-white/55">
                {isArabic
                  ? 'توصيل رقمي'
                  : 'Livraison digitale'}
              </span>

              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold text-white/55">
                {isArabic
                  ? 'دعم'
                  : 'Support'}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
              {isArabic
                ? 'الخدمات'
                : 'Services'}
            </p>

            <nav className="mt-4 grid gap-3">
              {storeLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm font-semibold text-white/55 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
              {isArabic
                ? 'المساعدة'
                : 'Aide'}
            </p>

            <nav className="mt-4 grid gap-3">
              {helpLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm font-semibold text-white/55 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
              TEO STORE
            </p>

            <nav className="mt-4 grid gap-3">
              {companyLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm font-semibold text-white/55 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-5 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {isArabic
              ? '©️ 2026 TEO STORE. جميع الحقوق محفوظة.'
              : '©️ 2026 TEO STORE. Tous droits réservés.'}
          </p>

          <p>
            {isArabic
              ? 'موريتانيا · MRU'
              : 'Mauritanie · MRU'}
          </p>
        </div>
      </Container>
    </footer>
  )
}

export default PublicFooter