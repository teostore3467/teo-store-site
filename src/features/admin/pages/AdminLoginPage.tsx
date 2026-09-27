import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

type LocationState = {
  from?: string
}

function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [alreadyAdmin, setAlreadyAdmin] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    const checkCurrentSession = async () => {
      const {
        data: userData,
      } = await supabase.auth.getUser()

      if (!active || !userData.user) {
        if (active) {
          setIsCheckingSession(false)
        }

        return
      }

      const {
        data: adminRow,
      } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (!active) {
        return
      }

      setAlreadyAdmin(Boolean(adminRow))
      setIsCheckingSession(false)
    }

    void checkCurrentSession()

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!email.trim() || !password) {
      setErrorMessage(
        'Veuillez saisir votre e-mail et votre mot de passe.',
      )

      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const {
      data,
      error,
    } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error || !data.user) {
      setErrorMessage(
        'E-mail ou mot de passe incorrect.',
      )

      setIsSubmitting(false)

      return
    }

    const {
      data: adminRow,
      error: adminError,
    } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (adminError || !adminRow) {
      await supabase.auth.signOut()

      setErrorMessage(
        "Ce compte n'est pas autorisé à accéder au Dashboard TEO STORE.",
      )

      setIsSubmitting(false)

      return
    }

    const state =
      location.state as LocationState | null

    const destination =
      state?.from &&
      state.from.startsWith('/admin') &&
      state.from !== '/admin/login'
        ? state.from
        : '/admin'

    navigate(destination, {
      replace: true,
    })
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050b16] px-4">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-white/20 border-t-blue-500" />

          <p className="mt-4 text-xs font-bold text-white/50">
            TEO STORE
          </p>
        </div>
      </main>
    )
  }

  if (alreadyAdmin) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    )
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050b16] px-4 py-10">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(37,99,235,0.20), transparent 35%), radial-gradient(circle at 80% 80%, rgba(79,70,229,0.18), transparent 35%)',
        }}
      />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-6 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] text-2xl font-black text-white shadow-[0_18px_50px_rgba(37,99,235,0.30)]"
            style={{
              background:
                'linear-gradient(145deg, #2563eb 0%, #4338ca 100%)',
            }}
          >
            T
          </div>

          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.22em] text-blue-400">
            TEO STORE
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">
            Administration
          </h1>

          <p className="mt-2 text-xs leading-5 text-white/45">
            Accès réservé aux administrateurs autorisés.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl sm:p-6"
        >
          <label className="block">
            <span className="text-[10px] font-black text-white/65">
              E-mail administrateur
            </span>

            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="admin@..."
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-blue-500"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-[10px] font-black text-white/65">
              Mot de passe
            </span>

            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-blue-500"
            />
          </label>

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-[10px] font-bold leading-5 text-red-300">
                {errorMessage}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={[
              'mt-5 flex h-12 w-full items-center justify-center rounded-xl text-sm font-black text-white transition',
              isSubmitting
                ? 'cursor-not-allowed bg-blue-600/40'
                : 'bg-blue-600 hover:bg-blue-500',
            ].join(' ')}
          >
            {isSubmitting
              ? 'Connexion...'
              : 'Se connecter'}
          </button>

          <p className="mt-4 text-center text-[8px] leading-4 text-white/25">
            TEO STORE · Secure Admin Access
          </p>
        </form>
      </div>
    </main>
  )
}

export default AdminLoginPage