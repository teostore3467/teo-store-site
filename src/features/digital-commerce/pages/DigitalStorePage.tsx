import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'

import DigitalCategoriesSection from '../components/DigitalCategoriesSection'
import DigitalProductsSection from '../components/DigitalProductsSection'
import EsimSection from '../components/EsimSection'

import {
  getLocalizedCategory,
  getLocalizedServiceName,
} from '../data/serviceCatalogTranslations'

import { searchServices } from '../utils/searchServices'

const categorySearchTerms: Record<
  string,
  {
    fr: string
    ar: string
  }
> = {
  ai: {
    fr: 'Intelligence artificielle',
    ar: 'الذكاء الاصطناعي',
  },

  gaming: {
    fr: 'Gaming',
    ar: 'الألعاب',
  },

  streaming: {
    fr: 'Streaming',
    ar: 'البث',
  },

  design: {
    fr: 'Design',
    ar: 'التصميم',
  },

  software: {
    fr: 'Logiciels',
    ar: 'البرامج',
  },

  'gift-cards': {
    fr: 'Gift Cards',
    ar: 'بطاقات الهدايا',
  },

  social: {
    fr: 'Social',
    ar: 'الخدمات الاجتماعية',
  },
}

type StoreReviewSummary = {
  average_rating:
    | number
    | string
    | null

  review_count:
    | number
    | string
    | null
}

type PublicStoreReview = {
  rating: number
  comment: string | null
  created_at: string
  milestone: number
}

type RawPublicStoreReview = {
  rating?: unknown
  comment?: unknown
  created_at?: unknown
  milestone?: unknown
}

