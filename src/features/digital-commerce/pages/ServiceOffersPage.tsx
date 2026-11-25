import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import ServiceLogo from '../components/ServiceLogo'
import { fetchPublicServiceBySlug, type PublicServiceCatalogItem } from '../data/supabaseServiceCatalog'
import {getLocalizedServiceName,getLocalizedGroupName,getLocalizedCategory,getLocalizedFulfillmentLabel} from '../data/serviceCatalogTranslations'

export default function ServiceOffersPage() {
  const {productSlug} = useParams()
  const {language,currencyLabel} = useLanguage()
  const ar=language==='ar'
  const tr=(fr:string,a:string)=>ar?a:fr
  const [service,setService]=useState<PublicServiceCatalogItem|null>(null)
  const [loading,setLoading]=useState(true)
  const [query,setQuery]=useState('')
  const [sort,setSort]=useState('default')
  const normalize=(v:string)=>v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f]/g,'').replace(/[أإآ]/g,'ا').trim()
  const minPrice=(g:PublicServiceCatalogItem['groups'][number])=>Math.min(...g.plans.filter(p=>p.availability==='available'&&p.price>0).map(p=>p.price))
  const visible=(service?.groups??[]).filter(g=>normalize([g.name,g.name_ar,g.name_fr,...g.plans.map(p=>p.label)].filter(Boolean).join(' ')).includes(normalize(query))).sort((a,b)=>sort==='asc'?minPrice(a)-minPrice(b):sort==='desc'?minPrice(b)-minPrice(a):0)
  useEffect(()=>{let alive=true;setLoading(true);setService(null);setQuery('');setSort('default');void fetchPublicServiceBySlug(productSlug??'').then(s=>{if(alive)setService(s)}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[productSlug])
  return <main dir={ar?'rtl':'ltr'} className="min-h-screen bg-slate-50 py-6 dark:bg-slate-950"><Container>
    <Link to="/services-numeriques" className="text-sm font-bold text-blue-600">{tr('← Tous les services','جميع الخدمات →')}</Link>
    {loading?<p className="py-12 text-slate-500">{tr('Chargement…','جارٍ التحميل…')}</p>:!service?<p className="py-12 text-slate-500">{tr('Service indisponible','الخدمة غير متوفرة')}</p>:<>
      <header className="my-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-600 p-2 text-2xl font-bold text-white">{service.image_url?<img src={service.image_url} className="h-full w-full object-contain" alt=""/>:<ServiceLogo serviceSlug={service.slug} fallback={service.name.slice(0,1)}/>}</div><div><p className="text-xs font-bold text-blue-600">{getLocalizedCategory(service.category,language)}</p><h1 className="text-2xl font-black text-slate-950 dark:text-white">{getLocalizedServiceName(service,language)}</h1><p className="text-sm text-slate-500">{tr('Choisissez votre produit','اختر المنتج المناسب')}</p></div></header>
      <div className="mb-4 flex flex-wrap gap-3"><input className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900" value={query} onChange={e=>setQuery(e.target.value)} placeholder={tr('Rechercher un produit…','ابحث عن منتج…')}/><select className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900" value={sort} onChange={e=>setSort(e.target.value)}><option value="default">{tr('Ordre par défaut','الترتيب الافتراضي')}</option><option value="asc">{tr('Prix croissant','السعر تصاعديًا')}</option><option value="desc">{tr('Prix décroissant','السعر تنازليًا')}</option></select></div>
      {visible.length===0?<p className="py-10 text-slate-500">{tr('Aucun produit disponible actuellement.','لا توجد منتجات حاليًا.')}</p>:<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{visible.map(group=>{const prices=group.plans.filter(p=>p.availability==='available'&&p.price>0).map(p=>p.price);const available=service.availability==='available'&&group.availability==='available'&&prices.length>0;return <Link key={group.id} to={`/services-numeriques/${encodeURIComponent(service.slug)}/offre/${encodeURIComponent(group.id)}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-blue-500 dark:border-slate-700 dark:bg-slate-900"><div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100 p-3 dark:bg-slate-800">{group.image_url?<img src={group.image_url} alt="" className="h-full w-full object-contain" loading="lazy"/>:<div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 p-2 text-xl font-black text-white"><ServiceLogo serviceSlug={service.slug} fallback={service.name.slice(0,1)}/></div>}</div><div className="space-y-2 p-3"><h2 className="break-words text-sm font-black text-slate-950 dark:text-white">{getLocalizedGroupName(group,language)}</h2><p className="text-xs text-slate-500">{getLocalizedFulfillmentLabel(group.fulfillment.type,language)}</p><p className={`text-xs font-bold ${available?'text-emerald-600':'text-slate-500'}`}>{available?tr('Disponible','متوفر'):group.availability==='coming_soon'?tr('Bientôt','قريبًا'):tr('Indisponible','غير متوفر')}</p>{available&&<p className="font-black text-blue-600">{prices.length>1?tr('Dès ','ابتداءً من '):''}{Math.min(...prices)} {currencyLabel}</p>}</div></Link>})}</div>}
    </>}
  </Container></main>
}
