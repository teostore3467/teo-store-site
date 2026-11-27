import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type ServiceLogoProps = { serviceSlug: string; fallback: string; className?: string; fallbackUrl?: string | null; coverMode?: boolean }
type LogoRow = { logo_path: string; logo_light_path: string | null; logo_dark_path: string | null }
const urlFor = (path?: string | null) => path ? supabase.storage.from('service-logos').getPublicUrl(path).data.publicUrl : null

const logoCache = new Map<string,{until:number;request:Promise<LogoRow|null>}>()
function loadLogo(slug:string):Promise<LogoRow|null>{
  const existing=logoCache.get(slug);if(existing&&existing.until>Date.now())return existing.request
  const request=(async()=>{const {data,error}=await supabase.from('service_logos').select('logo_path,logo_light_path,logo_dark_path').eq('service_slug',slug).maybeSingle();if(error)throw error;return data as LogoRow|null})()
  logoCache.set(slug,{until:Date.now()+60_000,request});void request.catch(()=>{if(logoCache.get(slug)?.request===request)logoCache.delete(slug)})
  return request
}
export default function ServiceLogo({serviceSlug, fallback, fallbackUrl, className='h-full w-full object-cover', coverMode=false}: ServiceLogoProps) {
  const [row,setRow] = useState<{slug:string; data:LogoRow|null}|null>(null)
  const [failed,setFailed] = useState<string[]>([])
  useEffect(()=>{
    let current=true
    setFailed([])
    const load=async()=>{
      try {
        const data=await loadLogo(serviceSlug)
        if(current) setRow({slug:serviceSlug,data})
      } catch { if(current)setRow({slug:serviceSlug,data:null}) }
    }
    void load()
    return ()=>{current=false}
  },[serviceSlug])
  const logo=row?.slug===serviceSlug?row.data:null
  const candidates=[urlFor(logo?.logo_path),urlFor(logo?.logo_dark_path),urlFor(logo?.logo_light_path),fallbackUrl]
  const src=candidates.find((x):x is string=>!!x&&!failed.includes(x))
  return src ? <img key={src} src={src} alt="" loading="lazy" className={className} style={{display:"block",width:"100%",height:"100%",objectFit:coverMode?"contain":"cover",padding:0,margin:0,backgroundColor:coverMode?"transparent":"#192638"}} onError={()=>setFailed(old=>[...old,src])}/> : <span className={`flex h-full w-full items-center justify-center font-bold text-white ${coverMode?'bg-white/15':'bg-[#192638]'}`}>{fallback}</span>
}
