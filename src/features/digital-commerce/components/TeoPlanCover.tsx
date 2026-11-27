import type { PublicServiceCatalogItem, PublicServiceGroup, PublicServicePlan } from '../data/supabaseServiceCatalog'
import { getLocalizedGroupName, getLocalizedPlanLabel, getLocalizedServiceName, getLocalizedFulfillmentLabel } from '../data/serviceCatalogTranslations'
import { Link } from 'react-router-dom'
import ServiceLogo from './ServiceLogo'
import { coverDuration, isDurationLabel, westernDigits } from '../utils/planDuration'
export { coverDuration } from '../utils/planDuration'
import { useLanguage } from '../../../i18n/LanguageContext'

type Lang = 'ar' | 'fr'
export type DigitalPlanItem = {service:PublicServiceCatalogItem;group:PublicServiceGroup;plan:PublicServicePlan}
export function flattenDigitalPlans(catalog:readonly PublicServiceCatalogItem[]):DigitalPlanItem[]{
 return catalog.filter(s=>s.slug!=='esim').flatMap(service=>service.groups.flatMap(group=>group.plans.filter(plan=>Number.isFinite(plan.price)&&plan.price>0).map(plan=>({service,group,plan}))))
}
export function planHref({service,group,plan}:DigitalPlanItem){return `/services-numeriques/${encodeURIComponent(service.slug)}/offre/${encodeURIComponent(group.id)}?plan=${encodeURIComponent(plan.databaseId??plan.id)}`}
const palettes: [RegExp,string,string][]=[
 [/capcut/i,'#171832','#302174'],[/chatgpt|openai/i,'#102e34','#246b66'],[/claude|anthropic/i,'#102034','#22626b'],[/netflix/i,'#190d16','#8e1327'],[/shahid/i,'#082c32','#126d53'],[/canva/i,'#133b70','#6339a8'],[/copilot/i,'#16265b','#424f99'],[/gemini|google[-_ ]?ai/i,'#142f55','#4b58aa'],[/crunchyroll/i,'#4a230b','#a5420c'],[/perplexity/i,'#123139','#236970'],[/notion/i,'#191a23','#353740'],[/adobe|photoshop/i,'#32101b','#8b243b'],[/spotify/i,'#102a20','#166344'],[/youtube/i,'#360e16','#96222b'],[/disney/i,'#102244','#204e89'],[/prime[-_ ]?video/i,'#122d47','#12618d'],[/playstation/i,'#132447','#234c9a'],[/xbox/i,'#142b18','#286b31'],[/steam/i,'#16232e','#31566a'],[/apple/i,'#242531','#5b5b69'],[/google[-_ ]?play/i,'#153b38','#23715f'],[/pubg/i,'#352612','#88601d'],[/free[-_ ]?fire/i,'#33221b','#87491c'],[/picsart/i,'#27184c','#654296'],[/(?:^|[-_ ])tod(?:$|[-_ ])/i,'#182d47','#385e98'],[/osn/i,'#3a1630','#842f60'],[/snapchat/i,'#3a3212','#79661b'],[/grok/i,'#16191f','#424752'],[/coursera|cousrsera/i,'#142c55','#235ba3'],[/ap[-_ ]?tv/i,'#20263e','#46517e'],[/windows/i,'#102d50','#2467a5'],[/shoptishop/i,'#202c48','#465e9b']]
