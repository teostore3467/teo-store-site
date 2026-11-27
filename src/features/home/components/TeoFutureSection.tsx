import { useEffect, type CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'
import { ShoppingBag, BriefcaseBusiness, Clock3, Shirt, House, Store, Users, Package, Building2 } from 'lucide-react'
import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'

export default function TeoFutureSection() {
  const { language } = useLanguage()
  const { hash } = useLocation()
  const ar = language === 'ar'
  useEffect(() => {
    if (hash !== '#teo-future') return
    const frame = requestAnimationFrame(() => document.getElementById('teo-future')?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [hash])
  const items = [
    { name: 'TEO MARKET', Icon: ShoppingBag, color: '#087f56', dark: '#102b24', light: '#ecf8f2', subtitle: ar?'تسوق بلا حدود.':'Votre shopping, sans limites.', description: ar?'تجربة تسوق جديدة تجمع منتجات TEO STORE ومنتجات المتاجر الشريكة: الملابس والإكسسوارات والجمال والمنتجات المنزلية، في مكان واحد.':'Une nouvelle expérience shopping réunissant les produits TEO STORE et ceux des boutiques partenaires : mode, accessoires, beauté et maison, dans un seul espace.', categories: [{Icon:Shirt,label:ar?'الأزياء':'Mode'},{Icon:House,label:ar?'المنزل':'Maison'},{Icon:Store,label:ar?'المتاجر':'Boutiques'}] },
    { name: 'TEO BUSINESS', Icon: BriefcaseBusiness, color: '#2563eb', dark: '#152746', light: '#edf3ff', subtitle: ar?'طموحك، وتقنياتنا.':'Votre ambition, notre technologie.', description: ar?'فضاء احترافي لبائعي الخدمات الرقمية وأصحاب المشاريع والشركات. نخطط لتوفير أسعار الجملة والاشتراكات المهنية وأدوات تساعدك على تطوير نشاطك التجاري.':'Un espace professionnel dédié aux revendeurs de services numériques, entrepreneurs et entreprises. À terme, des tarifs de gros, des abonnements professionnels et des outils pour développer votre activité.', categories:[{Icon:Users,label:ar?'البائعون':'Revendeurs'},{Icon:Package,label:ar?'الجملة':'Vente en gros'},{Icon:Building2,label:ar?'الشركات':'Entreprises'}] },
  ]
  return <section id="teo-future" aria-labelledby="teo-future-title" dir={ar?'rtl':'ltr'} className="scroll-mt-40 py-6 sm:py-9">
    <Container>
      <div className="mb-4 text-center"><p className="text-xs font-black tracking-wider text-blue-600">TEO ECOSYSTEM</p><h2 id="teo-future-title" className="mt-1 text-xl font-black sm:text-2xl">{ar?'آفاق جديدة':'De nouveaux horizons'}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{ar?'متجر TEO STORE ينمو معكم.':'TEO STORE grandit avec vous.'}</p></div>
      <div className="grid gap-3 sm:grid-cols-2">{items.map(({name,Icon,color,light,dark,subtitle,description,categories}) => <article key={name} className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-[var(--future-light)] p-4 dark:border-slate-700 dark:bg-[var(--future-dark)] sm:p-5" style={{'--future-light':light,'--future-dark':dark} as CSSProperties}>
        <div className="flex items-center justify-between gap-2"><div className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{backgroundColor:color}}><Icon size={25} aria-hidden="true"/></div><span className="inline-flex items-center gap-1 rounded-full border border-current px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200"><Clock3 size={13} aria-hidden="true"/>{ar?'قريبًا':'Bientôt'}</span></div>
        <div><h3 className="text-xl font-black text-slate-950 dark:text-white">{name}</h3><p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{subtitle}</p></div><p className="flex-1 text-sm leading-6 text-slate-700 dark:text-slate-200">{description}</p>
        <div className="flex flex-wrap gap-2">{categories.map(({Icon:CatIcon,label}) => <span key={label} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-600"><CatIcon size={14} aria-hidden="true"/>{label}</span>)}</div>
        <p className="border-t border-slate-300 pt-2 text-center text-xs font-bold dark:border-slate-600">{ar?'متاح قريبًا — لا يمكن الشراء أو الاشتراك الآن':'Bientôt disponible — achats et inscriptions non ouverts'}</p>
      </article>)}</div>
      <p className="mt-4 text-center text-xs font-bold text-slate-500 dark:text-slate-300">{ar?'عائلة واحدة. عالم من الإمكانيات.':'Une seule famille. Un monde de possibilités.'}</p>
    </Container>
  </section>
}
