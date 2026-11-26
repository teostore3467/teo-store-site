import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import ServiceLogo from './ServiceLogo'
import type { ServiceCatalogItem } from '../data/serviceCatalog'
import { getLocalizedServiceName } from '../data/serviceCatalogTranslations'
import { fetchPublicServiceCatalog } from '../data/supabaseServiceCatalog'

type LocalizedText = { fr: string; ar: string }
type SectionDefinition = {
  id: string
  category: string
  eyebrow: LocalizedText
  title: LocalizedText
  description: LocalizedText
}

const sectionDefinitions: SectionDefinition[] = [
  { id: 'intelligence-artificielle', category: 'IA & Productivité', eyebrow: { fr: 'IA & PRODUCTIVITÉ', ar: 'الذكاء الاصطناعي والإنتاجية' }, title: { fr: 'Intelligence artificielle', ar: 'الذكاء الاصطناعي' }, description: { fr: 'Outils IA premium pour travailler, créer et gagner du temps.', ar: 'أدوات ذكاء اصطناعي مميزة للعمل والإبداع وتوفير الوقت.' } },
  { id: 'gaming-recharge', category: 'Gaming', eyebrow: { fr: 'GAMING', ar: 'الألعاب' }, title: { fr: 'Gaming & Recharge', ar: 'الألعاب والشحن' }, description: { fr: 'Recharges rapides pour vos jeux et comptes préférés.', ar: 'شحن سريع لألعابك وحساباتك المفضلة.' } },
  { id: 'gaming-codes', category: 'Jeux & Codes', eyebrow: { fr: 'JEUX & CODES', ar: 'الألعاب والأكواد' }, title: { fr: 'Jeux & Codes', ar: 'الألعاب والأكواد' }, description: { fr: 'Cartes et codes numériques pour gaming.', ar: 'بطاقات وأكواد رقمية للألعاب.' } },
  { id: 'streaming', category: 'Streaming', eyebrow: { fr: 'DIVERTISSEMENT', ar: 'الترفيه' }, title: { fr: 'Streaming', ar: 'البث والترفيه' }, description: { fr: 'Films, séries, musique et divertissement premium.', ar: 'أفلام ومسلسلات وموسيقى وترفيه مميز.' } },
  { id: 'design', category: 'Design & Création', eyebrow: { fr: 'CRÉATION', ar: 'التصميم والإبداع' }, title: { fr: 'Design & Création', ar: 'التصميم والإبداع' }, description: { fr: 'Outils premium pour vos créations, vidéos et contenus.', ar: 'أدوات مميزة للتصميم والفيديو وصناعة المحتوى.' } },
  { id: 'logiciels-securite', category: 'Logiciels & Sécurité', eyebrow: { fr: 'LOGICIELS', ar: 'البرامج' }, title: { fr: 'Logiciels & Sécurité', ar: 'البرامج والأمان' }, description: { fr: 'Licences, outils professionnels et protection numérique.', ar: 'تراخيص وأدوات احترافية وحماية رقمية.' } },
  { id: 'gift-cards', category: 'Gift Cards', eyebrow: { fr: 'CARTES NUMÉRIQUES', ar: 'البطاقات الرقمية' }, title: { fr: 'Gift Cards', ar: 'بطاقات الهدايا' }, description: { fr: 'Cartes numériques pour vos plateformes et boutiques préférées.', ar: 'بطاقات رقمية لمنصاتك ومتاجرك المفضلة.' } },
  { id: 'social-premium', category: 'Social & Premium', eyebrow: { fr: 'SOCIAL', ar: 'التواصل' }, title: { fr: 'Social & Premium', ar: 'التواصل والخدمات المميزة' }, description: { fr: 'Abonnements premium pour vos réseaux et communautés.', ar: 'اشتراكات مميزة لشبكات التواصل والمجتمعات.' } },
]

function getAvailablePrices(service: ServiceCatalogItem): number[] {
  if (service.availability !== 'available') return []
  return service.groups.flatMap((group) =>
    group.availability === 'available'
      ? group.plans
          .filter((plan) => plan.availability === 'available' && Number.isFinite(plan.price) && plan.price >= 0)
          .map((plan) => plan.price)
      : [],
  )
}

