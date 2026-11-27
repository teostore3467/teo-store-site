import { useEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '../../../lib/supabase'

type Profile = { gender: string; birth_date: string; birth_place: string; birthday_opt_in: boolean; personalized_offers_opt_in: boolean }
const empty = (): Profile => ({ gender: '', birth_date: '', birth_place: '', birthday_opt_in: false, personalized_offers_opt_in: false })

export default function TeoClubProfile({ arabic }: { arabic: boolean }) {
  const t = (ar: string, fr: string) => arabic ? ar : fr
  const [profile, setProfile] = useState<Profile>(empty)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)
  const [notice, setNotice] = useState<{ ok: boolean; kind: 'load' | 'save' | 'clear' | 'date' | 'failed' } | null>(null)
  const lock = useRef(false)
  const today = new Date().toISOString().slice(0, 10)
  useEffect(() => {
    let active = true
    setLoading(true); setReady(false); setNotice(null)
    async function load() {
      try {
        const { data, error } = await supabase.rpc('teo_club_get_profile')
        if (error || !data || typeof data !== 'object') throw new Error('LOAD')
        if (!active) return
        setProfile({ gender: data.gender === 'male' || data.gender === 'female' ? data.gender : '', birth_date: data.birth_date ?? '', birth_place: data.birth_place ?? '', birthday_opt_in: data.birthday_opt_in === true, personalized_offers_opt_in: data.personalized_offers_opt_in === true })
        setReady(true)
      } catch { if (active) setNotice({ ok: false, kind: 'load' }) }
      finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [retry])
  async function persist(event?: FormEvent<HTMLFormElement>, clear = false) {
    event?.preventDefault()
    if (!ready || lock.current) return
    if (clear && !window.confirm(t('هل تريد حذف معلومات النادي وإلغاء الموافقات؟', 'Supprimer les informations du club et retirer vos consentements ?'))) return
    if (!clear && profile.birthday_opt_in && !profile.birth_date) { setNotice({ ok: false, kind: 'date' }); return }
    lock.current = true; setBusy(true); setNotice(null)
    try {
      const result = clear ? await supabase.rpc('teo_club_clear_profile') : await supabase.rpc('teo_club_save_profile', {
        p_gender: profile.gender || null, p_birth_date: profile.birth_date || null, p_birth_place: profile.birth_place.trim() || null,
        p_birthday_opt_in: profile.birthday_opt_in, p_personalized_offers_opt_in: profile.personalized_offers_opt_in,
      })
      if (result.error || result.data !== true) throw new Error('SAVE')
      if (clear) setProfile(empty())
      setNotice({ ok: true, kind: clear ? 'clear' : 'save' })
    } catch { setNotice({ ok: false, kind: 'failed' }) }
    finally { lock.current = false; setBusy(false) }
  }
  const field = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900'
  const messages = { load: t('تعذر تحميل المعلومات. حاول مجددًا.', 'Chargement impossible. Réessayez.'), save: t('تم حفظ معلوماتك.', 'Informations enregistrées.'), clear: t('تم حذف معلومات النادي والموافقات.', 'Informations et consentements supprimés.'), date: t('أدخل تاريخ الميلاد لاستقبال التهاني.', 'Indiquez votre date de naissance pour les vœux.'), failed: t('تعذر الحفظ. تحقق من البيانات وحاول مجددًا.', 'Enregistrement impossible. Vérifiez les informations et réessayez.') }
  return <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs font-black text-blue-600">TEO CUSTOMER CLUB</p>
    <h2 className="mt-2 text-lg font-black text-slate-950">{t('عائلة TEO STORE', 'Famille TEO STORE')}</h2>
    <p className="mt-2 text-xs leading-5 text-slate-500">{t('معلومات اختيارية وخاصة. نستخدمها للإحصائيات، وللتهاني والعروض بعد موافقتك. يمكنك حذفها في أي وقت. تظهر التهاني والعروض في إشعارات حسابك عند تفعيلها من الإدارة.', 'Informations facultatives et privées, utilisées pour les statistiques et, avec votre accord, les vœux et offres. Vous pouvez les supprimer à tout moment. Les vœux et offres apparaissent dans les notifications du compte lorsque ces fonctions sont activées.')}</p>
    {loading ? <p className="mt-4 text-sm" role="status">{t('جارٍ التحميل…', 'Chargement…')}</p> : !ready ? <button type="button" className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" onClick={() => setRetry(v => v + 1)}>{t('إعادة المحاولة', 'Réessayer')}</button> : <form className="mt-5 space-y-4" onSubmit={e => void persist(e)}>
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
        <label className="block text-sm font-semibold text-slate-700">{t('الجنس', 'Genre')}<select className={field} value={profile.gender} onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}><option value="">{t('غير محدد', 'Non renseigné')}</option><option value="male">{t('رجل', 'Homme')}</option><option value="female">{t('امرأة', 'Femme')}</option></select></label>
        <label className="block text-sm font-semibold text-slate-700">{t('تاريخ الميلاد', 'Date de naissance')}<input className={field} dir="ltr" type="date" min="1900-01-01" max={today} value={profile.birth_date} onChange={e => { const value = e.target.value; setProfile(p => ({ ...p, birth_date: value, birthday_opt_in: value ? p.birthday_opt_in : false })) }}/></label>
        <label className="block text-sm font-semibold text-slate-700">{t('مكان الميلاد', 'Lieu de naissance')}<input className={field} maxLength={150} placeholder={t('المدينة، الدولة', 'Ville, pays')} value={profile.birth_place} onChange={e => setProfile(p => ({ ...p, birth_place: e.target.value }))}/></label>
        <label className="flex items-start gap-3 text-sm"><input className="mt-1 h-4 w-4 accent-blue-600" type="checkbox" disabled={!profile.birth_date} checked={profile.birthday_opt_in} onChange={e => setProfile(p => ({ ...p, birthday_opt_in: e.target.checked }))}/><span>{t('أوافق على استقبال تهاني وهدايا عيد الميلاد عند توفرها', 'Je souhaite recevoir les vœux et cadeaux d’anniversaire lorsqu’ils seront disponibles')}</span></label>
        <label className="flex items-start gap-3 text-sm"><input className="mt-1 h-4 w-4 accent-blue-600" type="checkbox" checked={profile.personalized_offers_opt_in} onChange={e => setProfile(p => ({ ...p, personalized_offers_opt_in: e.target.checked }))}/><span>{t('أوافق على العروض المخصصة عند توفرها', 'Je souhaite recevoir les offres personnalisées lorsqu’elles seront disponibles')}</span></label>
        <div className="flex flex-wrap gap-2"><button type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-50">{busy ? t('جارٍ المعالجة…', 'Traitement…') : t('حفظ المعلومات', 'Enregistrer')}</button><button type="button" onClick={() => void persist(undefined, true)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-rose-700">{t('حذف معلومات النادي', 'Effacer mes informations')}</button></div>
      </fieldset>
    </form>}
    {notice && <p role="status" className={`mt-3 text-sm ${notice.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{messages[notice.kind]}</p>}
  </section>
}
