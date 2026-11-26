import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import type { EsimCountry, EsimPlan } from './esimCatalog'
export type LivePlan = EsimPlan & { tier: string; daily: number | null; reduced: string; reset: number | null }
export type LiveCountry = Omit<EsimCountry,'plans'> & { plans: LivePlan[]; active: boolean; image_path: string | null; guide?: { compatible_devices_ar?: string; compatible_devices_fr?: string; installation_guide_ar?: string; installation_guide_fr?: string; terms_ar?: string; terms_fr?: string } }
export function useEsimCatalog() {
 const [countries,setCountries]=useState<LiveCountry[]>([])
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 useEffect(()=>{let live=true; const load=async()=>{
 const [c,p]=await Promise.all([supabase.from('esim_country_settings').select('*').order('sort_order'),supabase.from('esim_plan_settings').select('*').order('sort_order')]); if(!live)return;
 if(c.error||p.error){setCountries([]);setError(c.error?.message||p.error?.message||'Error');setLoading(false);return}
 setError('');setCountries((c.data??[]).map((r):LiveCountry=>({slug:r.country_slug,code:r.iso_code||'',name:{ar:r.name_ar||r.country_slug,fr:r.name_fr||r.country_slug},flag:r.flag||'🌐',description:{ar:r.description_ar||'',fr:r.description_fr||''},imageLabel:{ar:r.name_ar||'',fr:r.name_fr||''},active:r.active===true,image_path:r.image_path,guide:{compatible_devices_ar:r.compatibility_ar||undefined,compatible_devices_fr:r.compatibility_fr||undefined,installation_guide_ar:r.instructions_ar||undefined,installation_guide_fr:r.instructions_fr||undefined,terms_ar:r.terms_ar||undefined,terms_fr:r.terms_fr||undefined},plans:(p.data??[]).filter(q=>q.country_slug===r.country_slug&&q.active===true&&Number(q.price)>0&&Number.isFinite(Number(q.price))).map((q):LivePlan=>({id:q.plan_id,data:{ar:q.data_ar||q.label_ar||'',fr:q.data_fr||q.label_fr||''},duration:{ar:q.duration_ar||`${q.validity_days??''} يوم`,fr:q.duration_fr||`${q.validity_days??''} jours`},speed:{ar:q.network_type||'',fr:q.network_type||''},price:String(q.price),type:q.unlimited?'unlimited':'limited',popular:q.popular,tier:q.speed_tier||'',daily:q.daily_high_speed_gb??null,reduced:q.reduced_speed||'',reset:q.reset_hours??null}))})));setLoading(false)
 };void load();const channel=supabase.channel('esim-live-'+Math.random()).on('postgres_changes',{event:'*',schema:'public',table:'esim_country_settings'},load).on('postgres_changes',{event:'*',schema:'public',table:'esim_plan_settings'},load).subscribe();return()=>{live=false;void supabase.removeChannel(channel)}},[])
 return {countries,loading,error}
}
