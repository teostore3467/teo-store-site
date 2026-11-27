import { useState } from 'react'
// Real country SVGs from Flagpedia / FlagCDN; no emoji or colored container.
export default function EsimFlag({code}:{flag:string;code:string;path?:string|null}) {
 const iso=code.trim().toUpperCase();const [failed,setFailed]=useState('');
 const src=/^[A-Z]{2}$/.test(iso)?`https://flagcdn.com/${iso.toLowerCase()}.svg`:'';
 return <span className="inline-flex w-7 max-h-6 shrink-0 items-center justify-center bg-transparent align-middle" title={iso}>{src&&failed!==src?<img src={src} alt={iso} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(src)} className="block h-auto max-h-5 w-full rounded-[2px] object-contain"/>:<span className="text-[10px] font-bold">{iso}</span>}</span>
}
