import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Headphones, MessageCircle, Mail, Home, ShoppingBag, UserCircle, PackageSearch, Globe, X, ChevronUp, ChevronDown, ShieldCheck, ArrowUp, CircleHelp } from 'lucide-react'
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
        supabase.from('app_settings').select('setting_key,setting_value').in('setting_key', ['store', 'support', 'footer_public']),
        supabase.from('payment_methods').select('name,image_path').eq('is_active', true).order('sort_order', { ascending: true }),
      ])
      if (!alive) return
      if (!s.error) setSettings(Object.fromEntries((s.data ?? []).map(row => [row.setting_key, row.setting_value])))
      if (!p.error) setPayments((p.data ?? []).map(row => ({name: str(row.name), logo: str(row.image_path) ? supabase.storage.from('payment-methods').getPublicUrl(str(row.image_path)).data.publicUrl : ''})).filter(row => row.name))
    }
    void load()
    const channel = supabase.channel('public-footer-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => { void load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, () => { void load() }).subscribe()
    const refresh = () => { void load() }
    window.addEventListener('focus', refresh)
    return () => { alive = false; window.removeEventListener('focus', refresh); void supabase.removeChannel(channel) }
  }, [])
  const store = obj(settings.store), support = obj(settings.support)
  const footer = obj(settings.footer_public)
  const hiddenPayments = obj(footer.hiddenPayments)
  const safeUrl = (value: unknown) => { try { const u = new URL(str(value)); return u.protocol === 'https:' ? u.href : '' } catch { return '' } }
  const socials = [
    {label:'Facebook', icon:Facebook, href:safeUrl(footer.facebook), color:'#1877f2'},
    {label:'TikTok', icon:TikTok, href:safeUrl(footer.tiktok), color:'#111827'},
    {label:'Instagram', icon:Instagram, href:safeUrl(footer.instagram), color:'#c13584'},
  ].filter(item => item.href)
  const visiblePayments = payments.filter(p => hiddenPayments[p.name] !== true)
  const name = str(store.storeName) || 'TEO STORE'
  const logo = safeUrl(store.logoFooterUrl) || safeUrl(store.logoDarkUrl)
  useEffect(() => { setLogoFailed(false) }, [logo])
  const email = str(support.email)
  const emailHref = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : ''
  const internalPath = (v: unknown) => { const p = str(v); return /^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(p) ? p : '' }
  const chatPath = internalPath(footer.chatPath)
  const chatReady = footer.chatEnabled === true && !!chatPath
  const [showTop, setShowTop] = useState(false)
  useEffect(() => { const update = () => setShowTop(window.scrollY > 500); update(); window.addEventListener('scroll', update, { passive: true }); return () => window.removeEventListener('scroll', update) }, [])
  const faq = Array.isArray(footer.faq) ? footer.faq.map(obj).map(q => ({ question: str(ar ? q.questionAr : q.questionFr), answer: str(ar ? q.answerAr : q.answerFr) })).filter(q => q.question && q.answer) : []
  const policies = Array.isArray(footer.policies) ? footer.policies.map(obj).map(q => ({ label: str(ar ? q.labelAr : q.labelFr), to: internalPath(q.path) })).filter(q => q.label && q.to && q.to !== chatPath && !/whatsapp/i.test(q.to)) : []
  const links = [
    { icon: Home, label: t('الرئيسية', 'Accueil'), to: '/' },
    { icon: ShoppingBag, label: t('الخدمات الرقمية', 'Services numériques'), to: '/services-numeriques' },
    { icon: UserCircle, label: t('حسابي', 'Mon compte'), to: '/profil' },
    { icon: PackageSearch, label: t('متابعة الطلبات', 'Suivi des commandes'), to: '/profil' },
  ]
  const [expanded, setExpanded] = useState<string[]>([])
  const toggle = (key: string) => setExpanded(old => old.includes(key) ? old.filter(x => x !== key) : [...old, key])
  const groups = [
    { key: 'store', icon: ShoppingBag, title: t('اكتشف المتجر','Découvrir la boutique'), items: links.slice(0,2) },
    { key: 'account', icon: UserCircle, title: t('حساب الزبون','Espace client'), items: links.slice(2) },
    { key: 'policies', icon: ShieldCheck, title: t('السياسات والضمان','Politiques et garanties'), items: policies.map(p => ({...p, icon: ShieldCheck})) },
  ].filter(g => g.items.length)
  return <footer dir={ar ? 'rtl' : 'ltr'} style={{background:'#0b1120',color:'#f8fafc'}}>
    <Container>
      <div className="grid gap-6 py-8 md:grid-cols-2 xl:grid-cols-4">
        <section>
          <Link to="/" className="inline-flex items-center gap-3" style={{color:'#fff'}}>
            {logo && !logoFailed ? <img src={logo} alt="" onError={()=>setLogoFailed(true)} className="h-10 max-w-32 object-contain" style={{background:'transparent',border:0,boxShadow:'none'}}/> : <span className="text-3xl font-black">T</span>}
            <span className="text-lg font-black">{name}</span>
          </Link>
          <p className="mt-3 text-sm leading-7" style={{color:'#aabbd2'}}>{str(ar ? store.sloganAr : store.sloganFr) || t('خدمات رقمية بسيطة وسريعة','Services numériques simples et rapides')}</p>
          <div className="mt-4 flex flex-wrap gap-3">{socials.map(({label,icon:Icon,href,color})=><a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="flex h-10 w-10 items-center justify-center rounded-full hover:opacity-80" style={{background:color,color:'#fff'}}><Icon size={19}/></a>)}</div>
        </section>
        {groups.map(({key,icon:Icon,title,items})=><section key={key} className="border-t pt-3 md:border-0 md:pt-0" style={{borderColor:'#263349'}}>
          <button type="button" className="flex min-h-11 w-full items-center gap-2 text-sm font-bold md:hidden" aria-expanded={expanded.includes(key)} onClick={()=>toggle(key)}><Icon size={18} color="#60a5fa"/>{title}<span className="ms-auto">{expanded.includes(key)?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</span></button>
          <h2 className="mb-3 hidden items-center gap-2 text-sm font-bold md:flex"><Icon size={18} color="#60a5fa"/>{title}</h2>
          <nav aria-label={title} className={`${expanded.includes(key)?'grid':'hidden'} gap-1 md:grid`}>{items.map(({icon:ItemIcon,label,to})=><Link key={label} to={to} className="flex min-h-10 items-center gap-2 text-sm hover:underline" style={{color:'#cbd5e1'}}><ItemIcon size={16} color="#93c5fd"/>{label}</Link>)}</nav>
        </section>)}
        <section className="border-t pt-4 md:border-0 md:pt-0" style={{borderColor:'#263349'}}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><Headphones size={18} color="#60a5fa"/>{t('مركز المساعدة','Centre d’aide')}</h2>
          <button type="button" onClick={()=>setSupportOpen(true)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold" style={{background:'#2563eb',color:'#fff'}}><MessageCircle size={18}/>{t('خدمة الزبناء','Service client')}</button>
          {emailHref && <a href={emailHref} className="mt-3 flex min-h-10 items-center gap-2 text-sm hover:underline" style={{color:'#cbd5e1'}}><Mail size={16}/>{t('البريد الإلكتروني','E-mail')}</a>}
          {faq.length>0 && <button type="button" onClick={()=>setSupportOpen(true)} className="flex min-h-10 items-center gap-2 text-sm"><CircleHelp size={16}/>{t('الأسئلة الشائعة','Questions fréquentes')}</button>}
        </section>
      </div>
      {visiblePayments.length>0 && <section className="border-t py-5" style={{borderColor:'#263349'}}><h2 className="mb-4 text-center text-xs font-semibold" style={{color:'#aabbd2'}}>{t('طرق الدفع المتاحة','Moyens de paiement')}</h2><div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">{visiblePayments.map(payment=><PaymentLogo key={`${payment.name}:${payment.logo}`} name={payment.name} url={safeUrl(payment.logo)}/>)}</div></section>}
      <div className="flex flex-wrap items-center justify-center gap-3 border-t py-4 text-xs md:justify-between" style={{borderColor:'#263349',color:'#aabbd2'}}><span>© {new Date().getFullYear()} {name} — {t('جميع الحقوق محفوظة','Tous droits réservés')}</span><span className="flex items-center gap-1"><Globe size={14}/>{t('موريتانيا · أوقية جديدة','Mauritanie · MRU')}</span></div>
    </Container>
    <div className="fixed z-40 flex flex-col items-end gap-2" style={{insetInlineEnd:16,bottom:'calc(96px + env(safe-area-inset-bottom, 0px))'}}>
      {supportOpen && <section id="teo-support-menu" aria-label={t('خدمة الزبناء','Service client')} className="w-80 max-w-[calc(100vw-32px)] overflow-auto rounded-2xl border shadow-2xl" style={{maxHeight:'min(65dvh, 520px)',background:'#0f172a',borderColor:'#334155',color:'#f8fafc'}}>
        <div className="flex items-center justify-between gap-2 p-4" style={{background:'#1d4ed8',color:'#fff'}}><span className="flex items-center gap-2 font-bold"><Headphones size={21}/>{t('خدمة الزبناء','Service client')}</span><button type="button" onClick={()=>setSupportOpen(false)} aria-label={t('إغلاق','Fermer')} className="p-2"><X size={20}/></button></div>
        <div className="space-y-3 p-4"><p className="text-sm">{t('كيف يمكننا مساعدتك؟','Comment pouvons-nous vous aider ?')}</p>
          {chatReady && <Link to={chatPath} onClick={()=>setSupportOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold" style={{background:'#2563eb',color:'#fff'}}><MessageCircle size={20}/>{t('محادثاتي وبدء محادثة','Mes conversations / Nouveau message')}</Link>}
          <Link to="/profil" onClick={()=>setSupportOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm" style={{background:'#1e293b',color:'#fff'}}><PackageSearch size={20}/>{t('متابعة طلباتي','Suivre mes commandes')}</Link>
          {emailHref && <a href={emailHref} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm" style={{background:'#1e293b',color:'#fff'}}><Mail size={20}/>{t('راسلنا بالبريد الإلكتروني','Nous écrire par e-mail')}</a>}
          {!chatReady && <p className="text-xs leading-6" style={{color:'#aabbd2'}}>{t('المحادثة المباشرة غير متاحة حاليًا.','La messagerie directe n’est pas disponible actuellement.')}</p>}
          {str(ar ? footer.supportHoursAr : footer.supportHoursFr) && <p className="text-xs" style={{color:'#aabbd2'}}>{str(ar ? footer.supportHoursAr : footer.supportHoursFr)}</p>}
          {faq.map((q,i)=><details key={i} className="rounded-lg p-3" style={{background:'#1e293b'}}><summary className="cursor-pointer text-sm font-semibold">{q.question}</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{q.answer}</p></details>)}
        </div>
      </section>}
      {!supportOpen && showTop && <button type="button" aria-label={t('العودة إلى الأعلى','Retour en haut')} onClick={()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})} className="flex h-10 w-10 items-center justify-center rounded-full shadow-lg" style={{background:'#1e293b',color:'#fff'}}><ArrowUp size={19}/></button>}
      <button type="button" aria-expanded={supportOpen} aria-controls={supportOpen?'teo-support-menu':undefined} aria-label={t('خدمة الزبناء','Service client')} onClick={()=>setSupportOpen(v=>!v)} className="flex h-12 w-12 items-center justify-center rounded-full shadow-xl" style={{background:'#2563eb',color:'#fff'}}>{supportOpen?<X size={23}/>:<Headphones size={24}/>}</button>
    </div>
  </footer>
}

function PaymentLogo({name,url}:{name:string;url:string}) {
  const [failed,setFailed]=useState(false)
  return <span className="inline-flex h-8 items-center justify-center" title={name} style={{background:'transparent'}}>{url&&!failed?<img src={url} alt={name} loading="lazy" onError={()=>setFailed(true)} className="max-h-7 max-w-20 object-contain" style={{background:'transparent',border:0,boxShadow:'none'}}/>:<span className="text-xs font-semibold" style={{color:'#cbd5e1'}}>{name}</span>}</span>
}
