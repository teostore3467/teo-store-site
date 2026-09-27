import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  supabase,
} from '../../../lib/supabase'

type PaymentStatus =
  | 'payment_review'
  | 'payment_partial'
  | 'payment_confirmed'
  | 'processing'
  | 'fulfillment_sent'
  | 'disputed'
  | 'completed'
  | 'cancelled'
  | 'refunded'

type PaymentFilter =
  | 'all'
  | 'payment_review'
  | 'payment_partial'
  | 'payment_confirmed'
  | 'cancelled'
  | 'refunded'

type PaymentMethod = {
  id:
    | 'bankily'
    | 'masrvi'
    | 'sedad'
  name: string
  shortName: string
  paymentNumber: string
  status:
    | 'active'
    | 'inactive'
}

type DigitalOrderRow = {
  id: string
  order_number: string

  user_id?:
    | string
    | null

  customer_name?:
    | string
    | null

  customer_phone?:
    | string
    | null

  customer_email?:
    | string
    | null

  service_name: string
  plan_label: string

  total_amount: number
  currency: string

  amount_received?:
    | number
    | null

  amount_remaining?:
    | number
    | null

  payment_method_name:
    | string
    | null

  payment_sender_number?:
    | string
    | null

  payment_proof_path?:
    | string
    | null

  status: string

  rejection_code?:
    | string
    | null

  rejection_reason?:
    | string
    | null

  rejected_at?:
    | string
    | null

  payment_issue_code?:
    | string
    | null

  payment_issue_reason?:
    | string
    | null

  payment_issue_at?:
    | string
    | null

  payment_completion_requested_at?:
    | string
    | null

  created_at: string

  updated_at?:
    | string
    | null
}

type RejectionPreset = {
  code: string

  label: {
    fr: string
  }

  description: {
    fr: string
  }
}

type ToastState = {
  type:
    | 'success'
    | 'error'
    | 'info'

  title: string
  message?: string
}

type ConfirmationState =
  | {
      type:
        'confirm-payment'

      order:
        DigitalOrderRow
    }
  | null

const PAYMENT_PROOFS_BUCKET =
  'payment-proofs'

const paymentMethods:
  PaymentMethod[] = [
    {
      id: 'bankily',
      name: 'Bankily',
      shortName: 'BA',
      paymentNumber:
        '37109097',
      status: 'active',
    },
    {
      id: 'masrvi',
      name: 'Masrvi',
      shortName: 'MA',
      paymentNumber:
        '37109097',
      status: 'active',
    },
    {
      id: 'sedad',
      name: 'Sedad',
      shortName: 'SE',
      paymentNumber:
        '37109097',
      status: 'active',
    },
  ]

const rejectionPresets:
  RejectionPreset[] = [
    {
      code:
        'proof_unreadable',

      label: {
        fr:
          'Preuve illisible',
      },

      description: {
        fr:
          'La preuve de paiement envoyée est illisible ou incomplète.',
      },
    },
    {
      code:
        'payment_not_found',

      label: {
        fr:
          'Paiement introuvable',
      },

      description: {
        fr:
          "Nous n'avons pas pu retrouver ce paiement avec les informations fournies.",
      },
    },
    {
      code:
        'sender_number_mismatch',

      label: {
        fr:
          'Numéro incorrect',
      },

      description: {
        fr:
          'Le numéro utilisé pour le paiement ne correspond pas aux informations envoyées.',
      },
    },
    {
      code:
        'duplicate_payment',

      label: {
        fr:
          'Paiement déjà utilisé',
      },

      description: {
        fr:
          'Cette preuve ou cette transaction semble déjà associée à une autre commande.',
      },
    },
    {
      code:
        'invalid_proof',

      label: {
        fr:
          'Preuve non valide',
      },

      description: {
        fr:
          "La preuve envoyée ne permet pas de confirmer qu'un paiement valide a été effectué.",
      },
    },
    {
      code:
        'other',

      label: {
        fr:
          'Autre raison',
      },

      description: {
        fr:
          'Indiquez manuellement le motif du refus.',
      },
    },
  ]

function normalizeStatus(
  value: string,
): PaymentStatus {
  if (
    value ===
      'payment_partial' ||
    value ===
      'payment_confirmed' ||
    value ===
      'processing' ||
    value ===
      'fulfillment_sent' ||
    value ===
      'disputed' ||
    value ===
      'completed' ||
    value ===
      'cancelled' ||
    value ===
      'refunded'
  ) {
    return value
  }

  return 'payment_review'
}

