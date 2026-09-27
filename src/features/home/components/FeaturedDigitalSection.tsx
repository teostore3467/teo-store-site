import {
  useEffect,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'

import {
  serviceCatalog,
  type ServiceCatalogItem,
} from '../../digital-commerce/data/serviceCatalog'

type ServiceLogoMap = Record<
  string,
  string
>

type ServiceLogoRow = {
  service_slug: string
  logo_path: string
}

const SERVICE_LOGOS_BUCKET =
  'service-logos'

function getLogoPublicUrl(
  path: string,
) {
  const { data } =
    supabase.storage
      .from(
        SERVICE_LOGOS_BUCKET,
      )
      .getPublicUrl(path)

  return data.publicUrl
}

function getCatalogService(
  slug: string,
): ServiceCatalogItem | undefined {
  return serviceCatalog.find(
    (service) =>
      service.slug === slug,
  )
}

function getAvailablePrices(
  service: ServiceCatalogItem,
) {
  return service.groups.flatMap(
    (group) =>
      group.plans
        .filter(
          (plan) =>
            plan.availability ===
            'available',
        )
        .map(
          (plan) =>
            plan.price,
        ),
  )
}

const digitalItems = [
  {
    name: 'ChatGPT Plus',
    slug: 'chatgpt-plus',
    accent:
      'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    fr: {
      description:
        'Recharge personnelle et compte partagé.',
      badge: 'Populaire',
    },
    ar: {
      description:
        'شحن شخصي وحساب مشترك حسب الصيغة.',
      badge: 'الأكثر طلبًا',
    },
  },
  {
    name: 'Gemini Pro',
    slug: 'gemini-pro',
    accent:
      'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    fr: {
      description:
        'Accès premium avec livraison sécurisée.',
      badge: 'Best Seller',
    },
    ar: {
      description:
        'وصول مميز مع تسليم آمن للخدمة.',
      badge: 'الأكثر مبيعًا',
    },
  },
  {
    name: 'Canva Pro',
    slug: 'canva-pro',
    accent:
      'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
    fr: {
      description:
        'Invitation e-mail ou lien direct selon la commande.',
      badge: 'Nouveau',
    },
    ar: {
      description:
        'دعوة عبر البريد أو رابط مباشر حسب الطلب.',
      badge: 'جديد',
    },
  },
  {
    name: 'Netflix',
    slug: 'netflix',
    accent:
      'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
    fr: {
      description:
        'Fenêtre privée selon la formule disponible.',
      badge: 'Populaire',
    },
    ar: {
      description:
        'نافذة خاصة حسب الخطة المتوفرة.',
      badge: 'الأكثر طلبًا',
    },
  },
]

