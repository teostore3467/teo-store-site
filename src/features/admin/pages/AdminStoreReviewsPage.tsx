import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'

type StoreReviewRow = {
  id: string
  user_id: string
  milestone: number
  completed_orders_count: number
  rating: number
  comment: string | null
  is_visible: boolean
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

type ProductReviewRow = {
  id: string
  order_id: string
  order_number: string
  user_id: string | null
  rating: number
  comment: string | null
  is_visible: boolean
  reviewed_at: string | null
  created_at: string
  updated_at: string
  service_slug: string
  service_name: string
}

type ReviewTypeFilter =
  | 'all'
  | 'store'
  | 'product'

type VisibilityFilter =
  | 'all'
  | 'visible'
  | 'hidden'

type RatingFilter =
  | 'all'
  | '5'
  | '4'
  | '3'
  | '2'
  | '1'

type UnifiedReview =
  | {
      type: 'store'
      id: string
      rating: number
      comment: string | null
      is_visible: boolean
      reviewed_at: string | null
      created_at: string
      updated_at: string
      storeReview: StoreReviewRow
      productReview: null
    }
  | {
      type: 'product'
      id: string
      rating: number
      comment: string | null
      is_visible: boolean
      reviewed_at: string | null
      created_at: string
      updated_at: string
      storeReview: null
      productReview: ProductReviewRow
    }

function AdminStoreReviewsPage() {
  const {
    language,
  } = useLanguage()

  const isArabic =
    language === 'ar'

  const [
    storeReviews,
    setStoreReviews,
  ] =
    useState<StoreReviewRow[]>(
      [],
    )

  const [
    productReviews,
    setProductReviews,
  ] =
    useState<ProductReviewRow[]>(
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
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    )

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('')

  const [
    reviewTypeFilter,
    setReviewTypeFilter,
  ] =
    useState<ReviewTypeFilter>(
      'all',
    )

  const [
    visibilityFilter,
    setVisibilityFilter,
  ] =
    useState<VisibilityFilter>(
      'all',
    )

  const [
    ratingFilter,
    setRatingFilter,
  ] =
    useState<RatingFilter>(
      'all',
    )

  const [
    processingKey,
    setProcessingKey,
  ] =
    useState<string | null>(
      null,
    )

  const markStoreReviewsAsReviewed =
    useCallback(
      async (
        rows:
          StoreReviewRow[],
      ) => {
        const ids =
          rows
            .filter(
              (
                review:
                  StoreReviewRow,
              ) =>
                !review.reviewed_at,
            )
            .map(
              (
                review:
                  StoreReviewRow,
              ) =>
                review.id,
            )

        if (
          ids.length === 0
        ) {
          return
        }

        const reviewedAt =
          new Date()
            .toISOString()

        const {
          error,
        } =
          await supabase
            .from(
              'store_reviews',
            )
            .update({
              reviewed_at:
                reviewedAt,
            })
            .in(
              'id',
              ids,
            )

        if (error) {
          console.error(
            'Unable to mark store reviews as reviewed:',
            error,
          )

          return
        }

        setStoreReviews(
          (
            current:
              StoreReviewRow[],
          ) =>
            current.map(
              (
                review:
                  StoreReviewRow,
              ) =>
                ids.includes(
                  review.id,
                )
                  ? {
                      ...review,
                      reviewed_at:
                        reviewedAt,
                    }
                  : review,
            ),
        )
      },
      [],
    )

  const markProductReviewsAsReviewed =
    useCallback(
      async (
        rows:
          ProductReviewRow[],
      ) => {
        const ids =
          rows
            .filter(
              (
                review:
                  ProductReviewRow,
              ) =>
                !review.reviewed_at,
            )
            .map(
              (
                review:
                  ProductReviewRow,
              ) =>
                review.id,
            )

        if (
          ids.length === 0
        ) {
          return
        }

        const reviewedAt =
          new Date()
            .toISOString()

        const {
          error,
        } =
          await supabase
            .from(
              'digital_order_reviews',
            )
            .update({
              reviewed_at:
                reviewedAt,
            })
            .in(
              'id',
              ids,
            )

        if (error) {
          console.error(
            'Unable to mark product reviews as reviewed:',
            error,
          )

          return
        }

        setProductReviews(
          (
            current:
              ProductReviewRow[],
          ) =>
            current.map(
              (
                review:
                  ProductReviewRow,
              ) =>
                ids.includes(
                  review.id,
                )
                  ? {
                      ...review,
                      reviewed_at:
                        reviewedAt,
                    }
                  : review,
            ),
        )
      },
      [],
    )

  const loadReviews =
    useCallback(
      async (
        options?: {
          initial?: boolean
          refresh?: boolean
        },
      ) => {
        const initial =
          options?.initial ===
          true

        const refresh =
          options?.refresh ===
          true

        if (initial) {
          setIsLoading(true)
        }

        if (refresh) {
          setIsRefreshing(true)
        }

        setErrorMessage(null)

        try {
          const [
            storeResult,
            productResult,
          ] =
            await Promise.all([
              supabase
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
                  is_visible,
                  reviewed_at,
                  created_at,
                  updated_at
                `)
                .order(
                  'created_at',
                  {
                    ascending:
                      false,
                  },
                ),

              supabase
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
                  is_visible,
                  reviewed_at,
                  created_at,
                  updated_at,
                  digital_orders(
                    service_slug,
                    service_name
                  )
                `)
                .order(
                  'created_at',
                  {
                    ascending:
                      false,
                  },
                ),
            ])

          if (
            storeResult.error
          ) {
            throw storeResult.error
          }

          if (
            productResult.error
          ) {
            throw productResult.error
          }

          const nextStoreReviews =
            (storeResult.data ??
              []) as StoreReviewRow[]

          const nextProductReviews =
            (
              productResult.data ??
              []
            ).map(
              (
                review:
                  any,
              ): ProductReviewRow => {
                const relation =
                  Array.isArray(
                    review.digital_orders,
                  )
                    ? review
                        .digital_orders[0]
                    : review.digital_orders

                return {
                  id:
                    review.id,

                  order_id:
                    review.order_id,

                  order_number:
                    review.order_number,

                  user_id:
                    review.user_id ??
                    null,

                  rating:
                    Number(
                      review.rating,
                    ),

                  comment:
                    review.comment ??
                    null,

                  is_visible:
                    review.is_visible !==
                    false,

                  reviewed_at:
                    review.reviewed_at ??
                    null,

                  created_at:
                    review.created_at,

                  updated_at:
                    review.updated_at,

                  service_slug:
                    relation
                      ?.service_slug ??
                    '',

                  service_name:
                    relation
                      ?.service_name ??
                    relation
                      ?.service_slug ??
                    '',
                }
              },
            )

          setStoreReviews(
            nextStoreReviews,
          )

          setProductReviews(
            nextProductReviews,
          )

          void markStoreReviewsAsReviewed(
            nextStoreReviews,
          )

          void markProductReviewsAsReviewed(
            nextProductReviews,
          )
        } catch (error) {
          console.error(
            'Unable to load admin reviews:',
            error,
          )

          setErrorMessage(
            isArabic
              ? 'تعذر تحميل التقييمات.'
              : 'Impossible de charger les avis.',
          )
        } finally {
          if (initial) {
            setIsLoading(false)
          }

          if (refresh) {
            setIsRefreshing(false)
          }
        }
      },
      [
        isArabic,
        markProductReviewsAsReviewed,
        markStoreReviewsAsReviewed,
      ],
    )

  useEffect(() => {
    let active =
      true

    void loadReviews({
      initial: true,
    })

    const storeChannel =
      supabase
        .channel(
          `admin-store-reviews-${Date.now()}`,
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
          () => {
            if (!active) {
              return
            }

            void loadReviews()
          },
        )
        .subscribe()

    const productChannel =
      supabase
        .channel(
          `admin-product-reviews-${Date.now()}`,
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
          () => {
            if (!active) {
              return
            }

            void loadReviews()
          },
        )
        .subscribe()

    const handleFocus =
      () => {
        if (!active) {
          return
        }

        void loadReviews()
      }

    const handleVisibilityChange =
      () => {
        if (
          !active ||
          document.visibilityState !==
            'visible'
        ) {
          return
        }

        void loadReviews()
      }

    window.addEventListener(
      'focus',
      handleFocus,
    )

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    return () => {
      active = false

      window.removeEventListener(
        'focus',
        handleFocus,
      )

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )

      void supabase
        .removeChannel(
          storeChannel,
        )

      void supabase
        .removeChannel(
          productChannel,
        )
    }
  }, [
    loadReviews,
  ])

  useEffect(() => {
    if (!successMessage) {
      return
    }

    const timeout =
      window.setTimeout(
        () => {
          setSuccessMessage(
            null,
          )
        },
        3500,
      )

    return () => {
      window.clearTimeout(
        timeout,
      )
    }
  }, [
    successMessage,
  ])

  const unifiedReviews =
    useMemo(
      (): UnifiedReview[] => {
        const storeItems:
          UnifiedReview[] =
          storeReviews.map(
            (
              review:
                StoreReviewRow,
            ) => ({
              type:
                'store',

              id:
                review.id,

              rating:
                Number(
                  review.rating,
                ),

              comment:
                review.comment,

              is_visible:
                review.is_visible,

              reviewed_at:
                review.reviewed_at,

              created_at:
                review.created_at,

              updated_at:
                review.updated_at,

              storeReview:
                review,

              productReview:
                null,
            }),
          )

        const productItems:
          UnifiedReview[] =
          productReviews.map(
            (
              review:
                ProductReviewRow,
            ) => ({
              type:
                'product',

              id:
                review.id,

              rating:
                Number(
                  review.rating,
                ),

              comment:
                review.comment,

              is_visible:
                review.is_visible,

              reviewed_at:
                review.reviewed_at,

              created_at:
                review.created_at,

              updated_at:
                review.updated_at,

              storeReview:
                null,

              productReview:
                review,
            }),
          )

        return [
          ...storeItems,
          ...productItems,
        ].sort(
          (
            a,
            b,
          ) =>
            new Date(
              b.created_at,
            ).getTime() -
            new Date(
              a.created_at,
            ).getTime(),
        )
      },
      [
        productReviews,
        storeReviews,
      ],
    )

  const stats =
    useMemo(
      () => {
        const valid =
          unifiedReviews.filter(
            (
              review:
                UnifiedReview,
            ) =>
              Number.isFinite(
                review.rating,
              ) &&
              review.rating >=
                1 &&
              review.rating <=
                5,
          )

        const visible =
          valid.filter(
            (
              review:
                UnifiedReview,
            ) =>
              review.is_visible,
          )

        const hidden =
          valid.filter(
            (
              review:
                UnifiedReview,
            ) =>
              !review.is_visible,
          )

        const store =
          valid.filter(
            (
              review:
                UnifiedReview,
            ) =>
              review.type ===
              'store',
          )

        const product =
          valid.filter(
            (
              review:
                UnifiedReview,
            ) =>
              review.type ===
              'product',
          )

        const average =
          visible.length >
          0
            ? visible.reduce(
                (
                  total:
                    number,
                  review:
                    UnifiedReview,
                ) =>
                  total +
                  review.rating,
                0,
              ) /
              visible.length
            : 0

        return {
          total:
            valid.length,

          store:
            store.length,

          product:
            product.length,

          visible:
            visible.length,

          hidden:
            hidden.length,

          average,
        }
      },
      [
        unifiedReviews,
      ],
    )

  const filteredReviews =
    useMemo(
      () => {
        const query =
          searchQuery
            .trim()
            .toLowerCase()

        return unifiedReviews.filter(
          (
            review:
              UnifiedReview,
          ) => {
            const matchesType =
              reviewTypeFilter ===
                'all' ||
              review.type ===
                reviewTypeFilter

            const matchesVisibility =
              visibilityFilter ===
                'all' ||
              (
                visibilityFilter ===
                  'visible' &&
                review.is_visible
              ) ||
              (
                visibilityFilter ===
                  'hidden' &&
                !review.is_visible
              )

            const matchesRating =
              ratingFilter ===
                'all' ||
              review.rating ===
                Number(
                  ratingFilter,
                )

            const extraValues =
              review.type ===
              'store'
                ? [
                    String(
                      review
                        .storeReview
                        .milestone,
                    ),

                    String(
                      review
                        .storeReview
                        .completed_orders_count,
                    ),
                  ]
                : [
                    review
                      .productReview
                      .order_number,

                    review
                      .productReview
                      .service_name,

                    review
                      .productReview
                      .service_slug,
                  ]

            const values =
              [
                review.id,
                String(
                  review.rating,
                ),
                review.comment ??
                  '',
                ...extraValues,
              ]

            const matchesSearch =
              query.length ===
                0 ||
              values.some(
                (
                  value:
                    string,
                ) =>
                  value
                    .toLowerCase()
                    .includes(
                      query,
                    ),
              )

            return (
              matchesType &&
              matchesVisibility &&
              matchesRating &&
              matchesSearch
            )
          },
        )
      },
      [
        ratingFilter,
        reviewTypeFilter,
        searchQuery,
        unifiedReviews,
        visibilityFilter,
      ],
    )

  const formatDate =
    (
      value: string,
    ) => {
      const date =
        new Date(
          value,
        )

      if (
        Number.isNaN(
          date.getTime(),
        )
      ) {
        return value
      }

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
          date,
        )
      } catch {
        return value
      }
    }

  const renderStars =
    (
      rating: number,
      sizeClass =
        'text-lg',
    ) => {
      const safeRating =
        Math.max(
          0,
          Math.min(
            5,
            Math.round(
              Number(
                rating,
              ),
            ),
          ),
        )

      return (
        <div
          dir="ltr"
          className="flex items-center gap-0.5"
        >
          {[
            1,
            2,
            3,
            4,
            5,
          ].map(
            (
              star:
                number,
            ) => (
              <span
                key={
                  star
                }
                className={[
                  sizeClass,
                  'leading-none',
                  star <=
                  safeRating
                    ? 'text-amber-400'
                    : 'text-slate-200',
                ].join(
                  ' ',
                )}
              >
                ★
              </span>
            ),
          )}
        </div>
      )
    }

  const handleToggleVisibility =
    async (
      review:
        UnifiedReview,
    ) => {
      if (
        processingKey
      ) {
        return
      }

      const key =
        `${review.type}:${review.id}`

      setProcessingKey(
        key,
      )

      setErrorMessage(null)
      setSuccessMessage(null)

      const nextVisibility =
        !review.is_visible

      const table =
        review.type ===
        'store'
          ? 'store_reviews'
          : 'digital_order_reviews'

      try {
        const now =
          new Date()
            .toISOString()

        const {
          error,
        } =
          await supabase
            .from(
              table,
            )
            .update({
              is_visible:
                nextVisibility,

              updated_at:
                now,
            })
            .eq(
              'id',
              review.id,
            )

        if (error) {
          throw error
        }

        if (
          review.type ===
          'store'
        ) {
          setStoreReviews(
            (
              current:
                StoreReviewRow[],
            ) =>
              current.map(
                (
                  item:
                    StoreReviewRow,
                ) =>
                  item.id ===
                  review.id
                    ? {
                        ...item,
                        is_visible:
                          nextVisibility,
                        updated_at:
                          now,
                      }
                    : item,
              ),
          )
        } else {
          setProductReviews(
            (
              current:
                ProductReviewRow[],
            ) =>
              current.map(
                (
                  item:
                    ProductReviewRow,
                ) =>
                  item.id ===
                  review.id
                    ? {
                        ...item,
                        is_visible:
                          nextVisibility,
                        updated_at:
                          now,
                      }
                    : item,
              ),
          )
        }

        setSuccessMessage(
          nextVisibility
            ? isArabic
              ? 'تم إظهار التقييم للزوار.'
              : 'L’avis est maintenant visible.'
            : isArabic
              ? 'تم إخفاء التقييم عن الزوار.'
              : 'L’avis a été masqué.',
        )
      } catch (error) {
        console.error(
          'Unable to update review visibility:',
          error,
        )

        setErrorMessage(
          isArabic
            ? 'تعذر تحديث حالة التقييم.'
            : 'Impossible de modifier la visibilité de cet avis.',
        )
      } finally {
        setProcessingKey(
          null,
        )
      }
    }

  const handleRefresh =
    () => {
      if (
        isRefreshing
      ) {
        return
      }

      void loadReviews({
        refresh: true,
      })
    }

  const resetFilters =
    () => {
      setSearchQuery(
        '',
      )

      setReviewTypeFilter(
        'all',
      )

      setVisibilityFilter(
        'all',
      )

      setRatingFilter(
        'all',
      )
    }

  if (isLoading) {
    return (
      <main className="min-h-[70vh] bg-[#f7f9fc]">
        <Container>
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-bold text-slate-500">
                {isArabic
                  ? 'جارٍ تحميل التقييمات...'
                  : 'Chargement des avis...'}
              </p>
            </div>
          </div>
        </Container>
      </main>
    )
  }

  return (
    <main
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
      className="min-h-screen bg-[#f7f9fc] py-6 sm:py-8 lg:py-10"
    >
      <Container>
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                TEO STORE ADMIN
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">
                {isArabic
                  ? 'إدارة التقييمات'
                  : 'Gestion des avis'}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {isArabic
                  ? 'إدارة تقييمات المتجر وتقييمات المنتجات والتحكم في ظهورها للزوار.'
                  : 'Gérez les avis TEO STORE et les avis produits, ainsi que leur visibilité publique.'}
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
              className="flex h-11 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
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

              {isRefreshing
                ? isArabic
                  ? 'جارٍ التحديث...'
                  : 'Actualisation...'
                : isArabic
                  ? 'تحديث'
                  : 'Actualiser'}
            </button>
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-sm font-bold text-rose-700">
                {
                  errorMessage
                }
              </p>
            </div>
          )}

          {successMessage && (
            <div className="mt-5 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-bold text-emerald-700">
                {
                  successMessage
                }
              </p>
            </div>
          )}

          <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
            <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                {isArabic
                  ? 'الإجمالي'
                  : 'Total'}
              </p>

              <p
                dir="ltr"
                className="mt-2 text-2xl font-black text-slate-950"
              >
                {
                  stats.total
                }
              </p>
            </div>

            <div className="rounded-[20px] border border-violet-100 bg-violet-50 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-violet-600">
                {isArabic
                  ? 'المتجر'
                  : 'Boutique'}
              </p>

              <p
                dir="ltr"
                className="mt-2 text-2xl font-black text-violet-800"
              >
                {
                  stats.store
                }
              </p>
            </div>

            <div className="rounded-[20px] border border-blue-100 bg-blue-50 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-blue-600">
                {isArabic
                  ? 'المنتجات'
                  : 'Produits'}
              </p>

              <p
                dir="ltr"
                className="mt-2 text-2xl font-black text-blue-800"
              >
                {
                  stats.product
                }
              </p>
            </div>

            <div className="rounded-[20px] border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-600">
                {isArabic
                  ? 'ظاهر'
                  : 'Visibles'}
              </p>

              <p
                dir="ltr"
                className="mt-2 text-2xl font-black text-emerald-800"
              >
                {
                  stats.visible
                }
              </p>
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-slate-100 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {isArabic
                  ? 'مخفي'
                  : 'Masqués'}
              </p>

              <p
                dir="ltr"
                className="mt-2 text-2xl font-black text-slate-800"
              >
                {
                  stats.hidden
                }
              </p>
            </div>

            <div className="rounded-[20px] border border-amber-100 bg-amber-50 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-amber-600">
                {isArabic
                  ? 'متوسط الظاهر'
                  : 'Moyenne visible'}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <p
                  dir="ltr"
                  className="text-2xl font-black text-amber-800"
                >
                  {stats.average.toFixed(
                    1,
                  )}
                </p>

                <span className="text-lg text-amber-400">
                  ★
                </span>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto_auto_auto]">
              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                  className={[
                    'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400',
                    isArabic
                      ? 'right-4'
                      : 'left-4',
                  ].join(
                    ' ',
                  )}
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />

                  <path d="m20 20-3.5-3.5" />
                </svg>

                <input
                  type="search"
                  value={
                    searchQuery
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearchQuery(
                      event.target
                        .value,
                    )
                  }
                  placeholder={
                    isArabic
                      ? 'بحث في التعليق أو الخدمة أو رقم الطلب...'
                      : 'Rechercher un commentaire, service ou commande...'
                  }
                  className={[
                    'h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white',
                    isArabic
                      ? 'pr-11 pl-4'
                      : 'pl-11 pr-4',
                  ].join(
                    ' ',
                  )}
                />
              </div>

              <select
                value={
                  reviewTypeFilter
                }
                onChange={(
                  event,
                ) =>
                  setReviewTypeFilter(
                    event.target
                      .value as ReviewTypeFilter,
                  )
                }
                className="h-12 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">
                  {isArabic
                    ? 'كل الأنواع'
                    : 'Tous les types'}
                </option>

                <option value="store">
                  {isArabic
                    ? 'تقييمات المتجر'
                    : 'Avis boutique'}
                </option>

                <option value="product">
                  {isArabic
                    ? 'تقييمات المنتجات'
                    : 'Avis produits'}
                </option>
              </select>

              <select
                value={
                  visibilityFilter
                }
                onChange={(
                  event,
                ) =>
                  setVisibilityFilter(
                    event.target
                      .value as VisibilityFilter,
                  )
                }
                className="h-12 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">
                  {isArabic
                    ? 'كل حالات العرض'
                    : 'Toutes les visibilités'}
                </option>

                <option value="visible">
                  {isArabic
                    ? 'ظاهر فقط'
                    : 'Visibles'}
                </option>

                <option value="hidden">
                  {isArabic
                    ? 'مخفي فقط'
                    : 'Masqués'}
                </option>
              </select>

              <select
                value={
                  ratingFilter
                }
                onChange={(
                  event,
                ) =>
                  setRatingFilter(
                    event.target
                      .value as RatingFilter,
                  )
                }
                className="h-12 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">
                  {isArabic
                    ? 'كل النجوم'
                    : 'Toutes les notes'}
                </option>

                <option value="5">
                  5 ★
                </option>

                <option value="4">
                  4 ★
                </option>

                <option value="3">
                  3 ★
                </option>

                <option value="2">
                  2 ★
                </option>

                <option value="1">
                  1 ★
                </option>
              </select>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-400">
                {isArabic
                  ? `${filteredReviews.length} تقييم مطابق`
                  : `${filteredReviews.length} avis trouvé(s)`}
              </p>

              {(
                searchQuery ||
                reviewTypeFilter !==
                  'all' ||
                visibilityFilter !==
                  'all' ||
                ratingFilter !==
                  'all'
              ) && (
                <button
                  type="button"
                  onClick={
                    resetFilters
                  }
                  className="text-xs font-black text-blue-600"
                >
                  {isArabic
                    ? 'إعادة ضبط'
                    : 'Réinitialiser'}
                </button>
              )}
            </div>
          </section>

          <section className="mt-5">
            {filteredReviews.length >
            0 ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredReviews.map(
                  (
                    review:
                      UnifiedReview,
                  ) => {
                    const key =
                      `${review.type}:${review.id}`

                    const busy =
                      processingKey ===
                      key

                    const isStore =
                      review.type ===
                      'store'

                    return (
                      <article
                        key={
                          key
                        }
                        className={[
                          'overflow-hidden rounded-[22px] border bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]',
                          review.is_visible
                            ? 'border-slate-200'
                            : 'border-slate-200 bg-slate-50/70',
                        ].join(
                          ' ',
                        )}
                      >
                        <div className="p-5 sm:p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={[
                                    'rounded-full px-2.5 py-1 text-[10px] font-black',
                                    isStore
                                      ? 'bg-violet-50 text-violet-700'
                                      : 'bg-blue-50 text-blue-700',
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  {isStore
                                    ? isArabic
                                      ? 'تقييم المتجر'
                                      : 'Avis boutique'
                                    : isArabic
                                      ? 'تقييم منتج'
                                      : 'Avis produit'}
                                </span>

                                {renderStars(
                                  review.rating,
                                )}

                                <span
                                  dir="ltr"
                                  className="text-sm font-black text-slate-800"
                                >
                                  {
                                    review.rating
                                  }
                                  /5
                                </span>
                              </div>

                              {isStore ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-700">
                                    {isArabic
                                      ? `مرحلة ${review.storeReview.milestone}`
                                      : `Palier ${review.storeReview.milestone}`}
                                  </span>

                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                                    {isArabic
                                      ? `${review.storeReview.completed_orders_count} طلبات مكتملة`
                                      : `${review.storeReview.completed_orders_count} commandes terminées`}
                                  </span>
                                </div>
                              ) : (
                                <div className="mt-3 space-y-2">
                                  <p className="break-words text-sm font-black text-slate-900">
                                    {review
                                      .productReview
                                      .service_name ||
                                      review
                                        .productReview
                                        .service_slug ||
                                      (isArabic
                                        ? 'خدمة رقمية'
                                        : 'Service numérique')}
                                  </p>

                                  <div className="flex flex-wrap gap-2">
                                    {review
                                      .productReview
                                      .service_slug && (
                                      <span
                                        dir="ltr"
                                        className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700"
                                      >
                                        {
                                          review
                                            .productReview
                                            .service_slug
                                        }
                                      </span>
                                    )}

                                    <span
                                      dir="ltr"
                                      className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600"
                                    >
                                      {
                                        review
                                          .productReview
                                          .order_number
                                      }
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <span
                              className={[
                                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-black',
                                review.is_visible
                                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 bg-slate-100 text-slate-500',
                              ].join(
                                ' ',
                              )}
                            >
                              {review.is_visible
                                ? isArabic
                                  ? 'ظاهر'
                                  : 'Visible'
                                : isArabic
                                  ? 'مخفي'
                                  : 'Masqué'}
                            </span>
                          </div>

                          <div className="mt-5 min-h-[90px] rounded-[16px] border border-slate-100 bg-slate-50 p-4">
                            {review.comment &&
                            review.comment
                              .trim()
                              .length >
                              0 ? (
                              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                “
                                {
                                  review.comment
                                }
                                ”
                              </p>
                            ) : (
                              <p className="text-sm italic leading-6 text-slate-400">
                                {isArabic
                                  ? 'تم ترك تقييم بالنجوم بدون تعليق.'
                                  : 'Une note a été laissée sans commentaire.'}
                              </p>
                            )}
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <div className="rounded-[14px] bg-slate-50 p-3">
                              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                                {isArabic
                                  ? 'تاريخ التقييم'
                                  : 'Date'}
                              </p>

                              <p
                                dir="ltr"
                                className="mt-1 text-left text-xs font-bold text-slate-700"
                              >
                                {formatDate(
                                  review.created_at,
                                )}
                              </p>
                            </div>

                            <div className="rounded-[14px] bg-slate-50 p-3">
                              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                                {isArabic
                                  ? 'آخر تحديث'
                                  : 'Modification'}
                              </p>

                              <p
                                dir="ltr"
                                className="mt-1 text-left text-xs font-bold text-slate-700"
                              >
                                {formatDate(
                                  review.updated_at,
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 border-t border-slate-100 pt-4">
                            <button
                              type="button"
                              onClick={() =>
                                void handleToggleVisibility(
                                  review,
                                )
                              }
                              disabled={
                                Boolean(
                                  processingKey,
                                )
                              }
                              className={[
                                'flex min-h-[44px] w-full items-center justify-center rounded-[13px] px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50',
                                review.is_visible
                                  ? 'border border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-500',
                              ].join(
                                ' ',
                              )}
                            >
                              {busy
                                ? isArabic
                                  ? 'جارٍ التحديث...'
                                  : 'Modification...'
                                : review.is_visible
                                  ? isArabic
                                    ? 'إخفاء عن الزوار'
                                    : 'Masquer aux visiteurs'
                                  : isArabic
                                    ? 'إظهار للزوار'
                                    : 'Afficher aux visiteurs'}
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  },
                )}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-amber-50 text-2xl text-amber-400">
                  ★
                </div>

                <h2 className="mt-4 text-base font-black text-slate-800">
                  {unifiedReviews.length ===
                  0
                    ? isArabic
                      ? 'لا توجد تقييمات حتى الآن'
                      : 'Aucun avis pour le moment'
                    : isArabic
                      ? 'لا توجد نتائج مطابقة'
                      : 'Aucun résultat correspondant'}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                  {unifiedReviews.length ===
                  0
                    ? isArabic
                      ? 'ستظهر هنا تقييمات المتجر والمنتجات عند إرسالها من العملاء.'
                      : 'Les avis boutique et produits apparaîtront ici lorsqu’ils seront envoyés par les clients.'
                    : isArabic
                      ? 'غيّر البحث أو الفلاتر لعرض تقييمات أخرى.'
                      : 'Modifiez la recherche ou les filtres pour afficher d’autres avis.'}
                </p>
              </div>
            )}
          </section>
        </div>
      </Container>
    </main>
  )
}

export default AdminStoreReviewsPage