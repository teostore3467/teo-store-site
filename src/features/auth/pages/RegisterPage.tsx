import AuthBrandLogo from '../AuthBrandLogo'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'
import { safeAuthRedirect, useTeoCaptcha } from '../TeoCaptcha'

type SocialProvider = 'google' | 'facebook'



function SocialIcon({ provider }: { provider: SocialProvider }) {
  if (provider === 'facebook') {
    return <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1877F2] text-sm font-black text-white">f</span>
  }
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.87 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.94 23.94 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
}

function RegisterPage() {
  const { language, t } = useLanguage()
  const isArabic = language === 'ar'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectPath = safeAuthRedirect(searchParams.get('redirect'))
  const captcha = useTeoCaptcha()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const busy = isSubmitting || socialLoading !== null
  const loginLink = redirectPath === '/' ? '/connexion' : `/connexion?redirect=${encodeURIComponent(redirectPath)}`

  const handleSocialLogin = async (provider: SocialProvider) => {
    if (busy) return
    setSocialLoading(provider)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const destination = new URL(redirectPath, window.location.origin)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: destination.toString() },
      })
      if (error) throw error
    } catch (error) {
      console.error(`${provider} sign-up failed:`, error)
      setErrorMessage(isArabic ? `تعذر بدء التسجيل بواسطة ${provider === 'google' ? 'Google' : 'Facebook'}. حاول مجددًا.` : `Impossible de démarrer l'inscription avec ${provider === 'google' ? 'Google' : 'Facebook'}. Réessayez.`)
      setSocialLoading(null)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const normalizedName = fullName.trim()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      setErrorMessage(isArabic ? 'يرجى إكمال جميع الحقول.' : 'Veuillez compléter tous les champs.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage(isArabic ? 'كلمتا المرور غير متطابقتين.' : 'Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 12) {
      setErrorMessage(isArabic ? 'يجب أن تحتوي كلمة المرور على 12 حرفًا على الأقل.' : 'Le mot de passe doit contenir au moins 12 caractères.')
      return
    }
    if (!captcha.ready) { setErrorMessage(isArabic ? 'التحقق الأمني قيد الانتظار أو غير متاح. أعد المحاولة.' : 'Vérification de sécurité en attente ou indisponible. Réessayez.'); return }
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { full_name: normalizedName }, captchaToken: captcha.token },
      })
      if (error) throw error
      if (data.session && data.user) {
        navigate(redirectPath, { replace: true })
        return
      }
      if (data.user) {
        setSuccessMessage(isArabic ? 'تم إنشاء حسابك. تحقق من بريدك الإلكتروني لتأكيد الحساب، ثم سجّل الدخول لمتابعة طلبك.' : 'Votre compte a été créé. Vérifiez votre e-mail pour confirmer votre compte, puis connectez-vous pour poursuivre votre commande.')
        setPassword('')
        setConfirmPassword('')
        return
      }
      throw new Error('Impossible de créer le compte')
    } catch (error) {
      console.error('Customer registration failed:', error)
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('already registered') || message.includes('user already registered')) {
        setErrorMessage(isArabic ? 'يوجد حساب مسجل بالفعل بهذا البريد الإلكتروني.' : 'Un compte existe déjà avec cette adresse e-mail.')
      } else {
        setErrorMessage(isArabic ? 'تعذر إنشاء الحساب. تحقق من المعلومات وحاول مجددًا.' : 'Impossible de créer le compte. Vérifiez vos informations et réessayez.')
      }
    } finally { captcha.reset(); setIsSubmitting(false) }
  }

  return (
    <main className="min-h-[calc(100vh-140px)] bg-[#f7f9fc] py-8 sm:py-12 lg:py-16">
      <Container>
        <div className="mx-auto grid max-w-5xl items-stretch gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden overflow-hidden rounded-[28px] p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.14)] lg:flex lg:flex-col lg:justify-between" style={{ background: 'linear-gradient(135deg, #06101f 0%, #101d44 58%, #312e81 100%)' }}>
            <div>
              <div className="flex items-center gap-3">
                <AuthBrandLogo dark className="h-12 w-12" />
                <div><p className="text-sm font-black">TEO STORE</p><p className="mt-0.5 text-[10px] font-semibold text-white/45">{isArabic ? 'الخدمات الرقمية' : 'Services numériques'}</p></div>
              </div>
              <div className="mt-14 max-w-md">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">{isArabic ? 'ابدأ مع TEO STORE' : 'COMMENCEZ AVEC TEO STORE'}</p>
                <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">{isArabic ? 'أنشئ حسابك وتابع خدماتك من مكان واحد.' : 'Créez votre compte et gérez vos services au même endroit.'}</h2>
                <p className="mt-4 max-w-sm text-sm leading-7 text-white/50">{isArabic ? 'حساب واحد لمتابعة الطلبات والوصول إلى الخدمات الرقمية بسهولة وأمان.' : 'Un seul compte pour suivre vos commandes et accéder facilement à vos services numériques.'}</p>
              </div>
            </div>
            <div className="mt-12 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] font-bold text-white/55">✓ {isArabic ? 'متابعة الطلبات' : 'Suivi des commandes'}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] font-bold text-white/55">✓ {isArabic ? 'خدمات رقمية' : 'Services numériques'}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] font-bold text-white/55">✓ {isArabic ? 'دعم TEO STORE' : 'Support TEO STORE'}</span>
            </div>
          </section>
          <section className="flex items-center">
            <div className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:rounded-[28px]">
              <div className="p-5 sm:p-7 lg:p-8">
                <div className="flex items-center gap-3 lg:hidden">
                  <AuthBrandLogo className="h-11 w-11" />
                  <div><p className="text-sm font-black text-slate-950">TEO STORE</p><p className="mt-0.5 text-[9px] font-semibold text-slate-400">{isArabic ? 'الخدمات الرقمية' : 'Services numériques'}</p></div>
                </div>
                <div className="mt-7 lg:mt-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">{isArabic ? 'حساب جديد' : 'NOUVEAU COMPTE'}</p>
                  <h1 className="mt-2 text-[28px] font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">{t.auth.registerTitle}</h1>
                  <p className="mt-2 max-w-md text-[11px] leading-6 text-slate-500 sm:text-sm">{t.auth.registerDescription}</p>
                </div>
                <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                  <label className="block"><span className="text-[10px] font-black text-slate-700 sm:text-xs">{t.auth.fullName}</span><input type="text" autoComplete="name" value={fullName} onChange={(event) => { setFullName(event.target.value); setErrorMessage(null) }} placeholder={t.auth.namePlaceholder} className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50" /></label>
                  <label className="block"><span className="text-[10px] font-black text-slate-700 sm:text-xs">{t.auth.email}</span><input type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setErrorMessage(null) }} placeholder="exemple@email.com" className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50" /></label>
                  <label className="block"><span className="text-[10px] font-black text-slate-700 sm:text-xs">{t.auth.password} · {isArabic ? '12 حرفًا على الأقل' : '12 caractères minimum'}</span><input type="password" minLength={12} autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setErrorMessage(null) }} placeholder={t.auth.createPassword} className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50" /></label>
                  <label className="block"><span className="text-[10px] font-black text-slate-700 sm:text-xs">{t.auth.confirmPassword}</span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setErrorMessage(null) }} placeholder={t.auth.confirmPasswordPlaceholder} className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50" /></label>
                  {errorMessage && <div role="alert" className="rounded-[14px] border border-rose-100 bg-rose-50 p-3"><p className="text-[10px] font-bold leading-5 text-rose-600">{errorMessage}</p></div>}
                  {successMessage && <div role="status" className="rounded-[14px] border border-emerald-100 bg-emerald-50 p-3"><p className="text-[10px] font-bold leading-5 text-emerald-700">{successMessage}</p><Link to={loginLink} className="mt-2 inline-flex text-[10px] font-black text-emerald-800 underline underline-offset-2">{isArabic ? 'الانتقال إلى تسجيل الدخول' : 'Aller à la connexion'}</Link></div>}
                  {captcha.widget}
                  <button type="submit" aria-busy={isSubmitting} disabled={busy} className={['flex h-12 w-full items-center justify-center rounded-[14px] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)]  active:scale-[0.97] active:brightness-90 disabled:cursor-wait disabled:opacity-70 gap-2 transition', busy ? 'cursor-not-allowed bg-blue-400' : 'bg-blue-600 hover:bg-blue-500'].join(' ')}>{isSubmitting && <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />}{isSubmitting ? (isArabic ? 'جارٍ إنشاء الحساب...' : 'Création...') : t.auth.createAccountButton}</button>
                </form>
                <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-slate-100" /><span className="text-[10px] font-black text-slate-400">{isArabic ? 'أو' : 'OU'}</span><div className="h-px flex-1 bg-slate-100" /></div>
                <div className="space-y-3">{(['google', 'facebook'] as const).map((provider) => <button key={provider} type="button" onClick={() => void handleSocialLogin(provider)} disabled={busy} aria-busy={socialLoading === provider} className="active:scale-[0.97] active:brightness-90 flex h-12 w-full items-center justify-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">{socialLoading === provider ? <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <SocialIcon provider={provider} />}<span>{socialLoading === provider ? (isArabic ? 'جارٍ الاتصال...' : 'Connexion...') : isArabic ? `المتابعة باستخدام ${provider === 'google' ? 'Google' : 'Facebook'}` : `Continuer avec ${provider === 'google' ? 'Google' : 'Facebook'}`}</span></button>)}</div>
                <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-slate-100" /><span className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-300">TEO STORE</span><div className="h-px flex-1 bg-slate-100" /></div>
                <p className="text-center text-xs text-slate-500 sm:text-sm">{isArabic ? 'لديك حساب بالفعل؟' : 'Vous avez déjà un compte ?'}<Link to={loginLink} className={isArabic ? 'mr-1 font-black text-blue-600 transition hover:text-blue-500' : 'ml-1 font-black text-blue-600 transition hover:text-blue-500'}>{isArabic ? 'تسجيل الدخول' : 'Se connecter'}</Link></p>
              </div>
            </div>
          </section>
        </div>
      </Container>
    </main>
  )
}

export default RegisterPage
