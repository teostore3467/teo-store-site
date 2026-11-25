import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
const key='teo-referral-pending'
export default function ReferralCapture(){
 const {search}=useLocation()
 useEffect(()=>{try{const code=new URLSearchParams(search).get('ref');if(code&&/^[A-Za-z0-9_-]{1,100}$/.test(code)&&!localStorage.getItem(key))localStorage.setItem(key,code)}catch{/* storage unavailable */}},[search])
 useEffect(()=>{let live=true;let running=false;async function apply(){if(!live||running)return;running=true;try{const code=localStorage.getItem(key);if(!code)return;const {data}=await supabase.auth.getSession();if(!data.session)return;const {data:result,error}=await supabase.rpc('teo_v5_register_referral',{p_code:code});if(!error&&(result?.success||result?.status==='already_registered'))localStorage.removeItem(key);else if(error&&/NEW_CUSTOMERS_ONLY|CUSTOMER_ALREADY_ORDERED|SELF_REFERRAL_FORBIDDEN|INVALID_REFERRAL_CODE/.test(error.message))localStorage.removeItem(key)}catch{/* leave pending for retry */}finally{running=false}}const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{setTimeout(()=>void apply(),0)});void apply();return()=>{live=false;subscription.unsubscribe()}},[search]);return null
}
