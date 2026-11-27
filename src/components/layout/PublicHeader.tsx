import { CampaignBar } from '../../features/home/components/StoreCampaigns'
import { useLiveCatalog } from '../../features/digital-commerce/utils/useLiveCatalog'
import ThemeSwitch from './ThemeSwitch'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { searchCatalog } from '../../features/digital-commerce/utils/searchCatalog'
import { useEsimCatalog } from '../../features/digital-commerce/data/useEsimCatalog'

import {
  useLanguage,
} from '../../i18n/LanguageContext'

import {
  supabase,
} from '../../lib/supabase'

import Container from './Container'

type CustomerUser = {
  id: string
  email?: string
  fullName?: string
}

type OrderNotification = {
  id: string
  order_number: string | null
  type: string
  title: string
  message: string
  action_url: string | null
  is_read: boolean
  created_at: string
}

function PublicHeader() {
  const navigate = useNavigate()

  const {
    language,
    toggleLanguage,
  } = useLanguage()

  const isArabic =
    language === 'ar'

const toastTimerRef = useRef<number | null>(null)
  const notificationOwner = useRef<string | null>(null)
  const requestVersion = useRef(0)
  const knownIds = useRef<Set<string> | null>(null)
  const [
    currentUser,
    setCurrentUser,
  ] =
    useState<CustomerUser | null>(
      null,
    )

  const [
    authLoading,
    setAuthLoading,
  ] =
    useState(true)

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] =
    useState(false)

  const [
    isMenuOpen,
    setIsMenuOpen,
  ] =
    useState(false)

  const [
    isAccountMenuOpen,
    setIsAccountMenuOpen,
  ] =
    useState(false)

  const [
    isNotificationOpen,
    setIsNotificationOpen,
  ] =
    useState(false)

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState('')

  const [
    isSearchOpen,
    setIsSearchOpen,
  ] =
    useState(false)

  const [
    notifications,
    setNotifications,
  ] =
    useState<OrderNotification[]>(
      [],
    )

  const [
    notificationsLoading,
    setNotificationsLoading,
  ] =
    useState(false)

  const [liveToast, setLiveToast] = useState<OrderNotification | null>(null)
  const [notificationError, setNotificationError] = useState(false)

  // Public branding is controlled from ADMIN > Paramètres > Boutique.
  const [storeBranding, setStoreBranding] = useState({
    logoUrl: '',
    logoDarkUrl: '',
    storeName: 'TEO STORE',
  })

  useEffect(() => {
    let active = true
    const loadBranding = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'store')
        .maybeSingle()

      if (!active || error) return
      const value = data?.setting_value
      if (!value || typeof value !== 'object' || Array.isArray(value)) return
      const settings = value as Record<string, unknown>
      setStoreBranding({
        logoUrl: typeof settings.logoUrl === 'string' ? settings.logoUrl : '',
        logoDarkUrl: typeof settings.logoDarkUrl === 'string' ? settings.logoDarkUrl : '',
        storeName: typeof settings.storeName === 'string' && settings.storeName.trim()
          ? settings.storeName.trim() : 'TEO STORE',
      })
    }

    void loadBranding()
    const channel = supabase
      .channel('public-header-branding')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'app_settings',
        filter: 'setting_key=eq.store',
      }, () => { void loadBranding() })
      .subscribe()

    const onFocus = () => { void loadBranding() }
    window.addEventListener('focus', onFocus)
    return () => {
      active = false
      window.removeEventListener('focus', onFocus)
      void supabase.removeChannel(channel)
    }
  }, [])

  const [darkBranding, setDarkBranding] = useState(() => document.documentElement.dataset.teoTheme === 'dark')
  useEffect(() => {
    const sync = () => setDarkBranding(document.documentElement.dataset.teoTheme === 'dark')
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-teo-theme'] })
    sync()
    return () => observer.disconnect()
  }, [])
  const activeLogo = darkBranding ? (storeBranding.logoDarkUrl || storeBranding.logoUrl) : storeBranding.logoUrl
  const [failedLogo, setFailedLogo] = useState('')
  const brandLogo = (size: 'desktop' | 'mobile') => (
    <div className={`flex ${size === 'desktop' ? 'h-12 w-12' : 'h-11 w-11'} shrink-0 items-center justify-center`} style={{ background: 'transparent', border: 0, boxShadow: 'none' }}>
      {activeLogo && failedLogo !== activeLogo ? (
        <img key={activeLogo} src={activeLogo} alt={storeBranding.storeName}
          className="h-full w-full object-contain" loading="eager"
          style={{ background: 'transparent', border: 0, boxShadow: 'none' }}
          onError={() => setFailedLogo(activeLogo)} />
      ) : (
        <span className="text-2xl font-black" style={{ color: darkBranding ? '#ffffff' : '#1d4ed8' }}>T</span>
      )}
    </div>
  )

  const getStatusLabel = (n: OrderNotification) => {
    const ar: Record<string, string> = {
      payment_partial: 'مطلوب إكمال الدفع', payment_confirmed: 'تم تأكيد الدفع',
      processing: 'طلبك قيد التجهيز', fulfillment_sent: 'خدمتك جاهزة',
      dispute_open: 'تم فتح النزاع', refunded: 'تم استرجاع الطلب',
      review_request: 'قيّم خدمتك', cancelled: 'تم إلغاء الطلب',
    }
    return isArabic ? ar[n.type] ?? n.title : n.title
  }
  const getMessage = (n: OrderNotification) => {
    const ar: Record<string, string> = {
      payment_partial: 'يحتاج طلبك إلى إكمال المبلغ المتبقي.',
      payment_confirmed: 'تم التحقق من دفعتك بنجاح.', processing: 'طلبك قيد التجهيز.',
      fulfillment_sent: 'تم إرسال خدمتك. افتح الطلب لمراجعتها.',
      dispute_open: 'تم تسجيل النزاع.', refunded: 'تم تسجيل استرجاع طلبك.',
      review_request: 'اكتمل طلبك. شاركنا تقييمك.', cancelled: 'تم إلغاء طلبك.',
    }
    return isArabic ? ar[n.type] ?? n.message : n.message
  }
  const formatNotificationDate = (value: string) => new Date(value).toLocaleString(isArabic ? 'ar-MR-u-nu-latn' : 'fr-FR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
  const loadNotifications = useCallback(async (userId: string, showLoading = false, detectUpdates = false) => {
    if (notificationOwner.current !== userId) return
    const version = ++requestVersion.current
    if (showLoading) setNotificationsLoading(true)
    const {data,error} = await supabase.from('customer_notifications')
      .select('id,order_number,type,title,message,action_url,is_read,created_at')
      .eq('user_id',userId).order('created_at',{ascending:false}).limit(60)
    if (notificationOwner.current !== userId || version !== requestVersion.current) return
    setNotificationsLoading(false)
    setNotificationError(Boolean(error))
    if (error) return
    const rows = (data ?? []) as OrderNotification[]
    const fresh = detectUpdates && knownIds.current ? rows.find(n => !n.is_read && !knownIds.current?.has(n.id)) : undefined
    knownIds.current = new Set(rows.map(n => n.id))
    setNotifications(rows)
    if (fresh) {
      setLiveToast(fresh)
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = window.setTimeout(() => setLiveToast(null),5000)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const applyUser =
      (
        user:
          | {
              id: string
              email?:
                | string
                | null

              user_metadata?: {
                full_name?: unknown
              }
            }
          | null,
      ) => {
        if (!mounted) {
          return
        }

        if (!user) {
          setCurrentUser(
            null,
          )

          return
        }

        const metadataName =
          user.user_metadata
            ?.full_name

        setCurrentUser({
          id: user.id,

          email:
            user.email ??
            undefined,

          fullName:
            typeof metadataName ===
            'string'
              ? metadataName
              : undefined,
        })
      }

    const loadCurrentUser =
      async () => {
        const {
          data,
        } =
          await supabase.auth
            .getUser()

        if (!mounted) {
          return
        }

        applyUser(
          data.user,
        )

        setAuthLoading(
          false,
        )
      }

    void loadCurrentUser()

    const {
      data:
        authListener,
    } =
      supabase.auth
        .onAuthStateChange(
          (
            _event,
            session,
          ) => {
            applyUser(
              session?.user ??
                null,
            )

            setAuthLoading(
              false,
            )
          },
        )

    return () => {
      mounted = false

      authListener
        .subscription
        .unsubscribe()
    }
  }, [])

  const userId = currentUser?.id
  useEffect(() => {
    notificationOwner.current = userId ?? null
    knownIds.current = null
    setNotifications([])
    setLiveToast(null)
    setNotificationError(false)
    setNotificationsLoading(false)
    if (!userId) return
    void loadNotifications(userId,true)
    const refresh = () => { void loadNotifications(userId,false,true) }
    const channel = supabase.channel(`header-notifications-${userId}-${Date.now()}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'customer_notifications',filter:`user_id=eq.${userId}`},refresh).subscribe()
    const timer = window.setInterval(() => { if(document.visibilityState === 'visible') refresh() },6000)
    window.addEventListener('focus',refresh)
    return () => {
      notificationOwner.current = null
      ++requestVersion.current
      window.clearInterval(timer)
      window.removeEventListener('focus',refresh)
      void supabase.removeChannel(channel)
    }
  },[userId,loadNotifications])

  useEffect(() => {
    const handleOutsideClick =
      (
        event: MouseEvent,
      ) => {
        const target =
          event.target as Node

        if (
          !(target instanceof Element && target.closest("[data-teo-account]"))
        ) {
          setIsAccountMenuOpen(
            false,
          )
        }

        if (
          !(target instanceof Element && target.closest("[data-teo-search]"))
        ) {
          setIsSearchOpen(
            false,
          )
        }

        if (
          !(target instanceof Element && target.closest("[data-teo-notifications]"))
        ) {
          setIsNotificationOpen(
            false,
          )
        }
      }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
    }
  }, [])

  useEffect(() => {
    const handleEscape =
      (
        event:
          KeyboardEvent,
      ) => {
        if (
          event.key !==
          'Escape'
        ) {
          return
        }

        setIsSearchOpen(
          false,
        )

        setIsAccountMenuOpen(
          false,
        )

        setIsNotificationOpen(
          false,
        )

        setIsMenuOpen(
          false,
        )
      }

    document.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [])

  useEffect(() => {
    return () => {
      if (
        toastTimerRef.current
      ) {
        window.clearTimeout(
          toastTimerRef.current,
        )
      }
    }
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length
  const markRead = async (id?: string) => {
    if (!userId) return
    let query = supabase.from('customer_notifications').update({is_read:true,read_at:new Date().toISOString()}).eq('user_id',userId).eq('is_read',false)
    if (id) query = query.eq('id',id)
    const {error} = await query
    if (notificationOwner.current !== userId) return
    if (error) { setNotificationError(true); return }
    await loadNotifications(userId)
  }
  const handleNotificationToggle = () => {
    setIsNotificationOpen(v => !v)
    setIsAccountMenuOpen(false)
    setIsSearchOpen(false)
    setIsMenuOpen(false)
    if (userId) void loadNotifications(userId)
  }
  const handleNotificationSelect = (n: OrderNotification) => {
    void markRead(n.id)
    setIsNotificationOpen(false)
    setLiveToast(null)
    const url = n.order_number ? `/commande/${encodeURIComponent(n.order_number)}` : n.action_url
    navigate(url && /^\/(?![\/\\])/.test(url) ? url : '/profil?section=notifications')
  }
  const {catalog,loading:catalogLoading} = useLiveCatalog()
  const {countries:searchCountries,loading:esimSearchLoading,error:esimSearchError}=useEsimCatalog(isSearchOpen&&!!searchQuery.trim())
  const results = useMemo(() => searchCatalog(searchQuery,catalog,searchCountries,language),[searchQuery,catalog,searchCountries,language])

  const isAuthenticated =
    Boolean(
      currentUser,
    )

  const profileName =
    currentUser?.fullName
      ?.trim() ||
    currentUser?.email
      ?.split('@')[0] ||
    (isArabic
      ? 'حسابي'
      : 'Mon compte')

  const profileInitial =
    profileName
      .trim()
      .charAt(0)
      .toUpperCase() ||
    'T'

  const handleServiceSelect =
    (
      href: string,
    ) => {
      setSearchQuery(
        '',
      )

      setIsSearchOpen(
        false,
      )

      setIsMenuOpen(
        false,
      )

      setIsAccountMenuOpen(
        false,
      )

      setIsNotificationOpen(
        false,
      )

      navigate(
        href,
      )
    }

  const handleSearchSubmit = () => {
    const q = searchQuery.trim()
    if (!q) return
    setIsSearchOpen(false)
    setIsMenuOpen(false)
    setSearchQuery('')
    navigate(`/services-numeriques?q=${encodeURIComponent(q)}`)
  }

  const handleLogout =
    async () => {
      if (
        isLoggingOut
      ) {
        return
      }

      setIsLoggingOut(
        true,
      )

      setIsMenuOpen(
        false,
      )

      setIsSearchOpen(
        false,
      )

      setIsAccountMenuOpen(
        false,
      )

      setIsNotificationOpen(
        false,
      )

      try {
        const {
          error,
        } =
          await supabase.auth
            .signOut()

        if (error) {
          console.error(
            'Customer logout failed:',
            error,
          )

          return
        }

        setCurrentUser(
          null,
        )

        navigate(
          '/',
          {
            replace: true,
          },
        )
      } finally {
        setIsLoggingOut(
          false,
        )
      }
    }

  const searchPlaceholder =
    isArabic
      ? 'ابحث عن خدمة رقمية...'
      : 'Rechercher un service numérique...'

  const topItems =
    isArabic
      ? [
          'دفع آمن',
          'تسليم رقمي سريع',
          'دعم العملاء',
          'خدمات موثوقة',
        ]
      : [
          'Paiement sécurisé',
          'Livraison numérique rapide',
          'Support client',
          'Services vérifiés',
        ]

  const renderSearchResults =
    () => {
      const hasQuery =
        searchQuery
          .trim()
          .length > 0

      if (
        !isSearchOpen ||
        !hasQuery
      ) {
        return null
      }

      return (
        <div
          dir={
            isArabic
              ? 'rtl'
              : 'ltr'
          }
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[120] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          {(catalogLoading||esimSearchLoading)&&<p className="p-3 text-xs">{isArabic?'جارٍ تحميل النتائج…':'Chargement des résultats…'}</p>}
          {esimSearchError&&<p className="p-3 text-xs">{isArabic?'تعذر تحميل نتائج eSIM':'Résultats eSIM indisponibles'}</p>}
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {results.map(result=><button key={result.id} type="button" onClick={()=>handleServiceSelect(result.href)} className="block w-full rounded-xl p-3 text-start hover:bg-blue-50 dark:hover:bg-slate-800"><span className="block break-words text-sm font-black text-slate-900 dark:text-white">{result.title}</span><span className="block text-xs text-slate-500">{result.subtitle}</span><span className="text-sm font-bold text-blue-600">{result.price}</span>{!result.available&&<span className="ms-2 text-xs">{isArabic?'غير متوفر':'Indisponible'}</span>}</button>)}
            {!results.length&&!catalogLoading&&!esimSearchLoading&&<p className="p-4 text-sm">{isArabic?'لا توجد نتائج':'Aucun résultat'}</p>}
          </div>
          <button type="button" onClick={handleSearchSubmit} className="w-full border-t p-3 text-sm font-bold text-blue-600">{isArabic ? 'عرض جميع النتائج' : 'Voir tous les résultats'}</button>
        </div>
      )
    }

  const searchBox = (
    <div
      data-teo-search
      className="relative w-full"
    >
      <input
        value={
          searchQuery
        }
        onChange={(
          event,
        ) => {
          setSearchQuery(
            event.target.value,
          )

          setIsSearchOpen(
            true,
          )

          setIsAccountMenuOpen(
            false,
          )

          setIsNotificationOpen(
            false,
          )
        }}
        onFocus={() => {
          setIsSearchOpen(
            true,
          )

          setIsAccountMenuOpen(
            false,
          )

          setIsNotificationOpen(
            false,
          )
        }}
        onKeyDown={(
          event,
        ) => {
          if (
            event.key ===
            'Enter'
          ) {
            event.preventDefault()

            handleSearchSubmit()
          }
        }}
        type="search"
        placeholder={
          searchPlaceholder
        }
        className={[
          'h-12 w-full rounded-[15px] border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white',
          isArabic
            ? 'pl-14 pr-4'
            : 'pl-4 pr-14',
        ].join(
          ' ',
        )}
      />

      <button
        type="button"
        onClick={
          handleSearchSubmit
        }
        className={[
          'absolute top-1/2 flex h-10 w-11 -translate-y-1/2 items-center justify-center rounded-[12px] bg-slate-950 text-white',
          isArabic
            ? 'left-1'
            : 'right-1',
        ].join(
          ' ',
        )}
        aria-label={
          isArabic
            ? 'بحث'
            : 'Rechercher'
        }
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-[18px] w-[18px]"
        >
          <circle
            cx="11"
            cy="11"
            r="7"
          />

          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>

      {renderSearchResults()}
    </div>
  )

  const notificationButton = isAuthenticated ? (
    <div data-teo-notifications className="relative">
      <button type="button" onClick={handleNotificationToggle} aria-expanded={isNotificationOpen} aria-label={isArabic ? 'الإشعارات' : 'Notifications'} className="relative flex h-10 w-10 items-center justify-center rounded-[13px] border border-slate-200 bg-white text-slate-700 shadow-sm sm:h-11 sm:w-11">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-[18px] w-[18px]"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">{unreadCount}</span>}
      </button>
      {isNotificationOpen && <div className="teo-notification-panel fixed inset-x-3 top-[68px] z-[150] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl xl:absolute xl:inset-x-auto xl:end-0 xl:top-full xl:w-[350px]">
        <div className="flex items-center justify-between border-b border-slate-200 p-3"><strong>{isArabic ? 'الإشعارات' : 'Notifications'} ({unreadCount})</strong>{unreadCount > 0 && <button type="button" onClick={() => void markRead()} className="text-xs font-bold text-blue-600">{isArabic ? 'قراءة الكل' : 'Tout lire'}</button>}</div>
        {notificationError && <p className="p-3 text-xs text-rose-600">{isArabic ? 'تعذر تحديث الإشعارات' : 'Impossible de synchroniser les notifications'}</p>}
        <div className="max-h-[50dvh] overflow-y-auto p-2">
          {notificationsLoading ? <p className="p-4 text-sm">{isArabic ? 'جار التحميل...' : 'Chargement...'}</p> : notifications.length ? notifications.map(n => <button key={n.id} type="button" onClick={() => handleNotificationSelect(n)} className={`block w-full rounded-xl p-3 text-start hover:bg-slate-50 ${!n.is_read ? 'bg-blue-50' : ''}`}><div className="flex items-center gap-2"><strong className="flex-1 text-sm">{getStatusLabel(n)}</strong>{!n.is_read && <span className="h-2 w-2 rounded-full bg-blue-600"/>}</div><p className="mt-1 text-xs text-slate-500">{getMessage(n)}</p><p className="mt-1 text-[10px] text-slate-500" dir="ltr">{n.order_number} · {formatNotificationDate(n.created_at)}</p></button>) : <p className="p-5 text-center text-sm">{isArabic ? 'لا توجد إشعارات' : 'Aucune notification'}</p>}
        </div>
        <Link to="/profil?section=notifications" onClick={() => setIsNotificationOpen(false)} className="block border-t border-slate-200 p-3 text-center text-sm font-bold text-blue-600">{isArabic ? 'جميع الإشعارات' : 'Toutes les notifications'}</Link>
      </div>}
    </div>
  ) : null

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className="sticky top-0 z-[60]">
      <style>{`html[data-teo-theme="dark"] .teo-notification-panel, html[data-teo-theme="dark"] .teo-notification-toast {background:#111827;color:#e2e8f0;border-color:#334155} html[data-teo-theme="dark"] .teo-notification-panel .bg-blue-50 {background:#172554} html[data-teo-theme="dark"] .teo-notification-panel button:hover {background:#1e293b} html[data-teo-theme="dark"] .teo-notification-panel .text-slate-500 {color:#a5b4c8}`}</style>
      {liveToast && <button type="button" onClick={() => handleNotificationSelect(liveToast)} className="teo-notification-toast fixed end-3 top-3 z-[300] w-[calc(100%-1.5rem)] max-w-[300px] rounded-2xl border border-blue-100 bg-white p-4 text-start shadow-xl"><strong className="text-sm">{getStatusLabel(liveToast)}</strong><p className="mt-1 text-xs">{getMessage(liveToast)}</p></button>}

      <div className="hidden bg-[#06101f]/95 text-white lg:block">
        <Container>
          <div className="flex min-h-[34px] items-center justify-center gap-8 overflow-hidden py-1.5 text-xs font-bold text-white/70 xl:gap-14">
            {topItems.map(
              (
                item,
              ) => (
                <div
                  key={
                    item
                  }
                  className="flex shrink-0 items-center gap-2"
                >
                  <span className="text-emerald-400">
                    ✦
                  </span>

                  <span>
                    {item}
                  </span>
                </div>
              ),
            )}
          </div>
        </Container>
      </div>

      <CampaignBar />
      <header className="teo-themed-header teo-public-header border-b shadow-sm" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
        <Container>
          <div className="hidden xl:block">
            <div className="grid min-h-[76px] grid-cols-[215px_minmax(260px,1fr)_350px] items-center gap-6">
              <Link
                to="/"
                onClick={() => {
                  setIsSearchOpen(
                    false,
                  )

                  setIsAccountMenuOpen(
                    false,
                  )

                  setIsNotificationOpen(
                    false,
                  )
                }}
                className="flex items-center gap-3"
              >
                {brandLogo('desktop')}

                <div>
                  <p className="text-[17px] font-black text-slate-950">
                    {storeBranding.storeName}
                  </p>

                  <p className="text-xs font-bold uppercase text-slate-400">
                    Digital Services
                  </p>
                </div>
              </Link>

              <div className="mx-auto w-full max-w-[660px]">
                {searchBox}
              </div>

              <div className="flex items-center justify-end gap-2">
                <ThemeSwitch arabic={isArabic} />
                {notificationButton}

                <button
                  type="button"
                  onClick={() => {
                    toggleLanguage()

                    setIsNotificationOpen(
                      false,
                    )
                  }}
                  className="flex h-11 min-w-[50px] items-center justify-center rounded-[14px] border border-slate-200 bg-white px-3 text-xs font-black text-slate-700"
                >
                  {isArabic
                    ? 'FR'
                    : 'AR'}
                </button>

                {authLoading && (
                  <div className="h-11 w-[110px] animate-pulse rounded-[14px] bg-slate-100" />
                )}

                {!authLoading &&
                  !isAuthenticated && (
                    <Link
                      to="/connexion"
                      className="flex h-11 items-center justify-center rounded-[14px] bg-blue-600 px-5 text-sm font-black text-white"
                    >
                      {isArabic
                        ? 'تسجيل الدخول'
                        : 'Connexion'}
                    </Link>
                  )}

                {!authLoading &&
                  isAuthenticated && (
                    <div
                      data-teo-account
                      className="relative"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(
                            (
                              current,
                            ) =>
                              !current,
                          )

                          setIsNotificationOpen(
                            false,
                          )
                        }}
                        className="flex h-11 items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-2.5"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                          {
                            profileInitial
                          }
                        </span>

                        <span className="max-w-[110px] truncate text-xs font-black text-slate-800">
                          {
                            profileName
                          }
                        </span>
                      </button>

                      {isAccountMenuOpen && (
                        <div
                          className={[
                            'absolute top-[calc(100%+10px)] z-[140] w-[250px] rounded-[18px] border border-slate-200 bg-white p-2 shadow-xl',
                            isArabic
                              ? 'left-0'
                              : 'right-0',
                          ].join(
                            ' ',
                          )}
                        >
                          <div className="rounded-[14px] bg-slate-50 p-3">
                            <p className="truncate text-sm font-black text-slate-950">
                              {
                                profileName
                              }
                            </p>

                            {currentUser?.email && (
                              <p
                                dir="ltr"
                                className="mt-1 truncate text-left text-xs text-slate-500"
                              >
                                {
                                  currentUser.email
                                }
                              </p>
                            )}
                          </div>

                          <Link
                            to="/profil"
                            onClick={() =>
                              setIsAccountMenuOpen(
                                false,
                              )
                            }
                            className="mt-1 flex rounded-[12px] px-3 py-3 text-sm font-black text-slate-700 hover:bg-blue-50"
                          >
                            {isArabic
                              ? 'حسابي'
                              : 'Mon compte'}
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              void handleLogout()
                            }
                            disabled={
                              isLoggingOut
                            }
                            className="mt-1 w-full rounded-[12px] px-3 py-3 text-start text-sm font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            {isArabic
                              ? 'تسجيل الخروج'
                              : 'Déconnexion'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 py-2 text-sm font-semibold">
              <Link to="/services-numeriques">{isArabic ? 'جميع الخدمات' : 'Catalogue'}</Link>
              <Link to="/services-numeriques?category=ai">{isArabic ? 'الذكاء الاصطناعي' : 'IA'}</Link>
              <Link to="/services-numeriques?category=gaming">Gaming</Link>
              <Link to="/services-numeriques?category=streaming">Streaming</Link>
              <Link to="/services-numeriques?category=gift-cards">{isArabic ? 'بطاقات الهدايا' : 'Cartes cadeaux'}</Link>
            </div>
          </div>

          <div className="xl:hidden">
            <div className="flex min-h-[64px] items-center justify-between gap-2">
              <Link
                to="/"
                onClick={() => {
                  setIsMenuOpen(
                    false,
                  )

                  setIsSearchOpen(
                    false,
                  )

                  setIsNotificationOpen(
                    false,
                  )
                }}
                className="flex min-w-0 items-center gap-2.5"
              >
                {brandLogo('mobile')}

                <div className="min-w-0">
                  <p className="truncate text-[15px] font-black text-slate-950">
                    {storeBranding.storeName}
                  </p>

                  <p className="truncate text-xs text-slate-400">
                    Digital Services
                  </p>
                </div>
              </Link>

              <div className="flex shrink-0 items-center gap-1.5">
                <ThemeSwitch arabic={isArabic} />
                {!authLoading &&
                  isAuthenticated &&
                  notificationButton}

                {!authLoading &&
                  isAuthenticated && (
                    <Link
                      to="/profil"
                      onClick={() => {
                        setIsMenuOpen(
                          false,
                        )

                        setIsNotificationOpen(
                          false,
                        )
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white"
                    >
                      {
                        profileInitial
                      }
                    </Link>
                  )}

                <button
                  type="button"
                  onClick={() => {
                    toggleLanguage()

                    setIsNotificationOpen(
                      false,
                    )
                  }}
                  className="flex h-10 min-w-[42px] items-center justify-center rounded-[13px] border border-slate-200 bg-white px-2.5 text-xs font-black text-slate-700"
                >
                  {isArabic
                    ? 'FR'
                    : 'AR'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(
                      (
                        current,
                      ) =>
                        !current,
                    )

                    setIsNotificationOpen(
                      false,
                    )
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-slate-200 bg-white text-slate-800"
                  aria-label={
                    isArabic
                      ? 'القائمة'
                      : 'Menu'
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    {isMenuOpen ? (
                      <>
                        <path d="M6 6l12 12" />

                        <path d="M18 6L6 18" />
                      </>
                    ) : (
                      <>
                        <path d="M4 7h16" />

                        <path d="M4 12h16" />

                        <path d="M4 17h16" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="pb-3">
              {searchBox}
            </div>
          </div>
        </Container>

        {isMenuOpen && (
          <div className="border-t border-slate-100 bg-white xl:hidden">
            <Container className="py-3">
              <nav className="grid gap-2">
                <Link
                  to="/"
                  onClick={() =>
                    setIsMenuOpen(
                      false,
                    )
                  }
                  className="rounded-[14px] border border-slate-200 px-4 py-3 text-sm font-black text-slate-800"
                >
                  {isArabic
                    ? 'الرئيسية'
                    : 'Accueil'}
                </Link>

                <Link
                  to="/services-numeriques"
                  onClick={() =>
                    setIsMenuOpen(
                      false,
                    )
                  }
                  className="rounded-[14px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700"
                >
                  {isArabic
                    ? 'الخدمات الرقمية'
                    : 'Services numériques'}
                </Link>

                {!authLoading &&
                  !isAuthenticated && (
                    <>
                      <Link
                        to="/connexion"
                        onClick={() =>
                          setIsMenuOpen(
                            false,
                          )
                        }
                        className="rounded-[14px] border border-slate-200 px-4 py-3 text-center text-sm font-black text-slate-800"
                      >
                        {isArabic
                          ? 'تسجيل الدخول'
                          : 'Connexion'}
                      </Link>

                      <Link
                        to="/inscription"
                        onClick={() =>
                          setIsMenuOpen(
                            false,
                          )
                        }
                        className="rounded-[14px] bg-blue-600 px-4 py-3 text-center text-sm font-black text-white"
                      >
                        {isArabic
                          ? 'إنشاء حساب'
                          : 'Créer un compte'}
                      </Link>
                    </>
                  )}

                {!authLoading &&
                  isAuthenticated && (
                    <>
                      <Link
                        to="/profil"
                        onClick={() =>
                          setIsMenuOpen(
                            false,
                          )
                        }
                        className="rounded-[14px] border border-slate-200 px-4 py-3 text-sm font-black text-slate-800"
                      >
                        {isArabic
                          ? 'حسابي'
                          : 'Mon compte'}
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          void handleLogout()
                        }
                        disabled={
                          isLoggingOut
                        }
                        className="rounded-[14px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 disabled:opacity-50"
                      >
                        {isArabic
                          ? 'تسجيل الخروج'
                          : 'Déconnexion'}
                      </button>
                    </>
                  )}
              </nav>
            </Container>
          </div>
        )}
      </header>
    </div>
  )
}

export default PublicHeader
