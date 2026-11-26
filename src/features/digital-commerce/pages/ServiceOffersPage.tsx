import { useFlashOffers } from '../utils/useFlashOffers'
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
  const [failed,setFailed]=useState(false)
  const [query,setQuery]=useState('')
  const [sort,setSort]=useState('default')
  const normalize=(v:string)=>v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f]/g,'').replace(/[أإآ]/g,'ا').trim()
  const {offers:flashOffers}=useFlashOffers(service?.groups.flatMap(g=>g.plans.map(p=>p.databaseId))??[])
  const effective=(p:PublicServiceCatalogItem['groups'][number]['plans'][number])=> p.databaseId && flashOffers[p.databaseId]?.original_price===p.price ? flashOffers[p.databaseId].flash_price : p.price
  const minPrice=(g:PublicServiceCatalogItem['groups'][number])=>Math.min(...g.plans.filter(p=>p.availability==='available'&&p.price>0).map(effective))
  const visible=(service?.groups??[]).filter(g=>normalize([g.name,g.name_ar,g.name_fr,...g.plans.flatMap(p=>[p.label,p.label_ar,p.label_fr])].filter(Boolean).join(' ')).includes(normalize(query))).sort((a,b)=>sort==='asc'?(minPrice(a)===minPrice(b)?0:minPrice(a)-minPrice(b)):sort==='desc'?(minPrice(a)===minPrice(b)?0:minPrice(b)-minPrice(a)):0)
  useEffect(()=>{let alive=true;setLoading(true);setFailed(false);setService(null);setQuery('');setSort('default');void fetchPublicServiceBySlug(productSlug??'').then(s=>{if(alive)setService(s)}).catch(()=>{if(alive)setFailed(true)}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[productSlug])
  return <main dir={ar?'rtl':'ltr'} className="teo-offers-page"><Container>
    <Link to="/services-numeriques" className="text-sm font-bold text-blue-600">{tr('← Tous les services','جميع الخدمات →')}</Link>
    {loading?<p className="py-12 text-slate-500">{tr('Chargement…','جارٍ التحميل…')}</p>:!service?<p className="py-12 text-slate-500">{failed?tr('Impossible de charger le service. Actualisez la page.','تعذر تحميل الخدمة. حدّث الصفحة.'):tr('Service indisponible','الخدمة غير متوفرة')}</p>:<>
      <header className="teo-offers-heading my-5 flex items-center gap-4 p-5"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-600 p-2 text-2xl font-bold text-white">{service.image_url?<img src={service.image_url} className="h-full w-full object-contain" alt=""/>:<ServiceLogo serviceSlug={service.slug} fallback={service.name.slice(0,1)}/>}</div><div><p className="text-xs font-bold text-blue-600">{getLocalizedCategory(service.category,language)}</p><h1 className="text-2xl font-black text-slate-950 dark:text-white">{getLocalizedServiceName(service,language)}</h1><p className="text-sm text-slate-500">{tr('Choisissez votre produit','اختر المنتج المناسب')}</p></div></header>
      <p className="teo-offers-count">{visible.length} {ar?'منتج':visible.length===1?'produit':'produits'}</p>
      <div className="teo-offers-toolbar mb-5 flex flex-wrap gap-3"><input className="teo-offers-field min-w-0 flex-1" type="search" aria-label={tr('Rechercher un produit','البحث عن منتج')} value={query} onChange={e=>setQuery(e.target.value)} placeholder={tr('Rechercher un produit…','ابحث عن منتج…')}/><select className="teo-offers-field" aria-label={tr('Trier les produits','ترتيب المنتجات')} value={sort} onChange={e=>setSort(e.target.value)}><option value="default">{tr('Ordre par défaut','الترتيب الافتراضي')}</option><option value="asc">{tr('Prix croissant','السعر تصاعديًا')}</option><option value="desc">{tr('Prix décroissant','السعر تنازليًا')}</option></select></div>
      {visible.length===0?<p className="py-10 text-slate-500">{tr('Aucun produit disponible actuellement.','لا توجد منتجات حاليًا.')}</p>:<div className="teo-offers-grid">{visible.map(group=>{const prices=group.plans.filter(p=>p.availability==='available'&&p.price>0).map(effective);const available=service.availability==='available'&&group.availability==='available'&&prices.length>0;return <Link key={group.id} to={`/services-numeriques/${encodeURIComponent(service.slug)}/offre/${encodeURIComponent(group.id)}`} className="teo-store-card teo-offer-card group"><div className="teo-store-media teo-offer-media flex items-center justify-center overflow-hidden p-3">{group.image_url?<img src={group.image_url} alt="" className="h-full w-full object-contain" loading="lazy"/>:<div className="teo-offer-fallback flex h-24 w-24 items-center justify-center rounded-xl p-3 text-3xl font-black"><ServiceLogo serviceSlug={service.slug} fallback={service.name.slice(0,1)}/></div>}</div><div className="flex flex-1 flex-col gap-2 p-3 sm:p-4"><h2 className="teo-offer-name break-words font-black">{getLocalizedGroupName(group,language)}</h2><p className="teo-offer-muted text-xs">{getLocalizedFulfillmentLabel(group.fulfillment.type,language)}</p><p className={`text-xs font-bold ${available?'text-emerald-600':'text-slate-500'}`}>{available?tr('Disponible','متوفر'):group.availability==='coming_soon'?tr('Bientôt','قريبًا'):tr('Indisponible','غير متوفر')}</p>{available&&group.plans.some(p=>p.databaseId&&flashOffers[p.databaseId])&&<span className="text-xs font-bold text-amber-700 dark:text-amber-300">{tr('Vente flash','عرض مؤقت')}</span>}{available&&<p className="teo-offer-price font-black">{prices.length>1?tr('Dès ','ابتداءً من '):''}{Math.min(...prices)} {currencyLabel}</p>}<span className="teo-card-action mt-auto flex items-center justify-between pt-3 text-sm font-bold">{tr('Voir le produit','عرض المنتج')}<span aria-hidden="true">{ar?'←':'→'}</span></span></div></Link>})}</div>}
    </>}
  </Container></main>
}
