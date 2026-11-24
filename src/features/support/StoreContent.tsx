import {useEffect,useState} from 'react'
import {useParams} from 'react-router-dom'
import {supabase} from '../../lib/supabase'
import {useLanguage} from '../../i18n/LanguageContext'
type Page={title_ar:string;title_fr:string;content_ar:string;content_fr:string}
export default function StoreContent(){const {slug}=useParams();const {language}=useLanguage();const ar=language==='ar';const [page,setPage]=useState<Page|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);useEffect(()=>{let live=true;setLoading(true);setPage(null);setError('');void supabase.from('teo_store_pages').select('title_ar,title_fr,content_ar,content_fr').eq('slug',slug).eq('active',true).maybeSingle().then(r=>{if(live){setPage(r.data);setError(r.error?.message||'');setLoading(false)}});return()=>{live=false}},[slug]);return <article className="mx-auto min-h-64 max-w-4xl p-6"><h1 className="mb-5 text-2xl font-black">{page?(ar?page.title_ar:page.title_fr):''}</h1><p className="whitespace-pre-wrap leading-8">{loading?'…':error|| (page?(ar?page.content_ar:page.content_fr):(ar?'الصفحة غير منشورة':'Page non publiée'))}</p></article>}
