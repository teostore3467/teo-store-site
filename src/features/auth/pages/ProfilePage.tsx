import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'

type DigitalOrderStatus =
  | 'payment_review'
  | 'payment_partial'
  | 'payment_confirmed'
  | 'processing'
  | 'fulfillment_sent'
  | 'disputed'
  | 'completed'
  | 'cancelled'
  | 'refunded'

type DigitalOrderRow = {
  id: string
  order_number: string
  user_id: string
  service_name: string
  plan_label: string
  total_amount: number
  currency: string
  amount_received: number | null
  amount_remaining: number | null
  payment_method_name: string | null
  fulfillment_sent_at: string | null
  customer_confirmed_at: string | null
  payment_issue_reason: string | null
  dispute_status: string | null
  dispute_reason_code: string | null
  dispute_reason: string | null
  status: string
  rejection_code: string | null
  rejection_reason: string | null
  rejected_at: string | null
  created_at: string
  updated_at: string
}

type CustomerNotificationRow = {
  id: string
  user_id: string
  order_id: string | null
  order_number: string | null
  type: string
  title: string
  message: string
  action_url: string | null
  is_read: boolean
  created_at: string
  read_at: string | null
}

type DigitalOrderReviewRow = {
  id: string
  order_id: string
  order_number: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

type StoreReviewRow = {
  id: string
  user_id: string
  milestone: number
  completed_orders_count: number
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

type ProfileUser = {
  id: string
  email: string
  phone: string
  fullName: string
}


type LoyaltySummary = {
  points_balance: number
  usable_points: number
  usable_value_mru: number
  progress_points: number
  points_to_next_reward: number
  lifetime_earned_points: number
}

type ProfileSection =
  | 'services'
  | 'loyalty'
  | 'security'
  | 'home'
  | 'orders'
  | 'notifications'
  | 'reviews'
  | 'account'
  | 'support'

type IconName =
  | 'orders'
  | 'bell'
  | 'star'
  | 'user'
  | 'support'
  | 'whatsapp'
  | 'store'
  | 'logout'
  | 'refresh'
  | 'home'
  | 'arrow'
  | 'globe'

function Icon({
  name,
  className = 'h-5 w-5',
}: {
  name: IconName
  className?: string
}) {
  const props = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'orders') {
    return (
      <svg {...props}>
        <path d="M6 4h12l1 16H5L6 4Z" />
        <path d="M9 8a3 3 0 0 0 6 0" />
      </svg>
    )
  }

  if (name === 'bell') {
    return (
      <svg {...props}>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    )
  }

  if (name === 'star') {
    return (
      <svg {...props}>
        <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
      </svg>
    )
  }

  if (name === 'user') {
    return (
      <svg {...props}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </svg>
    )
  }

  if (name === 'support') {
    return (
      <svg {...props}>
        <path d="M4 13a8 8 0 0 1 16 0" />
        <path d="M4 13v4a2 2 0 0 0 2 2h1v-6H4Z" />
        <path d="M20 13v4a2 2 0 0 1-2 2h-1v-6h3Z" />
      </svg>
    )
  }

  if (name === 'whatsapp') {
    return (
      <svg {...props}>
        <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.4-4.7A8.5 8.5 0 1 1 20.5 11.6Z" />
        <path d="M8.5 8.3c.2-.5.4-.5.7-.5h.6c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.6.8c-.2.2-.2.4 0 .7.7 1.2 1.7 2.2 3 2.9.3.2.5.1.7-.1l.8-1c.2-.3.5-.3.8-.2l1.8.8c.3.1.4.3.4.5 0 .3-.2 1.5-.8 2.1-.6.6-1.5.9-2.4.7-1-.2-2.3-.7-3.8-2-1.2-1-2.1-2.1-2.8-3.2-.7-1.2-1.2-2.5-.9-3.4.2-.5.8-1.5 1.3-2Z" />
      </svg>
    )
  }

  if (name === 'store') {
    return (
      <svg {...props}>
        <path d="M4 10h16" />
        <path d="M5 10v10h14V10" />
        <path d="M3 10 5 4h14l2 6" />
        <path d="M9 20v-6h6v6" />
      </svg>
    )
  }

  if (name === 'logout') {
    return (
      <svg {...props}>
        <path d="M10 5H5v14h5" />
        <path d="M14 8l4 4-4 4" />
        <path d="M18 12H9" />
      </svg>
    )
  }

  if (name === 'refresh') {
    return (
      <svg {...props}>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M6.1 8A7 7 0 0 1 18 6l2 6" />
        <path d="M17.9 16A7 7 0 0 1 6 18l-2-6" />
      </svg>
    )
  }

  if (name === 'home') {
    return (
      <svg {...props}>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v10h13V10" />
        <path d="M9.5 20v-6h5v6" />
      </svg>
    )
  }

  if (name === 'globe') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21" />
        <path d="M12 3C9.5 5.6 8.2 8.6 8.2 12S9.5 18.4 12 21" />
      </svg>
    )
  }

  return (
    <svg {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

function normalizeDigitalStatus(
  status: string,
): DigitalOrderStatus {
  if (
    status === 'payment_partial' ||
    status === 'payment_confirmed' ||
    status === 'processing' ||
    status === 'fulfillment_sent' ||
    status === 'disputed' ||
    status === 'completed' ||
    status === 'cancelled' ||
    status === 'refunded'
  ) {
    return status
  }

  return 'payment_review'
}

function ProfilePage() {
  const navigate =
    useNavigate()

  const {
    language,
    formatCurrencyText,
  } =
    useLanguage()

  const isArabic =
    language === 'ar'

  const [
    user,
    setUser,
  ] =
    useState<ProfileUser | null>(
      null,
    )

  const [
    orders,
    setOrders,
  ] =
    useState<DigitalOrderRow[]>(
      [],
    )

  const [
    notifications,
    setNotifications,
  ] =
    useState<CustomerNotificationRow[]>(
      [],
    )

  const [
    reviews,
    setReviews,
  ] =
    useState<DigitalOrderReviewRow[]>(
      [],
    )

  const [
    storeReviews,
    setStoreReviews,
  ] =
    useState<StoreReviewRow[]>(
      [],
    )


  const [
    loyaltySummary,
    setLoyaltySummary,
  ] =
    useState<LoyaltySummary | null>(
      null,
    )

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<ProfileSection>(
      'home',
    )

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true)

  const [
    isRefreshing,
    setIsRefreshing,
  ] =
    useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null,
    )

  const [
    reviewOrder,
    setReviewOrder,
  ] =
    useState<DigitalOrderRow | null>(
      null,
    )

  const [
    reviewRating,
    setReviewRating,
  ] =
    useState(5)

  const [
    reviewComment,
    setReviewComment,
  ] =
    useState('')

  const [
    reviewError,
    setReviewError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    isSubmittingReview,
    setIsSubmittingReview,
  ] =
    useState(false)

  const [
    storeReviewOpen,
    setStoreReviewOpen,
  ] =
    useState(false)

  const [
    storeReviewRating,
    setStoreReviewRating,
  ] =
    useState(5)

  const [
    storeReviewComment,
    setStoreReviewComment,
  ] =
    useState('')

  const [
    storeReviewError,
    setStoreReviewError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    isSubmittingStoreReview,
    setIsSubmittingStoreReview,
  ] =
    useState(false)

  const [orderSearch,setOrderSearch] = useState('')
  const [orderFilter,setOrderFilter] = useState('')
  const [password,setPassword] = useState('')
  const [passwordConfirm,setPasswordConfirm] = useState('')
  const [saving,setSaving] = useState(false)
  const [accountNotice,setAccountNotice] = useState('')
  const changePassword = async () => {
    if (saving || !user) return
    if (password.length < 12 || password !== passwordConfirm) {setAccountNotice(isArabic ? 'تحقق من تطابق كلمة المرور (12 حرفًا على الأقل).' : 'Vérifiez les mots de passe (12 caractères minimum).'); return}
    setSaving(true); setAccountNotice('')
    try {const {error} = await supabase.auth.updateUser({password}); if(error) throw error; setPassword(''); setPasswordConfirm(''); setAccountNotice(isArabic ? 'تم تغيير كلمة المرور.' : 'Mot de passe modifié.')}
    catch {setAccountNotice(isArabic ? 'تعذر التغيير. قد تحتاج إلى تسجيل الدخول مجددًا.' : 'Modification impossible. Une nouvelle connexion peut être nécessaire.')}
    finally {setSaving(false)}
  }
  const loadOrders =
    useCallback(
      async (
        userId: string,
      ) => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'digital_orders',
            )
            .select(`
              id,
              order_number,
              user_id,
              service_name,
              plan_label,
              total_amount,
              currency,
              amount_received,
              amount_remaining,
              payment_method_name,
              fulfillment_sent_at,
              customer_confirmed_at,
              payment_issue_reason,
              dispute_status,
              dispute_reason_code,
              dispute_reason,
              status,
              rejection_code,
              rejection_reason,
              rejected_at,
              created_at,
              updated_at
            `)
            .eq(
              'user_id',
              userId,
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              },
            )

        if (error) {
          console.error(
            'Unable to load customer orders:',
            error,
          )

          throw error
        }

        setOrders(
          (data ??
            []) as DigitalOrderRow[],
        )
      },
      [],
    )

  const loadNotifications =
    useCallback(
      async (
        userId: string,
      ) => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'customer_notifications',
            )
            .select(`
              id,
              user_id,
              order_id,
              order_number,
              type,
              title,
              message,
              action_url,
              is_read,
              created_at,
              read_at
            `)
            .eq(
              'user_id',
              userId,
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              },
            )
            .limit(
              60,
            )

        if (error) {
          console.error(
            'Unable to load notifications:',
            error,
          )

          throw error
        }

        setNotifications(
          (data ??
            []) as CustomerNotificationRow[],
        )
      },
      [],
    )

  const loadReviews =
    useCallback(
      async (
        userId: string,
      ) => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'digital_order_reviews',
            )
            .select(`
              id,
              order_id,
              order_number,
              user_id,
              rating,
              comment,
              created_at,
              updated_at
            `)
            .eq(
              'user_id',
              userId,
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              },
            )

        if (error) {
          console.error(
            'Unable to load reviews:',
            error,
          )

          throw error
        }

        setReviews(
          (data ??
            []) as DigitalOrderReviewRow[],
        )
      },
      [],
    )

  const loadStoreReviews =
    useCallback(
      async (
        userId: string,
      ) => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'store_reviews',
            )
            .select(`
              id,
              user_id,
              milestone,
              completed_orders_count,
              rating,
              comment,
              created_at,
              updated_at
            `)
            .eq(
              'user_id',
              userId,
            )
            .order(
              'milestone',
              {
                ascending:
                  true,
              },
            )

        if (error) {
          console.error(
            'Unable to load store reviews:',
            error,
          )

          throw error
        }

        setStoreReviews(
          (data ??
            []) as StoreReviewRow[],
        )
      },
      [],
    )

  const loadLoyaltySummary =
    useCallback(
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .rpc(
              'customer_get_loyalty_summary',
            )

        if (error) {
          console.error(
            'Unable to load loyalty summary:',
            error,
          )

          throw error
        }

        const row =
          Array.isArray(
            data,
          )
            ? data[0]
            : data

        if (
          !row ||
          typeof row !==
            'object'
        ) {
          setLoyaltySummary({
            points_balance: 0,
            usable_points: 0,
            usable_value_mru: 0,
            progress_points: 0,
            points_to_next_reward: 100,
            lifetime_earned_points: 0,
          })

          return
        }

        const value =
          row as Record<
            string,
            unknown
          >

        const toNumber =
          (
            input: unknown,
            fallback = 0,
          ) => {
            const parsed =
              Number(
                input,
              )

            return Number.isFinite(
              parsed,
            )
              ? parsed
              : fallback
          }

        setLoyaltySummary({
          points_balance:
            Math.max(
              0,
              Math.floor(
                toNumber(
                  value.points_balance,
                ),
              ),
            ),

          usable_points:
            Math.max(
              0,
              Math.floor(
                toNumber(
                  value.usable_points,
                ),
              ),
            ),

          usable_value_mru:
            Math.max(
              0,
              toNumber(
                value.usable_value_mru,
              ),
            ),

          progress_points:
            Math.min(
              99,
              Math.max(
                0,
                Math.floor(
                  toNumber(
                    value.progress_points,
                  ),
                ),
              ),
            ),

          points_to_next_reward:
            Math.min(
              100,
              Math.max(
                1,
                Math.floor(
                  toNumber(
                    value.points_to_next_reward,
                    100,
                  ),
                ),
              ),
            ),

          lifetime_earned_points:
            Math.max(
              0,
              Math.floor(
                toNumber(
                  value.lifetime_earned_points,
                ),
              ),
            ),
        })
      },
      [],
    )

  const loadAllCustomerData =
    useCallback(
      async (
        userId: string,
        showRefresh = false,
      ) => {
        if (
          showRefresh
        ) {
          setIsRefreshing(
            true,
          )
        }

        try {
          await Promise.all([
            loadOrders(
              userId,
            ),

            loadNotifications(
              userId,
            ),

            loadReviews(
              userId,
            ),

            loadStoreReviews(
              userId,
            ),

            loadLoyaltySummary(),


          ])

          setErrorMessage(
            null,
          )
        } catch {
          setErrorMessage(
            isArabic
              ? 'تعذر تحديث بعض بيانات حسابك.'
              : 'Impossible de mettre à jour certaines données de votre compte.',
          )
        } finally {
          if (
            showRefresh
          ) {
            setIsRefreshing(
              false,
            )
          }
        }
      },
      [
        isArabic,
        loadNotifications,
        loadLoyaltySummary,
        loadOrders,
        loadReviews,
        loadStoreReviews,

      ],
    )

  useEffect(
    () => {
      let mounted =
        true

      let currentUserId:
        string | null =
        null

      const loadProfile =
        async () => {
          setIsLoading(
            true,
          )

          setErrorMessage(
            null,
          )

          const {
            data:
              userData,
            error:
              userError,
          } =
            await supabase.auth
              .getUser()

          if (
            !mounted
          ) {
            return
          }

          if (
            userError ||
            !userData.user
          ) {
            navigate(
              '/connexion?redirect=%2Fprofil',
              {
                replace:
                  true,
              },
            )

            return
          }

          const authUser =
            userData.user

          currentUserId =
            authUser.id

          const metadataName =
            authUser.user_metadata
              ?.full_name

          const metadataPhone =
            authUser.user_metadata
              ?.phone

          setUser({
            id:
              authUser.id,

            email:
              authUser.email ??
              '',

            phone:
              typeof authUser.phone ===
                'string' &&
              authUser.phone.trim()
                ? authUser.phone.trim()
                : typeof metadataPhone ===
                    'string'
                  ? metadataPhone.trim()
                  : '',

            fullName:
              typeof metadataName ===
                'string' &&
              metadataName.trim()
                ? metadataName.trim()
                : authUser.email
                    ?.split(
                      '@',
                    )[0] ??
                  (
                    isArabic
                      ? 'حسابي'
                      : 'Mon compte'
                  ),
          })

          await loadAllCustomerData(
            authUser.id,
          )

          if (
            mounted
          ) {
            setIsLoading(
              false,
            )
          }
        }

      void loadProfile()

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
              if (
                !mounted
              ) {
                return
              }

              if (
                !session?.user
              ) {
                navigate(
                  '/connexion?redirect=%2Fprofil',
                  {
                    replace:
                      true,
                  },
                )
              }
            },
          )

      const ordersChannel =
        supabase
          .channel(
            `customer-profile-orders-${Date.now()}`,
          )
          .on(
            'postgres_changes',
            {
              event:
                '*',

              schema:
                'public',

              table:
                'digital_orders',
            },
            (
              payload,
            ) => {
              if (
                !mounted ||
                !currentUserId
              ) {
                return
              }

              const newRow =
                payload.new as
                  | Partial<DigitalOrderRow>
                  | undefined

              const oldRow =
                payload.old as
                  | Partial<DigitalOrderRow>
                  | undefined

              const affectedUserId =
                newRow?.user_id ??
                oldRow?.user_id

              if (
                affectedUserId ===
                currentUserId
              ) {
                void Promise.all([
                  loadOrders(
                    currentUserId,
                  ),

                  loadLoyaltySummary(),
                ])
              }
            },
          )
          .subscribe()

      const notificationsChannel =
        supabase
          .channel(
            `customer-profile-notifications-${Date.now()}`,
          )
          .on(
            'postgres_changes',
            {
              event:
                '*',

              schema:
                'public',

              table:
                'customer_notifications',
            },
            (
              payload,
            ) => {
              if (
                !mounted ||
                !currentUserId
              ) {
                return
              }

              const newRow =
                payload.new as
                  | Partial<CustomerNotificationRow>
                  | undefined

              const oldRow =
                payload.old as
                  | Partial<CustomerNotificationRow>
                  | undefined

              const affectedUserId =
                newRow?.user_id ??
                oldRow?.user_id

              if (
                affectedUserId ===
                currentUserId
              ) {
                void loadNotifications(
                  currentUserId,
                )
              }
            },
          )
          .subscribe()

      const reviewsChannel =
        supabase
          .channel(
            `customer-profile-reviews-${Date.now()}`,
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
            (
              payload,
            ) => {
              if (
                !mounted ||
                !currentUserId
              ) {
                return
              }

              const newRow =
                payload.new as
                  | Partial<DigitalOrderReviewRow>
                  | undefined

              const oldRow =
                payload.old as
                  | Partial<DigitalOrderReviewRow>
                  | undefined

              const affectedUserId =
                newRow?.user_id ??
                oldRow?.user_id

              if (
                affectedUserId ===
                currentUserId
              ) {
                void loadReviews(
                  currentUserId,
                )
              }
            },
          )
          .subscribe()

      const storeReviewsChannel =
        supabase
          .channel(
            `customer-profile-store-reviews-${Date.now()}`,
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
            (
              payload,
            ) => {
              if (
                !mounted ||
                !currentUserId
              ) {
                return
              }

              const newRow =
                payload.new as
                  | Partial<StoreReviewRow>
                  | undefined

              const oldRow =
                payload.old as
                  | Partial<StoreReviewRow>
                  | undefined

              const affectedUserId =
                newRow?.user_id ??
                oldRow?.user_id

              if (
                affectedUserId ===
                currentUserId
              ) {
                void loadStoreReviews(
                  currentUserId,
                )
              }
            },
          )
          .subscribe()

      const handleWindowFocus =
        () => {
          if (
            currentUserId
          ) {
            void loadAllCustomerData(
              currentUserId,
            )
          }
        }

      const handleVisibilityChange =
        () => {
          if (
            document.visibilityState ===
              'visible' &&
            currentUserId
          ) {
            void loadAllCustomerData(
              currentUserId,
            )
          }
        }

      window.addEventListener(
        'focus',
        handleWindowFocus,
      )

      document.addEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )

      return () => {
        mounted =
          false

        authListener
          .subscription
          .unsubscribe()

        void supabase
          .removeChannel(
            ordersChannel,
          )

        void supabase
          .removeChannel(
            notificationsChannel,
          )

        void supabase
          .removeChannel(
            reviewsChannel,
          )

        void supabase
          .removeChannel(
            storeReviewsChannel,
          )

        window.removeEventListener(
          'focus',
          handleWindowFocus,
        )

        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        )
      }
    },
    [
      isArabic,
      loadAllCustomerData,
      loadLoyaltySummary,
      loadNotifications,
      loadOrders,
      loadReviews,
      loadStoreReviews,
      navigate,
    ],
  )

  useEffect(
    () => {
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

          if (
            !isSubmittingReview
          ) {
            setReviewOrder(
              null,
            )

            setReviewError(
              null,
            )
          }

          if (
            !isSubmittingStoreReview
          ) {
            setStoreReviewOpen(
              false,
            )

            setStoreReviewError(
              null,
            )
          }
        }

      document.addEventListener(
        'keydown',
        handleEscape,
      )

      return () =>
        document.removeEventListener(
          'keydown',
          handleEscape,
        )
    },
    [
      isSubmittingReview,
      isSubmittingStoreReview,
    ],
  )

  const unreadNotifications =
    useMemo(
      () =>
        notifications.filter(
          (
            notification,
          ) =>
            !notification.is_read,
        ),
      [
        notifications,
      ],
    )

  const reviewOrderIds =
    useMemo(
      () =>
        new Set(
          reviews.map(
            (
              review,
            ) =>
              review.order_id,
          ),
        ),
      [
        reviews,
      ],
    )

  const pendingReviewOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order,
          ) =>
            normalizeDigitalStatus(
              order.status,
            ) ===
              'completed' &&
            !reviewOrderIds.has(
              order.id,
            ),
        ),
      [
        orders,
        reviewOrderIds,
      ],
    )

  const completedOrdersCount =
    useMemo(
      () =>
        orders.filter(
          (
            order,
          ) =>
            normalizeDigitalStatus(
              order.status,
            ) ===
            'completed',
        ).length,
      [
        orders,
      ],
    )

  const reviewedStoreMilestones =
    useMemo(
      () =>
        new Set(
          storeReviews.map(
            (
              review,
            ) =>
              review.milestone,
          ),
        ),
      [
        storeReviews,
      ],
    )

  const pendingStoreReviewMilestone =
    useMemo(
      () => {
        if (
          completedOrdersCount <
          5
        ) {
          return null
        }

        const maxMilestone =
          Math.floor(
            completedOrdersCount /
              5,
          ) * 5

        for (
          let milestone =
            5;
          milestone <=
          maxMilestone;
          milestone +=
            5
        ) {
          if (
            !reviewedStoreMilestones.has(
              milestone,
            )
          ) {
            return milestone
          }
        }

        return null
      },
      [
        completedOrdersCount,
        reviewedStoreMilestones,
      ],
    )

  const nextStoreReviewMilestone =
    useMemo(
      () => {
        const base =
          Math.floor(
            completedOrdersCount /
              5,
          ) * 5

        return Math.max(
          5,
          base + 5,
        )
      },
      [
        completedOrdersCount,
      ],
    )

  const ordersUntilNextStoreReview =
    Math.max(
      0,
      nextStoreReviewMilestone -
        completedOrdersCount,
    )

  const markNotificationRead =
    async (
      notification:
        CustomerNotificationRow,
    ) => {
      if (
        notification.is_read
      ) {
        return
      }

      const now =
        new Date()
          .toISOString()

      const {
        error,
      } =
        await supabase
          .from(
            'customer_notifications',
          )
          .update({
            is_read:
              true,

            read_at:
              now,
          })
          .eq(
            'id',
            notification.id,
          )
          .eq(
            'user_id',
            notification.user_id,
          )

      if (error) {
        console.error(
          'Unable to mark notification as read:',
          error,
        )

        return
      }

      setNotifications(
        (
          current,
        ) =>
          current.map(
            (
              item,
            ) =>
              item.id ===
              notification.id
                ? {
                    ...item,

                    is_read:
                      true,

                    read_at:
                      now,
                  }
                : item,
          ),
      )
    }

  const markAllNotificationsRead =
    async () => {
      if (
        !user ||
        unreadNotifications.length ===
          0
      ) {
        return
      }

      const now =
        new Date()
          .toISOString()

      const {
        error,
      } =
        await supabase
          .from(
            'customer_notifications',
          )
          .update({
            is_read:
              true,

            read_at:
              now,
          })
          .eq(
            'user_id',
            user.id,
          )
          .eq(
            'is_read',
            false,
          )

      if (error) {
        console.error(
          'Unable to mark notifications as read:',
          error,
        )

        return
      }

      setNotifications(
        (
          current,
        ) =>
          current.map(
            (
              item,
            ) => ({
              ...item,

              is_read:
                true,

              read_at:
                item.read_at ??
                now,
            }),
          ),
      )
    }

  const handleNotificationClick =
    async (
      notification:
        CustomerNotificationRow,
    ) => {
      await markNotificationRead(
        notification,
      )

      if (
        notification.order_number
      ) {
        navigate(
          `/commande/${notification.order_number}`,
        )

        return
      }

      if (
        notification.action_url
      ) {
        navigate(
          notification.action_url,
        )
      }
    }

  const openReviewModal =
    (
      order:
        DigitalOrderRow,
    ) => {
      setReviewOrder(
        order,
      )

      setReviewRating(
        5,
      )

      setReviewComment(
        '',
      )

      setReviewError(
        null,
      )
    }

  const closeReviewModal =
    () => {
      if (
        isSubmittingReview
      ) {
        return
      }

      setReviewOrder(
        null,
      )

      setReviewRating(
        5,
      )

      setReviewComment(
        '',
      )

      setReviewError(
        null,
      )
    }

  const handleSubmitReview =
    async () => {
      if (
        !user ||
        !reviewOrder ||
        isSubmittingReview
      ) {
        return
      }

      setIsSubmittingReview(
        true,
      )

      setReviewError(
        null,
      )

      const now =
        new Date()
          .toISOString()

      const {
        error,
      } =
        await supabase
          .from(
            'digital_order_reviews',
          )
          .insert({
            order_id:
              reviewOrder.id,

            order_number:
              reviewOrder.order_number,

            user_id:
              user.id,

            rating:
              reviewRating,

            comment:
              reviewComment
                .trim() ||
              null,

            created_at:
              now,

            updated_at:
              now,
          })

      if (error) {
        console.error(
          'Unable to submit review:',
          error,
        )

        setReviewError(
          isArabic
            ? 'تعذر إرسال تقييمك. حاول مرة أخرى.'
            : "Impossible d'envoyer votre avis. Veuillez réessayer.",
        )

        setIsSubmittingReview(
          false,
        )

        return
      }

      const relatedNotifications =
        notifications.filter(
          (
            notification,
          ) =>
            notification.order_id ===
              reviewOrder.id &&
            notification.type ===
              'review_request' &&
            !notification.is_read,
        )

      if (
        relatedNotifications.length >
        0
      ) {
        await supabase
          .from(
            'customer_notifications',
          )
          .update({
            is_read:
              true,

            read_at:
              now,
          })
          .in(
            'id',
            relatedNotifications.map(
              (
                notification,
              ) =>
                notification.id,
            ),
          )
      }

      await Promise.all([
        loadReviews(
          user.id,
        ),

        loadNotifications(
          user.id,
        ),
      ])

      setIsSubmittingReview(
        false,
      )

      setReviewOrder(
        null,
      )

      setReviewRating(
        5,
      )

      setReviewComment(
        '',
      )

      setReviewError(
        null,
      )
    }

  const openStoreReviewModal =
    () => {
      if (
        pendingStoreReviewMilestone ===
        null
      ) {
        return
      }

      setStoreReviewRating(
        5,
      )

      setStoreReviewComment(
        '',
      )

      setStoreReviewError(
        null,
      )

      setStoreReviewOpen(
        true,
      )
    }

  const closeStoreReviewModal =
    () => {
      if (
        isSubmittingStoreReview
      ) {
        return
      }

      setStoreReviewOpen(
        false,
      )

      setStoreReviewRating(
        5,
      )

      setStoreReviewComment(
        '',
      )

      setStoreReviewError(
        null,
      )
    }

  const handleSubmitStoreReview =
    async () => {
      if (
        !user ||
        pendingStoreReviewMilestone ===
          null ||
        storeReviewRating <
          1 ||
        storeReviewRating >
          5 ||
        isSubmittingStoreReview
      ) {
        return
      }

      setIsSubmittingStoreReview(
        true,
      )

      setStoreReviewError(
        null,
      )

      const now =
        new Date()
          .toISOString()

      const {
        error,
      } =
        await supabase
          .from(
            'store_reviews',
          )
          .insert({
            user_id:
              user.id,

            milestone:
              pendingStoreReviewMilestone,

            completed_orders_count:
              completedOrdersCount,

            rating:
              storeReviewRating,

            comment:
              storeReviewComment
                .trim() ||
              null,

            created_at:
              now,

            updated_at:
              now,
          })

      if (error) {
        if (
          error.code ===
          '23505'
        ) {
          await loadStoreReviews(
            user.id,
          )

          setStoreReviewOpen(
            false,
          )

          setIsSubmittingStoreReview(
            false,
          )

          return
        }

        console.error(
          'Unable to submit store review:',
          error,
        )

        setStoreReviewError(
          isArabic
            ? 'تعذر إرسال تقييم المتجر. حاول مرة أخرى.'
            : "Impossible d'envoyer votre avis sur TEO STORE.",
        )

        setIsSubmittingStoreReview(
          false,
        )

        return
      }

      await loadStoreReviews(
        user.id,
      )

      setStoreReviewOpen(
        false,
      )

      setStoreReviewRating(
        5,
      )

      setStoreReviewComment(
        '',
      )

      setStoreReviewError(
        null,
      )

      setIsSubmittingStoreReview(
        false,
      )
    }

  const getStatusLabel =
    (
      value:
        string,
    ) => {
      const status =
        normalizeDigitalStatus(
          value,
        )

      const ar:
        Record<
          DigitalOrderStatus,
          string
        > = {
          payment_review:
            'جارٍ التحقق من الدفع',

          payment_partial:
            'مطلوب إكمال الدفع',

          payment_confirmed:
            'تم تأكيد الدفع',

          processing:
            'قيد التجهيز',

          fulfillment_sent:
            'تم إرسال الخدمة',

          disputed:
            'نزاع مفتوح',

          completed:
            'تم تأكيد الاستلام',

          cancelled:
            'تم إلغاء الطلب',

          refunded:
            'تم الاسترجاع',
        }

      const fr:
        Record<
          DigitalOrderStatus,
          string
        > = {
          payment_review:
            'Vérification du paiement',

          payment_partial:
            'Complément requis',

          payment_confirmed:
            'Paiement confirmé',

          processing:
            'En traitement',

          fulfillment_sent:
            'Service envoyé',

          disputed:
            'Litige ouvert',

          completed:
            'Commande terminée',

          cancelled:
            'Commande annulée',

          refunded:
            'Remboursée',
        }

      return isArabic
        ? ar[
            status
          ]
        : fr[
            status
          ]
    }

  const getStatusClasses =
    (
      value:
        string,
    ) => {
      const status =
        normalizeDigitalStatus(
          value,
        )

      if (
        status ===
        'payment_review'
      ) {
        return 'border-amber-100 bg-amber-50 text-amber-700'
      }

      if (
        status ===
        'payment_partial'
      ) {
        return 'border-orange-100 bg-orange-50 text-orange-700'
      }

      if (
        status ===
        'payment_confirmed'
      ) {
        return 'border-blue-100 bg-blue-50 text-blue-700'
      }

      if (
        status ===
        'processing'
      ) {
        return 'border-indigo-100 bg-indigo-50 text-indigo-700'
      }

      if (
        status ===
        'fulfillment_sent'
      ) {
        return 'border-violet-100 bg-violet-50 text-violet-700'
      }

      if (
        status ===
        'disputed'
      ) {
        return 'border-rose-200 bg-rose-50 text-rose-700'
      }

      if (
        status ===
        'completed'
      ) {
        return 'border-emerald-100 bg-emerald-50 text-emerald-700'
      }

      if (
        status ===
        'cancelled'
      ) {
        return 'border-rose-100 bg-rose-50 text-rose-700'
      }

      return 'border-slate-200 bg-slate-100 text-slate-600'
    }

  const getNotificationTitle =
    (
      notification:
        CustomerNotificationRow,
    ) => {
      if (
        !isArabic
      ) {
        return notification.title
      }

      const translations:
        Record<
          string,
          string
        > = {
          payment_partial:
            'مطلوب إكمال الدفع',

          payment_confirmed:
            'تم تأكيد الدفع',

          processing:
            'طلبك قيد التجهيز',

          fulfillment_sent:
            'خدمتك جاهزة',

          dispute_open:
            'تم فتح النزاع',

          refunded:
            'تم استرجاع الطلب',

          review_request:
            'قيّم خدمتك',

          cancelled:
            'تم إلغاء الطلب',
        }

      return (
        translations[
          notification.type
        ] ??
        notification.title
      )
    }

  const getNotificationMessage =
    (
      notification:
        CustomerNotificationRow,
    ) => {
      if (
        !isArabic
      ) {
        return notification.message
      }

      const translations:
        Record<
          string,
          string
        > = {
          payment_partial:
            'يحتاج طلبك إلى إكمال المبلغ المتبقي.',

          payment_confirmed:
            'تم التحقق من دفعتك بنجاح.',

          processing:
            'TEO STORE يقوم الآن بتجهيز خدمتك.',

          fulfillment_sent:
            'تم إرسال خدمتك. افتح الطلب لمراجعتها وتأكيد الاستلام.',

          dispute_open:
            'تم تسجيل النزاع وسيقوم TEO STORE بمراجعة المشكلة.',

          refunded:
            'تم تسجيل استرجاع طلبك.',

          review_request:
            'اكتمل طلبك. شاركنا تقييمك للخدمة.',

          cancelled:
            'تم إلغاء طلبك.',
        }

      return (
        translations[
          notification.type
        ] ??
        notification.message
      )
    }

  const formatDate =
    (
      value:
        string,
    ) => {
      try {
        return new Intl.DateTimeFormat(
          isArabic
            ? 'ar-MR-u-nu-latn'
            : 'fr-FR-u-nu-latn',
          {
            dateStyle:
              'medium',

            timeStyle:
              'short',

            numberingSystem:
              'latn',
          },
        ).format(
          new Date(
            value,
          ),
        )
      } catch {
        return value
      }
    }

  const formatAmount =
    (
      amount:
        number,

      currency:
        string,
    ) => {
      const normalized =
        new Intl.NumberFormat(
          'fr-FR-u-nu-latn',
          {
            numberingSystem:
              'latn',

            maximumFractionDigits:
              2,
          },
        ).format(
          Number(
            amount,
          ),
        )

      return formatCurrencyText(
        `${normalized} ${currency}`,
      )
    }

  const openSection =
    (
      section:
        ProfileSection,
    ) => {
      setActiveSection(section)
      setPassword('')
      setPasswordConfirm('')
      setAccountNotice('')

      window.scrollTo({
        top:
          0,

        left:
          0,

        behavior:
          'smooth',
      })
    }

  const handleSignOut =
    async () => {
      const {
        error,
      } =
        await supabase.auth
          .signOut()

      if (error) {
        console.error(
          'Unable to sign out:',
          error,
        )

        return
      }

      navigate(
        '/connexion',
        {
          replace:
            true,
        },
      )
    }

  const handleRefresh =
    () => {
      if (
        !user ||
        isRefreshing
      ) {
        return
      }

      void loadAllCustomerData(
        user.id,
        true,
      )
    }

  if (
    isLoading
  ) {
    return (
      <main className="min-h-[60vh] bg-[#f6f7fb]">
        <Container>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-bold text-slate-500">
                {isArabic
                  ? 'جارٍ تحميل حسابك...'
                  : 'Chargement de votre compte...'}
              </p>
            </div>
          </div>
        </Container>
      </main>
    )
  }

  if (
    !user
  ) {
    return null
  }

  const firstLetter =
    user.fullName
      .trim()
      .charAt(
        0,
      )
      .toUpperCase() ||
    'T'

  const latestOrder =
    orders[
      0
    ] ??
    null

  const loyaltyPoints =
    loyaltySummary
      ?.points_balance ??
    0

  const loyaltyUsablePoints =
    loyaltySummary
      ?.usable_points ??
    0

  const loyaltyUsableValue =
    loyaltySummary
      ?.usable_value_mru ??
    0

  const loyaltyProgressPoints =
    loyaltySummary
      ?.progress_points ??
    0

  const loyaltyPointsToNextReward =
    loyaltySummary
      ?.points_to_next_reward ??
    100

  const loyaltyProgressPercent =
    Math.min(
      100,
      Math.max(
        0,
        loyaltyProgressPoints,
      ),
    )

  const loyaltyUnlocked =
    loyaltyUsablePoints >=
    100

  const formatLoyaltyValue =
    (
      amount:
        number,
    ) => {
      if (
        isArabic
      ) {
        const normalized =
          new Intl.NumberFormat(
            'ar-MR-u-nu-latn',
            {
              numberingSystem:
                'latn',

              maximumFractionDigits:
                2,
            },
          ).format(
            Number(
              amount,
            ),
          )

        return `${normalized} أوقية جديدة`
      }

      return formatAmount(
        amount,
        'MRU',
      )
    }

  const menu: {id: ProfileSection; icon: IconName; ar: string; fr: string}[] = [
    {id:'home',icon:'home',ar:'لوحة الحساب',fr:'Tableau de bord'},
    {id:'orders',icon:'orders',ar:'طلباتي',fr:'Mes commandes'},
    {id:'services',icon:'store',ar:'خدماتي الرقمية',fr:'Mes services'},
    {id:'loyalty',icon:'star',ar:'برنامج الولاء',fr:'Fidélité'},
    {id:'notifications',icon:'bell',ar:'الإشعارات',fr:'Notifications'},
    {id:'reviews',icon:'star',ar:'تقييماتي',fr:'Mes avis'},
    {id:'support',icon:'support',ar:'مركز الدعم',fr:'Assistance'},
    {id:'account',icon:'user',ar:'معلوماتي الشخصية',fr:'Mon profil'},
    {id:'security',icon:'user',ar:'أمان الحساب',fr:'Sécurité'},
  ]
  const sectionTitle = menu.find(item => item.id === activeSection)?.[isArabic ? 'ar' : 'fr']
  const delivered = orders.filter(order => ['fulfillment_sent','completed'].includes(order.status))
  const visibleOrders = orders.filter(order => (!orderFilter || order.status === orderFilter) && `${order.order_number} ${order.service_name} ${order.plan_label}`.toLowerCase().includes(orderSearch.trim().toLowerCase()))
  const loyaltyCard = loyaltySummary ? (<section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 text-white sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white/15">
                          <Icon
                            name="star"
                            className="h-5 w-5"
                          />
                        </span>

                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-100">
                            {isArabic
                              ? 'برنامج الولاء'
                              : 'Programme fidélité'}
                          </p>

                          <h2 className="mt-0.5 text-lg font-black sm:text-xl">
                            {isArabic
                              ? 'نقاطي'
                              : 'Mes points'}
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div
                      dir="ltr"
                      className="shrink-0 text-right"
                    >
                      <p className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                        {
                          loyaltyPoints
                        }
                      </p>

                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-blue-100">
                        points
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[18px] bg-white/10 p-4 ring-1 ring-white/10">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-100">
                          {isArabic
                            ? 'القيمة المتاحة'
                            : 'Valeur disponible'}
                        </p>

                        <p
                          dir={
                            isArabic
                              ? 'rtl'
                              : 'ltr'
                          }
                          className={
                            isArabic
                              ? 'mt-1 text-right text-2xl font-black text-white'
                              : 'mt-1 text-left text-2xl font-black text-white'
                          }
                        >
                          {formatLoyaltyValue(
                            loyaltyUsableValue,
                          )}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-black ${
                          loyaltyUnlocked
                            ? 'bg-emerald-400 text-emerald-950'
                            : 'bg-white/15 text-white'
                        }`}
                      >
                        {loyaltyUnlocked
                          ? isArabic
                            ? 'متاحة للاستعمال'
                            : 'Utilisable'
                          : isArabic
                            ? 'تحتاج 100 نقطة'
                            : '100 points requis'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3 text-xs font-black">
                    <span className="text-slate-700">
                      {isArabic
                        ? 'نحو المكافأة التالية'
                        : 'Vers la prochaine récompense'}
                    </span>

                    <span
                      dir="ltr"
                      className="text-blue-600"
                    >
                      {
                        loyaltyProgressPoints
                      }
                      /100
                    </span>
                  </div>

                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
                      style={{
                        width:
                          `${loyaltyProgressPercent}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    {isArabic
                      ? `باقي ${loyaltyPointsToNextReward} نقطة لفتح 500 أوقية جديدة إضافية.`
                      : `Encore ${loyaltyPointsToNextReward} points pour débloquer 500 MRU supplémentaires.`}
                  </p>

                  <div className="mt-4 grid gap-2 rounded-[16px] border border-slate-100 bg-slate-50 p-3 text-[11px] font-bold leading-5 text-slate-500 sm:grid-cols-2">
                    <p>
                      {isArabic
                        ? 'كل 100 أوقية جديدة من الطلبات المكتملة = نقطة واحدة.'
                        : 'Chaque 100 MRU de commandes terminées = 1 point.'}
                    </p>

                    <p>
                      {isArabic
                        ? 'كل 100 نقطة = 500 أوقية جديدة قابلة للاستعمال.'
                        : 'Chaque 100 points = 500 MRU utilisables.'}
                    </p>
                  </div>
                </div>
              </section>) : <p>{isArabic ? "تعذر تحميل نقاط الولاء" : "Points de fidélité indisponibles"}</p>
  return (
    <main
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
      className="teo-profile min-h-screen bg-[#f6f7fb] pb-28"
    >
      <style>{`html[data-teo-theme="dark"] .teo-profile {background:#0b1220;color:#e2e8f0} html[data-teo-theme="dark"] .teo-profile .bg-white {background:#111c2e} html[data-teo-theme="dark"] .teo-profile .bg-slate-50,html[data-teo-theme="dark"] .teo-profile .bg-slate-100 {background:#1e293b} html[data-teo-theme="dark"] .teo-profile :is(.text-slate-950,.text-slate-900,.text-slate-800,.text-slate-700,.text-slate-600){color:#e2e8f0} html[data-teo-theme="dark"] .teo-profile :is(.text-slate-500,.text-slate-500){color:#aab8ca} html[data-teo-theme="dark"] .teo-profile :is(.border-slate-100,.border-slate-200,.border-slate-300){border-color:#334155} html[data-teo-theme="dark"] .teo-profile :is(.bg-blue-50,.bg-amber-50,.bg-rose-50,.bg-orange-50,.bg-emerald-50,.bg-violet-50,.bg-indigo-50,.bg-cyan-50,.bg-sky-50){background:#243247} html[data-teo-theme="dark"] .teo-profile :is(.text-blue-950,.text-blue-900,.text-blue-700,.text-amber-950,.text-amber-900,.text-amber-700,.text-rose-700,.text-orange-700,.text-emerald-700,.text-indigo-700,.text-violet-700){color:#dbeafe}`}</style>
      <div className="border-b border-slate-200 bg-white">
        <Container>
          <div className="mx-auto flex min-h-[72px] max-w-5xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                TEO STORE
              </p>

              <h1 className="mt-1 truncate text-xl font-black tracking-[-0.03em] text-slate-950 sm:text-2xl">
                {
                  sectionTitle
                }
              </h1>
            </div>

            <div className="flex shrink-0 gap-2">
              {activeSection !==
                'home' && (
                <button
                  type="button"
                  onClick={() =>
                    openSection(
                      'home',
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
                  aria-label={
                    isArabic
                      ? 'العودة إلى الحساب'
                      : 'Retour au compte'
                  }
                >
                  <Icon
                    name="home"
                    className="h-4 w-4"
                  />
                </button>
              )}

              <button
                type="button"
                onClick={
                  handleRefresh
                }
                disabled={
                  isRefreshing
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
                aria-label={
                  isArabic
                    ? 'تحديث'
                    : 'Actualiser'
                }
              >
                <Icon
                  name="refresh"
                  className={
                    isRefreshing
                      ? 'h-4 w-4 animate-spin'
                      : 'h-4 w-4'
                  }
                />
              </button>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-4 sm:py-6">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label={isArabic ? 'أقسام الحساب' : 'Navigation du compte'} className={`${activeSection === 'home' ? 'hidden lg:flex' : 'grid grid-cols-3 sm:grid-cols-5 lg:flex'} gap-1 rounded-2xl border border-slate-200 bg-white p-2 lg:flex-col lg:self-start`}>
            {menu.map(item => <button key={item.id} type="button" aria-current={activeSection === item.id ? 'page' : undefined} onClick={() => openSection(item.id)} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-[11px] font-bold lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-3 lg:text-start lg:text-sm ${activeSection === item.id ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}><Icon name={item.icon}/><span>{isArabic ? item.ar : item.fr}</span>{item.id === 'notifications' && unreadNotifications.length > 0 && <span className="rounded-full bg-rose-500 px-2 text-white">{unreadNotifications.length}</span>}</button>)}
            <button type="button" onClick={() => void handleSignOut()} className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold text-rose-600 lg:flex-row lg:gap-3 lg:px-3 lg:py-3 lg:text-sm"><Icon name="logout"/>{isArabic ? 'تسجيل الخروج' : 'Déconnexion'}</button>
          </nav><div className="min-w-0">
          {errorMessage && (
            <div className="mb-4 rounded-[18px] border border-rose-100 bg-rose-50 p-4">
              <p className="text-sm font-bold text-rose-700">
                {
                  errorMessage
                }
              </p>
            </div>
          )}

          {activeSection ===
            'home' && (
            <div className="grid gap-4 xl:grid-cols-2 [&>*:nth-child(n+3)]:xl:col-span-2">
              <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xl font-black uppercase text-white">
                    {
                      firstLetter
                    }
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-black text-slate-950 sm:text-xl">
                      {
                        user.fullName
                      }
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 truncate text-left text-xs font-semibold text-slate-500 sm:text-sm"
                    >
                      {
                        user.email
                      }
                    </p>

                    {user.phone && (
                      <p
                        dir="ltr"
                        className="mt-1 truncate text-left text-xs font-semibold text-slate-500"
                      >
                        {
                          user.phone
                        }
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 overflow-hidden rounded-[18px] border border-slate-100 bg-slate-50">
                  <button
                    type="button"
                    onClick={() =>
                      openSection(
                        'orders',
                      )
                    }
                    className="px-2 py-2 text-center"
                  >
                    <p
                      dir="ltr"
                      className="text-xl font-black text-slate-950"
                    >
                      {
                        orders.length
                      }
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-slate-500 sm:text-xs">
                      {isArabic
                        ? 'الطلبات'
                        : 'Commandes'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openSection(
                        'notifications',
                      )
                    }
                    className="px-2 py-2 text-center"
                  >
                    <p
                      dir="ltr"
                      className="text-xl font-black text-slate-950"
                    >
                      {
                        unreadNotifications.length
                      }
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-slate-500 sm:text-xs">
                      {isArabic
                        ? 'جديدة'
                        : 'Nouvelles'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openSection(
                        'orders',
                      )
                    }
                    className="px-2 py-2 text-center"
                  >
                    <p
                      dir="ltr"
                      className="text-xl font-black text-slate-950"
                    >
                      {
                        completedOrdersCount
                      }
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-slate-500 sm:text-xs">
                      {isArabic
                        ? 'مكتملة'
                        : 'Terminées'}
                    </p>
                  </button>
                </div>
              </section>

              {loyaltySummary && <section className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white">
                <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-bold"><Icon name="star"/>{isArabic ? 'نقاط الولاء' : 'Mes points fidélité'}</span><span className="text-2xl font-black" dir="ltr">{loyaltyPoints}</span></div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs"><span>{isArabic ? 'القيمة المتاحة' : 'Valeur disponible'}</span><strong>{formatLoyaltyValue(loyaltyUsableValue)}</strong></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label={isArabic ? 'تقدم الولاء' : 'Progression fidélité'} aria-valuenow={loyaltyProgressPoints} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-white" style={{width: `${loyaltyProgressPercent}%`}}/></div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs"><span>{loyaltyProgressPoints}/100</span><button type="button" onClick={() => openSection('loyalty')} className="rounded-lg bg-white/15 px-3 py-2 font-bold">{isArabic ? 'التفاصيل' : 'Voir les détails'}</button></div>
              </section>}

              {(
                pendingReviewOrders.length >
                  0 ||
                pendingStoreReviewMilestone !==
                  null
              ) && (
                <section className="rounded-[20px] border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-amber-500 text-white">
                      <Icon
                        name="star"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-amber-950">
                        {isArabic
                          ? 'لديك تقييم بانتظارك'
                          : 'Un avis vous attend'}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        {isArabic
                          ? 'بعض الطلبات المكتملة أو تجربة المتجر تحتاج إلى تقييمك.'
                          : 'Des commandes terminées ou votre expérience avec TEO STORE attendent votre avis.'}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          openSection(
                            'reviews',
                          )
                        }
                        className="mt-3 h-9 rounded-xl bg-amber-500 px-4 text-xs font-black text-white"
                      >
                        {isArabic
                          ? 'عرض التقييمات'
                          : 'Voir les avis'}
                      </button>
                    </div>
                  </div>
                </section>
              )}

              <section className="lg:hidden">
                <h2 className="mb-3 text-sm font-black text-slate-950">{isArabic ? 'أقسام حسابي' : 'Mon espace'}</h2>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {menu.filter(item => item.id !== 'home').map(item => <button key={item.id} type="button" onClick={() => openSection(item.id)} className="relative flex min-h-[84px] min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-center text-xs font-bold text-slate-700"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon name={item.icon}/></span>{isArabic ? item.ar : item.fr}{item.id === 'notifications' && unreadNotifications.length > 0 && <span className="absolute end-1 top-1 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{unreadNotifications.length}</span>}</button>)}
                  <button type="button" onClick={() => void handleSignOut()} className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-rose-600"><Icon name="logout"/>{isArabic ? 'تسجيل الخروج' : 'Déconnexion'}</button>
                </div>
              </section>
              <Link to="/services-numeriques" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-blue-600"><Icon name="store"/>{isArabic ? 'استكشاف الخدمات' : 'Explorer les services'}</Link>

              {latestOrder && (
                <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                        {isArabic
                          ? 'آخر طلب'
                          : 'Dernière commande'}
                      </p>

                      <p
                        dir="ltr"
                        className="mt-1 text-left text-sm font-black text-blue-600"
                      >
                        {
                          latestOrder.order_number
                        }
                      </p>
                    </div>

                    <span
                      className={[
                        'rounded-full border px-3 py-2 text-[10px] font-black sm:text-xs',

                        getStatusClasses(
                          latestOrder.status,
                        ),
                      ].join(
                        ' ',
                      )}
                    >
                      {getStatusLabel(
                        latestOrder.status,
                      )}
                    </span>
                  </div>

                  <p className="mt-4 font-black text-slate-950">
                    {
                      latestOrder.service_name
                    }
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {
                      latestOrder.plan_label
                    }
                  </p>

                  <Link
                    to={`/commande/${latestOrder.order_number}`}
                    className="mt-4 flex h-11 w-full items-center justify-center rounded-[13px] bg-slate-950 px-4 text-sm font-black text-white sm:w-fit"
                  >
                    {isArabic
                      ? 'متابعة الطلب'
                      : 'Suivre la commande'}
                  </Link>
                </section>
              )}
            </div>
          )}

          {activeSection ===
            'orders' && (
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {isArabic
                      ? 'جميع طلباتك'
                      : 'Toutes vos commandes'}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {isArabic
                      ? 'تابع الدفع والتجهيز والتسليم من هنا.'
                      : 'Suivez le paiement, la préparation et la livraison numérique de vos commandes.'}
                  </p>
                </div>

                <span
                  dir="ltr"
                  className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-black text-blue-700"
                >
                  {
                    orders.length
                  }
                </span>
              </div>

              <div className="mb-4 grid gap-2 sm:grid-cols-2"><input aria-label={isArabic ? 'بحث الطلبات' : 'Rechercher'} placeholder={isArabic ? 'بحث برقم الطلب أو الخدمة' : 'Rechercher une commande'} className="rounded-xl border border-slate-200 bg-white p-3 text-sm" value={orderSearch} onChange={e => setOrderSearch(e.target.value)}/><select aria-label={isArabic ? 'الحالة' : 'Statut'} className="rounded-xl border border-slate-200 bg-white p-3 text-sm" value={orderFilter} onChange={e => setOrderFilter(e.target.value)}><option value="">{isArabic ? 'كل الحالات' : 'Tous les statuts'}</option>{['payment_review','payment_partial','payment_confirmed','processing','fulfillment_sent','completed','disputed','cancelled','refunded'].map(status => <option key={status} value={status}>{getStatusLabel(status)}</option>)}</select></div>
              {visibleOrders.length > 0 ? (
                <div className="space-y-3">
                  {visibleOrders.map(
                    (
                      order,
                    ) => {
                      const status =
                        normalizeDigitalStatus(
                          order.status,
                        )

                      const needsReview =
                        status ===
                          'completed' &&
                        !reviewOrderIds.has(
                          order.id,
                        )

                      return (
                        <article
                          key={
                            order.id
                          }
                          className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"
                        >
                          <div className="p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p
                                  dir="ltr"
                                  className="text-left text-[11px] font-black text-blue-600"
                                >
                                  {
                                    order.order_number
                                  }
                                </p>

                                <h2 className="mt-2 truncate text-base font-black text-slate-950">
                                  {
                                    order.service_name
                                  }
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    order.plan_label
                                  }
                                </p>
                              </div>

                              <span
                                className={[
                                  'max-w-[48%] rounded-full border px-2.5 py-1.5 text-center text-[9px] font-black leading-4 sm:text-xs',

                                  getStatusClasses(
                                    status,
                                  ),
                                ].join(
                                  ' ',
                                )}
                              >
                                {getStatusLabel(
                                  status,
                                )}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                              <div className="rounded-[14px] bg-slate-50 p-3">
                                <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                                  {isArabic
                                    ? 'المبلغ'
                                    : 'Montant'}
                                </p>

                                <p
                                  dir="ltr"
                                  className="mt-1 text-left text-sm font-black text-slate-900"
                                >
                                  {formatAmount(
                                    order.total_amount,
                                    order.currency,
                                  )}
                                </p>
                              </div>

                              <div className="rounded-[14px] bg-slate-50 p-3">
                                <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                                  {isArabic
                                    ? 'الدفع'
                                    : 'Paiement'}
                                </p>

                                <p className="mt-1 truncate text-sm font-black text-slate-900">
                                  {order.payment_method_name ??
                                    '—'}
                                </p>
                              </div>

                              <div className="col-span-2 rounded-[14px] bg-slate-50 p-3 sm:col-span-1">
                                <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                                  {isArabic
                                    ? 'التاريخ'
                                    : 'Date'}
                                </p>

                                <p
                                  dir="ltr"
                                  className="mt-1 text-left text-xs font-bold text-slate-700"
                                >
                                  {formatDate(
                                    order.created_at,
                                  )}
                                </p>
                              </div>
                            </div>

                            {status ===
                              'payment_partial' &&
                              order.payment_issue_reason && (
                                <div className="mt-3 rounded-[14px] border border-orange-200 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-700">
                                  {
                                    order.payment_issue_reason
                                  }
                                </div>
                              )}

                            {needsReview && (
                              <button
                                type="button"
                                onClick={() =>
                                  openReviewModal(
                                    order,
                                  )
                                }
                                className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-xs font-black text-amber-700"
                              >
                                {isArabic
                                  ? 'قيّم هذه الخدمة'
                                  : 'Évaluer ce service'}
                              </button>
                            )}

                            <Link
                              to={`/commande/${order.order_number}`}
                              className="mt-3 flex h-11 w-full items-center justify-center rounded-[13px] bg-slate-950 px-4 text-sm font-black text-white"
                            >
                              {isArabic
                                ? 'فتح الطلب'
                                : 'Ouvrir la commande'}
                            </Link>
                          </div>
                        </article>
                      )
                    },
                  )}
                </div>
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-8 text-center">
                  <Icon
                    name="orders"
                    className="mx-auto h-8 w-8 text-slate-300"
                  />

                  <p className="mt-4 font-black text-slate-700">
                    {isArabic
                      ? 'لا توجد طلبات مطابقة'
                      : 'Aucune commande correspondante'}
                  </p>

                  <Link
                    to="/services-numeriques"
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-black text-white"
                  >
                    {isArabic
                      ? 'استكشاف الخدمات'
                      : 'Explorer les services'}
                  </Link>
                </div>
              )}
            </section>
          )}

          {activeSection ===
            'notifications' && (
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {isArabic
                      ? 'آخر تحديثات طلباتك'
                      : 'Dernières mises à jour'}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {isArabic
                      ? `${unreadNotifications.length} غير مقروءة`
                      : `${unreadNotifications.length} non lues`}
                  </p>
                </div>

                {unreadNotifications.length >
                  0 && (
                  <button
                    type="button"
                    onClick={() =>
                      void markAllNotificationsRead()
                    }
                    className="h-10 rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-black text-blue-700"
                  >
                    {isArabic
                      ? 'قراءة الكل'
                      : 'Tout lire'}
                  </button>
                )}
              </div>

              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
                {notifications.length >
                0 ? (
                  <div className="divide-y divide-slate-100">
                    {notifications.map(
                      (
                        notification,
                      ) => (
                        <button
                          key={
                            notification.id
                          }
                          type="button"
                          onClick={() =>
                            void handleNotificationClick(
                              notification,
                            )
                          }
                          className={[
                            'flex w-full gap-3 p-4 text-start transition hover:bg-slate-50 sm:p-5',

                            notification.is_read
                              ? 'bg-white'
                              : 'bg-blue-50/60',
                          ].join(
                            ' ',
                          )}
                        >
                          <span
                            className={[
                              'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]',

                              notification.is_read
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-blue-600 text-white',
                            ].join(
                              ' ',
                            )}
                          >
                            <Icon
                              name="bell"
                              className="h-4 w-4"
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-black text-slate-950">
                              {getNotificationTitle(
                                notification,
                              )}
                            </span>

                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                              {getNotificationMessage(
                                notification,
                              )}
                            </span>

                            <span
                              dir="ltr"
                              className="mt-2 block text-left text-[10px] text-slate-500"
                            >
                              {formatDate(
                                notification.created_at,
                              )}
                            </span>
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <Icon
                      name="bell"
                      className="mx-auto h-8 w-8 text-slate-300"
                    />

                    <p className="mt-4 font-black text-slate-600">
                      {isArabic
                        ? 'لا توجد إشعارات'
                        : 'Aucune notification'}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeSection ===
            'reviews' && (
            <section className="space-y-4">
              <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-amber-50 text-amber-500">
                    <Icon
                      name="star"
                    />
                  </span>

                  <div>
                    <p className="font-black text-slate-950">
                      {isArabic
                        ? 'تقييم تجربتك'
                        : 'Évaluez votre expérience'}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {isArabic
                        ? `${completedOrdersCount} طلبات مكتملة. تقييم المتجر يظهر كل 5 طلبات.`
                        : `${completedOrdersCount} commandes terminées. L’avis sur TEO STORE apparaît toutes les 5 commandes.`}
                    </p>
                  </div>
                </div>
              </div>

              {pendingStoreReviewMilestone !==
                null && (
                <div className="rounded-[22px] border border-blue-100 bg-blue-50 p-5">
                  <p className="font-black text-blue-950">
                    {isArabic
                      ? `وصلت إلى ${pendingStoreReviewMilestone} طلبات مكتملة`
                      : `Vous avez atteint ${pendingStoreReviewMilestone} commandes terminées`}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    {isArabic
                      ? 'شاركنا تقييمك العام لخدمة TEO STORE.'
                      : 'Partagez votre avis général sur TEO STORE.'}
                  </p>

                  <button
                    type="button"
                    onClick={
                      openStoreReviewModal
                    }
                    className="mt-4 h-11 rounded-xl bg-blue-600 px-5 text-sm font-black text-white"
                  >
                    {isArabic
                      ? 'تقييم TEO STORE'
                      : 'Évaluer TEO STORE'}
                  </button>
                </div>
              )}

              {pendingReviewOrders.length >
                0 && (
                <div className="overflow-hidden rounded-[22px] border border-amber-200 bg-white shadow-sm">
                  <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-black text-amber-900">
                      {isArabic
                        ? 'خدمات تحتاج إلى تقييم'
                        : 'Services à évaluer'}
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {pendingReviewOrders.map(
                      (
                        order,
                      ) => (
                        <div
                          key={
                            order.id
                          }
                          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p
                              dir="ltr"
                              className="text-left text-[11px] font-black text-blue-600"
                            >
                              {
                                order.order_number
                              }
                            </p>

                            <p className="mt-1 truncate font-black text-slate-950">
                              {
                                order.service_name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                order.plan_label
                              }
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openReviewModal(
                                order,
                              )
                            }
                            className="h-10 rounded-xl bg-amber-500 px-4 text-xs font-black text-white"
                          >
                            {isArabic
                              ? 'تقييم'
                              : 'Évaluer'}
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-slate-950">
                    {isArabic
                      ? 'تقييمات TEO STORE السابقة'
                      : 'Avis TEO STORE précédents'}
                  </p>

                  <span
                    dir="ltr"
                    className="text-xs font-black text-slate-500"
                  >
                    {
                      storeReviews.length
                    }
                  </span>
                </div>

                {storeReviews.length >
                0 ? (
                  <div className="mt-4 space-y-3">
                    {[...storeReviews]
                      .sort(
                        (
                          a,
                          b,
                        ) =>
                          b.milestone -
                          a.milestone,
                      )
                      .map(
                        (
                          item,
                        ) => (
                          <div
                            key={
                              item.id
                            }
                            className="rounded-[16px] bg-slate-50 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-black text-slate-900">
                                {isArabic
                                  ? `بعد ${item.milestone} طلبات`
                                  : `Après ${item.milestone} commandes`}
                              </p>

                              <span
                                dir="ltr"
                                className="font-black text-amber-500"
                              >
                                {
                                  item.rating
                                }
                                /5 ★
                              </span>
                            </div>

                            {item.comment && (
                              <p className="mt-2 text-xs leading-5 text-slate-500">
                                {
                                  item.comment
                                }
                              </p>
                            )}
                          </div>
                        ),
                      )}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-slate-500">
                    {isArabic
                      ? `يتبقى ${ordersUntilNextStoreReview} طلبات مكتملة حتى التقييم القادم.`
                      : `Il reste ${ordersUntilNextStoreReview} commandes terminées avant le prochain avis.`}
                  </p>
                )}
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-slate-950">
                    {isArabic
                      ? 'تقييمات الخدمات السابقة'
                      : 'Avis produits précédents'}
                  </p>

                  <span
                    dir="ltr"
                    className="text-xs font-black text-slate-500"
                  >
                    {
                      reviews.length
                    }
                  </span>
                </div>

                {reviews.length >
                0 ? (
                  <div className="mt-4 space-y-3">
                    {reviews.map(
                      (
                        review,
                      ) => (
                        <div
                          key={
                            review.id
                          }
                          className="rounded-[16px] bg-slate-50 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p
                              dir="ltr"
                              className="truncate text-left text-xs font-black text-blue-600"
                            >
                              {
                                review.order_number
                              }
                            </p>

                            <span
                              dir="ltr"
                              className="shrink-0 font-black text-amber-500"
                            >
                              {
                                review.rating
                              }
                              /5 ★
                            </span>
                          </div>

                          {review.comment && (
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {
                                review.comment
                              }
                            </p>
                          )}

                          <p
                            dir="ltr"
                            className="mt-2 text-left text-[10px] text-slate-500"
                          >
                            {formatDate(
                              review.created_at,
                            )}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-slate-500">
                    {isArabic
                      ? 'لم ترسل أي تقييم للخدمات بعد.'
                      : 'Vous n’avez encore publié aucun avis produit.'}
                  </p>
                )}
              </div>
            </section>
          )}

          {activeSection ===
            'account' && (
            <section className="space-y-4">
              <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xl font-black uppercase text-white">
                    {
                      firstLetter
                    }
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-slate-950">
                      {
                        user.fullName
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {isArabic
                        ? 'حساب TEO STORE'
                        : 'Compte TEO STORE'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
                  <div className="py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      {isArabic
                        ? 'الاسم'
                        : 'Nom'}
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-900">
                      {
                        user.fullName
                      }
                    </p>
                  </div>

                  <div className="py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      {isArabic
                        ? 'البريد الإلكتروني'
                        : 'E-mail'}
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 break-all text-left text-sm font-black text-slate-900"
                    >
                      {user.email ||
                        '—'}
                    </p>
                  </div>

                  <div className="py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      {isArabic
                        ? 'الهاتف'
                        : 'Téléphone'}
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 text-left text-sm font-black text-slate-900"
                    >
                      {user.phone ||
                        '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
                <div className="flex min-h-[74px] items-center gap-3 border-b border-slate-100 px-4 sm:px-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-sky-50 text-sky-600">
                    <Icon
                      name="globe"
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-950">
                      {isArabic
                        ? 'اللغة'
                        : 'Langue'}
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      {isArabic
                        ? 'العربية'
                        : 'Français'}
                    </span>
                  </span>
                </div>

                <div className="flex min-h-[74px] items-center gap-3 px-4 opacity-70 sm:px-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-slate-100 text-slate-500">
                    <Icon
                      name="user"
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-950">
                      {isArabic
                        ? 'سياسة الخصوصية'
                        : 'Politique de confidentialité'}
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      {isArabic
                        ? 'سنربط الصفحة القانونية عند تجهيزها.'
                        : 'La page juridique sera reliée lorsqu’elle sera prête.'}
                    </span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleSignOut()
                }
                className="flex min-h-[68px] w-full items-center justify-center gap-2 rounded-[18px] border border-rose-100 bg-rose-50 px-4 text-sm font-black text-rose-600"
              >
                <Icon
                  name="logout"
                />

                {isArabic
                  ? 'تسجيل الخروج'
                  : 'Se déconnecter'}
              </button>
            </section>
          )}

          {activeSection === 'support' && <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-black">{isArabic ? 'مركز المساعدة والمحادثات' : 'Centre d’assistance et conversations'}</h2><p className="my-3 text-sm text-slate-500">{isArabic ? 'تواصل مع فريق الدعم داخل الموقع وتابع محادثاتك.' : 'Contactez notre équipe et suivez vos conversations sur le site.'}</p><Link className="inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white" to="/assistance">{isArabic ? 'فتح مركز الدعم' : 'Ouvrir l’assistance'}</Link></section>}
          {activeSection === 'loyalty' && loyaltyCard}
          {activeSection === 'services' && <section className="space-y-3"><p className="text-sm text-slate-500">{isArabic ? 'الخدمات التي تم إرسالها إليك. افتح الطلب للوصول إلى تفاصيل التسليم.' : 'Services livrés. Ouvrez la commande pour consulter la livraison.'}</p>{delivered.length === 0 && <p>{isArabic ? 'لا توجد خدمات مستلمة بعد.' : 'Aucun service livré.'}</p>}{delivered.map(order => <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">{order.service_name}</h2><p className="text-sm text-slate-500">{order.plan_label} · {order.order_number}</p><p className="my-2 text-sm">{getStatusLabel(order.status)}</p><Link className="inline-flex rounded-xl bg-blue-600 px-4 py-2 font-bold text-white" to={`/commande/${order.order_number}`}>{isArabic ? 'عرض الخدمة' : 'Voir le service'}</Link></article>)}</section>}
          {activeSection === 'security' && <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">{isArabic ? 'تغيير كلمة المرور' : 'Modifier le mot de passe'}</h2><form className="space-y-3" onSubmit={event => {event.preventDefault(); void changePassword()}}><label className="block text-sm">{isArabic ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}<input className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)}/></label><label className="block text-sm">{isArabic ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}<input className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3" type="password" autoComplete="new-password" required value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}/></label><button disabled={saving} className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">{isArabic ? 'حفظ كلمة المرور' : 'Enregistrer'}</button></form>{accountNotice && <p role="status" className="text-sm">{accountNotice}</p>}</section>}
        </div></div>
      </Container>

      {reviewOrder && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 sm:max-w-lg sm:rounded-[28px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-amber-600">
                  TEO STORE
                </p>

                <h2 className="mt-2 text-xl font-black text-slate-950">
                  {isArabic
                    ? 'قيّم خدمتك'
                    : 'Évaluez votre service'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    reviewOrder.service_name
                  }
                  {' · '}
                  {
                    reviewOrder.plan_label
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeReviewModal
                }
                disabled={
                  isSubmittingReview
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-black"
              >
                ×
              </button>
            </div>

            <div className="mt-6 rounded-[18px] bg-slate-50 p-5 text-center">
              <p className="text-sm font-black text-slate-700">
                {isArabic
                  ? 'اختر عدد النجوم'
                  : 'Choisissez votre note'}
              </p>

              <div
                dir="ltr"
                className="mt-4 flex justify-center gap-2"
              >
                {[
                  1,
                  2,
                  3,
                  4,
                  5,
                ].map(
                  (
                    star,
                  ) => (
                    <button
                      key={
                        star
                      }
                      type="button"
                      disabled={
                        isSubmittingReview
                      }
                      onClick={() =>
                        setReviewRating(
                          star,
                        )
                      }
                      className={
                        star <=
                        reviewRating
                          ? 'text-3xl text-amber-400'
                          : 'text-3xl text-slate-200'
                      }
                    >
                      ★
                    </button>
                  ),
                )}
              </div>

              <p
                dir="ltr"
                className="mt-3 font-black text-amber-600"
              >
                {
                  reviewRating
                }{' '}
                / 5
              </p>
            </div>

            <textarea
              rows={
                4
              }
              value={
                reviewComment
              }
              onChange={(
                event,
              ) =>
                setReviewComment(
                  event.target.value,
                )
              }
              disabled={
                isSubmittingReview
              }
              placeholder={
                isArabic
                  ? 'شارك تجربتك مع هذه الخدمة...'
                  : 'Partagez votre expérience...'
              }
              className="mt-5 w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50 p-4 text-sm outline-none"
            />

            {reviewError && (
              <p className="mt-3 text-sm font-bold text-rose-600">
                {
                  reviewError
                }
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={
                  closeReviewModal
                }
                disabled={
                  isSubmittingReview
                }
                className="h-12 rounded-xl border border-slate-200 font-black"
              >
                {isArabic
                  ? 'لاحقًا'
                  : 'Plus tard'}
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleSubmitReview()
                }
                disabled={
                  isSubmittingReview
                }
                className="h-12 rounded-xl bg-amber-500 font-black text-white disabled:opacity-50"
              >
                {isSubmittingReview
                  ? isArabic
                    ? 'جارٍ الإرسال...'
                    : 'Envoi...'
                  : isArabic
                    ? 'إرسال التقييم'
                    : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {storeReviewOpen &&
        pendingStoreReviewMilestone !==
          null && (
          <div className="fixed inset-0 z-[160] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 sm:max-w-lg sm:rounded-[28px]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-blue-600">
                    TEO STORE
                  </p>

                  <h2 className="mt-2 text-xl font-black text-slate-950">
                    {isArabic
                      ? 'قيّم تجربتك مع المتجر'
                      : 'Évaluez votre expérience'}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {isArabic
                      ? `وصلت إلى ${pendingStoreReviewMilestone} طلبات مكتملة.`
                      : `Vous avez atteint ${pendingStoreReviewMilestone} commandes terminées.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeStoreReviewModal
                  }
                  disabled={
                    isSubmittingStoreReview
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-black"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 rounded-[18px] bg-blue-50 p-5 text-center">
                <p className="text-sm font-black text-slate-700">
                  {isArabic
                    ? 'كيف تقيّم TEO STORE؟'
                    : 'Comment évaluez-vous TEO STORE ?'}
                </p>

                <div
                  dir="ltr"
                  className="mt-4 flex justify-center gap-2"
                >
                  {[
                    1,
                    2,
                    3,
                    4,
                    5,
                  ].map(
                    (
                      star,
                    ) => (
                      <button
                        key={
                          star
                        }
                        type="button"
                        disabled={
                          isSubmittingStoreReview
                        }
                        onClick={() =>
                          setStoreReviewRating(
                            star,
                          )
                        }
                        className={
                          star <=
                          storeReviewRating
                            ? 'text-3xl text-amber-400'
                            : 'text-3xl text-slate-200'
                        }
                      >
                        ★
                      </button>
                    ),
                  )}
                </div>

                <p
                  dir="ltr"
                  className="mt-3 font-black text-blue-700"
                >
                  {
                    storeReviewRating
                  }{' '}
                  / 5
                </p>
              </div>

              <label className="mt-5 block">
                <span className="text-sm font-black text-slate-700">
                  {isArabic
                    ? 'تعليقك عن المتجر'
                    : 'Votre commentaire sur TEO STORE'}
                </span>

                <textarea
                  rows={
                    4
                  }
                  value={
                    storeReviewComment
                  }
                  onChange={(
                    event,
                  ) =>
                    setStoreReviewComment(
                      event.target.value,
                    )
                  }
                  disabled={
                    isSubmittingStoreReview
                  }
                  placeholder={
                    isArabic
                      ? 'ما رأيك في الخدمة والدفع والتسليم والدعم؟'
                      : 'Que pensez-vous du service, du paiement, de la livraison numérique et du support ?'
                  }
                  className="mt-2 w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-blue-400 focus:bg-white"
                />
              </label>

              {storeReviewError && (
                <div className="mt-4 rounded-[14px] border border-rose-100 bg-rose-50 p-3">
                  <p className="text-sm font-bold text-rose-700">
                    {
                      storeReviewError
                    }
                  </p>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={
                    closeStoreReviewModal
                  }
                  disabled={
                    isSubmittingStoreReview
                  }
                  className="h-12 rounded-[14px] border border-slate-200 text-sm font-black text-slate-700"
                >
                  {isArabic
                    ? 'لاحقًا'
                    : 'Plus tard'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleSubmitStoreReview()
                  }
                  disabled={
                    isSubmittingStoreReview
                  }
                  className="h-12 rounded-[14px] bg-blue-600 text-sm font-black text-white disabled:opacity-50"
                >
                  {isSubmittingStoreReview
                    ? isArabic
                      ? 'جارٍ الإرسال...'
                      : 'Envoi...'
                    : isArabic
                      ? 'إرسال التقييم'
                      : 'Envoyer mon avis'}
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  )
}

export default ProfilePage