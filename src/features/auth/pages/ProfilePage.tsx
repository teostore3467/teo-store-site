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
  fullName: string
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
    orders,
    setOrders,
  ] = useState<DigitalOrderRow[]>(
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
  ] = useState(true)

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false)

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
  ] = useState(false)

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
  ] = useState(5)

  const [
    reviewComment,
    setReviewComment,
  ] = useState('')

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
  ] = useState(false)

  const [
    storeReviewOpen,
    setStoreReviewOpen,
  ] = useState(false)

  const [
    storeReviewRating,
    setStoreReviewRating,
  ] = useState(5)

  const [
    storeReviewComment,
    setStoreReviewComment,
  ] = useState('')

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
  ] = useState(false)

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
                ascending: false,
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
                ascending: false,
              },
            )
            .limit(60)

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
                ascending: false,
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
                ascending: true,
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

  const loadAllCustomerData =
    useCallback(
      async (
        userId: string,
        showRefresh = false,
      ) => {
        if (showRefresh) {
          setIsRefreshing(true)
        }

        try {
          await Promise.all([
            loadOrders(userId),
            loadNotifications(userId),
            loadReviews(userId),
            loadStoreReviews(userId),
          ])

          setErrorMessage(null)
        } catch {
          setErrorMessage(
            isArabic
              ? 'تعذر تحديث بعض بيانات حسابك.'
              : 'Impossible de mettre à jour certaines données de votre compte.',
          )
        } finally {
          if (showRefresh) {
            setIsRefreshing(false)
          }
        }
      },
      [
        isArabic,
        loadNotifications,
        loadOrders,
        loadReviews,
        loadStoreReviews,
      ],
    )

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent,
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
  }, [])

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key !== 'Escape'
      ) {
        return
      }

      setNotificationsOpen(
        false,
      )

      if (
        !isSubmittingReview
      ) {
        setReviewOrder(null)
        setReviewError(null)
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
  }, [
    isSubmittingReview,
    isSubmittingStoreReview,
  ])

  useEffect(() => {
    let mounted = true

    let currentUserId:
      string | null = null

    const loadProfile =
      async () => {
        setIsLoading(true)
        setErrorMessage(null)

        const {
          data: userData,
          error: userError,
        } =
          await supabase.auth
            .getUser()

        if (!mounted) {
          return
        }

        if (
          userError ||
          !userData.user
        ) {
          navigate(
            '/connexion?redirect=%2Fprofil',
            {
              replace: true,
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

        setUser({
          id:
            authUser.id,

          email:
            authUser.email ??
            '',

          fullName:
            typeof metadataName ===
              'string' &&
            metadataName
              .trim()
              .length > 0
              ? metadataName.trim()
              : authUser.email
                  ?.split('@')[0] ??
                (isArabic
                  ? 'حسابي'
                  : 'Mon compte'),
        })

        await loadAllCustomerData(
          authUser.id,
        )

        if (mounted) {
          setIsLoading(false)
        }
      }

    void loadProfile()

    const {
      data: authListener,
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

            if (
              !session?.user
            ) {
              navigate(
                '/connexion?redirect=%2Fprofil',
                {
                  replace: true,
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
            event: '*',
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
            event: '*',
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
            event: '*',
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
            event: '*',
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
      mounted = false

      authListener
        .subscription
        .unsubscribe()

      void supabase.removeChannel(
        ordersChannel,
      )

      void supabase.removeChannel(
        notificationsChannel,
      )

      void supabase.removeChannel(
        reviewsChannel,
      )

      void supabase.removeChannel(
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
  }, [
    isArabic,
    loadAllCustomerData,
    loadNotifications,
    loadOrders,
    loadReviews,
    loadStoreReviews,
    navigate,
  ])

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
          completedOrdersCount < 5
        ) {
          return null
        }

        const maxMilestone =
          Math.floor(
            completedOrdersCount /
              5,
          ) * 5

        for (
          let milestone = 5;
          milestone <=
          maxMilestone;
          milestone += 5
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
      setReviewOrder(order)
      setReviewRating(5)
      setReviewComment('')
      setReviewError(null)
    }

  const closeReviewModal =
    () => {
      if (
        isSubmittingReview
      ) {
        return
      }

      setReviewOrder(null)
      setReviewRating(5)
      setReviewComment('')
      setReviewError(null)
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

      setReviewError(null)

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
        loadReviews(user.id),
        loadNotifications(
          user.id,
        ),
      ])

      setIsSubmittingReview(
        false,
      )

      setReviewOrder(null)
      setReviewRating(5)
      setReviewComment('')
      setReviewError(null)
    }

  const openStoreReviewModal =
    () => {
      if (
        pendingStoreReviewMilestone ===
        null
      ) {
        return
      }

      setStoreReviewRating(5)
      setStoreReviewComment('')
      setStoreReviewError(null)
      setStoreReviewOpen(true)
    }

  const closeStoreReviewModal =
    () => {
      if (
        isSubmittingStoreReview
      ) {
        return
      }

      setStoreReviewOpen(false)
      setStoreReviewRating(5)
      setStoreReviewComment('')
      setStoreReviewError(null)
    }

  const handleSubmitStoreReview =
    async () => {
      if (
        !user ||
        pendingStoreReviewMilestone ===
          null ||
        storeReviewRating < 1 ||
        storeReviewRating > 5 ||
        isSubmittingStoreReview
      ) {
        return
      }

      setIsSubmittingStoreReview(
        true,
      )

      setStoreReviewError(null)

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

      setStoreReviewOpen(false)
      setStoreReviewRating(5)
      setStoreReviewComment('')
      setStoreReviewError(null)

      setIsSubmittingStoreReview(
        false,
      )
    }

  const getDigitalStatusLabel =
    (
      statusValue: string,
    ) => {
      const status =
        normalizeDigitalStatus(
          statusValue,
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
      statusValue: string,
    ) => {
      const status =
        normalizeDigitalStatus(
          statusValue,
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
      if (!isArabic) {
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
      if (!isArabic) {
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
      value: string,
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
          new Date(value),
        )
      } catch {
        return value
      }
    }

  const formatAmount =
    (
      amount: number,
      currency: string,
    ) => {
      const normalizedAmount =
        new Intl.NumberFormat(
          'fr-FR-u-nu-latn',
          {
            numberingSystem:
              'latn',
          },
        ).format(
          Number(amount),
        )

      return formatCurrencyText(
        `${normalizedAmount} ${currency}`,
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

  if (isLoading) {
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

  if (!user) {
    return null
  }

  return (
    <main
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
      className="min-h-screen bg-[#f7f9fc] py-8 sm:py-10 lg:py-12"
    >
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
            <aside className="h-fit rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)] lg:sticky lg:top-28">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black uppercase text-white shadow-sm">
                  {user.fullName
                    .charAt(0)
                    .toUpperCase()}
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
                    ? 'تابع خدماتك الرقمية وطلباتك وإشعاراتك وتقييماتك.'
                    : 'Suivez vos services numériques, commandes, notifications et avis.'}
                </p>
              </div>

              {pendingReviewOrders.length >
                0 && (
                <div className="mt-5 rounded-[18px] border border-amber-100 bg-amber-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-amber-800">
                        {isArabic
                          ? 'تقييمات معلقة'
                          : 'Avis en attente'}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        {isArabic
                          ? 'لديك خدمات مكتملة لم تقيّمها بعد.'
                          : 'Des services terminés attendent encore votre avis.'}
                      </p>
                    </div>

                    <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-amber-500 px-2 text-sm font-black text-white">
                      {
                        pendingReviewOrders.length
                      }
                    </div>
                  </div>
                </div>
              )}

              {pendingStoreReviewMilestone !==
                null && (
                <div className="mt-4 rounded-[18px] border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm text-white">
                      ★
                    </div>

                    <div>
                      <p className="text-sm font-black text-blue-900">
                        {isArabic
                          ? 'قيّم TEO STORE'
                          : 'Évaluez TEO STORE'}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-700">
                        {isArabic
                          ? `لقد أكملت ${pendingStoreReviewMilestone} طلبات. شاركنا رأيك في المتجر.`
                          : `Vous avez atteint ${pendingStoreReviewMilestone} commandes terminées.`}
                      </p>

                      <button
                        type="button"
                        onClick={
                          openStoreReviewModal
                        }
                        className="mt-3 h-10 rounded-xl bg-blue-600 px-4 text-xs font-black text-white transition hover:bg-blue-500"
                      >
                        {isArabic
                          ? 'تقييم المتجر'
                          : 'Évaluer la boutique'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <Link
                to="/services-numeriques"
                className="mt-5 flex h-11 items-center justify-center rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 px-3 text-center text-sm font-black text-white transition hover:from-blue-500 hover:to-indigo-500"
              >
                {isArabic
                  ? 'استكشاف الخدمات'
                  : 'Explorer les services'}
              </Link>
            </aside>

            <section>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                    TEO STORE
                  </p>

                  <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                    {isArabic
                      ? 'ملفي الشخصي'
                      : 'Mon profil'}
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500">
                    {isArabic
                      ? 'طلباتك الرقمية وإشعاراتك وتقييماتك في مكان واحد.'
                      : 'Vos commandes numériques, notifications et évaluations depuis un seul espace.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div
                    ref={
                      notificationsRef
                    }
                    className="relative"
                  >
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
                      className={[
                        'relative flex h-11 w-11 items-center justify-center rounded-[14px] border bg-white transition',
                        notificationsOpen
                          ? 'border-blue-300 bg-blue-50 text-blue-600'
                          : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600',
                      ].join(
                        ' ',
                      )}
                      aria-label={
                        isArabic
                          ? 'الإشعارات'
                          : 'Notifications'
                      }
                    >
                      🔔

                      {unreadNotifications.length >
                        0 && (
                        <span
                          dir="ltr"
                          className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-black text-white"
                        >
                          {unreadNotifications.length >
                          99
                            ? '99+'
                            : unreadNotifications.length}
                        </span>
                      )}
                    </button>

                    {notificationsOpen && (
                      <div
                        className={[
                          'absolute top-[calc(100%+10px)] z-[80] w-[min(390px,calc(100vw-32px))] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]',
                          isArabic
                            ? 'left-0'
                            : 'right-0',
                        ].join(
                          ' ',
                        )}
                      >
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

                  <button
                    type="button"
                    onClick={
                      handleRefresh
                    }
                    disabled={
                      isRefreshing
                    }
                    className="flex h-11 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-600"
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

                  <div className="rounded-[14px] border border-slate-200 bg-white px-4 py-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">
                      {isArabic
                        ? 'الطلبات'
                        : 'Commandes'}
                    </p>

                    <p className="text-xl font-black text-slate-950">
                      {
                        orders.length
                      }
                    </p>
                  </div>
                </div>
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

              <section className="mt-6 overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-300">
                    TEO STORE
                  </p>

                  <h2 className="mt-2 text-xl font-black">
                    {isArabic
                      ? 'تقييم المتجر'
                      : 'Avis sur la boutique'}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {isArabic
                      ? `لديك ${completedOrdersCount} طلبات مكتملة. يظهر تقييم جديد عند كل 5 طلبات.`
                      : `Vous avez ${completedOrdersCount} commandes terminées. Un nouvel avis est proposé toutes les 5 commandes.`}
                  </p>
                </div>

                <div className="p-5">
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
                          ? 'نود معرفة تقييمك لتجربة TEO STORE بشكل عام.'
                          : 'Nous aimerions connaître votre avis général sur TEO STORE.'}
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
                          ? 'لا يوجد تقييم مطلوب الآن'
                          : 'Aucun avis requis maintenant'}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {isArabic
                          ? `يتبقى ${ordersUntilNextStoreReview} طلبات مكتملة حتى التقييم القادم.`
                          : `Il reste ${ordersUntilNextStoreReview} commandes terminées avant le prochain avis.`}
                      </p>
                    </div>
                  )}

                  {storeReviews.length >
                    0 && (
                    <div className="mt-5">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        {isArabic
                          ? 'تقييماتك السابقة'
                          : 'Vos avis précédents'}
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
                                <div className="flex items-center justify-between">
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
                    </div>
                  )}
                </div>
              </section>

              {pendingReviewOrders.length >
                0 && (
                <section className="mt-6 overflow-hidden rounded-[24px] border border-amber-200 bg-white">
                  <div className="border-b border-amber-100 bg-amber-50 px-5 py-4">
                    <h2 className="font-black text-slate-950">
                      {isArabic
                        ? 'تقييمات الخدمات المعلقة'
                        : 'Avis produits en attente'}
                    </h2>
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
                          className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
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
                </section>
              )}

              <section className="mt-7">
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
                            className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
                          >
                            <div className="p-5">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p
                                    dir="ltr"
                                    className="text-xs font-black text-blue-600"
                                  >
                                    {
                                      order.order_number
                                    }
                                  </p>

                                  <h3 className="mt-2 text-base font-black text-slate-950">
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

                              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                                <div className="rounded-[15px] bg-slate-50 p-3">
                                  <p className="text-xs font-black text-slate-400">
                                    {isArabic
                                      ? 'المبلغ'
                                      : 'Montant'}
                                  </p>

                                  <p
                                    dir="ltr"
                                    className="mt-2 text-sm font-black text-slate-900"
                                  >
                                    {formatAmount(
                                      order.total_amount,
                                      order.currency,
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-[15px] bg-slate-50 p-3">
                                  <p className="text-xs font-black text-slate-400">
                                    {isArabic
                                      ? 'الدفع'
                                      : 'Paiement'}
                                  </p>

                                  <p className="mt-2 text-sm font-black text-slate-900">
                                    {order.payment_method_name ??
                                      '—'}
                                  </p>
                                </div>

                                <div className="rounded-[15px] bg-slate-50 p-3">
                                  <p className="text-xs font-black text-slate-400">
                                    {isArabic
                                      ? 'التاريخ'
                                      : 'Date'}
                                  </p>

                                  <p
                                    dir="ltr"
                                    className="mt-2 text-xs font-bold text-slate-700"
                                  >
                                    {formatDate(
                                      order.created_at,
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-5 flex justify-end border-t border-slate-100 pt-5">
                                <Link
                                  to={`/commande/${order.order_number}`}
                                  className="inline-flex h-11 items-center justify-center rounded-[13px] bg-slate-950 px-5 text-sm font-black text-white"
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
                    <p className="font-black text-slate-600">
                      {isArabic
                        ? 'لا توجد طلبات حتى الآن'
                        : 'Aucune commande pour le moment'}
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
          <div className="w-full rounded-t-[28px] bg-white p-5 sm:max-w-lg sm:rounded-[28px]">
            <div className="flex items-start justify-between">
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
                className="h-10 w-10 rounded-full bg-slate-100 text-xl font-black"
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
                      className={[
                        'text-3xl',
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
            <div className="w-full rounded-t-[28px] bg-white p-5 sm:max-w-lg sm:rounded-[28px]">
              <div className="flex items-start justify-between">
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
                  className="h-10 w-10 rounded-full bg-slate-100 text-xl font-black"
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