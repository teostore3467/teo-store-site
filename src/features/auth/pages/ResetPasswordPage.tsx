import { Link } from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'

function ResetPasswordPage() {
  const { language, t } = useLanguage()

  const isArabic = language === 'ar'

  return (
    <main className="min-h-[calc(100vh-140px)] bg-[#f7f9fc] py-8 sm:py-12 lg:py-16">
      <Container>
        <div className="mx-auto grid max-w-5xl items-stretch gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section
            className="hidden overflow-hidden rounded-[28px] p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.14)] lg:flex lg:flex-col lg:justify-between"
            style={{
              background:
                'linear-gradient(135deg, #06101f 0%, #101d44 58%, #312e81 100%)',
            }}
          >
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[16px] text-lg font-black text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)]"
                  style={{
                    background:
                      'linear-gradient(145deg, #2563eb 0%, #4f46e5 100%)',
                  }}
                >
                  T
                </div>

                <div>
                  <p className="text-sm font-black">
                    TEO STORE
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold text-white/45">
                    {isArabic
                      ? 'الخدمات الرقمية'
                      : 'Services numériques'}
                  </p>
                </div>
              </div>

              <div className="mt-14 max-w-md">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">
                  {isArabic
                    ? 'تأمين الحساب'
                    : 'SÉCURISATION DU COMPTE'}
                </p>

                <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                  {isArabic
                    ? 'أنشئ كلمة مرور جديدة وآمنة لحسابك.'
                    : 'Créez un nouveau mot de passe sécurisé pour votre compte.'}
                </h2>

                <p className="mt-4 max-w-sm text-sm leading-7 text-white/50">
                  {isArabic
                    ? 'اختر كلمة مرور جديدة لحماية حسابك والوصول إلى خدماتك وطلباتك.'
                    : 'Choisissez un nouveau mot de passe pour protéger votre compte et accéder à vos commandes et services.'}
                </p>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] font-bold text-white/55">
                ✓{' '}
                {isArabic
                  ? 'حماية الحساب'
                  : 'Compte protégé'}
              </span>

              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] font-bold text-white/55">
                ✓{' '}
                {isArabic
                  ? 'وصول آمن'
                  : 'Accès sécurisé'}
              </span>

              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] font-bold text-white/55">
                ✓{' '}
                {isArabic
                  ? 'دعم TEO STORE'
                  : 'Support TEO STORE'}
              </span>
            </div>
          </section>

          <section className="flex items-center">
            <div className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:rounded-[28px]">
              <div className="p-5 sm:p-7 lg:p-8">
                <div className="flex items-center gap-3 lg:hidden">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-[15px] text-base font-black text-white shadow-[0_8px_24px_rgba(37,99,235,0.24)]"
                    style={{
                      background:
                        'linear-gradient(145deg, #2563eb 0%, #4f46e5 100%)',
                    }}
                  >
                    T
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-950">
                      TEO STORE
                    </p>

                    <p className="mt-0.5 text-[9px] font-semibold text-slate-400">
                      {isArabic
                        ? 'الخدمات الرقمية'
                        : 'Services numériques'}
                    </p>
                  </div>
                </div>

                <div className="mt-7 lg:mt-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">
                    {isArabic
                      ? 'كلمة مرور جديدة'
                      : 'NOUVEAU MOT DE PASSE'}
                  </p>

                  <h1 className="mt-2 text-[28px] font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
                    {t.auth.resetTitle}
                  </h1>

                  <p className="mt-2 max-w-md text-[11px] leading-6 text-slate-500 sm:text-sm">
                    {t.auth.resetDescription}
                  </p>
                </div>

                <form className="mt-7 space-y-4">
                  <label className="block">
                    <span className="text-[10px] font-black text-slate-700 sm:text-xs">
                      {t.auth.newPassword}
                    </span>

                    <input
                      type="password"
                      placeholder={t.auth.newPasswordPlaceholder}
                      className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-black text-slate-700 sm:text-xs">
                      {t.auth.confirmPassword}
                    </span>

                    <input
                      type="password"
                      placeholder={t.auth.confirmNewPasswordPlaceholder}
                      className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </label>

                  <button
                    type="submit"
                    className="flex h-12 w-full items-center justify-center rounded-[14px] bg-blue-600 px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)] transition hover:bg-blue-500"
                  >
                    {t.auth.updatePassword}
                  </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-300">
                    TEO STORE
                  </span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <p className="text-center text-xs text-slate-500 sm:text-sm">
                  {t.auth.backToLogin}

                  <Link
                    to="/connexion"
                    className={
                      isArabic
                        ? 'mr-1 font-black text-blue-600 transition hover:text-blue-500'
                        : 'ml-1 font-black text-blue-600 transition hover:text-blue-500'
                    }
                  >
                    {t.auth.loginLink}
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </Container>
    </main>
  )
}

export default ResetPasswordPage