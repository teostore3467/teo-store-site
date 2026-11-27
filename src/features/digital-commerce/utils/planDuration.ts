// Display only: never mutate stored durations or infer a duration from an offer name.
export type DurationSource = { duration_value?: number | null; duration_unit?: string | null }
type Lang = 'ar' | 'fr'
const units: Record<string, [string,string,string,string,string]> = {
 minutes:['MINUTE','MINUTES','دقيقة','دقائق','دقيقة'], hours:['HEURE','HEURES','ساعة','ساعات','ساعة'],
 days:['JOUR','JOURS','يوم','أيام','يومًا'], weeks:['SEMAINE','SEMAINES','أسبوع','أسابيع','أسبوعًا'],
 months:['MOIS','MOIS','شهر','أشهر','شهرًا'], years:['AN','ANS','سنة','سنوات','سنة'],
}
const aliases: Record<string,string> = Object.fromEntries(Object.entries({
 minutes:['minute','minutes','min','دقيقة','دقائق'], hours:['hour','hours','heure','heures','h','ساعة','ساعات'],
 days:['day','days','jour','jours','يوم','أيام','ايام','يوما'], weeks:['week','weeks','semaine','semaines','أسبوع','اسبوع','أسابيع','اسابيع'],
 months:['month','months','mois','شهر','أشهر','اشهر','شهرا'], years:['year','years','an','ans','annee','annees','سنة','سنوات'],
}).flatMap(([key,values])=>values.map(v=>[v,key])))
export const westernDigits=(s:string)=>s.replace(/[٠-٩۰-۹]/g,c=>String(c.charCodeAt(0)-(c.charCodeAt(0)>=0x6f0?0x6f0:0x660)))
const normalized=(s:string)=>s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f]/g,'')
function unitKey(s:string){const key=normalized(s);return Object.hasOwn(aliases,key)?aliases[key]:''}
export function coverDuration(plan:DurationSource,lang:Lang){
 const n=Number(plan.duration_value), key=unitKey(plan.duration_unit??'');
 if(!Number.isSafeInteger(n)||n<=0||!key)return {number:'',unit:''};
 const labels=units[key];
 return {number:String(n),unit:labels[lang==='fr'?(n===1?0:1):n>=3&&n<=10?3:n>10?4:2]};
}
export function durationText(plan:DurationSource,lang:Lang){const d=coverDuration(plan,lang);return d.number?`${d.number} ${lang==='fr'?d.unit.toLowerCase():d.unit}`:''}
// A pure legacy duration label may be normalized for text display only, never used to create a badge.
export function isDurationLabel(s:string){const v=westernDigits(s).trim();const m=v.match(/^(\d+)\s*([^\d]+)$/u)||v.match(/^([^\d]+?)\s*(\d+)$/u);if(!m)return false;return /^\d+$/.test(m[1])?!!unitKey(m[2]):!!unitKey(m[1]);}
