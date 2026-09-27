import {
  Link,
} from 'react-router-dom'

import Container from '../../../components/layout/Container'
import {
  useLanguage,
} from '../../../i18n/LanguageContext'

import FAQSection from '../components/FAQSection'
import FeaturedDigitalSection from '../components/FeaturedDigitalSection'
import HowItWorksSection from '../components/HowItWorksSection'
import WhyTeoSection from '../components/WhyTeoSection'

function HomePage() {
  const {
    language,
    t,
  } = useLanguage()

  const isArabic =
    language === 'ar'

  const digitalCategories = [
    {
      key: 'ai',

      icon: 'AI',

      title:
        isArabic
          ? 'الذكاء الاصطناعي'
          : 'Intelligence artificielle',

      description:
        isArabic
          ? 'ChatGPT وGemini وخدمات الذكاء الاصطناعي المميزة.'
          : 'ChatGPT, Gemini et services IA premium.',

      iconClass:
        'bg-blue-500/15 text-blue-300',

      hoverClass:
        'hover:border-blue-400/20 hover:bg-blue-500/[0.08]',
    },

    {
      key: 'gaming',

      icon: 'G',

      title:
        isArabic
          ? 'الألعاب والشحن'
          : 'Gaming & Recharge',

      description:
        isArabic
          ? 'PUBG وFree Fire وخدمات شحن رقمية سريعة.'
          : 'PUBG, Free Fire et recharges numériques rapides.',

      iconClass:
        'bg-indigo-500/15 text-indigo-300',

      hoverClass:
        'hover:border-indigo-400/20 hover:bg-indigo-500/[0.08]',
    },

    {
      key: 'streaming',

      icon: 'S',

      title:
        isArabic
          ? 'البث والترفيه'
          : 'Streaming',

      description:
        isArabic
          ? 'Netflix وShahid وSpotify وخدمات ترفيه أخرى.'
          : 'Netflix, Shahid, Spotify et autres services.',

      iconClass:
        'bg-violet-500/15 text-violet-300',

      hoverClass:
        'hover:border-violet-400/20 hover:bg-violet-500/[0.08]',
    },

    {
      key: 'software',

      icon: 'P',

      title:
        isArabic
          ? 'الأدوات والبرامج'
          : 'Outils Premium',

      description:
        isArabic
          ? 'Adobe وCanva وWindows وبرامج وخدمات احترافية.'
          : 'Adobe, Canva, Windows et outils professionnels.',

      iconClass:
        'bg-sky-500/15 text-sky-300',

      hoverClass:
        'hover:border-sky-400/20 hover:bg-sky-500/[0.08]',
    },
  ]

  const trustItems = [
    {
      key: 'payment',

      label:
        t.home
          .securePayment,
    },

    {
      key: 'verified',

      label:
        t.home
          .verifiedProducts,
    },

    {
      key: 'delivery',

      label:
        t.home
          .fastDelivery,
    },
  ]

  const serviceHighlights = [
    {
      key: 'payment',

      label:
        isArabic
          ? 'الدفع'
          : 'Paiement',

      value:
        isArabic
          ? 'آمن'
          : 'Sécurisé',
    },

    {
      key: 'delivery',

      label:
        isArabic
          ? 'التسليم'
          : 'Livraison',

      value:
        isArabic
          ? 'سريع'
          : 'Rapide',
    },

    {
      key: 'support',

      label:
        isArabic
          ? 'الدعم'
          : 'Support',

      value:
        isArabic
          ? 'متوفر'
          : 'Disponible',
    },
  ]

  return (
    <main
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
      className="overflow-hidden bg-white"
    >
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#06101f_0%,#0b1530_38%,#172554_70%,#312e81_100%)] text-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-blue-600/25 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-44 left-[12%] h-[430px] w-[430px] rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="pointer-events-none absolute right-[22%] top-[18%] h-[280px] w-[280px] rounded-full bg-violet-600/10 blur-3xl" />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_35%)]" />

        <Container className="relative py-14 sm:py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
            {/* HERO CONTENT */}
            <div className="relative z-10">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-xs font-bold text-white/80 shadow-sm backdrop-blur-xl sm:text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.75)]" />

                <span className="truncate">
                  {
                    t.home
                      .heroBadge
                  }
                </span>
              </div>

              <h1 className="mt-6 max-w-3xl text-[2.55rem] font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl xl:text-[4rem]">
                {
                  t.home
                    .heroTitleLine1
                }

                <span className="block">
                  {
                    t.home
                      .heroTitleLine2
                  }
                </span>

                <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {
                    t.home
                      .heroTitleLine3
                  }
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-[15px] leading-7 text-white/70 sm:text-base sm:leading-8">
                {
                  t.home
                    .heroDescription
                }
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/services-numeriques"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-sm font-black text-white shadow-[0_14px_34px_rgba(37,99,235,0.28)] transition duration-200 hover:-translate-y-0.5 hover:from-blue-500 hover:to-indigo-500 sm:w-auto"
                >
                  <span>
                    {
                      t.home
                        .exploreServices
                    }
                  </span>

                  <span
                    className={
                      isArabic
                        ? 'rotate-180'
                        : ''
                    }
                  >
                    →
                  </span>
                </Link>

                <Link
                  to="/connexion"
                  className="inline-flex h-12 w-full items-center justify-center rounded-[14px] border border-white/15 bg-white/[0.07] px-6 text-sm font-black text-white backdrop-blur-xl transition duration-200 hover:border-white/25 hover:bg-white/10 sm:w-auto"
                >
                  {
                    t.common
                      .myAccount
                  }
                </Link>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6">
                {trustItems.map(
                  (
                    item,
                  ) => (
                    <div
                      key={
                        item.key
                      }
                      className="flex items-center gap-2.5 text-sm font-semibold text-white/65"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-xs font-black text-emerald-300">
                        ✓
                      </span>

                      <span>
                        {
                          item.label
                        }
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* HERO DIGITAL CARD */}
            <div className="relative mx-auto w-full max-w-[620px] lg:mx-0">
              <div className="absolute inset-10 rounded-[42px] bg-blue-600/20 blur-3xl" />

              <div className="absolute -left-3 top-8 h-[88%] w-full rounded-[34px] border border-white/[0.05] bg-white/[0.025]" />

              <div className="absolute -left-1.5 top-4 h-[94%] w-full rounded-[34px] border border-white/[0.07] bg-white/[0.035]" />

              <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.075] p-4 shadow-[0_34px_90px_rgba(0,0,0,0.30)] backdrop-blur-2xl sm:p-6">
                <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                      TEO STORE
                    </p>

                    <h2 className="mt-1.5 text-xl font-black sm:text-2xl">
                      {isArabic
                        ? 'الخدمات الرقمية'
                        : 'Services numériques'}
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-white/45 sm:text-sm">
                      {isArabic
                        ? 'خدمات رقمية مختارة بعناية في مكان واحد.'
                        : 'Des services numériques sélectionnés au même endroit.'}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-lg font-black text-white shadow-[0_10px_30px_rgba(37,99,235,0.26)] sm:h-14 sm:w-14 sm:text-xl">
                    T
                  </div>
                </div>

                <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
                  {digitalCategories.map(
                    (
                      item,
                    ) => (
                      <div
                        key={
                          item.key
                        }
                        className={[
                          'group rounded-[20px] border border-white/10 bg-white/[0.055] p-4 transition duration-200',
                          item.hoverClass,
                        ].join(
                          ' ',
                        )}
                      >
                        <div
                          className={[
                            'flex h-10 w-10 items-center justify-center rounded-[13px] text-sm font-black',
                            item.iconClass,
                          ].join(
                            ' ',
                          )}
                        >
                          {
                            item.icon
                          }
                        </div>

                        <p className="mt-4 text-[15px] font-black text-white sm:text-base">
                          {
                            item.title
                          }
                        </p>

                        <p className="mt-1.5 text-xs leading-5 text-white/50 sm:text-[13px]">
                          {
                            item.description
                          }
                        </p>
                      </div>
                    ),
                  )}
                </div>

                <div className="relative mt-3 grid grid-cols-3 gap-2.5">
                  {serviceHighlights.map(
                    (
                      item,
                    ) => (
                      <div
                        key={
                          item.key
                        }
                        className="rounded-[15px] border border-white/[0.08] bg-black/10 p-3 sm:p-3.5"
                      >
                        <p className="text-[11px] font-semibold text-white/40 sm:text-xs">
                          {
                            item.label
                          }
                        </p>

                        <p className="mt-1 text-xs font-black text-white/90 sm:text-sm">
                          {
                            item.value
                          }
                        </p>
                      </div>
                    ),
                  )}
                </div>

                <div className="relative mt-4 flex items-center justify-between rounded-[17px] border border-white/[0.08] bg-black/10 px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-white/50">
                      {isArabic
                        ? 'تصفح جميع الخدمات'
                        : 'Découvrir tous les services'}
                    </p>

                    <p className="mt-0.5 text-sm font-black text-white">
                      TEO STORE
                    </p>
                  </div>

                  <Link
                    to="/services-numeriques"
                    aria-label={
                      isArabic
                        ? 'عرض جميع الخدمات الرقمية'
                        : 'Voir tous les services numériques'
                    }
                    className={[
                      'flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-black text-slate-950 transition hover:scale-105',
                      isArabic
                        ? 'rotate-180'
                        : '',
                    ].join(
                      ' ',
                    )}
                  >
                    →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <FeaturedDigitalSection />

      <WhyTeoSection />

      <HowItWorksSection />

      <FAQSection />
    </main>
  )
}

export default HomePage