function ProductRail({ services }: { services: ServiceCatalogItem[] }) {
  const { language, formatCurrencyText } = useLanguage()
  const navigate = useNavigate()
  const railRef = useRef<HTMLDivElement>(null)
  const isArabic = language === 'ar'
  const [canScrollBack, setCanScrollBack] = useState(false)
  const [canScrollForward, setCanScrollForward] = useState(false)

  const updateArrows = () => {
    const rail = railRef.current
    if (!rail) return
    setCanScrollBack(rail.scrollLeft > 3)
    setCanScrollForward(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 3)
  }

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const frame = requestAnimationFrame(updateArrows)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateArrows) : null
    observer?.observe(rail)
    window.addEventListener('resize', updateArrows)
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('resize', updateArrows)
    }
  }, [services.length])

  const scrollCards = (direction: -1 | 1) => {
    const rail = railRef.current
    if (!rail) return
    const card = rail.querySelector<HTMLElement>('[data-product-card="true"]')
    const gap = parseFloat(getComputedStyle(rail).gap) || 12
    rail.scrollBy({ left: direction * ((card?.offsetWidth || 200) + gap) * 2, behavior: 'smooth' })
  }

  const formatPrice = (price: number) => {
    const number = new Intl.NumberFormat(isArabic ? 'ar-MR-u-nu-latn' : 'fr-FR-u-nu-latn', {
      numberingSystem: 'latn', maximumFractionDigits: 2,
    }).format(price)
    return formatCurrencyText(`${number} MRU`)
  }

  return (
    <div className="relative min-w-0 max-w-full overflow-hidden">
      <div className="mb-3 flex items-center justify-end gap-2">
        <span className="me-auto text-[11px] font-medium text-slate-500">{isArabic ? 'اسحب لاستكشاف المنتجات' : 'Glissez pour explorer les produits'}</span>
        <button type="button" onClick={() => scrollCards(-1)} disabled={!canScrollBack} aria-label={isArabic ? 'المنتجات السابقة' : 'Produits précédents'} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={18}/></button>
        <button type="button" onClick={() => scrollCards(1)} disabled={!canScrollForward} aria-label={isArabic ? 'المنتجات التالية' : 'Produits suivants'} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight size={18}/></button>
      </div>
      <div
        ref={railRef}
        dir="ltr"
        onScroll={updateArrows}
        className="flex w-full max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 touch-pan-x [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] sm:gap-4"
      >
      {services.map((service) => {
        const prices = getAvailablePrices(service)
        const minPrice = prices.length ? Math.min(...prices) : null
        const isOutOfStock = service.availability === 'out_of_stock'
        const isComingSoon = service.availability === 'coming_soon'
        const isAvailable = service.availability === 'available' && minPrice !== null
        const priceText = isOutOfStock
          ? (isArabic ? 'غير متوفر' : 'Indisponible')
          : isComingSoon
            ? (isArabic ? 'قريبًا' : 'Bientôt')
            : minPrice === null
              ? (isArabic ? 'غير متوفر' : 'Indisponible')
              : prices.length > 1
                ? (isArabic ? `ابتداءً من ${formatPrice(minPrice)}` : `Dès ${formatPrice(minPrice)}`)
                : formatPrice(minPrice)
        const statusBadge = isOutOfStock || (!isAvailable && !isComingSoon)
          ? (isArabic ? 'غير متوفر' : 'Indisponible')
          : isComingSoon
            ? (isArabic ? 'قريبًا' : 'Bientôt')
            : null

        return (
          <button
            key={service.slug}
            type="button"
            data-product-card="true"
            onClick={() => navigate(`/services-numeriques/${encodeURIComponent(service.slug)}`)}
            className={`group block w-[min(43vw,190px)] shrink-0 snap-start cursor-pointer sm:w-[190px] lg:w-[205px] xl:w-[210px] ${isArabic ? 'text-right' : 'text-left'}`}
          >
            <article dir={isArabic ? 'rtl' : 'ltr'} className="h-full overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition duration-300 group-hover:-translate-y-1 group-hover:border-blue-200 group-hover:shadow-[0_18px_40px_rgba(15,23,42,0.09)] lg:rounded-[22px]">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#192638]">
                {statusBadge && (
                  <span className={`absolute z-10 top-2 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs font-black uppercase tracking-wide text-white backdrop-blur lg:top-3 ${isArabic ? 'right-2 lg:right-3' : 'left-2 lg:left-3'}`}>
                    {statusBadge}
                  </span>
                )}
                <ServiceLogo serviceSlug={service.slug} fallbackUrl={service.image_url} fallback={service.name.charAt(0).toUpperCase()} className="block h-full w-full object-cover"/>
              </div>
              <div className="min-w-0 p-3 sm:p-4">
                <h3 className="line-clamp-2 break-words min-h-[40px] text-sm font-black leading-5 text-slate-950 transition group-hover:text-blue-600 lg:min-h-[44px] lg:text-[15px]">{getLocalizedServiceName(service,language)}</h3>
                <p className="mt-1 line-clamp-2 min-h-[40px] text-xs leading-5 text-slate-500">{isArabic ? 'عرض المنتجات' : 'Voir les produits'}</p>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{isArabic ? 'السعر' : 'Prix'}</p>
                      <p dir="ltr" className={`mt-1 text-left text-sm font-black ${isAvailable ? 'text-slate-950' : isOutOfStock ? 'text-rose-600' : 'text-amber-600'}`}>{priceText}</p>
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">{isArabic ? '←' : '→'}</span>
                  </div>
                </div>
              </div>
            </article>
          </button>
        )
      })}
      </div>
    </div>
  )
}

