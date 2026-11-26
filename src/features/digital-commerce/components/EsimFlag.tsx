import { supabase } from '../../../lib/supabase'
export default function EsimFlag({flag,code,path}:{flag:string;code:string;path?:string|null}) {
 const url=path?supabase.storage.from('esim-country-images').getPublicUrl(path).data.publicUrl:null
 return <span className="inline-flex h-8 min-w-10 items-center justify-center overflow-hidden rounded-md bg-slate-100 px-1 text-xl text-slate-800 dark:bg-slate-800 dark:text-white">{url?<img src={url} alt={code} className="h-7 w-10 object-contain"/>:<span title={code}>{flag} <span className="text-xs font-bold">{code}</span></span>}</span>
}