function FeaturedDigitalSection() {
  const {
    language,
    t,
    formatCurrencyText,
  } = useLanguage()

  const [
    serviceLogos,
    setServiceLogos,
  ] =
    useState<ServiceLogoMap>({})

  const isArabic =
    language === 'ar'

  useEffect(() => {
    let isMounted = true

    const loadServiceLogos =
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from(
            'service_logos',
          )
          .select(
            'service_slug, logo_path',
          )

        if (!isMounted) {
          return
        }

        if (error) {
          console.error(
            'Unable to load featured service logos:',
            error,
          )

          return
        }

        const nextLogos:
          ServiceLogoMap = {}

        const rows =
          (data ??
            []) as ServiceLogoRow[]

        rows.forEach(
          (row) => {
            nextLogos[
              row.service_slug
            ] =
              getLogoPublicUrl(
                row.logo_path,
              )
          },
        )

        setServiceLogos(
          nextLogos,
        )
      }

    void loadServiceLogos()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="bg-white py-12 sm:py-16">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

              <span className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
                {
                  t.home
                    .popularSectionLabel
                }
              </span>
            </div>

            <h2 className="mt-4 text-[28px] font-black tracking-[-0.035em] text-slate-950 sm:text-3xl lg:text-4xl">
              {
                t.home
                  .popularSectionTitle
              }
            </h2>

            <p className="mt-2 max-w-xl text-[11px] leading-5 text-slate-500 sm:text-sm sm:leading-6">
              {
                t.home
                  .popularSectionDescription
              }
            </p>
          </div>

          <Link
            to="/services-numeriques"
            className="hidden h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black text-slate-700 transition hover:border-blue-200 hover:text-blue-600 sm:inline-flex"
          >
            {t.common.seeAll}

            <span
              className={
                isArabic
                  ? 'mr-2'
                  : 'ml-2'
              }
            >
              {isArabic
                ? '←'
                : '→'}
            </span>
          </Link>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {digitalItems.map(
            (item) => {
              const content =
                isArabic
                  ? item.ar
                  : item.fr

              const logo =
                serviceLogos[
                  item.slug
                ]

              const service =
                getCatalogService(
                  item.slug,
                )

              const availablePrices =
                service
                  ? getAvailablePrices(
                      service,
                    )
                  : []

              const minimumPrice =
                availablePrices.length >
                0
                  ? Math.min(
                      ...availablePrices,
                    )
                  : null

              const isOutOfStock =
                service?.availability ===
                'out_of_stock'

              const priceText =
                minimumPrice !== null
                  ? `${
                      isArabic
                        ? 'ابتداءً من '
                        : 'À partir de '
                    }${minimumPrice.toLocaleString(
                      'fr-FR',
                    )} MRU`
                  : isOutOfStock
                    ? isArabic
                      ? 'غير متوفر'
                      : 'Indisponible'
                    : isArabic
                      ? 'قريبًا'
                      : 'Bientôt'

              return (
                <Link
                  key={
                    item.name
                  }
                  to={`/services-numeriques/${item.slug}`}
                  className="group block"
                >
                  <article className="relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition duration-200 group-hover:-translate-y-1 group-hover:border-blue-200 group-hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:min-h-[250px] sm:p-4">
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-[0.07] blur-2xl"
                      style={{
                        background:
                          item.accent,
                      }}
                    />

                    <div className="relative flex items-start justify-between gap-2">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[13px] p-1.5 text-sm font-black text-white shadow-sm sm:h-11 sm:w-11 sm:text-base"
                        style={{
                          background:
                            item.accent,
                        }}
                      >
                        {logo ? (
                          <img
                            src={
                              logo
                            }
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          item.name.charAt(
                            0,
                          )
                        )}
                      </div>

                      <span className="max-w-[88px] truncate rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[8px] font-black text-slate-500 sm:max-w-none sm:text-[9px]">
                        {
                          content.badge
                        }
                      </span>
                    </div>

                    <div className="relative mt-4 flex flex-1 flex-col">
                      <h3 className="text-[14px] font-black leading-5 text-slate-950 sm:text-base">
                        {
                          item.name
                        }
                      </h3>

                      <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-slate-500 sm:text-xs">
                        {
                          content.description
                        }
                      </p>

                      <div className="mt-auto pt-4">
                        <p
                          className={[
                            'text-[10px] font-black sm:text-xs',
                            minimumPrice !== null
                              ? 'text-blue-600'
                              : isOutOfStock
                                ? 'text-rose-600'
                                : 'text-amber-600',
                          ].join(
                            ' ',
                          )}
                        >
                          {formatCurrencyText(
                            priceText,
                          )}
                        </p>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="text-[9px] font-black text-slate-800 sm:text-[10px]">
                            {
                              t.home
                                .seeService
                            }
                          </span>

                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-[11px] font-black text-slate-700 transition group-hover:bg-blue-600 group-hover:text-white">
                            {isArabic
                              ? '←'
                              : '→'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              )
            },
          )}
        </div>

        <Link
          to="/services-numeriques"
          className="mt-5 flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-[10px] font-black text-slate-700 transition hover:border-blue-200 hover:text-blue-600 sm:hidden"
        >
          {
            t.home
              .seeAllServices
          }

          <span
            className={
              isArabic
                ? 'mr-2'
                : 'ml-2'
            }
          >
            {isArabic
              ? '←'
              : '→'}
          </span>
        </Link>
      </Container>
    </section>
  )
}

export default FeaturedDigitalSection