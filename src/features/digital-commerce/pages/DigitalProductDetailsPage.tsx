import { durationText as formatPlanDuration } from '../utils/planDuration'
import { useFlashOffers } from '../utils/useFlashOffers'
import FlashOfferInfo from '../components/FlashOfferInfo'
import { ShieldCheck, CalendarDays, Zap, KeyRound, FileText, BookOpen, Star, ShoppingBag } from 'lucide-react'
import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'

import TeoPlanCover from '../components/TeoPlanCover'

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
  const { productSlug, offerKey } = useParams()

  const [searchParams] = useSearchParams()
  const requestedPlan = searchParams.get('plan')
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'plans' | 'description' | 'instructions' | 'reviews'>('plans')

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
    setActiveTab('plans')
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [productSlug, offerKey])

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
            setService(nextService && offerKey ? (nextService.groups.some(g => g.id === offerKey) ? {...nextService, groups: nextService.groups.filter(g => g.id === offerKey)} : null) : nextService)
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
  }, [productSlug, offerKey])

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
      service.groups.find(group=>group.plans.some(plan=>plan.databaseId===requestedPlan||plan.id===requestedPlan)) ??
      service.groups.find(
        (group) => group.availability === 'available' && group.plans.some(plan => plan.availability === 'available'),
      ) ??
      service.groups.find(group => group.availability === 'available') ?? service.groups[0]

    if (!firstAvailableGroup) {
      setSelectedGroupId('')
      setSelectedPlanId('')

      return
    }

    const defaultPlan =
      firstAvailableGroup.plans.find(plan => plan.databaseId === requestedPlan || plan.id === requestedPlan) ??
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
  }, [service, requestedPlan])

  const {offers:flashOffers,now:flashNow}=useFlashOffers(service?.groups.flatMap(g=>g.plans.map(p=>p.databaseId))??[])

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

  if (!service || (requestedPlan && !service.groups.some(g=>g.plans.some(p=>p.databaseId===requestedPlan||p.id===requestedPlan)))) {
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

  const selectedFlash=selectedPlan?.databaseId && flashOffers[selectedPlan.databaseId]?.original_price===selectedPlan.price?flashOffers[selectedPlan.databaseId]:undefined

  // Read the same plan/service fields configured in ADMIN. Plan values override service defaults.
  const deliveryMinutes = selectedPlan?.delivery_minutes ?? selectedGroup?.delivery_minutes ?? service.delivery_minutes ?? null
  const validityDays = selectedPlan?.validity_days ?? selectedGroup?.validity_days ?? service.validity_days ?? null
  const warrantySource = [selectedPlan,selectedGroup,service].find(source=>source&&(source.warranty_days!=null||source.warranty_full_subscription!=null))
  const warrantyDays = warrantySource?.warranty_days ?? null
  const fullWarranty = warrantySource?.warranty_full_subscription === true
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
      : deliveryMinutes >= 2880 && deliveryMinutes % 1440 === 0
        ? (isArabic ? (deliveryMinutes === 2880 ? 'يومان' : `${deliveryMinutes / 1440} أيام`) : `${deliveryMinutes / 1440} jours`)
        : deliveryMinutes % 60 === 0
          ? (isArabic ? `${deliveryMinutes / 60} ساعة` : `${deliveryMinutes / 60} h`)
          : (isArabic ? `${deliveryMinutes} دقيقة` : `${deliveryMinutes} minutes`)
  const warrantyText = fullWarranty
    ? (isArabic ? 'طوال مدة الخدمة' : 'Toute la durée du service')
    : warrantyDays === 0 ? (isArabic ? 'بدون ضمان' : 'Sans garantie') : durationText(warrantyDays)

  const localizedServiceName = selectedGroup ? getLocalizedGroupName(selectedGroup, language) :
    getLocalizedServiceName(
      service,
      language,
    )

  const localizedServiceDescription = (isArabic?selectedPlan?.description_ar:selectedPlan?.description_fr)?.trim() || (selectedGroup?.description_enabled === false ? '' : (selectedGroup && getLocalizedGroupDescription(service.slug, selectedGroup, language)) || getLocalizedServiceDescription(service, language))
  const localizedInstructions = (isArabic?selectedPlan?.instructions_ar:selectedPlan?.instructions_fr)?.trim() || (selectedGroup?.instructions_enabled===false?undefined:(selectedGroup&&getLocalizedFulfillmentInstructions(service.slug,selectedGroup,language)) || (isArabic?service.instructions_ar:service.instructions_fr))

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
          ? 'ar-MR-u-nu-latn'
          : 'fr-FR-u-nu-latn',
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
    <main className="teo-product-detail min-h-screen pb-28 lg:pb-0" dir={isArabic ? 'rtl' : 'ltr'}>
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

            <Link to={`/services-numeriques/${service.slug}`} className="shrink-0 hover:text-blue-600">{getLocalizedServiceName(service,language)}</Link><span>/</span><span className="truncate text-slate-700">
              {
                localizedServiceName
              }
            </span>
          </div>
        </Container>
      </section>

      <section className="teo-detail-hero">
        <Container className="py-4 sm:py-5">
          <div className="teo-detail-overview mx-auto max-w-6xl">
            <div className="teo-detail-title flex items-center gap-3 sm:gap-4">
              <div
                className="teo-detail-image flex shrink-0 items-center justify-center overflow-hidden rounded-[16px] text-lg font-black text-white bg-[#192638]"
              >
                {selectedGroup && selectedPlan ? <TeoPlanCover item={{service,group:selectedGroup,plan:selectedPlan}} language={language}/> : serviceLetter}
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
              <section aria-label={isArabic ? 'معلومات الخدمة' : 'Informations du service'} className="teo-detail-facts" dir={isArabic ? 'rtl' : 'ltr'}>
                {[
                  { label: isArabic ? 'مدة التسليم' : 'Délai de livraison', value: deliveryMinutes !== null ? deliveryText : '', Icon: Zap },
                  { label: isArabic ? 'مدة الاشتراك' : 'Durée de l’abonnement', value: selectedPlan ? formatPlanDuration(selectedPlan, language) : '', Icon: CalendarDays },
                  { label: isArabic ? 'الصلاحية' : 'Validité', value: !(selectedPlan && formatPlanDuration(selectedPlan, language)) && validityDays !== null ? formatPlanDuration({duration_value:validityDays,duration_unit:'days'},language) : '', Icon: CalendarDays },
                  { label: isArabic ? 'طريقة الاستلام' : 'Mode de réception', value: selectedGroup && selectedGroup.fulfillment.type !== 'coming_soon' ? getLocalizedFulfillmentLabel(selectedGroup.fulfillment.type, language) : '', Icon: KeyRound },
                  { label: isArabic ? 'الضمان' : 'Garantie', value: warrantyText, Icon: ShieldCheck },
                ].filter(item => !!item.value).map(({label,value,Icon}) => (
                  <div key={label} className="teo-detail-fact">
                    <span className="teo-detail-fact-label flex min-w-0 items-center gap-2"><Icon size={19} className="shrink-0 text-blue-600" aria-hidden="true"/>{label}</span>
                    <span className="teo-detail-fact-value min-w-0 break-words font-semibold">{value || (isArabic ? 'غير محدد' : 'Non précisé')}</span>
                  </div>
                ))}
              </section>
            )}

          </div>
        </Container>
      </section>

      {!isComingSoon && (
        <div className="border-b border-slate-200 bg-white">
          <Container className="py-3">
            <nav aria-label={isArabic ? 'أقسام الخدمة' : 'Sections du service'} className="mx-auto flex max-w-6xl gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {([
                { id: 'plans', label: isArabic ? 'الباقات' : 'Forfaits', Icon: ShoppingBag },
                { id: 'description', label: isArabic ? 'الوصف' : 'Description', Icon: FileText },
                { id: 'instructions', label: isArabic ? 'التعليمات' : 'Instructions', Icon: BookOpen },
                { id: 'reviews', label: isArabic ? `تقييمات الخدمة (${validReviews.length})` : `Avis du service (${validReviews.length})`, Icon: Star },
              ] as const).filter(t => t.id !== 'description' || !!localizedServiceDescription).filter(t => t.id !== 'instructions' || !!localizedInstructions).map(({id,label,Icon}) => (
                <button key={id} type="button" aria-pressed={activeTab === id} onClick={() => setActiveTab(id)} className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold sm:text-sm ${activeTab === id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400'}`}>
                  <Icon size={16} aria-hidden="true"/>{label}
                </button>
              ))}
            </nav>
          </Container>
        </div>
      )}

      {isComingSoon ? (
        <section className="py-6 sm:py-9 lg:py-10">
          <Container>
            <div className="mx-auto max-w-6xl">
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
            <div className="mx-auto max-w-6xl">
              <div className="teo-detail-purchase grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              {activeTab === 'plans' && <>
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
                  <h2 className="text-lg font-black text-slate-950">{isArabic ? 'اختر الباقة' : 'Choisissez votre forfait'}</h2>

                  {selectedGroup.plans
                    .length >
                  0 ? (
                    <div className="teo-plan-grid mt-4 grid gap-3">
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
                              aria-pressed={isSelected}
                              disabled={
                                !isPlanAvailable
                              }
                              onClick={() =>
                                setSelectedPlanId(
                                  plan.id,
                                )
                              }
                              className={[
                                'teo-plan-option relative flex min-h-[104px] flex-col gap-3 rounded-[18px] border p-3 transition',

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
                                      'self-start rounded-full bg-blue-600 px-2 py-1 text-xs font-black text-white',

                                      isArabic
                                        ? ''
                                        : '',
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
                                    'self-start rounded-full bg-slate-200 px-2 py-1 text-xs font-black text-slate-500',

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
                                    ? ''
                                    : '',
                                ].join(
                                  ' ',
                                )}
                              >
                                {getLocalizedPlanLabel(
                                  plan,
                                  language,
                                )}
                              </p>

                              <div className="mt-auto flex flex-wrap items-end justify-between gap-2">
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
                                  {plan.databaseId && flashOffers[plan.databaseId]?.original_price===plan.price ? <FlashOfferInfo offer={flashOffers[plan.databaseId]} now={flashNow} ar={isArabic}/> : <>{plan.old_price != null && Number(plan.old_price)>plan.price && <span className="block text-xs font-normal text-slate-400 line-through">{formatPrice(Number(plan.old_price),plan.currency)}</span>}{formatPrice(plan.price,plan.currency)}</>}
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

              </>}
              {activeTab === 'description' && localizedServiceDescription && <section>
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-950"><FileText size={20} className="text-blue-600"/>{isArabic ? 'وصف المنتج' : 'Description du produit'}</h2>
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{localizedServiceDescription}</p>
              </section>}
              {activeTab === 'instructions' && localizedInstructions && <section>
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-950"><BookOpen size={20} className="text-blue-600"/>{isArabic ? 'طريقة التفعيل والاستخدام' : 'Activation et utilisation'}</h2>
                <p className="mt-4 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-7 text-slate-700">{localizedInstructions}</p>
              </section>}
              {activeTab === 'reviews' && <section className="overflow-hidden">
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5">
                        <span className="text-sm text-amber-400">
                          ★
                        </span>

                        <span className="text-xs font-black uppercase tracking-[0.14em] text-amber-700 sm:text-xs">
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

                      <p className="mt-1 text-sm leading-5 text-slate-500 sm:text-xs">
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

                            <p className="text-xs font-bold text-slate-400">
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
                              className="mt-1 text-xs font-bold text-slate-400"
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

                        <p className="mt-3 text-xs font-bold text-slate-400">
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

                      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400 sm:text-sm">
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

                                <p className="mt-2 text-xs font-black text-slate-700">
                                  {isArabic
                                    ? 'عميل TEO STORE'
                                    : 'Client TEO STORE'}
                                </p>
                              </div>

                              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1">
                                <span className="text-xs font-black text-emerald-700">
                                  ✓{' '}
                                  {isArabic
                                    ? 'تقييم عميل'
                                    : 'Avis client'}
                                </span>
                              </div>
                            </div>

                            {review.comment &&
                            review.comment
                              .trim()
                              .length >
                              0 ? (
                              <p className="mt-3 text-sm leading-5 text-slate-600 sm:text-xs">
                                “
                                {
                                  review.comment
                                    .trim()
                                }
                                ”
                              </p>
                            ) : (
                              <p className="mt-3 text-xs italic leading-5 text-slate-400">
                                {isArabic
                                  ? 'ترك العميل تقييمًا بدون تعليق.'
                                  : 'Le client a laissé une note sans commentaire.'}
                              </p>
                            )}

                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3">
                              <span className="text-xs font-bold text-slate-400">
                                {formatReviewDate(
                                  review.created_at,
                                )}
                              </span>

                              <span
                                dir="ltr"
                                className="text-xs font-black text-slate-700"
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
              </section>}
              </div>

              {selectedGroup &&
                selectedPlan && (
                  <div
                    className="teo-purchase-summary hidden lg:block lg:sticky lg:top-6 overflow-hidden rounded-[22px] p-5 text-white shadow-[0_16px_42px_rgba(15,23,42,0.14)]"
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
                          {!selectedFlash&&Number(selectedPlan.old_price)>selectedPlan.price&&<span className="block text-xs font-normal text-slate-300 line-through">{formatPrice(Number(selectedPlan.old_price),selectedPlan.currency)}</span>}
                          {formatPrice(
                            selectedFlash?.flash_price ?? selectedPlan.price,
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
                        service.availability !== 'available' ||
                        selectedGroup.availability !==
                          'available' ||
                        selectedPlan.availability !==
                          'available'
                      }
                      className={[
                        'mt-4 flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-black text-white transition',

                        service.availability !== 'available' ||
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
                            ? 'اشترِ الآن'
                            : 'Acheter maintenant'}
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
            </div>
          </Container>
        </section>
      )}
      {!isComingSoon && selectedGroup && selectedPlan && (
        <div className="teo-mobile-purchase fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 pt-3 shadow-lg lg:hidden" style={{paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))'}}>
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-slate-500">{getLocalizedPlanLabel(selectedPlan, language)}</p>
              <p className="break-words text-xl font-black text-blue-600">{!selectedFlash&&Number(selectedPlan.old_price)>selectedPlan.price&&<span className="block text-xs text-slate-500 line-through">{formatPrice(Number(selectedPlan.old_price),selectedPlan.currency)}</span>}{formatPrice(selectedFlash?.flash_price ?? selectedPlan.price, selectedPlan.currency)}</p>
            </div>
            <button type="button" onClick={handleContinue} disabled={service.availability !== 'available' || selectedGroup.availability !== 'available' || selectedPlan.availability !== 'available'} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><ShoppingBag size={19}/>{service.availability !== 'available' || selectedGroup.availability !== 'available' || selectedPlan.availability !== 'available' ? (isArabic ? 'غير متوفر' : 'Indisponible') : (isArabic ? 'اشترِ الآن' : 'Acheter maintenant')}</button>
          </div>
        </div>
      )}
    </main>
  )
}

export default DigitalProductDetailsPage
