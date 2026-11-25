import ThemeSwitch from '../../../components/layout/ThemeSwitch'
import { useLanguage } from '../../../i18n/LanguageContext'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Star,
  Boxes,
  Layers,
  Smartphone,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Headphones,
  Globe,
  ExternalLink,
  FileText,
  RefreshCw,
  Bell,
  UserCircle,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

type AdminProfile = {
  email: string
  name: string
}

type NavigationItem = {
  label: string
  description: string
  to: string
  end?: boolean
  icon: typeof LayoutDashboard
  badge?: number
}

type NavigationGroup = {
  key: string
  label: string
  items: NavigationItem[]
}

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const { language, toggleLanguage } = useLanguage()
  const ar = language === 'ar'

  const t = (arabic: string, french: string) =>
    ar ? arabic : french

  const profileMenuRef = useRef<HTMLDivElement>(null)

  const [adminProfile, setAdminProfile] =
    useState<AdminProfile | null>(null)

  const [hasSession, setHasSession] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [newReviewsCount, setNewReviewsCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  )

  const [dark, setDark] = useState(
    () => document.documentElement.dataset.teoTheme === 'dark',
  )

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('teo-admin-sidebar') === 'collapsed'
    } catch {
      return false
    }
  })

  const [closedGroups, setClosedGroups] = useState<string[]>([])

  const [branding, setBranding] = useState({
    name: 'TEO STORE',
    logo: '',
    darkLogo: '',
  })

  const [failedLogo, setFailedLogo] = useState('')

  const colors = {
    background: dark ? '#080f1c' : '#f4f7fb',
    surface: dark ? '#101827' : '#ffffff',
    soft: dark ? '#192334' : '#f1f5f9',
    border: dark ? '#293548' : '#e2e8f0',
    text: dark ? '#f1f5f9' : '#0f172a',
    muted: dark ? '#94a3b8' : '#64748b',
    active: dark ? '#172e55' : '#eff6ff',
    blue: dark ? '#93c5fd' : '#2563eb',
  }

  useEffect(() => {
    const sync = () => {
      setDark(
        document.documentElement.dataset.teoTheme === 'dark',
      )
    }

    const observer = new MutationObserver(sync)

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-teo-theme'],
    })

    sync()

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        'teo-admin-sidebar',
        collapsed ? 'collapsed' : 'expanded',
      )
    } catch {
      // Storage unavailable.
    }
  }, [collapsed])

  const loadBranding = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'store')
      .maybeSingle()

    if (error) return

    const value = data?.setting_value

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return
    }

    const settings = value as Record<string, unknown>

    setBranding({
      name:
        typeof settings.storeName === 'string' &&
        settings.storeName.trim()
          ? settings.storeName.trim()
          : 'TEO STORE',

      logo:
        typeof settings.logoUrl === 'string'
          ? settings.logoUrl
          : '',

      darkLogo:
        typeof settings.logoDarkUrl === 'string'
          ? settings.logoDarkUrl
          : '',
    })
  }, [])

  useEffect(() => {
    void loadBranding()

    const channel = supabase
      .channel('admin-v5-branding')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
          filter: 'setting_key=eq.store',
        },
        () => void loadBranding(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [loadBranding])

  const loadNewReviewsCount = useCallback(async () => {
    try {
      const [store, digital] = await Promise.all([
        supabase
          .from('store_reviews')
          .select('id', { count: 'exact', head: true })
          .is('reviewed_at', null),

        supabase
          .from('digital_order_reviews')
          .select('id', { count: 'exact', head: true })
          .is('reviewed_at', null),
      ])

      if (store.error) console.error(store.error)
      if (digital.error) console.error(digital.error)

      if (!store.error && !digital.error) {
        setNewReviewsCount(
          (store.count ?? 0) + (digital.count ?? 0),
        )
      }
    } catch (error) {
      console.error('Admin reviews:', error)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const applyUser = (
      user:
        | {
            email?: string
            user_metadata?: Record<string, unknown>
          }
        | null
        | undefined,
    ) => {
      if (!mounted) return

      setHasSession(Boolean(user))

      if (!user) {
        setAdminProfile(null)
        return
      }

      const email = user.email ?? ''
      const name = user.user_metadata?.full_name

      setAdminProfile({
        email,
        name:
          typeof name === 'string' && name.trim()
            ? name.trim()
            : email.split('@')[0] || 'Admin',
      })
    }

    void supabase.auth
      .getUser()
      .then(({ data }) => applyUser(data.user))
      .catch(console.error)

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        applyUser(session?.user)
      },
    )

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!hasSession) {
      setNewReviewsCount(0)
      return
    }

    const refresh = () => {
      void loadNewReviewsCount()
    }

    refresh()

    const channel = supabase
      .channel('admin-v5-reviews')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_reviews',
        },
        refresh,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'digital_order_reviews',
        },
        refresh,
      )
      .subscribe()

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, 15000)

    const visibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', visibility)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', visibility)
      void supabase.removeChannel(channel)
    }
  }, [hasSession, loadNewReviewsCount])

  useEffect(() => {
    const online = () => setIsOnline(true)
    const offline = () => setIsOnline(false)

    window.addEventListener('online', online)
    window.addEventListener('offline', offline)

    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsProfileOpen(false)
    setSearchQuery('')

    if (hasSession) {
      void loadNewReviewsCount()
    }
  }, [location.pathname, hasSession, loadNewReviewsCount])

  useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false)
      }
    }

    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', outside)
    document.addEventListener('keydown', escape)

    return () => {
      document.removeEventListener('mousedown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [])

  useEffect(() => {
    if (!isMobileMenuOpen) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const resize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', resize)

    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('resize', resize)
    }
  }, [isMobileMenuOpen])

  const groups: NavigationGroup[] = useMemo(
    () => [
      {
        key: 'overview',
        label: ar ? 'نظرة عامة' : 'Vue générale',
        items: [
          {
            label: ar ? 'لوحة القيادة' : 'Dashboard',
            description: ar ? 'الإحصائيات العامة' : 'Vue générale',
            to: '/admin',
            end: true,
            icon: LayoutDashboard,
          },
        ],
      },
      {
        key: 'sales',
        label: ar ? 'المبيعات والمالية' : 'Ventes & finances',
        items: [
          { label: 'TEO ADMIN PRO', description: ar ? 'المالية والتسويق والأنظمة الجديدة' : 'Finance, marketing et nouveaux modules', to: '/admin/pro', icon: LayoutDashboard },
          {
            label: ar ? 'الطلبات' : 'Commandes',
            description: ar ? 'إدارة طلبات العملاء' : 'Suivi des commandes',
            to: '/admin/orders',
            icon: ShoppingBag,
          },
          {
            label: ar ? 'المدفوعات' : 'Paiements',
            description: ar ? 'مراجعة عمليات الدفع' : 'Contrôle des règlements',
            to: '/admin/payments',
            icon: CreditCard,
          },
        ],
      },
      {
        key: 'catalog',
        label: ar ? 'المنتجات والخدمات' : 'Catalogue',
        items: [
          {
            label: ar ? 'الخدمات الرقمية' : 'Services',
            description: ar ? 'إدارة المنتجات' : 'Catalogue numérique',
            to: '/admin/services',
            icon: Boxes,
          },
          {
            label: ar ? 'الباقات والأسعار' : 'Plans',
            description: ar ? 'العروض والتسعير' : 'Offres et tarifs',
            to: '/admin/plans',
            icon: Layers,
          },
          {
            label: 'eSIM',
            description: ar ? 'الدول والباقات' : 'Pays et forfaits',
            to: '/admin/esim',
            icon: Smartphone,
          },
        ],
      },
      {
        key: 'customers',
        label: ar ? 'خدمة العملاء' : 'Relation client',
        items: [
          {
            label: ar ? 'مركز الدعم' : 'Messagerie',
            description: ar ? 'المحادثات والشكاوى' : 'Support client',
            to: '/admin/support',
            icon: Headphones,
          },
          {
            label: ar ? 'التقييمات' : 'Avis',
            description: ar ? 'تقييمات العملاء' : 'Évaluations des clients',
            to: '/admin/store-reviews',
            icon: Star,
            badge: newReviewsCount,
          },
        ],
      },
      {
        key: 'configuration',
        label: ar ? 'إدارة الموقع' : 'Configuration',
        items: [
          {
            label: ar ? 'المحتوى والسياسات' : 'Footer & contenu',
            description: ar ? 'الصفحات والأسئلة الشائعة' : 'Pages et FAQ',
            to: '/admin/footer',
            icon: FileText,
          },
          {
            label: ar ? 'الإعدادات' : 'Paramètres',
            description: ar ? 'إعدادات المتجر' : 'Configuration du magasin',
            to: '/admin/settings',
            icon: Settings,
          },
        ],
      },
    ],
    [ar, newReviewsCount],
  )

  const allItems = useMemo(
    () => groups.flatMap(group => group.items),
    [groups],
  )

  const activeItem = [...allItems]
    .sort((a, b) => b.to.length - a.to.length)
    .find(item =>
      item.end
        ? location.pathname === item.to
        : location.pathname === item.to ||
          location.pathname.startsWith(`${item.to}/`),
    )

  const pageTitle =
    activeItem?.label ?? t('لوحة الإدارة', 'Administration')

  const activeGroup = groups.find(group =>
    group.items.some(item => item.to === activeItem?.to),
  )

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) return groups

    return groups
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          `${group.label} ${item.label} ${item.description} ${item.to}`
            .toLowerCase()
            .includes(query),
        ),
      }))
      .filter(group => group.items.length > 0)
  }, [groups, searchQuery])

  const profileInitial =
    adminProfile?.name.trim().charAt(0).toUpperCase() || 'A'

  const connectionLabel = !hasSession
    ? t('جلسة غير نشطة', 'Session inactive')
    : !isOnline
      ? t('غير متصل بالإنترنت', 'Hors ligne')
      : t('جلسة نشطة', 'Session active')

  const connectionColor = !hasSession
    ? '#ef4444'
    : !isOnline
      ? '#f59e0b'
      : '#22c55e'

  const activeLogo = dark
    ? branding.darkLogo || branding.logo
    : branding.logo

  const toggleGroup = (key: string) => {
    setClosedGroups(current =>
      current.includes(key)
        ? current.filter(value => value !== key)
        : [...current, key],
    )
  }

  const handleRefresh = async () => {
    if (refreshing) return

    setRefreshing(true)

    try {
      await Promise.all([
        loadBranding(),
        hasSession ? loadNewReviewsCount() : Promise.resolve(),
      ])
    } finally {
      setRefreshing(false)
    }
  }

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

      window.alert(
        t(
          'تعذر تسجيل الخروج. حاول مجددًا.',
          'Déconnexion impossible. Veuillez réessayer.',
        ),
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  const identity = (compact = false) => (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center">
        {activeLogo && failedLogo !== activeLogo ? (
          <img
            src={activeLogo}
            alt={branding.name}
            className="h-full w-full object-contain"
            onError={() => setFailedLogo(activeLogo)}
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-black text-white">
            T
          </div>
        )}
      </div>

      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-base font-black">
            {branding.name}
          </p>
          <p
            className="mt-0.5 text-[10px] font-semibold"
            style={{ color: colors.muted }}
          >
            {t('مركز إدارة المتجر', 'Admin Control Center')}
          </p>
        </div>
      )}
    </div>
  )

  const searchBox = (
    <div
      className="flex items-center gap-2 rounded-xl border px-3"
      style={{
        background: colors.soft,
        borderColor: colors.border,
      }}
    >
      <Search size={17} style={{ color: colors.muted }} />

      <input
        type="search"
        value={searchQuery}
        onChange={event => setSearchQuery(event.target.value)}
        placeholder={t('ابحث عن قسم...', 'Rechercher un menu...')}
        aria-label={t('البحث في القائمة', 'Rechercher un menu')}
        className="h-11 min-w-0 flex-1 bg-transparent text-xs outline-none"
        style={{ color: colors.text }}
      />

      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          aria-label={t('مسح البحث', 'Effacer')}
        >
          <X size={15} />
        </button>
      )}
    </div>
  )

  const navigation = (mobile = false) => {
    const compact = collapsed && !mobile

    return (
      <nav
        aria-label={t('قائمة الإدارة', 'Navigation administration')}
        className="space-y-4"
      >
        {(compact ? groups : filteredGroups).map(group => {
          const groupClosed =
            !compact &&
            !searchQuery &&
            closedGroups.includes(group.key) &&
            !group.items.some(item => item.to === activeItem?.to)

          return (
            <div key={group.key}>
              {!compact && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={!groupClosed}
                  className="mb-2 flex w-full items-center justify-between gap-2 px-2 py-1 text-[11px] font-bold"
                  style={{ color: colors.muted }}
                >
                  {group.label}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      groupClosed ? '-rotate-90' : ''
                    }`}
                  />
                </button>
              )}

              {!groupClosed && (
                <div className="space-y-1">
                  {group.items.map(item => {
                    const ItemIcon = item.icon

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        title={item.label}
                        onClick={() => {
                          if (mobile) setIsMobileMenuOpen(false)
                        }}
                        className={({ isActive }) =>
                          `relative flex min-h-[48px] items-center rounded-xl border transition-colors ${
                            compact
                              ? 'justify-center px-1 py-2'
                              : 'gap-3 px-2.5 py-2'
                          } ${
                            isActive
                              ? 'font-bold'
                              : 'font-medium hover:opacity-80'
                          }`
                        }
                        style={({ isActive }) => ({
                          background: isActive
                            ? colors.active
                            : 'transparent',
                          borderColor: isActive
                            ? colors.border
                            : 'transparent',
                          color: isActive
                            ? colors.blue
                            : colors.text,
                        })}
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                              style={{
                                background: isActive
                                  ? '#2563eb'
                                  : colors.soft,
                                color: isActive
                                  ? '#ffffff'
                                  : colors.muted,
                              }}
                            >
                              <ItemIcon size={18} strokeWidth={1.8} />
                            </span>

                            {!compact && (
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-bold">
                                  {item.label}
                                </span>
                                <span
                                  className="mt-0.5 block truncate text-[10px]"
                                  style={{ color: colors.muted }}
                                >
                                  {item.description}
                                </span>
                              </span>
                            )}

                            {(item.badge ?? 0) > 0 && (
                              <span
                                dir="ltr"
                                className={`flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white ${
                                  compact
                                    ? 'absolute -end-1 -top-1'
                                    : ''
                                }`}
                              >
                                {(item.badge ?? 0) > 99
                                  ? '99+'
                                  : item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {!compact && filteredGroups.length === 0 && (
          <p
            className="px-3 py-6 text-center text-xs"
            style={{ color: colors.muted }}
          >
            {t('لا توجد نتائج', 'Aucun résultat')}
          </p>
        )}
      </nav>
    )
  }

  const profileAvatar = (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
      {profileInitial}
      <span
        className="absolute bottom-0 end-0 h-3 w-3 rounded-full border-2"
        style={{
          background: connectionColor,
          borderColor: colors.surface,
        }}
      />
    </span>
  )

  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      className="min-h-screen"
      style={{
        background: colors.background,
        color: colors.text,
      }}
    >
      <div className="flex min-h-screen">

        {/* DESKTOP SIDEBAR */}

        <aside
          className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-e transition-[width] duration-200 lg:flex ${
            collapsed ? 'w-[82px]' : 'w-[272px] xl:w-[286px]'
          }`}
          style={{
            background: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div
            className={`flex min-h-[78px] items-center border-b ${
              collapsed ? 'justify-center px-2' : 'px-4'
            }`}
            style={{ borderColor: colors.border }}
          >
            {identity(collapsed)}
          </div>

          <div className="p-3">
            <button
              type="button"
              onClick={() => setCollapsed(value => !value)}
              title={collapsed ? t('توسيع القائمة', 'Développer') : t('طي القائمة', 'Réduire')}
              aria-label={collapsed ? t('توسيع القائمة', 'Développer') : t('طي القائمة', 'Réduire')}
              className={`flex h-10 w-full items-center rounded-xl ${
                collapsed ? 'justify-center' : 'gap-3 px-3'
              }`}
              style={{
                background: colors.soft,
                color: colors.muted,
              }}
            >
              {collapsed
                ? <PanelLeftOpen size={19} />
                : <PanelLeftClose size={19} />}

              {!collapsed && (
                <span className="text-xs font-bold">
                  {t('طي القائمة', 'Réduire le menu')}
                </span>
              )}
            </button>

            {!collapsed && (
              <div className="mt-3">{searchBox}</div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-5">
            {navigation()}
          </div>

          <div
            className="space-y-2 border-t p-3"
            style={{ borderColor: colors.border }}
          >
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title={t('عرض المتجر', 'Voir la boutique')}
              className={`flex min-h-10 items-center rounded-xl ${
                collapsed ? 'justify-center' : 'gap-3 px-3'
              }`}
              style={{
                background: colors.soft,
                color: colors.blue,
              }}
            >
              <ExternalLink size={18} />

              {!collapsed && (
                <span className="text-xs font-bold">
                  {t('عرض المتجر', 'Voir la boutique')}
                </span>
              )}
            </a>

            <button
              type="button"
              onClick={() => navigate('/admin/settings')}
              title={t('حساب الإدارة', 'Compte administrateur')}
              className={`flex w-full items-center rounded-xl py-2 ${
                collapsed ? 'justify-center' : 'gap-3 px-2'
              }`}
            >
              {profileAvatar}

              {!collapsed && (
                <span className="min-w-0 flex-1 text-start">
                  <span className="block truncate text-xs font-black">
                    {adminProfile?.name ?? t('المدير', 'Administrateur')}
                  </span>
                  <span
                    className="mt-1 block truncate text-[10px]"
                    style={{ color: colors.muted }}
                  >
                    {adminProfile?.email ?? connectionLabel}
                  </span>
                </span>
              )}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}

        <div className="min-w-0 flex-1">

          {/* HEADER */}

          <header
            className="teo-themed-header sticky top-0 z-40 border-b"
            style={{
              background: colors.surface,
              borderColor: colors.border,
            }}
          >
            <div className="mx-auto flex min-h-[68px] max-w-[1800px] items-center justify-between gap-2 px-3 sm:px-5 lg:px-7">

              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label={t('فتح القائمة', 'Ouvrir le menu')}
                  aria-expanded={isMobileMenuOpen}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border lg:hidden"
                  style={{
                    background: colors.soft,
                    borderColor: colors.border,
                  }}
                >
                  <Menu size={21} />
                </button>

                <div className="min-w-0">
                  <p
                    className="truncate text-[10px] font-bold"
                    style={{ color: colors.blue }}
                  >
                    {activeGroup?.label ?? 'ADMIN'}
                  </p>

                  <h1 className="mt-0.5 truncate text-sm font-black sm:text-lg">
                    {pageTitle}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

                <span
                  title={connectionLabel}
                  className="hidden items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold xl:flex"
                  style={{
                    background: colors.soft,
                    color: colors.muted,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: connectionColor }}
                  />
                  {connectionLabel}
                </span>

                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={refreshing}
                  title={t('تحديث بيانات القائمة', 'Actualiser le menu')}
                  aria-label={t('تحديث بيانات القائمة', 'Actualiser le menu')}
                  className="hidden h-10 w-10 items-center justify-center rounded-xl border sm:flex"
                  style={{
                    background: colors.soft,
                    borderColor: colors.border,
                  }}
                >
                  <RefreshCw
                    size={17}
                    className={refreshing ? 'animate-spin' : ''}
                  />
                </button>

                <ThemeSwitch arabic={ar} />

                <button
                  type="button"
                  onClick={toggleLanguage}
                  aria-label={t('اللغة الفرنسية', 'Langue arabe')}
                  className="flex h-10 min-w-9 items-center justify-center rounded-xl border px-2 text-xs font-black"
                  style={{
                    background: colors.soft,
                    borderColor: colors.border,
                  }}
                >
                  {ar ? 'FR' : 'AR'}
                </button>

                <NavLink
                  to="/admin/store-reviews"
                  title={t('التقييمات الجديدة', 'Nouveaux avis')}
                  aria-label={t('التقييمات الجديدة', 'Nouveaux avis')}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    background: colors.soft,
                    borderColor: colors.border,
                  }}
                >
                  <Bell size={18} />

                  {newReviewsCount > 0 && (
                    <span
                      dir="ltr"
                      className="absolute -end-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white"
                    >
                      {newReviewsCount > 99 ? '99+' : newReviewsCount}
                    </span>
                  )}
                </NavLink>

                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(value => !value)}
                    aria-label={t('حساب المدير', 'Compte administrateur')}
                    aria-expanded={isProfileOpen}
                  >
                    {profileAvatar}
                  </button>

                  {isProfileOpen && (
                    <div
                      className="absolute end-0 top-[calc(100%+12px)] z-[70] w-[min(280px,calc(100vw-24px))] rounded-2xl border p-2 shadow-2xl"
                      style={{
                        background: colors.surface,
                        borderColor: colors.border,
                      }}
                    >
                      <div
                        className="rounded-xl p-4"
                        style={{ background: colors.soft }}
                      >
                        <div className="flex items-center gap-3">
                          {profileAvatar}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">
                              {adminProfile?.name ?? t('المدير', 'Administrateur')}
                            </p>
                            <p
                              dir="ltr"
                              className="mt-1 truncate text-xs"
                              style={{ color: colors.muted }}
                            >
                              {adminProfile?.email ?? branding.name}
                            </p>
                          </div>
                        </div>

                        <p
                          className="mt-3 text-xs"
                          style={{ color: connectionColor }}
                        >
                          {connectionLabel}
                        </p>
                      </div>

                      <NavLink
                        to="/admin/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold"
                      >
                        <UserCircle size={18} />
                        {t('إعدادات الإدارة', 'Paramètres')}
                      </NavLink>

                      <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold"
                      >
                        <Globe size={18} />
                        {t('زيارة المتجر', 'Voir la boutique')}
                      </a>

                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        disabled={isLoggingOut}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm font-bold text-rose-500 disabled:opacity-50"
                      >
                        <LogOut size={18} />
                        {isLoggingOut
                          ? t('جارٍ تسجيل الخروج...', 'Déconnexion...')
                          : t('تسجيل الخروج', 'Déconnexion')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {!isOnline && (
            <div className="bg-amber-100 px-4 py-2 text-center text-xs font-bold text-amber-800">
              {t(
                'انقطع الاتصال بالإنترنت. تحقق من الشبكة.',
                'Connexion Internet interrompue. Vérifiez votre réseau.',
              )}
            </div>
          )}

          {/* ACTIVE ADMIN PAGE */}

          <main className="min-w-0 px-3 pb-10 pt-4 sm:px-5 lg:px-7 lg:pt-6">
            <div className="mx-auto w-full min-w-0 max-w-[1700px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* MOBILE SIDEBAR */}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">

          <button
            type="button"
            aria-label={t('إغلاق القائمة', 'Fermer le menu')}
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/60"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label={t('قائمة الإدارة', 'Menu administration')}
            className="absolute inset-y-0 start-0 flex w-[min(88vw,340px)] flex-col shadow-2xl"
            style={{
              background: colors.surface,
              color: colors.text,
            }}
          >
            <div
              className="flex items-center justify-between gap-2 border-b p-4"
              style={{ borderColor: colors.border }}
            >
              {identity()}

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label={t('إغلاق', 'Fermer')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: colors.soft }}
              >
                <X size={21} />
              </button>
            </div>

            <div className="p-3">{searchBox}</div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-5">
              {navigation(true)}
            </div>

            <div
              className="space-y-3 border-t p-3"
              style={{
                borderColor: colors.border,
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              }}
            >
              <div
                className="flex items-center gap-3 rounded-xl p-3"
                style={{ background: colors.soft }}
              >
                {profileAvatar}

                <div className="min-w-0">
                  <p className="truncate text-sm font-black">
                    {adminProfile?.name ?? t('المدير', 'Administrateur')}
                  </p>

                  <p
                    className="mt-1 text-xs"
                    style={{ color: colors.muted }}
                  >
                    {connectionLabel}
                  </p>
                </div>
              </div>

              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold"
                style={{
                  background: colors.soft,
                  color: colors.blue,
                }}
              >
                <ExternalLink size={17} />
                {t('زيارة المتجر', 'Voir la boutique')}
              </a>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => void handleLogout()}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600/10 text-sm font-black text-rose-500 disabled:opacity-50"
              >
                <LogOut size={18} />
                {isLoggingOut
                  ? t('جارٍ تسجيل الخروج...', 'Déconnexion...')
                  : t('تسجيل الخروج', 'Déconnexion')}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default AdminLayout