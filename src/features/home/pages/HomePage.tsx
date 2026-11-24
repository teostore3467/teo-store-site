import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock3, ShoppingBag, Sparkles, MessageCircle } from 'lucide-react'
import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'
import { NewsPublic } from '../../news/News'
import DigitalCategoriesSection from '../../digital-commerce/components/DigitalCategoriesSection'
import FeaturedDigitalSection from '../components/FeaturedDigitalSection'

type PreorderItem = {
  id: string
  titleAr: string
  titleFr: string
  imageUrl: string
  price: number
  deliveryMinDays: number
  deliveryMaxDays: number
  whatsappNumber?: string
  visible?: boolean
  referenceCode?: string
}

type PreorderConfig = {
  enabled?: boolean
  titleAr?: string
  titleFr?: string
  whatsappNumber?: string
  items?: PreorderItem[]
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

function parsePreorders(value: unknown): PreorderConfig | null {
  if (!isRecord(value)) return null
  const items = Array.isArray(value.items) ? value.items : []
  return {
    enabled: value.enabled === true,
    titleAr: typeof value.titleAr === 'string' ? value.titleAr : 'منتجات مختارة حسب الطلب',
    titleFr: typeof value.titleFr === 'string' ? value.titleFr : 'Sélection sur commande',
    whatsappNumber: typeof value.whatsappNumber === 'string' ? value.whatsappNumber : '',
    items: items.filter(isRecord).slice(0, 2).map((item) => ({
      id: String(item.id ?? ''),
      titleAr: String(item.titleAr ?? ''),
      titleFr: String(item.titleFr ?? ''),
      imageUrl: String(item.imageUrl ?? ''),
      price: Number(item.price ?? 0),
      deliveryMinDays: Number(item.deliveryMinDays ?? 4),
      deliveryMaxDays: Number(item.deliveryMaxDays ?? 17),
      whatsappNumber: typeof item.whatsappNumber === 'string' ? item.whatsappNumber : undefined,
      referenceCode: typeof item.referenceCode === 'string' ? item.referenceCode : undefined,
      visible: item.visible !== false,
    })).filter(item => item.id && item.imageUrl.startsWith('https://') && Number.isFinite(item.price) && item.price >= 0 && item.visible),
  }
}

function PreorderShowcase({ ar }: { ar: boolean }) {
  const [config, setConfig] = useState<PreorderConfig | null>(null)
  const [brokenImages, setBrokenImages] = useState<string[]>([])
  useEffect(() => {
    let active = true
    void supabase.from('app_settings').select('setting_value').eq('setting_key', 'preorder_featured').maybeSingle().then(({ data, error }) => {
      if (active && !error) setConfig(parsePreorders(data?.setting_value))
    })
    return () => { active = false }
  }, [])
  const items = (config?.items ?? []).filter(item => !brokenImages.includes(item.id))
  if (!config?.enabled || items.length === 0) return null
  const formatPrice = (price: number) => new Intl.NumberFormat(ar ? 'ar-MR-u-nu-latn' : 'fr-FR-u-nu-latn', { numberingSystem: 'latn', maximumFractionDigits: 2 }).format(price)
  return (
    <section className="bg-white py-10 sm:py-12">
      <Container>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600">TEO SELECTION</span>
            <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">{ar ? config.titleAr : config.titleFr}</h2>
            <p className="mt-1 text-xs text-slate-500">{ar ? 'منتجات مختارة، مع تفاصيل التسليم قبل الطلب' : 'Produits sélectionnés, délais affichés avant commande'}</p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{ar ? 'حسب الطلب' : 'Sur commande'}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-4xl lg:gap-4">
          {items.map(item => {
            const phone = (item.whatsappNumber || config.whatsappNumber || '').replace(/\D/g, '')
            const code = item.referenceCode || item.id
            const title = (ar ? item.titleAr : item.titleFr) || item.titleAr || item.titleFr
            const message = ar
              ? `مرحبًا TEO STORE، أريد طلب المنتج: ${title}\nرمز المنتج: ${code}\nالسعر: ${formatPrice(item.price)} MRU\nأرجو تأكيد التوفر ومدة التسليم وإرسال رمز تتبع طلبي.`
              : `Bonjour TEO STORE, je souhaite commander : ${title}\nRéférence : ${code}\nPrix : ${formatPrice(item.price)} MRU\nMerci de confirmer la disponibilité, le délai et la référence de suivi.`
            return (
              <article key={item.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-lg">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-50">
                  <img src={item.imageUrl} alt={title} loading="lazy" onError={() => setBrokenImages(current => [...current, item.id])} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
                  <span className="absolute end-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-slate-800 shadow-sm">{ar ? 'حسب الطلب' : 'Sur commande'}</span>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-900">{title}</h3>
                  <p className="mt-1 text-base font-black text-blue-700">{formatPrice(item.price)} <span className="text-xs font-semibold">MRU</span></p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><Clock3 size={13} />{ar ? `التسليم: ${item.deliveryMinDays}–${item.deliveryMaxDays} يوم` : `Livraison : ${item.deliveryMinDays}–${item.deliveryMaxDays} jours`}</p>
                  {phone ? <a href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-9 items-center justify-center gap-2 rounded-xl bg-[#0758c9] px-2 py-2 text-xs font-bold text-white transition hover:bg-[#0646a0]"><MessageCircle size={15}/>{ar ? 'اطلب عبر واتساب' : 'Commander sur WhatsApp'}</a> : <span className="mt-3 flex min-h-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500">{ar ? 'الطلب غير متاح حاليًا' : 'Commande indisponible'}</span>}
                </div>
              </article>
            )
          })}
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-500">{ar ? 'رمز المنتج في رسالة واتساب للتعريف بالمنتج؛ رمز تتبع الطلب يصدر عند تسجيل الطلب وتأكيده من المتجر.' : 'La référence du produit sert à l’identifier ; le code de suivi est fourni après enregistrement et confirmation de la commande.'}</p>
      </Container>
    </section>
  )
}

function HomePage() {
  const { language, t } = useLanguage()
  const ar = language === 'ar'
  const Arrow = ar ? ArrowLeft : ArrowRight
  return (
    <main dir={ar ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f8fafd] text-slate-900">
      <section className="border-b border-slate-100 bg-white">
        <Container className="py-4 sm:py-5">
          <div className="relative overflow-hidden rounded-2xl bg-[#071b4d] px-5 py-5 text-white sm:px-8 sm:py-7">
            <div aria-hidden="true" className="pointer-events-none absolute -end-12 -top-28 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-wide text-blue-200"><Sparkles size={14}/> TEO STORE · {ar ? 'موريتانيا' : 'Mauritanie'}</span>
              <h1 className="mt-2 text-xl font-extrabold leading-tight sm:text-2xl lg:text-3xl">{ar ? 'تسوّق بذكاء، وبكل سهولة.' : 'Achetez plus simplement.'}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/85">{ar ? 'خدمات رقمية ومنتجات مختارة، بأسعار واضحة وطلبات سهلة المتابعة.' : 'Services numériques et produits sélectionnés, prix clairs et commandes faciles à suivre.'}</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                <Link to="/services-numeriques" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"><ShoppingBag size={16}/>{t.home.exploreServices}<Arrow size={14}/></Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
      <DigitalCategoriesSection />
      <FeaturedDigitalSection />
      <NewsPublic home />
      <PreorderShowcase ar={ar}/>
    </main>
  )
}
export default HomePage
