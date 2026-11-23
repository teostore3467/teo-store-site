import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Headphones, MessageCircle, Mail, Phone, Home, ShoppingBag, UserCircle, PackageSearch, CreditCard, Globe } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { supabase } from '../../lib/supabase'
import Container from './Container'

const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}
const str = (v: unknown) => typeof v === 'string' ? v.trim() : ''
const phoneNumber = (v: unknown) => { const n = str(v).replace(/\D/g, ''); return /^\d{8}$/.test(n) ? `222${n}` : n }

export default function PublicFooter() {
  const { language } = useLanguage()
  const ar = language === 'ar'
  const t = (a: string, f: string) => ar ? a : f
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [payments, setPayments] = useState<string[]>([])
  const [logoFailed, setLogoFailed] = useState(false)
  useEffect(() => {
    let alive = true
    async function load() {
      const [s, p] = await Promise.all([
        supabase.from('app_settings').select('setting_key,setting_value').in('setting_key', ['store', 'support', 'support_whatsapp']),
        supabase.from('payment_methods').select('name').eq('is_active', true).order('sort_order', { ascending: true }),
      ])
      if (!alive) return
      if (!s.error) setSettings(Object.fromEntries((s.data ?? []).map(row => [row.setting_key, row.setting_value])))
      if (!p.error) setPayments((p.data ?? []).map(row => str(row.name)).filter(Boolean))
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
    <Container>
      <div className="grid gap-7 py-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
        <section>
          <Link to="/" className="inline-flex items-center gap-3" style={{color:'#fff'}}>
            {logo && !logoFailed ? <img src={logo} alt={name} onError={() => setLogoFailed(true)} className="h-12 max-w-36 rounded-lg object-contain" style={{background:'#fff',padding:4}} /> : <span className="flex h-11 w-11 items-center justify-center rounded-xl text-xl font-black" style={{background:'#2563eb',color:'#fff'}}>T</span>}
            <span className="text-lg font-black">{name}</span>
          </Link>
          <p className="mt-3 text-sm leading-7" style={{color:'#cbd5e1'}}>{str(ar ? store.sloganAr : store.sloganFr) || t('متجرك للخدمات والاشتراكات الرقمية.', 'Votre boutique de services et abonnements numériques.')}</p>
        </section>
        <section>
          <h2 className="mb-3 text-sm font-bold" style={{color:'#fff'}}>{t('روابط سريعة', 'Liens rapides')}</h2>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-1" aria-label={t('روابط المتجر','Liens de la boutique')}>
            {links.map(({icon: Icon,label,to}) => <Link key={label} to={to} className="flex min-h-10 items-center gap-2 rounded-lg text-sm hover:underline" style={{color:'#cbd5e1'}}><Icon size={17} style={{color:'#93c5fd'}} aria-hidden="true"/>{label}</Link>)}
          </nav>
        </section>
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{color:'#fff'}}><Headphones size={19} style={{color:'#93c5fd'}} aria-hidden="true"/>{t('خدمة الزبناء', 'Service client')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {contacts.map(({icon: Icon,label,href,external}) => <a key={label} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center text-xs font-semibold hover:underline" style={{background:'#ffffff0a',borderColor:'#ffffff26',color:'#e2e8f0'}}><Icon size={23} style={{color:label === 'WhatsApp' ? '#4ade80' : '#93c5fd'}} aria-hidden="true"/>{label}</a>)}
          </div>
          {!contacts.length && <p className="text-sm" style={{color:'#cbd5e1'}}>{t('وسائل التواصل غير متاحة حاليًا.', 'Les coordonnées ne sont pas disponibles actuellement.')}</p>}
        </section>
      </div>
      {payments.length > 0 && <section className="border-t py-4" style={{borderColor:'#ffffff26'}}><h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><CreditCard size={18} aria-hidden="true"/>{t('طرق الدفع', 'Moyens de paiement')}</h2><div className="flex flex-wrap gap-2">{payments.map((payment,index) => <span key={`${payment}-${index}`} className="rounded-lg border px-3 py-2 text-xs font-semibold" style={{borderColor:'#ffffff26',background:'#ffffff0a',color:'#e2e8f0'}}>{payment}</span>)}</div></section>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t py-4 text-xs" style={{borderColor:'#ffffff26',color:'#cbd5e1'}}><span>© {new Date().getFullYear()} {name} — {t('جميع الحقوق محفوظة','Tous droits réservés')}</span><span className="flex items-center gap-1"><Globe size={14} aria-hidden="true"/>{t('موريتانيا · أوقية جديدة','Mauritanie · MRU')}</span></div>
    </Container>
  </footer>
}
