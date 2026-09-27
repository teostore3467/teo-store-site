import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { supabase } from '../../../lib/supabase'
import { serviceCatalog } from '../../digital-commerce/data/serviceCatalog'
import { esimCountries } from '../../digital-commerce/data/esimCatalog'

type DashboardPeriod = 1 | 7 | 30 | 90

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

type DigitalOrder = {
  id: string
  order_number: string
  customer_name: string
  service_name: string
  total_amount: number
  currency: string
  status: string
  created_at: string
  updated_at: string
}

type RankingItem = {
  key: string
  name: string
  orders: number
  value: number
}

type ReviewSummary = {
  total: number
  store: number
  product: number
  visible: number
  hidden: number
  newCount: number
  averageVisible: number
}

type ReviewMetricRow = {
  rating: number | string
  is_visible: boolean
  reviewed_at: string | null
}

const EMPTY_REVIEW_SUMMARY: ReviewSummary = {
  total: 0,
  store: 0,
  product: 0,
  visible: 0,
  hidden: 0,
  newCount: 0,
  averageVisible: 0,
}

function normalizeDigitalStatus(
  value: string,
): DigitalOrderStatus {
  if (
    value === 'payment_partial' ||
    value === 'payment_confirmed' ||
    value === 'processing' ||
    value === 'fulfillment_sent' ||
    value === 'disputed' ||
    value === 'completed' ||
    value === 'cancelled' ||
    value === 'refunded'
  ) {
    return value
  }

  return 'payment_review'
}

function percentChange(
  current: number,
  previous: number,
) {
  if (previous === 0) {
    return current > 0
      ? 100
      : 0
  }

  return (
    ((current - previous) /
      previous) *
    100
  )
}

function getStartOfDay(
  value: Date = new Date(),
) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  )
}

function isBetweenDates(
  value: string,
  start: Date,
  end: Date,
) {
  const timestamp =
    new Date(
      value,
    ).getTime()

  return (
    timestamp >=
      start.getTime() &&
    timestamp <
      end.getTime()
  )
}

