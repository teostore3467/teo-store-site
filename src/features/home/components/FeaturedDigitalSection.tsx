import { Link } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { useLiveCatalog } from '../../digital-commerce/utils/useLiveCatalog'
import ServiceLogo from '../../digital-commerce/components/ServiceLogo'
import { getLocalizedServiceName } from '../../digital-commerce/data/serviceCatalogTranslations'

export default function FeaturedDigitalSection() {
  const {language,currencyLabel}=useLanguage()
  const ar=language==='ar'
  const {catalog,loading}=useLiveCatalog()
  const services=catalog.map(service=>({service,plans:service.groups.filter(g=>g.availability==='available').flatMap(g=>g.plans.filter(p=>p.availability==='available'&&p.price>0))})).filter(x=>x.service.availability==='available'&&x.plans.length>0).sort((a,b)=>Number(b.plans.some(p=>p.popular))-Number(a.plans.some(p=>p.popular))).slice(0,8)
  return <section className="py-8 sm:py-12" dir={ar?'rtl':'ltr'}><Container>
    <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-black text-slate-950 dark:text-white sm:text-3xl">{ar?'خدماتنا الشائعة':'Nos services populaires'}</h2><Link className="shrink-0 text-sm font-bold text-blue-600" to="/services-numeriques">{ar?'عرض الكل':'Voir tout'}</Link></div>
    {loading?<p className="py-6 text-sm text-slate-500">{ar?'جارٍ التحميل…':'Chargement…'}</p>:services.length===0?<p className="py-6 text-sm text-slate-500">{ar?'لا توجد خدمات متاحة حاليًا.':'Aucun service disponible actuellement.'}</p>:<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{services.map(({service,plans})=><Link key={service.slug} to={`/services-numeriques/${encodeURIComponent(service.slug)}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-500 dark:border-slate-700 dark:bg-slate-900"><div className="flex aspect-[16/10] items-center justify-center bg-slate-100 p-5 dark:bg-slate-800"><div className="h-full w-full max-w-32">{service.image_url?<img src={service.image_url} alt="" className="h-full w-full object-contain" loading="lazy"/>:<ServiceLogo serviceSlug={service.slug} fallback={service.name.slice(0,2)}/>}</div></div><div className="space-y-2 p-3"><h3 className="break-words font-bold text-slate-950 dark:text-white">{getLocalizedServiceName(service,language)}</h3><p className="text-sm font-bold text-blue-600">{ar?'ابتداءً من ':'Dès '}{Math.min(...plans.map(p=>p.price))} {currencyLabel}</p><p className="text-xs text-slate-500">{ar?'عرض المنتجات':'Voir les produits'}</p></div></Link>)}</div>}
  </Container></section>
}
