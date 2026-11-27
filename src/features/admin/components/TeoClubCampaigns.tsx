import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Audience = 'all' | 'male' | 'female' | 'birthday'
type Coupon = { id: string; code: string; active: boolean; audience: Audience; esim: boolean }
type Config = { coupons: Coupon[]; birthday_enabled: boolean; birthday_coupon_id: string | null; cron_available: boolean }
export default function TeoClubCampaigns({ arabic }: { arabic: boolean }) {
  const t = (ar: string, fr: string) => arabic ? ar : fr
  const [config, setConfig] = useState<Config | null>(null)
  const [selected, setSelected] = useState('')
  const [audience, setAudience] = useState<Audience>('all')
  const [birthday, setBirthday] = useState(false)
  const [gift, setGift] = useState('')
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  const [notice, setNotice] = useState<{ ok: boolean; ar: string; fr: string } | null>(null)
  const lock = useRef(false)
  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const { data, error } = await supabase.rpc('teo_club_admin_campaigns')
        if (error || !data || !Array.isArray(data.coupons)) throw new Error('LOAD')
        if (!alive) return
        const next = data as Config
        setConfig(next); setBirthday(next.birthday_enabled); setGift(next.birthday_coupon_id || '')
        setSelected(''); setAudience('all')
      } catch { if (alive) { setConfig(null); setNotice({ ok: false, ar: 'تعذر تحميل إعدادات النادي.', fr: 'Paramètres du club indisponibles.' }) } }
    }
    void load()
    return () => { alive = false }
  }, [version])
  const labels: Record<Audience, string> = { all: t('جميع الزبائن','Tous les clients'), male: t('الرجال الموافقون','Hommes (opt-in)'), female: t('النساء الموافقن','Femmes (opt-in)'), birthday: t('يوم الميلاد (بموافقة)','Jour anniversaire (opt-in)') }
  const coupon = config?.coupons.find(c => c.id === selected)
  const birthCoupons = config?.coupons.filter(c => c.audience === 'birthday' && !c.esim) ?? []
  async function action(kind: 'audience' | 'settings' | 'birthday' | 'offer') {
    if (!config || lock.current) return
    if (kind === 'audience' && (!coupon || !window.confirm(t('تغيير أهلية هذا الكوبون للطلبات القادمة؟','Modifier l’éligibilité de ce coupon pour les prochaines commandes ?')))) return
    if (kind === 'offer' && (!coupon || !window.confirm(t('إرسال إشعار العرض الآن إلى الزبائن الموافقين والمؤهلين؟','Envoyer maintenant aux clients éligibles et consentants ?')))) return
    if (kind === 'birthday' && !window.confirm(t('إرسال تهاني اليوم إلى الزبائن الموافقين؟','Envoyer les vœux du jour aux clients consentants ?'))) return
    lock.current = true; setBusy(true); setNotice(null)
    try {
      const result = kind === 'audience' ? await supabase.rpc('teo_club_admin_set_audience', { p_coupon: selected, p_audience: audience }) :
        kind === 'settings' ? await supabase.rpc('teo_club_admin_birthday_settings', { p_enabled: birthday, p_coupon: gift || null }) :
        kind === 'birthday' ? await supabase.rpc('teo_club_admin_send_birthdays') : await supabase.rpc('teo_club_admin_send_offer', { p_coupon: selected })
      if (result.error) throw new Error('SAVE')
      if (kind === 'birthday' || kind === 'offer') {
        const count = Number(result.data)
        if (!Number.isInteger(count) || count < 0) throw new Error('RESULT')
        setNotice({ ok: true, ar: `تم إرسال ${count} إشعار جديد.`, fr: `${count} nouvelle(s) notification(s) envoyée(s).` })
      } else {
        if (result.data !== true) throw new Error('RESULT')
        setNotice({ ok: true, ar: 'تم الحفظ.', fr: 'Enregistré.' }); setVersion(v => v + 1)
      }
    } catch { setNotice({ ok: false, ar: 'تعذر تنفيذ العملية. تحقق من الإعدادات وحاول مجددًا.', fr: 'Action impossible. Vérifiez les paramètres et réessayez.' }) }
    finally { lock.current = false; setBusy(false) }
  }
  const field = 'mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
  const button = 'rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-40'
  return <section className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <h3 className="font-black">{t('تهاني الميلاد والعروض المخصصة','Anniversaires & offres ciblées')}</h3>
    <p className="mt-2 text-xs opacity-75">{t('استخدم الكوبونات الرقمية الموجودة، دون تغيير السعر أو شروط الربح. الأهلية مبنية على معلومات الزبون المصرّح بها وموافقته.','Utilisez les coupons numériques existants, sans modifier les prix ni les limites de marge. Éligibilité déclarative et avec consentement.')}</p>
    {!config ? <button type="button" onClick={() => setVersion(v => v+1)} className="mt-3 rounded-xl border px-3 py-2 text-xs">{t('تحميل / إعادة المحاولة','Charger / réessayer')}</button> : <fieldset disabled={busy} className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-xl border p-3" style={{borderColor:'var(--color-border)'}}>
        <h4 className="font-bold">{t('جمهور الكوبون','Public du coupon')}</h4>
        <label className="block text-sm">{t('اختر كوبونًا موجودًا','Choisir un coupon existant')}<select className={field} value={selected} onChange={e => { const c = config.coupons.find(v => v.id === e.target.value); setSelected(e.target.value); setAudience(c?.audience ?? 'all') }}><option value="">—</option>{config.coupons.filter(c => !c.esim).map(c => <option key={c.id} value={c.id}>{c.code} — {c.active ? t('نشط','Actif') : t('غير نشط','Inactif')}</option>)}</select></label>
        <label className="block text-sm">{t('الجمهور','Public cible')}<select className={field} value={audience} onChange={e => setAudience(e.target.value as Audience)}>{(Object.keys(labels) as Audience[]).map(k => <option key={k} value={k}>{labels[k]}</option>)}</select></label>
        <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={!coupon || audience===coupon.audience} onClick={() => void action('audience')}>{t('حفظ الجمهور','Enregistrer le public')}</button><button type="button" className={button} disabled={!coupon?.active || !['male','female'].includes(coupon.audience) || audience!==coupon.audience} onClick={() => void action('offer')}>{t('إرسال العرض','Envoyer l’offre')}</button></div>
        <p className="text-xs opacity-75">{t('يتم إرسال إشعار واحد لكل زبون لكل كوبون. أنشئ الكوبونات والأسعار من نظام العروض الحالي.','Une notification par client et par coupon. Créez les coupons dans le système d’offres existant.')}</p>
      </div>
      <div className="space-y-3 rounded-xl border p-3" style={{borderColor:'var(--color-border)'}}>
        <h4 className="font-bold">{t('أعياد الميلاد','Anniversaires')}</h4>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={birthday} onChange={e => setBirthday(e.target.checked)}/>{t('تفعيل تهاني الميلاد','Activer les vœux')}</label>
        <label className="block text-sm">{t('كوبون هدية اختياري','Coupon cadeau facultatif')}<select className={field} value={gift} onChange={e => setGift(e.target.value)}><option value="">{t('تهنئة فقط','Vœux uniquement')}</option>{birthCoupons.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}</select></label>
        <p className="text-xs opacity-75">{config.cron_available ? t('مهمة يومية مجدولة عند تفعيلها.','Tâche quotidienne si activée.') : t('Cron غير متاح؛ استخدم زر إرسال اليوم يدويًا.','Cron indisponible : utilisez l’envoi manuel.')}</p>
        <div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={() => void action('settings')}>{t('حفظ الإعدادات','Enregistrer')}</button><button type="button" className={button} disabled={!config.birthday_enabled || birthday!==config.birthday_enabled || gift!==(config.birthday_coupon_id||'')} onClick={() => void action('birthday')}>{t('إرسال تهاني اليوم','Envoyer les vœux du jour')}</button></div>
        <p className="text-xs opacity-75">{t('تهنئة واحدة لكل سنة. صلاحية الكوبون وعدد استخداماته حسب إعداداته الأصلية.','Un vœu par an. Validité et limites du coupon selon ses paramètres d’origine.')}</p>
      </div>
    </fieldset>}
    {busy && <p role="status" className="mt-3 text-sm">{t('جارٍ التنفيذ…','Traitement…')}</p>}
    {notice && <p role="status" className={`mt-3 text-sm ${notice.ok?'text-emerald-600':'text-rose-600'}`}>{arabic?notice.ar:notice.fr}</p>}
  </section>
}
