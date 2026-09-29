import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react'

import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'

type LocalizedText = {
  fr: string
  ar: string
}

type OrderStatus =
  | 'payment_review'
  | 'payment_partial'
  | 'payment_confirmed'
  | 'processing'
  | 'fulfillment_sent'
  | 'disputed'
  | 'completed'
  | 'cancelled'
  | 'refunded'

type OrderState = {
  orderNumber?: string
  serviceName?: string
  status?: OrderStatus

  orderType?: 'esim'

  countryName?: LocalizedText
  countryFlag?: string

  planData?: LocalizedText
  planDuration?: LocalizedText
  planPrice?: string

  paymentMethod?: string
  senderNumber?: string
}

type DigitalOrderRow = {
  id: string
  order_number: string
  user_id: string

  service_slug: string | null
  service_name: string

  group_id: string | null
  group_name: string | null

  plan_id: string | null
  plan_label: string

  quantity: number | null
  unit_price: number | null
  total_amount: number

  currency: string

  customer_name: string
  customer_email: string | null
  customer_phone: string

  customer_values:
    | Record<string, unknown>
    | null

  payment_method: string | null
  payment_method_name: string | null
  payment_sender_number: string | null
  payment_proof_path: string | null

  amount_received: number | null
  amount_remaining: number | null

  payment_issue_code: string | null
  payment_issue_reason: string | null
  payment_issue_at: string | null

  payment_completion_requested_at: string | null

  payment_completion_sender_number: string | null
  payment_completion_proof_path: string | null
  payment_completion_submitted_at: string | null
  payment_completion_amount: number | null
  payment_completion_note: string | null

  fulfillment_type: string | null
  fulfillment_status: string | null

  fulfillment_email: string | null
  fulfillment_password: string | null
  fulfillment_code: string | null
  fulfillment_link: string | null
  fulfillment_note: string | null

  fulfillment_sent_at: string | null
  customer_confirmed_at: string | null

  dispute_status: string | null
  dispute_reason_code: string | null
  dispute_reason: string | null
  dispute_opened_at: string | null
  dispute_resolved_at: string | null
  dispute_resolution: string | null

  status: string

  rejection_code: string | null
  rejection_reason: string | null
  rejected_at: string | null

  created_at: string
  updated_at: string
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

type DisputeReason = {
  code: string
  fr: string
  ar: string
}

type ToastState = {
  type:
    | 'success'
    | 'error'
    | 'info'

  message: string
}

const PAYMENT_PROOFS_BUCKET =
  'payment-proofs'

const disputeReasons: DisputeReason[] = [
  {
    code:
      'service_not_received',

    fr:
      "Je n'ai pas reçu le service",

    ar:
      'لم أستلم الخدمة',
  },
  {
    code:
      'credentials_not_working',

    fr:
      'Les identifiants ne fonctionnent pas',

    ar:
      'بيانات الدخول لا تعمل',
  },
  {
    code:
      'invalid_code_or_link',

    fr:
      "Le code ou le lien d'activation ne fonctionne pas",

    ar:
      'الكود أو رابط التفعيل لا يعمل',
  },
  {
    code:
      'wrong_service',

    fr:
      'Le service reçu ne correspond pas à ma commande',

    ar:
      'الخدمة المستلمة مختلفة عن طلبي',
  },
  {
    code:
      'wrong_duration',

    fr:
      "La durée ou l'abonnement est incorrect",

    ar:
      'مدة الاشتراك أو الخطة غير صحيحة',
  },
  {
    code:
      'other',

    fr:
      'Autre problème',

    ar:
      'مشكلة أخرى',
  },
]

function normalizeStatus(
  status?: string | null,
): OrderStatus {
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

function readString(
  value: unknown,
  fallback = '',
) {
  return typeof value ===
    'string'
    ? value
    : fallback
}

function getFileExtension(
  file: File,
) {
  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        '',
      )
      .slice(
        0,
        8,
      )

  if (extension) {
    return extension
  }

  if (
    file.type ===
    'image/png'
  ) {
    return 'png'
  }

  if (
    file.type ===
    'image/webp'
  ) {
    return 'webp'
  }

  if (
    file.type ===
    'application/pdf'
  ) {
    return 'pdf'
  }

  return 'jpg'
}

function DigitalOrderStatusPage() {
  const {
    orderNumber,
  } =
    useParams()

  const location =
    useLocation()

  const navigate =
    useNavigate()

  const {
    language,
    formatCurrencyText,
  } =
    useLanguage()

  const isArabic =
    language ===
    'ar'

  const state =
    (
      location.state as
        | OrderState
        | null
    ) ??
    null

  const resolvedOrderNumber =
    state?.orderNumber ??
    orderNumber ??
    ''

  const [
    digitalOrder,
    setDigitalOrder,
  ] =
    useState<
      DigitalOrderRow | null
    >(null)

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
    useState<
      string | null
    >(null)

  const [
    isConfirmingReceipt,
    setIsConfirmingReceipt,
  ] =
    useState(false)

  const [
    disputeOpen,
    setDisputeOpen,
  ] =
    useState(false)

  const [
    selectedDisputeCode,
    setSelectedDisputeCode,
  ] =
    useState('')

  const [
    disputeDescription,
    setDisputeDescription,
  ] =
    useState('')

  const [
    isSubmittingDispute,
    setIsSubmittingDispute,
  ] =
    useState(false)

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false)

  const [
    toast,
    setToast,
  ] =
    useState<
      ToastState | null
    >(null)

  const [
    paymentCompletionOpen,
    setPaymentCompletionOpen,
  ] =
    useState(false)

  const [
    completionSenderNumber,
    setCompletionSenderNumber,
  ] =
    useState('')

  const [
    completionProofFile,
    setCompletionProofFile,
  ] =
    useState<
      File | null
    >(null)

  const [
    isSubmittingCompletion,
    setIsSubmittingCompletion,
  ] =
    useState(false)

  const [
    paymentReceiverNumber,
    setPaymentReceiverNumber,
  ] =
    useState('')

  const [
    isLoadingPaymentReceiver,
    setIsLoadingPaymentReceiver,
  ] =
    useState(false)

  const [
    copiedPaymentNumber,
    setCopiedPaymentNumber,
  ] =
    useState(false)

  const [
    review,
    setReview,
  ] =
    useState<
      DigitalOrderReviewRow | null
    >(null)

  const [
    reviewLoading,
    setReviewLoading,
  ] =
    useState(false)

  const [
    selectedRating,
    setSelectedRating,
  ] =
    useState(0)

  const [
    hoveredRating,
    setHoveredRating,
  ] =
    useState(0)

  const [
    reviewComment,
    setReviewComment,
  ] =
    useState('')

  const [
    isSubmittingReview,
    setIsSubmittingReview,
  ] =
    useState(false)

  const showToast =
    useCallback(
      (
        nextToast:
          ToastState,
      ) => {
        setToast(
          nextToast,
        )

        window.setTimeout(
          () => {
            setToast(
              null,
            )
          },
          4200,
        )
      },
      [],
    )

  const loadDigitalOrder =
    useCallback(
      async (
        showRefresh =
          false,
      ) => {
        if (
          !resolvedOrderNumber
        ) {
          return
        }

        if (
          showRefresh
        ) {
          setIsRefreshing(
            true,
          )
        }

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
          userError ||
          !userData.user
        ) {
          navigate(
            `/connexion?redirect=${encodeURIComponent(
              `/commande/${resolvedOrderNumber}`,
            )}`,
            {
              replace:
                true,
            },
          )

          return
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
                id,
                order_number,
                user_id,
                service_slug,
                service_name,
                group_id,
                group_name,
                plan_id,
                plan_label,
                quantity,
                unit_price,
                total_amount,
                currency,
                customer_name,
                customer_email,
                customer_phone,
                customer_values,
                payment_method,
                payment_method_name,
                payment_sender_number,
                payment_proof_path,
                amount_received,
                amount_remaining,
                payment_issue_code,
                payment_issue_reason,
                payment_issue_at,
                payment_completion_requested_at,
                payment_completion_sender_number,
                payment_completion_proof_path,
                payment_completion_submitted_at,
                payment_completion_amount,
                payment_completion_note,
                fulfillment_type,
                fulfillment_status,
                fulfillment_email,
                fulfillment_password,
                fulfillment_code,
                fulfillment_link,
                fulfillment_note,
                fulfillment_sent_at,
                customer_confirmed_at,
                dispute_status,
                dispute_reason_code,
                dispute_reason,
                dispute_opened_at,
                dispute_resolved_at,
                dispute_resolution,
                status,
                rejection_code,
                rejection_reason,
                rejected_at,
                created_at,
                updated_at
              `,
            )
            .eq(
              'order_number',
              resolvedOrderNumber,
            )
            .eq(
              'user_id',
              userData.user.id,
            )
            .maybeSingle()

        if (
          error
        ) {
          console.error(
            'Unable to load digital order:',
            error,
          )

          setErrorMessage(
            error.message,
          )

          setDigitalOrder(
            null,
          )

          setIsLoading(
            false,
          )

          setIsRefreshing(
            false,
          )

          return
        }

        setDigitalOrder(
          data as
            | DigitalOrderRow
            | null,
        )

        setIsLoading(
          false,
        )

        setIsRefreshing(
          false,
        )
      },
      [
        navigate,
        resolvedOrderNumber,
      ],
    )

  const loadReview =
    useCallback(
      async (
        order:
          DigitalOrderRow,
      ) => {
        setReviewLoading(
          true,
        )

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'digital_order_reviews',
            )
            .select(
              `
                id,
                order_id,
                order_number,
                user_id,
                rating,
                comment,
                created_at,
                updated_at
              `,
            )
            .eq(
              'order_id',
              order.id,
            )
            .eq(
              'user_id',
              order.user_id,
            )
            .maybeSingle()

        if (
          error
        ) {
          console.error(
            'Unable to load review:',
            error,
          )

          setReview(
            null,
          )

          setReviewLoading(
            false,
          )

          return
        }

        setReview(
          data as
            | DigitalOrderReviewRow
            | null,
        )

        setReviewLoading(
          false,
        )
      },
      [],
    )

  const loadPaymentReceiverNumber =
    useCallback(
      async (
        order:
          DigitalOrderRow,
      ) => {
        setIsLoadingPaymentReceiver(
          true,
        )

        try {
          if (
            order.payment_method
          ) {
            const {
              data,
              error,
            } =
              await supabase
                .from(
                  'payment_methods',
                )
                .select(
                  'payment_number',
                )
                .eq(
                  'code',
                  order.payment_method,
                )
                .maybeSingle()

            if (
              !error &&
              data
            ) {
              const currentNumber =
                readString(
                  data.payment_number,
                ).trim()

              if (
                currentNumber.length >
                0
              ) {
                setPaymentReceiverNumber(
                  currentNumber,
                )

                return
              }
            }

            if (
              error
            ) {
              console.warn(
                'Unable to load payment receiver number:',
                error,
              )
            }
          }

          const storedNumber =
            readString(
              digitalOrder
                ?.customer_values
                ?.paymentReceiverNumber ??
              order.customer_values
                ?.paymentReceiverNumber,
            ).trim()

          if (
            storedNumber.length >
            0
          ) {
            setPaymentReceiverNumber(
              storedNumber,
            )

            return
          }

          setPaymentReceiverNumber(
            '',
          )
        } finally {
          setIsLoadingPaymentReceiver(
            false,
          )
        }
      },
      [
        digitalOrder
          ?.customer_values,
      ],
    )

  useEffect(() => {
    let mounted =
      true

    void loadDigitalOrder()

    const channel =
      supabase
        .channel(
          `customer-order-${resolvedOrderNumber}-${Date.now()}`,
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

            filter:
              `order_number=eq.${resolvedOrderNumber}`,
          },
          () => {
            if (
              mounted
            ) {
              void loadDigitalOrder()
            }
          },
        )
        .subscribe()

    const handleFocus =
      () => {
        if (
          mounted
        ) {
          void loadDigitalOrder()
        }
      }

    const handleVisibility =
      () => {
        if (
          mounted &&
          document.visibilityState ===
            'visible'
        ) {
          void loadDigitalOrder()
        }
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
      mounted =
        false

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
          channel,
        )
    }
  }, [
    loadDigitalOrder,
    resolvedOrderNumber,
  ])

  useEffect(() => {
    if (
      !digitalOrder
    ) {
      setReview(
        null,
      )

      return
    }

    void loadReview(
      digitalOrder,
    )

    if (
      normalizeStatus(
        digitalOrder.status,
      ) ===
      'payment_partial'
    ) {
      void loadPaymentReceiverNumber(
        digitalOrder,
      )
    }

    const reviewChannel =
      supabase
        .channel(
          `customer-review-${digitalOrder.id}-${Date.now()}`,
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

            filter:
              `order_id=eq.${digitalOrder.id}`,
          },
          () => {
            void loadReview(
              digitalOrder,
            )
          },
        )
        .subscribe()

    return () => {
      void supabase
        .removeChannel(
          reviewChannel,
        )
    }
  }, [
    digitalOrder?.id,
    digitalOrder?.status,
    digitalOrder?.user_id,
    loadPaymentReceiverNumber,
    loadReview,
  ])

  const status =
    normalizeStatus(
      digitalOrder?.status ??
        state?.status,
    )

  const disputeResolved =
    Boolean(
      digitalOrder &&
        (
          digitalOrder.dispute_status ===
            'resolved' ||
          digitalOrder.dispute_resolution ||
          digitalOrder.dispute_resolved_at
        ),
    )

  const paymentCompletionSubmitted =
    Boolean(
      digitalOrder
        ?.payment_completion_submitted_at &&
        digitalOrder
          ?.payment_completion_proof_path,
    )

  const pipelineRank =
    useMemo(() => {
      if (
        status ===
          'payment_review' ||
        status ===
          'payment_partial'
      ) {
        return 1
      }

      if (
        status ===
        'payment_confirmed'
      ) {
        return 2
      }

      if (
        status ===
        'processing'
      ) {
        return 3
      }

      if (
        status ===
          'fulfillment_sent' ||
        status ===
          'disputed'
      ) {
        return 5
      }

      if (
        status ===
        'completed'
      ) {
        return review
          ? 7
          : 6
      }

      return 0
    }, [
      review,
      status,
    ])

  const pipelineSteps = [
    {
      fr:
        'Paiement',

      ar:
        'الدفع',
    },
    {
      fr:
        'Vérification',

      ar:
        'التحقق',
    },
    {
      fr:
        'Confirmé',

      ar:
        'التأكيد',
    },
    {
      fr:
        'Préparation',

      ar:
        'التجهيز',
    },
    {
      fr:
        'Livraison',

      ar:
        'التسليم',
    },
    {
      fr:
        'Réception',

      ar:
        'الاستلام',
    },
    {
      fr:
        'Terminée',

      ar:
        'مكتمل',
    },
    {
      fr:
        'Évaluation',

      ar:
        'التقييم',
    },
  ]

  const formatNumber =
    useCallback(
      (
        value:
          number,
      ) =>
        new Intl.NumberFormat(
          isArabic
            ? 'ar-MR-u-nu-latn'
            : 'fr-FR-u-nu-latn',
          {
            numberingSystem:
              'latn',

            maximumFractionDigits:
              2,
          },
        ).format(
          Number(
            value,
          ),
        ),
      [
        isArabic,
      ],
    )

  const formatAmount =
    useCallback(
      (
        amount:
          number,

        currency =
          'MRU',
      ) =>
        formatCurrencyText(
          `${formatNumber(
            amount ||
              0,
          )} ${currency}`,
        ),
      [
        formatCurrencyText,
        formatNumber,
      ],
    )

  const formatDate =
    useCallback(
      (
        value:
          | string
          | null
          | undefined,
      ) => {
        if (
          !value
        ) {
          return '—'
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
            new Date(
              value,
            ),
          )
        } catch {
          return value
        }
      },
      [
        isArabic,
      ],
    )

  const handleRefresh =
    () => {
      void loadDigitalOrder(
        true,
      )
    }

  const handleCopy =
    async (
      value:
        string,
    ) => {
      try {
        await navigator.clipboard
          .writeText(
            value,
          )

        showToast({
          type:
            'success',

          message:
            isArabic
              ? 'تم النسخ.'
              : 'Copié.',
        })
      } catch {
        showToast({
          type:
            'error',

          message:
            isArabic
              ? 'تعذر النسخ.'
              : 'Impossible de copier.',
        })
      }
    }

  const handleCopyPaymentNumber =
    async () => {
      if (
        !paymentReceiverNumber
      ) {
        return
      }

      try {
        await navigator.clipboard
          .writeText(
            paymentReceiverNumber,
          )

        setCopiedPaymentNumber(
          true,
        )

        window.setTimeout(
          () => {
            setCopiedPaymentNumber(
              false,
            )
          },
          1800,
        )
      } catch {
        showToast({
          type:
            'error',

          message:
            isArabic
              ? 'تعذر نسخ رقم الدفع.'
              : 'Impossible de copier le numéro de paiement.',
        })
      }
    }

  const handleConfirmReceipt =
    async () => {
      if (
        !digitalOrder ||
        isConfirmingReceipt
      ) {
        return
      }

      setIsConfirmingReceipt(
        true,
      )

      const {
        error,
      } =
        await supabase.rpc(
          'customer_confirm_digital_order',
          {
            p_order_number:
              digitalOrder.order_number,
          },
        )

      if (
        error
      ) {
        console.error(
          'Unable to confirm receipt:',
          error,
        )

        showToast({
          type:
            'error',

          message:
            isArabic
              ? 'تعذر تأكيد الاستلام.'
              : 'Impossible de confirmer la réception.',
        })

        setIsConfirmingReceipt(
          false,
        )

        return
      }

      showToast({
        type:
          'success',

        message:
          isArabic
            ? 'تم تأكيد الاستلام.'
            : 'Réception confirmée.',
      })

      await loadDigitalOrder()

      setIsConfirmingReceipt(
        false,
      )
    }

  const handleSubmitDispute =
    async () => {
      if (
        !digitalOrder ||
        !selectedDisputeCode ||
        isSubmittingDispute
      ) {
        return
      }

      const selectedReason =
        disputeReasons.find(
          (
            reason,
          ) =>
            reason.code ===
            selectedDisputeCode,
        )

      if (
        !selectedReason
      ) {
        return
      }

      const reasonText =
        selectedDisputeCode ===
        'other'
          ? disputeDescription
              .trim()
          : isArabic
            ? selectedReason.ar
            : selectedReason.fr

      if (
        !reasonText
      ) {
        return
      }

      setIsSubmittingDispute(
        true,
      )

      const {
        error,
      } =
        await supabase.rpc(
          'customer_open_digital_order_dispute',
          {
            p_order_number:
              digitalOrder.order_number,

            p_reason_code:
              selectedDisputeCode,

            p_reason:
              reasonText,
          },
        )

      if (
        error
      ) {
        console.error(
          'Unable to open dispute:',
          error,
        )

        showToast({
          type:
            'error',

          message:
            isArabic
              ? 'تعذر إرسال الشكوى.'
              : 'Impossible d’envoyer la réclamation.',
        })

        setIsSubmittingDispute(
          false,
        )

        return
      }

      setDisputeOpen(
        false,
      )

      setSelectedDisputeCode(
        '',
      )

      setDisputeDescription(
        '',
      )

      showToast({
        type:
          'success',

        message:
          isArabic
            ? 'تم إرسال الشكوى.'
            : 'Réclamation envoyée.',
      })

      await loadDigitalOrder()

      setIsSubmittingDispute(
        false,
      )
    }

  const handleCompletionProofChange =
    (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target
          .files?.[0]

      if (
        !file
      ) {
        setCompletionProofFile(
          null,
        )

        return
      }

      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
      ]

      if (
        !allowedTypes.includes(
          file.type,
        )
      ) {
        setCompletionProofFile(
          null,
        )

        event.target.value =
          ''

        showToast({
          type:
            'error',

          message:
            isArabic
              ? 'استخدم JPG أو PNG أو WEBP أو PDF.'
              : 'Utilisez JPG, PNG, WEBP ou PDF.',
        })

        return
      }

      if (
        file.size >
        10 *
          1024 *
          1024
      ) {
        setCompletionProofFile(
          null,
        )

        event.target.value =
          ''

        showToast({
          type:
            'error',

          message:
            isArabic
              ? 'حجم الملف يجب ألا يتجاوز 10 MB.'
              : 'Le fichier ne doit pas dépasser 10 MB.',
        })

        return
      }

      setCompletionProofFile(
        file,
      )
    }

  const handleSubmitPaymentCompletion =
    async () => {
      if (
        !digitalOrder ||
        !completionSenderNumber
          .trim() ||
        !completionProofFile ||
        isSubmittingCompletion
      ) {
        return
      }

      setIsSubmittingCompletion(
        true,
      )

      let uploadedPath:
        string | null =
        null

      try {
        const {
          data:
            authData,

          error:
            authError,
        } =
          await supabase.auth
            .getUser()

        if (
          authError ||
          !authData.user
        ) {
          navigate(
            `/connexion?redirect=${encodeURIComponent(
              `/commande/${digitalOrder.order_number}`,
            )}`,
            {
              replace:
                true,
            },
          )

          return
        }

        const extension =
          getFileExtension(
            completionProofFile,
          )

        const proofPath =
          `${authData.user.id}/completion-${digitalOrder.order_number}-${Date.now()}.${extension}`

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              PAYMENT_PROOFS_BUCKET,
            )
            .upload(
              proofPath,
              completionProofFile,
              {
                upsert:
                  false,

                cacheControl:
                  '3600',

                contentType:
                  completionProofFile.type,
              },
            )

        if (
          uploadError
        ) {
          throw uploadError
        }

        uploadedPath =
          proofPath

        const {
          error:
            completionError,
        } =
          await supabase.rpc(
            'customer_submit_payment_completion',
            {
              p_order_number:
                digitalOrder.order_number,

              p_sender_number:
                completionSenderNumber.trim(),

              p_proof_path:
                proofPath,
            },
          )

        if (
          completionError
        ) {
          throw completionError
        }

        uploadedPath =
          null

        setPaymentCompletionOpen(
          false,
        )

        setCompletionSenderNumber(
          '',
        )

        setCompletionProofFile(
          null,
        )

        showToast({
          type:
            'success',

          message:
            isArabic
              ? 'تم إرسال إثبات المبلغ المتبقي.'
              : 'La preuve du complément a été envoyée.',
        })

        await loadDigitalOrder()
      } catch (
        error
      ) {
        console.error(
          'Unable to submit payment completion:',
          error,
        )

        if (
          uploadedPath
        ) {
          const {
            error:
              removeError,
          } =
            await supabase.storage
              .from(
                PAYMENT_PROOFS_BUCKET,
              )
              .remove([
                uploadedPath,
              ])

          if (
            removeError
          ) {
            console.warn(
              'Unable to remove failed completion proof:',
              removeError,
            )
          }
        }

        showToast({
          type:
            'error',

          message:
            error instanceof
            Error
              ? error.message
              : isArabic
                ? 'تعذر إرسال إثبات الدفع.'
                : 'Impossible d’envoyer la preuve de paiement.',
        })
      } finally {
        setIsSubmittingCompletion(
          false,
        )
      }
    }

  const handleSubmitReview =
    async () => {
      if (
        !digitalOrder ||
        selectedRating <
          1 ||
        selectedRating >
          5 ||
        isSubmittingReview
      ) {
        return
      }

      setIsSubmittingReview(
        true,
      )

      const {
        error,
      } =
        await supabase
          .from(
            'digital_order_reviews',
          )
          .insert({
            order_id:
              digitalOrder.id,

            order_number:
              digitalOrder.order_number,

            user_id:
              digitalOrder.user_id,

            rating:
              selectedRating,

            comment:
              reviewComment
                .trim() ||
              null,
          })

      if (
        error
      ) {
        console.error(
          'Unable to submit review:',
          error,
        )

        showToast({
          type:
            'error',

          message:
            isArabic
              ? 'تعذر إرسال التقييم.'
              : 'Impossible d’envoyer l’évaluation.',
        })

        setIsSubmittingReview(
          false,
        )

        return
      }

      showToast({
        type:
          'success',

        message:
          isArabic
            ? 'شكراً على تقييمك.'
            : 'Merci pour votre avis.',
      })

      setSelectedRating(
        0,
      )

      setHoveredRating(
        0,
      )

      setReviewComment(
        '',
      )

      await loadReview(
        digitalOrder,
      )

      setIsSubmittingReview(
        false,
      )
    }

  if (
    isLoading
  ) {
    return (
      <main className="min-h-screen bg-[#f7f9fc]">
        <Container className="flex min-h-[70vh] items-center justify-center py-10">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-black text-slate-500">
              {isArabic
                ? 'جاري تحميل الطلب...'
                : 'Chargement de la commande...'}
            </p>
          </div>
        </Container>
      </main>
    )
  }

  if (
    errorMessage ||
    !digitalOrder
  ) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] py-10">
        <Container>
          <div className="mx-auto max-w-xl rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-rose-50 text-lg font-black text-rose-600">
              !
            </div>

            <h1 className="mt-4 text-xl font-black text-slate-950">
              {isArabic
                ? 'تعذر العثور على الطلب'
                : 'Commande introuvable'}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {errorMessage ||
                (
                  isArabic
                    ? 'هذا الطلب غير موجود أو لا يمكنك الوصول إليه.'
                    : 'Cette commande est introuvable ou vous ne pouvez pas y accéder.'
                )}
            </p>

            <Link
              to="/profil"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-[13px] bg-blue-600 px-5 text-sm font-black text-white"
            >
              {isArabic
                ? 'العودة إلى حسابي'
                : 'Retour à mon compte'}
            </Link>
          </div>
        </Container>
      </main>
    )
  }

  const serviceName =
    digitalOrder.service_name ||
    state?.serviceName ||
    'TEO STORE'

  const totalAmount =
    Number(
      digitalOrder.total_amount ??
        0,
    )

  const amountReceived =
    Number(
      digitalOrder.amount_received ??
        0,
    )

  const amountRemaining =
    Number(
      digitalOrder.amount_remaining ??
        totalAmount,
    )

  const paymentMethodName =
    digitalOrder.payment_method_name ||
    state?.paymentMethod ||
    '—'

  const senderNumber =
    digitalOrder.payment_sender_number ||
    state?.senderNumber ||
    '—'

  const fulfillmentAvailable =
    Boolean(
      digitalOrder.fulfillment_email ||
        digitalOrder.fulfillment_password ||
        digitalOrder.fulfillment_code ||
        digitalOrder.fulfillment_link ||
        digitalOrder.fulfillment_note,
    )

  return (
    <main
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
      className="min-h-screen bg-[#f7f9fc] py-5 sm:py-8"
    >
      {toast && (
        <div className="fixed inset-x-3 top-3 z-[250] sm:left-auto sm:right-4 sm:w-full sm:max-w-sm">
          <div
            className={[
              'rounded-[18px] border bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.20)]',

              toast.type ===
              'success'
                ? 'border-emerald-100'
                : toast.type ===
                    'error'
                  ? 'border-rose-100'
                  : 'border-blue-100',
            ].join(
              ' ',
            )}
          >
            <p className="text-sm font-black text-slate-950">
              {
                toast.message
              }
            </p>
          </div>
        </div>
      )}

      <Container>
        <div className="mx-auto max-w-5xl">
          <section
            className="relative overflow-hidden rounded-[26px] border border-slate-800/30 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)] sm:p-7"
            style={{
              background:
                'linear-gradient(135deg,#020617 0%,#10265b 55%,#312e81 100%)',
            }}
          >
            <div className="relative">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">
                    TEO STORE
                  </p>

                  <h1 className="mt-2 break-words text-2xl font-black sm:text-3xl">
                    {
                      serviceName
                    }
                  </h1>

                  <p
                    dir="ltr"
                    className="mt-2 text-left text-sm font-black text-white/60"
                  >
                    {
                      digitalOrder.order_number
                    }
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
                  className="flex min-h-[44px] shrink-0 items-center justify-center rounded-[13px] border border-white/10 bg-white/[0.08] px-4 text-xs font-black text-white disabled:opacity-50"
                >
                  {isRefreshing
                    ? isArabic
                      ? 'تحديث...'
                      : 'Actualisation...'
                    : isArabic
                      ? 'تحديث'
                      : 'Actualiser'}
                </button>
              </div>

              <div className="mt-6 rounded-[18px] border border-white/10 bg-white/[0.05] p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-black uppercase tracking-wide text-white/40">
                    {isArabic
                      ? 'الحالة'
                      : 'Statut'}
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black">
                    {status ===
                    'payment_review'
                      ? isArabic
                        ? 'جاري التحقق من الدفع'
                        : 'Paiement en vérification'
                      : status ===
                          'payment_partial'
                        ? isArabic
                          ? 'المبلغ غير مكتمل'
                          : 'Paiement incomplet'
                        : status ===
                            'payment_confirmed'
                          ? isArabic
                            ? 'تم تأكيد الدفع'
                            : 'Paiement confirmé'
                          : status ===
                              'processing'
                            ? isArabic
                              ? 'قيد التجهيز'
                              : 'En préparation'
                            : status ===
                                'fulfillment_sent'
                              ? isArabic
                                ? 'تم الإرسال'
                                : 'Service envoyé'
                              : status ===
                                  'disputed'
                                ? isArabic
                                  ? 'شكوى قيد المراجعة'
                                  : 'Réclamation en cours'
                                : status ===
                                    'completed'
                                  ? isArabic
                                    ? 'مكتمل'
                                    : 'Terminée'
                                  : status ===
                                      'refunded'
                                    ? isArabic
                                      ? 'تم الاسترجاع'
                                      : 'Remboursée'
                                    : isArabic
                                      ? 'ملغى'
                                      : 'Annulée'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="overflow-x-auto">
              <div className="flex min-w-[650px] items-start justify-between gap-2">
                {pipelineSteps.map(
                  (
                    step,
                    index,
                  ) => {
                    const active =
                      pipelineRank >=
                      index

                    return (
                      <div
                        key={
                          step.fr
                        }
                        className="flex flex-1 items-start"
                      >
                        <div className="flex min-w-0 flex-1 flex-col items-center">
                          <div
                            className={[
                              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-black',

                              active
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-400',
                            ].join(
                              ' ',
                            )}
                          >
                            {active
                              ? '✓'
                              : index +
                                1}
                          </div>

                          <p
                            className={[
                              'mt-2 text-center text-[10px] font-black',

                              active
                                ? 'text-slate-800'
                                : 'text-slate-300',
                            ].join(
                              ' ',
                            )}
                          >
                            {
                              step[
                                language
                              ]
                            }
                          </p>
                        </div>

                        {index <
                          pipelineSteps.length -
                            1 && (
                          <div
                            className={[
                              'mt-4 h-0.5 flex-1',

                              pipelineRank >
                              index
                                ? 'bg-blue-600'
                                : 'bg-slate-100',
                            ].join(
                              ' ',
                            )}
                          />
                        )}
                      </div>
                    )
                  },
                )}
              </div>
            </div>
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-4">
              {status ===
                'payment_review' && (
                <section className="rounded-[20px] border border-amber-200 bg-amber-50 p-5">
                  <h2 className="text-lg font-black text-amber-950">
                    {isArabic
                      ? 'جاري التحقق من الدفع'
                      : 'Paiement en cours de vérification'}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    {isArabic
                      ? 'استلمنا طلبك وإثبات الدفع. سيقوم فريق TEO STORE بالتحقق منه قبل بدء تجهيز الخدمة.'
                      : 'Nous avons reçu votre commande et votre preuve de paiement. TEO STORE va vérifier le paiement avant de commencer le traitement.'}
                  </p>
                </section>
              )}

              {status ===
                'payment_partial' && (
                <section className="rounded-[20px] border border-orange-200 bg-orange-50 p-5">
                  <h2 className="text-lg font-black text-orange-950">
                    {isArabic
                      ? 'الدفع غير مكتمل'
                      : 'Paiement incomplet'}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-orange-800">
                    {digitalOrder.payment_issue_reason ||
                      (
                        isArabic
                          ? 'المبلغ المستلم أقل من مبلغ الطلب.'
                          : 'Le montant reçu est inférieur au montant de la commande.'
                      )}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-[15px] bg-white p-4">
                      <p className="text-xs font-black uppercase text-slate-400">
                        {isArabic
                          ? 'تم الاستلام'
                          : 'Reçu'}
                      </p>

                      <p
                        dir="ltr"
                        className="mt-2 text-left text-base font-black text-emerald-700"
                      >
                        {formatAmount(
                          amountReceived,
                          digitalOrder.currency,
                        )}
                      </p>
                    </div>

                    <div className="rounded-[15px] bg-white p-4">
                      <p className="text-xs font-black uppercase text-slate-400">
                        {isArabic
                          ? 'المتبقي'
                          : 'Restant'}
                      </p>

                      <p
                        dir="ltr"
                        className="mt-2 text-left text-base font-black text-orange-700"
                      >
                        {formatAmount(
                          amountRemaining,
                          digitalOrder.currency,
                        )}
                      </p>
                    </div>
                  </div>

                  {paymentCompletionSubmitted ? (
                    <div className="mt-4 rounded-[16px] border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-black text-white">
                          ✓
                        </div>

                        <div>
                          <p className="text-sm font-black text-blue-950">
                            {isArabic
                              ? 'تم إرسال إثبات التكملة'
                              : 'Complément envoyé'}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-blue-700">
                            {isArabic
                              ? 'انتظر تحقق TEO STORE من المبلغ الإضافي.'
                              : 'Attendez la vérification de TEO STORE.'}
                          </p>

                          {digitalOrder.payment_completion_submitted_at && (
                            <p className="mt-2 text-xs font-semibold text-blue-500">
                              {formatDate(
                                digitalOrder.payment_completion_submitted_at,
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCompletionSenderNumber(
                          '',
                        )

                        setCompletionProofFile(
                          null,
                        )

                        setPaymentCompletionOpen(
                          true,
                        )

                        void loadPaymentReceiverNumber(
                          digitalOrder,
                        )
                      }}
                      className="mt-4 min-h-[50px] w-full rounded-[14px] bg-orange-600 px-5 text-sm font-black text-white transition hover:bg-orange-500"
                    >
                      {isArabic
                        ? 'دفع المبلغ المتبقي'
                        : 'Régler le reste'}
                    </button>
                  )}
                </section>
              )}

              {status ===
                'disputed' && (
                <section className="rounded-[18px] border border-rose-200 bg-rose-50 p-5">
                  <h2 className="text-lg font-black text-rose-950">
                    {isArabic
                      ? 'الشكوى قيد المراجعة'
                      : 'Réclamation en cours'}
                  </h2>

                  {digitalOrder.dispute_reason && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-rose-800">
                      {
                        digitalOrder.dispute_reason
                      }
                    </p>
                  )}

                  {digitalOrder.dispute_opened_at && (
                    <p className="mt-3 text-xs text-rose-600">
                      {formatDate(
                        digitalOrder.dispute_opened_at,
                      )}
                    </p>
                  )}
                </section>
              )}

              {disputeResolved && (
                <section className="overflow-hidden rounded-[18px] border border-emerald-200 bg-white shadow-sm">
                  <div className="bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-black text-white">
                        ✓
                      </div>

                      <div>
                        <h2 className="text-lg font-black text-emerald-950">
                          {isArabic
                            ? 'تم حل الشكوى'
                            : 'Réclamation résolue'}
                        </h2>

                        {digitalOrder.dispute_resolved_at && (
                          <p className="mt-1 text-xs text-emerald-700">
                            {formatDate(
                              digitalOrder.dispute_resolved_at,
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="rounded-[15px] border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-black text-emerald-950">
                        {isArabic
                          ? 'رد TEO STORE'
                          : 'Réponse de TEO STORE'}
                      </p>

                      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-emerald-900">
                        {digitalOrder.dispute_resolution ??
                          (
                            isArabic
                              ? 'تم حل المشكلة من قبل إدارة TEO STORE.'
                              : 'La réclamation a été résolue par TEO STORE.'
                          )}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {status ===
                'processing' && (
                <section className="rounded-[20px] border border-blue-200 bg-blue-50 p-5">
                  <h2 className="text-lg font-black text-blue-950">
                    {isArabic
                      ? 'طلبك قيد التجهيز'
                      : 'Votre commande est en préparation'}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-blue-800">
                    {isArabic
                      ? 'تم تأكيد الدفع ويجري الآن تجهيز الخدمة.'
                      : 'Le paiement est confirmé et votre service est en cours de préparation.'}
                  </p>
                </section>
              )}

              {(status ===
                'fulfillment_sent' ||
                status ===
                  'completed' ||
                status ===
                  'disputed') &&
                fulfillmentAvailable && (
                  <section className="overflow-hidden rounded-[20px] border border-emerald-200 bg-white shadow-sm">
                    <div className="bg-emerald-50 p-5">
                      <h2 className="text-lg font-black text-emerald-950">
                        {isArabic
                          ? 'معلومات الخدمة'
                          : 'Informations de votre service'}
                      </h2>

                      <p className="mt-1 text-xs text-emerald-700">
                        {isArabic
                          ? 'احتفظ بهذه المعلومات في مكان آمن.'
                          : 'Conservez ces informations dans un endroit sûr.'}
                      </p>
                    </div>

                    <div className="space-y-3 p-5">
                      {digitalOrder.fulfillment_email && (
                        <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase text-slate-400">
                            E-mail
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <p
                              dir="ltr"
                              className="min-w-0 break-all text-left text-sm font-black text-slate-950"
                            >
                              {
                                digitalOrder.fulfillment_email
                              }
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                void handleCopy(
                                  digitalOrder.fulfillment_email ??
                                    '',
                                )
                              }
                              className="shrink-0 rounded-[10px] bg-white px-3 py-2 text-xs font-black text-blue-600"
                            >
                              {isArabic
                                ? 'نسخ'
                                : 'Copier'}
                            </button>
                          </div>
                        </div>
                      )}

                      {digitalOrder.fulfillment_password && (
                        <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase text-slate-400">
                            {isArabic
                              ? 'كلمة المرور'
                              : 'Mot de passe'}
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            <p
                              dir="ltr"
                              className="min-w-0 flex-1 break-all text-left text-sm font-black text-slate-950"
                            >
                              {showPassword
                                ? digitalOrder.fulfillment_password
                                : '••••••••'}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword(
                                  (
                                    current,
                                  ) =>
                                    !current,
                                )
                              }
                              className="shrink-0 rounded-[10px] bg-white px-3 py-2 text-xs font-black text-slate-600"
                            >
                              {showPassword
                                ? isArabic
                                  ? 'إخفاء'
                                  : 'Masquer'
                                : isArabic
                                  ? 'إظهار'
                                  : 'Afficher'}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleCopy(
                                  digitalOrder.fulfillment_password ??
                                    '',
                                )
                              }
                              className="shrink-0 rounded-[10px] bg-white px-3 py-2 text-xs font-black text-blue-600"
                            >
                              {isArabic
                                ? 'نسخ'
                                : 'Copier'}
                            </button>
                          </div>
                        </div>
                      )}

                      {digitalOrder.fulfillment_code && (
                        <div className="rounded-[14px] border border-blue-100 bg-blue-50 p-4">
                          <p className="text-xs font-black uppercase text-blue-500">
                            {isArabic
                              ? 'الكود'
                              : 'Code'}
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <p
                              dir="ltr"
                              className="min-w-0 break-all text-left text-lg font-black text-blue-950"
                            >
                              {
                                digitalOrder.fulfillment_code
                              }
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                void handleCopy(
                                  digitalOrder.fulfillment_code ??
                                    '',
                                )
                              }
                              className="shrink-0 rounded-[10px] bg-white px-3 py-2 text-xs font-black text-blue-600"
                            >
                              {isArabic
                                ? 'نسخ'
                                : 'Copier'}
                            </button>
                          </div>
                        </div>
                      )}

                      {digitalOrder.fulfillment_link && (
                        <div className="rounded-[14px] border border-violet-100 bg-violet-50 p-4">
                          <p className="text-xs font-black uppercase text-violet-500">
                            {isArabic
                              ? 'الرابط'
                              : 'Lien'}
                          </p>

                          <a
                            href={
                              digitalOrder.fulfillment_link
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block break-all text-sm font-black text-violet-700 underline"
                          >
                            {
                              digitalOrder.fulfillment_link
                            }
                          </a>
                        </div>
                      )}

                      {digitalOrder.fulfillment_note && (
                        <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase text-slate-400">
                            {isArabic
                              ? 'ملاحظة'
                              : 'Note'}
                          </p>

                          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                            {
                              digitalOrder.fulfillment_note
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                )}

              {status ===
                'fulfillment_sent' &&
                !digitalOrder.customer_confirmed_at && (
                  <section className="rounded-[20px] border border-blue-200 bg-blue-50 p-5">
                    <h2 className="text-lg font-black text-blue-950">
                      {isArabic
                        ? 'هل استلمت الخدمة؟'
                        : 'Avez-vous reçu le service ?'}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-blue-700">
                      {isArabic
                        ? 'تحقق من المعلومات أعلاه قبل تأكيد الاستلام.'
                        : 'Vérifiez les informations ci-dessus avant de confirmer la réception.'}
                    </p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          void handleConfirmReceipt()
                        }
                        disabled={
                          isConfirmingReceipt
                        }
                        className="min-h-[48px] rounded-[14px] bg-emerald-600 px-4 text-sm font-black text-white disabled:opacity-50"
                      >
                        {isConfirmingReceipt
                          ? isArabic
                            ? 'جاري التأكيد...'
                            : 'Confirmation...'
                          : isArabic
                            ? 'نعم، استلمت الخدمة'
                            : 'Oui, service reçu'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDisputeOpen(
                            true,
                          )
                        }
                        className="min-h-[48px] rounded-[14px] border border-rose-200 bg-white px-4 text-sm font-black text-rose-600"
                      >
                        {isArabic
                          ? 'لدي مشكلة'
                          : 'J’ai un problème'}
                      </button>
                    </div>
                  </section>
                )}

              {status ===
                'completed' && (
                <section className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-5">
                  <h2 className="text-lg font-black text-emerald-950">
                    {isArabic
                      ? 'الطلب مكتمل'
                      : 'Commande terminée'}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    {isArabic
                      ? 'شكرًا لاستخدامك TEO STORE.'
                      : 'Merci d’avoir utilisé TEO STORE.'}
                  </p>
                </section>
              )}

              {status ===
                'completed' && (
                <section className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-black text-slate-950">
                    {isArabic
                      ? 'تقييم الخدمة'
                      : 'Évaluer le service'}
                  </h2>

                  {reviewLoading ? (
                    <div className="mt-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                  ) : review ? (
                    <div className="mt-4 rounded-[16px] border border-amber-100 bg-amber-50 p-4">
                      <div
                        dir="ltr"
                        className="flex gap-1"
                      >
                        {Array.from({
                          length:
                            5,
                        }).map(
                          (
                            _,
                            index,
                          ) => (
                            <span
                              key={
                                index
                              }
                              className={
                                index <
                                review.rating
                                  ? 'text-xl text-amber-500'
                                  : 'text-xl text-slate-200'
                              }
                            >
                              ★
                            </span>
                          ),
                        )}
                      </div>

                      {review.comment && (
                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                          {
                            review.comment
                          }
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div
                        dir="ltr"
                        className="mt-4 flex gap-2"
                      >
                        {Array.from({
                          length:
                            5,
                        }).map(
                          (
                            _,
                            index,
                          ) => {
                            const rating =
                              index +
                              1

                            const active =
                              rating <=
                              (
                                hoveredRating ||
                                selectedRating
                              )

                            return (
                              <button
                                key={
                                  rating
                                }
                                type="button"
                                onMouseEnter={() =>
                                  setHoveredRating(
                                    rating,
                                  )
                                }
                                onMouseLeave={() =>
                                  setHoveredRating(
                                    0,
                                  )
                                }
                                onClick={() =>
                                  setSelectedRating(
                                    rating,
                                  )
                                }
                                className={[
                                  'text-3xl transition',

                                  active
                                    ? 'text-amber-500'
                                    : 'text-slate-200',
                                ].join(
                                  ' ',
                                )}
                              >
                                ★
                              </button>
                            )
                          },
                        )}
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
                        placeholder={
                          isArabic
                            ? 'اكتب رأيك...'
                            : 'Votre commentaire...'
                        }
                        className="mt-4 w-full resize-none rounded-[14px] border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          void handleSubmitReview()
                        }
                        disabled={
                          selectedRating <
                            1 ||
                          isSubmittingReview
                        }
                        className="mt-3 min-h-[46px] rounded-[13px] bg-blue-600 px-5 text-sm font-black text-white disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        {isSubmittingReview
                          ? isArabic
                            ? 'جاري الإرسال...'
                            : 'Envoi...'
                          : isArabic
                            ? 'إرسال التقييم'
                            : 'Envoyer l’avis'}
                      </button>
                    </>
                  )}
                </section>
              )}
            </div>

            <aside className="min-w-0">
              <section className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                  {isArabic
                    ? 'ملخص الطلب'
                    : 'RÉCAPITULATIF'}
                </p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-[14px] bg-slate-50 p-3">
                    <p className="text-xs font-black text-slate-400">
                      {isArabic
                        ? 'الخدمة'
                        : 'Service'}
                    </p>

                    <p className="mt-1 break-words text-sm font-black text-slate-800">
                      {
                        serviceName
                      }
                    </p>
                  </div>

                  <div className="rounded-[14px] bg-slate-50 p-3">
                    <p className="text-xs font-black text-slate-400">
                      {isArabic
                        ? 'الخطة'
                        : 'Formule'}
                    </p>

                    <p className="mt-1 break-words text-sm font-black text-slate-800">
                      {
                        digitalOrder.plan_label
                      }
                    </p>
                  </div>

                  <div className="rounded-[14px] bg-slate-950 p-4 text-white">
                    <p className="text-xs font-black uppercase text-white/40">
                      {isArabic
                        ? 'الإجمالي'
                        : 'Total'}
                    </p>

                    <p
                      dir="ltr"
                      className="mt-2 text-left text-lg font-black"
                    >
                      {formatAmount(
                        totalAmount,
                        digitalOrder.currency,
                      )}
                    </p>
                  </div>

                  <div className="rounded-[14px] bg-slate-50 p-3">
                    <p className="text-xs font-black text-slate-400">
                      {isArabic
                        ? 'طريقة الدفع'
                        : 'Paiement'}
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-800">
                      {
                        paymentMethodName
                      }
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 text-left text-xs font-semibold text-slate-400"
                    >
                      {
                        senderNumber
                      }
                    </p>
                  </div>

                  <div className="rounded-[14px] bg-slate-50 p-3">
                    <p className="text-xs font-black text-slate-400">
                      {isArabic
                        ? 'التاريخ'
                        : 'Date'}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      {formatDate(
                        digitalOrder.created_at,
                      )}
                    </p>
                  </div>
                </div>

                <Link
                  to="/profil"
                  className="mt-4 flex min-h-[46px] items-center justify-center rounded-[13px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
                >
                  {isArabic
                    ? 'طلباتي'
                    : 'Mes commandes'}
                </Link>
              </section>
            </aside>
          </div>
        </div>
      </Container>

      {paymentCompletionOpen && (
        <div className="fixed inset-0 z-[220] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[26px] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[26px] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">
                  {isArabic
                    ? 'تكملة الدفع'
                    : 'COMPLÉMENT DE PAIEMENT'}
                </p>

                <h3 className="mt-2 text-xl font-black text-slate-950">
                  {isArabic
                    ? 'دفع المبلغ المتبقي'
                    : 'Régler le montant restant'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPaymentCompletionOpen(
                    false,
                  )
                }
                disabled={
                  isSubmittingCompletion
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-[18px] bg-slate-950 p-4 text-white">
              <p className="text-xs font-black uppercase text-white/40">
                {isArabic
                  ? 'المبلغ المتبقي'
                  : 'Montant restant'}
              </p>

              <p
                dir="ltr"
                className="mt-2 text-left text-xl font-black text-orange-300"
              >
                {formatAmount(
                  amountRemaining,
                  digitalOrder.currency,
                )}
              </p>
            </div>

            <div className="mt-4 rounded-[18px] border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase text-blue-500">
                {isArabic
                  ? 'رقم المستفيد'
                  : 'Numéro bénéficiaire'}
              </p>

              {isLoadingPaymentReceiver ? (
                <div className="mt-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
              ) : paymentReceiverNumber ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p
                    dir="ltr"
                    className="break-all text-left text-lg font-black text-blue-950"
                  >
                    {
                      paymentReceiverNumber
                    }
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      void handleCopyPaymentNumber()
                    }
                    className="shrink-0 rounded-[10px] bg-white px-3 py-2 text-xs font-black text-blue-600"
                  >
                    {copiedPaymentNumber
                      ? isArabic
                        ? 'تم النسخ ✓'
                        : 'Copié ✓'
                      : isArabic
                        ? 'نسخ'
                        : 'Copier'}
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-xs font-semibold leading-5 text-rose-600">
                  {isArabic
                    ? 'تعذر العثور على رقم وسيلة الدفع. تواصل مع TEO STORE قبل إرسال أي مبلغ.'
                    : 'Numéro de paiement indisponible. Contactez TEO STORE avant tout transfert.'}
                </p>
              )}
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-black text-slate-700">
                {isArabic
                  ? 'الرقم الذي دفعت منه'
                  : 'Numéro utilisé pour payer'}
              </span>

              <input
                dir="ltr"
                type="tel"
                value={
                  completionSenderNumber
                }
                onChange={(
                  event,
                ) =>
                  setCompletionSenderNumber(
                    event.target.value,
                  )
                }
                className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-left text-sm outline-none focus:border-blue-500 focus:bg-white"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-black text-slate-700">
                {isArabic
                  ? 'إثبات الدفع الجديد'
                  : 'Nouvelle preuve'}
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={
                  handleCompletionProofChange
                }
                className="mt-2 block w-full rounded-[14px] border border-slate-200 bg-slate-50 p-3 text-xs"
              />

              {completionProofFile && (
                <p className="mt-2 break-all text-xs font-black text-emerald-700">
                  ✓{' '}
                  {
                    completionProofFile.name
                  }
                </p>
              )}
            </label>

            <button
              type="button"
              onClick={() =>
                void handleSubmitPaymentCompletion()
              }
              disabled={
                isSubmittingCompletion ||
                !completionSenderNumber
                  .trim() ||
                !completionProofFile ||
                !paymentReceiverNumber
              }
              className="mt-5 min-h-[50px] w-full rounded-[14px] bg-orange-600 px-5 text-sm font-black text-white disabled:bg-slate-200 disabled:text-slate-400"
            >
              {isSubmittingCompletion
                ? isArabic
                  ? 'جاري الإرسال...'
                  : 'Envoi...'
                : isArabic
                  ? 'إرسال إثبات التكملة'
                  : 'Envoyer le complément'}
            </button>
          </div>
        </div>
      )}

      {disputeOpen && (
        <div className="fixed inset-0 z-[220] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[26px] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[26px] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-600">
                  TEO STORE
                </p>

                <h3 className="mt-2 text-xl font-black text-slate-950">
                  {isArabic
                    ? 'الإبلاغ عن مشكلة'
                    : 'Signaler un problème'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDisputeOpen(
                    false,
                  )
                }
                disabled={
                  isSubmittingDispute
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {disputeReasons.map(
                (
                  reason,
                ) => {
                  const selected =
                    selectedDisputeCode ===
                    reason.code

                  return (
                    <button
                      key={
                        reason.code
                      }
                      type="button"
                      onClick={() =>
                        setSelectedDisputeCode(
                          reason.code,
                        )
                      }
                      className={[
                        'w-full rounded-[15px] border p-4 text-start text-sm font-black transition',

                        selected
                          ? 'border-rose-300 bg-rose-50 text-rose-800'
                          : 'border-slate-200 bg-white text-slate-700',
                      ].join(
                        ' ',
                      )}
                    >
                      {
                        reason[
                          language
                        ]
                      }
                    </button>
                  )
                },
              )}
            </div>

            {selectedDisputeCode ===
              'other' && (
              <textarea
                rows={
                  4
                }
                value={
                  disputeDescription
                }
                onChange={(
                  event,
                ) =>
                  setDisputeDescription(
                    event.target.value,
                  )
                }
                placeholder={
                  isArabic
                    ? 'اشرح المشكلة...'
                    : 'Expliquez le problème...'
                }
                className="mt-4 w-full resize-none rounded-[14px] border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-rose-400 focus:bg-white"
              />
            )}

            <button
              type="button"
              onClick={() =>
                void handleSubmitDispute()
              }
              disabled={
                !selectedDisputeCode ||
                isSubmittingDispute ||
                (
                  selectedDisputeCode ===
                    'other' &&
                  !disputeDescription
                    .trim()
                )
              }
              className="mt-5 min-h-[50px] w-full rounded-[14px] bg-rose-600 px-5 text-sm font-black text-white disabled:bg-slate-200 disabled:text-slate-400"
            >
              {isSubmittingDispute
                ? isArabic
                  ? 'جاري الإرسال...'
                  : 'Envoi...'
                : isArabic
                  ? 'إرسال الشكوى'
                  : 'Envoyer la réclamation'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default DigitalOrderStatusPage