function AdminDashboardPage() {
  const locale =
    'fr-FR-u-nu-latn'

  const [
    selectedPeriod,
    setSelectedPeriod,
  ] =
    useState<DashboardPeriod>(
      30,
    )

  const [
    digitalOrders,
    setDigitalOrders,
  ] =
    useState<
      DigitalOrder[]
    >([])

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
    useState<
      string | null
    >(null)

  const [
    lastUpdatedAt,
    setLastUpdatedAt,
  ] =
    useState<
      string | null
    >(null)

  const [
    reviewSummary,
    setReviewSummary,
  ] =
    useState<ReviewSummary>(
      EMPTY_REVIEW_SUMMARY,
    )

  const loadDashboard =
    useCallback(
      async (
        refresh =
          false,
      ) => {
        if (refresh) {
          setIsRefreshing(
            true,
          )
        } else {
          setIsLoading(
            true,
          )
        }

        setErrorMessage(
          null,
        )

        const [
          ordersResult,
          storeReviewsResult,
          productReviewsResult,
        ] =
          await Promise.all([
            supabase
              .from(
                'digital_orders',
              )
              .select(`
                id,
                order_number,
                customer_name,
                service_name,
                total_amount,
                currency,
                status,
                created_at,
                updated_at
              `)
              .order(
                'created_at',
                {
                  ascending:
                    false,
                },
              )
              .limit(
                1000,
              ),

            supabase
              .from(
                'store_reviews',
              )
              .select(`
                rating,
                is_visible,
                reviewed_at
              `),

            supabase
              .from(
                'digital_order_reviews',
              )
              .select(`
                rating,
                is_visible,
                reviewed_at
              `),
          ])

        const errors:
          string[] = []

        if (
          ordersResult.error
        ) {
          console.error(
            'Dashboard digital:',
            ordersResult.error,
          )

          errors.push(
            ordersResult
              .error
              .message,
          )
        }

        if (
          storeReviewsResult.error
        ) {
          console.error(
            'Dashboard store reviews:',
            storeReviewsResult.error,
          )

          errors.push(
            storeReviewsResult
              .error
              .message,
          )
        }

        if (
          productReviewsResult.error
        ) {
          console.error(
            'Dashboard product reviews:',
            productReviewsResult.error,
          )

          errors.push(
            productReviewsResult
              .error
              .message,
          )
        }

        setDigitalOrders(
          (
            ordersResult.data ??
            []
          ) as DigitalOrder[],
        )

        const storeRows =
          (
            storeReviewsResult.data ??
            []
          ) as ReviewMetricRow[]

        const productRows =
          (
            productReviewsResult.data ??
            []
          ) as ReviewMetricRow[]

        const allReviews =
          [
            ...storeRows,
            ...productRows,
          ]

        const visibleReviews =
          allReviews.filter(
            (
              review,
            ) =>
              review.is_visible,
          )

        const visibleRatings =
          visibleReviews
            .map(
              (
                review,
              ) =>
                Number(
                  review.rating,
                ),
            )
            .filter(
              (
                rating,
              ) =>
                Number.isFinite(
                  rating,
                ) &&
                rating >=
                  1 &&
                rating <=
                  5,
            )

        const averageVisible =
          visibleRatings.length >
          0
            ? visibleRatings.reduce(
                (
                  total,
                  rating,
                ) =>
                  total +
                  rating,
                0,
              ) /
              visibleRatings.length
            : 0

        setReviewSummary({
          total:
            allReviews.length,

          store:
            storeRows.length,

          product:
            productRows.length,

          visible:
            visibleReviews.length,

          hidden:
            allReviews.length -
            visibleReviews.length,

          newCount:
            allReviews.filter(
              (
                review,
              ) =>
                !review.reviewed_at,
            ).length,

          averageVisible,
        })

        if (
          errors.length >
          0
        ) {
          setErrorMessage(
            errors.join(
              ' · ',
            ),
          )
        }

        setLastUpdatedAt(
          new Date()
            .toISOString(),
        )

        setIsLoading(
          false,
        )

        setIsRefreshing(
          false,
        )
      },
      [],
    )

  useEffect(() => {
    void loadDashboard()

    const digitalChannel =
      supabase
        .channel(
          'admin-dashboard-digital',
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
          () => {
            void loadDashboard(
              true,
            )
          },
        )
        .subscribe()

    const storeReviewsChannel =
      supabase
        .channel(
          'admin-dashboard-store-reviews',
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
            void loadDashboard(
              true,
            )
          },
        )
        .subscribe()

    const productReviewsChannel =
      supabase
        .channel(
          'admin-dashboard-product-reviews',
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
            void loadDashboard(
              true,
            )
          },
        )
        .subscribe()

    const handleFocus =
      () => {
        void loadDashboard(
          true,
        )
      }

    window.addEventListener(
      'focus',
      handleFocus,
    )

    return () => {
      void supabase
        .removeChannel(
          digitalChannel,
        )

      void supabase
        .removeChannel(
          storeReviewsChannel,
        )

      void supabase
        .removeChannel(
          productReviewsChannel,
        )

      window.removeEventListener(
        'focus',
        handleFocus,
      )
    }
  }, [
    loadDashboard,
  ])

  const currentStart =
    useMemo(
      () => {
        const today =
          getStartOfDay()

        const start =
          new Date(
            today,
          )

        start.setDate(
          start.getDate() -
            (
              selectedPeriod -
              1
            ),
        )

        return start
      },
      [
        selectedPeriod,
      ],
    )

  const currentEnd =
    useMemo(
      () => {
        const tomorrow =
          getStartOfDay()

        tomorrow.setDate(
          tomorrow.getDate() +
            1,
        )

        return tomorrow
      },
      [],
    )

  const previousEnd =
    useMemo(
      () =>
        new Date(
          currentStart,
        ),
      [
        currentStart,
      ],
    )

  const previousStart =
    useMemo(
      () => {
        const date =
          new Date(
            previousEnd,
          )

        date.setDate(
          date.getDate() -
            selectedPeriod,
        )

        return date
      },
      [
        previousEnd,
        selectedPeriod,
      ],
    )

  const currentOrders =
    useMemo(
      () =>
        digitalOrders.filter(
          (
            order,
          ) =>
            isBetweenDates(
              order.created_at,
              currentStart,
              currentEnd,
            ),
        ),
      [
        digitalOrders,
        currentStart,
        currentEnd,
      ],
    )

  const previousOrders =
    useMemo(
      () =>
        digitalOrders.filter(
          (
            order,
          ) =>
            isBetweenDates(
              order.created_at,
              previousStart,
              previousEnd,
            ),
        ),
      [
        digitalOrders,
        previousStart,
        previousEnd,
      ],
    )

  const stats =
    useMemo(
      () => {
        const byStatus =
          (
            status:
              DigitalOrderStatus,
          ) =>
            digitalOrders.filter(
              (
                order,
              ) =>
                normalizeDigitalStatus(
                  order.status,
                ) ===
                status,
            )

        const validRevenueStatuses:
          DigitalOrderStatus[] =
          [
            'payment_confirmed',
            'processing',
            'fulfillment_sent',
            'disputed',
            'completed',
          ]

        const revenue =
          currentOrders
            .filter(
              (
                order,
              ) =>
                validRevenueStatuses.includes(
                  normalizeDigitalStatus(
                    order.status,
                  ),
                ),
            )
            .reduce(
              (
                total,
                order,
              ) =>
                total +
                Number(
                  order.total_amount ??
                    0,
                ),
              0,
            )

        const previousRevenue =
          previousOrders
            .filter(
              (
                order,
              ) =>
                validRevenueStatuses.includes(
                  normalizeDigitalStatus(
                    order.status,
                  ),
                ),
            )
            .reduce(
              (
                total,
                order,
              ) =>
                total +
                Number(
                  order.total_amount ??
                    0,
                ),
              0,
            )

        return {
          paymentReview:
            byStatus(
              'payment_review',
            ),

          paymentPartial:
            byStatus(
              'payment_partial',
            ),

          paymentConfirmed:
            byStatus(
              'payment_confirmed',
            ),

          processing:
            byStatus(
              'processing',
            ),

          fulfillmentSent:
            byStatus(
              'fulfillment_sent',
            ),

          disputed:
            byStatus(
              'disputed',
            ),

          completed:
            byStatus(
              'completed',
            ),

          refunded:
            byStatus(
              'refunded',
            ),

          revenue,

          previousRevenue,
        }
      },
      [
        currentOrders,
        previousOrders,
        digitalOrders,
      ],
    )

  const ordersGrowth =
    percentChange(
      currentOrders.length,
      previousOrders.length,
    )

  const revenueGrowth =
    percentChange(
      stats.revenue,
      stats.previousRevenue,
    )

  const averageOrderValue =
    currentOrders.length >
    0
      ? stats.revenue /
        currentOrders.length
      : 0

  const completedCurrent =
    currentOrders.filter(
      (
        order,
      ) =>
        normalizeDigitalStatus(
          order.status,
        ) ===
        'completed',
    ).length

  const completionRate =
    currentOrders.length >
    0
      ? (
          completedCurrent /
          currentOrders.length
        ) *
        100
      : 0

  const pendingPayments =
    stats.paymentReview
      .length +
    stats.paymentPartial
      .length

  const pendingProcessing =
    stats.paymentConfirmed
      .length +
    stats.processing
      .length

  const urgentActions =
    pendingPayments +
    stats.disputed.length

  const recentOrders =
    useMemo(
      () =>
        digitalOrders.slice(
          0,
          8,
        ),
      [
        digitalOrders,
      ],
    )

  const topServices =
    useMemo<
      RankingItem[]
    >(
      () => {
        const map =
          new Map<
            string,
            RankingItem
          >()

        currentOrders.forEach(
          (
            order,
          ) => {
            const existing =
              map.get(
                order.service_name,
              )

            if (existing) {
              existing.orders +=
                1

              existing.value +=
                Number(
                  order.total_amount ??
                    0,
                )

              return
            }

            map.set(
              order.service_name,
              {
                key:
                  order.service_name,

                name:
                  order.service_name,

                orders:
                  1,

                value:
                  Number(
                    order.total_amount ??
                      0,
                  ),
              },
            )
          },
        )

        return [
          ...map.values(),
        ]
          .sort(
            (
              a,
              b,
            ) =>
              b.value -
              a.value,
          )
          .slice(
            0,
            5,
          )
      },
      [
        currentOrders,
      ],
    )

  const totalServices =
    serviceCatalog.length

  const availableServices =
    serviceCatalog.filter(
      (
        service,
      ) =>
        service.availability ===
        'available',
    ).length

  const totalPlans =
    serviceCatalog.reduce(
      (
        total,
        service,
      ) =>
        total +
        service.groups.reduce(
          (
            subtotal,
            group,
          ) =>
            subtotal +
            group.plans.length,
          0,
        ),
      0,
    )

  const totalEsimCountries =
    esimCountries.length

  const totalEsimPlans =
    esimCountries.reduce(
      (
        total,
        country,
      ) =>
        total +
        country.plans.length,
      0,
    )

  const formatNumber =
    (
      value: number,
      maximumFractionDigits =
        0,
    ) =>
      new Intl.NumberFormat(
        locale,
        {
          numberingSystem:
            'latn',

          maximumFractionDigits,
        },
      ).format(
        Number(
          value,
        ),
      )

  const formatAmount =
    (
      value: number,
    ) =>
      `${formatNumber(
        value,
        0,
      )} MRU`

  const formatPercentage =
    (
      value: number,
    ) =>
      new Intl.NumberFormat(
        locale,
        {
          numberingSystem:
            'latn',

          minimumFractionDigits:
            1,

          maximumFractionDigits:
            1,
        },
      ).format(
        value,
      )

  const formatDate =
    (
      value: string,
    ) => {
      try {
        return new Intl
          .DateTimeFormat(
            locale,
            {
              day:
                '2-digit',

              month:
                '2-digit',

              hour:
                '2-digit',

              minute:
                '2-digit',

              numberingSystem:
                'latn',
            },
          )
          .format(
            new Date(
              value,
            ),
          )
      } catch {
        return value
      }
    }

  const formatTime =
    (
      value:
        string | null,
    ) => {
      if (!value) {
        return '—'
      }

      try {
        return new Intl
          .DateTimeFormat(
            locale,
            {
              hour:
                '2-digit',

              minute:
                '2-digit',

              numberingSystem:
                'latn',
            },
          )
          .format(
            new Date(
              value,
            ),
          )
      } catch {
        return '—'
      }
    }

  const getStatusLabel =
    (
      value: string,
    ) => {
      const status =
        normalizeDigitalStatus(
          value,
        )

      const labels:
        Record<
          DigitalOrderStatus,
          {
            fr: string
          }
        > = {
        payment_review: {
          fr:
            'Paiement à vérifier',
        },

        payment_partial: {
          fr:
            'Paiement incomplet',
        },

        payment_confirmed: {
          fr:
            'Paiement confirmé',
        },

        processing: {
          fr:
            'En traitement',
        },

        fulfillment_sent: {
          fr:
            'Service envoyé',
        },

        disputed: {
          fr:
            'Litige',
        },

        completed: {
          fr:
            'Terminée',
        },

        cancelled: {
          fr:
            'Annulée',
        },

        refunded: {
          fr:
            'Remboursée',
        },
      }

      return labels[
        status
      ].fr
    }

  const getStatusClasses =
    (
      value: string,
    ) => {
      const status =
        normalizeDigitalStatus(
          value,
        )

      if (
        status ===
        'completed'
      ) {
        return 'bg-emerald-50 text-emerald-700'
      }

      if (
        status ===
        'disputed'
      ) {
        return 'bg-rose-50 text-rose-700'
      }

      if (
        status ===
          'payment_review' ||
        status ===
          'payment_partial'
      ) {
        return 'bg-amber-50 text-amber-700'
      }

      return 'bg-blue-50 text-blue-700'
    }

  const periods = [
    {
      value:
        1 as DashboardPeriod,

      label:
        "Aujourd'hui",
    },

    {
      value:
        7 as DashboardPeriod,

      label:
        '7 jours',
    },

    {
      value:
        30 as DashboardPeriod,

      label:
        '30 jours',
    },

    {
      value:
        90 as DashboardPeriod,

      label:
        '90 jours',
    },
  ]

  return (
    <div
      dir="ltr"
      className="pb-10"
    >
      <section
        className="relative overflow-hidden rounded-[32px] border border-slate-800/40 p-5 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:p-7 lg:p-8"
        style={{
          background:
            'linear-gradient(135deg,#020617 0%,#0b1738 40%,#172554 68%,#312e81 100%)',
        }}
      >
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-[90px]" />

        <div className="relative">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/75">
                  TEO STORE
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Suivez les commandes, les paiements et les performances des services numériques depuis une seule vue.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[340px]">
              <div className="rounded-[18px] border border-white/10 bg-black/10 p-1.5">
                <div className="grid grid-cols-4 gap-1">
                  {periods.map(
                    (
                      period,
                    ) => (
                      <button
                        key={
                          period.value
                        }
                        type="button"
                        onClick={() =>
                          setSelectedPeriod(
                            period.value,
                          )
                        }
                        className={[
                          'min-h-[40px] rounded-[12px] px-2 text-[9px] font-black transition sm:text-[10px]',
                          selectedPeriod ===
                          period.value
                            ? 'bg-white text-slate-950'
                            : 'text-white/65 hover:bg-white/[0.08] hover:text-white',
                        ].join(
                          ' ',
                        )}
                      >
                        {
                          period.label
                        }
                      </button>
                    ),
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadDashboard(
                    true,
                  )
                }
                disabled={
                  isRefreshing
                }
                className="flex h-11 items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.06] px-4 text-[10px] font-black text-white/80"
              >
                {isRefreshing
                  ? 'Actualisation...'
                  : `Mis à jour à ${formatTime(
                      lastUpdatedAt,
                    )}`}
              </button>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.065] p-5">
              <p className="text-[9px] font-black uppercase text-white/45">
                Commandes
              </p>

              <p
                dir="ltr"
                className="mt-3 text-3xl font-black"
              >
                {formatNumber(
                  currentOrders.length,
                )}
              </p>

              <p
                dir="ltr"
                className="mt-2 text-[10px] text-white/50"
              >
                {ordersGrowth >=
                0
                  ? '+'
                  : ''}
                {formatPercentage(
                  ordersGrowth,
                )}
                %
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.065] p-5">
              <p className="text-[9px] font-black uppercase text-white/45">
                Revenus
              </p>

              <p
                dir="ltr"
                className="mt-3 text-xl font-black sm:text-2xl"
              >
                {formatAmount(
                  stats.revenue,
                )}
              </p>

              <p
                dir="ltr"
                className="mt-2 text-[10px] text-white/50"
              >
                {revenueGrowth >=
                0
                  ? '+'
                  : ''}
                {formatPercentage(
                  revenueGrowth,
                )}
                %
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.065] p-5">
              <p className="text-[9px] font-black uppercase text-white/45">
                Panier moyen
              </p>

              <p
                dir="ltr"
                className="mt-3 text-xl font-black sm:text-2xl"
              >
                {formatAmount(
                  averageOrderValue,
                )}
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.065] p-5">
              <p className="text-[9px] font-black uppercase text-white/45">
                Actions urgentes
              </p>

              <p
                dir="ltr"
                className="mt-3 text-3xl font-black"
              >
                {formatNumber(
                  urgentActions,
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="mt-5 rounded-[20px] border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-black text-rose-700">
            Certaines données n&apos;ont pas pu être chargées.
          </p>

          <p
            dir="ltr"
            className="mt-2 text-[10px] text-rose-500"
          >
            {
              errorMessage
            }
          </p>
        </div>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          to="/admin/payments"
          className="rounded-[22px] border border-amber-100 bg-white p-5 shadow-sm"
        >
          <p className="text-[9px] font-black uppercase text-amber-600">
            Paiements à vérifier
          </p>

          <p
            dir="ltr"
            className="mt-3 text-3xl font-black text-slate-950"
          >
            {formatNumber(
              pendingPayments,
            )}
          </p>
        </Link>

        <Link
          to="/admin/orders"
          className="rounded-[22px] border border-blue-100 bg-white p-5 shadow-sm"
        >
          <p className="text-[9px] font-black uppercase text-blue-600">
            À traiter
          </p>

          <p
            dir="ltr"
            className="mt-3 text-3xl font-black text-slate-950"
          >
            {formatNumber(
              pendingProcessing,
            )}
          </p>
        </Link>

        <Link
          to="/admin/orders"
          className="rounded-[22px] border border-rose-100 bg-white p-5 shadow-sm"
        >
          <p className="text-[9px] font-black uppercase text-rose-600">
            Litiges
          </p>

          <p
            dir="ltr"
            className="mt-3 text-3xl font-black text-slate-950"
          >
            {formatNumber(
              stats.disputed
                .length,
            )}
          </p>
        </Link>

        <div className="rounded-[22px] border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-[9px] font-black uppercase text-emerald-600">
            Taux de finalisation
          </p>

          <p
            dir="ltr"
            className="mt-3 text-3xl font-black text-slate-950"
          >
            {formatPercentage(
              completionRate,
            )}
            %
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600">
              Avis clients
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-950">
              Réputation TEO STORE
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Résumé global des avis boutique et produits.
            </p>
          </div>

          <Link
            to="/admin/store-reviews"
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-amber-50 px-4 text-[9px] font-black text-amber-700 transition hover:bg-amber-100"
          >
            Gérer les avis
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Link
            to="/admin/store-reviews"
            className="rounded-[17px] border border-slate-100 bg-slate-50/70 p-4 transition hover:border-amber-200"
          >
            <p className="text-[8px] font-black uppercase text-slate-400">
              Total
            </p>

            <p
              dir="ltr"
              className="mt-2 text-2xl font-black text-slate-950"
            >
              {formatNumber(
                reviewSummary.total,
              )}
            </p>

            <p className="mt-1 text-[8px] text-slate-400">
              <span dir="ltr">
                {formatNumber(
                  reviewSummary.store,
                )}
              </span>{' '}
              boutique ·{' '}
              <span dir="ltr">
                {formatNumber(
                  reviewSummary.product,
                )}
              </span>{' '}
              produits
            </p>
          </Link>

          <Link
            to="/admin/store-reviews"
            className="rounded-[17px] border border-amber-100 bg-amber-50/50 p-4 transition hover:border-amber-200"
          >
            <p className="text-[8px] font-black uppercase text-amber-600">
              Note moyenne
            </p>

            <div className="mt-2 flex items-center gap-2">
              <p
                dir="ltr"
                className="text-2xl font-black text-slate-950"
              >
                {formatNumber(
                  reviewSummary.averageVisible,
                  1,
                )}
              </p>

              <span className="text-lg text-amber-400">
                ★
              </span>
            </div>

            <p className="mt-1 text-[8px] text-slate-400">
              Avis visibles uniquement
            </p>
          </Link>

          <Link
            to="/admin/store-reviews"
            className="rounded-[17px] border border-emerald-100 bg-emerald-50/40 p-4 transition hover:border-emerald-200"
          >
            <p className="text-[8px] font-black uppercase text-emerald-600">
              Visibles
            </p>

            <p
              dir="ltr"
              className="mt-2 text-2xl font-black text-slate-950"
            >
              {formatNumber(
                reviewSummary.visible,
              )}
            </p>
          </Link>

          <Link
            to="/admin/store-reviews"
            className="rounded-[17px] border border-slate-200 bg-slate-50/40 p-4 transition hover:border-slate-300"
          >
            <p className="text-[8px] font-black uppercase text-slate-500">
              Masqués
            </p>

            <p
              dir="ltr"
              className="mt-2 text-2xl font-black text-slate-950"
            >
              {formatNumber(
                reviewSummary.hidden,
              )}
            </p>
          </Link>

          <Link
            to="/admin/store-reviews"
            className="col-span-2 rounded-[17px] border border-rose-100 bg-rose-50/50 p-4 transition hover:border-rose-200 lg:col-span-1"
          >
            <p className="text-[8px] font-black uppercase text-rose-600">
              Nouveaux avis
            </p>

            <p
              dir="ltr"
              className="mt-2 text-2xl font-black text-slate-950"
            >
              {formatNumber(
                reviewSummary.newCount,
              )}
            </p>

            <p className="mt-1 text-[8px] text-slate-400">
              À consulter
            </p>
          </Link>
        </div>
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                Activité récente
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-950">
                Dernières commandes
              </h2>
            </div>

            <Link
              to="/admin/orders"
              className="rounded-xl bg-blue-50 px-3 py-2 text-[9px] font-black text-blue-700"
            >
              Tout voir
            </Link>
          </div>

          <div className="mt-5 space-y-2">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Chargement...
              </div>
            ) : recentOrders.length >
              0 ? (
              recentOrders.map(
                (
                  order,
                ) => (
                  <Link
                    key={
                      order.id
                    }
                    to="/admin/orders"
                    className="flex flex-col gap-3 rounded-[17px] border border-slate-100 p-4 transition hover:border-blue-100 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-xs font-black text-slate-950">
                          {
                            order.service_name
                          }
                        </p>

                        <span
                          className={[
                            'rounded-full px-2 py-1 text-[7px] font-black',
                            getStatusClasses(
                              order.status,
                            ),
                          ].join(
                            ' ',
                          )}
                        >
                          {getStatusLabel(
                            order.status,
                          )}
                        </span>
                      </div>

                      <p
                        dir="ltr"
                        className="mt-1 text-left text-[9px] text-slate-400"
                      >
                        {
                          order.order_number
                        }
                        {' · '}
                        {
                          order.customer_name
                        }
                      </p>

                      <p
                        dir="ltr"
                        className="mt-1 text-left text-[8px] text-slate-300"
                      >
                        {formatDate(
                          order.created_at,
                        )}
                      </p>
                    </div>

                    <p
                      dir="ltr"
                      className="text-xs font-black text-slate-950"
                    >
                      {formatAmount(
                        order.total_amount,
                      )}
                    </p>
                  </Link>
                ),
              )
            ) : (
              <div className="rounded-[17px] border border-dashed border-slate-200 bg-slate-50 p-7 text-center">
                <p className="text-xs font-black text-slate-500">
                  Aucune commande
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-600">
            Plateforme
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-950">
            État de l&apos;écosystème
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              to="/admin/services"
              className="rounded-[17px] border border-blue-100 bg-blue-50/40 p-4"
            >
              <p className="text-[8px] font-black uppercase text-blue-600">
                Services
              </p>

              <p
                dir="ltr"
                className="mt-2 text-2xl font-black text-slate-950"
              >
                {formatNumber(
                  totalServices,
                )}
              </p>

              <p className="mt-1 text-[8px] text-slate-400">
                <span dir="ltr">
                  {formatNumber(
                    availableServices,
                  )}
                </span>{' '}
                disponibles
              </p>
            </Link>

            <Link
              to="/admin/plans"
              className="rounded-[17px] border border-indigo-100 bg-indigo-50/40 p-4"
            >
              <p className="text-[8px] font-black uppercase text-indigo-600">
                Plans
              </p>

              <p
                dir="ltr"
                className="mt-2 text-2xl font-black text-slate-950"
              >
                {formatNumber(
                  totalPlans,
                )}
              </p>
            </Link>

            <Link
              to="/admin/esim"
              className="rounded-[17px] border border-violet-100 bg-violet-50/40 p-4"
            >
              <p className="text-[8px] font-black uppercase text-violet-600">
                Pays eSIM
              </p>

              <p
                dir="ltr"
                className="mt-2 text-2xl font-black text-slate-950"
              >
                {formatNumber(
                  totalEsimCountries,
                )}
              </p>
            </Link>

            <Link
              to="/admin/esim"
              className="rounded-[17px] border border-fuchsia-100 bg-fuchsia-50/40 p-4"
            >
              <p className="text-[8px] font-black uppercase text-fuchsia-600">
                Plans eSIM
              </p>

              <p
                dir="ltr"
                className="mt-2 text-2xl font-black text-slate-950"
              >
                {formatNumber(
                  totalEsimPlans,
                )}
              </p>
            </Link>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
              Performance
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-950">
              Services les plus performants
            </h2>
          </div>

          <Link
            to="/admin/services"
            className="rounded-xl bg-blue-50 px-3 py-2 text-[9px] font-black text-blue-700"
          >
            Services
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {topServices.length >
          0 ? (
            topServices.map(
              (
                item,
                index,
              ) => (
                <div
                  key={
                    item.key
                  }
                  className="flex items-center justify-between gap-4 rounded-[17px] border border-slate-100 bg-slate-50/60 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      dir="ltr"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-blue-600 text-xs font-black text-white"
                    >
                      {formatNumber(
                        index +
                          1,
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-900">
                        {
                          item.name
                        }
                      </p>

                      <p className="mt-1 text-[9px] text-slate-400">
                        <span dir="ltr">
                          {formatNumber(
                            item.orders,
                          )}
                        </span>{' '}
                        commande(s)
                      </p>
                    </div>
                  </div>

                  <p
                    dir="ltr"
                    className="shrink-0 text-xs font-black text-slate-950"
                  >
                    {formatAmount(
                      item.value,
                    )}
                  </p>
                </div>
              ),
            )
          ) : (
            <div className="rounded-[17px] border border-dashed border-slate-200 bg-slate-50 p-7 text-center">
              <p className="text-xs font-black text-slate-500">
                Aucune donnée pour cette période
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-6">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
          Accès rapide
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Link
            to="/admin/orders"
            className="rounded-[19px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200"
          >
            <p className="text-sm font-black text-slate-950">
              Commandes
            </p>
          </Link>

          <Link
            to="/admin/payments"
            className="rounded-[19px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200"
          >
            <p className="text-sm font-black text-slate-950">
              Paiements
            </p>
          </Link>

          <Link
            to="/admin/services"
            className="rounded-[19px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200"
          >
            <p className="text-sm font-black text-slate-950">
              Services numériques
            </p>
          </Link>

          <Link
            to="/admin/store-reviews"
            className="rounded-[19px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-200"
          >
            <p className="text-sm font-black text-slate-950">
              Avis clients
            </p>
          </Link>

          <Link
            to="/admin/settings"
            className="rounded-[19px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200"
          >
            <p className="text-sm font-black text-slate-950">
              Paramètres
            </p>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboardPage