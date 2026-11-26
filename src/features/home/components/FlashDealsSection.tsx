import { Link, useSearchParams } from 'react-router-dom'
import { Zap, ArrowRight, ArrowLeft } from 'lucide-react'
import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { useLiveCatalog } from '../../digital-commerce/utils/useLiveCatalog'
import { useFlashOffers } from '../../digital-commerce/utils/useFlashOffers'
import ServiceLogo from '../../digital-commerce/components/ServiceLogo'
import { getLocalizedServiceName, getLocalizedGroupName, getLocalizedPlanLabel } from '../../digital-commerce/data/serviceCatalogTranslations'

export default function FlashDealsSection() {
  const {language,currencyLabel}=useLanguage()
  const ar=language==='ar'
  const [params]=useSearchParams()
  const preview=params.get('flash-preview')==='1'
  const Arrow=ar?ArrowLeft:ArrowRight
  const {catalog}=useLiveCatalog()
  const eligible=catalog.filter(s=>s.availability==='available').flatMap(service=>service.groups.filter(g=>g.availability==='available').flatMap(group=>group.plans.filter(p=>p.availability==='available').map(plan=>({service,group,plan}))))
  const {offers,now}=useFlashOffers(eligible.map(x=>x.plan.databaseId),preview)
  const deals=eligible.flatMap(x=>{const offer=x.plan.databaseId?offers[x.plan.databaseId]:undefined;return offer && offer.original_price===x.plan.price?[{...x,offer}]:[]})
  if(!deals.length)return null
  return <Container className="py-4"><section dir={ar?'rtl':'ltr'} className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#101b45] via-[#182d63] to-[#1644a0] p-4 text-white shadow-sm sm:p-6">
    <div className="mb-5 flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-slate-950"><Zap size={24} fill="currentColor"/></div><div><h2 className="text-xl font-black sm:text-2xl">{(ar?deals[0].offer.title_ar:deals[0].offer.title_fr)||'TEO FLASH DAYS'}</h2><p className="mt-1 text-sm text-blue-100">{ar?'عروض حصرية لفترة محدودة':'Des offres exclusives à durée limitée'}</p></div></div>
    <>{preview&&<p className="mb-4 rounded-lg bg-amber-100 p-3 text-sm font-bold text-amber-950">{ar?'معاينة المسؤول فقط — لا يمكن الشراء بالسعر التجريبي':'Aperçu administrateur — achat au prix simulé indisponible'}</p>}</><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{deals.map(({service,group,plan,offer})=>{
      const seconds=Math.max(0,Math.floor((Date.parse(offer.ends_at)-now)/1000))
      const countdown=[Math.floor(seconds/86400),Math.floor(seconds%86400/3600),Math.floor(seconds%3600/60),seconds%60]
      const labels=ar?['يوم','ساعة','دقيقة','ثانية']:['Jours','Heures','Min','Sec']
      return <Link key={offer.plan_id} onClick={preview?e=>e.preventDefault():undefined} aria-disabled={preview||undefined} tabIndex={preview?-1:undefined} to={`/services-numeriques/${encodeURIComponent(service.slug)}/offre/${encodeURIComponent(group.id)}?plan=${encodeURIComponent(offer.plan_id)}`} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white p-4 text-slate-900 transition hover:shadow-lg focus-visible:outline-2 focus-visible:outline-amber-400 dark:bg-slate-900 dark:text-white">
        <div className="flex items-start gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-2 dark:bg-slate-800">{group.image_url?<img src={group.image_url} alt="" className="h-full w-full object-contain"/>:<ServiceLogo serviceSlug={service.slug} fallback={service.name.slice(0,1)}/>}</div><div className="min-w-0 flex-1"><h3 className="font-black [overflow-wrap:anywhere]">{getLocalizedServiceName(service,language)}</h3><p className="text-xs text-slate-500 dark:text-slate-300">{getLocalizedGroupName(group,language)} · {getLocalizedPlanLabel(plan,language)}</p></div>{offer.show_discount_badge&&<span className="shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-xs font-black text-amber-900" dir="ltr">−{offer.discount_percent}%</span>}</div>
        <div className="flex flex-wrap items-baseline gap-2"><strong className="text-2xl font-black text-blue-700 dark:text-blue-300">{offer.flash_price} <span className="text-sm">{currencyLabel}</span></strong><span className="text-sm text-slate-500 line-through dark:text-slate-400">{offer.original_price} {currencyLabel}</span></div>
        <div className="grid grid-cols-4 gap-1.5" dir="ltr">{countdown.map((n,i)=><div key={i} className="rounded-lg bg-slate-100 p-2 text-center dark:bg-slate-800"><div className="text-lg font-black tabular-nums">{String(n).padStart(2,'0')}</div><div className="text-[10px] text-slate-500 dark:text-slate-300">{labels[i]}</div></div>)}</div>
        {offer.quantity_remaining!==null&&<p className="text-xs font-bold text-slate-600 dark:text-slate-300">{ar?'الكمية المتبقية':'Offres restantes'} : {offer.quantity_remaining}</p>}
        <span className="mt-auto flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white">{preview?(ar?'معاينة فقط — الشراء معطل':'Aperçu uniquement — achat désactivé'):(ar?'استفد من العرض':"Profiter de l’offre")}{!preview&&<Arrow size={16}/>}</span>
      </Link>
    })}</div>
  </section></Container>
}
