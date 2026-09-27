import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

type NavigationItem = {
  label: string
  description: string
  to: string
  end?: boolean
  icon: ReactNode
  badge?: number
}

type NavigationGroup = {
  label: string
  items: NavigationItem[]
}

type AdminProfile = {
  email: string
  name: string
}

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect
        x="3.5"
        y="3.5"
        width="7"
        height="7"
        rx="2"
      />

      <rect
        x="13.5"
        y="3.5"
        width="7"
        height="4"
        rx="2"
      />

      <rect
        x="13.5"
        y="10.5"
        width="7"
        height="10"
        rx="2"
      />

      <rect
        x="3.5"
        y="13.5"
        width="7"
        height="7"
        rx="2"
      />
    </svg>
  )
}

function ServicesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1.7"
      />

      <rect
        x="14"
        y="4"
        width="6"
        height="6"
        rx="1.7"
      />

      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1.7"
      />

      <rect
        x="14"
        y="14"
        width="6"
        height="6"
        rx="1.7"
      />
    </svg>
  )
}

function PlansIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="3"
      />

      <path d="M8 9h8" />
      <path d="M8 13h5" />
      <path d="M8 17h3" />
    </svg>
  )
}

function EsimIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="3"
      />

      <path d="M9 8h6" />
      <path d="M9 12h2" />
      <path d="M13 12h2" />
      <path d="M9 16h6" />
    </svg>
  )
}

function OrdersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M7 3.5h10v17H7z" />
      <path d="M9.5 8h5" />
      <path d="M9.5 12h5" />
      <path d="M9.5 16h3" />
    </svg>
  )
}

function PaymentsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
      />

      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  )
}

function ReviewsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M4.5 5.5h15v11h-9l-4 3v-3h-2z" />
      <path d="M8 10.5 10.4 13 16 7.5" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <circle
        cx="12"
        cy="12"
        r="3"
      />

      <path d="M12 2.8v2.4" />
      <path d="M12 18.8v2.4" />
      <path d="m5.5 5.5 1.7 1.7" />
      <path d="m16.8 16.8 1.7 1.7" />
      <path d="M2.8 12h2.4" />
      <path d="M18.8 12h2.4" />
      <path d="m5.5 18.5 1.7-1.7" />
      <path d="m16.8 7.2 1.7-1.7" />
    </svg>
  )
}

function AdminLayout() {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  const profileMenuRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false)

  const [
    isProfileOpen,
    setIsProfileOpen,
  ] = useState(false)

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false)

  const [
    isOnline,
    setIsOnline,
  ] = useState(
    navigator.onLine,
  )

  const [
    adminProfile,
    setAdminProfile,
  ] =
    useState<AdminProfile | null>(
      null,
    )

  const [
    hasSession,
    setHasSession,
  ] = useState(false)

  const [
    newReviewsCount,
    setNewReviewsCount,
  ] = useState(0)

  const loadNewReviewsCount =
    useCallback(
      async () => {
        try {
          const [
            storeReviewsResult,
            productReviewsResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  'store_reviews',
                )
                .select(
                  'id',
                  {
                    count:
                      'exact',

                    head:
                      true,
                  },
                )
                .is(
                  'reviewed_at',
                  null,
                ),

              supabase
                .from(
                  'digital_order_reviews',
                )
                .select(
                  'id',
                  {
                    count:
                      'exact',

                    head:
                      true,
                  },
                )
                .is(
                  'reviewed_at',
                  null,
                ),
            ])

          if (
            storeReviewsResult.error
          ) {
            console.error(
              'Unable to load new store reviews count:',
              storeReviewsResult.error,
            )
          }

          if (
            productReviewsResult.error
          ) {
            console.error(
              'Unable to load new product reviews count:',
              productReviewsResult.error,
            )
          }

          const storeCount =
            storeReviewsResult.error
              ? 0
              : storeReviewsResult.count ??
                0

          const productCount =
            productReviewsResult.error
              ? 0
              : productReviewsResult.count ??
                0

          setNewReviewsCount(
            storeCount +
              productCount,
          )
        } catch (error) {
          console.error(
            'Unable to load new reviews count:',
            error,
          )
        }
      },
      [],
    )

  const navigationGroups:
    NavigationGroup[] = [
    {
      label: 'Pilotage',

      items: [
        {
          label:
            'Dashboard',

          description:
            'Vue générale du système',

          to: '/admin',

          end: true,

          icon:
            <DashboardIcon />,
        },

        {
          label:
            'Commandes',

          description:
            'Commandes et traitement',

          to:
            '/admin/orders',

          icon:
            <OrdersIcon />,
        },

        {
          label:
            'Paiements',

          description:
            'Paiements et vérifications',

          to:
            '/admin/payments',

          icon:
            <PaymentsIcon />,
        },

        {
          label:
            'Avis',

          description:
            'Boutique et produits',

          to:
            '/admin/store-reviews',

          icon:
            <ReviewsIcon />,

          badge:
            newReviewsCount,
        },
      ],
    },

    {
      label: 'Catalogue',

      items: [
        {
          label:
            'Services',

          description:
            'Services numériques',

          to:
            '/admin/services',

          icon:
            <ServicesIcon />,
        },

        {
          label:
            'Plans',

          description:
            'Formules et tarifs',

          to:
            '/admin/plans',

          icon:
            <PlansIcon />,
        },

        {
          label:
            'eSIM',

          description:
            'Destinations et forfaits',

          to:
            '/admin/esim',

          icon:
            <EsimIcon />,
        },
      ],
    },

    {
      label: 'Système',

      items: [
        {
          label:
            'Paramètres',

          description:
            'Configuration globale',

          to:
            '/admin/settings',

          icon:
            <SettingsIcon />,
        },
      ],
    },
  ]

  useEffect(() => {
    let mounted =
      true

    const loadAdmin =
      async () => {
        const {
          data,
        } =
          await supabase
            .auth
            .getUser()

        if (!mounted) {
          return
        }

        const user =
          data.user

        if (!user) {
          setHasSession(
            false,
          )

          setAdminProfile(
            null,
          )

          return
        }

        const metadataName =
          user
            .user_metadata
            ?.full_name

        const email =
          user.email ?? ''

        const fallbackName =
          email
            .split('@')[0] ||
          'Admin'

        setHasSession(
          true,
        )

        setAdminProfile({
          email,

          name:
            typeof metadataName ===
              'string' &&
            metadataName
              .trim()
              .length > 0
              ? metadataName.trim()
              : fallbackName,
        })
      }

    void loadAdmin()

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
            if (!mounted) {
              return
            }

            const user =
              session?.user

            if (!user) {
              setHasSession(
                false,
              )

              setAdminProfile(
                null,
              )

              return
            }

            const metadataName =
              user
                .user_metadata
                ?.full_name

            const email =
              user.email ?? ''

            setHasSession(
              true,
            )

            setAdminProfile({
              email,

              name:
                typeof metadataName ===
                  'string' &&
                metadataName
                  .trim()
                  .length >
                  0
                  ? metadataName.trim()
                  : email
                      .split(
                        '@',
                      )[0] ||
                    'Admin',
            })
          },
        )

    return () => {
      mounted = false

      authListener
        .subscription
        .unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active =
      true

    void loadNewReviewsCount()

    const storeReviewsChannel =
      supabase
        .channel(
          `admin-store-review-badge-${Date.now()}`,
        )
        .on(
          'postgres_changes',
          {
            event:
              '*',

            schema:
              'public',

            table:
              'store_reviews',
          },
          () => {
            if (!active) {
              return
            }

            void loadNewReviewsCount()
          },
        )
        .subscribe()

    const productReviewsChannel =
      supabase
        .channel(
          `admin-product-review-badge-${Date.now()}`,
        )
        .on(
          'postgres_changes',
          {
            event:
              '*',

            schema:
              'public',

            table:
              'digital_order_reviews',
          },
          () => {
            if (!active) {
              return
            }

            void loadNewReviewsCount()
          },
        )
        .subscribe()

    const handleFocus =
      () => {
        if (!active) {
          return
        }

        void loadNewReviewsCount()
      }

    const handleVisibility =
      () => {
        if (
          !active ||
          document
            .visibilityState !==
            'visible'
        ) {
          return
        }

        void loadNewReviewsCount()
      }

    window.addEventListener(
      'focus',
      handleFocus,
    )

    document.addEventListener(
      'visibilitychange',
      handleVisibility,
    )

    return () => {
      active = false

      window.removeEventListener(
        'focus',
        handleFocus,
      )

      document.removeEventListener(
        'visibilitychange',
        handleVisibility,
      )

      void supabase
        .removeChannel(
          storeReviewsChannel,
        )

      void supabase
        .removeChannel(
          productReviewsChannel,
        )
    }
  }, [
    loadNewReviewsCount,
  ])

  useEffect(() => {
    const handleOnline =
      () => {
        setIsOnline(
          true,
        )
      }

    const handleOffline =
      () => {
        setIsOnline(
          false,
        )
      }

    window.addEventListener(
      'online',
      handleOnline,
    )

    window.addEventListener(
      'offline',
      handleOffline,
    )

    return () => {
      window.removeEventListener(
        'online',
        handleOnline,
      )

      window.removeEventListener(
        'offline',
        handleOffline,
      )
    }
  }, [])

  useEffect(() => {
    const handleOutsideClick =
      (
        event:
          MouseEvent,
      ) => {
        const target =
          event.target as Node

        if (
          profileMenuRef.current &&
          !profileMenuRef.current.contains(
            target,
          )
        ) {
          setIsProfileOpen(
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
    setIsMobileMenuOpen(
      false,
    )

    setIsProfileOpen(
      false,
    )

    void loadNewReviewsCount()
  }, [
    location.pathname,
    loadNewReviewsCount,
  ])

  const profileInitial =
    adminProfile
      ?.name
      ?.trim()
      .charAt(0)
      .toUpperCase() ||
    'A'

  const connectionState =
    !hasSession
      ? 'disconnected'
      : !isOnline
        ? 'offline'
        : 'online'

  const connectionDotClass =
    connectionState ===
    'online'
      ? 'bg-emerald-400'
      : connectionState ===
          'offline'
        ? 'bg-amber-400'
        : 'bg-rose-500'

  const connectionLabel =
    connectionState ===
    'online'
      ? 'Connexion active'
      : connectionState ===
          'offline'
        ? 'Mode hors ligne'
        : 'Session inactive'

  const handleLogout =
    async () => {
      if (isLoggingOut) {
        return
      }

      setIsLoggingOut(
        true,
      )

      setIsProfileOpen(
        false,
      )

      setIsMobileMenuOpen(
        false,
      )

      try {
        await supabase
          .auth
          .signOut()

        navigate(
          '/admin/login',
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

  const renderNavigation =
    (
      mobile =
        false,
    ) => (
      <nav
        className={
          mobile
            ? 'space-y-6'
            : 'space-y-7'
        }
      >
        {navigationGroups.map(
          (
            group,
          ) => (
            <div
              key={
                group.label
              }
            >
              <p
                className={[
                  'mb-2.5 px-3 font-black uppercase tracking-[0.14em] text-slate-400',
                  mobile
                    ? 'text-[10px]'
                    : 'text-[9px]',
                ].join(
                  ' ',
                )}
              >
                {
                  group.label
                }
              </p>

              <div className="space-y-1.5">
                {group.items.map(
                  (
                    item,
                  ) => (
                    <NavLink
                      key={
                        item.to
                      }
                      to={
                        item.to
                      }
                      end={
                        item.end
                      }
                      className={({
                        isActive,
                      }) =>
                        [
                          'group flex items-center gap-3 rounded-[16px] border px-3.5 transition',
                          mobile
                            ? 'min-h-[64px]'
                            : 'min-h-[58px]',
                          isActive
                            ? 'border-blue-100 bg-blue-50 text-blue-700 shadow-[0_7px_20px_rgba(37,99,235,0.06)]'
                            : 'border-transparent text-slate-600 hover:border-slate-100 hover:bg-slate-50 hover:text-slate-950',
                        ].join(
                          ' ',
                        )
                      }
                    >
                      {({
                        isActive,
                      }) => (
                        <>
                          <span
                            className={[
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] transition',
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-800',
                            ].join(
                              ' ',
                            )}
                          >
                            {
                              item.icon
                            }
                          </span>

                          <span className="min-w-0 flex-1">
                            <span
                              className={[
                                'block truncate font-black',
                                mobile
                                  ? 'text-[14px]'
                                  : 'text-[13px]',
                              ].join(
                                ' ',
                              )}
                            >
                              {
                                item.label
                              }
                            </span>

                            <span
                              className={[
                                'mt-1 block truncate font-semibold',
                                isActive
                                  ? 'text-blue-500'
                                  : 'text-slate-400',
                                mobile
                                  ? 'text-[10px]'
                                  : 'text-[9px]',
                              ].join(
                                ' ',
                              )}
                            >
                              {
                                item.description
                              }
                            </span>
                          </span>

                          <span className="flex shrink-0 items-center gap-2">
                            {typeof item.badge ===
                              'number' &&
                              item.badge >
                                0 && (
                                <span
                                  dir="ltr"
                                  className={[
                                    'flex min-w-[22px] items-center justify-center rounded-full px-1.5 font-black leading-none',
                                    mobile
                                      ? 'h-6 text-[10px]'
                                      : 'h-[22px] text-[9px]',
                                    isActive
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-rose-500 text-white shadow-[0_4px_12px_rgba(244,63,94,0.25)]',
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  {item.badge >
                                  99
                                    ? '99+'
                                    : item.badge}
                                </span>
                              )}

                            <span
                              className={[
                                'text-sm transition',
                                isActive
                                  ? 'opacity-100'
                                  : 'opacity-0 group-hover:opacity-40',
                              ].join(
                                ' ',
                              )}
                            >
                              →
                            </span>
                          </span>
                        </>
                      )}
                    </NavLink>
                  ),
                )}
              </div>
            </div>
          ),
        )}
      </nav>
    )

  return (
    <div
      dir="ltr"
      className="min-h-screen bg-[#f4f7fb] text-slate-950"
    >
      <div className="flex min-h-screen">
        <aside
          className={[
            'sticky top-0 hidden h-screen w-[300px] shrink-0 bg-white lg:flex lg:flex-col',
            'border-r border-slate-200/80',
          ].join(
            ' ',
          )}
        >
          <div className="px-6 pb-5 pt-6">
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] text-lg font-black text-white shadow-[0_10px_26px_rgba(37,99,235,0.22)]"
                style={{
                  background:
                    'linear-gradient(145deg, #2563eb 0%, #4338ca 100%)',
                }}
              >
                T
              </div>

              <div className="min-w-0">
                <p className="truncate text-[17px] font-black tracking-[-0.02em] text-slate-950">
                  TEO STORE
                </p>

                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Administration
                </p>
              </div>
            </div>
          </div>

          <div className="mx-6 h-px bg-slate-100" />

          <div className="flex-1 overflow-y-auto px-4 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {renderNavigation()}
          </div>

          <div className="border-t border-slate-100 p-4">
            <button
              type="button"
              onClick={() =>
                setIsProfileOpen(
                  true,
                )
              }
              className={[
                'flex w-full items-center gap-3 rounded-[17px] border border-slate-100 bg-slate-50 p-3.5 transition hover:border-blue-100 hover:bg-blue-50/50',
                'text-left',
              ].join(
                ' ',
              )}
            >
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-[12px] font-black text-white">
                  {
                    profileInitial
                  }
                </div>

                <span
                  className={[
                    'absolute bottom-0 h-3.5 w-3.5 rounded-full border-2 border-slate-50',
                    'right-0',
                    connectionDotClass,
                  ].join(
                    ' ',
                  )}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-black text-slate-900">
                  {adminProfile
                    ?.name ??
                    'Administrateur'}
                </p>

                <p
                  dir="ltr"
                  className="mt-1 truncate text-left text-[9px] font-semibold text-slate-400"
                >
                  {adminProfile
                    ?.email ??
                    'TEO STORE'}
                </p>
              </div>

              <span className="text-sm text-slate-300">
                •••
              </span>
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div className="flex h-[72px] items-center justify-between gap-3 px-4 sm:px-6 lg:h-[76px] lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setIsMobileMenuOpen(
                      true,
                    )
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
                  aria-label="Ouvrir le menu"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </svg>
                </button>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">
                    TEO STORE
                  </p>

                  <h1 className="mt-1 truncate text-base font-black tracking-[-0.02em] text-slate-950 sm:text-lg">
                    Administration
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  ref={
                    profileMenuRef
                  }
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setIsProfileOpen(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    className={[
                      'relative flex h-11 w-11 items-center justify-center rounded-full border-2 text-[12px] font-black uppercase transition',
                      isProfileOpen
                        ? 'border-blue-600 bg-blue-600 text-white shadow-[0_10px_28px_rgba(37,99,235,0.22)]'
                        : 'border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-300',
                    ].join(
                      ' ',
                    )}
                    aria-label="Compte administrateur"
                  >
                    {
                      profileInitial
                    }

                    <span
                      title={
                        connectionLabel
                      }
                      className={[
                        'absolute bottom-0 h-3.5 w-3.5 rounded-full border-[2.5px] border-white',
                        'right-0',
                        connectionDotClass,
                      ].join(
                        ' ',
                      )}
                    />
                  </button>

                  {isProfileOpen && (
                    <div
                      className={[
                        'absolute top-[calc(100%+12px)] z-[70] w-[290px] overflow-hidden rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_25px_80px_rgba(15,23,42,0.20)]',
                        'right-0',
                      ].join(
                        ' ',
                      )}
                    >
                      <div className="rounded-[17px] bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                              {
                                profileInitial
                              }
                            </div>

                            <span
                              className={[
                                'absolute bottom-0 h-3.5 w-3.5 rounded-full border-2 border-slate-50',
                                'right-0',
                                connectionDotClass,
                              ].join(
                                ' ',
                              )}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950">
                              {adminProfile
                                ?.name ??
                                'Administrateur'}
                            </p>

                            <p
                              dir="ltr"
                              className="mt-1 truncate text-left text-[10px] font-semibold text-slate-400"
                            >
                              {adminProfile
                                ?.email ??
                                'TEO STORE'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-white px-3 py-2.5">
                          <span
                            className={[
                              'h-2.5 w-2.5 rounded-full',
                              connectionDotClass,
                            ].join(
                              ' ',
                            )}
                          />

                          <span className="text-[10px] font-black text-slate-600">
                            {
                              connectionLabel
                            }
                          </span>
                        </div>
                      </div>

                      <NavLink
                        to="/admin/settings"
                        onClick={() =>
                          setIsProfileOpen(
                            false,
                          )
                        }
                        className="mt-2 flex items-center justify-between rounded-[14px] px-3 py-3 text-xs font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <span className="flex items-center gap-2">
                          <SettingsIcon />

                          Paramètres
                        </span>

                        <span>
                          →
                        </span>
                      </NavLink>

                      <div className="my-1 h-px bg-slate-100" />

                      <button
                        type="button"
                        onClick={() =>
                          void handleLogout()
                        }
                        disabled={
                          isLoggingOut
                        }
                        className={[
                          'flex w-full items-center justify-between rounded-[14px] px-3 py-3 text-xs font-black transition',
                          isLoggingOut
                            ? 'cursor-not-allowed text-slate-300'
                            : 'text-rose-600 hover:bg-rose-50',
                        ].join(
                          ' ',
                        )}
                      >
                        <span>
                          {isLoggingOut
                            ? 'Déconnexion...'
                            : 'Déconnexion'}
                        </span>

                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          className="h-4 w-4"
                        >
                          <path d="M10 5H5v14h5" />
                          <path d="M14 8l4 4-4 4" />
                          <path d="M18 12H9" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="p-3 sm:p-5 lg:p-7 xl:p-8">
            <div className="mx-auto max-w-[1540px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            onClick={() =>
              setIsMobileMenuOpen(
                false,
              )
            }
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            aria-label="Fermer le menu"
          />

          <aside
            className={[
              'absolute bottom-0 top-0 flex w-[88%] max-w-[360px] flex-col bg-white shadow-[20px_0_70px_rgba(15,23,42,0.18)]',
              'left-0 border-r border-slate-200',
            ].join(
              ' ',
            )}
          >
            <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-[14px] text-base font-black text-white"
                  style={{
                    background:
                      'linear-gradient(145deg, #2563eb 0%, #4338ca 100%)',
                  }}
                >
                  T
                </div>

                <div>
                  <p className="text-base font-black text-slate-950">
                    TEO STORE
                  </p>

                  <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Admin Control
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsMobileMenuOpen(
                    false,
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                aria-label="Fermer le menu"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-5">
              {renderNavigation(
                true,
              )}
            </div>

            <div className="border-t border-slate-100 p-3">
              <div className="flex items-center gap-3 rounded-[16px] bg-slate-50 p-3.5">
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                    {
                      profileInitial
                    }
                  </div>

                  <span
                    className={[
                      'absolute bottom-0 h-3.5 w-3.5 rounded-full border-2 border-slate-50',
                      'right-0',
                      connectionDotClass,
                    ].join(
                      ' ',
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-slate-900">
                    {adminProfile
                      ?.name ??
                      'Administrateur'}
                  </p>

                  <p className="mt-1 text-[9px] font-semibold text-slate-400">
                    {
                      connectionLabel
                    }
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default AdminLayout