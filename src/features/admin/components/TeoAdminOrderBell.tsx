import { useEffect, useRef, useState } from 'react'
import { Bell, Check, RefreshCw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

type Order = {id:string;order_number:string;service_name:string;group_name:string|null;plan_label:string;customer_name:string;created_at:string;status:string}
export default function TeoAdminOrderBell({ar,newReviewsCount}:{ar:boolean;newReviewsCount:number}) {
  const t=(a:string,f:string)=>ar?a:f
  const navigate=useNavigate()
  const [open,setOpen]=useState(false)
  const [orders,setOrders]=useState<Order[]>([])
  const [read,setRead]=useState<Set<string>>(new Set())
  const [error,setError]=useState(false)
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [owner,setOwner]=useState('')
  const root=useRef<HTMLDivElement>(null)
  const generation=useRef(0)
  const writeLock=useRef(false)
  const refreshRef=useRef<()=>Promise<void>>(async()=>{})
  useEffect(()=>{
    let active=true
    const load=async()=>{
      if(writeLock.current)return
      const version=++generation.current
      try {
        const auth=await supabase.auth.getUser()
        if(!active||version!==generation.current)return
        if(auth.error||!auth.data.user)throw Error('AUTH')
        const uid=auth.data.user.id
        const result=await supabase.from('digital_orders').select('id,order_number,service_name,group_name,plan_label,customer_name,created_at,status').order('created_at',{ascending:false}).limit(100)
        if(result.error)throw result.error
        const rows=(result.data??[]) as Order[]
        const seen=rows.length?await supabase.from('teo_admin_order_reads').select('order_id').eq('admin_id',uid).in('order_id',rows.map(o=>o.id)):{data:[],error:null}
        if(seen.error)throw seen.error
        if(!active||version!==generation.current)return
        setOwner(uid);setOrders(rows);setRead(new Set((seen.data??[]).map(r=>r.order_id)));setError(false)
      }catch{if(active&&version===generation.current)setError(true)}
      finally{if(active&&version===generation.current)setLoading(false)}
    }
    refreshRef.current=load
    void load()
    const channel=supabase.channel('teo-admin-order-bell-'+Date.now()).on('postgres_changes',{event:'*',schema:'public',table:'digital_orders'},()=>void load()).subscribe()
    const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void load()},15000)
    const focus=()=>void load()
    window.addEventListener('focus',focus)
    return()=>{active=false;++generation.current;refreshRef.current=async()=>{};window.clearInterval(timer);window.removeEventListener('focus',focus);void supabase.removeChannel(channel)}
  },[])
  useEffect(()=>{
    if(!open)return
    const outside=(e:PointerEvent)=>{if(e.target instanceof Node&&!root.current?.contains(e.target))setOpen(false)}
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)}
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape)
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)}
  },[open])
  const unread=orders.filter(o=>!read.has(o.id))
  const mark=async(ids:string[])=>{
    if(!ids.length)return true
    if(!owner||writeLock.current)return false
    writeLock.current=true;++generation.current;setBusy(true)
    try{
      const result=await supabase.from('teo_admin_order_reads').upsert(ids.map(order_id=>({admin_id:owner,order_id})),{onConflict:'admin_id,order_id',ignoreDuplicates:true})
      if(result.error)throw result.error
      setRead(old=>new Set([...old,...ids]));setError(false);return true
    }catch{setError(true);return false}
    finally{writeLock.current=false;setBusy(false);void refreshRef.current()}
  }
  const count=unread.length+newReviewsCount
  return <div ref={root} className="relative">
    <button type="button" aria-label={t('الإشعارات','Notifications')} aria-expanded={open} onClick={()=>{setOpen(v=>!v);void refreshRef.current()}} className="relative flex h-10 w-10 items-center justify-center rounded-xl border active:scale-95" style={{backgroundColor:'var(--color-surface)',borderColor:'var(--color-border)'}}>
      <Bell size={18}/>{count>0&&<span dir="ltr" className="absolute -end-1 -top-1 min-w-5 rounded-full bg-rose-600 px-1 text-[10px] font-black leading-5 text-white">{count>99?'99+':count}</span>}
    </button>
    {open&&<section dir={ar?'rtl':'ltr'} className="fixed inset-x-3 top-[72px] z-[80] overflow-hidden rounded-2xl border shadow-2xl sm:absolute sm:inset-x-auto sm:end-0 sm:top-[calc(100%+12px)] sm:w-[360px]" style={{backgroundColor:'var(--color-surface)',borderColor:'var(--color-border)',color:'var(--color-text)'}}>
      <div className="flex items-center justify-between gap-2 border-b p-3" style={{borderColor:'var(--color-border)'}}><strong>{t('الإشعارات','Notifications')}</strong><button type="button" disabled={busy||!unread.length} onClick={()=>void mark(unread.map(o=>o.id))} className="flex items-center gap-1 text-xs font-bold text-blue-600 disabled:opacity-50"><Check size={14}/>{t('قراءة الطلبات المعروضة','Tout lire (commandes affichées)')}</button></div>
      {error&&<div role="alert" className="flex items-center justify-between gap-2 p-3 text-xs text-rose-500">{t('تعذر تحديث الإشعارات','Synchronisation indisponible')}<button type="button" onClick={()=>void refreshRef.current()} aria-label={t('إعادة المحاولة','Réessayer')}><RefreshCw size={16}/></button></div>}
      <div className="max-h-[55dvh] overflow-y-auto p-2">
      {loading?<p className="p-4 text-sm">{t('جار التحميل…','Chargement…')}</p>:!orders.length?<p className="p-4 text-sm">{t('لا توجد طلبات','Aucune commande')}</p>:orders.map(order=><button key={order.id} type="button" disabled={busy} onClick={async()=>{if(!read.has(order.id))await mark([order.id]);setOpen(false);navigate(`/admin/orders?order=${encodeURIComponent(order.order_number)}`)}} className="mb-1 block w-full rounded-xl p-3 text-start active:scale-[0.98]" style={{backgroundColor:read.has(order.id)?'transparent':'var(--color-background)'}}><div className="flex items-center gap-2"><strong className="flex-1 text-sm">{t('طلب','Commande')} {order.order_number}</strong>{!read.has(order.id)&&<span className="h-2 w-2 shrink-0 rounded-full bg-blue-600"/>}</div><p className="mt-1 break-words text-xs font-bold">{[order.service_name,order.group_name,order.plan_label].filter(Boolean).join(' · ')}</p><p className="mt-1 break-words text-xs opacity-75">{order.customer_name}</p><p className="mt-1 text-[10px] opacity-70" dir="ltr">{new Date(order.created_at).toLocaleString(ar?'ar-MR-u-nu-latn':'fr-FR')}</p></button>)}
      </div><div className="grid grid-cols-2 gap-2 border-t p-3 text-center text-xs font-bold" style={{borderColor:'var(--color-border)'}}><Link to="/admin/orders" onClick={()=>setOpen(false)} className="text-blue-600">{t('جميع الطلبات','Toutes les commandes')}</Link><Link to="/admin/store-reviews" onClick={()=>setOpen(false)} className="text-blue-600">{t('التقييمات','Avis')} ({newReviewsCount})</Link></div>
      <p className="px-3 pb-2 text-[10px] opacity-65">{t('آخر 100 طلب','100 dernières commandes')}</p>
    </section>}
  </div>
}
