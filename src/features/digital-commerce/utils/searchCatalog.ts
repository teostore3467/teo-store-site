import type { PublicServiceCatalogItem } from '../data/supabaseServiceCatalog'
import type { DigitalPlanItem } from '../components/TeoPlanCover'
import type { LiveCountry } from '../data/useEsimCatalog'
import { getLocalizedServiceName, getLocalizedGroupName, getLocalizedPlanLabel, getLocalizedCategory } from '../data/serviceCatalogTranslations'

export type CatalogSearchResult = { id:string; title:string; subtitle:string; price:string; href:string; available:boolean; digital?:DigitalPlanItem }
const normalize=(v:string)=>v.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ـ/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim()
const serviceAliases:Record<string,string>={'chatgpt-plus':'chatgpt chat gpt شات جي بي تي شات جي بي تي','capcut':'capcut cap cut كاب كات كابكات كاب كت كابكوت','esim':'esim e sim اي سيم شريحة الكترونية انترنت internet data'}
export function searchCatalog(query:string,catalog:readonly PublicServiceCatalogItem[],countries:readonly LiveCountry[],language:'ar'|'fr'):CatalogSearchResult[]{
  const words=normalize(query).split(' ').filter(Boolean)
  if(!words.length)return []
  const matches=(fields:(string|number|null|undefined)[])=>{const text=normalize(fields.filter(x=>x!=null).join(' '));return words.every(w=>text.includes(w))}
  const out:CatalogSearchResult[]=[]
  for(const service of catalog){
    for(const group of service.groups){
      for(const plan of group.plans){
        if(!Number.isFinite(plan.price)||plan.price<=0)continue
        if(!matches([service.slug,service.name,service.name_ar,service.name_fr,service.category,serviceAliases[service.slug],/capcut|cap\s*cut|كاب\s*كات|كابكوت/i.test([service.slug,service.name,service.name_ar,service.name_fr,group.name].join(' '))?serviceAliases.capcut:null,getLocalizedCategory(service.category,'ar'),getLocalizedCategory(service.category,'fr'),group.id,group.name,group.name_ar,group.name_fr,group.shortName,group.short_name_ar,group.short_name_fr,plan.id,plan.label,plan.label_ar,plan.label_fr,plan.duration_value,plan.duration_unit]))continue
        out.push({digital:{service,group,plan},id:`digital:${service.slug}:${group.id}:${plan.id}`,title:getLocalizedGroupName(group,language),subtitle:`${getLocalizedServiceName(service,language)} · ${getLocalizedPlanLabel(plan,language)}`,price:`${plan.price} ${language==='ar'?'أوقية جديدة':'MRU'}`,href:`/services-numeriques/${encodeURIComponent(service.slug)}/offre/${encodeURIComponent(group.id)}?plan=${encodeURIComponent(plan.databaseId??plan.id)}`,available:service.availability==='available'&&group.availability==='available'&&plan.availability==='available'})
      }
    }
  }
  for(const country of countries){
    if(!country.active)continue
    for(const plan of country.plans){
      if(!matches([serviceAliases.esim,country.slug,country.code,country.name.ar,country.name.fr,country.region?.ar,country.region?.fr,plan.id,plan.label.ar,plan.label.fr,plan.data.ar,plan.data.fr,plan.duration.ar,plan.duration.fr,plan.tier,plan.type,plan.planType,plan.networkName,plan.networkType,plan.dataGb,plan.validityDays]))continue
      out.push({id:`esim:${country.slug}:${plan.id}`,title:`eSIM ${country.name[language]}`,subtitle:`${plan.data[language]} · ${plan.duration[language]}${plan.tier?' · '+plan.tier:''}`,price:`${plan.price} ${language==='ar'?'أوقية جديدة':'MRU'}`,href:`/esim/${encodeURIComponent(country.slug)}?plan=${encodeURIComponent(plan.id)}`,available:true})
    }
  }
  return out
}