function DigitalProductsSection() {
  const { language } = useLanguage()
  const [catalogServices, setCatalogServices] = useState<ServiceCatalogItem[]>([])
  const isArabic = language === 'ar'

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {const catalog=await fetchPublicServiceCatalog();if(mounted)setCatalogServices(catalog)} catch(error){console.error('Unable to load digital catalog:',error)}
    }
    void load()
    return () => { mounted = false }
  }, [])

  const sections = useMemo(() => {
    const knownCategories = new Set(sectionDefinitions.map((section) => section.category))
    const categories = Array.from(new Set(catalogServices.map((service) => service.category)))
    const extraSections: SectionDefinition[] = categories
      .filter((category) => !knownCategories.has(category))
      .map((category, index) => ({
        id: `category-${index}`,
        category,
        eyebrow: { fr: 'SERVICES NUMÉRIQUES', ar: 'الخدمات الرقمية' },
        title: { fr: category, ar: category },
        description: { fr: 'Découvrez nos services numériques.', ar: 'اكتشف خدماتنا الرقمية.' },
      }))
    return [...sectionDefinitions, ...extraSections]
      .map((section) => ({
        ...section,
        services: catalogServices.filter((service) => service.category === section.category),
      }))
      .filter((section) => section.services.length > 0)
  }, [catalogServices])

  const scrollToEsim = () => document.getElementById('esim')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <section className="bg-white py-10 sm:py-16 lg:py-20">
      <Container>
        <div className="mx-auto max-w-[1440px]">
          <section className="mb-12 sm:hidden">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">{isArabic ? 'السفر والاتصال' : 'VOYAGE & CONNEXION'}</p>
            <h2 className="mt-1.5 text-[22px] font-black tracking-[-0.03em] text-slate-950">eSIM</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">{isArabic ? 'اختر وجهتك لاكتشاف باقات eSIM المتوفرة.' : 'Choisissez votre destination pour découvrir les forfaits eSIM.'}</p>
            <button type="button" onClick={scrollToEsim} className={`group mt-4 block w-[164px] ${isArabic ? 'text-right' : 'text-left'}`}>
              <article className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
                <div className="relative flex aspect-[1.22/1] items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(145deg, #07111f 0%, #102a56 52%, #1d4ed8 100%)' }}>
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(96,165,250,0.25)' }} />
                  <span className={`absolute z-10 top-2 rounded-full border border-white/10 bg-black/15 px-2 py-1 text-xs font-black uppercase tracking-wide text-white backdrop-blur ${isArabic ? 'right-2' : 'left-2'}`}>eSIM</span>
                  <span className="relative text-[38px] font-black text-white">e</span>
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="p-3">
                  <h3 className="min-h-[40px] text-sm font-black leading-5 text-slate-950">{isArabic ? 'eSIM دولية' : 'eSIM internationale'}</h3>
                  <p className="mt-1 min-h-[40px] text-xs leading-5 text-slate-500">{isArabic ? 'الصين، تركيا، الإمارات، فرنسا والمزيد' : 'Chine, Turquie, UAE, France et plus'}</p>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">{isArabic ? 'الوجهة' : 'Destination'}</p>
                        <p className="mt-1 text-sm font-black text-slate-950">{isArabic ? 'اختر' : 'Choisir'}</p>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-600">{isArabic ? '←' : '→'}</span>
                    </div>
                  </div>
                </div>
              </article>
            </button>
          </section>
          <div className="space-y-12 sm:space-y-16 lg:space-y-20">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28 overflow-hidden">
                <div className="flex items-end justify-between gap-5">
                  <div className="max-w-2xl">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">{section.eyebrow[language]}</p>
                    <h2 className="mt-1.5 text-[22px] font-black tracking-[-0.03em] text-slate-950 sm:text-3xl lg:text-[32px]">{section.title[language]}</h2>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">{section.description[language]}</p>
                  </div>
                  <span className="hidden shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-500 lg:block">{section.services.length} {isArabic ? 'خدمات' : 'services'}</span>
                </div>
                <ProductRail services={section.services} />
              </section>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

export default DigitalProductsSection
