import { useLiveCatalog } from '../utils/useLiveCatalog'
import { Link } from 'react-router-dom'
import {
  useEffect,
  useMemo,
  useRef,
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

import { searchCatalog } from '../utils/searchCatalog'
import { useEsimCatalog } from '../data/useEsimCatalog'

const categoryNames: Record<string, string[]> = {
  ai: ['IA & Productivité'], gaming: ['Gaming', 'Jeux & Codes'], streaming: ['Streaming'],
  design: ['Design & Création'], software: ['Logiciels & Sécurité'],
  'gift-cards': ['Gift Cards'], social: ['Social & Premium'],
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

  const searchAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeOnOutside = (event: PointerEvent) => {
      if (!searchAreaRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [])

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

  const queryParam = searchParams.get('q') ?? ''
  const { catalog, loading: catalogLoading } = useLiveCatalog()
  const filteredServices = useMemo(() => {
    const categories = categoryParam ? categoryNames[categoryParam] : undefined
    const items = categories ? catalog.filter(service => categories.includes(service.category)) : catalog
    return items
  }, [catalog, categoryParam])
  const {countries:searchCountries,loading:esimSearchLoading,error:esimSearchError}=useEsimCatalog(!!queryParam.trim()||!!searchQuery.trim())
  const fullResults=useMemo(()=>searchCatalog(queryParam,filteredServices,categoryParam?[]:searchCountries,language),[queryParam,filteredServices,categoryParam,searchCountries,language])
  useEffect(() => {
    setSearchQuery(queryParam)
    setIsSearchOpen(false)
    window.scrollTo({ top: 0, left: 0 })
  }, [categoryParam, queryParam])

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

  const results=useMemo(()=>searchCatalog(searchQuery,catalog,searchCountries,language),[searchQuery,catalog,searchCountries,language])

  const hasQuery =
    searchQuery
      .trim()
      .length >= 2

  const handleSearchChange =
    (
      value: string,
    ) => {
      setSearchQuery(
        value,
      )

      setIsSearchOpen(
        value.trim().length >= 2,
      )
    }

  const handleServiceSelect =
    (
      href: string,
    ) => {
      setSearchQuery('')

      setIsSearchOpen(
        false,
      )

      navigate(
        href,
      )
    }

  const handleSearchSubmit = () => {
    const q = searchQuery.trim()
    setIsSearchOpen(false)
    navigate(q ? `/services-numeriques?q=${encodeURIComponent(q)}` : '/services-numeriques')
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

  if (categoryParam || queryParam) return (
    <main className="min-h-[60vh] py-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <Container>
        <Link to="/services-numeriques" className="text-sm font-bold text-blue-600">{isArabic ? 'جميع الخدمات' : 'Tout le catalogue'}</Link>
        <h1 className="my-5 text-2xl font-black">{queryParam ? `${isArabic ? 'نتائج البحث' : 'Résultats de recherche'} : ${queryParam}` : (categoryNames[categoryParam ?? ''] ?? []).map(name => getLocalizedCategory(name, language)).join(' / ')}</h1>
        {queryParam.trim()?<>
          {(catalogLoading||esimSearchLoading)&&<p>{isArabic?'جارٍ التحميل…':'Chargement…'}</p>}
          {esimSearchError&&<p className="text-sm">{isArabic?'تعذر تحميل نتائج eSIM':'Résultats eSIM indisponibles'}</p>}
          <p className="mb-4 text-sm text-slate-500">{fullResults.length} {isArabic?'نتيجة':'résultat(s)'}</p>
          {!fullResults.length&&!catalogLoading&&!esimSearchLoading?<p>{isArabic?'لا توجد نتائج':'Aucun résultat'}</p>:<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{fullResults.map(r=><Link key={r.id} to={r.href} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><h2 className="font-bold break-words">{r.title}</h2><p className="mt-1 text-sm text-slate-500">{r.subtitle}</p><p className="mt-3 font-black text-blue-600 dark:text-blue-300">{r.price}</p>{!r.available&&<p className="text-xs">{isArabic?'غير متوفر':'Indisponible'}</p>}</Link>)}</div>}
        </>:catalogLoading ? <p>{isArabic ? 'جار التحميل...' : 'Chargement...'}</p> : filteredServices.length === 0 ? <p>{isArabic ? 'لا توجد نتائج متاحة' : 'Aucun résultat disponible'}</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{filteredServices.map(service => <Link key={service.slug} to={`/services-numeriques/${service.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-500"><p className="text-xs text-slate-500">{getLocalizedCategory(service.category, language)}</p><h2 className="mt-2 font-bold text-slate-950">{getLocalizedServiceName(service, language)}</h2><p className="mt-4 text-sm font-bold text-blue-600">{isArabic ? 'عرض الخدمة' : 'Voir le service'} →</p></Link>)}</div>}
      </Container>
    </main>
  )

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

            <div ref={searchAreaRef} className="relative mt-6 max-w-2xl">
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
                      searchQuery.trim().length >= 2,
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
                    {(catalogLoading||esimSearchLoading)&&<p className="p-3 text-xs">{isArabic?'جارٍ التحميل…':'Chargement…'}</p>}
                    {esimSearchError&&<p className="p-3 text-xs">{isArabic?'تعذر تحميل نتائج eSIM':'Résultats eSIM indisponibles'}</p>}
                    <div className="max-h-[50vh] overflow-y-auto p-2">{results.map(r=><button type="button" key={r.id} onClick={()=>handleServiceSelect(r.href)} className="block w-full rounded-xl p-3 text-start hover:bg-blue-50"><span className="block font-bold text-slate-950">{r.title}</span><span className="block text-xs text-slate-500">{r.subtitle}</span><span className="font-bold text-blue-600">{r.price}</span></button>)}{!results.length&&!catalogLoading&&!esimSearchLoading&&<p className="p-3 text-slate-800">{isArabic?'لا توجد نتائج':'Aucun résultat'}</p>}</div>
                    <button type="button" className="w-full border-t p-3 font-bold text-blue-600" onClick={handleSearchSubmit}>{isArabic?'عرض جميع النتائج':'Voir tous les résultats'}</button>
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
