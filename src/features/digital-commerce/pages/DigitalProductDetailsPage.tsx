import { ShieldCheck, CalendarDays, Zap, KeyRound, ChevronDown, FileText, BookOpen, Star, ShoppingBag } from 'lucide-react'
import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'

import ServiceLogo from '../components/ServiceLogo'

import type {
  ServiceGroup,
} from '../data/serviceCatalog'

import {
  fetchPublicServiceBySlug,
  fetchPublicServiceReviews,
  type PublicServiceCatalogItem,
  type DigitalServiceReview,
} from '../data/supabaseServiceCatalog'

import {
  getLocalizedCategory,
  getLocalizedFulfillmentInstructions,
  getLocalizedFulfillmentLabel,
  getLocalizedFulfillmentWarning,
  getLocalizedGroupDescription,
  getLocalizedGroupName,
  getLocalizedGroupShortName,
  getLocalizedPlanLabel,
  getLocalizedServiceDescription,
  getLocalizedServiceName,
} from '../data/serviceCatalogTranslations'

function DigitalProductDetailsPage() {
  const { productSlug } = useParams()

  const navigate = useNavigate()

  const {
    language,
    formatCurrencyText,
  } = useLanguage()

  const isArabic =
    language === 'ar'

  const [
    service,
    setService,
  ] =
    useState<PublicServiceCatalogItem | null>(
      null,
    )

  const [
    isLoadingService,
    setIsLoadingService,
  ] =
    useState(true)

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] =
    useState('')

  const [
    selectedPlanId,
    setSelectedPlanId,
  ] =
    useState('')

  const [
    reviews,
    setReviews,
  ] =
    useState<DigitalServiceReview[]>(
      [],
    )

  const [
    reviewsLoading,
    setReviewsLoading,
  ] =
    useState(true)

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [productSlug])

  useEffect(() => {
    let isMounted = true

    const loadService =
      async () => {
        setIsLoadingService(
          true,
        )

        if (!productSlug) {
          if (isMounted) {
            setService(null)

            setIsLoadingService(
              false,
            )
          }

          return
        }

        try {
          const nextService =
            await fetchPublicServiceBySlug(
              productSlug,
            )

          if (isMounted) {
            setService(
              nextService,
            )
          }
        } catch (error) {
          console.error(
            'Unable to load digital service:',
            error,
          )

          if (isMounted) {
            setService(null)
          }
        } finally {
          if (isMounted) {
            setIsLoadingService(
              false,
            )
          }
        }
      }

    void loadService()

    return () => {
      isMounted = false
    }
  }, [productSlug])

  useEffect(() => {
    let isMounted = true

    const loadReviews =
      async () => {
        setReviewsLoading(
          true,
        )

        if (!productSlug) {
          if (isMounted) {
            setReviews([])
            setReviewsLoading(
              false,
            )
          }

          return
        }

        try {
          const nextReviews =
            await fetchPublicServiceReviews(
              productSlug,
            )

          if (isMounted) {
            setReviews(
              nextReviews,
            )
          }
        } catch (error) {
          console.error(
            'Unable to load product reviews:',
            error,
          )

          if (isMounted) {
            setReviews([])
          }
        } finally {
          if (isMounted) {
            setReviewsLoading(
              false,
            )
          }
        }
      }

    void loadReviews()

    return () => {
      isMounted = false
    }
  }, [productSlug])

  useEffect(() => {
    if (!service) {
      setSelectedGroupId('')
      setSelectedPlanId('')

      return
    }

    const firstAvailableGroup =
      service.groups.find(
        (group) =>
          group.availability ===
          'available',
      ) ??
      service.groups[0]

    if (!firstAvailableGroup) {
      setSelectedGroupId('')
      setSelectedPlanId('')

      return
    }

    const defaultPlan =
      firstAvailableGroup.plans.find(
        (plan) =>
          plan.availability ===
            'available' &&
          plan.popular,
      ) ??
      firstAvailableGroup.plans.find(
        (plan) =>
          plan.availability ===
          'available',
      ) ??
      firstAvailableGroup.plans[0]

    setSelectedGroupId(
      firstAvailableGroup.id,
    )

    setSelectedPlanId(
      defaultPlan?.id ?? '',
    )
  }, [service])

  if (isLoadingService) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] py-8 sm:py-12">
        <Container>
          <div className="mx-auto max-w-md rounded-[22px] border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-black text-slate-700">
              {isArabic
                ? 'جارٍ تحميل الخدمة...'
                : 'Chargement du service...'}
            </p>
          </div>
        </Container>
      </main>
    )
  }

  if (!service) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] py-8 sm:py-12">
        <Container>
          <div className="mx-auto max-w-md rounded-[22px] border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-400">
              ?
            </div>

            <h1 className="mt-4 text-xl font-black text-slate-950">
              {isArabic
                ? 'الخدمة غير متوفرة'
                : 'Service indisponible'}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isArabic
                ? 'معلومات هذه الخدمة غير متوفرة حاليًا.'
                : 'Les informations de ce service ne sont pas disponibles.'}
            </p>

            <Link
              to="/services-numeriques"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-500"
            >
              {isArabic
                ? 'العودة إلى الخدمات'
                : 'Retour aux services'}
            </Link>
          </div>
        </Container>
      </main>
    )
  }

  const isComingSoon =
    service.availability ===
    'coming_soon'

  const isServiceOutOfStock =
    service.availability ===
    'out_of_stock'

  const selectedGroup =
    service.groups.find(
      (group) =>
        group.id ===
        selectedGroupId,
    ) ??
    service.groups[0]

  const selectedPlan =
    selectedGroup?.plans.find(
      (plan) =>
        plan.id ===
        selectedPlanId,
    ) ??
    selectedGroup?.plans.find(
      (plan) =>
        plan.availability ===
          'available' &&
        plan.popular,
    ) ??
    selectedGroup?.plans.find(
      (plan) =>
        plan.availability ===
        'available',
    ) ??
    selectedGroup?.plans[0]

  // Read the same plan/service fields configured in ADMIN. Plan values override service defaults.
  const deliveryMinutes = selectedPlan?.delivery_minutes ?? service.delivery_minutes ?? null
  const validityDays = selectedPlan?.validity_days ?? service.validity_days ?? null
  const warrantyDays = selectedPlan?.warranty_days ?? service.warranty_days ?? null
  const fullWarranty = selectedPlan?.warranty_full_subscription ?? service.warranty_full_subscription ?? false
  const durationText = (days: number | null) => {
    if (days === null || !Number.isFinite(days) || days <= 0) return isArabic ? 'غير محددة' : 'Non précisée'
    if (days % 365 === 0) return isArabic ? `${days / 365} سنة` : `${days / 365} an(s)`
    if (days % 30 === 0) return isArabic ? `${days / 30} شهر` : `${days / 30} mois`
    return isArabic ? `${days} يوم` : `${days} jours`
  }
  const deliveryText = deliveryMinutes === null || !Number.isFinite(deliveryMinutes) || deliveryMinutes < 0
    ? (isArabic ? 'يحدد عند الطلب' : 'À confirmer')
    : deliveryMinutes === 0
      ? (isArabic ? 'فوري' : 'Immédiate')
      : deliveryMinutes < 60
        ? (isArabic ? `خلال ${deliveryMinutes} دقيقة` : `Sous ${deliveryMinutes} min`)
        : (isArabic ? `خلال ${Math.ceil(deliveryMinutes / 60)} ساعة` : `Sous ${Math.ceil(deliveryMinutes / 60)} h`)
  const warrantyText = fullWarranty
    ? (isArabic ? 'طوال مدة الخدمة' : 'Toute la durée du service')
    : durationText(warrantyDays)

  const localizedServiceName =
    getLocalizedServiceName(
      service,
      language,
    )

  const localizedServiceDescription =
    getLocalizedServiceDescription(
      service,
      language,
    )

  const serviceLetter =
    service.name
      .trim()
      .charAt(0)
      .toUpperCase() ||
    'T'

  const validReviews =
    reviews.filter(
      (review) => {
        const rating =
          Number(
            review.rating,
          )

        return (
          Number.isFinite(
            rating,
          ) &&
          rating >= 1 &&
          rating <= 5
        )
      },
    )

  const averageRating =
    validReviews.length > 0
      ? validReviews.reduce(
          (
            total,
            review,
          ) =>
            total +
            Number(
              review.rating,
            ),
          0,
        ) /
        validReviews.length
      : 0

  const averageRatingLabel =
    averageRating.toFixed(1)

  const handleGroupChange = (
    group: ServiceGroup,
  ) => {
    if (
      group.availability !==
      'available'
    ) {
      return
    }

    setSelectedGroupId(
      group.id,
    )

    const nextPlan =
      group.plans.find(
        (plan) =>
          plan.availability ===
            'available' &&
          plan.popular,
      ) ??
      group.plans.find(
        (plan) =>
          plan.availability ===
          'available',
      ) ??
      group.plans[0]

    setSelectedPlanId(
      nextPlan?.id ?? '',
    )
  }

  const handleContinue =
    () => {
      if (
        !selectedGroup ||
        !selectedPlan
      ) {
        return
      }

      if (
        service.availability !==
          'available' ||
        selectedGroup.availability !==
          'available' ||
        selectedPlan.availability !==
          'available'
      ) {
        return
      }

      const params =
        new URLSearchParams({
          groupId:
            selectedGroup.id,

          planId:
            selectedPlan.id,
        })

      navigate(
        `/services-numeriques/${service.slug}/commande?${params.toString()}`,
      )
    }

  const formatPrice = (
    price: number,
    currency: 'MRU',
  ) => {
    const formattedNumber =
      new Intl.NumberFormat(
        isArabic
          ? 'ar-MR-u-nu-latn'
          : 'fr-FR-u-nu-latn',
        {
          numberingSystem:
            'latn',

          maximumFractionDigits:
            2,
        },
      ).format(
        price,
      )

    return formatCurrencyText(
      `${formattedNumber} ${currency}`,
    )
  }

  const renderStars = (
    rating: number,
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
        {Array.from({
          length: 5,
        }).map(
          (
            _,
            index,
          ) => (
            <span
              key={
                index
              }
              className={[
                'text-lg leading-none',
                index <
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

      return new Intl.DateTimeFormat(
        isArabic
          ? 'ar-MR'
          : 'fr-FR',
        {
          year:
            'numeric',

          month:
            'short',

          day:
            'numeric',
        },
      ).format(
        date,
      )
    }

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-28 lg:pb-0" dir={isArabic ? 'rtl' : 'ltr'}>
      <section className="border-b border-slate-200 bg-white">
        <Container className="py-3">
          <div className="flex min-w-0 items-center gap-2 overflow-hidden text-xs font-semibold text-slate-400">
            <Link
              to="/services-numeriques"
              className="shrink-0 transition hover:text-blue-600"
            >
              {isArabic
                ? 'الخدمات الرقمية'
                : 'Services numériques'}
            </Link>

            <span>
              /
            </span>

            <span className="truncate text-slate-700">
              {
                localizedServiceName
              }
            </span>
          </div>
        </Container>
      </section>

      <section className="border-b border-slate-100 bg-white">
        <Container className="py-5 sm:py-7 lg:py-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] p-2 text-lg font-black text-white shadow-[0_10px_28px_rgba(37,99,235,0.20)] sm:h-14 sm:w-14 sm:text-xl lg:h-16 lg:w-16 lg:text-2xl"
                style={{
                  background:
                    'linear-gradient(145deg, #2563eb 0%, #4338ca 100%)',
                }}
              >
                <ServiceLogo
                  serviceSlug={
                    service.slug
                  }
                  fallback={
                    serviceLetter
                  }
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-600">
                    {getLocalizedCategory(
                      service.category,
                      language,
                    )}
                  </p>

                  {isComingSoon && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
                      {isArabic
                        ? 'قريبًا'
                        : 'Bientôt disponible'}
                    </span>
                  )}

                  {isServiceOutOfStock && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-600">
                      {isArabic
                        ? 'غير متوفر'
                        : 'Rupture de stock'}
                    </span>
                  )}
                </div>

                <h1 className="mt-1 text-[23px] font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-3xl lg:text-[34px]">
                  {
                    localizedServiceName
                  }
                </h1>

                {!reviewsLoading &&
                  validReviews.length >
                    0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {renderStars(
                        averageRating,
                      )}

                      <span
                        dir="ltr"
                        className="text-sm font-black text-slate-800"
                      >
                        {
                          averageRatingLabel
                        }
                        /5
                      </span>

                      <span className="text-xs font-semibold text-slate-400">
                        (
                        {
                          validReviews.length
                        }{' '}
                        {isArabic
                          ? 'تقييم'
                          : 'avis'}
                        )
                      </span>
                    </div>
                  )}
              </div>
            </div>
            {!isComingSoon && (
              <section aria-label={isArabic ? 'معلومات الخدمة' : 'Informations du service'} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" dir={isArabic ? 'rtl' : 'ltr'}>
                {[
                  { label: isArabic ? 'مدة التسليم' : 'Délai de livraison', value: deliveryMinutes !== null ? deliveryText : '', Icon: Zap },
                  { label: isArabic ? 'مدة الاشتراك' : 'Durée de l’abonnement', value: validityDays !== null && validityDays > 0 ? durationText(validityDays) : '', Icon: CalendarDays },
                  { label: isArabic ? 'طريقة الاستلام' : 'Mode de réception', value: selectedGroup && selectedGroup.fulfillment.type !== 'coming_soon' ? getLocalizedFulfillmentLabel(selectedGroup.fulfillment.type, language) : '', Icon: KeyRound },
                  { label: isArabic ? 'الضمان' : 'Garantie', value: fullWarranty || (warrantyDays !== null && warrantyDays > 0) ? warrantyText : '', Icon: ShieldCheck },
                ].filter(item => item.value).map(({label,value,Icon}) => (
                  <div key={label} className="flex flex-col items-start gap-2 rounded-xl bg-slate-100 px-3 py-3 text-sm sm:px-4">
                    <span className="flex min-w-0 items-center gap-2 text-slate-700"><Icon size={19} className="shrink-0 text-blue-600" aria-hidden="true"/>{label}</span>
                    <span className="min-w-0 break-words font-semibold text-slate-900">{value}</span>
                  </div>
                ))}
              </section>
            )}

          </div>
        </Container>
      </section>

      {/* Premium compact section navigation: manual, no automatic carousel */}
      {!isComingSoon && (
        <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
          <Container className="py-2">
            <nav aria-label={isArabic ? 'أقسام الخدمة' : 'Sections du service'} className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <a href="#teo-formules" className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
                {isArabic ? 'الخطط والأسعار' : 'Formules et prix'}
              </a>
              <a href="#teo-instructions" className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
                {isArabic ? 'التعليمات' : 'Instructions'}
              </a>
              <a href="#teo-reviews" className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
                {isArabic ? `التقييمات (${validReviews.length})` : `Avis (${validReviews.length})`}
              </a>
            </nav>
          </Container>
        </div>
      )}

      {isComingSoon ? (
        <section className="py-6 sm:py-9 lg:py-10">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-blue-600">
                    T
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                      TEO STORE
                    </p>

                    <h2 className="mt-1 text-lg font-black text-slate-950 sm:text-xl">
                      {isArabic
                        ? 'قريبًا'
                        : 'Bientôt disponible'}
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                      {isArabic
                        ? 'هذه الخدمة قيد الإعداد حاليًا. سيتم توفيرها قريبًا مع الخطط والأسعار وطريقة التسليم.'
                        : 'Ce service est actuellement en préparation. Il sera activé prochainement avec ses formules, prix et méthode de livraison.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="mt-5 flex h-11 w-full cursor-not-allowed items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-400 sm:max-w-xs"
                >
                  {isArabic
                    ? 'الشراء غير متوفر'
                    : 'Achat indisponible'}
                </button>
              </div>
            </div>
          </Container>
        </section>
      ) : (
        <section id="teo-formules" className="scroll-mt-20 py-5 sm:py-7 lg:py-8">
          <Container>
            <div className="mx-auto max-w-5xl">
              {isServiceOutOfStock && (
                <div className="mb-5 rounded-[16px] border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-red-700">
                    {isArabic
                      ? 'الخدمة غير متوفرة مؤقتًا'
                      : 'Service temporairement indisponible'}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-600">
                    {isArabic
                      ? 'ستبقى الخدمة ظاهرة، لكن استقبال الطلبات الجديدة متوقف مؤقتًا.'
                      : 'Le service reste visible, mais les nouvelles commandes sont temporairement désactivées.'}
                  </p>
                </div>
              )}

              {service.groups.length >
                1 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                    {isArabic
                      ? 'الخطوة 1'
                      : 'ÉTAPE 1'}
                  </p>

                  <h2 className="mt-1 text-[17px] font-black text-slate-950 sm:text-xl">
                    {isArabic
                      ? 'اختر النوع'
                      : 'Choisissez le type'}
                  </h2>

                  <div
                    className={[
                      'mt-3 grid gap-2 rounded-[18px] bg-slate-200/60 p-1.5',

                      service.groups
                        .length ===
                      2
                        ? 'grid-cols-2'
                        : 'grid-cols-2 sm:grid-cols-3',
                    ].join(
                      ' ',
                    )}
                  >
                    {service.groups.map(
                      (
                        group,
                      ) => {
                        const isActive =
                          selectedGroup?.id ===
                          group.id

                        const isUnavailable =
                          group.availability !==
                          'available'

                        return (
                          <button
                            key={
                              group.id
                            }
                            type="button"
                            disabled={
                              isUnavailable
                            }
                            onClick={() =>
                              handleGroupChange(
                                group,
                              )
                            }
                            className={[
                              'relative min-h-12 rounded-[14px] px-2.5 py-2 text-sm font-black leading-5 transition sm:min-h-13 sm:px-4',

                              isUnavailable
                                ? 'cursor-not-allowed bg-slate-100 text-slate-300'
                                : isActive
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-slate-500 hover:bg-white/60 hover:text-slate-800',
                            ].join(
                              ' ',
                            )}
                          >
                            {getLocalizedGroupShortName(
                              group,
                              language,
                            )}

                            {group.availability ===
                              'out_of_stock' && (
                              <span className="mt-1 block text-xs font-bold uppercase text-red-400">
                                {isArabic
                                  ? 'غير متوفر'
                                  : 'Rupture'}
                              </span>
                            )}

                            {group.availability ===
                              'coming_soon' && (
                              <span className="mt-1 block text-xs font-bold uppercase text-slate-400">
                                {isArabic
                                  ? 'قريبًا'
                                  : 'Bientôt'}
                              </span>
                            )}
                          </button>
                        )
                      },
                    )}
                  </div>
                </div>
              )}

              {selectedGroup && (
                <div
                  className={
                    service.groups
                      .length >
                    1
                      ? 'mt-6'
                      : ''
                  }
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                    {service.groups
                      .length >
                    1
                      ? isArabic
                        ? 'الخطوة 2'
                        : 'ÉTAPE 2'
                      : isArabic
                        ? 'الخطط'
                        : 'FORMULES'}
                  </p>

                  <h2 className="mt-1 text-[20px] font-black tracking-[-0.02em] text-slate-950 sm:text-2xl">
                    {getLocalizedGroupName(
                      selectedGroup,
                      language,
                    )}
                  </h2>

                  {getLocalizedGroupDescription(
                    service.slug,
                    selectedGroup,
                    language,
                  ) && (
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                      {getLocalizedGroupDescription(
                        service.slug,
                        selectedGroup,
                        language,
                      )}
                    </p>
                  )}

                  {selectedGroup
                    .fulfillment
                    .type !==
                    'coming_soon' && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

                      <span className="text-xs font-black text-blue-700">
                        {getLocalizedFulfillmentLabel(
                          selectedGroup
                            .fulfillment
                            .type,
                          language,
                        )}
                      </span>
                    </div>
                  )}

                  {selectedGroup.plans
                    .length >
                  0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                      {selectedGroup.plans.map(
                        (
                          plan,
                        ) => {
                          const isSelected =
                            selectedPlan?.id ===
                            plan.id

                          const isPlanAvailable =
                            plan.availability ===
                            'available'

                          return (
                            <button
                              key={
                                plan.id
                              }
                              type="button"
                              disabled={
                                !isPlanAvailable
                              }
                              onClick={() =>
                                setSelectedPlanId(
                                  plan.id,
                                )
                              }
                              className={[
                                'relative min-h-[106px] rounded-[18px] border p-4 transition',

                                isArabic
                                  ? 'text-right'
                                  : 'text-left',

                                !isPlanAvailable
                                  ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                                  : isSelected
                                    ? 'border-blue-600 bg-blue-50 shadow-[0_8px_22px_rgba(37,99,235,0.10)]'
                                    : 'border-slate-200 bg-white hover:border-blue-200',
                              ].join(
                                ' ',
                              )}
                            >
                              {plan.popular &&
                                isPlanAvailable && (
                                  <span
                                    className={[
                                      'absolute top-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-black text-white',

                                      isArabic
                                        ? 'left-2'
                                        : 'right-2',
                                    ].join(
                                      ' ',
                                    )}
                                  >
                                    {isArabic
                                      ? 'الأكثر طلبًا'
                                      : 'Populaire'}
                                  </span>
                                )}

                              {!isPlanAvailable && (
                                <span
                                  className={[
                                    'absolute top-2 rounded-full bg-slate-200 px-2 py-1 text-xs font-black text-slate-500',

                                    isArabic
                                      ? 'left-2'
                                      : 'right-2',
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  {isArabic
                                    ? 'غير متوفر'
                                    : 'Indisponible'}
                                </span>
                              )}

                              <p
                                className={[
                                  'text-sm font-black leading-5 text-slate-950',

                                  isArabic
                                    ? 'pl-8'
                                    : 'pr-8',
                                ].join(
                                  ' ',
                                )}
                              >
                                {getLocalizedPlanLabel(
                                  plan,
                                  language,
                                )}
                              </p>

                              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2">
                                <p
                                  dir="ltr"
                                  className={[
                                    'text-sm font-black',

                                    isSelected &&
                                    isPlanAvailable
                                      ? 'text-blue-600'
                                      : 'text-slate-950',
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  {formatPrice(
                                    plan.price,
                                    plan.currency,
                                  )}
                                </p>

                                <span
                                  className={[
                                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black transition',

                                    isSelected &&
                                    isPlanAvailable
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-100 text-slate-400',
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  ✓
                                </span>
                              </div>
                            </button>
                          )
                        },
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[16px] border border-slate-200 bg-white p-4">
                      <p className="text-sm font-black text-slate-700">
                        {isArabic
                          ? 'لا توجد خطط متوفرة حاليًا.'
                          : 'Aucune formule disponible actuellement.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedGroup &&
                getLocalizedFulfillmentWarning(
                  service.slug,
                  selectedGroup,
                  language,
                ) && (
                  <div className="mt-5 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">
                      {isArabic
                        ? 'مهم'
                        : 'Important'}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-700">
                      {getLocalizedFulfillmentWarning(
                        service.slug,
                        selectedGroup,
                        language,
                      )}
                    </p>
                  </div>
                )}

              {localizedServiceDescription && <details open className="group mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-slate-900 [&::-webkit-details-marker]:hidden"><FileText size={20} className="text-blue-600"/>{isArabic ? 'وصف المنتج' : 'Description du produit'}<ChevronDown size={18} className="ms-auto group-open:rotate-180"/></summary>
                <p className="mt-4 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-7 text-slate-700">{localizedServiceDescription}</p>
              </details>}
              <details id="teo-instructions" className="group mt-3 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-slate-900 [&::-webkit-details-marker]:hidden"><BookOpen size={20} className="text-blue-600"/>{isArabic ? 'طريقة التفعيل والاستخدام' : 'Activation et utilisation'}<ChevronDown size={18} className="ms-auto group-open:rotate-180"/></summary>
                <p className="mt-4 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-7 text-slate-700">{selectedGroup ? (getLocalizedFulfillmentInstructions(service.slug, selectedGroup, language) || (isArabic ? 'لا توجد تعليمات إضافية.' : 'Aucune instruction supplémentaire.')) : (isArabic ? 'اختر الباقة.' : 'Sélectionnez une formule.')}</p>
              </details>

              <details id="teo-reviews" className="group mt-3 scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-bold text-slate-900 [&::-webkit-details-marker]:hidden"><Star size={20} className="text-blue-600"/>{isArabic ? 'تقييمات الزبناء' : 'Avis clients'} ({validReviews.length})<ChevronDown size={18} className="ms-auto group-open:rotate-180"/></summary>
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5">
                        <span className="text-sm text-amber-400">
                          ★
                        </span>

                        <span className="text-[8px] font-black uppercase tracking-[0.14em] text-amber-700 sm:text-[9px]">
                          {isArabic
                            ? 'تقييمات العملاء'
                            : 'AVIS CLIENTS'}
                        </span>
                      </div>

                      <h2 className="mt-3 text-lg font-black text-slate-950 sm:text-xl">
                        {isArabic
                          ? 'ماذا يقول عملاؤنا؟'
                          : 'Ce que disent nos clients'}
                      </h2>

                      <p className="mt-1 text-[10px] leading-5 text-slate-500 sm:text-xs">
                        {isArabic
                          ? 'تقييمات حقيقية من العملاء الذين طلبوا هذه الخدمة.'
                          : 'Avis de clients ayant commandé ce service.'}
                      </p>
                    </div>

                    {!reviewsLoading &&
                      validReviews.length >
                        0 && (
                        <div
                          dir="ltr"
                          className="flex shrink-0 items-center gap-3 rounded-[16px] border border-amber-100 bg-amber-50/70 px-4 py-3"
                        >
                          <div className="text-center">
                            <p className="text-2xl font-black text-slate-950">
                              {
                                averageRatingLabel
                              }
                            </p>

                            <p className="text-[8px] font-bold text-slate-400">
                              / 5
                            </p>
                          </div>

                          <div>
                            {renderStars(
                              averageRating,
                            )}

                            <p
                              dir={
                                isArabic
                                  ? 'rtl'
                                  : 'ltr'
                              }
                              className="mt-1 text-[8px] font-bold text-slate-400"
                            >
                              {
                                validReviews.length
                              }{' '}
                              {isArabic
                                ? 'تقييم'
                                : validReviews.length ===
                                    1
                                  ? 'avis'
                                  : 'avis'}
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {reviewsLoading ? (
                    <div className="flex min-h-[140px] items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600" />

                        <p className="mt-3 text-[9px] font-bold text-slate-400">
                          {isArabic
                            ? 'جارٍ تحميل التقييمات...'
                            : 'Chargement des avis...'}
                        </p>
                      </div>
                    </div>
                  ) : validReviews.length ===
                    0 ? (
                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl text-amber-400 shadow-sm">
                        ★
                      </div>

                      <h3 className="mt-3 text-sm font-black text-slate-800">
                        {isArabic
                          ? 'لا توجد تقييمات بعد'
                          : 'Aucun avis pour le moment'}
                      </h3>

                      <p className="mx-auto mt-1 max-w-sm text-[9px] leading-5 text-slate-400 sm:text-[10px]">
                        {isArabic
                          ? 'سيظهر هنا أول تقييم بعد إكمال أحد العملاء طلبًا لهذه الخدمة.'
                          : 'Le premier avis apparaîtra ici après une commande terminée pour ce service.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {validReviews.map(
                        (
                          review,
                        ) => (
                          <article
                            key={
                              review.id
                            }
                            className="rounded-[18px] border border-slate-200 bg-slate-50/60 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                {renderStars(
                                  Number(
                                    review.rating,
                                  ),
                                )}

                                <p className="mt-2 text-[9px] font-black text-slate-700">
                                  {isArabic
                                    ? 'عميل TEO STORE'
                                    : 'Client TEO STORE'}
                                </p>
                              </div>

                              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1">
                                <span className="text-[7px] font-black text-emerald-700">
                                  ✓{' '}
                                  {isArabic
                                    ? 'طلب مؤكد'
                                    : 'Commande vérifiée'}
                                </span>
                              </div>
                            </div>

                            {review.comment &&
                            review.comment
                              .trim()
                              .length >
                              0 ? (
                              <p className="mt-3 text-[10px] leading-5 text-slate-600 sm:text-xs">
                                “
                                {
                                  review.comment
                                    .trim()
                                }
                                ”
                              </p>
                            ) : (
                              <p className="mt-3 text-[9px] italic leading-5 text-slate-400">
                                {isArabic
                                  ? 'ترك العميل تقييمًا بدون تعليق.'
                                  : 'Le client a laissé une note sans commentaire.'}
                              </p>
                            )}

                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3">
                              <span className="text-[8px] font-bold text-slate-400">
                                {formatReviewDate(
                                  review.created_at,
                                )}
                              </span>

                              <span
                                dir="ltr"
                                className="text-[9px] font-black text-slate-700"
                              >
                                {Number(
                                  review.rating,
                                ).toFixed(
                                  0,
                                )}
                                /5
                              </span>
                            </div>
                          </article>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </details>

              {selectedGroup &&
                selectedPlan && (
                  <div
                    className="mt-6 overflow-hidden rounded-[22px] p-5 text-white shadow-[0_16px_42px_rgba(15,23,42,0.14)]"
                    style={{
                      background:
                        'linear-gradient(135deg, #06101f 0%, #101d44 55%, #312e81 100%)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-white/40">
                          {isArabic
                            ? 'اختيارك'
                            : 'VOTRE SÉLECTION'}
                        </p>

                        <p className="mt-1.5 truncate text-sm font-black text-white">
                          {getLocalizedGroupShortName(
                            selectedGroup,
                            language,
                          )}
                        </p>

                        <p className="mt-0.5 text-xs font-semibold text-white/50">
                          {getLocalizedPlanLabel(
                            selectedPlan,
                            language,
                          )}
                        </p>
                      </div>

                      <div
                        className={[
                          'shrink-0',

                          isArabic
                            ? 'text-left'
                            : 'text-right',
                        ].join(
                          ' ',
                        )}
                      >
                        <p className="text-xs font-black uppercase tracking-wide text-white/40">
                          {isArabic
                            ? 'الإجمالي'
                            : 'Total'}
                        </p>

                        <p
                          dir="ltr"
                          className="mt-1 text-lg font-black text-blue-300"
                        >
                          {formatPrice(
                            selectedPlan.price,
                            selectedPlan.currency,
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        handleContinue
                      }
                      disabled={
                        isServiceOutOfStock ||
                        selectedGroup.availability !==
                          'available' ||
                        selectedPlan.availability !==
                          'available'
                      }
                      className={[
                        'mt-4 flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-black text-white transition',

                        isServiceOutOfStock ||
                        selectedGroup.availability !==
                          'available' ||
                        selectedPlan.availability !==
                          'available'
                          ? 'cursor-not-allowed bg-slate-600'
                          : 'bg-blue-600 hover:bg-blue-500',
                      ].join(
                        ' ',
                      )}
                    >
                      {isServiceOutOfStock
                        ? isArabic
                          ? 'الخدمة غير متوفرة'
                          : 'Service indisponible'
                        : selectedPlan.availability ===
                            'out_of_stock'
                          ? isArabic
                            ? 'غير متوفر'
                            : 'Rupture de stock'
                          : isArabic
                            ? 'متابعة'
                            : 'Continuer'}
                    </button>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-white/40">
                      <span>
                        ✓{' '}
                        {isArabic
                          ? 'دفع آمن'
                          : 'Paiement sécurisé'}
                      </span>

                      <span>
                        ✓{' '}
                        {isArabic
                          ? 'توصيل رقمي'
                          : 'Livraison digitale'}
                      </span>

                      <span>
                        ✓{' '}
                        {isArabic
                          ? 'دعم TEO STORE'
                          : 'Support TEO STORE'}
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </Container>
        </section>
      )}
      {!isComingSoon && selectedGroup && selectedPlan && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 pt-3 shadow-lg lg:hidden" style={{paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))'}}>
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-slate-500">{getLocalizedPlanLabel(selectedPlan, language)}</p>
              <p className="break-words text-xl font-black text-blue-600">{formatPrice(selectedPlan.price, selectedPlan.currency)}</p>
            </div>
            <button type="button" onClick={handleContinue} disabled={service.availability !== 'available' || selectedGroup.availability !== 'available' || selectedPlan.availability !== 'available'} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><ShoppingBag size={19}/>{service.availability !== 'available' || selectedGroup.availability !== 'available' || selectedPlan.availability !== 'available' ? (isArabic ? 'غير متوفر' : 'Indisponible') : (isArabic ? 'اشترِ الآن' : 'Acheter maintenant')}</button>
          </div>
        </div>
      )}
    </main>
  )
}

export default DigitalProductDetailsPage