function palette(slug:string,stableId:string){const known=palettes.find(([rx])=>rx.test(slug));if(known)return [known[1],known[2]];let hash=0;for(const c of stableId)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;return [`hsl(${hash%360} 48% 15%)`,`hsl(${hash%360} 50% 32%)`]}
function coverName(item:DigitalPlanItem,lang:Lang){
 const {service,group,plan}=item;const name=westernDigits(getLocalizedGroupName(group,lang));
 const account=lang==='ar'?/حساب خاص|حساب شخصي|حساب مشترك|دعوة إلى فريق|دعوة فريق|تفعيل/:/compte priv[ée]|compte personnel|compte partag[ée]|invitation (?:à une |en )?équipe|activation/i;
 const match=name.match(account);
 const stripDuration=(v:string)=>v.replace(/(?:\b\d+\s*(?:jours?|mois|ans?|années?|days?|months?|years?|weeks?|semaines?|hours?|heures?|minutes?)\b|\d+\s*(?:يومًا|يوماً|يوم|أيام|ايام|شهرًا|شهراً|شهر|أشهر|اشهر|سنوات|سنة|أسبوع|أسابيع|ساعة|ساعات|دقيقة|دقائق))/giu,'');
 const clean=stripDuration(name).replace(account,'').replace(/^[–—|·\s-]+|[–—|·\s-]+$/g,'').trim();
 const label=westernDigits(getLocalizedPlanLabel(plan,lang).trim());
 const detail=label&&!isDurationLabel(label)&&!/^(standard|عادي|قياسي)$/i.test(label)?stripDuration(label).replace(/^[–—|·\s-]+|[–—|·\s-]+$/g,'').trim():'';
 return {name:clean||stripDuration(getLocalizedServiceName(service,lang)).trim()||service.slug,type:[...new Set([match?.[0],detail].filter(Boolean))].join(' · ')||getLocalizedFulfillmentLabel(group.fulfillment.type,lang)};
}
export default function TeoPlanCover({item,language}:{item:DigitalPlanItem;language:Lang}){
 const [start,end]=palette(item.service.slug,item.service.databaseId??item.service.slug);const d=coverDuration(item.plan,language);const title=coverName(item,language);
 return <div aria-hidden="true" dir={language==='ar'?'rtl':'ltr'} className="relative h-full w-full overflow-hidden text-white" style={{background:`linear-gradient(155deg,${start},${end})`,containerType:'inline-size'}}>
  <div className="pointer-events-none absolute rounded-[12cqw] border border-white/20" style={{width:'65%',height:'64%',insetInlineEnd:'-32%',top:'-16%'}}/><div className="pointer-events-none absolute rounded-[12cqw] border border-white/20" style={{width:'65%',height:'64%',insetInlineEnd:'-27%',top:'-11%'}}/>
  {d.number&&<div className="absolute inset-x-[6%] top-[8%] flex items-center gap-[3cqw] font-black leading-none"><bdi className="inline-flex items-center justify-center rounded-[3cqw] px-[3cqw] py-[2cqw]" style={{minWidth:'13cqw',minHeight:'13cqw',fontSize:'8cqw',background:d.unit==='MOIS'||d.unit.includes('شهر')?'#713ee5':'#315ff5'}}>{d.number}</bdi><span style={{fontSize:'5.5cqw'}}>{d.unit}</span></div>}
  <div className="absolute inset-x-[7%] top-[26%] bottom-[6%] flex flex-col items-start justify-center gap-[2cqw]">
   <div className="shrink-0 overflow-hidden rounded-[4cqw]" style={{width:'24cqw',height:'24cqw',fontSize:'10cqw'}}><ServiceLogo serviceSlug={item.service.slug} fallback={item.service.name.slice(0,2).toUpperCase()} coverMode/></div>
   <div className="max-w-full line-clamp-2 break-words font-black leading-tight [overflow-wrap:anywhere]" style={{fontSize:title.name.length>36?'6.5cqw':title.name.length>24?'8cqw':'10cqw'}}>{title.name}</div>
   <div className="max-w-full line-clamp-2 break-words leading-tight opacity-90 [overflow-wrap:anywhere]" style={{fontSize:'5.5cqw'}}>{title.type}</div>
  </div>
 </div>
}
export function DigitalPlanCard({item,price,oldPrice,className=''}:{item:DigitalPlanItem;price?:number;oldPrice?:number|null;className?:string}){
 const {language,currencyLabel}=useLanguage();const ar=language==='ar';const {service,group,plan}=item;const available=service.availability==='available'&&group.availability==='available'&&plan.availability==='available';const current=price??plan.price;const old=oldPrice??plan.old_price;
 return <Link to={planHref(item)} dir={ar?'rtl':'ltr'} className={`teo-store-card teo-offer-card group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${className}`}><div className="teo-store-media aspect-square w-full overflow-hidden"><TeoPlanCover item={item} language={language}/></div><div className="flex flex-1 flex-col gap-2 p-3 sm:p-4"><h3 className="teo-offer-name break-words font-black text-slate-950 dark:text-white">{getLocalizedGroupName(group,language)} · {getLocalizedPlanLabel(plan,language)}</h3><p className="teo-offer-muted text-xs">{getLocalizedFulfillmentLabel(group.fulfillment.type,language)}</p><p className={`text-xs font-bold ${available?'text-emerald-600':'text-slate-500'}`}>{available?(ar?'متوفر':'Disponible'):(ar?'غير متوفر':'Indisponible')}</p><p className="teo-offer-price font-black text-blue-600 dark:text-blue-300">{old!=null&&old>current&&<del className="me-2 text-xs font-normal text-slate-500">{old} {currencyLabel}</del>}{current} {currencyLabel}</p><span className="teo-card-action mt-auto flex items-center justify-between pt-3 text-sm font-bold">{ar?'عرض المنتج':'Voir le produit'}<span>{ar?'←':'→'}</span></span></div></Link>
}