function AdminPaymentsPage() {
  const navigate =
    useNavigate()

  const locale =
    'fr-FR-u-nu-latn'

  const [
    orders,
    setOrders,
  ] =
    useState<
      DigitalOrderRow[]
    >([])

  const [
    previewOrder,
    setPreviewOrder,
  ] =
    useState<
      DigitalOrderRow | null
    >(null)

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState<
      string | null
    >(null)

  const [
    proofLoadingOrderId,
    setProofLoadingOrderId,
  ] =
    useState<
      string | null
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
    searchQuery,
    setSearchQuery,
  ] =
    useState('')

  const [
    filter,
    setFilter,
  ] =
    useState<PaymentFilter>(
      'all',
    )

  const [
    processingOrderId,
    setProcessingOrderId,
  ] =
    useState<
      string | null
    >(null)

  const [
    rejectionOrder,
    setRejectionOrder,
  ] =
    useState<
      DigitalOrderRow | null
    >(null)

  const [
    partialOrder,
    setPartialOrder,
  ] =
    useState<
      DigitalOrderRow | null
    >(null)

  const [
    selectedRejectionCode,
    setSelectedRejectionCode,
  ] =
    useState(
      rejectionPresets[0]
        .code,
    )

  const [
    customRejectionReason,
    setCustomRejectionReason,
  ] =
    useState('')

  const [
    amountReceivedInput,
    setAmountReceivedInput,
  ] =
    useState('')

  const [
    partialNote,
    setPartialNote,
  ] =
    useState('')

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(null)

  const [
    toast,
    setToast,
  ] =
    useState<
      ToastState | null
    >(null)

  const [
    confirmation,
    setConfirmation,
  ] =
    useState<
      ConfirmationState
    >(null)

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

  /**
   * IMPORTANT:
   * - initial=true:
   *   spinner seulement au premier chargement.
   *
   * - refresh=true:
   *   spinner uniquement sur le bouton Actualiser.
   *
   * - sinon:
   *   mise à jour silencieuse pour Realtime / focus.
   */
  const loadPayments =
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
          setIsLoading(
            true,
          )
        }

        if (refresh) {
          setIsRefreshing(
            true,
          )
        }

        setErrorMessage(
          null,
        )

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
                customer_name,
                customer_phone,
                customer_email,
                service_name,
                plan_label,
                total_amount,
                currency,
                amount_received,
                amount_remaining,
                payment_method_name,
                payment_sender_number,
                payment_proof_path,
                status,
                rejection_code,
                rejection_reason,
                rejected_at,
                payment_issue_code,
                payment_issue_reason,
                payment_issue_at,
                payment_completion_requested_at,
                created_at,
                updated_at
              `,
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
            'Unable to load payments:',
            error,
          )

          setErrorMessage(
            `Impossible de charger les paiements. ${error.message}`,
          )

          setIsLoading(
            false,
          )

          setIsRefreshing(
            false,
          )

          return
        }

        setOrders(
          (data ??
            []) as DigitalOrderRow[],
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
    let active = true

    void loadPayments({
      initial: true,
    })

    /**
     * Realtime reste actif.
     * Il n'affiche aucun spinner.
     */
    const channel =
      supabase
        .channel(
          `admin-payments-${Date.now()}`,
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
          () => {
            if (!active) {
              return
            }

            void loadPayments()
          },
        )
        .subscribe()

    /**
     * Pas de setInterval.
     *
     * On actualise uniquement
     * quand l'admin revient
     * sur l'onglet.
     */
    const handleFocus =
      () => {
        if (!active) {
          return
        }

        void loadPayments()
      }

    const handleVisibility =
      () => {
        if (
          !active ||
          document.visibilityState !==
            'visible'
        ) {
          return
        }

        void loadPayments()
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
          channel,
        )
    }
  }, [
    loadPayments,
  ])

  const paymentOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            Boolean(
              order.payment_method_name,
            ),
        ),
      [
        orders,
      ],
    )

  const isConfirmedLifecycle =
    (
      status:
        PaymentStatus,
    ) =>
      [
        'payment_confirmed',
        'processing',
        'fulfillment_sent',
        'disputed',
        'completed',
      ].includes(
        status,
      )

  const filteredOrders =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase()

      return paymentOrders.filter(
        (
          order,
        ) => {
          const status =
            normalizeStatus(
              order.status,
            )

          let matchesFilter =
            true

          if (
            filter ===
            'payment_confirmed'
          ) {
            matchesFilter =
              isConfirmedLifecycle(
                status,
              )
          } else if (
            filter !==
            'all'
          ) {
            matchesFilter =
              status ===
              filter
          }

          const searchableValues =
            [
              order.order_number,
              order.service_name,
              order.plan_label,
              order.customer_name,
              order.customer_phone,
              order.customer_email,
              order.payment_method_name,
              order.payment_sender_number,
            ]

          const matchesSearch =
            query.length ===
              0 ||
            searchableValues.some(
              (
                value,
              ) =>
                value
                  ?.toLowerCase()
                  .includes(
                    query,
                  ),
            )

          return (
            matchesFilter &&
            matchesSearch
          )
        },
      )
    }, [
      filter,
      paymentOrders,
      searchQuery,
    ])

  const stats =
    useMemo(() => {
      const review =
        paymentOrders.filter(
          (order) =>
            normalizeStatus(
              order.status,
            ) ===
            'payment_review',
        )

      const partial =
        paymentOrders.filter(
          (order) =>
            normalizeStatus(
              order.status,
            ) ===
            'payment_partial',
        )

      const confirmed =
        paymentOrders.filter(
          (order) =>
            isConfirmedLifecycle(
              normalizeStatus(
                order.status,
              ),
            ),
        )

      const remainingAmount =
        partial.reduce(
          (
            total,
            order,
          ) =>
            total +
            Number(
              order.amount_remaining ??
                0,
            ),
          0,
        )

      const confirmedAmount =
        confirmed.reduce(
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
        review:
          review.length,

        partial:
          partial.length,

        confirmed:
          confirmed.length,

        remainingAmount,

        confirmedAmount,
      }
    }, [
      paymentOrders,
    ])

  const activeFilters =
    searchQuery
      .trim()
      .length >
      0 ||
    filter !==
      'all'

  const clearFilters =
    () => {
      setSearchQuery(
        '',
      )

      setFilter(
        'all',
      )
    }

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

  const formatCurrencyLabel =
    (
      currency: string,
    ) => {
      if (
        currency
          .trim()
          .toUpperCase() ===
        'MRU'
      ) {
        return 'MRU'
      }

      return currency
    }

  const formatAmount =
    (
      amount: number,
      currency =
        'MRU',
    ) =>
      `${formatNumber(
        amount || 0,
        2,
      )} ${formatCurrencyLabel(
        currency,
      )}`

  const formatDate =
    (
      value:
        | string
        | null
        | undefined,
    ) => {
      if (!value) {
        return '—'
      }

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

  const getProofFileName =
    (
      path:
        | string
        | null
        | undefined,
    ) => {
      if (!path) {
        return 'Aucun fichier'
      }

      const parts =
        path.split('/')

      return (
        parts[
          parts.length -
            1
        ] ||
        'Preuve de paiement'
      )
    }

  const getStatusLabel =
    (
      value: string,
    ) => {
      const status =
        normalizeStatus(
          value,
        )

      const labels:
        Record<
          PaymentStatus,
          string
        > = {
        payment_review:
          'À vérifier',

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
          'Terminée',

        cancelled:
          'Refusée',

        refunded:
          'Remboursée',
      }

      return labels[
        status
      ]
    }

  const getStatusClasses =
    (
      value: string,
    ) => {
      const status =
        normalizeStatus(
          value,
        )

      const classes:
        Record<
          PaymentStatus,
          string
        > = {
        payment_review:
          'border-amber-200 bg-amber-50 text-amber-700',

        payment_partial:
          'border-orange-200 bg-orange-50 text-orange-700',

        payment_confirmed:
          'border-blue-200 bg-blue-50 text-blue-700',

        processing:
          'border-indigo-200 bg-indigo-50 text-indigo-700',

        fulfillment_sent:
          'border-violet-200 bg-violet-50 text-violet-700',

        disputed:
          'border-rose-200 bg-rose-50 text-rose-700',

        completed:
          'border-emerald-200 bg-emerald-50 text-emerald-700',

        cancelled:
          'border-rose-200 bg-rose-50 text-rose-700',

        refunded:
          'border-slate-200 bg-slate-100 text-slate-600',
      }

      return classes[
        status
      ]
    }

  const openProof =
    async (
      order:
        DigitalOrderRow,
    ) => {
      if (
        !order.payment_proof_path
      ) {
        showToast({
          type:
            'info',

          title:
            'Aucune preuve disponible',

          message:
            'Aucune image de paiement n’est enregistrée pour cette commande.',
        })

        return
      }

      if (
        proofLoadingOrderId
      ) {
        return
      }

      setProofLoadingOrderId(
        order.id,
      )

      const {
        data,
        error,
      } =
        await supabase.storage
          .from(
            PAYMENT_PROOFS_BUCKET,
          )
          .createSignedUrl(
            order.payment_proof_path,
            60 * 5,
          )

      setProofLoadingOrderId(
        null,
      )

      if (
        error ||
        !data?.signedUrl
      ) {
        console.error(
          'Unable to create proof URL:',
          error,
        )

        showToast({
          type:
            'error',

          title:
            'Impossible d’ouvrir la preuve',

          message:
            error?.message ??
            'Le fichier privé ne peut pas être affiché.',
        })

        return
      }

      setPreviewOrder(
        order,
      )

      setPreviewUrl(
        data.signedUrl,
      )
    }

  const closePreview =
    () => {
      setPreviewOrder(
        null,
      )

      setPreviewUrl(
        null,
      )
    }

  const requestConfirmPayment =
    (
      order:
        DigitalOrderRow,
    ) => {
      if (
        processingOrderId
      ) {
        return
      }

      setConfirmation({
        type:
          'confirm-payment',

        order,
      })
    }

  /**
   * Paiement confirmé:
   *
   * 1. paiement_confirmed
   * 2. fermeture des fenêtres
   * 3. redirection automatique
   *    vers Commandes à traiter
   */
  const handleConfirmPayment =
    async (
      order:
        DigitalOrderRow,
    ) => {
      if (
        processingOrderId
      ) {
        return
      }

      setConfirmation(
        null,
      )

      setProcessingOrderId(
        order.id,
      )

      try {
        const now =
          new Date().toISOString()

        const {
          error,
        } =
          await supabase
            .from(
              'digital_orders',
            )
            .update({
              status:
                'payment_confirmed',

              amount_received:
                order.total_amount,

              amount_remaining:
                0,

              payment_issue_code:
                null,

              payment_issue_reason:
                null,

              payment_issue_at:
                null,

              payment_completion_requested_at:
                null,

              rejection_code:
                null,

              rejection_reason:
                null,

              rejected_at:
                null,

              updated_at:
                now,
            })
            .eq(
              'id',
              order.id,
            )

        if (error) {
          throw error
        }

        /**
         * Fermer la preuve si elle
         * était encore ouverte.
         */
        setPreviewOrder(
          null,
        )

        setPreviewUrl(
          null,
        )

        /**
         * Pas besoin de recharger
         * AdminPayments:
         * nous quittons cette page.
         *
         * Le numéro est envoyé dans:
         * - l'URL
         * - location.state
         *
         * Cela permettra à AdminOrdersPage
         * d'ouvrir automatiquement
         * exactement cette commande.
         */
        navigate(
          `/admin/orders?order=${encodeURIComponent(
            order.order_number,
          )}`,
          {
            state: {
              orderNumber:
                order.order_number,

              autoOpen:
                true,

              source:
                'payment-confirmed',
            },
          },
        )
      } catch (error) {
        console.error(
          'Unable to confirm payment:',
          error,
        )

        showToast({
          type:
            'error',

          title:
            'Validation impossible',

          message:
            error instanceof
            Error
              ? error.message
              : 'Impossible de confirmer ce paiement.',
        })

        setProcessingOrderId(
          null,
        )
      }
    }

  const openPartialDialog =
    (
      order:
        DigitalOrderRow,
    ) => {
      setPartialOrder(
        order,
      )

      const existingAmount =
        Number(
          order.amount_received ??
            0,
        )

      setAmountReceivedInput(
        existingAmount >
          0
          ? String(
              existingAmount,
            )
          : '',
      )

      setPartialNote(
        order.payment_issue_reason ??
          '',
      )
    }

  const closePartialDialog =
    () => {
      if (
        processingOrderId
      ) {
        return
      }

      setPartialOrder(
        null,
      )

      setAmountReceivedInput(
        '',
      )

      setPartialNote(
        '',
      )
    }

  const parsedAmountReceived =
    Number(
      amountReceivedInput
        .replace(
          ',',
          '.',
        )
        .trim(),
    )

  const partialRemaining =
    partialOrder &&
    Number.isFinite(
      parsedAmountReceived,
    )
      ? Math.max(
          Number(
            partialOrder.total_amount,
          ) -
            parsedAmountReceived,
          0,
        )
      : 0

  const canRequestComplement =
    Boolean(
      partialOrder,
    ) &&
    Number.isFinite(
      parsedAmountReceived,
    ) &&
    parsedAmountReceived >
      0 &&
    partialOrder !==
      null &&
    parsedAmountReceived <
      Number(
        partialOrder.total_amount,
      ) &&
    !processingOrderId

  const handleRequestComplement =
    async () => {
      if (
        !partialOrder ||
        !canRequestComplement
      ) {
        return
      }

      const received =
        parsedAmountReceived

      const remaining =
        Number(
          (
            Number(
              partialOrder.total_amount,
            ) -
            received
          ).toFixed(
            2,
          ),
        )

      const reason =
        partialNote
          .trim()
          .length >
        0
          ? partialNote.trim()
          : `Paiement incomplet. Montant reçu : ${formatAmount(
              received,
              partialOrder.currency,
            )}. Montant restant : ${formatAmount(
              remaining,
              partialOrder.currency,
            )}.`

      const orderNumber =
        partialOrder.order_number

      const currency =
        partialOrder.currency

      setProcessingOrderId(
        partialOrder.id,
      )

      try {
        const now =
          new Date().toISOString()

        const {
          error,
        } =
          await supabase
            .from(
              'digital_orders',
            )
            .update({
              status:
                'payment_partial',

              amount_received:
                received,

              amount_remaining:
                remaining,

              payment_issue_code:
                'insufficient_amount',

              payment_issue_reason:
                reason,

              payment_issue_at:
                now,

              payment_completion_requested_at:
                now,

              rejection_code:
                null,

              rejection_reason:
                null,

              rejected_at:
                null,

              updated_at:
                now,
            })
            .eq(
              'id',
              partialOrder.id,
            )

        if (error) {
          throw error
        }

        setPartialOrder(
          null,
        )

        setAmountReceivedInput(
          '',
        )

        setPartialNote(
          '',
        )

        /**
         * Mise à jour silencieuse.
         * Aucun écran de chargement.
         */
        await loadPayments()

        showToast({
          type:
            'success',

          title:
            'Complément demandé',

          message:
            `${orderNumber} attend maintenant ${formatAmount(
              remaining,
              currency,
            )}.`,
        })
      } catch (error) {
        console.error(
          'Unable to request complement:',
          error,
        )

        showToast({
          type:
            'error',

          title:
            'Enregistrement impossible',

          message:
            error instanceof
            Error
              ? error.message
              : 'Impossible d’enregistrer le paiement partiel.',
        })
      } finally {
        setProcessingOrderId(
          null,
        )
      }
    }

  const openRejectionDialog =
    (
      order:
        DigitalOrderRow,
    ) => {
      setRejectionOrder(
        order,
      )

      setSelectedRejectionCode(
        rejectionPresets[0]
          .code,
      )

      setCustomRejectionReason(
        '',
      )
    }

  const closeRejectionDialog =
    () => {
      if (
        processingOrderId
      ) {
        return
      }

      setRejectionOrder(
        null,
      )

      setCustomRejectionReason(
        '',
      )
    }

  const selectedRejectionPreset =
    rejectionPresets.find(
      (item) =>
        item.code ===
        selectedRejectionCode,
    )

  const rejectionReason =
    selectedRejectionPreset
      ?.code ===
    'other'
      ? customRejectionReason.trim()
      : selectedRejectionPreset
        ? selectedRejectionPreset
            .description.fr
        : ''

  const canReject =
    Boolean(
      rejectionOrder,
    ) &&
    rejectionReason.length >
      0 &&
    !processingOrderId

  const handleRejectPayment =
    async () => {
      if (
        !rejectionOrder ||
        !selectedRejectionPreset ||
        !canReject
      ) {
        return
      }

      const orderNumber =
        rejectionOrder.order_number

      setProcessingOrderId(
        rejectionOrder.id,
      )

      try {
        const now =
          new Date().toISOString()

        const {
          error,
        } =
          await supabase
            .from(
              'digital_orders',
            )
            .update({
              status:
                'cancelled',

              rejection_code:
                selectedRejectionPreset.code,

              rejection_reason:
                rejectionReason,

              rejected_at:
                now,

              payment_issue_code:
                null,

              payment_issue_reason:
                null,

              payment_issue_at:
                null,

              payment_completion_requested_at:
                null,

              updated_at:
                now,
            })
            .eq(
              'id',
              rejectionOrder.id,
            )

        if (error) {
          throw error
        }

        setRejectionOrder(
          null,
        )

        setCustomRejectionReason(
          '',
        )

        await loadPayments()

        showToast({
          type:
            'success',

          title:
            'Paiement refusé',

          message:
            `${orderNumber} a été annulée.`,
        })
      } catch (error) {
        console.error(
          'Unable to reject payment:',
          error,
        )

        showToast({
          type:
            'error',

          title:
            'Refus impossible',

          message:
            error instanceof
            Error
              ? error.message
              : 'Impossible de refuser ce paiement.',
        })
      } finally {
        setProcessingOrderId(
          null,
        )
      }
    }

  const statCards = [
    {
      key:
        'review',

      label:
        'À vérifier',

      value:
        formatNumber(
          stats.review,
        ),

      description:
        'Paiements à contrôler',

      className:
        'border-amber-400/15 bg-amber-400/[0.08]',

      titleClass:
        'text-amber-200',
    },
    {
      key:
        'partial',

      label:
        'Compléments',

      value:
        formatNumber(
          stats.partial,
        ),

      description:
        'Paiements incomplets',

      className:
        'border-orange-400/15 bg-orange-400/[0.08]',

      titleClass:
        'text-orange-200',
    },
    {
      key:
        'confirmed',

      label:
        'Validés',

      value:
        formatNumber(
          stats.confirmed,
        ),

      description:
        'Paiements confirmés',

      className:
        'border-blue-400/15 bg-blue-400/[0.08]',

      titleClass:
        'text-blue-200',
    },
    {
      key:
        'remaining',

      label:
        'Reste à recevoir',

      value:
        formatAmount(
          stats.remainingAmount,
        ),

      description:
        'Montant encore attendu',

      className:
        'border-violet-400/15 bg-violet-400/[0.08]',

      titleClass:
        'text-violet-200',
    },
  ]

  const filterOptions: {
    value:
      PaymentFilter

    label:
      string
  }[] = [
    {
      value:
        'all',

      label:
        'Tous',
    },
    {
      value:
        'payment_review',

      label:
        'À vérifier',
    },
    {
      value:
        'payment_partial',

      label:
        'Compléments',
    },
    {
      value:
        'payment_confirmed',

      label:
        'Validés',
    },
    {
      value:
        'cancelled',

      label:
        'Refusés',
    },
    {
      value:
        'refunded',

      label:
        'Remboursés',
    },
  ]

  return (
    <div
      dir="ltr"
      className="min-w-0 overflow-x-hidden pb-10"
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
            <div className="flex items-start gap-3">
              <div
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] font-black',

                  toast.type ===
                  'success'
                    ? 'bg-emerald-50 text-emerald-600'
                    : toast.type ===
                        'error'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-blue-50 text-blue-600',
                ].join(
                  ' ',
                )}
              >
                {toast.type ===
                'success'
                  ? '✓'
                  : toast.type ===
                      'error'
                    ? '!'
                    : 'i'}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950">
                  {
                    toast.title
                  }
                </p>

                {toast.message && (
                  <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                    {
                      toast.message
                    }
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setToast(
                    null,
                  )
                }
                className="text-lg font-black text-slate-300 transition hover:text-slate-600"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <section
        className="relative w-full min-w-0 overflow-hidden rounded-[26px] border border-slate-800/40 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:rounded-[30px] sm:p-7"
        style={{
          background:
            'linear-gradient(135deg,#020617 0%,#10265b 52%,#312e81 100%)',
        }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-[90px]" />

        <div className="pointer-events-none absolute -bottom-28 left-[25%] h-64 w-64 rounded-full bg-violet-500/15 blur-[90px]" />

        <div className="relative">
          <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>

                <span className="truncate text-xs font-black uppercase tracking-[0.14em] text-white/70">
                  TEO STORE PAYMENT CENTER
                </span>
              </div>

              <h1 className="mt-5 text-[30px] font-black tracking-[-0.045em] sm:text-4xl">
                Paiements
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                Vérifiez les paiements Digital, contrôlez les preuves, gérez les compléments et refusez les transactions non conformes.
              </p>
            </div>

            <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[280px]">
              <div className="rounded-[16px] border border-white/10 bg-white/[0.06] px-4 py-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">
                  Volume
                </p>

                <p
                  dir="ltr"
                  className="mt-1 text-lg font-black"
                >
                  {formatNumber(
                    paymentOrders.length,
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadPayments({
                    refresh:
                      true,
                  })
                }
                disabled={
                  isRefreshing ||
                  isLoading
                }
                className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.08] px-5 text-sm font-black text-white transition hover:bg-white/[0.13] disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={[
                    'h-4 w-4',

                    isRefreshing
                      ? 'animate-spin'
                      : '',
                  ].join(
                    ' ',
                  )}
                >
                  <path d="M20 6v5h-5" />

                  <path d="M4 18v-5h5" />

                  <path d="M6.1 9A7 7 0 0 1 18 6l2 5" />

                  <path d="M17.9 15A7 7 0 0 1 6 18l-2-5" />
                </svg>

                {isRefreshing
                  ? 'Actualisation...'
                  : 'Actualiser'}
              </button>
            </div>
          </div>

          <div className="mt-6 grid min-w-0 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {statCards.map(
              (
                stat,
              ) => (
                <article
                  key={
                    stat.key
                  }
                  className={[
                    'min-w-0 rounded-[18px] border p-3.5 backdrop-blur transition sm:rounded-[20px] sm:p-4',

                    stat.className,
                  ].join(
                    ' ',
                  )}
                >
                  <p
                    className={[
                      'truncate text-xs font-black uppercase tracking-[0.12em]',

                      stat.titleClass,
                    ].join(
                      ' ',
                    )}
                  >
                    {
                      stat.label
                    }
                  </p>

                  <p
                    dir="ltr"
                    className="mt-3 break-words text-left text-[22px] font-black tracking-[-0.03em] text-white sm:text-2xl"
                  >
                    {
                      stat.value
                    }
                  </p>

                  <p className="mt-2 text-xs leading-5 text-white/45">
                    {
                      stat.description
                    }
                  </p>
                </article>
              ),
            )}
          </div>

          <div className="mt-3 min-w-0 rounded-[17px] border border-white/10 bg-black/10 px-4 py-3">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/40">
                Valeur des paiements validés
              </p>

              <p
                dir="ltr"
                className="break-words text-left text-sm font-black text-emerald-300"
              >
                {formatAmount(
                  stats.confirmedAmount,
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 min-w-0 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:mt-6 sm:rounded-[24px] sm:p-5">
        <div className="min-w-0">
          <label
            htmlFor="payment-search"
            className="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
          >
            Recherche
          </label>

          <div className="relative mt-2 min-w-0">
            <input
              id="payment-search"
              type="search"
              value={
                searchQuery
              }
              onChange={(
                event,
              ) =>
                setSearchQuery(
                  event.target.value,
                )
              }
              placeholder="Commande, client, téléphone, service..."
              className="h-12 w-full min-w-0 rounded-[14px] border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500 focus:bg-white"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() =>
                  setSearchQuery(
                    '',
                  )
                }
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-slate-200 text-sm font-black text-slate-500"
                aria-label="Effacer la recherche"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Statut
            </p>

            {activeFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="text-xs font-black text-blue-600"
              >
                Réinitialiser
              </button>
            )}
          </div>

          <div className="mt-2 grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {filterOptions.map(
              (
                item,
              ) => {
                const active =
                  filter ===
                  item.value

                return (
                  <button
                    key={
                      item.value
                    }
                    type="button"
                    onClick={() =>
                      setFilter(
                        item.value,
                      )
                    }
                    className={[
                      'min-w-0 rounded-[12px] px-2 py-3 text-sm font-black transition sm:h-11 sm:shrink-0 sm:px-4',

                      active
                        ? 'bg-slate-950 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                    ].join(
                      ' ',
                    )}
                  >
                    <span className="block truncate">
                      {
                        item.label
                      }
                    </span>
                  </button>
                )
              },
            )}
          </div>
        </div>

        <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <p className="text-xs font-bold text-slate-400">
            <span dir="ltr">
              {formatNumber(
                filteredOrders.length,
              )}
            </span>{' '}
            résultat(s) sur{' '}
            <span dir="ltr">
              {formatNumber(
                paymentOrders.length,
              )}
            </span>
          </p>

          {filter !==
            'all' && (
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
              Filtre actif
            </span>
          )}
        </div>
      </section>

      {errorMessage && (
        <div className="mt-5 min-w-0 rounded-[18px] border border-rose-100 bg-rose-50 p-4">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-rose-100 font-black text-rose-600">
              !
            </div>

            <div className="min-w-0">
              <p className="text-sm font-black text-rose-700">
                Chargement impossible
              </p>

              <p
                dir="ltr"
                className="mt-1 break-words text-left text-xs leading-5 text-rose-500"
              >
                {
                  errorMessage
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="mt-6 min-w-0">
        <div className="mb-4 min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
            Transactions
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-950">
            Centre de vérification
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            Contrôle des transactions et des preuves de paiement privées.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[230px] items-center justify-center rounded-[22px] border border-slate-200 bg-white sm:rounded-[24px]">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-bold text-slate-500">
                Chargement des paiements...
              </p>
            </div>
          </div>
        ) : filteredOrders.length >
          0 ? (
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            {filteredOrders.map(
              (
                order,
              ) => {
                const status =
                  normalizeStatus(
                    order.status,
                  )

                const busy =
                  processingOrderId ===
                  order.id

                const proofLoading =
                  proofLoadingOrderId ===
                  order.id

                const customerLabel =
                  order.customer_name ||
                  order.customer_email ||
                  order.customer_phone ||
                  'Client TEO STORE'

                const received =
                  Number(
                    order.amount_received ??
                      0,
                  )

                const remaining =
                  Number(
                    order.amount_remaining ??
                      0,
                  )

                return (
                  <article
                    key={
                      order.id
                    }
                    className={[
                      'min-w-0 overflow-hidden rounded-[22px] border bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition sm:rounded-[24px]',

                      status ===
                      'payment_review'
                        ? 'border-amber-100'
                        : status ===
                            'payment_partial'
                          ? 'border-orange-200'
                          : status ===
                              'disputed'
                            ? 'border-rose-200'
                            : 'border-slate-200',
                    ].join(
                      ' ',
                    )}
                  >
                    <div className="min-w-0 p-4 sm:p-6">
                      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p
                              dir="ltr"
                              className="max-w-full truncate text-left text-sm font-black tracking-wide text-blue-600"
                            >
                              {
                                order.order_number
                              }
                            </p>

                            <span
                              className={[
                                'max-w-full rounded-full border px-2.5 py-1 text-xs font-black',

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

                          <h3 className="mt-3 break-words text-base font-black text-slate-950">
                            {
                              order.service_name
                            }
                          </h3>

                          <p className="mt-1 break-words text-xs font-semibold text-slate-500">
                            {
                              order.plan_label
                            }
                          </p>
                        </div>

                        <div className="w-full shrink-0 rounded-[15px] bg-slate-950 px-4 py-3 text-white sm:w-auto sm:min-w-[135px] sm:rounded-[16px]">
                          <p className="text-xs font-black uppercase tracking-wide text-white/40">
                            Total
                          </p>

                          <p
                            dir="ltr"
                            className="mt-1 break-words text-left text-base font-black"
                          >
                            {formatAmount(
                              order.total_amount,
                              order.currency,
                            )}
                          </p>
                        </div>
                      </div>

                      {status ===
                        'payment_partial' && (
                        <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
                          <div className="min-w-0 rounded-[14px] border border-emerald-100 bg-emerald-50 p-3">
                            <p className="text-xs font-black uppercase text-emerald-500">
                              Reçu
                            </p>

                            <p
                              dir="ltr"
                              className="mt-1 break-words text-left text-sm font-black text-emerald-800"
                            >
                              {formatAmount(
                                received,
                                order.currency,
                              )}
                            </p>
                          </div>

                          <div className="min-w-0 rounded-[14px] border border-orange-100 bg-orange-50 p-3">
                            <p className="text-xs font-black uppercase text-orange-500">
                              Restant
                            </p>

                            <p
                              dir="ltr"
                              className="mt-1 break-words text-left text-sm font-black text-orange-800"
                            >
                              {formatAmount(
                                remaining,
                                order.currency,
                              )}
                            </p>
                          </div>

                          <div className="col-span-2 min-w-0 rounded-[14px] border border-slate-100 bg-slate-50 p-3 sm:col-span-1">
                            <p className="text-xs font-black uppercase text-slate-400">
                              Total
                            </p>

                            <p
                              dir="ltr"
                              className="mt-1 break-words text-left text-sm font-black text-slate-900"
                            >
                              {formatAmount(
                                order.total_amount,
                                order.currency,
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
                        <div className="min-w-0 rounded-[16px] bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                            Client
                          </p>

                          <p className="mt-2 truncate text-sm font-black text-slate-800">
                            {
                              customerLabel
                            }
                          </p>

                          {order.customer_phone && (
                            <p
                              dir="ltr"
                              className="mt-1 truncate text-left text-xs font-semibold text-slate-400"
                            >
                              {
                                order.customer_phone
                              }
                            </p>
                          )}

                          {order.customer_email && (
                            <p
                              dir="ltr"
                              className="mt-1 truncate text-left text-xs text-slate-400"
                            >
                              {
                                order.customer_email
                              }
                            </p>
                          )}
                        </div>

                        <div className="min-w-0 rounded-[16px] bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                            Paiement
                          </p>

                          <p className="mt-2 truncate text-sm font-black text-slate-800">
                            {order.payment_method_name ??
                              '—'}
                          </p>

                          {order.payment_sender_number && (
                            <p
                              dir="ltr"
                              className="mt-1 truncate text-left text-xs font-semibold text-slate-400"
                            >
                              {
                                order.payment_sender_number
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={
                          !order.payment_proof_path ||
                          proofLoading
                        }
                        onClick={() =>
                          void openProof(
                            order,
                          )
                        }
                        className={[
                          'mt-4 block w-full min-w-0 overflow-hidden rounded-[18px] border text-left transition',

                          order.payment_proof_path
                            ? 'border-blue-900/40 bg-slate-950 hover:border-blue-500/50 hover:bg-[#0b1730]'
                            : 'cursor-default border-slate-200 bg-slate-100',
                        ].join(
                          ' ',
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3 p-4">
                          <div
                            className={[
                              'flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]',

                              order.payment_proof_path
                                ? 'bg-blue-500/10 text-blue-300'
                                : 'bg-slate-200 text-slate-400',
                            ].join(
                              ' ',
                            )}
                          >
                            {proofLoading ? (
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
                            ) : (
                              '▣'
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className={[
                                'text-xs font-black uppercase tracking-[0.14em]',

                                order.payment_proof_path
                                  ? 'text-blue-300'
                                  : 'text-slate-400',
                              ].join(
                                ' ',
                              )}
                            >
                              Preuve de paiement
                            </p>

                            <p
                              className={[
                                'mt-1 truncate text-xs font-semibold',

                                order.payment_proof_path
                                  ? 'text-white/45'
                                  : 'text-slate-400',
                              ].join(
                                ' ',
                              )}
                            >
                              {getProofFileName(
                                order.payment_proof_path,
                              )}
                            </p>

                            {order.payment_proof_path && (
                              <p className="mt-1.5 text-xs font-black text-white/70">
                                {proofLoading
                                  ? 'Ouverture sécurisée...'
                                  : 'Appuyer pour afficher l’image'}
                              </p>
                            )}
                          </div>

                          {order.payment_proof_path && (
                            <div className="shrink-0 text-lg text-white/30">
                              →
                            </div>
                          )}
                        </div>
                      </button>

                      {status ===
                        'payment_partial' &&
                        order.payment_issue_reason && (
                          <div className="mt-3 min-w-0 rounded-[16px] border border-orange-100 bg-orange-50 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-orange-600">
                              Complément demandé
                            </p>

                            <p className="mt-2 break-words text-xs leading-5 text-orange-700">
                              {
                                order.payment_issue_reason
                              }
                            </p>

                            {order.payment_completion_requested_at && (
                              <p className="mt-2 text-xs font-semibold text-orange-400">
                                Demandé le{' '}

                                <span dir="ltr">
                                  {formatDate(
                                    order.payment_completion_requested_at,
                                  )}
                                </span>
                              </p>
                            )}
                          </div>
                        )}

                      {status ===
                        'cancelled' &&
                        order.rejection_reason && (
                          <div className="mt-3 min-w-0 rounded-[16px] border border-rose-100 bg-rose-50 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-rose-600">
                              Motif du refus
                            </p>

                            <p className="mt-2 break-words text-xs leading-5 text-rose-700">
                              {
                                order.rejection_reason
                              }
                            </p>
                          </div>
                        )}

                      <div className="mt-4 min-w-0 border-t border-slate-100 pt-4">
                        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="break-words text-xs font-semibold text-slate-400">
                            Créée le{' '}

                            <span dir="ltr">
                              {formatDate(
                                order.created_at,
                              )}
                            </span>
                          </p>

                          {order.updated_at && (
                            <p className="text-xs text-slate-300">
                              Mise à jour{' '}

                              <span dir="ltr">
                                {formatDate(
                                  order.updated_at,
                                )}
                              </span>
                            </p>
                          )}
                        </div>

                        {status ===
                          'payment_review' && (
                          <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
                            <button
                              type="button"
                              onClick={() =>
                                openRejectionDialog(
                                  order,
                                )
                              }
                              disabled={
                                busy
                              }
                              className="min-h-[46px] rounded-[13px] border border-rose-100 bg-rose-50 px-4 text-sm font-black text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                              Refuser
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openPartialDialog(
                                  order,
                                )
                              }
                              disabled={
                                busy
                              }
                              className="min-h-[46px] rounded-[13px] border border-orange-200 bg-orange-50 px-4 text-sm font-black text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
                            >
                              Paiement partiel
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                requestConfirmPayment(
                                  order,
                                )
                              }
                              disabled={
                                busy
                              }
                              className="min-h-[46px] rounded-[13px] bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50"
                            >
                              {busy
                                ? 'Validation...'
                                : 'Confirmer'}
                            </button>
                          </div>
                        )}

                        {status ===
                          'payment_partial' && (
                          <div className="mt-4 flex min-w-0 flex-col gap-3 rounded-[14px] bg-orange-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-orange-700">
                                En attente du complément
                              </p>

                              <p className="mt-1 text-xs leading-5 text-orange-600">
                                Le client doit compléter le paiement et envoyer une nouvelle preuve.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                openPartialDialog(
                                  order,
                                )
                              }
                              disabled={
                                busy
                              }
                              className="min-h-[40px] shrink-0 rounded-[11px] border border-orange-200 bg-white px-3 text-sm font-black text-orange-700 disabled:opacity-50"
                            >
                              Modifier
                            </button>
                          </div>
                        )}

                        {isConfirmedLifecycle(
                          status,
                        ) && (
                          <div className="mt-4 flex min-w-0 items-center gap-3 rounded-[14px] border border-emerald-100 bg-emerald-50 px-4 py-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-emerald-100 font-black text-emerald-700">
                              ✓
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-black text-emerald-800">
                                Paiement validé
                              </p>

                              <p className="mt-0.5 text-xs leading-4 text-emerald-600">
                                La commande poursuit son workflow opérationnel.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              },
            )}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-8 text-center sm:rounded-[24px] sm:p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-blue-50 text-xl font-black text-blue-600">
              ✓
            </div>

            <h3 className="mt-4 text-sm font-black text-slate-800">
              Aucun paiement trouvé
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">
              Aucun paiement ne correspond à la recherche ou au filtre sélectionné.
            </p>

            {activeFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="mt-4 rounded-[12px] bg-slate-950 px-4 py-2.5 text-sm font-black text-white"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </section>

      <section className="mt-8 min-w-0">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
            Méthodes
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-950">
            Comptes de réception
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            Moyens de paiement disponibles pour les clients TEO STORE.
          </p>
        </div>

        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {paymentMethods.map(
            (
              method,
            ) => {
              const active =
                method.status ===
                'active'

              return (
                <article
                  key={
                    method.id
                  }
                  className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-blue-50 text-sm font-black text-blue-700">
                      {
                        method.shortName
                      }
                    </div>

                    <span
                      className={[
                        'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-black',

                        active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500',
                      ].join(
                        ' ',
                      )}
                    >
                      <span
                        className={[
                          'h-1.5 w-1.5 rounded-full',

                          active
                            ? 'bg-emerald-500'
                            : 'bg-slate-400',
                        ].join(
                          ' ',
                        )}
                      />

                      {active
                        ? 'Actif'
                        : 'Inactif'}
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">
                    TEO STORE
                  </p>

                  <h3 className="mt-1 text-base font-black text-slate-950">
                    {
                      method.name
                    }
                  </h3>

                  <div
                    dir="ltr"
                    className="mt-4 min-w-0 rounded-[15px] bg-slate-50 p-4"
                  >
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Numéro de réception
                    </p>

                    <p className="mt-2 break-all text-left text-lg font-black tracking-[0.08em] text-slate-950">
                      {
                        method.paymentNumber
                      }
                    </p>
                  </div>
                </article>
              )
            },
          )}
        </div>
      </section>

      {previewOrder &&
        previewUrl && (
          <div
            className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/95 p-2 backdrop-blur-md sm:p-6"
            onClick={
              closePreview
            }
          >
            <div
              className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[#07101f] shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:rounded-[24px]"
              onClick={(
                event,
              ) =>
                event.stopPropagation()
              }
            >
              <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-300">
                    Preuve de paiement
                  </p>

                  <p
                    dir="ltr"
                    className="mt-1 truncate text-left text-sm font-black text-white"
                  >
                    {
                      previewOrder.order_number
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closePreview
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl font-black text-white transition hover:bg-white/15"
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>

              <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-black/20 p-2 sm:p-5">
                <img
                  src={
                    previewUrl
                  }
                  alt={`Preuve de paiement ${previewOrder.order_number}`}
                  className="max-h-[68dvh] max-w-full rounded-[12px] object-contain sm:max-h-[72vh] sm:rounded-[14px]"
                />
              </div>

              <div className="border-t border-white/10 p-3 sm:p-5">
                <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="min-w-0 rounded-[13px] bg-white/[0.05] p-3">
                    <p className="text-xs font-black uppercase text-white/30">
                      Méthode
                    </p>

                    <p className="mt-1 truncate text-xs font-black text-white">
                      {previewOrder.payment_method_name ||
                        '—'}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-[13px] bg-white/[0.05] p-3">
                    <p className="text-xs font-black uppercase text-white/30">
                      Expéditeur
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 truncate text-left text-xs font-black text-white"
                    >
                      {previewOrder.payment_sender_number ||
                        '—'}
                    </p>
                  </div>

                  <div className="col-span-2 min-w-0 rounded-[13px] bg-white/[0.05] p-3 sm:col-span-1">
                    <p className="text-xs font-black uppercase text-white/30">
                      Montant
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 break-words text-left text-xs font-black text-white"
                    >
                      {formatAmount(
                        previewOrder.total_amount,
                        previewOrder.currency,
                      )}
                    </p>
                  </div>
                </div>

                <p
                  dir="ltr"
                  className="mt-3 truncate text-center text-xs text-white/25"
                >
                  {getProofFileName(
                    previewOrder.payment_proof_path,
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

      {partialOrder && (
        <div className="fixed inset-0 z-[170] flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-5">
          <div className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[26px] bg-white p-5 shadow-[0_30px_100px_rgba(15,23,42,0.35)] sm:max-w-xl sm:rounded-[28px] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-orange-600">
                  Paiement incomplet
                </p>

                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Demander un complément
                </h3>

                <p
                  dir="ltr"
                  className="mt-1 truncate text-left text-sm font-black text-blue-600"
                >
                  {
                    partialOrder.order_number
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closePartialDialog
                }
                disabled={
                  Boolean(
                    processingOrderId,
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-600 disabled:opacity-40"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-[18px] bg-slate-950 p-4 text-white">
              <p className="text-xs font-black uppercase tracking-wide text-white/40">
                Montant attendu
              </p>

              <p
                dir="ltr"
                className="mt-2 break-words text-left text-xl font-black"
              >
                {formatAmount(
                  partialOrder.total_amount,
                  partialOrder.currency,
                )}
              </p>
            </div>

            <div className="mt-5">
              <label
                htmlFor="amount-received"
                className="text-sm font-black text-slate-700"
              >
                Montant réellement reçu
              </label>

              <input
                id="amount-received"
                dir="ltr"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={
                  amountReceivedInput
                }
                onChange={(
                  event,
                ) =>
                  setAmountReceivedInput(
                    event.target.value,
                  )
                }
                placeholder="900"
                className="mt-2 h-12 w-full min-w-0 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-left text-sm font-black text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white"
              />
            </div>

            {Number.isFinite(
              parsedAmountReceived,
            ) &&
              parsedAmountReceived >
                0 && (
                <div className="mt-4 grid min-w-0 grid-cols-2 gap-2">
                  <div className="min-w-0 rounded-[16px] border border-emerald-100 bg-emerald-50 p-3 sm:p-4">
                    <p className="text-xs font-black uppercase text-emerald-600">
                      Reçu
                    </p>

                    <p
                      dir="ltr"
                      className="mt-2 break-words text-left text-sm font-black text-emerald-800 sm:text-base"
                    >
                      {formatAmount(
                        parsedAmountReceived,
                        partialOrder.currency,
                      )}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-[16px] border border-orange-100 bg-orange-50 p-3 sm:p-4">
                    <p className="text-xs font-black uppercase text-orange-600">
                      À compléter
                    </p>

                    <p
                      dir="ltr"
                      className="mt-2 break-words text-left text-sm font-black text-orange-800 sm:text-base"
                    >
                      {formatAmount(
                        partialRemaining,
                        partialOrder.currency,
                      )}
                    </p>
                  </div>
                </div>
              )}

            {Number.isFinite(
              parsedAmountReceived,
            ) &&
              parsedAmountReceived >=
                Number(
                  partialOrder.total_amount,
                ) && (
                <div className="mt-4 rounded-[14px] border border-amber-100 bg-amber-50 p-3">
                  <p className="text-xs font-black leading-5 text-amber-700">
                    Pour un paiement complet, utilisez l’action « Confirmer ».
                  </p>
                </div>
              )}

            <div className="mt-5">
              <label
                htmlFor="partial-note"
                className="text-sm font-black text-slate-700"
              >
                Message au client
              </label>

              <textarea
                id="partial-note"
                value={
                  partialNote
                }
                onChange={(
                  event,
                ) =>
                  setPartialNote(
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="Ex. Nous avons reçu 900 MRU. Merci de compléter le montant restant."
                className="mt-2 w-full min-w-0 resize-none rounded-[16px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white"
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={
                  closePartialDialog
                }
                disabled={
                  Boolean(
                    processingOrderId,
                  )
                }
                className="min-h-[48px] rounded-[14px] border border-slate-200 bg-white px-2 text-sm font-black text-slate-600 disabled:opacity-40"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleRequestComplement()
                }
                disabled={
                  !canRequestComplement
                }
                className={[
                  'min-h-[48px] rounded-[14px] px-2 text-sm font-black transition',

                  canRequestComplement
                    ? 'bg-orange-500 text-white hover:bg-orange-400'
                    : 'cursor-not-allowed bg-slate-200 text-slate-400',
                ].join(
                  ' ',
                )}
              >
                {processingOrderId
                  ? 'Enregistrement...'
                  : 'Demander'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectionOrder && (
        <div className="fixed inset-0 z-[170] flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-5">
          <div className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[26px] bg-white p-5 shadow-[0_30px_100px_rgba(15,23,42,0.35)] sm:max-w-xl sm:rounded-[28px] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-rose-600">
                  Refus du paiement
                </p>

                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Informer le client
                </h3>

                <p
                  dir="ltr"
                  className="mt-1 truncate text-left text-sm font-black text-blue-600"
                >
                  {
                    rejectionOrder.order_number
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeRejectionDialog
                }
                disabled={
                  Boolean(
                    processingOrderId,
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-600 disabled:opacity-40"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <div className="mt-4 rounded-[16px] border border-orange-100 bg-orange-50 p-4">
              <p className="text-sm font-black text-orange-700">
                Le montant est seulement insuffisant ?
              </p>

              <p className="mt-1 text-xs leading-5 text-orange-600">
                Utilisez « Paiement partiel » au lieu de refuser la commande.
              </p>
            </div>

            <div className="mt-5 space-y-2">
              {rejectionPresets.map(
                (
                  reason,
                ) => {
                  const selected =
                    selectedRejectionCode ===
                    reason.code

                  return (
                    <button
                      key={
                        reason.code
                      }
                      type="button"
                      onClick={() =>
                        setSelectedRejectionCode(
                          reason.code,
                        )
                      }
                      className={[
                        'w-full rounded-[16px] border p-4 text-left transition',

                        selected
                          ? 'border-rose-300 bg-rose-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50',
                      ].join(
                        ' ',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={[
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',

                            selected
                              ? 'border-rose-500 bg-rose-500 text-white'
                              : 'border-slate-300 bg-white',
                          ].join(
                            ' ',
                          )}
                        >
                          {selected
                            ? '✓'
                            : ''}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800">
                            {
                              reason.label.fr
                            }
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {
                              reason.description.fr
                            }
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                },
              )}
            </div>

            {selectedRejectionCode ===
              'other' && (
              <textarea
                value={
                  customRejectionReason
                }
                onChange={(
                  event,
                ) =>
                  setCustomRejectionReason(
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="Expliquez clairement pourquoi le paiement est refusé..."
                className="mt-4 w-full min-w-0 resize-none rounded-[16px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-rose-300 focus:bg-white"
              />
            )}

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={
                  closeRejectionDialog
                }
                disabled={
                  Boolean(
                    processingOrderId,
                  )
                }
                className="min-h-[48px] rounded-[14px] border border-slate-200 bg-white px-2 text-sm font-black text-slate-600 disabled:opacity-40"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleRejectPayment()
                }
                disabled={
                  !canReject
                }
                className="min-h-[48px] rounded-[14px] bg-rose-600 px-2 text-sm font-black text-white transition hover:bg-rose-500 disabled:opacity-40"
              >
                {processingOrderId
                  ? 'Enregistrement...'
                  : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmation && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-md rounded-[24px] bg-white p-5 shadow-2xl sm:rounded-[26px] sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-emerald-50 text-lg font-black text-emerald-600">
              ✓
            </div>

            <h3 className="mt-4 text-xl font-black text-slate-950">
              Confirmer le paiement
            </h3>

            <p className="mt-2 break-words text-sm leading-6 text-slate-500">
              Vous confirmez avoir reçu la totalité du paiement pour la commande{' '}

              <span
                dir="ltr"
                className="font-black text-slate-800"
              >
                {
                  confirmation.order.order_number
                }
              </span>
              .
            </p>

            <div className="mt-4 rounded-[15px] border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase text-emerald-600">
                Montant confirmé
              </p>

              <p
                dir="ltr"
                className="mt-2 break-words text-left text-lg font-black text-emerald-800"
              >
                {formatAmount(
                  confirmation.order.total_amount,
                  confirmation.order.currency,
                )}
              </p>
            </div>

            <div className="mt-4 rounded-[14px] border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs font-black text-blue-700">
                Après confirmation
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-600">
                Vous serez automatiquement redirigé vers la commande à traiter.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmation(
                    null,
                  )
                }
                disabled={
                  Boolean(
                    processingOrderId,
                  )
                }
                className="min-h-[48px] rounded-[14px] border border-slate-200 px-2 text-sm font-black text-slate-700 disabled:opacity-40"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleConfirmPayment(
                    confirmation.order,
                  )
                }
                disabled={
                  Boolean(
                    processingOrderId,
                  )
                }
                className="min-h-[48px] rounded-[14px] bg-emerald-600 px-2 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {processingOrderId
                  ? 'Validation...'
                  : 'Confirmer et traiter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPaymentsPage