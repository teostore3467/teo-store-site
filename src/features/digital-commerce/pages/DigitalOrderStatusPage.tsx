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

type PaymentSettingRow = {
  setting_key: string

  setting_value:
    Record<string, unknown>
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

  /*
   * COMPLÉMENT DE PAIEMENT
   */
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

  /*
   * ÉVALUATION
   */
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
            'Unable to load order:',
            error,
          )

          setErrorMessage(
            isArabic
              ? 'تعذر تحميل الطلب.'
              : 'Impossible de charger la commande.',
          )

          setDigitalOrder(
            null,
          )
        } else if (
          !data
        ) {
          setErrorMessage(
            isArabic
              ? 'لم يتم العثور على هذا الطلب في حسابك.'
              : "Cette commande n'a pas été trouvée dans votre compte.",
          )

          setDigitalOrder(
            null,
          )
        } else {
          setDigitalOrder(
            data as
              DigitalOrderRow,
          )
        }

        setIsLoading(
          false,
        )

        setIsRefreshing(
          false,
        )
      },
      [
        isArabic,
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

        /*
         * Nouvelle commande:
         * on récupère d'abord le numéro
         * actuel depuis app_settings.
         */
        if (
          order.payment_method
        ) {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                'app_settings',
              )
              .select(
                'setting_key, setting_value',
              )
              .eq(
                'setting_key',
                `payment_${order.payment_method}`,
              )
              .maybeSingle()

          if (
            !error &&
            data
          ) {
            const row =
              data as
                PaymentSettingRow

            const number =
              readString(
                row.setting_value
                  ?.number ??
                  row.setting_value
                    ?.paymentNumber,
              )

            if (
              number
                .trim()
                .length >
              0
            ) {
              setPaymentReceiverNumber(
                number.trim(),
              )

              setIsLoadingPaymentReceiver(
                false,
              )

              return
            }
          }
        }

        /*
         * Fallback:
         * numéro mémorisé lors
         * du checkout.
         */
        const storedNumber =
          readString(
            order.customer_values
              ?.paymentReceiverNumber,
          )

        if (
          storedNumber
            .trim()
            .length >
          0
        ) {
          setPaymentReceiverNumber(
            storedNumber.trim(),
          )

          setIsLoadingPaymentReceiver(
            false,
          )

          return
        }

        /*
         * Anciennes commandes.
         */
        setPaymentReceiverNumber(
          '37109097',
        )

        setIsLoadingPaymentReceiver(
          false,
        )
      },
      [],
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
            event: '*',
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
            event: '*',
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

  const currentStep =
    pipelineSteps[
      Math.min(
        pipelineRank,
        pipelineSteps.length -
          1,
      )
    ]

  const progressPercent =
    Math.min(
      100,
      (
        (
          pipelineRank +
          1
        ) /
        pipelineSteps.length
      ) *
        100,
    )

  const statusLabel =
    useMemo(() => {
      switch (
        status
      ) {
        case 'payment_review':
          return isArabic
            ? 'جاري التحقق من الدفع'
            : 'Paiement en vérification'

        case 'payment_partial':
          return paymentCompletionSubmitted
            ? isArabic
              ? 'تم إرسال المبلغ المتبقي'
              : 'Complément envoyé'
            : isArabic
              ? 'الدفع غير مكتمل'
              : 'Paiement incomplet'

        case 'payment_confirmed':
          return isArabic
            ? 'تم تأكيد الدفع'
            : 'Paiement confirmé'

        case 'processing':
          return isArabic
            ? 'قيد التجهيز'
            : 'En préparation'

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
            ? 'مكتمل'
            : 'Terminée'

        case 'cancelled':
          return isArabic
            ? 'ملغي'
            : 'Annulée'

        case 'refunded':
          return isArabic
            ? 'تم الاسترجاع'
            : 'Remboursée'
      }
    }, [
      isArabic,
      paymentCompletionSubmitted,
      status,
    ])

  const statusClasses =
    useMemo(() => {
      if (
        status ===
        'completed'
      ) {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }

      if (
        status ===
          'cancelled' ||
        status ===
          'disputed'
      ) {
        return 'border-rose-200 bg-rose-50 text-rose-700'
      }

      if (
        status ===
        'refunded'
      ) {
        return 'border-slate-200 bg-slate-100 text-slate-700'
      }

      if (
        status ===
        'payment_partial'
      ) {
        return paymentCompletionSubmitted
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-orange-200 bg-orange-50 text-orange-700'
      }

      return 'border-blue-200 bg-blue-50 text-blue-700'
    }, [
      paymentCompletionSubmitted,
      status,
    ])

  const formatDate =
    (
      value?:
        | string
        | null,
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
            numberingSystem:
              'latn',

            dateStyle:
              'medium',

            timeStyle:
              'short',
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
      amount?:
        | number
        | null,
      currency?:
        string,
    ) => {
      if (
        typeof amount !==
        'number'
      ) {
        return '—'
      }

      const formattedNumber =
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
          amount,
        )

      return formatCurrencyText(
        `${formattedNumber} ${currency ?? 'MRU'}`,
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

      const allowed =
        [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'application/pdf',
        ]

      if (
        !allowed.includes(
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
        5 *
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
              ? 'حجم الملف يجب ألا يتجاوز 5 MB.'
              : 'La preuve ne doit pas dépasser 5 MB.',
        })

        return
      }

      setCompletionProofFile(
        file,
      )
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
        setCopiedPaymentNumber(
          false,
        )
      }
    }

  const handleSubmitPaymentCompletion =
    async () => {
      if (
        !digitalOrder ||
        status !==
          'payment_partial' ||
        paymentCompletionSubmitted ||
        !completionProofFile ||
        completionSenderNumber
          .trim()
          .length ===
          0 ||
        isSubmittingCompletion
      ) {
        return
      }

      setIsSubmittingCompletion(
        true,
      )

      let proofPath:
        string | null =
        null

      try {
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
              `/commande/${digitalOrder.order_number}`,
            )}`,
          )

          return
        }

        const extension =
          getFileExtension(
            completionProofFile,
          )

        proofPath =
          `${userData.user.id}/${digitalOrder.order_number}-completion-${Date.now()}.${extension}`

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
          throw new Error(
            uploadError.message,
          )
        }

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
          const {
            error:
              cleanupError,
          } =
            await supabase.storage
              .from(
                PAYMENT_PROOFS_BUCKET,
              )
              .remove([
                proofPath,
              ])

          if (
            cleanupError
          ) {
            console.warn(
              'Unable to cleanup completion proof:',
              cleanupError,
            )
          }

          proofPath =
            null

          throw new Error(
            completionError.message,
          )
        }

        proofPath =
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

        await loadDigitalOrder()

        showToast({
          type:
            'success',

          message:
            isArabic
              ? 'تم إرسال المبلغ المتبقي وإثبات الدفع. سيتم التحقق منه.'
              : 'Le complément et sa preuve ont été envoyés. TEO STORE va maintenant les vérifier.',
        })
      } catch (
        error
      ) {
        if (
          proofPath
        ) {
          const {
            error:
              cleanupError,
          } =
            await supabase.storage
              .from(
                PAYMENT_PROOFS_BUCKET,
              )
              .remove([
                proofPath,
              ])

          if (
            cleanupError
          ) {
            console.warn(
              'Unable to rollback completion proof:',
              cleanupError,
            )
          }
        }

        console.error(
          'Unable to submit payment completion:',
          error,
        )

        showToast({
          type:
            'error',

          message:
            error instanceof
            Error
              ? error.message
              : isArabic
                ? 'تعذر إرسال المبلغ المتبقي.'
                : "Impossible d'envoyer le complément.",
        })
      } finally {
        setIsSubmittingCompletion(
          false,
        )
      }
    }

  const handleConfirmReceipt =
    async () => {
      if (
        !digitalOrder ||
        status !==
          'fulfillment_sent' ||
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
              ? 'تعذر تأكيد استلام الخدمة.'
              : 'Impossible de confirmer la réception.',
        })

        setIsConfirmingReceipt(
          false,
        )

        return
      }

      await loadDigitalOrder()

      showToast({
        type:
          'success',

        message:
          isArabic
            ? 'تم تأكيد استلام الخدمة. يمكنك الآن تقييم طلبك.'
            : 'Réception confirmée. Vous pouvez maintenant évaluer votre commande.',
      })

      setIsConfirmingReceipt(
        false,
      )
    }

  const handleOpenDispute =
    async () => {
      if (
        !digitalOrder ||
        status !==
          'fulfillment_sent' ||
        !selectedDisputeCode ||
        disputeDescription
          .trim()
          .length <
          5 ||
        isSubmittingDispute
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
              disputeDescription.trim(),
          },
        )

      if (
        error
      ) {
        showToast({
          type:
            'error',

          message:
            isArabic
              ? 'تعذر فتح النزاع.'
              : "Impossible d'ouvrir le litige.",
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

      await loadDigitalOrder()

      showToast({
        type:
          'success',

        message:
          isArabic
            ? 'تم إرسال الشكوى إلى TEO STORE.'
            : 'Votre réclamation a été envoyée à TEO STORE.',
      })

      setIsSubmittingDispute(
        false,
      )
    }

  const handleSubmitReview =
    async () => {
      if (
        !digitalOrder ||
        status !==
          'completed' ||
        review ||
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
        setIsSubmittingReview(
          false,
        )

        navigate(
          `/connexion?redirect=${encodeURIComponent(
            `/commande/${resolvedOrderNumber}`,
          )}`,
        )

        return
      }

      const {
        data,
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
              userData.user.id,

            rating:
              selectedRating,

            comment:
              reviewComment
                .trim()
                .length >
              0
                ? reviewComment.trim()
                : null,
          })
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
          .single()

      if (
        error
      ) {
        if (
          error.code ===
          '23505'
        ) {
          await loadReview(
            digitalOrder,
          )

          showToast({
            type:
              'info',

            message:
              isArabic
                ? 'لقد قيّمت هذا الطلب بالفعل.'
                : 'Cette commande a déjà été évaluée.',
          })
        } else {
          showToast({
            type:
              'error',

            message:
              isArabic
                ? 'تعذر إرسال التقييم.'
                : "Impossible d'envoyer votre évaluation.",
          })
        }

        setIsSubmittingReview(
          false,
        )

        return
      }

      setReview(
        data as
          DigitalOrderReviewRow,
      )

      setReviewComment(
        '',
      )

      setHoveredRating(
        0,
      )

      showToast({
        type:
          'success',

        message:
          isArabic
            ? 'شكرًا لك، تم حفظ تقييمك.'
            : 'Merci, votre évaluation a été enregistrée.',
      })

      setIsSubmittingReview(
        false,
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
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-bold text-slate-500">
                {isArabic
                  ? 'جارٍ تحميل الطلب...'
                  : 'Chargement de la commande...'}
              </p>
            </div>
          </div>
        </Container>
      </main>
    )
  }

  if (
    !digitalOrder
  ) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] py-8">
        <Container>
          <div className="mx-auto max-w-lg rounded-[22px] border border-slate-200 bg-white p-6 text-center">
            <h1 className="text-xl font-black text-slate-950">
              {isArabic
                ? 'تعذر فتح الطلب'
                : 'Commande indisponible'}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {
                errorMessage
              }
            </p>

            <Link
              to="/profil"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-[13px] bg-slate-950 px-5 text-sm font-black text-white"
            >
              {isArabic
                ? 'العودة إلى حسابي'
                : 'Retour au profil'}
            </Link>
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
      className="min-h-screen bg-[#f7f9fc] py-4 sm:py-8"
    >
      {toast && (
        <div
          className={[
            'fixed top-3 z-[300] w-[calc(100%-1.5rem)] max-w-[360px]',

            isArabic
              ? 'left-3'
              : 'right-3',
          ].join(
            ' ',
          )}
        >
          <div
            className={[
              'rounded-[16px] border bg-white p-4 shadow-xl',

              toast.type ===
              'success'
                ? 'border-emerald-200'
                : toast.type ===
                    'error'
                  ? 'border-rose-200'
                  : 'border-blue-200',
            ].join(
              ' ',
            )}
          >
            <p className="text-sm font-bold leading-6 text-slate-700">
              {
                toast.message
              }
            </p>
          </div>
        </div>
      )}

      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
            <Link
              to="/"
              className="hover:text-blue-600"
            >
              {isArabic
                ? 'الرئيسية'
                : 'Accueil'}
            </Link>

            <span>
              /
            </span>

            <span className="text-slate-600">
              {isArabic
                ? 'تفاصيل الطلب'
                : 'Détails de la commande'}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-[26px] font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">
                {isArabic
                  ? 'متابعة الطلب'
                  : 'Suivi de commande'}
              </h1>

              <p
                dir="ltr"
                className="mt-1 text-left text-base font-black text-blue-600"
              >
                {
                  resolvedOrderNumber
                }
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadDigitalOrder(
                  true,
                )
              }
              disabled={
                isRefreshing
              }
              className="h-11 rounded-[12px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 disabled:opacity-50"
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

          {![
            'cancelled',
            'refunded',
          ].includes(
            status,
          ) && (
            <section className="mt-4 rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-sm sm:hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    {isArabic
                      ? 'المرحلة الحالية'
                      : 'Étape actuelle'}
                  </p>

                  <p className="mt-1 truncate text-base font-black text-slate-950">
                    {isArabic
                      ? currentStep.ar
                      : currentStep.fr}
                  </p>
                </div>

                <span
                  dir="ltr"
                  className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700"
                >
                  {Math.min(
                    pipelineRank +
                      1,
                    8,
                  )}
                  /8
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width:
                      `${progressPercent}%`,
                  }}
                />
              </div>
            </section>
          )}

          <section className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-950">
                  {
                    digitalOrder.service_name
                  }
                </h2>

                <span
                  className={[
                    'rounded-full border px-3 py-1.5 text-sm font-black',

                    statusClasses,
                  ].join(
                    ' ',
                  )}
                >
                  {
                    statusLabel
                  }
                </span>
              </div>

              <p className="mt-1 text-base text-slate-500">
                {
                  digitalOrder.plan_label
                }
              </p>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-3">
              <div className="rounded-[16px] bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-400">
                  {isArabic
                    ? 'الإجمالي'
                    : 'TOTAL'}
                </p>

                <p
                  dir="ltr"
                  className="mt-2 text-left text-lg font-black text-slate-950"
                >
                  {formatAmount(
                    digitalOrder.total_amount,
                    digitalOrder.currency,
                  )}
                </p>
              </div>

              <div className="rounded-[16px] bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-400">
                  {isArabic
                    ? 'الدفع'
                    : 'PAIEMENT'}
                </p>

                <p className="mt-2 text-base font-black text-slate-950">
                  {digitalOrder.payment_method_name ??
                    '—'}
                </p>
              </div>

              <div className="rounded-[16px] bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-400">
                  {isArabic
                    ? 'التاريخ'
                    : 'DATE'}
                </p>

                <p className="mt-2 text-base font-black text-slate-950">
                  {formatDate(
                    digitalOrder.created_at,
                  )}
                </p>
              </div>
            </div>
          </section>

          {status ===
            'payment_partial' && (
            <section className="mt-4 overflow-hidden rounded-[20px] border border-orange-200 bg-white shadow-sm">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 font-black text-orange-600">
                    !
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      {paymentCompletionSubmitted
                        ? isArabic
                          ? 'تم إرسال المبلغ المتبقي'
                          : 'Complément envoyé'
                        : isArabic
                          ? 'الدفع غير مكتمل'
                          : 'Paiement incomplet'}
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {paymentCompletionSubmitted
                        ? isArabic
                          ? 'تم استلام إثبات الدفع الجديد وهو الآن في انتظار مراجعة TEO STORE.'
                          : 'Votre nouvelle preuve de paiement a été envoyée et attend maintenant la vérification de TEO STORE.'
                        : isArabic
                          ? 'أرسل المبلغ المتبقي لإكمال دفع طلبك.'
                          : 'Réglez le montant restant pour poursuivre votre commande.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[16px] bg-emerald-50 p-4">
                    <p className="text-xs font-black uppercase text-emerald-600">
                      {isArabic
                        ? 'تم استلام'
                        : 'REÇU'}
                    </p>

                    <p
                      dir="ltr"
                      className="mt-2 text-left text-lg font-black text-emerald-800"
                    >
                      {formatAmount(
                        digitalOrder.amount_received,
                        digitalOrder.currency,
                      )}
                    </p>
                  </div>

                  <div className="rounded-[16px] bg-orange-50 p-4">
                    <p className="text-xs font-black uppercase text-orange-600">
                      {isArabic
                        ? 'المتبقي'
                        : 'RESTANT'}
                    </p>

                    <p
                      dir="ltr"
                      className="mt-2 text-left text-lg font-black text-orange-800"
                    >
                      {formatAmount(
                        digitalOrder.amount_remaining,
                        digitalOrder.currency,
                      )}
                    </p>
                  </div>
                </div>

                {digitalOrder.payment_issue_reason && (
                  <div className="mt-4 rounded-[15px] border border-orange-100 bg-orange-50/60 p-4">
                    <p className="text-sm leading-6 text-orange-800">
                      {
                        digitalOrder.payment_issue_reason
                      }
                    </p>
                  </div>
                )}

                {paymentCompletionSubmitted ? (
                  <div className="mt-4 rounded-[16px] border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-black text-white">
                        ✓
                      </div>

                      <div>
                        <p className="text-base font-black text-blue-950">
                          {isArabic
                            ? 'إثبات التكملة تم إرساله'
                            : 'Preuve du complément envoyée'}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-blue-700">
                          {isArabic
                            ? 'لا ترسل دفعة أخرى الآن. انتظر مراجعة TEO STORE.'
                            : 'Ne renvoyez pas un autre paiement maintenant. Attendez la vérification de TEO STORE.'}
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
              </div>
            </section>
          )}

          {status ===
            'disputed' && (
            <section className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 p-5">
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
            <section className="mt-4 overflow-hidden rounded-[18px] border border-emerald-200 bg-white shadow-sm">
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
                          ? 'تم تسجيل حل المشكلة.'
                          : 'La résolution du problème a été enregistrée.'
                      )}
                  </p>
                </div>
              </div>
            </section>
          )}

          {(status ===
            'fulfillment_sent' ||
            status ===
              'disputed' ||
            status ===
              'completed') && (
            <section className="mt-4 overflow-hidden rounded-[20px] border border-violet-200 bg-white">
              <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-5 text-white">
                <p className="text-xs font-black uppercase text-white/60">
                  TEO STORE DELIVERY
                </p>

                <h2 className="mt-1.5 text-xl font-black">
                  {isArabic
                    ? 'معلومات الخدمة'
                    : 'Informations de livraison'}
                </h2>
              </div>

              <div className="p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {digitalOrder.fulfillment_email && (
                    <div className="rounded-[14px] bg-slate-50 p-4">
                      <p className="text-xs font-black text-slate-400">
                        {isArabic
                          ? 'البريد الإلكتروني'
                          : 'E-MAIL'}
                      </p>

                      <p
                        dir="ltr"
                        className="mt-2 break-all text-left text-sm font-black text-slate-950"
                      >
                        {
                          digitalOrder.fulfillment_email
                        }
                      </p>
                    </div>
                  )}

                  {digitalOrder.fulfillment_password && (
                    <div className="rounded-[14px] bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black text-slate-400">
                          {isArabic
                            ? 'كلمة المرور'
                            : 'MOT DE PASSE'}
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
                          className="text-xs font-black text-blue-600"
                        >
                          {showPassword
                            ? isArabic
                              ? 'إخفاء'
                              : 'Masquer'
                            : isArabic
                              ? 'إظهار'
                              : 'Afficher'}
                        </button>
                      </div>

                      <p
                        dir="ltr"
                        className="mt-2 break-all text-left text-sm font-black text-slate-950"
                      >
                        {showPassword
                          ? digitalOrder.fulfillment_password
                          : '••••••••'}
                      </p>
                    </div>
                  )}

                  {digitalOrder.fulfillment_code && (
                    <div className="rounded-[14px] bg-blue-50 p-4">
                      <p className="text-xs font-black text-blue-500">
                        {isArabic
                          ? 'الكود'
                          : 'CODE'}
                      </p>

                      <p
                        dir="ltr"
                        className="mt-2 break-all text-left text-sm font-black text-blue-700"
                      >
                        {
                          digitalOrder.fulfillment_code
                        }
                      </p>
                    </div>
                  )}

                  {digitalOrder.fulfillment_link && (
                    <div className="rounded-[14px] bg-blue-50 p-4">
                      <p className="text-xs font-black text-blue-500">
                        {isArabic
                          ? 'الرابط'
                          : 'LIEN'}
                      </p>

                      <a
                        href={
                          digitalOrder.fulfillment_link
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block break-all text-sm font-black text-blue-700 underline"
                      >
                        {
                          digitalOrder.fulfillment_link
                        }
                      </a>
                    </div>
                  )}
                </div>

                {digitalOrder.fulfillment_note && (
                  <div className="mt-3 rounded-[14px] border border-slate-200 p-4">
                    <p className="text-xs font-black text-slate-400">
                      {isArabic
                        ? 'ملاحظة التسليم'
                        : 'NOTE DE LIVRAISON'}
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                      {
                        digitalOrder.fulfillment_note
                      }
                    </p>
                  </div>
                )}

                {status ===
                  'fulfillment_sent' && (
                  <div
                    className={[
                      'mt-4 grid gap-2',

                      disputeResolved
                        ? 'grid-cols-1'
                        : 'sm:grid-cols-2',
                    ].join(
                      ' ',
                    )}
                  >
                    {!disputeResolved && (
                      <button
                        type="button"
                        onClick={() =>
                          setDisputeOpen(
                            true,
                          )
                        }
                        className="h-12 rounded-[13px] border border-rose-200 text-sm font-black text-rose-600"
                      >
                        {isArabic
                          ? 'هناك مشكلة'
                          : 'Signaler un problème'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        void handleConfirmReceipt()
                      }
                      disabled={
                        isConfirmingReceipt
                      }
                      className="h-12 rounded-[13px] bg-emerald-600 text-sm font-black text-white disabled:opacity-50"
                    >
                      {isConfirmingReceipt
                        ? isArabic
                          ? 'جارٍ التأكيد...'
                          : 'Confirmation...'
                        : disputeResolved
                          ? isArabic
                            ? 'تم حل المشكلة، تأكيد الاستلام'
                            : 'Problème résolu, confirmer la réception'
                          : isArabic
                            ? 'تأكيد الاستلام'
                            : 'Confirmer la réception'}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {status ===
            'completed' && (
            <>
              <section className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-black text-white">
                    ✓
                  </span>

                  <div>
                    <h2 className="text-lg font-black text-emerald-950">
                      {isArabic
                        ? 'تم إكمال الطلب بنجاح'
                        : 'Commande terminée'}
                    </h2>

                    <p className="mt-1 text-sm text-emerald-700">
                      {isArabic
                        ? 'تم تأكيد استلام الخدمة.'
                        : 'La réception du service a été confirmée.'}
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-4 overflow-hidden rounded-[20px] border border-amber-200 bg-white shadow-sm">
                <div className="border-b border-amber-100 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-700">
                    {isArabic
                      ? 'التقييم'
                      : 'ÉVALUATION CLIENT'}
                  </p>

                  <h2 className="mt-1 text-lg font-black text-slate-950">
                    {review
                      ? isArabic
                        ? 'شكرًا على تقييمك'
                        : 'Merci pour votre évaluation'
                      : isArabic
                        ? 'قيّم طلبك'
                        : 'Évaluez votre commande'}
                  </h2>
                </div>

                <div className="p-4 sm:p-5">
                  {reviewLoading ? (
                    <div className="flex min-h-[100px] items-center justify-center">
                      <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
                    </div>
                  ) : review ? (
                    <div>
                      <div
                        dir="ltr"
                        className="flex justify-start gap-1"
                      >
                        {[1, 2, 3, 4, 5].map(
                          (
                            star,
                          ) => (
                            <span
                              key={
                                star
                              }
                              className={[
                                'text-3xl',

                                star <=
                                review.rating
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

                      <p
                        dir="ltr"
                        className="mt-2 text-left text-sm font-black text-slate-900"
                      >
                        {
                          review.rating
                        }
                        /5
                      </p>

                      {review.comment && (
                        <div className="mt-4 rounded-[15px] border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            {isArabic
                              ? 'تعليقك'
                              : 'Votre commentaire'}
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {
                              review.comment
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div
                        dir="ltr"
                        className="flex justify-start gap-1"
                        onMouseLeave={() =>
                          setHoveredRating(
                            0,
                          )
                        }
                      >
                        {[1, 2, 3, 4, 5].map(
                          (
                            star,
                          ) => {
                            const active =
                              star <=
                              (
                                hoveredRating ||
                                selectedRating
                              )

                            return (
                              <button
                                key={
                                  star
                                }
                                type="button"
                                onMouseEnter={() =>
                                  setHoveredRating(
                                    star,
                                  )
                                }
                                onClick={() =>
                                  setSelectedRating(
                                    star,
                                  )
                                }
                                className={[
                                  'flex h-11 w-11 items-center justify-center rounded-[12px] text-[30px] transition',

                                  active
                                    ? 'text-amber-400'
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
                        rows={4}
                        maxLength={
                          1000
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
                            ? 'أخبرنا عن تجربتك...'
                            : 'Parlez-nous de votre expérience...'
                        }
                        className="mt-4 w-full resize-none rounded-[15px] border border-slate-200 bg-slate-50 p-3 text-sm leading-6 outline-none focus:border-amber-400"
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
                        className="mt-4 h-12 w-full rounded-[14px] bg-amber-500 text-sm font-black text-slate-950 disabled:opacity-40"
                      >
                        {isSubmittingReview
                          ? isArabic
                            ? 'جارٍ الإرسال...'
                            : 'Envoi...'
                          : isArabic
                            ? 'إرسال التقييم'
                            : 'Envoyer l’évaluation'}
                      </button>
                    </>
                  )}
                </div>
              </section>
            </>
          )}

          {status ===
            'cancelled' && (
            <section className="mt-4 rounded-[18px] border border-rose-200 bg-white p-4">
              <h2 className="text-lg font-black text-slate-950">
                {isArabic
                  ? 'تم إلغاء الطلب'
                  : 'Commande annulée'}
              </h2>

              <p className="mt-2 text-sm text-rose-700">
                {digitalOrder.rejection_reason ??
                  (
                    isArabic
                      ? 'لم يتم تحديد سبب.'
                      : 'Aucun motif détaillé.'
                  )}
              </p>
            </section>
          )}

          {status ===
            'refunded' && (
            <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-black text-slate-950">
                {isArabic
                  ? 'تم تسجيل الاسترجاع'
                  : 'Commande remboursée'}
              </h2>

              {digitalOrder.dispute_resolution && (
                <div className="mt-3 rounded-[14px] bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-700">
                    {isArabic
                      ? 'رسالة TEO STORE'
                      : 'Réponse de TEO STORE'}
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {
                      digitalOrder.dispute_resolution
                    }
                  </p>
                </div>
              )}
            </section>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              to="/profil"
              className="flex h-12 items-center justify-center rounded-[13px] bg-slate-950 px-4 text-sm font-black text-white"
            >
              {isArabic
                ? 'طلباتي'
                : 'Mes commandes'}
            </Link>

            <Link
              to="/services-numeriques"
              className="flex h-12 items-center justify-center rounded-[13px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
            >
              {isArabic
                ? 'العودة إلى الخدمات'
                : 'Continuer mes achats'}
            </Link>
          </div>
        </div>
      </Container>

      {paymentCompletionOpen && (
        <div className="fixed inset-0 z-[280] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 sm:max-w-lg sm:rounded-[28px] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">
                  {isArabic
                    ? 'إكمال الدفع'
                    : 'COMPLÉMENT DE PAIEMENT'}
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {isArabic
                    ? 'دفع المبلغ المتبقي'
                    : 'Régler le reste'}
                </h2>

                <p
                  dir="ltr"
                  className="mt-1 text-left text-sm font-black text-blue-600"
                >
                  {
                    digitalOrder.order_number
                  }
                </p>
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-[18px] bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-wide text-white/40">
                {isArabic
                  ? 'المبلغ المتبقي'
                  : 'MONTANT RESTANT'}
              </p>

              <p
                dir="ltr"
                className="mt-2 text-left text-3xl font-black"
              >
                {formatAmount(
                  digitalOrder.amount_remaining,
                  digitalOrder.currency,
                )}
              </p>
            </div>

            <div className="mt-4 rounded-[18px] border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-blue-500">
                    {isArabic
                      ? 'طريقة الدفع'
                      : 'MOYEN DE PAIEMENT'}
                  </p>

                  <p className="mt-1 text-base font-black text-slate-950">
                    {digitalOrder.payment_method_name ??
                      '—'}
                  </p>
                </div>

                {isLoadingPaymentReceiver && (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                )}
              </div>

              <div className="mt-4 rounded-[14px] bg-white p-4">
                <p className="text-xs font-black uppercase text-slate-400">
                  {isArabic
                    ? 'رقم الدفع'
                    : 'NUMÉRO DE PAIEMENT'}
                </p>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <p
                    dir="ltr"
                    className="text-left text-xl font-black text-slate-950"
                  >
                    {paymentReceiverNumber ||
                      '—'}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      void handleCopyPaymentNumber()
                    }
                    disabled={
                      !paymentReceiverNumber
                    }
                    className="rounded-[11px] border border-blue-200 px-3 py-2 text-xs font-black text-blue-600 disabled:opacity-40"
                  >
                    {copiedPaymentNumber
                      ? isArabic
                        ? 'تم النسخ'
                        : 'Copié'
                      : isArabic
                        ? 'نسخ'
                        : 'Copier'}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-blue-700">
                {isArabic
                  ? 'أرسل فقط المبلغ المتبقي إلى هذا الرقم، ثم أضف إثبات الدفع الجديد.'
                  : 'Envoyez uniquement le montant restant sur ce numéro, puis ajoutez la nouvelle preuve du paiement.'}
              </p>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-black text-slate-700">
                {isArabic
                  ? 'الرقم المستخدم لإرسال التكملة'
                  : 'Numéro utilisé pour le complément'}
              </span>

              <input
                type="tel"
                dir="ltr"
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
                placeholder="22 00 00 00"
                className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-left text-sm font-bold outline-none focus:border-blue-500 focus:bg-white"
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-black text-slate-700">
                {isArabic
                  ? 'إثبات الدفع الجديد'
                  : 'Nouvelle preuve de paiement'}
              </span>

              <div
                className={[
                  'mt-2 rounded-[16px] border border-dashed p-4',

                  completionProofFile
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-300 bg-slate-50',
                ].join(
                  ' ',
                )}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={
                    handleCompletionProofChange
                  }
                  disabled={
                    isSubmittingCompletion
                  }
                  className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-[10px] file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-black file:text-white"
                />

                {completionProofFile && (
                  <p className="mt-3 break-all text-sm font-black text-emerald-700">
                    ✓{' '}
                    {
                      completionProofFile.name
                    }
                  </p>
                )}
              </div>
            </label>

            <div className="mt-6 grid grid-cols-2 gap-2">
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
                className="h-12 rounded-[14px] border border-slate-200 text-sm font-black text-slate-700"
              >
                {isArabic
                  ? 'إلغاء'
                  : 'Annuler'}
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleSubmitPaymentCompletion()
                }
                disabled={
                  isSubmittingCompletion ||
                  completionSenderNumber
                    .trim()
                    .length ===
                    0 ||
                  !completionProofFile
                }
                className="h-12 rounded-[14px] bg-blue-600 text-sm font-black text-white disabled:opacity-40"
              >
                {isSubmittingCompletion
                  ? isArabic
                    ? 'جارٍ الإرسال...'
                    : 'Envoi...'
                  : isArabic
                    ? 'إرسال التكملة'
                    : 'Envoyer le complément'}
              </button>
            </div>
          </div>
        </div>
      )}

      {disputeOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[22px] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-slate-950">
                {isArabic
                  ? 'ما المشكلة؟'
                  : 'Quel est le problème ?'}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setDisputeOpen(
                    false,
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-500"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {disputeReasons.map(
                (
                  reason,
                ) => (
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
                      'w-full rounded-[13px] border p-3 text-start text-sm font-black',

                      selectedDisputeCode ===
                      reason.code
                        ? 'border-rose-300 bg-rose-50'
                        : 'border-slate-200',
                    ].join(
                      ' ',
                    )}
                  >
                    {isArabic
                      ? reason.ar
                      : reason.fr}
                  </button>
                ),
              )}
            </div>

            <textarea
              rows={4}
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
              className="mt-4 w-full resize-none rounded-[14px] border border-slate-200 bg-slate-50 p-3 text-sm outline-none"
              placeholder={
                isArabic
                  ? 'اشرح المشكلة...'
                  : 'Expliquez le problème...'
              }
            />

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setDisputeOpen(
                    false,
                  )
                }
                className="h-11 rounded-[13px] border border-slate-200 text-sm font-black"
              >
                {isArabic
                  ? 'إلغاء'
                  : 'Annuler'}
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleOpenDispute()
                }
                disabled={
                  !selectedDisputeCode ||
                  disputeDescription
                    .trim()
                    .length <
                    5 ||
                  isSubmittingDispute
                }
                className="h-11 rounded-[13px] bg-rose-600 text-sm font-black text-white disabled:opacity-40"
              >
                {isSubmittingDispute
                  ? isArabic
                    ? 'جارٍ الإرسال...'
                    : 'Envoi...'
                  : isArabic
                    ? 'إرسال'
                    : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default DigitalOrderStatusPage