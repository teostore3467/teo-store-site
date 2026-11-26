import type { FlashOffer } from '../utils/useFlashOffers'
export default function FlashOfferInfo({offer,now,ar}:{offer:FlashOffer;now:number;ar:boolean}){
  const seconds=Math.max(0,Math.floor((Date.parse(offer.ends_at)-now)/1000))
  const time=[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':')
  return <span className="block space-y-1 text-xs"><span className="block font-bold text-amber-700 dark:text-amber-300">{ar?'عرض مؤقت':'Vente flash'} {offer.show_discount_badge?`−${offer.discount_percent}%`:''}</span><span className="block text-slate-500 line-through dark:text-slate-400">{offer.original_price} MRU</span><span className="block text-base font-black text-blue-600 dark:text-blue-300">{offer.flash_price} MRU</span><span className="block text-slate-600 dark:text-slate-300" dir="ltr">{time}</span>{offer.quantity_remaining!==null&&<span className="block text-slate-600 dark:text-slate-300">{ar?'المتبقي':'Restants'} : {offer.quantity_remaining}</span>}</span>
}
