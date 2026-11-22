import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

type AdminProfile = { email: string; name: string }
type NavigationItem = { label: string; description: string; to: string; end?: boolean; icon: ReactNode; badge?: number }
type NavigationGroup = { label: string; items: NavigationItem[] }

function Icon({ name }: { name: string }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className: 'h-5 w-5', 'aria-hidden': true as const }
  const paths: Record<string, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></>,
    orders: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
    payments: <><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M3 10h18M7 15h4"/></>,
    reviews: <><path d="M4 5h16v12h-9l-5 4v-4H4z"/><path d="m8 11 3 3 5-6"/></>,
    services: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    plans: <><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h4"/></>,
    esim: <><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 7h4M9 12h2M13 12h2M10 17h4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    close: <path d="M5 5l14 14M19 5 5 19"/>,
    logout: <><path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
  }
  return <svg {...common}>{paths[name] ?? paths.dashboard}</svg>
}

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  const [hasSession, setHasSession] = useState(false)
  const [newReviewsCount, setNewReviewsCount] = useState(0)

  const loadNewReviewsCount = useCallback(async () => {
    try {
      const [store, digital] = await Promise.all([
        supabase.from('store_reviews').select('id', { count: 'exact', head: true }).is('reviewed_at', null),
        supabase.from('digital_order_reviews').select('id', { count: 'exact', head: true }).is('reviewed_at', null),
      ])
      if (store.error) console.error('Store reviews:', store.error)
      if (digital.error) console.error('Digital reviews:', digital.error)
      setNewReviewsCount((store.error ? 0 : store.count ?? 0) + (digital.error ? 0 : digital.count ?? 0))
    } catch (error) { console.error('Reviews count:', error) }
  }, [])

  const groups: NavigationGroup[] = useMemo(() => [
    { label: 'Pilotage', items: [
      { label: 'Dashboard', description: 'Vue générale', to: '/admin', end: true, icon: <Icon name="dashboard"/> },
      { label: 'Commandes', description: 'Suivi et traitement', to: '/admin/orders', icon: <Icon name="orders"/> },
      { label: 'Paiements', description: 'Contrôle des règlements', to: '/admin/payments', icon: <Icon name="payments"/> },
      { label: 'Avis', description: 'Évaluations des clients', to: '/admin/store-reviews', icon: <Icon name="reviews"/>, badge: newReviewsCount },
    ]},
    { label: 'Catalogue', items: [
      { label: 'Services', description: 'Catalogue numérique', to: '/admin/services', icon: <Icon name="services"/> },
      { label: 'Plans', description: 'Offres et tarifs', to: '/admin/plans', icon: <Icon name="plans"/> },
      { label: 'eSIM', description: 'Pays et forfaits', to: '/admin/esim', icon: <Icon name="esim"/> },
    ]},
    { label: 'Système', items: [
      { label: 'Paramètres', description: 'Configuration du magasin', to: '/admin/settings', icon: <Icon name="settings"/> },
    ]},
  ], [newReviewsCount])

  const allItems = useMemo(() => groups.flatMap(group => group.items), [groups])
  const activeItem = [...allItems].sort((a, b) => b.to.length - a.to.length).find(item => item.end ? location.pathname === item.to : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
  const pageTitle = activeItem?.label ?? 'Administration'
  const profileInitial = adminProfile?.name.trim().charAt(0).toUpperCase() || 'A'
  const connectionState = !hasSession ? 'disconnected' : !isOnline ? 'offline' : 'online'
  const connectionDot = connectionState === 'online' ? 'bg-emerald-500' : connectionState === 'offline' ? 'bg-amber-400' : 'bg-rose-500'
  const connectionLabel = connectionState === 'online' ? 'Connexion active' : connectionState === 'offline' ? 'Mode hors ligne' : 'Session inactive'

  useEffect(() => {
    let mounted = true
    const applyUser = (user: { email?: string; user_metadata?: Record<string, unknown> } | null | undefined) => {
      if (!mounted) return
      setHasSession(Boolean(user))
      if (!user) { setAdminProfile(null); return }
      const email = user.email ?? ''
      const name = user.user_metadata?.full_name
      setAdminProfile({ email, name: typeof name === 'string' && name.trim() ? name.trim() : email.split('@')[0] || 'Admin' })
    }
    void supabase.auth.getUser().then(({ data }) => applyUser(data.user)).catch(console.error)
    const { data } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user))
    return () => { mounted = false; data.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    let active = true
    const refresh = () => { if (active) void loadNewReviewsCount() }
    refresh()
    const channels = [
      supabase.channel('admin-layout-store-reviews').on('postgres_changes', { event: '*', schema: 'public', table: 'store_reviews' }, refresh).subscribe(),
      supabase.channel('admin-layout-digital-reviews').on('postgres_changes', { event: '*', schema: 'public', table: 'digital_order_reviews' }, refresh).subscribe(),
    ]
    const visibility = () => { if (document.visibilityState === 'visible') refresh() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      active = false
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', visibility)
      channels.forEach(channel => { void supabase.removeChannel(channel) })
    }
  }, [loadNewReviewsCount])

  useEffect(() => {
    const online = () => setIsOnline(true)
    const offline = () => setIsOnline(false)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline) }
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsProfileOpen(false)
    void loadNewReviewsCount()
  }, [location.pathname, loadNewReviewsCount])

  useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setIsProfileOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setIsMobileMenuOpen(false); setIsProfileOpen(false) }
    }
    document.addEventListener('mousedown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape) }
  }, [])

  useEffect(() => {
    if (!isMobileMenuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [isMobileMenuOpen])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setIsProfileOpen(false)
      setIsMobileMenuOpen(false)
      navigate('/admin/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
      window.alert('Déconnexion impossible. Veuillez réessayer.')
    } finally { setIsLoggingOut(false) }
  }

  const navigation = (mobile = false) => (
    <nav aria-label="Navigation administration" className="space-y-6">
      {groups.map(group => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">{group.label}</p>
          <div className="space-y-1">
            {group.items.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => mobile && setIsMobileMenuOpen(false)}
                className={({ isActive }) => `group flex min-h-[56px] items-center gap-3 rounded-2xl border px-3 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${isActive ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
                {({ isActive }) => <>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{item.icon}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-extrabold">{item.label}</span><span className="mt-0.5 block truncate text-[10px] font-medium opacity-65">{item.description}</span></span>
                  {Boolean(item.badge && item.badge > 0) && <span className="flex min-h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white" dir="ltr">{item.badge! > 99 ? '99+' : item.badge}</span>}
                  <span className="opacity-40"><Icon name="chevron"/></span>
                </>}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )

  const identity = <div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-lg font-black text-white shadow-md">T</div><div className="min-w-0"><p className="truncate text-base font-black tracking-tight text-slate-950">TEO STORE</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Admin Control Center</p></div></div>

  return <div dir="ltr" className="min-h-screen bg-[#f4f7fb] text-slate-950">
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[284px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex xl:w-[300px]">
        <div className="border-b border-slate-100 px-5 py-6">{identity}</div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">{navigation()}</div>
        <div className="border-t border-slate-100 p-3"><button type="button" onClick={() => navigate('/admin/settings')} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-blue-50"><div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">{profileInitial}<span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${connectionDot}`}/></div><div className="min-w-0"><p className="truncate text-xs font-black">{adminProfile?.name ?? 'Administrateur'}</p><p className="truncate text-[10px] text-slate-400">{adminProfile?.email ?? connectionLabel}</p></div></button></div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-[70px] max-w-[1700px] items-center justify-between gap-3 px-3 sm:px-6 lg:h-[78px] lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setIsMobileMenuOpen(true)} aria-label="Ouvrir le menu" aria-expanded={isMobileMenuOpen} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white lg:hidden"><Icon name="menu"/></button>
              <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-blue-600">TEO STORE / ADMIN</p><h1 className="mt-1 truncate text-base font-black sm:text-xl">{pageTitle}</h1></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span title={connectionLabel} className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600 sm:flex"><span className={`h-2 w-2 rounded-full ${connectionDot}`}/>{connectionLabel}</span>
              {newReviewsCount > 0 && <NavLink to="/admin/store-reviews" title="Nouveaux avis" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-600">Avis {newReviewsCount > 99 ? '99+' : newReviewsCount}</NavLink>}
              <div ref={profileMenuRef} className="relative">
                <button type="button" onClick={() => setIsProfileOpen(open => !open)} aria-label="Compte administrateur" aria-expanded={isProfileOpen} className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-blue-100 bg-blue-50 text-sm font-black text-blue-700 hover:border-blue-300">{profileInitial}<span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${connectionDot}`}/></button>
                {isProfileOpen && <div className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[min(290px,calc(100vw-24px))] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"><div className="rounded-xl bg-slate-50 p-4"><p className="truncate text-sm font-black">{adminProfile?.name ?? 'Administrateur'}</p><p className="mt-1 truncate text-xs text-slate-500" dir="ltr">{adminProfile?.email ?? 'TEO STORE'}</p><p className="mt-3 text-[11px] font-semibold text-slate-500">{connectionLabel}</p></div><NavLink to="/admin/settings" onClick={() => setIsProfileOpen(false)} className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold hover:bg-slate-50"><Icon name="settings"/> Paramètres</NavLink><button type="button" onClick={() => void handleLogout()} disabled={isLoggingOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Icon name="logout"/>{isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}</button></div>}
              </div>
            </div>
          </div>
        </header>
        <main className="min-w-0 px-3 pb-10 pt-4 sm:px-5 sm:pt-6 lg:px-7 lg:pt-7 xl:px-9"><div className="mx-auto w-full max-w-[1540px] min-w-0"><Outlet/></div></main>
      </div>
    </div>
    {isMobileMenuOpen && <div className="fixed inset-0 z-[100] lg:hidden"><button type="button" aria-label="Fermer le menu" onClick={() => setIsMobileMenuOpen(false)} className="absolute inset-0 bg-slate-950/55"/><aside role="dialog" aria-modal="true" aria-label="Menu administration" className="absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">{identity}<button type="button" aria-label="Fermer le menu" onClick={() => setIsMobileMenuOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100"><Icon name="close"/></button></div><div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">{navigation(true)}</div><div className="border-t border-slate-100 p-3"><div className="mb-3 rounded-xl bg-slate-50 p-3"><p className="truncate text-sm font-black">{adminProfile?.name ?? 'Administrateur'}</p><p className="truncate text-xs text-slate-500">{connectionLabel}</p></div><button type="button" disabled={isLoggingOut} onClick={() => void handleLogout()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 p-3 text-sm font-black text-rose-600 disabled:opacity-50"><Icon name="logout"/>{isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}</button></div></aside></div>}
  </div>
}

export default AdminLayout
