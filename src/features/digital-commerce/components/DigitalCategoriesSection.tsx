import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Bot, Clapperboard, Code2, CreditCard,
  Gamepad2, Palette, Users,
} from 'lucide-react'
import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'

const categories = [
  { id: 'ai', icon: Bot, fr: 'Intelligence artificielle', ar: 'الذكاء الاصطناعي', frDescription: 'Assistants et outils IA', arDescription: 'مساعدون وأدوات ذكية', tone: 'text-indigo-600 bg-indigo-50' },
  { id: 'gaming', icon: Gamepad2, fr: 'Gaming & Codes', ar: 'الألعاب والأكواد', frDescription: 'Jeux et recharges', arDescription: 'ألعاب وشحن رقمي', tone: 'text-violet-600 bg-violet-50' },
  { id: 'streaming', icon: Clapperboard, fr: 'Streaming', ar: 'الترفيه', frDescription: 'Films et musique', arDescription: 'أفلام وموسيقى', tone: 'text-rose-600 bg-rose-50' },
  { id: 'design', icon: Palette, fr: 'Design & Création', ar: 'التصميم والإبداع', frDescription: 'Création et montage', arDescription: 'تصميم ومونتاج', tone: 'text-orange-600 bg-orange-50' },
  { id: 'software', icon: Code2, fr: 'Logiciels', ar: 'البرامج', frDescription: 'Outils et licences', arDescription: 'برامج وتراخيص', tone: 'text-sky-600 bg-sky-50' },
  { id: 'gift-cards', icon: CreditCard, fr: 'Cartes cadeaux', ar: 'بطاقات الهدايا', frDescription: 'Cartes numériques', arDescription: 'بطاقات رقمية', tone: 'text-emerald-600 bg-emerald-50' },
  { id: 'social', icon: Users, fr: 'Réseaux sociaux', ar: 'التواصل الاجتماعي', frDescription: 'Services premium', arDescription: 'خدمات مميزة', tone: 'text-blue-600 bg-blue-50' },
] as const

export default function DigitalCategoriesSection() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const isArabic = language === 'ar'
  const railRef = useRef<HTMLDivElement>(null)
  const [canBack, setCanBack] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateArrows = () => {
    const el = railRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const current = Math.abs(el.scrollLeft)
    setCanBack(current > 5)
    setCanNext(current < max - 5)
  }

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [language])

  const move = (direction: -1 | 1) => {
    const el = railRef.current
    if (!el) return
    el.scrollBy({ left: (isArabic ? -1 : 1) * direction * Math.max(220, el.clientWidth * 0.55), behavior: 'smooth' })
  }

  return (
    <section className="border-b border-slate-100 bg-white py-5 sm:py-8 dark:bg-slate-950 dark:border-slate-800" dir={isArabic ? 'rtl' : 'ltr'}>
      <Container>
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-blue-600">{isArabic ? 'تصفح حسب النوع' : 'PAR CATÉGORIE'}</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-2xl">{isArabic ? 'استكشف الخدمات' : 'Explorer les catégories'}</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{isArabic ? 'اختر التصنيف الذي يناسبك' : 'Choisissez les services qui vous intéressent'}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2" dir="ltr">
            <button type="button" onClick={() => move(-1)} disabled={!canBack} aria-label={isArabic ? 'السابق' : 'Précédent'} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-30"><ArrowLeft size={17} /></button>
            <button type="button" onClick={() => move(1)} disabled={!canNext} aria-label={isArabic ? 'التالي' : 'Suivant'} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-30"><ArrowRight size={17} /></button>
          </div>
        </div>
        <div ref={railRef} onScroll={updateArrows} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]" style={{ WebkitOverflowScrolling: 'touch' }}>
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button key={category.id} type="button" onClick={() => navigate(`/services-numeriques?category=${category.id}`)} className="group flex w-[148px] shrink-0 snap-start flex-col items-start rounded-2xl border border-slate-200 bg-white p-3 dark:bg-slate-900 dark:border-slate-700 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:w-[190px]">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${category.tone}`}><Icon size={23} strokeWidth={2.1} aria-hidden="true" /></span>
                <span className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{isArabic ? category.ar : category.fr}</span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{isArabic ? category.arDescription : category.frDescription}</span>
                <span className="mt-3 text-xs font-semibold text-blue-600 group-hover:underline">{isArabic ? 'عرض الخدمات' : 'Découvrir'} →</span>
              </button>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
