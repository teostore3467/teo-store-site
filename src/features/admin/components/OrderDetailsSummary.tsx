type Order = {
  service_slug: string; group_name: string | null; plan_label: string;
  quantity: number; unit_price: number; total_amount: number; currency: string;
  customer_email: string | null; teo_order_details: Record<string, unknown> | null;
}
function text(value: unknown): string { return typeof value === 'string' ? value.trim() : typeof value === 'number' && Number.isFinite(value) ? String(value) : '' }
export default function OrderDetailsSummary({order, ar}: {order: Order; ar: boolean}) {
  const t=(a:string,f:string)=>ar?a:f
  const d=order.teo_order_details ?? {}
  const unknown=t('غير مسجل','Non enregistré')
  const localized=(name:string)=>text(d[`${name}_${ar?'ar':'fr'}`]) || text(d[`${name}_${ar?'fr':'ar'}`])
  const units:Record<string,[string,string]>={minutes:['دقيقة','min'],hours:['ساعة','h'],days:['يوم','j'],weeks:['أسبوع','sem.'],months:['شهر','mois'],years:['سنة','an(s)']}
  const unit=units[text(d.duration_unit)]
  const duration=text(d.duration_value) && unit ? `${text(d.duration_value)} ${unit[ar?0:1]}` : localized('duration') || (text(d.validity_days) ? `${text(d.validity_days)} ${t('يوم','jours')}` : '')
  const warranty= d.warranty_full_subscription===true ? t('طيلة مدة الاشتراك','Toute la durée de l’abonnement') : localized('warranty') || (text(d.warranty_days) ? `${text(d.warranty_days)} ${t('يوم','jours')}` : '')
  const delivery=text(d.delivery_minutes) ? (Number(d.delivery_minutes)===0?t('فوري','Immédiat'):`${text(d.delivery_minutes)} ${t('دقيقة','min')}`) : ''
  const price=(value:number)=>`${new Intl.NumberFormat(ar?'ar-MR-u-nu-latn':'fr-FR',{maximumFractionDigits:2}).format(Number(value))} ${order.currency}`
  const esim=order.service_slug==='esim'
  const rows:[string,string][]=[
    [esim?t('الدولة / المجموعة','Pays / groupe'):t('نوع الحساب / المجموعة','Type de compte / groupe'),localized('group') || text(order.group_name) || unknown],
    [t('الباقة','Offre'),localized('plan') || text(order.plan_label) || unknown],
    [t('المدة','Durée'),duration || unknown],
    [t('الضمان','Garantie'),warranty || unknown],
    [t('التسليم المتوقع','Délai de livraison'),delivery || unknown],
    [t('الكمية','Quantité'),text(order.quantity)],
    [t('سعر الوحدة','Prix unitaire'),price(order.unit_price)],
    [t('الإجمالي المسجل','Total enregistré'),price(order.total_amount)],
    [t('بريد الزبون','E-mail du client'),text(order.customer_email)||unknown],
  ]
  if (esim) { rows.splice(3,0,[t('الإنترنت','Données'),localized('data') || (d.unlimited===true?t('غير محدود','Illimité'):text(d.data_gb)?`${text(d.data_gb)} GB`:unknown)],[t('الشبكة','Réseau'),text(d.network_type)||unknown]) }
  return <section dir={ar?'rtl':'ltr'} className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700" style={{color:'var(--color-text)',backgroundColor:'var(--color-surface)'}}>
    <h3 className="font-black">{t('تفاصيل الطلب والباقة','Détails de la commande et de l’offre')}</h3>
    <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{rows.map(([label,value])=><div key={label} className="min-w-0 rounded-xl p-3" style={{backgroundColor:'var(--color-background)'}}><dt className="text-xs opacity-70">{label}</dt><dd className="mt-1 break-words text-sm font-bold">{value}</dd></div>)}</dl>
    {!order.teo_order_details && <p className="mt-3 text-xs opacity-70">{t('طلب سابق: نعرض المعلومات المسجلة فقط، ولا نستنتج مدة أو ضمانًا من الباقة الحالية.','Commande antérieure : seules les informations enregistrées sont affichées, sans déduire la durée ou la garantie du catalogue actuel.')}</p>}
  </section>
}
