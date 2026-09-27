import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Link,
  NavLink,
  useNavigate,
} from 'react-router-dom'

import {
  getLocalizedCategory,
  getLocalizedServiceName,
} from '../../features/digital-commerce/data/serviceCatalogTranslations'

import {
  searchServices,
} from '../../features/digital-commerce/utils/searchServices'

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
  orderNumber: string
  serviceName: string
  status: string
  updatedAt: string
  createdAt: string
}

type LiveToast = {
  orderNumber: string
  serviceName: string
  status: string
}

function PublicHeader() {
  const navigate = useNavigate()

  const {
    language,
    toggleLanguage,
  } = useLanguage()

  const isArabic =
    language === 'ar'

  const accountMenuRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const searchContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const notificationRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const knownUpdatesRef =
    useRef<Record<string, string>>(
      {},
    )

  const toastTimerRef =
    useRef<number | null>(
      null,
    )

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

  const [
    readUpdates,
    setReadUpdates,
  ] =
    useState<Record<string, string>>(
      {},
    )

  const [
    liveToast,
    setLiveToast,
  ] =
    useState<LiveToast | null>(
      null,
    )

  const getStorageKey =
    useCallback(
      (userId: string) =>
        `teo-store-order-notifications:${userId}`,
      [],
    )

  const getStatusLabel =
    useCallback(
      (status: string) => {
        switch (status) {
          case 'payment_review':
            return isArabic
              ? 'يتم التحقق من الدفع'
              : 'Paiement en vérification'

          case 'payment_partial':
            return isArabic
              ? 'الدفع غير مكتمل'
              : 'Paiement incomplet'

          case 'payment_confirmed':
            return isArabic
              ? 'تم تأكيد الدفع'
              : 'Paiement confirmé'

          case 'processing':
            return isArabic
              ? 'الطلب قيد التجهيز'
              : 'Commande en préparation'

          case 'fulfillment_sent':
            return isArabic
              ? 'تم إرسال الخدمة'
              : 'Service livré'

          case 'disputed':
            return isArabic
              ? 'نزاع مفتوح'
              : 'Litige ouvert'

          case 'completed':
            return isArabic
              ? 'تم إكمال الطلب'
              : 'Commande terminée'

          case 'cancelled':
            return isArabic
              ? 'تم إلغاء الطلب'
              : 'Commande annulée'

          case 'refunded':
            return isArabic
              ? 'تم تسجيل الاسترجاع'
              : 'Remboursement enregistré'

          default:
            return isArabic
              ? 'تحديث جديد على طلبك'
              : 'Nouvelle mise à jour'
        }
      },
      [
        isArabic,
      ],
    )

  const getStatusIcon =
    (
      status: string,
    ) => {
      if (
        status ===
        'completed'
      ) {
        return '✓'
      }

      if (
        status ===
        'cancelled'
      ) {
        return '×'
      }

      if (
        status ===
        'fulfillment_sent'
      ) {
        return '↗'
      }

      return '•'
    }

  const getStatusIconClasses =
    (
      status: string,
    ) => {
      if (
        status ===
        'completed'
      ) {
        return 'bg-emerald-50 text-emerald-600'
      }

      if (
        status ===
          'cancelled' ||
        status ===
          'disputed'
      ) {
        return 'bg-rose-50 text-rose-600'
      }

      if (
        status ===
        'payment_partial'
      ) {
        return 'bg-orange-50 text-orange-600'
      }

      if (
        status ===
        'fulfillment_sent'
      ) {
        return 'bg-violet-50 text-violet-600'
      }

      return 'bg-blue-50 text-blue-600'
    }

  const formatNotificationDate =
    (
      value: string,
    ) => {
      try {
        return new Intl.DateTimeFormat(
          isArabic
            ? 'ar-MR-u-nu-latn'
            : 'fr-FR-u-nu-latn',
          {
            numberingSystem:
              'latn',
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          },
        ).format(
          new Date(value),
        )
      } catch {
        return ''
      }
    }

  const persistReadUpdates =
    useCallback(
      (
        next:
          Record<string, string>,
      ) => {
        setReadUpdates(
          next,
        )

        if (!currentUser) {
          return
        }

        try {
          window.localStorage.setItem(
            getStorageKey(
              currentUser.id,
            ),
            JSON.stringify(
              next,
            ),
          )
        } catch {
          //
        }
      },
      [
        currentUser,
        getStorageKey,
      ],
    )

  const loadNotifications =
    useCallback(
      async (
        userId: string,
        showLoading = false,
        detectUpdates = false,
      ) => {
        if (showLoading) {
          setNotificationsLoading(
            true,
          )
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'digital_orders',
            )
            .select(
              `
                order_number,
                service_name,
                status,
                updated_at,
                created_at
              `,
            )
            .eq(
              'user_id',
              userId,
            )
            .order(
              'updated_at',
              {
                ascending:
                  false,
              },
            )
            .limit(8)

        if (showLoading) {
          setNotificationsLoading(
            false,
          )
        }

        if (error) {
          console.error(
            'Unable to load order notifications:',
            error,
          )

          return
        }

        const nextNotifications:
          OrderNotification[] =
            (data ?? []).map(
              (row) => ({
                orderNumber:
                  String(
                    row.order_number,
                  ),

                serviceName:
                  String(
                    row.service_name ??
                      'TEO STORE',
                  ),

                status:
                  String(
                    row.status ??
                      'payment_review',
                  ),

                updatedAt:
                  String(
                    row.updated_at,
                  ),

                createdAt:
                  String(
                    row.created_at,
                  ),
              }),
            )

        if (detectUpdates) {
          for (
            const notification
            of nextNotifications
          ) {
            const previous =
              knownUpdatesRef
                .current[
                notification.orderNumber
              ]

            if (
              previous &&
              previous !==
                notification.updatedAt
            ) {
              setLiveToast({
                orderNumber:
                  notification.orderNumber,

                serviceName:
                  notification.serviceName,

                status:
                  notification.status,
              })

              if (
                toastTimerRef.current
              ) {
                window.clearTimeout(
                  toastTimerRef.current,
                )
              }

              toastTimerRef.current =
                window.setTimeout(
                  () => {
                    setLiveToast(
                      null,
                    )
                  },
                  5000,
                )

              break
            }
          }
        }

        const nextKnown:
          Record<string, string> =
            {}

        nextNotifications.forEach(
          (
            notification,
          ) => {
            nextKnown[
              notification.orderNumber
            ] =
              notification.updatedAt
          },
        )

        knownUpdatesRef.current =
          nextKnown

        setNotifications(
          nextNotifications,
        )
      },
      [],
    )

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

  useEffect(() => {
    if (!currentUser) {
      setNotifications(
        [],
      )

      setReadUpdates(
        {},
      )

      knownUpdatesRef.current =
        {}

      return
    }

    try {
      const stored =
        window.localStorage
          .getItem(
            getStorageKey(
              currentUser.id,
            ),
          )

      setReadUpdates(
        stored
          ? JSON.parse(
              stored,
            )
          : {},
      )
    } catch {
      setReadUpdates(
        {},
      )
    }

    void loadNotifications(
      currentUser.id,
      true,
      false,
    )

    const channel =
      supabase
        .channel(
          `customer-global-orders-${currentUser.id}-${Date.now()}`,
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table:
              'digital_orders',
            filter:
              `user_id=eq.${currentUser.id}`,
          },
          () => {
            void loadNotifications(
              currentUser.id,
              false,
              true,
            )
          },
        )
        .subscribe()

    const interval =
      window.setInterval(
        () => {
          if (
            document.visibilityState ===
            'visible'
          ) {
            void loadNotifications(
              currentUser.id,
              false,
              true,
            )
          }
        },
        6000,
      )

    const handleFocus =
      () => {
        void loadNotifications(
          currentUser.id,
          false,
          true,
        )
      }

    window.addEventListener(
      'focus',
      handleFocus,
    )

    return () => {
      window.clearInterval(
        interval,
      )

      window.removeEventListener(
        'focus',
        handleFocus,
      )

      void supabase
        .removeChannel(
          channel,
        )
    }
  }, [
    currentUser?.id,
    getStorageKey,
    loadNotifications,
  ])

  useEffect(() => {
    const handleOutsideClick =
      (
        event: MouseEvent,
      ) => {
        const target =
          event.target as Node

        if (
          accountMenuRef.current &&
          !accountMenuRef.current
            .contains(target)
        ) {
          setIsAccountMenuOpen(
            false,
          )
        }

        if (
          searchContainerRef.current &&
          !searchContainerRef.current
            .contains(target)
        ) {
          setIsSearchOpen(
            false,
          )
        }

        if (
          notificationRef.current &&
          !notificationRef.current
            .contains(target)
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

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (
            notification,
          ) =>
            readUpdates[
              notification.orderNumber
            ] !==
            notification.updatedAt,
        ).length,
      [
        notifications,
        readUpdates,
      ],
    )

  const markAllRead =
    useCallback(() => {
      if (
        notifications.length ===
        0
      ) {
        return
      }

      const nextReadUpdates = {
        ...readUpdates,
      }

      notifications.forEach(
        (
          notification,
        ) => {
          nextReadUpdates[
            notification.orderNumber
          ] =
            notification.updatedAt
        },
      )

      persistReadUpdates(
        nextReadUpdates,
      )
    }, [
      notifications,
      persistReadUpdates,
      readUpdates,
    ])

  const markCurrentNotificationsAsRead =
    useCallback(() => {
      if (
        !currentUser ||
        notifications.length ===
          0
      ) {
        return
      }

      const nextReadUpdates = {
        ...readUpdates,
      }

      notifications.forEach(
        (
          notification,
        ) => {
          nextReadUpdates[
            notification.orderNumber
          ] =
            notification.updatedAt
        },
      )

      persistReadUpdates(
        nextReadUpdates,
      )
    }, [
      currentUser,
      notifications,
      persistReadUpdates,
      readUpdates,
    ])

  const handleNotificationToggle =
    () => {
      const willOpen =
        !isNotificationOpen

      setIsNotificationOpen(
        willOpen,
      )

      setIsAccountMenuOpen(
        false,
      )

      setIsSearchOpen(
        false,
      )

      setIsMenuOpen(
        false,
      )

      if (willOpen) {
        markCurrentNotificationsAsRead()
      }
    }

  const handleNotificationSelect =
    (
      notification:
        OrderNotification,
    ) => {
      persistReadUpdates({
        ...readUpdates,

        [notification.orderNumber]:
          notification.updatedAt,
      })

      setIsNotificationOpen(
        false,
      )

      setIsMenuOpen(
        false,
      )

      navigate(
        `/commande/${notification.orderNumber}`,
      )
    }

  const results =
    useMemo(
      () =>
        searchServices(
          searchQuery,
          6,
        ),
      [
        searchQuery,
      ],
    )

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
      slug: string,
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
        `/services-numeriques/${slug}`,
      )
    }

  const handleSearchSubmit =
    () => {
      if (
        results.length ===
        0
      ) {
        return
      }

      handleServiceSelect(
        results[0]
          .service
          .slug,
      )
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
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[120] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-xl"
        >
          {results.length >
          0 ? (
            <div className="p-2">
              {results.map(
                ({
                  service,
                }) => (
                  <button
                    key={
                      service.slug
                    }
                    type="button"
                    onClick={() =>
                      handleServiceSelect(
                        service.slug,
                      )
                    }
                    className={[
                      'flex w-full items-center justify-between gap-3 rounded-[13px] px-3 py-3 transition hover:bg-blue-50',
                      isArabic
                        ? 'text-right'
                        : 'text-left',
                    ].join(
                      ' ',
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">
                        {getLocalizedServiceName(
                          service,
                          language,
                        )}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {getLocalizedCategory(
                          service.category,
                          language,
                        )}
                      </p>
                    </div>

                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
                      →
                    </span>
                  </button>
                ),
              )}
            </div>
          ) : (
            <div className="px-5 py-7 text-center">
              <p className="text-sm font-black text-slate-700">
                {isArabic
                  ? 'لم يتم العثور على نتيجة'
                  : 'Aucun résultat trouvé'}
              </p>
            </div>
          )}
        </div>
      )
    }

  const searchBox = (
    <div
      ref={
        searchContainerRef
      }
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

  const notificationButton =
    isAuthenticated ? (
      <div
        ref={
          notificationRef
        }
        className="relative"
      >
        <button
          type="button"
          onClick={
            handleNotificationToggle
          }
          className={[
            'relative flex h-10 w-10 items-center justify-center rounded-[13px] border bg-white text-slate-700 shadow-sm transition sm:h-11 sm:w-11',
            isNotificationOpen
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50',
          ].join(
            ' ',
          )}
          aria-label={
            isArabic
              ? 'الإشعارات'
              : 'Notifications'
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            className="h-[18px] w-[18px]"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />

            <path d="M10 21h4" />
          </svg>

          {unreadCount >
            0 && (
            <span
              dir="ltr"
              className="absolute -right-1.5 -top-1.5 flex min-h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-black text-white"
            >
              {unreadCount >
              9
                ? '9+'
                : unreadCount}
            </span>
          )}
        </button>

        {isNotificationOpen && (
          <div
            dir={
              isArabic
                ? 'rtl'
                : 'ltr'
            }
            className={[
              'absolute top-[calc(100%+7px)] z-[150] w-[258px] overflow-hidden rounded-[15px] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.18)] sm:w-[310px]',
              isArabic
                ? 'left-0'
                : 'right-0',
            ].join(
              ' ',
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
              <p className="text-[13px] font-black text-slate-950">
                {isArabic
                  ? 'الإشعارات'
                  : 'Notifications'}
              </p>

              {unreadCount >
                0 && (
                <button
                  type="button"
                  onClick={
                    markAllRead
                  }
                  className="text-[11px] font-black text-blue-600"
                >
                  {isArabic
                    ? 'قراءة الكل'
                    : 'Tout lire'}
                </button>
              )}
            </div>

            {notificationsLoading ? (
              <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">
                {isArabic
                  ? 'جارٍ التحميل...'
                  : 'Chargement...'}
              </div>
            ) : notifications.length >
              0 ? (
              <div className="max-h-[224px] overflow-y-auto p-1">
                {notifications.map(
                  (
                    notification,
                  ) => {
                    const unread =
                      readUpdates[
                        notification.orderNumber
                      ] !==
                      notification.updatedAt

                    return (
                      <button
                        key={`${notification.orderNumber}-${notification.updatedAt}`}
                        type="button"
                        onClick={() =>
                          handleNotificationSelect(
                            notification,
                          )
                        }
                        className={[
                          'flex w-full items-start gap-2 rounded-[11px] px-2 py-2 text-start transition hover:bg-blue-50',
                          unread
                            ? 'bg-blue-50/60'
                            : '',
                        ].join(
                          ' ',
                        )}
                      >
                        <span
                          className={[
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] text-xs font-black',
                            getStatusIconClasses(
                              notification.status,
                            ),
                          ].join(
                            ' ',
                          )}
                        >
                          {getStatusIcon(
                            notification.status,
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="min-w-0 flex-1 truncate text-xs font-black text-slate-950">
                              {
                                notification.serviceName
                              }
                            </p>

                            {unread && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                            )}
                          </div>

                          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
                            {getStatusLabel(
                              notification.status,
                            )}
                          </p>

                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span
                              dir="ltr"
                              className="truncate text-left text-[11px] font-black text-blue-600"
                            >
                              {
                                notification.orderNumber
                              }
                            </span>

                            <span
                              dir="ltr"
                              className="shrink-0 text-[10px] text-slate-400"
                            >
                              {formatNotificationDate(
                                notification.updatedAt,
                              )}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  },
                )}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-xs font-bold text-slate-500">
                {isArabic
                  ? 'لا توجد إشعارات'
                  : 'Aucune notification'}
              </div>
            )}
          </div>
        )}
      </div>
    ) : null

  return (
    <div
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
      className="sticky top-0 z-[60]"
    >
      {liveToast && (
        <button
          type="button"
          onClick={() => {
            setLiveToast(
              null,
            )

            navigate(
              `/commande/${liveToast.orderNumber}`,
            )
          }}
          className={[
            'fixed top-3 z-[300] w-[calc(100%-1.5rem)] max-w-[300px] rounded-[16px] border border-blue-100 bg-white p-3 text-start shadow-xl',
            isArabic
              ? 'left-3'
              : 'right-3',
          ].join(
            ' ',
          )}
        >
          <div className="flex items-start gap-2.5">
            <span
              className={[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] font-black',
                getStatusIconClasses(
                  liveToast.status,
                ),
              ].join(
                ' ',
              )}
            >
              {getStatusIcon(
                liveToast.status,
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-blue-600">
                TEO STORE
              </p>

              <p className="mt-1 text-[13px] font-black text-slate-950">
                {getStatusLabel(
                  liveToast.status,
                )}
              </p>

              <p className="mt-0.5 truncate text-xs text-slate-500">
                {
                  liveToast.serviceName
                }
              </p>
            </div>
          </div>
        </button>
      )}

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

      <header className="border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-xl">
        <Container>
          <div className="hidden xl:block">
            <div className="grid min-h-[76px] grid-cols-[235px_minmax(380px,1fr)_310px] items-center gap-6">
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
                <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 font-black text-white">
                  T
                </div>

                <div>
                  <p className="text-[17px] font-black text-slate-950">
                    TEO STORE
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
                      ref={
                        accountMenuRef
                      }
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

            <div className="border-t border-slate-100">
              <nav className="flex min-h-[48px] items-center justify-center gap-2">
                <NavLink
                  to="/"
                  end
                  className={({
                    isActive,
                  }) =>
                    [
                      'rounded-[12px] px-4 py-2.5 text-sm font-black',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600',
                    ].join(
                      ' ',
                    )
                  }
                >
                  {isArabic
                    ? 'الرئيسية'
                    : 'Accueil'}
                </NavLink>

                <NavLink
                  to="/services-numeriques"
                  className={({
                    isActive,
                  }) =>
                    [
                      'rounded-[12px] px-4 py-2.5 text-sm font-black',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600',
                    ].join(
                      ' ',
                    )
                  }
                >
                  {isArabic
                    ? 'الخدمات الرقمية'
                    : 'Services numériques'}
                </NavLink>
              </nav>
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white">
                  T
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[15px] font-black text-slate-950">
                    TEO STORE
                  </p>

                  <p className="truncate text-xs text-slate-400">
                    Digital Services
                  </p>
                </div>
              </Link>

              <div className="flex shrink-0 items-center gap-1.5">
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