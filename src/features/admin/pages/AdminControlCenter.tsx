import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

const definitions = [
  ['checkout','الطلبات والدفع','Commandes et paiement','الشراء الحقيقي','Achats réels'],
  ['flash','عروض TEO FLASH DAYS','TEO FLASH DAYS','البيع الحقيقي بالسعر المخفض','Ventes flash réelles'],
  ['display','النشر العام للعروض','Publication Flash','عرض العروض دون شراء','Afficher les offres sans achat'],
  ['preview','معاينة العروض','Aperçu Flash','للإدارة فقط','Administrateurs uniquement'],
  ['catalog','كتالوج eSIM','Catalogue eSIM','عرض الباقات المنشورة','Afficher les forfaits publiés'],
  ['esim_checkout','شراء eSIM','Achat eSIM','استقبال طلبات حقيقية','Commandes réelles'],
  ['coupons','الكوبونات','Coupons PRO','الخصومات المؤهلة','Remises éligibles'],
  ['wallet','المحفظة','Portefeuille','حسابات العمولات','Comptes de commissions'],
  ['referral','الإحالات','Parrainage','العمولات المؤهلة','Commissions éligibles'],
  ['partners','الشركاء','Partenaires','برنامج الشركاء','Programme partenaires'],
  ['withdrawals','السحب','Retraits','طلبات السحب اليدوية','Demandes de retrait manuelles'],
  ['rewards','المكافآت','Récompenses','المكافآت المؤهلة','Récompenses éligibles'],
] as const
type Key = typeof definitions[number][0]
type State = Record<Key, boolean>
const surface = {background:'var(--color-surface)', color:'var(--color-text)', borderColor:'var(--color-border)'}
function message(e:unknown){return e instanceof Error?e.message:typeof e==='object'&&e!==null&&'message' in e?String(e.message):String(e)}
export default function AdminControlCenter({ar}:{ar:boolean}){
 const t=(a:string,f:string)=>ar?a:f
 const [state,setState]=useState<State|null>(null),[counts,setCounts]=useState({all:0,active:0,visible:0}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const locked=useRef(false)
 const [pending,setPending]=useState<Key|null>(null)
 const [actionKey,setActionKey]=useState<Key|null>(null)
 async function read(){
  const [m,e,f,p,c,d]=await Promise.all([
   supabase.from('teo_marketing_settings').select('checkout_v5_enabled,coupons_enabled,wallet_enabled,referral_enabled,partners_enabled,withdrawals_enabled,rewards_enabled').eq('id',true).single(),
   supabase.from('teo_esim_settings').select('catalog_v5_enabled,checkout_v5_enabled').eq('id',true).single(),
   supabase.rpc('teo_v6_admin_flash_status'),
   supabase.from('esim_plan_settings').select('country_slug,active,price,validity_days'),
   supabase.from('esim_country_settings').select('country_slug,active'),
   supabase.rpc('teo_v6_get_flash_display_status')
  ])
  for(const r of [m,e,f,p,c,d])if(r.error)throw r.error
  const next={checkout:m.data!.checkout_v5_enabled,flash:f.data?.flash_enabled,preview:f.data?.preview_enabled,display:d.data?.display_enabled,catalog:e.data!.catalog_v5_enabled,esim_checkout:e.data!.checkout_v5_enabled,coupons:m.data!.coupons_enabled,wallet:m.data!.wallet_enabled,referral:m.data!.referral_enabled,partners:m.data!.partners_enabled,withdrawals:m.data!.withdrawals_enabled,rewards:m.data!.rewards_enabled} as State
  if(Object.values(next).some(v=>typeof v!=='boolean'))throw Error('CONTROL_STATUS_INCOMPLETE')
  const plans=p.data??[], countries=c.data??[]
  setCounts({all:plans.length,active:plans.filter(x=>x.active===true).length,visible:plans.filter(x=>x.active===true&&Number.isFinite(Number(x.price))&&Number(x.price)>0&&Number(x.validity_days)>0&&countries.some(y=>y.country_slug===x.country_slug&&y.active===true)).length})
  setState(next);return next
 }
 async function refresh(){if(locked.current)return;locked.current=true;setBusy(true);setError('');setNotice('');try{await read()}catch(e){setState(null);setError(message(e))}finally{locked.current=false;setBusy(false)}}
 useEffect(()=>{void refresh()},[])
 function reason(k:Key){if(!state)return '';const on=state[k];if(!on){if((k==='flash'||k==='coupons')&&!state.checkout)return t('فعّل الطلبات والدفع أولًا','Activez le checkout d’abord');if(k==='preview'&&state.flash)return t('أوقف العرض الحقيقي أولًا','Désactivez la vente réelle d’abord');if((k==='catalog'||k==='esim_checkout')&&!counts.visible)return t('انشر باقة صالحة في دولة نشطة أولًا','Publiez un forfait valide dans un pays actif');if(k==='esim_checkout'&&(!state.catalog||!state.checkout))return t('فعّل الكتالوج والطلبات أولًا','Activez le catalogue et le checkout');if(['referral','partners','withdrawals','rewards'].includes(k)&&!state.wallet)return t('فعّل المحفظة أولًا','Activez le portefeuille');if(k==='rewards'&&!state.referral)return t('فعّل الإحالات أولًا','Activez le parrainage')}else{if(k==='checkout'&&(state.flash||state.coupons||state.esim_checkout))return t('أوقف العروض والكوبونات وشراء eSIM أولًا','Désactivez Flash, coupons et achat eSIM');if(k==='catalog'&&state.esim_checkout)return t('أوقف شراء eSIM أولًا','Désactivez l’achat eSIM');if(k==='wallet'&&(state.referral||state.partners||state.withdrawals||state.rewards))return t('أوقف الأنظمة التابعة أولًا','Désactivez les systèmes dépendants');if(k==='referral'&&state.rewards)return t('أوقف المكافآت أولًا','Désactivez les récompenses')}return ''}
 function requestToggle(k:Key){
  if(!state||locked.current)return
  setError('')
  setNotice('')
  setActionKey(k)

  const blocked=reason(k)

  if(blocked){
   setPending(null)
   setError(blocked)
   return
  }

  setPending(k)
 }

 async function toggle(k:Key,label:string){
  if(!state||locked.current)return

  const blocked=reason(k)

  if(blocked){
   setPending(null)
   setError(blocked)
   return
  }

  const next=!state[k]
  setPending(null)
  setActionKey(k)
locked.current=true;setBusy(true);setError('');setNotice('');try{if(k==='display'){
 const r=await supabase.rpc('teo_v6_admin_set_flash_display',{p_enabled:next});
 if(r.error)throw r.error;
 if(r.data?.flash_display_enabled!==next)throw Error('CONTROL_NOT_CONFIRMED');
}else{
 const r=await supabase.rpc('teo_v6_admin_set_control',{p_system:k,p_enabled:next});
 if(r.error)throw r.error;
 if(r.data!==next)throw Error('CONTROL_NOT_CONFIRMED');
}const saved=await read();if(saved[k]!==next)throw Error('CONTROL_NOT_SAVED');setNotice(label+' — '+t('تم التحقق من الحفظ','Enregistrement vérifié'))}catch(e){setError(message(e));try{await read()}catch{setState(null)}}finally{locked.current=false;setBusy(false)}}
 return <section className="rounded-2xl border p-4 sm:p-6 space-y-4" style={surface}><div className="flex flex-wrap justify-between items-center gap-3"><div><h2 className="text-xl font-bold">{t('مركز التحكم TEO','Centre de contrôle TEO')}</h2><p className="text-xs opacity-70">{t('الحالة الفعلية من قاعدة البيانات','État réel de la base de données')}</p></div><button type="button" disabled={busy} onClick={()=>void refresh()} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">{t('تحديث','Actualiser')}</button></div>{error&&<p role="alert" className="rounded-lg border border-red-500 p-3 text-sm text-red-500">{error}</p>}{notice&&<p role="status" className="text-sm text-emerald-600">{notice}</p>}{!state?<p className="text-sm opacity-70">{busy?t('تحميل…','Chargement…'):t('الحالة غير متاحة','État indisponible')}</p>:<><div className="grid grid-cols-3 gap-2">{[[t('الباقات','Forfaits'),counts.all],[t('النشطة','Actifs'),counts.active],[t('صالحة للعرض','Éligibles'),counts.visible]].map(([label,value])=><div key={label} className="rounded-xl border p-3" style={surface}><p className="text-xs opacity-70">{label}</p><strong className="text-xl">{value}</strong></div>)}</div><div className="grid gap-2 lg:grid-cols-2">{definitions.map(([k,a,f,da,df])=>{const label=ar?a:f,why=reason(k);return <div key={k} className="rounded-xl border p-3 space-y-2" style={surface}><div className="flex items-center justify-between gap-3"><div><h3 className="font-bold text-sm">{label}</h3><p className="text-xs opacity-70">{ar?da:df}</p><span className={'text-xs font-semibold '+(state[k]?'text-emerald-600':'opacity-70')}>{state[k]?t('مفعّل','Actif'):t('معطّل','Inactif')}</span></div><button type="button" role="switch" aria-label={label} aria-checked={state[k]} disabled={busy} onClick={()=>requestToggle(k)} className={'relative shrink-0 rounded-full w-12 h-7 disabled:opacity-40 '+(state[k]?'bg-emerald-600':'bg-slate-400')}><span className={'absolute top-1 h-5 w-5 bg-white rounded-full transition-all '+(state[k]?'left-6':'left-1')}/></button></div>{why&&<p className="text-xs opacity-75">{why}</p>}

{actionKey===k&&error&&
 <p role="alert"
    className="rounded-lg border border-red-500 p-3 text-sm text-red-500">
  {error}
 </p>
}

{actionKey===k&&busy&&
 <p role="status" className="text-sm text-blue-500">
  {t('جارٍ حفظ الحالة...','Enregistrement en cours...')}
 </p>
}

{pending===k&&
 <div className="mt-3 space-y-3 rounded-xl border p-3" style={surface}>
  <p className="font-bold text-sm">
   {state[k]
    ?t('تأكيد إيقاف النظام؟','Confirmer la désactivation ?')
    :t('تأكيد تشغيل النظام؟','Confirmer l’activation ?')}
  </p>

  {!state[k]&&
   <p className="text-xs text-amber-600">
    {t(
     'هذا تفعيل حقيقي للنظام وليس وضع اختبار.',
     'Cette activation est réelle et non un test.'
    )}
   </p>
  }

  <div className="flex gap-2">
   <button
    type="button"
    disabled={busy}
    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"
    onClick={()=>void toggle(k,label)}
   >
    {t('تأكيد','Confirmer')}
   </button>

   <button
    type="button"
    className="flex-1 rounded-lg border px-3 py-2 text-sm"
    onClick={()=>setPending(null)}
   >
    {t('إلغاء','Annuler')}
   </button>
  </div>
 </div>
}</div>})}</div><div className="flex flex-wrap gap-3 text-sm"><Link className="text-blue-600 underline" to="/admin/esim">{t('إدارة الباقات','Gérer les forfaits eSIM')}</Link>{state.preview&&<Link className="text-blue-600 underline" to="/?flash-preview=1">{t('معاينة Flash','Aperçu Flash')}</Link>}</div><p className="text-xs opacity-70">{t('التفعيل لا يثبت جاهزية الاختبار التجاري. لا تُفعّل الشراء قبل اختبار الدفع والتسليم.','L’activation ne valide pas les tests commerciaux. Testez le paiement et la livraison avant les achats réels.')}</p></>}</section>
}
