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

type WhatsappSupportSetting = {
  active: boolean
  number: string
  messageFr: string
  messageAr: string
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

  const notificationsRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const {
    language,
    formatCurrencyText,
  } = useLanguage()

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
    whatsappSupport,
    setWhatsappSupport,
  ] =
    useState<WhatsappSupportSetting | null>(
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
    notificationsOpen,
    setNotificationsOpen,
  ] =
    useState(false)

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

  const loadSupportWhatsapp =
    useCallback(
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'app_settings',
            )
            .select(
              'setting_value',
            )
            .eq(
              'setting_key',
              'support_whatsapp',
            )
            .maybeSingle()

        if (error) {
          console.warn(
            'Unable to load WhatsApp support setting:',
            error,
          )

          setWhatsappSupport(
            null,
          )

          return
        }

        const value =
          data?.setting_value

        if (
          !value ||
          typeof value !==
            'object' ||
          Array.isArray(
            value,
          )
        ) {
          setWhatsappSupport(
            null,
          )

          return
        }

        const setting =
          value as Record<
            string,
            unknown
          >

        const number =
          typeof setting.number ===
            'string'
            ? setting.number
                .replace(
                  /\D/g,
                  '',
                )
            : ''

        const active =
          typeof setting.active ===
            'boolean'
            ? setting.active
            : true

        if (
          !active ||
          number.length ===
            0
        ) {
          setWhatsappSupport(
            null,
          )

          return
        }

        setWhatsappSupport({
          active:
            true,

          number,

          messageFr:
            typeof setting.messageFr ===
              'string'
              ? setting.messageFr
              : 'Bonjour TEO STORE, j’ai besoin d’aide.',

          messageAr:
            typeof setting.messageAr ===
              'string'
              ? setting.messageAr
              : 'مرحبًا TEO STORE، أحتاج إلى المساعدة.',
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
            loadSupportWhatsapp(),
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
        loadOrders,
        loadReviews,
        loadStoreReviews,
        loadSupportWhatsapp,
      ],
    )

  useEffect(
    () => {
      const handleClickOutside =
        (
          event:
            MouseEvent,
        ) => {
          const target =
            event.target as Node

          if (
            notificationsRef.current &&
            !notificationsRef.current.contains(
              target,
            )
          ) {
            setNotificationsOpen(
              false,
            )
          }
        }

      document.addEventListener(
        'mousedown',
        handleClickOutside,
      )

      return () => {
        document.removeEventListener(
          'mousedown',
          handleClickOutside,
        )
      }
    },
    [],
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

          setNotificationsOpen(
            false,
          )

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

      return () => {
        document.removeEventListener(
          'keydown',
          handleEscape,
        )
      }
    },
    [
      isSubmittingReview,
      isSubmittingStoreReview,
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
              authUser.phone
                .trim()
                .length >
                0
                ? authUser.phone.trim()
                : typeof metadataPhone ===
                    'string'
                  ? metadataPhone.trim()
                  : '',

            fullName:
              typeof metadataName ===
                'string' &&
              metadataName
                .trim()
                .length >
                0
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
                void loadOrders(
                  currentUserId,
                )
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

      const settingsChannel =
        supabase
          .channel(
            `customer-profile-settings-${Date.now()}`,
          )
          .on(
            'postgres_changes',
            {
              event:
                '*',

              schema:
                'public',

              table:
                'app_settings',
            },
            (
              payload,
            ) => {
              const next =
                payload.new as
                  | {
                      setting_key?: string
                    }
                  | undefined

              const previous =
                payload.old as
                  | {
                      setting_key?: string
                    }
                  | undefined

              const settingKey =
                next?.setting_key ??
                previous?.setting_key

              if (
                settingKey ===
                'support_whatsapp'
              ) {
                void loadSupportWhatsapp()
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

        void supabase
          .removeChannel(
            settingsChannel,
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
      loadNotifications,
      loadOrders,
      loadReviews,
      loadStoreReviews,
      loadSupportWhatsapp,
      navigate,
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

      setNotificationsOpen(
        false,
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

  const getDigitalStatusLabel =
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
        return isArabic
          ? 'جارٍ التحقق من الدفع'
          : 'Vérification du paiement'
      }

      if (
        status ===
        'payment_partial'
      ) {
        return isArabic
          ? 'مطلوب إكمال الدفع'
          : 'Complément requis'
      }

      if (
        status ===
        'payment_confirmed'
      ) {
        return isArabic
          ? 'تم تأكيد الدفع'
          : 'Paiement confirmé'
      }

      if (
        status ===
        'processing'
      ) {
        return isArabic
          ? 'قيد التجهيز'
          : 'En traitement'
      }

      if (
        status ===
        'fulfillment_sent'
      ) {
        return isArabic
          ? 'تم إرسال الخدمة'
          : 'Service envoyé'
      }

      if (
        status ===
        'disputed'
      ) {
        return isArabic
          ? 'نزاع مفتوح'
          : 'Litige ouvert'
      }

      if (
        status ===
        'completed'
      ) {
        return isArabic
          ? 'تم تأكيد الاستلام'
          : 'Commande terminée'
      }

      if (
        status ===
        'cancelled'
      ) {
        return isArabic
          ? 'تم إلغاء الطلب'
          : 'Commande annulée'
      }

      return isArabic
        ? 'تم الاسترجاع'
        : 'Remboursée'
    }

  const getDigitalStatusClasses =
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
      const locale =
        isArabic
          ? 'ar-MR-u-nu-latn'
          : 'fr-FR-u-nu-latn'

      try {
        return new Intl.DateTimeFormat(
          locale,
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
      const normalizedAmount =
        new Intl.NumberFormat(
          'fr-FR-u-nu-latn',
          {
            numberingSystem:
              'latn',
          },
        ).format(
          Number(
            amount,
          ),
        )

      return formatCurrencyText(
        `${normalizedAmount} ${currency}`,
      )
    }

  const scrollToSection =
    (
      sectionId:
        string,
    ) => {
      document
        .getElementById(
          sectionId,
        )
        ?.scrollIntoView({
          behavior:
            'smooth',

          block:
            'start',
        })
    }

  const openNotifications =
    () => {
      setNotificationsOpen(
        true,
      )

      window.setTimeout(
        () => {
          notificationsRef.current
            ?.scrollIntoView({
              behavior:
                'smooth',

              block:
                'center',
            })
        },
        50,
      )
    }

  const openWhatsappSupport =
    () => {
      if (
        !whatsappSupport
      ) {
        return
      }

      const message =
        isArabic
          ? whatsappSupport.messageAr
          : whatsappSupport.messageFr

      const url =
        `https://wa.me/${whatsappSupport.number}?text=${encodeURIComponent(
          message,
        )}`

      window.open(
        url,
        '_blank',
        'noopener,noreferrer',
      )
    }

  const handleSignOut =
    async () => {
      try {
        await supabase.auth
          .signOut()
      } finally {
        navigate(
          '/connexion',
          {
            replace:
              true,
          },
        )
      }
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
      <main className="min-h-[60vh] bg-[#f7f9fc]">
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

  const initials =
    user.fullName
      .trim()
      .charAt(
        0,
      )
      .toUpperCase() ||
    'T'

  return (
    <main
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
      className="min-h-screen overflow-x-hidden bg-[#f5f6f8] pb-10 pt-4 sm:py-8 lg:py-12"
    >
      <Container>
        <div className="mx-auto max-w-6xl">
          <section className="lg:hidden">
            <div className="overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-white/10 text-xl font-black uppercase ring-1 ring-white/10">
                  {
                    initials
                  }
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">
                    TEO STORE
                  </p>

                  <h1 className="mt-1 truncate text-xl font-black">
                    {
                      user.fullName
                    }
                  </h1>

                  <p
                    dir="ltr"
                    className="mt-1 truncate text-left text-xs font-semibold text-white/55"
                  >
                    {
                      user.email
                    }
                  </p>

                  {user.phone && (
                    <p
                      dir="ltr"
                      className="mt-1 truncate text-left text-xs font-semibold text-white/45"
                    >
                      {
                        user.phone
                      }
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={
                    handleRefresh
                  }
                  disabled={
                    isRefreshing
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-lg font-black ring-1 ring-white/10 disabled:opacity-50"
                  aria-label={
                    isArabic
                      ? 'تحديث الحساب'
                      : 'Actualiser le compte'
                  }
                >
                  <span
                    className={
                      isRefreshing
                        ? 'animate-spin'
                        : ''
                    }
                  >
                    ↻
                  </span>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      'profile-orders',
                    )
                  }
                  className="rounded-[16px] bg-white/[0.08] px-3 py-3 text-center ring-1 ring-white/10"
                >
                  <p className="text-lg font-black">
                    {
                      orders.length
                    }
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-white/55">
                    {isArabic
                      ? 'الطلبات'
                      : 'Commandes'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={
                    openNotifications
                  }
                  className="rounded-[16px] bg-white/[0.08] px-3 py-3 text-center ring-1 ring-white/10"
                >
                  <p className="text-lg font-black">
                    {
                      unreadNotifications.length
                    }
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-white/55">
                    {isArabic
                      ? 'جديدة'
                      : 'Nouvelles'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      'profile-reviews',
                    )
                  }
                  className="rounded-[16px] bg-white/[0.08] px-3 py-3 text-center ring-1 ring-white/10"
                >
                  <p className="text-lg font-black">
                    {
                      reviews.length +
                      storeReviews.length
                    }
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-white/55">
                    {isArabic
                      ? 'تقييمات'
                      : 'Avis'}
                  </p>
                </button>
              </div>
            </div>

            {(
              pendingReviewOrders.length >
                0 ||
              pendingStoreReviewMilestone !==
                null
            ) && (
              <div className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-amber-500 text-lg text-white">
                    ★
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-amber-950">
                      {isArabic
                        ? 'لديك تقييم بانتظارك'
                        : 'Un avis vous attend'}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      {isArabic
                        ? 'شارك رأيك عن الخدمات أو تجربة TEO STORE.'
                        : 'Partagez votre avis sur vos services ou votre expérience TEO STORE.'}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        scrollToSection(
                          'profile-reviews',
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
              </div>
            )}

            <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    'profile-orders',
                  )
                }
                className="flex min-h-[68px] w-full items-center gap-3 border-b border-slate-100 px-4 text-start"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-blue-50 text-xl">
                  🛍️
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-slate-950">
                    {isArabic
                      ? 'طلباتي'
                      : 'Mes commandes'}
                  </span>

                  <span className="mt-1 block text-xs text-slate-400">
                    {isArabic
                      ? `${orders.length} طلبات`
                      : `${orders.length} commandes`}
                  </span>
                </span>

                <span className="text-xl text-slate-300">
                  {isArabic
                    ? '‹'
                    : '›'}
                </span>
              </button>

              <button
                type="button"
                onClick={
                  openNotifications
                }
                className="flex min-h-[68px] w-full items-center gap-3 border-b border-slate-100 px-4 text-start"
              >
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-violet-50 text-xl">
                  🔔

                  {unreadNotifications.length >
                    0 && (
                    <span
                      dir="ltr"
                      className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white"
                    >
                      {unreadNotifications.length >
                      99
                        ? '99+'
                        : unreadNotifications.length}
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-slate-950">
                    {isArabic
                      ? 'الإشعارات'
                      : 'Notifications'}
                  </span>

                  <span className="mt-1 block text-xs text-slate-400">
                    {unreadNotifications.length >
                    0
                      ? isArabic
                        ? `${unreadNotifications.length} إشعارات جديدة`
                        : `${unreadNotifications.length} nouvelles notifications`
                      : isArabic
                        ? 'لا توجد إشعارات جديدة'
                        : 'Aucune nouvelle notification'}
                  </span>
                </span>

                <span className="text-xl text-slate-300">
                  {isArabic
                    ? '‹'
                    : '›'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    'profile-reviews',
                  )
                }
                className="flex min-h-[68px] w-full items-center gap-3 border-b border-slate-100 px-4 text-start"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-amber-50 text-xl">
                  ⭐
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-slate-950">
                    {isArabic
                      ? 'تقييماتي'
                      : 'Mes avis'}
                  </span>

                  <span className="mt-1 block text-xs text-slate-400">
                    {isArabic
                      ? 'تقييم الخدمات وتجربة المتجر'
                      : 'Avis produits et expérience boutique'}
                  </span>
                </span>

                <span className="text-xl text-slate-300">
                  {isArabic
                    ? '‹'
                    : '›'}
                </span>
              </button>

              <div className="flex min-h-[68px] items-center gap-3 border-b border-slate-100 px-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-emerald-50 text-xl">
                  👤
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-slate-950">
                    {isArabic
                      ? 'معلوماتي'
                      : 'Mes informations'}
                  </span>

                  <span className="mt-1 block truncate text-xs text-slate-400">
                    {user.phone ||
                      user.email}
                  </span>
                </span>
              </div>

              <div className="flex min-h-[68px] items-center gap-3 px-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-sky-50 text-xl">
                  🌐
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-slate-950">
                    {isArabic
                      ? 'اللغة'
                      : 'Langue'}
                  </span>

                  <span className="mt-1 block text-xs text-slate-400">
                    {isArabic
                      ? 'العربية'
                      : 'Français'}
                  </span>
                </span>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
              {orders.length >
                0 && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/commande/${orders[0].order_number}`,
                    )
                  }
                  className="flex min-h-[68px] w-full items-center gap-3 border-b border-slate-100 px-4 text-start"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-blue-50 text-xl">
                    💬
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-950">
                      {isArabic
                        ? 'الدعم داخل الموقع'
                        : 'Support sur le site'}
                    </span>

                    <span className="mt-1 block text-xs text-slate-400">
                      {isArabic
                        ? 'افتح آخر طلب للمتابعة أو طلب المساعدة'
                        : 'Ouvrez votre dernière commande pour le suivi ou l’assistance'}
                    </span>
                  </span>

                  <span className="text-xl text-slate-300">
                    {isArabic
                      ? '‹'
                      : '›'}
                  </span>
                </button>
              )}

              {whatsappSupport && (
                <button
                  type="button"
                  onClick={
                    openWhatsappSupport
                  }
                  className="flex min-h-[68px] w-full items-center gap-3 border-b border-slate-100 px-4 text-start"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-emerald-50 text-xl">
                    💚
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-950">
                      WhatsApp
                    </span>

                    <span className="mt-1 block text-xs text-slate-400">
                      {isArabic
                        ? 'تواصل سريع مع خدمة الزبائن'
                        : 'Contact rapide avec le service client'}
                    </span>
                  </span>

                  <span className="text-xl text-slate-300">
                    {isArabic
                      ? '‹'
                      : '›'}
                  </span>
                </button>
              )}

              <div className="flex min-h-[68px] items-center gap-3 border-b border-slate-100 px-4 opacity-60">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-slate-100 text-xl">
                  🔒
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-slate-950">
                    {isArabic
                      ? 'سياسة الخصوصية'
                      : 'Politique de confidentialité'}
                  </span>

                  <span className="mt-1 block text-xs text-slate-400">
                    {isArabic
                      ? 'سيتم ربط الصفحة القانونية عند إضافتها'
                      : 'La page sera reliée dès son ajout'}
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleSignOut()
                }
                className="flex min-h-[68px] w-full items-center gap-3 px-4 text-start"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-rose-50 text-xl">
                  ↗
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-rose-600">
                    {isArabic
                      ? 'تسجيل الخروج'
                      : 'Se déconnecter'}
                  </span>

                  <span className="mt-1 block text-xs text-slate-400">
                    {isArabic
                      ? 'الخروج من حساب TEO STORE'
                      : 'Quitter votre compte TEO STORE'}
                  </span>
                </span>
              </button>
            </div>
          </section>

          <div className="mt-5 grid gap-5 lg:mt-0 lg:grid-cols-[300px_1fr]">
            <aside className="hidden h-fit rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)] lg:sticky lg:top-28 lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black uppercase text-white shadow-sm">
                  {
                    initials
                  }
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-black text-slate-950">
                    {
                      user.fullName
                    }
                  </p>

                  <p
                    dir="ltr"
                    className="mt-1 truncate text-left text-xs font-semibold text-slate-500"
                  >
                    {
                      user.email
                    }
                  </p>

                  {user.phone && (
                    <p
                      dir="ltr"
                      className="mt-1 truncate text-left text-xs font-semibold text-slate-400"
                    >
                      {
                        user.phone
                      }
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  {isArabic
                    ? 'الحساب'
                    : 'Compte'}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isArabic
                    ? 'تابع طلباتك وإشعاراتك وتقييماتك من مكان واحد.'
                    : 'Suivez vos commandes, notifications et avis depuis un seul espace.'}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      'profile-orders',
                    )
                  }
                  className="rounded-[14px] bg-slate-50 p-3 text-center"
                >
                  <p className="text-xl font-black text-slate-950">
                    {
                      orders.length
                    }
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-slate-400">
                    {isArabic
                      ? 'الطلبات'
                      : 'Commandes'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={
                    openNotifications
                  }
                  className="rounded-[14px] bg-slate-50 p-3 text-center"
                >
                  <p className="text-xl font-black text-slate-950">
                    {
                      unreadNotifications.length
                    }
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-slate-400">
                    {isArabic
                      ? 'إشعارات'
                      : 'Notifications'}
                  </p>
                </button>
              </div>

              {pendingReviewOrders.length >
                0 && (
                <div className="mt-4 rounded-[18px] border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-800">
                    {isArabic
                      ? 'تقييمات معلقة'
                      : 'Avis en attente'}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    {isArabic
                      ? 'لديك خدمات مكتملة تحتاج إلى تقييم.'
                      : 'Des services terminés attendent encore votre avis.'}
                  </p>
                </div>
              )}

              {pendingStoreReviewMilestone !==
                null && (
                <button
                  type="button"
                  onClick={
                    openStoreReviewModal
                  }
                  className="mt-3 w-full rounded-[16px] border border-blue-100 bg-blue-50 p-4 text-start"
                >
                  <p className="text-sm font-black text-blue-900">
                    {isArabic
                      ? '★ قيّم TEO STORE'
                      : '★ Évaluez TEO STORE'}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    {isArabic
                      ? `وصلت إلى ${pendingStoreReviewMilestone} طلبات مكتملة.`
                      : `Vous avez atteint ${pendingStoreReviewMilestone} commandes terminées.`}
                  </p>
                </button>
              )}

              <Link
                to="/services-numeriques"
                className="mt-5 flex h-11 items-center justify-center rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 px-3 text-center text-sm font-black text-white"
              >
                {isArabic
                  ? 'استكشاف الخدمات'
                  : 'Explorer les services'}
              </Link>

              <div className="mt-3 grid gap-2">
                {orders.length >
                  0 && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/commande/${orders[0].order_number}`,
                      )
                    }
                    className="flex h-11 items-center justify-center rounded-[14px] border border-slate-200 bg-white px-3 text-sm font-black text-slate-700"
                  >
                    {isArabic
                      ? 'الدعم داخل الموقع'
                      : 'Support sur le site'}
                  </button>
                )}

                {whatsappSupport && (
                  <button
                    type="button"
                    onClick={
                      openWhatsappSupport
                    }
                    className="flex h-11 items-center justify-center rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-700"
                  >
                    WhatsApp
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void handleSignOut()
                  }
                  className="flex h-11 items-center justify-center rounded-[14px] border border-rose-100 bg-rose-50 px-3 text-sm font-black text-rose-600"
                >
                  {isArabic
                    ? 'تسجيل الخروج'
                    : 'Se déconnecter'}
                </button>
              </div>
            </aside>

            <section className="min-w-0">
              <div className="hidden lg:flex lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                    TEO STORE
                  </p>

                  <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                    {isArabic
                      ? 'حسابي'
                      : 'Mon compte'}
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500">
                    {isArabic
                      ? 'طلباتك وإشعاراتك وتقييماتك وخدمة الزبائن.'
                      : 'Vos commandes, notifications, avis et service client.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleRefresh
                  }
                  disabled={
                    isRefreshing
                  }
                  className="flex h-11 items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 disabled:opacity-50"
                >
                  <span
                    className={
                      isRefreshing
                        ? 'animate-spin'
                        : ''
                    }
                  >
                    ↻
                  </span>

                  {isArabic
                    ? 'تحديث'
                    : 'Actualiser'}
                </button>
              </div>

              {errorMessage && (
                <div className="mt-5 rounded-[18px] border border-rose-100 bg-rose-50 p-4">
                  <p className="text-sm font-bold text-rose-700">
                    {
                      errorMessage
                    }
                  </p>
                </div>
              )}

              <div
                ref={
                  notificationsRef
                }
                className="relative mt-5"
              >
                <div className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-violet-50 text-lg">
                      🔔
                    </span>

                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {isArabic
                          ? 'الإشعارات'
                          : 'Notifications'}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {unreadNotifications.length >
                        0
                          ? isArabic
                            ? `${unreadNotifications.length} جديدة`
                            : `${unreadNotifications.length} nouvelles`
                          : isArabic
                            ? 'لا توجد إشعارات جديدة'
                            : 'Aucune nouvelle notification'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNotificationsOpen(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    className="relative flex h-10 w-10 items-center justify-center rounded-[12px] border border-slate-200 bg-white text-slate-500"
                    aria-label={
                      isArabic
                        ? 'فتح الإشعارات'
                        : 'Ouvrir les notifications'
                    }
                  >
                    {notificationsOpen
                      ? '×'
                      : '›'}

                    {unreadNotifications.length >
                      0 && (
                      <span
                        dir="ltr"
                        className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white"
                      >
                        {unreadNotifications.length >
                        99
                          ? '99+'
                          : unreadNotifications.length}
                      </span>
                    )}
                  </button>
                </div>

                {notificationsOpen && (
                  <div className="mt-2 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.16)]">
                    <div className="flex items-center justify-between border-b border-slate-100 p-4">
                      <h2 className="font-black text-slate-950">
                        {isArabic
                          ? 'الإشعارات'
                          : 'Notifications'}
                      </h2>

                      {unreadNotifications.length >
                        0 && (
                        <button
                          type="button"
                          onClick={() =>
                            void markAllNotificationsRead()
                          }
                          className="text-xs font-black text-blue-600"
                        >
                          {isArabic
                            ? 'قراءة الكل'
                            : 'Tout lire'}
                        </button>
                      )}
                    </div>

                    <div className="max-h-[460px] overflow-y-auto p-2">
                      {notifications.length >
                      0 ? (
                        notifications.map(
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
                                'mb-1 w-full rounded-[16px] p-3 text-start',
                                notification.is_read
                                  ? 'bg-white'
                                  : 'bg-blue-50',
                              ].join(
                                ' ',
                              )}
                            >
                              <p className="text-sm font-black text-slate-900">
                                {getNotificationTitle(
                                  notification,
                                )}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {getNotificationMessage(
                                  notification,
                                )}
                              </p>

                              <p
                                dir="ltr"
                                className="mt-2 text-left text-[10px] text-slate-400"
                              >
                                {formatDate(
                                  notification.created_at,
                                )}
                              </p>
                            </button>
                          ),
                        )
                      ) : (
                        <div className="p-8 text-center text-sm font-bold text-slate-400">
                          {isArabic
                            ? 'لا توجد إشعارات'
                            : 'Aucune notification'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <section
                id="profile-reviews"
                className="mt-5 scroll-mt-24 overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-sm"
              >
                <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-300">
                    TEO STORE
                  </p>

                  <h2 className="mt-2 text-xl font-black">
                    {isArabic
                      ? 'تقييم تجربتك'
                      : 'Vos évaluations'}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {isArabic
                      ? `لديك ${completedOrdersCount} طلبات مكتملة. يظهر تقييم للمتجر كل 5 طلبات مكتملة.`
                      : `Vous avez ${completedOrdersCount} commandes terminées. Un avis boutique est proposé toutes les 5 commandes.`}
                  </p>
                </div>

                <div className="p-4 sm:p-5">
                  {pendingStoreReviewMilestone !==
                  null ? (
                    <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-4">
                      <p className="font-black text-amber-900">
                        {isArabic
                          ? `وصلت إلى ${pendingStoreReviewMilestone} طلبات مكتملة 🎉`
                          : `Vous avez atteint ${pendingStoreReviewMilestone} commandes terminées 🎉`}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        {isArabic
                          ? 'شاركنا رأيك العام في تجربة TEO STORE.'
                          : 'Partagez votre avis général sur votre expérience TEO STORE.'}
                      </p>

                      <button
                        type="button"
                        onClick={
                          openStoreReviewModal
                        }
                        className="mt-4 h-11 rounded-xl bg-amber-500 px-5 text-sm font-black text-white"
                      >
                        {isArabic
                          ? 'تقييم TEO STORE'
                          : 'Évaluer TEO STORE'}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-[18px] bg-slate-50 p-4">
                      <p className="text-sm font-black text-slate-800">
                        {isArabic
                          ? 'لا يوجد تقييم للمتجر مطلوب الآن'
                          : 'Aucun avis boutique requis maintenant'}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {isArabic
                          ? `يتبقى ${ordersUntilNextStoreReview} طلبات مكتملة حتى التقييم القادم.`
                          : `Il reste ${ordersUntilNextStoreReview} commandes terminées avant le prochain avis.`}
                      </p>
                    </div>
                  )}

                  {pendingReviewOrders.length >
                    0 && (
                    <div className="mt-5">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        {isArabic
                          ? 'تقييمات خدمات معلقة'
                          : 'Avis produits en attente'}
                      </p>

                      <div className="mt-3 space-y-3">
                        {pendingReviewOrders.map(
                          (
                            order,
                          ) => (
                            <div
                              key={
                                order.id
                              }
                              className="flex flex-col gap-3 rounded-[17px] border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p
                                  dir="ltr"
                                  className="text-xs font-black text-blue-600"
                                >
                                  {
                                    order.order_number
                                  }
                                </p>

                                <p className="mt-1 font-black text-slate-950">
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
                                className="h-11 rounded-xl bg-amber-500 px-5 text-sm font-black text-white"
                              >
                                {isArabic
                                  ? 'ترك تقييم'
                                  : 'Laisser un avis'}
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {storeReviews.length >
                    0 && (
                    <div className="mt-5">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        {isArabic
                          ? 'تقييمات المتجر السابقة'
                          : 'Vos avis boutique précédents'}
                      </p>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                                className="rounded-[16px] border border-slate-200 bg-slate-50 p-4"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-black text-slate-900">
                                    {isArabic
                                      ? `بعد ${item.milestone} طلبات`
                                      : `Après ${item.milestone} commandes`}
                                  </p>

                                  <span
                                    dir="ltr"
                                    className="shrink-0 font-black text-amber-500"
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
                    </div>
                  )}

                  {reviews.length >
                    0 && (
                    <div className="mt-5">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        {isArabic
                          ? 'تقييمات الخدمات السابقة'
                          : 'Vos avis produits précédents'}
                      </p>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {reviews.map(
                          (
                            review,
                          ) => (
                            <div
                              key={
                                review.id
                              }
                              className="rounded-[16px] border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p
                                  dir="ltr"
                                  className="truncate text-xs font-black text-blue-600"
                                >
                                  {
                                    review.order_number
                                  }
                                </p>

                                <span
                                  dir="ltr"
                                  className="shrink-0 text-sm font-black text-amber-500"
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
                                className="mt-3 text-left text-[10px] text-slate-400"
                              >
                                {formatDate(
                                  review.created_at,
                                )}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section
                id="profile-orders"
                className="mt-7 scroll-mt-24"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-950">
                    {isArabic
                      ? 'طلباتي الرقمية'
                      : 'Mes commandes numériques'}
                  </h2>

                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-black text-blue-700">
                    {
                      orders.length
                    }
                  </span>
                </div>

                {orders.length >
                0 ? (
                  <div className="space-y-4">
                    {orders.map(
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
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <p
                                    dir="ltr"
                                    className="text-left text-xs font-black text-blue-600"
                                  >
                                    {
                                      order.order_number
                                    }
                                  </p>

                                  <h3 className="mt-2 truncate text-base font-black text-slate-950">
                                    {
                                      order.service_name
                                    }
                                  </h3>

                                  <p className="mt-1 text-sm text-slate-500">
                                    {
                                      order.plan_label
                                    }
                                  </p>
                                </div>

                                <span
                                  className={[
                                    'w-fit rounded-full border px-3 py-2 text-xs font-black',
                                    getDigitalStatusClasses(
                                      status,
                                    ),
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  {getDigitalStatusLabel(
                                    status,
                                  )}
                                </span>
                              </div>

                              {status ===
                                'payment_partial' &&
                                order.payment_issue_reason && (
                                  <div className="mt-4 rounded-[15px] border border-orange-200 bg-orange-50 p-3">
                                    <p className="text-xs font-bold leading-5 text-orange-700">
                                      {
                                        order.payment_issue_reason
                                      }
                                    </p>
                                  </div>
                                )}

                              {needsReview && (
                                <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-sm font-black text-amber-800">
                                      {isArabic
                                        ? '★ تقييم هذه الخدمة ما زال معلقًا'
                                        : '★ Votre avis est encore en attente'}
                                    </p>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openReviewModal(
                                          order,
                                        )
                                      }
                                      className="h-10 rounded-xl bg-amber-500 px-4 text-sm font-black text-white"
                                    >
                                      {isArabic
                                        ? 'تقييم'
                                        : 'Évaluer'}
                                    </button>
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                <div className="rounded-[15px] bg-slate-50 p-3">
                                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                                    {isArabic
                                      ? 'المبلغ'
                                      : 'Montant'}
                                  </p>

                                  <p
                                    dir="ltr"
                                    className="mt-2 break-words text-left text-sm font-black text-slate-900"
                                  >
                                    {formatAmount(
                                      order.total_amount,
                                      order.currency,
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-[15px] bg-slate-50 p-3">
                                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                                    {isArabic
                                      ? 'الدفع'
                                      : 'Paiement'}
                                  </p>

                                  <p className="mt-2 truncate text-sm font-black text-slate-900">
                                    {order.payment_method_name ??
                                      '—'}
                                  </p>
                                </div>

                                <div className="col-span-2 rounded-[15px] bg-slate-50 p-3 sm:col-span-1">
                                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                                    {isArabic
                                      ? 'التاريخ'
                                      : 'Date'}
                                  </p>

                                  <p
                                    dir="ltr"
                                    className="mt-2 text-left text-xs font-bold text-slate-700"
                                  >
                                    {formatDate(
                                      order.created_at,
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 border-t border-slate-100 pt-4">
                                <Link
                                  to={`/commande/${order.order_number}`}
                                  className="flex h-11 w-full items-center justify-center rounded-[13px] bg-slate-950 px-5 text-sm font-black text-white sm:ml-auto sm:w-fit"
                                >
                                  {isArabic
                                    ? 'متابعة الطلب'
                                    : 'Suivre la commande'}
                                </Link>
                              </div>
                            </div>
                          </article>
                        )
                      },
                    )}
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-blue-50 text-2xl">
                      🛍️
                    </div>

                    <p className="mt-4 font-black text-slate-700">
                      {isArabic
                        ? 'لا توجد طلبات حتى الآن'
                        : 'Aucune commande pour le moment'}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {isArabic
                        ? 'اختر خدمة رقمية وابدأ أول طلب لك.'
                        : 'Choisissez un service numérique et passez votre première commande.'}
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
            </section>
          </div>
        </div>
      </Container>

      {reviewOrder && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 sm:max-w-lg sm:rounded-[28px]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
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
                aria-label={
                  isArabic
                    ? 'إغلاق'
                    : 'Fermer'
                }
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
                      onClick={() =>
                        setReviewRating(
                          star,
                        )
                      }
                      disabled={
                        isSubmittingReview
                      }
                      className={[
                        'text-3xl transition hover:scale-110',
                        star <=
                        reviewRating
                          ? 'text-amber-400'
                          : 'text-slate-200',
                      ].join(
                        ' ',
                      )}
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

            <label className="mt-5 block">
              <span className="text-sm font-black text-slate-700">
                {isArabic
                  ? 'تعليقك'
                  : 'Votre commentaire'}
              </span>

              <textarea
                rows={4}
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
                    : 'Partagez votre expérience avec ce service...'
                }
                className="mt-2 w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
              />
            </label>

            {reviewError && (
              <div className="mt-4 rounded-[14px] border border-rose-100 bg-rose-50 p-3">
                <p className="text-sm font-bold text-rose-700">
                  {
                    reviewError
                  }
                </p>
              </div>
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
                className="h-12 rounded-xl border border-slate-200 font-black text-slate-700 disabled:opacity-50"
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
                  aria-label={
                    isArabic
                      ? 'إغلاق'
                      : 'Fermer'
                  }
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
                        onClick={() =>
                          setStoreReviewRating(
                            star,
                          )
                        }
                        disabled={
                          isSubmittingStoreReview
                        }
                        className={[
                          'text-3xl transition hover:scale-110',
                          star <=
                          storeReviewRating
                            ? 'text-amber-400'
                            : 'text-slate-200',
                        ].join(
                          ' ',
                        )}
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
                    : 'Votre commentaire sur la boutique'}
                </span>

                <textarea
                  rows={4}
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
                      : 'Que pensez-vous du service, paiement, livraison et support ?'
                  }
                  className="mt-2 w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
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
                  className="h-12 rounded-[14px] border border-slate-200 text-sm font-black text-slate-700 disabled:opacity-50"
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