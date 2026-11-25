import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Headphones, MessageCircle, Mail, PackageSearch, Globe, X, ChevronUp, ChevronDown, ArrowUp } from 'lucide-react'
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
  const { language, toggleLanguage } = useLanguage()
  const { pathname } = useLocation()
  const ar = language === 'ar'
  const t = (a: string, f: string) => ar ? a : f
  const [content,setContent]=useState<{pages:Record<string,unknown>[];faq:Record<string,unknown>[];sections:Record<string,unknown>[];links:Record<string,unknown>[];settings:Record<string,unknown>}>({pages:[],faq:[],sections:[],links:[],settings:{}})
  const [unread,setUnread]=useState(0)
  useEffect(()=>{let live=true;async function load(){const [p,f,s,l,c,n]=await Promise.all([supabase.from('teo_store_pages').select('slug,title_ar,title_fr').eq('active',true),supabase.from('teo_store_faq').select('*').eq('active',true).order('sort_order'),supabase.from('teo_footer_sections').select('*').eq('active',true).order('sort_order'),supabase.from('teo_footer_links').select('*').eq('active',true).order('sort_order'),supabase.from('teo_footer_settings').select('*'),supabase.from('teo_support_notifications').select('id',{count:'exact',head:true}).eq('is_read',false)]);if(live){setContent({pages:p.data||[],faq:f.data||[],sections:s.data||[],links:l.data||[],settings:Object.fromEntries((c.data||[]).map(x=>[x.key,x.value]))});setUnread(n.count||0)}}void load();const timer=window.setInterval(load,10000);return()=>{live=false;clearInterval(timer)}},[])
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
        supabase.from('payment_methods').select('name,image_path').eq('is_active', true).eq('show_in_footer', true).order('sort_order', { ascending: true }),
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
    {label:'Facebook', icon:Facebook, href:safeUrl(obj(content.settings.socials).facebook)||safeUrl(footer.facebook), color:'#1877f2'},
    {label:'TikTok', icon:TikTok, href:safeUrl(obj(content.settings.socials).tiktok)||safeUrl(footer.tiktok), color:'#111827'},
    {label:'Instagram', icon:Instagram, href:safeUrl(obj(content.settings.socials).instagram)||safeUrl(footer.instagram), color:'#c13584'},
  ].filter(item => item.href)
  const visiblePayments = payments.filter(p => hiddenPayments[p.name] !== true && p.logo)
  const name = str(store.storeName) || 'TEO STORE'
  const logo = safeUrl(obj(content.settings.general).logoUrl)||safeUrl(store.logoFooterUrl) || safeUrl(store.logoDarkUrl)
  useEffect(() => { setLogoFailed(false) }, [logo])
  const email = str(obj(content.settings.support).email)||str(support.email)
  const emailHref = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : ''
  
  const chatPath = "/assistance"
  const chatReady = obj(content.settings.support).chatEnabled === true
  const [showTop, setShowTop] = useState(false)
  useEffect(() => { const update = () => setShowTop(window.scrollY > 500); update(); window.addEventListener('scroll', update, { passive: true }); return () => window.removeEventListener('scroll', update) }, [])
  const general = obj(content.settings.general), supportConfig = obj(content.settings.support)
  const faq = content.faq.map(q=>({question:str(ar?q.question_ar:q.question_fr),answer:str(ar?q.answer_ar:q.answer_fr)}))
  const [expanded, setExpanded] = useState<string[]>([])
  const toggle = (key: string) => setExpanded(old => old.includes(key) ? old.filter(x => x !== key) : [...old, key])
  const seen = new Set<string>()
  const items = content.links.flatMap(l=>{
    const target=str(l.target),kind=str(l.link_type)
    if(!content.sections.some(s=>s.id===l.section_id))return []
    const to=kind==='page'&&content.pages.some(p=>p.slug===target)?'/information/'+target:kind==='action'&&target==='faq'&&faq.length?'/information/faq':kind==='external'?safeUrl(target):''
    if(!to||seen.has(to))return [];seen.add(to)
    return [{label:str(ar?l.label_ar:l.label_fr),to}]
  })
  const legal=items.filter(x=>['about','terms','privacy','warranty','refund'].some(k=>x.to==='/information/'+k))
  const useful=items.filter(x=>!legal.includes(x))
  const groups=[{key:'legal',title:t('معلومات وسياسات','Informations'),items:legal},{key:'useful',title:t('روابط مفيدة','Liens utiles'),items:useful}].filter(g=>g.items.length)
  const enabled = supportConfig.enabled === true
  const [now,setNow] = useState(Date.now())
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),30000);return()=>window.clearInterval(timer)},[])
  useEffect(()=>{setSupportOpen(false)},[pathname,enabled])
  const withinHours = (()=>{
    try {
      const parts = new Intl.DateTimeFormat('en-GB',{timeZone:str(supportConfig.timezone)||'Africa/Nouakchott',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now))
      const part=(key:string)=>parts.find(p=>p.type===key)?.value||''
      const day=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(part('weekday'))
      const days=Array.isArray(supportConfig.workingDays)?supportConfig.workingDays:[0,1,2,3,4,5,6]
      const start=str(supportConfig.openingTime),end=str(supportConfig.closingTime),time=part('hour')+':'+part('minute')
      if(!/^\d{2}:\d{2}$/.test(start)||!/^\d{2}:\d{2}$/.test(end))return days.includes(day)
      return start<=end ? days.includes(day)&&time>=start&&time<end : (days.includes(day)&&time>=start)||(days.includes((day+6)%7)&&time<end)
    }catch{return false}
  })()
  const online=enabled&&supportConfig.online===true&&withinHours
  const purchasePage=/^\/services-numeriques\/[^/]+/.test(pathname)||pathname.startsWith('/commande')
  const hideFloating=purchasePage||pathname.startsWith('/assistance')
  const [dark,setDark]=useState(()=>document.documentElement.dataset.teoTheme==='dark')
  useEffect(()=>{const sync=()=>setDark(document.documentElement.dataset.teoTheme==='dark');const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-teo-theme']});return()=>observer.disconnect()},[])
  return <footer dir={ar ? 'rtl' : 'ltr'} style={{background:'#0b1120',color:'#f8fafc'}}>
    <Container>
      <div className="grid gap-6 py-8 md:grid-cols-3">
        <section>
          <Link to="/" className="inline-flex items-center gap-3" style={{color:'#fff'}}>
            {logo && !logoFailed ? <img src={logo} alt="" onError={()=>setLogoFailed(true)} className="h-10 max-w-32 object-contain" style={{background:'transparent',border:0,boxShadow:'none'}}/> : <span className="text-3xl font-black">T</span>}
            <span className="text-lg font-black">{name}</span>
          </Link>
          <p className="mt-3 text-sm leading-7" style={{color:'#aabbd2'}}>{str(ar ? obj(content.settings.general).descriptionAr : obj(content.settings.general).descriptionFr) || str(ar ? store.sloganAr : store.sloganFr) || t('خدمات رقمية بسيطة وسريعة','Services numériques simples et rapides')}</p>
          <div className="mt-4 flex flex-wrap gap-3">{general.showSocials!==false && socials.map(({label,icon:Icon,href,color})=><a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="flex h-10 w-10 items-center justify-center rounded-full hover:opacity-80" style={{background:color,color:'#fff'}}><Icon size={19}/></a>)}</div>
        </section>
        {groups.map(({key,title,items})=><section key={key} className="border-t pt-3 md:border-0 md:pt-0" style={{borderColor:'#263349'}}>
          <button type="button" className="flex min-h-11 w-full items-center gap-2 text-sm font-bold md:hidden" aria-expanded={expanded.includes(key)} onClick={()=>toggle(key)}>{title}<span className="ms-auto">{expanded.includes(key)?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</span></button>
          <h2 className="mb-3 hidden text-sm font-bold md:block">{title}</h2>
          <nav className={`${expanded.includes(key)?'grid':'hidden'} gap-1 md:grid`}>{items.map(({label,to})=>to.startsWith('/')?<Link key={to} to={to} className="py-1.5 text-sm hover:underline" style={{color:'#cbd5e1'}}>{label}</Link>:<a key={to} href={to} target="_blank" rel="noopener noreferrer" className="py-1.5 text-sm" style={{color:'#cbd5e1'}}>{label}</a>)}</nav>
        </section>)}
        {enabled && hideFloating && <Link to="/assistance" className="flex items-center gap-2 text-sm font-bold"><Headphones size={18}/>{t('مركز المساعدة','Centre d’aide')}</Link>}
      </div>
      {general.showPayments!==false && visiblePayments.length>0 && <section className="border-t py-5" style={{borderColor:'#263349'}}><h2 className="mb-4 text-center text-xs font-semibold" style={{color:'#aabbd2'}}>{t('طرق الدفع المتاحة','Moyens de paiement')}</h2><div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">{visiblePayments.map(payment=><PaymentLogo key={`${payment.name}:${payment.logo}`} name={payment.name} url={safeUrl(payment.logo)}/>)}</div></section>}
      <div className="flex flex-wrap items-center justify-center gap-3 border-t py-4 text-xs md:justify-between" style={{borderColor:'#263349',color:'#aabbd2'}}><span>©️ {new Date().getFullYear()} {name} — {t('جميع الحقوق محفوظة','Tous droits réservés')}</span>{general.showLanguage!==false&&<button onClick={toggleLanguage}>{ar?"Français":"العربية"}</button>}<span className="flex items-center gap-1"><Globe size={14}/>{t('موريتانيا · أوقية جديدة','Mauritanie · MRU')}</span></div>
    </Container>
    <div className={`fixed z-40 flex flex-col items-end gap-2 ${hideFloating ? 'hidden' : ''}`} style={{insetInlineEnd:12,bottom:'calc(16px + env(safe-area-inset-bottom, 0px))'}}>
      {enabled && supportOpen && <section id="teo-support-menu" aria-label={t('خدمة الزبناء','Service client')} className="w-80 max-w-[calc(100vw-32px)] overflow-auto rounded-2xl border shadow-2xl" style={{maxHeight:'min(65dvh, 520px)',background:dark?'#0f172a':'#ffffff',borderColor:dark?'#334155':'#e2e8f0',color:dark?'#f8fafc':'#0f172a'}}>
        <div className="flex items-center justify-between gap-2 p-4" style={{background:'#1d4ed8',color:'#fff'}}><span className="flex items-center gap-2 font-bold"><Headphones size={21}/>{t('خدمة الزبناء','Service client')}</span><button type="button" onClick={()=>setSupportOpen(false)} aria-label={t('إغلاق','Fermer')} className="p-2"><X size={20}/></button></div>
        <div className="space-y-3 p-4"><p className="text-sm">{str(ar?supportConfig.welcomeAr:supportConfig.welcomeFr)||t('كيف يمكننا مساعدتك؟','Comment pouvons-nous vous aider ?')}</p>
          <p className="text-xs">{online?t("الدعم متصل","Support en ligne"):t("الدعم غير متصل — يمكنك ترك رسالة","Support hors ligne — laissez un message")} · {str(supportConfig.openingTime)}–{str(supportConfig.closingTime)}</p>{chatReady && <Link to={chatPath} onClick={()=>setSupportOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold" style={{background:'#2563eb',color:'#fff'}}><MessageCircle size={20}/>{t('محادثاتي وبدء محادثة','Mes conversations / Nouveau message')}</Link>}
          {chatReady && <><Link to="/assistance?category=warranty" onClick={()=>setSupportOpen(false)} className="block rounded-xl p-3 text-sm" style={{background:dark?"#1e293b":"#f1f5f9"}}>{t("طلب الضمان","Demande de garantie")}</Link><Link to="/assistance?category=order" onClick={()=>setSupportOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm" style={{background:dark?'#1e293b':'#f1f5f9',color:dark?'#fff':'#0f172a'}}><PackageSearch size={20}/>{t('متابعة طلباتي','Suivre mes commandes')}</Link></>}
          {supportConfig.emailEnabled===true && emailHref && <a href={emailHref} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm" style={{background:dark?'#1e293b':'#f1f5f9',color:dark?'#fff':'#0f172a'}}><Mail size={20}/>{t('راسلنا بالبريد الإلكتروني','Nous écrire par e-mail')}</a>}
          {!chatReady && <p className="text-xs leading-6" style={{color:'#aabbd2'}}>{t('المحادثة المباشرة غير متاحة حاليًا.','La messagerie directe n’est pas disponible actuellement.')}</p>}
          {str(ar ? footer.supportHoursAr : footer.supportHoursFr) && <p className="text-xs" style={{color:'#aabbd2'}}>{str(ar ? footer.supportHoursAr : footer.supportHoursFr)}</p>}
          {faq.map((q,i)=><details key={i} className="rounded-lg p-3" style={{background:dark?'#1e293b':'#f1f5f9'}}><summary className="cursor-pointer text-sm font-semibold">{q.question}</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{q.answer}</p></details>)}
        </div>
      </section>}
      {general.showBackToTop!==false && !supportOpen && showTop && <button type="button" aria-label={t('العودة إلى الأعلى','Retour en haut')} onClick={()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})} className="flex h-10 w-10 items-center justify-center rounded-full shadow-lg" style={{background:dark?'#1e293b':'#f1f5f9',color:dark?'#fff':'#0f172a'}}><ArrowUp size={19}/></button>}
      {enabled && <button type="button" aria-expanded={supportOpen} aria-controls={supportOpen?'teo-support-menu':undefined} aria-label={t('خدمة الزبناء','Service client')} onClick={()=>setSupportOpen(v=>!v)} className="relative flex h-11 w-11 items-center justify-center rounded-full shadow-xl sm:h-12 sm:w-12" style={{background:'#2563eb',color:'#fff'}}>{supportOpen?<X size={23}/>:<Headphones size={24}/>} {unread>0&&<span className="absolute -top-2 -end-2 rounded-full bg-red-600 px-2 text-xs">{unread>99?'99+':unread}</span>}</button>}
    </div>
  </footer>
}

function PaymentLogo({name,url}:{name:string;url:string}) {
  const [failed,setFailed]=useState(false)
  return <span className="inline-flex h-8 items-center justify-center" title={name} style={{background:'transparent'}}>{url&&!failed?<img src={url} alt={name} loading="lazy" onError={()=>setFailed(true)} className="max-h-7 max-w-20 object-contain" style={{background:'transparent',border:0,boxShadow:'none'}}/>:<span className="text-xs font-semibold" style={{color:'#cbd5e1'}}>{name}</span>}</span>
}
