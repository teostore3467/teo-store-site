import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useLanguage } from '../../../i18n/LanguageContext'

type Access = 'loading' | 'allowed' | 'denied' | 'error'

function AdminProtectedRoute() {
  const location = useLocation()
  const { language } = useLanguage()
  const ar = language === 'ar'
  const [access, setAccess] = useState<Access>('loading')
  const generation = useRef(0)
  const userId = useRef<string | null>(null)
  const check = useCallback(async () => {
    const version = ++generation.current
    const commit = (value: Access) => {
      if (generation.current === version) setAccess(value)
    }
    try {
      const { data, error } = await supabase.auth.getUser()
      if (generation.current !== version) return
      if (error || !data.user) { userId.current = null; commit('denied'); return }
      userId.current = data.user.id
      const result = await supabase.from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle()
      if (result.error) { commit('error'); return }
      commit(result.data ? 'allowed' : 'denied')
    } catch { commit('error') }
  }, [])
  useEffect(() => {
    let timer: number | undefined
    void check()
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return
      if (!session || session.user.id !== userId.current) {
        ++generation.current
        setAccess('loading')
      }
      window.clearTimeout(timer)
      timer = window.setTimeout(() => { void check() }, 0)
    })
    return () => {
      ++generation.current
      window.clearTimeout(timer)
      data.subscription.unsubscribe()
    }
  }, [check])
  if (access === 'loading') return <main className="flex min-h-screen items-center justify-center bg-slate-950"><div className="h-9 w-9 animate-spin rounded-full border-4 border-white/20 border-t-blue-500" /></main>
  if (access === 'denied') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (access === 'error') return <main dir={ar ? 'rtl' : 'ltr'} className="flex min-h-screen items-center justify-center bg-slate-950 p-5 text-white"><section className="max-w-md rounded-2xl border border-white/10 p-6"><p role="alert">{ar ? 'تعذر التحقق من صلاحية الإدارة.' : 'Impossible de vérifier les droits administrateur.'}</p><button type="button" onClick={() => { setAccess('loading'); void check() }} className="mt-4 rounded-xl bg-blue-600 p-3 font-bold active:scale-[0.98]">{ar ? 'إعادة المحاولة' : 'Réessayer'}</button></section></main>
  return <Outlet />
}
export default AdminProtectedRoute
