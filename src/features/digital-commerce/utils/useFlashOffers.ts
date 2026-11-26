import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export type FlashOffer = { plan_id: string; original_price: number; flash_price: number; discount_percent: number; ends_at: string; quantity_remaining: number | null; show_discount_badge: boolean; preview_only?: boolean; title_ar?: string; title_fr?: string }
export function useFlashOffers(ids: (string | undefined)[], preview = false) {
  const key = [...new Set(ids.filter((id): id is string => !!id))].sort().join(',')
  const requestKey = `${preview ? 'preview' : 'public'}:${key}`
  const [result, setResult] = useState<{key:string; offers:Record<string,FlashOffer>}>({key:'',offers:{}})
  const [now,setNow]=useState(Date.now())
  useEffect(()=>{
    let alive=true, version=0
    const load=async()=>{
      const request=++version
      if (!key) {setResult({key:requestKey,offers:{}});return}
      try {
        const ids=key.split(','); const offers:Record<string,FlashOffer>={}
        for(let i=0;i<ids.length;i+=100){
          const {data,error}=await supabase.rpc(preview?'teo_v6_admin_preview_flash_offers':'teo_v6_public_flash_offers',{p_plan_ids:ids.slice(i,i+100)})
          if(error)throw error
          if(Array.isArray(data))for(const row of data){
            if(row && (!preview || (row.preview_only===true && row.purchase_allowed===false)) && ids.includes(row.plan_id) && Number(row.flash_price)>0 && Number(row.flash_price)<Number(row.original_price) && Number.isFinite(Date.parse(row.ends_at))) offers[row.plan_id]={...row,original_price:Number(row.original_price),flash_price:Number(row.flash_price),discount_percent:Number(row.discount_percent)}
          }
        }
        if(alive&&request===version)setResult({key:requestKey,offers})
      }catch{if(alive&&request===version)setResult({key:requestKey,offers:{}})}
    }
    void load()
    const timer=window.setInterval(()=>void load(),30000)
    const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{if(alive){++version;setResult({key:requestKey,offers:{}});window.setTimeout(()=>{if(alive)void load()},0)}})
    const clock=window.setInterval(()=>setNow(Date.now()),1000)
    return()=>{alive=false;window.clearInterval(timer);window.clearInterval(clock);subscription.unsubscribe()}
  },[key,preview,requestKey])
  const offers=result.key===requestKey?Object.fromEntries(Object.entries(result.offers).filter(([,o])=>Date.parse(o.ends_at)>now)):{} 
  return {offers,now}
}