function DigitalStorePage() {
  const navigate =
    useNavigate()

  const [searchParams] =
    useSearchParams()

  const {
    language,
  } = useLanguage()

  const isArabic =
    language === 'ar'

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('')

  const [
    isSearchOpen,
    setIsSearchOpen,
  ] = useState(false)

  const [
    storeRating,
    setStoreRating,
  ] = useState(0)

  const [
    storeReviewCount,
    setStoreReviewCount,
  ] = useState(0)

  const [
    publicStoreReviews,
    setPublicStoreReviews,
  ] =
    useState<PublicStoreReview[]>(
      [],
    )

  const [
    isStoreRatingLoading,
    setIsStoreRatingLoading,
  ] = useState(true)

  const categoryParam =
    searchParams.get(
      'category',
    )

  useEffect(() => {
    if (!categoryParam) {
      return
    }

    const category =
      categorySearchTerms[
        categoryParam
      ]

    if (!category) {
      return
    }

    setSearchQuery(
      category[language],
    )

    setIsSearchOpen(
      true,
    )

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
  }, [
    categoryParam,
    language,
  ])

  useEffect(() => {
    let mounted = true

    const loadStoreReviews =
      async () => {
        setIsStoreRatingLoading(
          true,
        )

        try {
          const [
            summaryResponse,
            reviewsResponse,
          ] =
            await Promise.all([
              supabase.rpc(
                'get_store_review_summary',
              ),

              supabase.rpc(
                'get_public_store_reviews',
                {
                  p_limit: 4,
                },
              ),
            ])

          if (
            summaryResponse.error
          ) {
            console.error(
              'Unable to load store review summary:',
              summaryResponse.error,
            )
          }

          if (
            reviewsResponse.error
          ) {
            console.error(
              'Unable to load public store reviews:',
              reviewsResponse.error,
            )
          }

          if (!mounted) {
            return
          }

          if (
            summaryResponse.error
          ) {
            setStoreRating(0)

            setStoreReviewCount(
              0,
            )
          } else {
            const summary =
              Array.isArray(
                summaryResponse.data,
              )
                ? (
                    summaryResponse
                      .data[0] as
                      | StoreReviewSummary
                      | undefined
                  )
                : (
                    summaryResponse.data as
                      | StoreReviewSummary
                      | null
                  )

            const average =
              Number(
                summary
                  ?.average_rating ??
                  0,
              )

            const count =
              Number(
                summary
                  ?.review_count ??
                  0,
              )

            setStoreRating(
              Number.isFinite(
                average,
              )
                ? average
                : 0,
            )

            setStoreReviewCount(
              Number.isFinite(
                count,
              )
                ? count
                : 0,
            )
          }

          if (
            reviewsResponse.error
          ) {
            setPublicStoreReviews(
              [],
            )
          } else {
            const rawReviews =
              (
                reviewsResponse.data ??
                []
              ) as RawPublicStoreReview[]

            const reviews:
              PublicStoreReview[] =
              rawReviews.map(
                (
                  review:
                    RawPublicStoreReview,
                ) => ({
                  rating:
                    Number(
                      review.rating ??
                        0,
                    ),

                  comment:
                    typeof review.comment ===
                    'string'
                      ? review.comment
                      : null,

                  created_at:
                    typeof review.created_at ===
                    'string'
                      ? review.created_at
                      : '',

                  milestone:
                    Number(
                      review.milestone ??
                        0,
                    ),
                }),
              )

            const validReviews:
              PublicStoreReview[] =
              reviews.filter(
                (
                  review:
                    PublicStoreReview,
                ) =>
                  Number.isFinite(
                    review.rating,
                  ) &&
                  review.rating >=
                    1 &&
                  review.rating <=
                    5,
              )

            setPublicStoreReviews(
              validReviews,
            )
          }
        } catch (error) {
          console.error(
            'Unable to load store reviews:',
            error,
          )

          if (mounted) {
            setStoreRating(0)

            setStoreReviewCount(
              0,
            )

            setPublicStoreReviews(
              [],
            )
          }
        } finally {
          if (mounted) {
            setIsStoreRatingLoading(
              false,
            )
          }
        }
      }

    void loadStoreReviews()

    return () => {
      mounted = false
    }
  }, [])

  const results =
    useMemo(() => {
      return searchServices(
        searchQuery,
        8,
      )
    }, [
      searchQuery,
    ])

  const hasQuery =
    searchQuery
      .trim()
      .length > 0

  const handleSearchChange =
    (
      value: string,
    ) => {
      setSearchQuery(
        value,
      )

      setIsSearchOpen(
        true,
      )
    }

  const handleServiceSelect =
    (
      slug: string,
    ) => {
      setSearchQuery('')

      setIsSearchOpen(
        false,
      )

      navigate(
        `/services-numeriques/${slug}`,
      )
    }

  const handleSearchSubmit =
    () => {
      if (
        results.length ===
        0
      ) {
        return
      }

      handleServiceSelect(
        results[0]
          .service
          .slug,
      )
    }

  const normalizedStoreRating =
    Math.max(
      0,
      Math.min(
        5,
        storeRating,
      ),
    )

  const roundedStoreRating =
    Math.round(
      normalizedStoreRating,
    )

  const renderStars =
    (
      rating: number,
      sizeClass =
        'text-lg',
    ) => {
      const normalizedRating =
        Math.max(
          0,
          Math.min(
            5,
            Math.round(
              rating,
            ),
          ),
        )

      return (
        <div
          dir="ltr"
          className="flex items-center gap-0.5"
        >
          {[
            1,
            2,
            3,
            4,
            5,
          ].map(
            (
              star,
            ) => (
              <span
                key={
                  star
                }
                className={[
                  sizeClass,
                  'leading-none',
                  star <=
                  normalizedRating
                    ? 'text-amber-400'
                    : 'text-slate-200',
                ].join(
                  ' ',
                )}
              >
                ★
              </span>
            ),
          )}
        </div>
      )
    }

  const formatReviewDate =
    (
      value: string,
    ) => {
      if (!value) {
        return ''
      }

      const date =
        new Date(
          value,
        )

      if (
        Number.isNaN(
          date.getTime(),
        )
      ) {
        return ''
      }

      try {
        return new Intl.DateTimeFormat(
          isArabic
            ? 'ar-MR-u-nu-latn'
            : 'fr-FR-u-nu-latn',
          {
            year:
              'numeric',

            month:
              'short',

            day:
              'numeric',

            numberingSystem:
              'latn',
          },
        ).format(
          date,
        )
      } catch {
        return ''
      }
    }

  return (
    <main className="bg-[#f7f9fc]">
      <section
        className="relative overflow-visible border-b border-white/10 py-8 text-white sm:py-10 lg:py-12"
        style={{
          background:
            'linear-gradient(135deg, #06101f 0%, #12275a 48%, #1d4ed8 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full blur-3xl"
          style={{
            backgroundColor:
              'rgba(96,165,250,0.18)',
          }}
        />

        <div
          className="pointer-events-none absolute bottom-0 left-0 h-52 w-52 rounded-full blur-3xl"
          style={{
            backgroundColor:
              'rgba(99,102,241,0.16)',
          }}
        />

        <Container>
          <div
            className={[
              'relative mx-auto max-w-4xl',
              isArabic
                ? 'text-right'
                : 'text-left',
            ].join(
              ' ',
            )}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-300 sm:text-[10px]">
              TEO STORE
            </p>

            <h1 className="mt-2 max-w-3xl text-[32px] font-black leading-[1.08] tracking-[-0.035em] sm:text-[40px] lg:text-[46px]">
              {isArabic
                ? 'أرقى خدماتك الرقمية، ببساطة وسرعة'
                : 'Vos services numériques, simplement.'}
            </h1>

            <p className="mt-3 max-w-2xl text-[12px] leading-6 text-white/65 sm:text-sm">
              {isArabic
                ? 'اكتشف الذكاء الاصطناعي، الألعاب، البث، التصميم، البرامج، بطاقات الهدايا، الخدمات الاجتماعية وeSIM في مكان واحد.'
                : 'Découvrez l’IA, le gaming, le streaming, le design, les logiciels, les cartes cadeaux, les services sociaux et l’eSIM au même endroit.'}
            </p>

            <div className="relative mt-6 max-w-2xl">
              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={[
                    'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/50',
                    isArabic
                      ? 'right-4'
                      : 'left-4',
                  ].join(
                    ' ',
                  )}
                  aria-hidden="true"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />

                  <path d="m20 20-3.5-3.5" />
                </svg>

                <input
                  type="search"
                  value={
                    searchQuery
                  }
                  onChange={(
                    event,
                  ) =>
                    handleSearchChange(
                      event.target
                        .value,
                    )
                  }
                  onFocus={() =>
                    setIsSearchOpen(
                      true,
                    )
                  }
                  onKeyDown={(
                    event,
                  ) => {
                    if (
                      event.key ===
                      'Enter'
                    ) {
                      event.preventDefault()

                      handleSearchSubmit()
                    }

                    if (
                      event.key ===
                      'Escape'
                    ) {
                      setIsSearchOpen(
                        false,
                      )
                    }
                  }}
                  placeholder={
                    isArabic
                      ? 'ابحث عن ChatGPT، Netflix، PUBG...'
                      : 'Recherchez ChatGPT, Netflix, PUBG...'
                  }
                  className={[
                    'h-12 w-full rounded-[16px] border border-white/15 bg-white/[0.09] text-xs font-semibold text-white outline-none backdrop-blur-md transition placeholder:font-normal placeholder:text-white/40 focus:border-white/30 focus:bg-white/[0.12] sm:text-sm',
                    isArabic
                      ? 'pr-11 pl-4'
                      : 'pl-11 pr-4',
                  ].join(
                    ' ',
                  )}
                />
              </div>

              {isSearchOpen &&
                hasQuery && (
                  <div
                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
                    dir={
                      isArabic
                        ? 'rtl'
                        : 'ltr'
                    }
                  >
                    {results.length >
                    0 ? (
                      <div className="p-1.5">
                        {results.map(
                          ({
                            service,
                          }) => (
                            <button
                              key={
                                service.slug
                              }
                              type="button"
                              onClick={() =>
                                handleServiceSelect(
                                  service.slug,
                                )
                              }
                              className={[
                                'flex w-full items-center justify-between gap-3 rounded-[13px] px-3 py-2.5 transition hover:bg-slate-50',
                                isArabic
                                  ? 'text-right'
                                  : 'text-left',
                              ].join(
                                ' ',
                              )}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-xs font-black text-slate-950 sm:text-sm">
                                  {getLocalizedServiceName(
                                    service,
                                    language,
                                  )}
                                </p>

                                <p className="mt-0.5 truncate text-[9px] font-semibold text-slate-400">
                                  {getLocalizedCategory(
                                    service.category,
                                    language,
                                  )}
                                </p>
                              </div>

                              <span
                                className={[
                                  'shrink-0 text-xs font-black text-blue-600',
                                  isArabic
                                    ? 'rotate-180'
                                    : '',
                                ].join(
                                  ' ',
                                )}
                              >
                                →
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="px-4 py-5 text-center">
                        <p className="text-xs font-black text-slate-800">
                          {isArabic
                            ? 'لم يتم العثور على خدمة'
                            : 'Aucun service trouvé'}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          {isArabic
                            ? 'جرّب اسمًا آخر.'
                            : 'Essayez un autre nom.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[8px] font-bold text-white/60">
                {isArabic
                  ? 'الذكاء الاصطناعي'
                  : 'IA'}
              </span>

              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[8px] font-bold text-white/60">
                {isArabic
                  ? 'الألعاب'
                  : 'Gaming'}
              </span>

              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[8px] font-bold text-white/60">
                {isArabic
                  ? 'البث'
                  : 'Streaming'}
              </span>

              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[8px] font-bold text-white/60">
                eSIM
              </span>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <Container className="py-6 sm:py-8">
          <div
            dir={
              isArabic
                ? 'rtl'
                : 'ltr'
            }
            className="mx-auto max-w-5xl"
          >
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_34px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-5 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-amber-50 text-xl text-amber-400">
                    ★
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
                      {isArabic
                        ? 'تقييم TEO STORE'
                        : 'AVIS TEO STORE'}
                    </p>

                    <h2 className="mt-1 text-lg font-black text-slate-950 sm:text-xl">
                      {isArabic
                        ? 'ماذا يقول عملاؤنا؟'
                        : 'Ce que disent nos clients'}
                    </h2>

                    <p className="mt-1 max-w-xl text-[10px] leading-5 text-slate-500 sm:text-xs">
                      {isArabic
                        ? 'تقييمات من عملاء أكملوا طلباتهم عبر TEO STORE.'
                        : 'Des évaluations laissées par des clients ayant terminé leurs commandes sur TEO STORE.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 rounded-[18px] bg-slate-50 px-4 py-3">
                  {isStoreRatingLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                      <span className="text-xs font-bold text-slate-400">
                        {isArabic
                          ? 'جارٍ التحميل...'
                          : 'Chargement...'}
                      </span>
                    </div>
                  ) : storeReviewCount >
                    0 ? (
                    <div className="flex items-center gap-4">
                      <div>
                        {renderStars(
                          roundedStoreRating,
                        )}

                        <p className="mt-1 text-[9px] font-bold text-slate-400">
                          {
                            storeReviewCount
                          }{' '}
                          {isArabic
                            ? 'تقييم'
                            : 'avis'}
                        </p>
                      </div>

                      <div
                        dir="ltr"
                        className="border-l border-slate-200 pl-4 text-center"
                      >
                        <p className="text-2xl font-black text-slate-950">
                          {normalizedStoreRating.toFixed(
                            1,
                          )}
                        </p>

                        <p className="text-[9px] font-bold text-slate-400">
                          / 5
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-700">
                        {isArabic
                          ? 'لا توجد تقييمات بعد'
                          : 'Aucun avis pour le moment'}
                      </p>

                      <p className="mt-1 text-[9px] text-slate-400">
                        {isArabic
                          ? 'ستظهر هنا تقييمات العملاء.'
                          : 'Les avis clients apparaîtront ici.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!isStoreRatingLoading &&
                publicStoreReviews.length >
                  0 && (
                  <div className="p-5 sm:p-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {publicStoreReviews.map(
                        (
                          review:
                            PublicStoreReview,
                          index:
                            number,
                        ) => (
                          <article
                            key={`${review.created_at}-${review.milestone}-${index}`}
                            className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                {renderStars(
                                  review.rating,
                                  'text-base',
                                )}

                                <p className="mt-2 text-[9px] font-black text-slate-700">
                                  {isArabic
                                    ? 'عميل TEO STORE'
                                    : 'Client TEO STORE'}
                                </p>
                              </div>

                              <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[7px] font-black text-emerald-700">
                                ✓{' '}
                                {isArabic
                                  ? 'تقييم موثوق'
                                  : 'Avis vérifié'}
                              </span>
                            </div>

                            {review.comment &&
                              review.comment
                                .trim()
                                .length >
                                0 && (
                                <p className="mt-3 text-[10px] leading-5 text-slate-600 sm:text-xs">
                                  “
                                  {
                                    review.comment
                                  }
                                  ”
                                </p>
                              )}

                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3">
                              <span className="text-[8px] font-semibold text-slate-400">
                                {formatReviewDate(
                                  review.created_at,
                                )}
                              </span>

                              <span
                                dir="ltr"
                                className="text-[9px] font-black text-slate-700"
                              >
                                {
                                  review.rating
                                }
                                /5
                              </span>
                            </div>
                          </article>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {!isStoreRatingLoading &&
                storeReviewCount >
                  0 &&
                publicStoreReviews.length ===
                  0 && (
                  <div className="p-5 sm:p-6">
                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                      <p className="text-sm font-black text-slate-700">
                        {isArabic
                          ? 'لا توجد تعليقات مكتوبة حتى الآن'
                          : 'Aucun commentaire écrit pour le moment'}
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-400">
                        {isArabic
                          ? 'توجد تقييمات بالنجوم، وستظهر التعليقات هنا عند توفرها.'
                          : 'Des notes existent déjà. Les commentaires apparaîtront ici lorsqu’ils seront disponibles.'}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </Container>
      </section>

      <DigitalCategoriesSection />

      <DigitalProductsSection />

      <EsimSection />
    </main>
  )
}

export default DigitalStorePage