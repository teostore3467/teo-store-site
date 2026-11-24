import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Headphones, MessageCircle, Mail, Phone, Home, ShoppingBag, UserCircle, PackageSearch, Globe, X } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { supabase } from '../../lib/supabase'
import Container from './Container'


function Facebook({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 21v-8h3l.5-3H14V8c0-1 .3-2 2-2h2V3.3A20 20 0 0 0 15 3c-3 0-5 1.8-5 5v2H7v3h3v8z"/></svg>
}
function Instagram({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
}
function TikTok({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 2h3a6 6 0 0 0 5 5v3a9 9 0 0 1-5-1.6V16a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3z"/></svg>
}

const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}
const str = (v: unknown) => typeof v === 'string' ? v.trim() : ''
const phoneNumber = (v: unknown) => { const n = str(v).replace(/\D/g, ''); return /^\d{8}$/.test(n) ? `222${n}` : n }

export default function PublicFooter() {
  const { language } = useLanguage()
  const ar = language === 'ar'
  const t = (a: string, f: string) => ar ? a : f
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [payments, setPayments] = useState<{name: string; logo: string}[]>([])
  const [supportOpen, setSupportOpen] = useState(false)
  useEffect(() => {
    if (!supportOpen) return
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSupportOpen(false) }
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [supportOpen])
  const [logoFailed, setLogoFailed] = useState(false)
  useEffect(() => {
    let alive = true
    async function load() {
      const [s, p] = await Promise.all([
        supabase.from('app_settings').select('setting_key,setting_value').in('setting_key', ['store', 'support', 'support_whatsapp', 'footer_public']),
        supabase.from('payment_methods').select('name').eq('is_active', true).order('sort_order', { ascending: true }),
      ])
      if (!alive) return
      if (!s.error) setSettings(Object.fromEntries((s.data ?? []).map(row => [row.setting_key, row.setting_value])))
      if (!p.error) setPayments((p.data ?? []).map(row => ({name: str(row.name), logo: ''})).filter(row => row.name))
    }
    void load()
    const channel = supabase.channel('public-footer-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => { void load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, () => { void load() }).subscribe()
    const refresh = () => { void load() }
    window.addEventListener('focus', refresh)
    return () => { alive = false; window.removeEventListener('focus', refresh); void supabase.removeChannel(channel) }
  }, [])
  const store = obj(settings.store), support = obj(settings.support), wa = obj(settings.support_whatsapp)
  const footer = obj(settings.footer_public)
  const paymentLogos = obj(footer.paymentLogos)
  const hiddenPayments = obj(footer.hiddenPayments)
  const safeUrl = (value: unknown) => { try { const u = new URL(str(value)); return u.protocol === 'https:' ? u.href : '' } catch { return '' } }
  const socials = [
    {label:'Facebook', icon:Facebook, href:safeUrl(footer.facebook), color:'#1877f2'},
    {label:'TikTok', icon:TikTok, href:safeUrl(footer.tiktok), color:'#111827'},
    {label:'Instagram', icon:Instagram, href:safeUrl(footer.instagram), color:'#c13584'},
  ].filter(item => item.href)
  const visiblePayments = payments.filter(p => hiddenPayments[p.name] !== true)
  const name = str(store.storeName) || 'TEO STORE'
  const logo = str(store.logoUrl)
  useEffect(() => { setLogoFailed(false) }, [logo])
  const whatsapp = phoneNumber(wa.number ?? support.whatsapp)
  const phone = phoneNumber(support.phone)
  const email = str(support.email)
  const contacts = [
    ...(wa.active === true && /^\d{8,15}$/.test(whatsapp) ? [{ icon: MessageCircle, label: 'WhatsApp', href: `https://wa.me/${whatsapp}?text=${encodeURIComponent(str(ar ? wa.messageAr : wa.messageFr) || t('مرحبًا، أحتاج إلى المساعدة.', 'Bonjour, j’ai besoin d’aide.'))}`, external: true }] : []),
    ...(/^\d{8,15}$/.test(phone) ? [{ icon: Phone, label: t('اتصل بنا', 'Téléphone'), href: `tel:+${phone}`, external: false }] : []),
    ...(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? [{ icon: Mail, label: t('البريد الإلكتروني', 'E-mail'), href: `mailto:${email}`, external: false }] : []),
  ]
  const links = [
    { icon: Home, label: t('الرئيسية', 'Accueil'), to: '/' },
    { icon: ShoppingBag, label: t('الخدمات الرقمية', 'Services numériques'), to: '/services-numeriques' },
    { icon: UserCircle, label: t('حسابي', 'Mon compte'), to: '/profil' },
    { icon: PackageSearch, label: t('متابعة الطلبات', 'Suivi des commandes'), to: '/profil' },
  ]
  return <footer dir={ar ? 'rtl' : 'ltr'} style={{ background: 'linear-gradient(135deg,#07101f,#14254a)', color: '#f8fafc' }}>
    {visiblePayments.length > 0 && <div style={{background:'#f1f5f9',color:'#334155'}}><Container><section className="py-3 text-center"><h2 className="mb-2 text-xs font-semibold">{t('طرق الدفع المتاحة','Moyens de paiement')}</h2><div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">{visiblePayments.map((payment,index) => { const url = safeUrl(paymentLogos[payment.name]); return <span key={`${payment.name}-${index}`} className="inline-flex h-8 min-w-12 max-w-24 items-center justify-center text-xs font-semibold">{url ? <img src={url} alt={payment.name} className="max-h-7 max-w-20 object-contain" loading="lazy" onError={e => {e.currentTarget.style.display='none'; const next=e.currentTarget.nextElementSibling; if(next instanceof HTMLElement) next.hidden=false}} /> : null}<span hidden={!!url}>{payment.name}</span></span> })}</div></section></Container></div>}
    <Container>
      <div className="grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
        <section>
          <Link to="/" className="inline-flex items-center gap-3" style={{color:'#fff'}}>
            {logo && !logoFailed ? <img src={logo} alt={name} onError={() => setLogoFailed(true)} className="h-10 max-w-32 object-contain" /> : <span className="flex h-11 w-11 items-center justify-center rounded-xl text-xl font-black" style={{background:'#2563eb',color:'#fff'}}>T</span>}
            <span className="text-lg font-black">{name}</span>
          </Link>
          <p className="mt-3 text-sm leading-7" style={{color:'#cbd5e1'}}>{str(ar ? store.sloganAr : store.sloganFr) || t('متجرك للخدمات والاشتراكات الرقمية.', 'Votre boutique de services et abonnements numériques.')}</p>
        </section>
        <details className="group" open>
          <summary className="mb-2 cursor-pointer text-sm font-bold" style={{color:'#fff'}}>{t('روابط سريعة', 'Liens rapides')}</summary>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-1" aria-label={t('روابط المتجر','Liens de la boutique')}>
            {links.map(({icon: Icon,label,to}) => <Link key={label} to={to} className="flex min-h-10 items-center gap-2 rounded-lg text-sm hover:underline" style={{color:'#cbd5e1'}}><Icon size={17} style={{color:'#93c5fd'}} aria-hidden="true"/>{label}</Link>)}
          </nav>
        </details>
        <details className="group" open>
          <summary className="mb-2 cursor-pointer text-sm font-bold" style={{color:'#fff'}}>{t('خدمة الزبناء', 'Service client')}</summary>
          <div className="grid grid-cols-2 gap-2">
            {contacts.map(({icon: Icon,label,href,external}) => <a key={label} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center text-xs font-semibold hover:underline" style={{background:'#ffffff0a',borderColor:'#ffffff26',color:'#e2e8f0'}}><Icon size={23} style={{color:label === 'WhatsApp' ? '#4ade80' : '#93c5fd'}} aria-hidden="true"/>{label}</a>)}
          </div>
          {!contacts.length && <p className="text-sm" style={{color:'#cbd5e1'}}>{t('وسائل التواصل غير متاحة حاليًا.', 'Les coordonnées ne sont pas disponibles actuellement.')}</p>}
        </details>
      </div>
      {socials.length > 0 && <div className="flex flex-wrap items-center justify-center gap-3 border-t py-4" style={{borderColor:'#ffffff26'}}><span className="text-xs" style={{color:'#cbd5e1'}}>{t('تابعونا','Suivez-nous')}</span>{socials.map(({label,icon:Icon,href,color}) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="flex h-9 w-9 items-center justify-center rounded-full" style={{background:color,color:'#fff'}}><Icon size={18}/></a>)}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t py-4 text-xs" style={{borderColor:'#ffffff26',color:'#cbd5e1'}}><span>© {new Date().getFullYear()} {name} — {t('جميع الحقوق محفوظة','Tous droits réservés')}</span><span className="flex items-center gap-1"><Globe size={14} aria-hidden="true"/>{t('موريتانيا · أوقية جديدة','Mauritanie · MRU')}</span></div>
    </Container>
    {contacts.length > 0 && <div className="fixed z-50 flex flex-col items-end gap-3" style={{insetInlineEnd:16,bottom:'calc(84px + env(safe-area-inset-bottom, 0px))'}}>
      {supportOpen && <section id="teo-support-menu" aria-label={t('خدمة الزبناء','Service client')} className="w-72 max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border shadow-2xl" style={{background:'#0f172a',borderColor:'#334155',color:'#f8fafc'}}>
        <div className="flex items-center justify-between gap-2 p-4" style={{background:'#1d4ed8',color:'#fff'}}><span className="flex items-center gap-2 font-bold"><Headphones size={21}/>{t('خدمة الزبناء','Service client')}</span><button type="button" onClick={() => setSupportOpen(false)} aria-label={t('إغلاق','Fermer')} className="rounded-lg p-2"><X size={20}/></button></div>
        <div className="space-y-2 p-3"><p className="text-sm" style={{color:'#cbd5e1'}}>{t('كيف يمكننا مساعدتك؟','Comment pouvons-nous vous aider ?')}</p>
        {contacts.map(({icon: Icon,label,href,external}) => <a key={label} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold hover:underline" style={{background:'#1e293b',borderColor:'#334155',color:'#f8fafc'}}><Icon size={21} style={{color:label === 'WhatsApp' ? '#4ade80' : '#93c5fd'}}/>{label}</a>)}
        </div>
      </section>}
      <button type="button" aria-expanded={supportOpen} aria-controls={supportOpen ? 'teo-support-menu' : undefined} aria-label={t('خدمة الزبناء','Service client')} onClick={() => setSupportOpen(v => !v)} className="flex h-14 w-14 items-center justify-center rounded-full shadow-xl" style={{background:'#2563eb',color:'#fff'}}>{supportOpen ? <X size={25}/> : <Headphones size={27}/>}</button>
    </div>}
  </footer>
}
