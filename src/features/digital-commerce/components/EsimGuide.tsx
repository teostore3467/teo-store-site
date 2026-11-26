import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Settings = { catalog_enabled?: boolean; checkout_enabled?: boolean; show_compatibility?: boolean; show_installation_guide?: boolean; show_terms?: boolean; compatible_devices_ar?: string; compatible_devices_fr?: string; installation_guide_ar?: string; installation_guide_fr?: string; terms_ar?: string; terms_fr?: string }
export function useEsimPublicSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  useEffect(() => {
    let live = true
    const load = async () => { const { data, error } = await supabase.rpc('teo_v5_get_esim_settings'); if (live) setSettings(error ? null : data as Settings) }
    void load()
    const timer = window.setInterval(load, 5000)
    window.addEventListener('focus', load)
    return () => { live = false; window.clearInterval(timer); window.removeEventListener('focus', load) }
  }, [])
  return settings
}
export default function EsimGuide({ ar, settings }: { ar: boolean; settings: Settings | null }) {
  const t = (a: string, f: string) => ar ? a : f
  const rows = [
    { title: t('الوصف', 'Description'), text: t('بعد الشراء وتأكيد الدفع، تتلقى بيانات تثبيت eSIM وفق الباقة: رمز QR أو بيانات التفعيل اليدوي وتعليمات الاستخدام. تأكد من تغطية الدولة أو المنطقة المختارة قبل الشراء.', 'Après achat et validation du paiement, vous recevez les données d’installation eSIM selon le forfait : code QR ou informations d’activation manuelle, avec les instructions. Vérifiez la couverture du pays ou de la région avant l’achat.'), show: true },
    { title: t('توافق الأجهزة', 'Compatibilité des appareils'), text: (ar ? settings?.compatible_devices_ar : settings?.compatible_devices_fr)?.trim() || t('تأكد من أن هاتفك يدعم eSIM وغير مقفل على مشغل آخر. تحقق من التوافق في إعدادات الهاتف قبل الشراء.', 'Vérifiez que votre appareil prend en charge les eSIM et est désimlocké. Vérifiez la compatibilité dans les paramètres avant l’achat.'), show: settings?.show_compatibility !== false },
    { title: t('تعليمات التثبيت والاستخدام', 'Installation et utilisation'), text: (ar ? settings?.installation_guide_ar : settings?.installation_guide_fr)?.trim() || t('1. اتصل بشبكة Wi-Fi أو 4G مستقرة قبل السفر.\n2. افتح إعدادات الشبكة الخلوية واختر إضافة eSIM.\n3. امسح رمز QR أو أدخل بيانات التفعيل يدويًا على iOS أو Android.\n4. اختر eSIM للبيانات عند الوصول، واتبع تعليمات الباقة بخصوص التجوال وبدء الصلاحية.', '1. Connectez-vous à un Wi-Fi ou à un réseau 4G stable avant le voyage.\n2. Ouvrez les paramètres du réseau mobile et ajoutez une eSIM.\n3. Scannez le code QR ou saisissez les données manuellement sur iOS ou Android.\n4. Sélectionnez l’eSIM pour les données à destination et respectez les instructions du forfait concernant l’itinérance et la validité.'), show: settings?.show_installation_guide !== false },
    { title: t('الشروط العامة', 'Conditions générales'), text: (ar ? settings?.terms_ar : settings?.terms_fr)?.trim() || t('راجع مدة الصلاحية والتغطية وحجم البيانات قبل الشراء. شروط التفعيل وإعادة الشحن وانتهاء صلاحية الشريحة تعتمد على الباقة والمزود. لا تحذف eSIM قبل انتهاء استخدامها، فقد لا يمكن إعادة تثبيتها.', 'Vérifiez la validité, la couverture et le volume de données avant achat. Les conditions d’activation, de recharge et d’expiration dépendent du forfait et du fournisseur. Ne supprimez pas l’eSIM avant la fin de son utilisation : sa réinstallation peut être impossible.'), show: settings?.show_terms !== false }
  ]
  return <section dir={ar ? 'rtl' : 'ltr'} className="mt-8 space-y-3" aria-label={t('معلومات eSIM','Informations eSIM')}>
    {rows.filter(r => r.show).map(r => <article key={r.title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="mb-3 text-base font-bold text-slate-950 sm:text-lg">{r.title}</h2><p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{r.text.split(/(https:\/\/[^\s]+)/g).map((part,i) => part.startsWith('https://') ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{part}</a> : part)}</p></article>)}
  </section>
}
