import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'
import { useEsimCatalog } from '../data/useEsimCatalog'
import EsimGuide, { useEsimPublicSettings } from '../components/EsimGuide'
import EsimFlag from '../components/EsimFlag'

export default function EsimCountryPage() {
 const {countrySlug}=useParams(); const navigate=useNavigate(); const {language,formatCurrencyText}=useLanguage(); const ar=language==='ar'; const t=(a:string,f:string)=>ar?a:f
 const {countries,loading,error}=useEsimCatalog(); const settings=useEsimPublicSettings()
 const [kind,setKind]=useState<'limited'|'unlimited'>('limited'); const [tier,setTier]=useState(''); const [chosen,setChosen]=useState('')
 const country=countries.find(c=>c.slug===countrySlug && c.active)
 const panel='rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900'
 if(loading||error||!country) return <main className="min-h-screen bg-slate-50 dark:bg-slate-950"><Container className="py-16"><div className={panel}>{loading?t('جاري التحميل…','Chargement…'):error?t('تعذر تحميل الباقات. أعد المحاولة.','Impossible de charger les forfaits. Réessayez.'):t('الوجهة غير متاحة','Destination indisponible')} <button className="block mt-4 text-blue-600" onClick={()=>navigate('/')}>{t('العودة','Retour')}</button></div></Container></main>
 const image=country.image_path?supabase.storage.from('esim-country-images').getPublicUrl(country.image_path).data.publicUrl:null
 const limited=country.plans.filter(p=>p.type==='limited'); const unlimited=country.plans.filter(p=>p.type==='unlimited')
 const effective=kind==='limited'&&!limited.length?'unlimited':kind==='unlimited'&&!unlimited.length?'limited':kind
 const list=effective==='limited'?limited:unlimited; const tiers=[...new Set(unlimited.map(p=>p.tier).filter(Boolean))]; const selectedTier=effective==='unlimited'&&tiers.includes(tier)?tier:''
 const visible=list.filter(p=>!selectedTier||p.tier===selectedTier); const plan=visible.find(p=>p.id===chosen)??visible[0]
 const enabled=settings?.catalog_enabled===true&&settings?.checkout_enabled===true
 const price=(v:string)=>formatCurrencyText(`${v} MRU`)
 return <main dir={ar?'rtl':'ltr'} className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"><Container className="py-6 sm:py-10">
 <button onClick={()=>navigate('/')} className="mb-5 text-sm font-semibold text-blue-600 dark:text-blue-300">{t('← العودة إلى المتجر','← Retour à la boutique')}</button>
 <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
 <section className={panel+' !p-0 overflow-hidden'}>{image?<img src={image} alt={country.name[language]} className="aspect-[4/3] w-full object-cover"/>:<div className="aspect-[4/3] grid place-items-center bg-slate-200 dark:bg-slate-800"><EsimFlag flag={country.flag} code={country.code} path={country.flag_image_path}/></div>}<div className="p-5"><div className="flex items-center gap-3"><EsimFlag flag={country.flag} code={country.code} path={country.flag_image_path}/><h1 className="text-2xl font-black">{country.name[language]} eSIM</h1></div><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{country.description[language]}</p></div></section>
 <section className={panel}><h2 className="text-xl font-black">{t('اختر باقتك','Choisissez votre forfait')}</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{enabled&&country.plans.length?t('باقات متاحة','Forfaits disponibles'):t('الشراء غير متاح حاليًا','Achat momentanément indisponible')}</p>
 <div className="mt-5 grid grid-cols-2 gap-2">{(['limited','unlimited'] as const).map(k=><button key={k} disabled={k==='limited'?!limited.length:!unlimited.length} onClick={()=>{setKind(k);setTier('');setChosen('')}} className={`rounded-xl p-3 text-sm font-bold disabled:opacity-40 ${effective===k?'bg-blue-600 text-white':'border border-slate-300 dark:border-slate-600'}`}>{k==='limited'?t('باقات محدودة','Forfaits limités'):t('باقات غير محدودة','Forfaits illimités')}</button>)}</div>
 {effective==='unlimited'&&tiers.length>0&&<div className="mt-4 flex flex-wrap gap-2">{['',...tiers].map(k=><button key={k} onClick={()=>{setTier(k);setChosen('')}} className={`rounded-full px-4 py-2 text-sm ${selectedTier===k?'bg-blue-600 text-white':'border border-slate-300 dark:border-slate-600'}`}>{k||t('الكل','Tous')}</button>)}</div>}
 {!visible.length?<p className="py-10 text-center text-slate-500">{t('لا توجد باقات منشورة حاليًا.','Aucun forfait publié pour le moment.')}</p>:<div className="mt-5 grid gap-3 sm:grid-cols-2">{visible.map(p=><button key={p.id} onClick={()=>setChosen(p.id)} aria-pressed={plan?.id===p.id} className={`rounded-xl border p-4 text-start ${plan?.id===p.id?'border-blue-600 ring-1 ring-blue-600':'border-slate-200 dark:border-slate-700'}`}><span className="block text-lg font-black">{p.data[language]}</span><span className="block text-sm text-slate-500 dark:text-slate-300">{p.duration[language]} · {p.speed?.[language]}</span>{p.tier&&<span className="block mt-1 text-sm font-semibold">{p.tier}</span>}{p.daily!=null&&<span className="block text-xs mt-1">{p.daily} GB / {t('يوم','jour')} · {p.reduced} · {p.reset??'—'} h</span>}<span className="block mt-3 font-black text-blue-600 dark:text-blue-300">{price(p.price)}</span>{p.popular&&<span className="block text-xs mt-1">{t('مميزة','Populaire')}</span>}</button>)}</div>}
 {plan&&<div className="mt-5 rounded-xl bg-slate-100 p-4 dark:bg-slate-800"><div className="flex justify-between font-bold"><span>{t('الإجمالي','Total')}</span><span>{price(plan.price)}</span></div><button disabled={!enabled} onClick={()=>navigate(`/esim/${country.slug}/commande`,{state:{countrySlug:country.slug,countryName:country.name,countryFlag:country.flag,countryImage:image,planId:plan.id,planData:plan.data,planDuration:plan.duration,planPrice:plan.price}})} className="mt-4 w-full rounded-xl bg-blue-600 p-3 font-bold text-white disabled:opacity-50">{enabled?t('متابعة الشراء','Continuer'):t('قريبًا','Bientôt disponible')}</button></div>}
 </section></div><EsimGuide ar={ar} settings={{...settings,...Object.fromEntries(Object.entries(country.guide??{}).filter(([,v])=>Boolean(v)))}}/></Container></main>
}
