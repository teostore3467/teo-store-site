import TeoClubCampaigns from './TeoClubCampaigns'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

const keys = ['total_customers','men','women','gender_unspecified','birthdays_today','birthday_opt_ins','personalized_offers_opt_ins','new_customers_30_days','incomplete_profiles'] as const
type Stats = Record<typeof keys[number], number>
export default function TeoClubStats({ arabic }: { arabic: boolean }) {
  const t = (ar: string, fr: string) => arabic ? ar : fr
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true); setError(false)
    async function load() {
      try {
        const { data, error } = await supabase.rpc('teo_club_admin_stats')
        if (error || !data || !keys.every(k => typeof data[k] === 'number' && Number.isFinite(data[k]) && data[k] >= 0)) throw new Error('STATS')
        if (active) setStats(data as Stats)
      } catch { if (active) { setError(true); setStats(null) } }
      finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [version])
  const labels: Record<typeof keys[number], string> = {
    total_customers: t('إجمالي الزبائن','Total clients'), men: t('الرجال','Hommes'), women: t('النساء','Femmes'), gender_unspecified: t('الجنس غير محدد','Genre non renseigné'), birthdays_today: t('أعياد الميلاد اليوم (بموافقة)','Anniversaires aujourd’hui (opt-in)'), birthday_opt_ins: t('الموافقون على التهاني','Inscrits aux vœux'), personalized_offers_opt_ins: t('الموافقون على العروض المخصصة','Inscrits aux offres ciblées'), new_customers_30_days: t('زبائن جدد خلال 30 يومًا','Nouveaux sur 30 jours'), incomplete_profiles: t('ملفات غير مكتملة','Profils incomplets'),
  }
  const number = (v: number) => v.toLocaleString('en-US')
  const pct = (v: number) => stats && stats.total_customers ? (100 * v / stats.total_customers).toFixed(1) + '%' : '0%'
  return <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: 'var(--color-border, #94a3b8)', backgroundColor: 'var(--color-surface, transparent)' }}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-black">TEO CUSTOMER CLUB</h3><button type="button" disabled={loading} onClick={() => setVersion(v => v + 1)} className="rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-50">{loading ? t('جارٍ التحميل…','Chargement…') : t('تحديث الإحصائيات','Actualiser')}</button></div>
    <p className="teo-dash-muted mt-2 text-xs">{t('حسابات الزبائن فقط، دون الإدارة. البيانات اختيارية والتوزيع حسب التصريح الشخصي.', 'Comptes clients hors administrateurs. Données facultatives et déclaratives.')}</p>
    {error && <p role="alert" className="mt-3 text-sm text-rose-600">{t('تعذر تحميل الإحصائيات. حاول مجددًا.', 'Statistiques indisponibles. Réessayez.')}</p>}
    {stats && <><div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3">{keys.map(k => <div key={k} className="rounded-xl border p-3" style={{ borderColor: 'var(--color-border, #94a3b8)' }}><p className="teo-dash-muted text-xs">{labels[k]}</p><p className="mt-2 text-2xl font-black">{number(stats[k])}</p></div>)}</div><div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden="true"><span className="bg-blue-600" style={{ width: pct(stats.men) }}/><span className="bg-pink-500" style={{ width: pct(stats.women) }}/><span className="bg-slate-400" style={{ width: pct(stats.gender_unspecified) }}/></div><div className="mt-2 flex flex-wrap gap-3 text-xs"><span>{labels.men}: {pct(stats.men)}</span><span>{labels.women}: {pct(stats.women)}</span><span>{labels.gender_unspecified}: {pct(stats.gender_unspecified)}</span></div></>}
    <TeoClubCampaigns arabic={arabic} />
  </div>
}
