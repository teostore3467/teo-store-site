import { DigitalPlanCard, flattenDigitalPlans } from '../components/TeoPlanCover'
import { useFlashOffers } from '../utils/useFlashOffers'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import ServiceLogo from '../components/ServiceLogo'
import { fetchPublicServiceBySlug, type PublicServiceCatalogItem } from '../data/supabaseServiceCatalog'
import {getLocalizedServiceName,getLocalizedCategory,getLocalizedGroupName,getLocalizedPlanLabel} from '../data/serviceCatalogTranslations'

export default function ServiceOffersPage() {
  const {productSlug} = useParams()
  const {language} = useLanguage()
  const ar=language==='ar'
  const tr=(fr:string,a:string)=>ar?a:fr
  const [service,setService]=useState<PublicServiceCatalogItem|null>(null)
  const [loading,setLoading]=useState(true)
  const [failed,setFailed]=useState(false)
  const [query,setQuery]=useState('')
  const [sort,setSort]=useState('default')
  const normalize=(v:string)=>v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f]/g,'').replace(/[أإآ]/g,'ا').trim()
  const {offers:flashOffers}=useFlashOffers(service?.groups.flatMap(g=>g.plans.map(p=>p.databaseId))??[])
  const effective=(p:PublicServiceCatalogItem['groups'][number]['plans'][number])=> p.databaseId && flashOffers[p.databaseId]?.original_price===p.price ? flashOffers[p.databaseId].flash_price : p.price
  const visible=flattenDigitalPlans(service?[service]:[]).filter(({service,group,plan})=>normalize([service.name,service.name_ar,service.name_fr,group.name,group.name_ar,group.name_fr,plan.label,plan.label_ar,plan.label_fr,getLocalizedGroupName(group,language),getLocalizedPlanLabel(plan,language)].filter(Boolean).join(' ')).includes(normalize(query))).sort((a,b)=>sort==='asc'?effective(a.plan)-effective(b.plan):sort==='desc'?effective(b.plan)-effective(a.plan):0)
  useEffect(()=>{let alive=true;setLoading(true);setFailed(false);setService(null);setQuery('');setSort('default');void fetchPublicServiceBySlug(productSlug??'').then(s=>{if(alive)setService(s)}).catch(()=>{if(alive)setFailed(true)}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[productSlug])
  return <main dir={ar?'rtl':'ltr'} className="teo-offers-page"><Container>
    <Link to="/services-numeriques" className="text-sm font-bold text-blue-600">{tr('← Tous les services','جميع الخدمات →')}</Link>
    {loading?<p className="py-12 text-slate-500">{tr('Chargement…','جارٍ التحميل…')}</p>:!service?<p className="py-12 text-slate-500">{failed?tr('Impossible de charger le service. Actualisez la page.','تعذر تحميل الخدمة. حدّث الصفحة.'):tr('Service indisponible','الخدمة غير متوفرة')}</p>:<>
      <header className="teo-offers-heading my-5 flex items-center gap-4 p-5"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#192638] text-2xl font-bold text-white"><ServiceLogo serviceSlug={service.slug} fallbackUrl={service.image_url} fallback={service.name.slice(0,1)}/></div><div><p className="text-xs font-bold text-blue-600">{getLocalizedCategory(service.category,language)}</p><h1 className="text-2xl font-black text-slate-950 dark:text-white">{getLocalizedServiceName(service,language)}</h1><p className="text-sm text-slate-500">{tr('Choisissez votre produit','اختر المنتج المناسب')}</p></div></header>
      <p className="teo-offers-count">{visible.length} {ar?'منتج':visible.length===1?'produit':'produits'}</p>
      <div className="teo-offers-toolbar mb-5 flex flex-wrap gap-3"><input className="teo-offers-field min-w-0 flex-1" type="search" aria-label={tr('Rechercher un produit','البحث عن منتج')} value={query} onChange={e=>setQuery(e.target.value)} placeholder={tr('Rechercher un produit…','ابحث عن منتج…')}/><select className="teo-offers-field" aria-label={tr('Trier les produits','ترتيب المنتجات')} value={sort} onChange={e=>setSort(e.target.value)}><option value="default">{tr('Ordre par défaut','الترتيب الافتراضي')}</option><option value="asc">{tr('Prix croissant','السعر تصاعديًا')}</option><option value="desc">{tr('Prix décroissant','السعر تنازليًا')}</option></select></div>
      {visible.length===0?<p className="py-10 text-slate-500">{tr('Aucun produit disponible actuellement.','لا توجد منتجات حاليًا.')}</p>:<div className="teo-offers-grid">{visible.map(item=><DigitalPlanCard key={item.plan.databaseId??`${item.group.id}:${item.plan.id}`} item={item} price={effective(item.plan)} oldPrice={effective(item.plan)<item.plan.price?item.plan.price:item.plan.old_price}/>)}</div>}
    </>}
  </Container></main>
}
