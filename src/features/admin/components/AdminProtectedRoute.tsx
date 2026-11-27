import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useLanguage } from '../../../i18n/LanguageContext'

type Factor = { id: string; friendly_name?: string }
type View = { kind: 'loading' } | { kind: 'allowed' } | { kind: 'denied' } | { kind: 'error' } | { kind: 'mfa'; factors: Factor[] }
type Enrollment = { id: string; qr: string; secret: string }
function AdminProtectedRoute() {
  const location = useLocation()
  const { language } = useLanguage()
  const ar = language === 'ar'
  const t = (a: string, f: string) => ar ? a : f
  const [view, setView] = useState<View>({ kind: 'loading' })
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [selected, setSelected] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const generation = useRef(0)
  const userId = useRef<string | null>(null)
  const check = useCallback(async () => {
    const version = ++generation.current
    const commit = (next: View) => { if (generation.current === version) setView(next) }
    try {
      const { data, error: userError } = await supabase.auth.getUser()
      if (generation.current !== version) return
      if (userError || !data.user) { userId.current = null; commit({ kind: 'denied' }); return }
      if (userId.current !== data.user.id) { setEnrollment(null); setCode(''); setSelected('') }
      userId.current = data.user.id
      const { data: admin, error: adminError } = await supabase.from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle()
      if (generation.current !== version) return
      if (adminError) { commit({ kind: 'error' }); return }
      if (!admin) { commit({ kind: 'denied' }); return }
      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (assuranceError || !assurance) { commit({ kind: 'error' }); return }
      if (assurance.currentLevel === 'aal2' && assurance.nextLevel === 'aal2') { commit({ kind: 'allowed' }); return }
      const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
      if (generation.current !== version) return
      if (factorError || !factors) { commit({ kind: 'error' }); return }
      if (!factors.totp.length && assurance.nextLevel === 'aal2') { commit({ kind: 'error' }); return }
      commit({ kind: 'mfa', factors: factors.totp.map(f => ({ id: f.id, friendly_name: f.friendly_name || undefined })) })
    } catch { commit({ kind: 'error' }) }
  }, [])
  useEffect(() => {
    let timer: number | undefined
    void check()
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return
      if (!session || session.user.id !== userId.current) {
        ++generation.current; setView({ kind: 'loading' }); setEnrollment(null); setCode(''); setSelected('')
      }
      window.clearTimeout(timer)
      timer = window.setTimeout(() => { void check() }, 0)
    })
    return () => { ++generation.current; window.clearTimeout(timer); data.subscription.unsubscribe() }
  }, [check])
  const enroll = async () => {
    if (busy || view.kind !== 'mfa' || view.factors.length || enrollment) return
    setBusy(true); setError(false)
    try {
      const { data, error: e } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `TEO Admin ${Date.now()}` })
      if (e || !data) throw e || new Error('Enrollment failed')
      const qr = data.totp.qr_code.startsWith('data:image/svg+xml') ? data.totp.qr_code : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data.totp.qr_code)
      setEnrollment({ id: data.id, qr, secret: data.totp.secret })
    } catch { setError(true) } finally { setBusy(false) }
  }
  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || view.kind !== 'mfa' || !/^\d{6}$/.test(code)) return
    const factorId = enrollment?.id || (view.factors.some(f => f.id === selected) ? selected : view.factors[0]?.id)
    if (!factorId) return
    setBusy(true); setError(false)
    try {
      const { data, error: e } = await supabase.auth.mfa.challenge({ factorId })
      if (e || !data) throw e || new Error('Challenge failed')
      const result = await supabase.auth.mfa.verify({ factorId, challengeId: data.id, code })
      if (result.error) throw result.error
      setEnrollment(null); setCode(''); await check()
    } catch { setError(true); setCode('') } finally { setBusy(false) }
  }
  const logout = async () => {
    if (busy) return
    setBusy(true); setError(false)
    try { const result = await supabase.auth.signOut({ scope: 'local' }); if (result.error) throw result.error; setView({ kind: 'denied' }) }
    catch { setError(true) } finally { setBusy(false) }
  }
  if (view.kind === 'loading') return <main className="flex min-h-screen items-center justify-center bg-slate-950"><div className="h-9 w-9 animate-spin rounded-full border-4 border-white/20 border-t-blue-500" /></main>
  if (view.kind === 'denied') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (view.kind === 'allowed') return <Outlet />
  return <main dir={ar ? 'rtl' : 'ltr'} className="flex min-h-screen items-center justify-center bg-[#050b16] p-4 text-white">
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl">
      <p className="text-xs font-black tracking-wider text-blue-400">TEO SECURITY PRO · MFA</p>
      <h1 className="mt-3 text-xl font-black">{t('التحقق الثنائي للإدارة', 'Vérification à deux facteurs')}</h1>
      {view.kind === 'error' ? <><p className="mt-4 text-sm">{t('تعذر التحقق من الصلاحية الأمنية.', 'Vérification de sécurité indisponible.')}</p><button type="button" className="mt-4 rounded-xl bg-blue-600 p-3" onClick={() => void check()}>{t('إعادة المحاولة', 'Réessayer')}</button></> : <>
        {!view.factors.length && !enrollment && <><p className="mt-4 text-sm text-white/70">{t('اربط تطبيق المصادقة من جهاز موثوق. احتفظ بإمكانية الوصول إليه؛ قد تُغلق الجلسات الأخرى عند التفعيل.', 'Configurez un authentificateur depuis un appareil de confiance. Gardez son accès ; les autres sessions peuvent être fermées.')}</p><button type="button" disabled={busy} onClick={() => void enroll()} className="mt-5 w-full rounded-xl bg-blue-600 p-3 font-bold disabled:opacity-50">{t('إعداد المصادقة الثنائية', 'Configurer la MFA')}</button></>}
        {enrollment && <div className="mt-5 space-y-3"><p className="text-sm">{t('امسح رمز QR بتطبيق المصادقة. لا تشارك الرمز أو المفتاح.', 'Scannez le QR avec votre authentificateur. Ne partagez jamais le code ni la clé.')}</p><img className="mx-auto h-44 w-44 rounded-lg bg-white p-2" src={enrollment.qr} alt="QR authenticator" /><details className="text-xs"><summary>{t('إدخال المفتاح يدويًا', 'Saisie manuelle')}</summary><code dir="ltr" className="block break-all p-2">{enrollment.secret}</code></details></div>}
        {(enrollment || view.factors.length > 0) && <form onSubmit={verify} className="mt-5 space-y-3">
          {!enrollment && view.factors.length > 1 && <select className="w-full rounded-xl bg-slate-800 p-3" value={selected || view.factors[0].id} onChange={e => setSelected(e.target.value)}>{view.factors.map((f, i) => <option key={f.id} value={f.id}>{f.friendly_name || `Authenticator ${i + 1}`}</option>)}</select>}
          <label className="block text-sm">{t('رمز التطبيق (6 أرقام)', 'Code de l’application (6 chiffres)')}<input dir="ltr" autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="mt-2 w-full rounded-xl border border-white/20 bg-slate-900 p-3 text-center tracking-[0.4em]" /></label>
          <button disabled={busy || code.length !== 6} type="submit" className="w-full rounded-xl bg-blue-600 p-3 font-bold disabled:opacity-50">{t('تحقق', 'Vérifier')}</button>
        </form>}
      </>}
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{t('تعذر إتمام العملية. تحقق من الرمز أو حاول مجددًا.', 'Opération impossible. Vérifiez le code ou réessayez.')}</p>}
      <button type="button" disabled={busy} onClick={() => void logout()} className="mt-5 w-full rounded-xl border border-white/20 p-3 text-sm disabled:opacity-50">{t('تسجيل الخروج', 'Se déconnecter')}</button>
    </section>
  </main>
}
export default AdminProtectedRoute
