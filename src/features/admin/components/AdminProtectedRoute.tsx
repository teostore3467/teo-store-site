import { useEffect, useState } from 'react'
import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

type AccessState =
  | 'loading'
  | 'allowed'
  | 'denied'

function AdminProtectedRoute() {
  const location = useLocation()

  const [accessState, setAccessState] =
    useState<AccessState>('loading')

  useEffect(() => {
    let active = true

    const checkAccess = async () => {
      setAccessState('loading')

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      if (!active) {
        return
      }

      if (userError || !userData.user) {
        setAccessState('denied')
        return
      }

      const {
        data: adminRow,
        error: adminError,
      } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (!active) {
        return
      }

      if (adminError || !adminRow) {
        setAccessState('denied')
        return
      }

      setAccessState('allowed')
    }

    void checkAccess()

    return () => {
      active = false
    }
  }, [])

  if (accessState === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/20 border-t-blue-500" />
      </main>
    )
  }

  if (accessState === 'denied') {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  return <Outlet />
}

export default AdminProtectedRoute