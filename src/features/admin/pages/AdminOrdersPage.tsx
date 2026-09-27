import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  useLocation,
  useSearchParams,
} from 'react-router-dom'

import {
  supabase,
} from '../../../lib/supabase'

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

type DigitalOrderRow = {
  id: string
  order_number: string
  user_id: string

  service_slug: string
  service_name: string

  group_id: string
  group_name: string

  plan_id: string
  plan_label: string

  quantity: number
  unit_price: number
  total_amount: number
  currency: string

  customer_name: string
  customer_email: string | null
  customer_phone: string
  customer_values: Record<string, unknown> | null

  payment_method: string
  payment_method_name: string | null
  payment_sender_number: string | null
  payment_proof_path: string | null

  amount_received: number | null
  amount_remaining: number | null

  payment_issue_code: string | null
  payment_issue_reason: string | null

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

  admin_note: string | null

  created_at: string
  updated_at: string
}

type FulfillmentForm = {
  email: string
  password: string
  code: string
  link: string
  note: string
}

type ToastState = {
  type:
    | 'success'
    | 'error'
    | 'info'

  title: string
  message?: string
}

type RejectionReason = {
  code: string
  label: string
  description: string
}

type ConfirmationState =
  | {
      type: 'fulfillment'
      order: DigitalOrderRow
    }
  | {
      type: 'refund'
      order: DigitalOrderRow
    }
  | null

type NavigationState = {
  orderNumber?: string
  autoOpen?: boolean
  source?: string
}

const PAYMENT_PROOFS_BUCKET =
  'payment-proofs'

const rejectionReasons: RejectionReason[] = [
  {
    code: 'proof_unreadable',
    label: 'Preuve illisible',
    description:
      'La capture ou la photo du paiement ne permet pas de vérifier la transaction.',
  },
  {
    code: 'wrong_sender_number',
    label: 'Numéro expéditeur incorrect',
    description:
      'Le numéro indiqué ne correspond pas au numéro utilisé pour le paiement.',
  },
  {
    code: 'payment_not_found',
    label: 'Paiement introuvable',
    description:
      'Aucun paiement correspondant n’a été retrouvé.',
  },
  {
    code: 'proof_already_used',
    label: 'Preuve déjà utilisée',
    description:
      'Cette preuve de paiement semble avoir déjà été utilisée.',
  },
  {
    code: 'invalid_customer_information',
    label: 'Informations incorrectes',
    description:
      'Certaines informations nécessaires à la commande sont incorrectes ou incomplètes.',
  },
  {
    code: 'fraud_suspicion',
    label: 'Suspicion de fraude',
    description:
      'La transaction nécessite une vérification supplémentaire.',
  },
  {
    code: 'service_unavailable',
    label: 'Service indisponible',
    description:
      'Le service sélectionné ne peut pas être traité actuellement.',
  },
  {
    code: 'other',
    label: 'Autre raison',
    description:
      'Saisissez une raison personnalisée.',
  },
]

function normalizeStatus(
  status: string,
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

function AdminOrdersPage() {
  const locale =
    'fr-FR-u-nu-latn'

  const location =
    useLocation()

  const [
    searchParams,
  ] =
    useSearchParams()

  const navigationState =
    (
      location.state as
        | NavigationState
        | null
    ) ?? null

  const requestedOrderNumber =
    searchParams.get(
      'order',
    ) ??
    navigationState
      ?.orderNumber ??
    ''

  const autoOpenHandledRef =
    useRef<string | null>(
      null,
    )

  const [
    orders,
    setOrders,
  ] =
    useState<
      DigitalOrderRow[]
    >([])

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      'all' | OrderStatus
    >('all')

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
    loadError,
    setLoadError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    highlightedOrderNumber,
    setHighlightedOrderNumber,
  ] =
    useState<string | null>(
      null,
    )

  const [
    proofLoadingOrderId,
    setProofLoadingOrderId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    proofPreviewUrl,
    setProofPreviewUrl,
  ] =
    useState<string | null>(
      null,
    )

  const [
    proofPreviewOrder,
    setProofPreviewOrder,
  ] =
    useState<DigitalOrderRow | null>(
      null,
    )

  const [
    rejectionOrder,
    setRejectionOrder,
  ] =
    useState<DigitalOrderRow | null>(
      null,
    )

  const [
    rejectionCode,
    setRejectionCode,
  ] =
    useState('')

  const [
    customRejectionReason,
    setCustomRejectionReason,
  ] =
    useState('')

  const [
    isRejecting,
    setIsRejecting,
  ] =
    useState(false)

  const [
    noteOrder,
    setNoteOrder,
  ] =
    useState<DigitalOrderRow | null>(
      null,
    )

  const [
    adminNote,
    setAdminNote,
  ] =
    useState('')

  const [
    isSavingNote,
    setIsSavingNote,
  ] =
    useState(false)

  const [
    fulfillmentOrder,
    setFulfillmentOrder,
  ] =
    useState<DigitalOrderRow | null>(
      null,
    )

  const [
    fulfillmentForm,
    setFulfillmentForm,
  ] =
    useState<FulfillmentForm>({
      email: '',
      password: '',
      code: '',
      link: '',
      note: '',
    })

  const [
    isSendingFulfillment,
    setIsSendingFulfillment,
  ] =
    useState(false)

  const [
    disputeOrder,
    setDisputeOrder,
  ] =
    useState<DigitalOrderRow | null>(
      null,
    )

  const [
    disputeResolution,
    setDisputeResolution,
  ] =
    useState('')

  const [
    isResolvingDispute,
    setIsResolvingDispute,
  ] =
    useState(false)

  const [
    confirmation,
    setConfirmation,
  ] =
    useState<ConfirmationState>(
      null,
    )

  const [
    toast,
    setToast,
  ] =
    useState<ToastState | null>(
      null,
    )

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
   * showLoading:
   * true = chargement initial.
   *
   * showRefresh:
   * true = bouton Actualiser.
   *
   * false/false =
   * actualisation silencieuse
   * utilisée par Realtime.
   */
  const loadOrders =
    useCallback(
      async (
        showLoading = true,
        showRefresh = false,
      ) => {
        if (showLoading) {
          setIsLoading(
            true,
          )
        }

        if (showRefresh) {
          setIsRefreshing(
            true,
          )
        }

        setLoadError(
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
                admin_note,
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
            'Unable to load orders:',
            error,
          )

          setLoadError(
            `Impossible de charger les commandes. ${error.message}`,
          )

          if (showLoading) {
            setOrders(
              [],
            )
          }

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

  /**
   * Realtime uniquement.
   *
   * Aucun polling toutes
   * les 3 secondes.
   */
  useEffect(() => {
    let active = true

    void loadOrders()

    const channel =
      supabase
        .channel(
          `admin-orders-${Date.now()}`,
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

            void loadOrders(
              false,
              false,
            )
          },
        )
        .subscribe()

    const handleFocus =
      () => {
        if (!active) {
          return
        }

        void loadOrders(
          false,
          false,
        )
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

        void loadOrders(
          false,
          false,
        )
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
    loadOrders,
  ])

  /**
   * Arrivée depuis:
   *
   * /admin/orders?order=TEO-XXXXXX
   *
   * Affiche directement
   * la commande concernée.
   */
  useEffect(() => {
    if (
      isLoading ||
      !requestedOrderNumber ||
      autoOpenHandledRef.current ===
        requestedOrderNumber
    ) {
      return
    }

    const targetOrder =
      orders.find(
        (order) =>
          order.order_number ===
          requestedOrderNumber,
      )

    if (!targetOrder) {
      return
    }

    autoOpenHandledRef.current =
      requestedOrderNumber

    setSearchQuery(
      requestedOrderNumber,
    )

    setStatusFilter(
      'all',
    )

    setHighlightedOrderNumber(
      requestedOrderNumber,
    )

    window.setTimeout(
      () => {
        document
          .getElementById(
            `admin-order-${targetOrder.id}`,
          )
          ?.scrollIntoView({
            behavior:
              'smooth',
            block:
              'center',
          })
      },
      120,
    )

    const timer =
      window.setTimeout(
        () => {
          setHighlightedOrderNumber(
            (current) =>
              current ===
              requestedOrderNumber
                ? null
                : current,
          )
        },
        6000,
      )

    return () => {
      window.clearTimeout(
        timer,
      )
    }
  }, [
    isLoading,
    orders,
    requestedOrderNumber,
  ])

  const filteredOrders =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase()

      return orders.filter(
        (
          order,
        ) => {
          const status =
            normalizeStatus(
              order.status,
            )

          const matchesStatus =
            statusFilter ===
              'all' ||
            status ===
              statusFilter

          const values =
            [
              order.order_number,
              order.service_name,
              order.plan_label,
              order.group_name,
              order.customer_name,
              order.customer_email,
              order.customer_phone,
              order.payment_sender_number,
              order.payment_method,
              order.payment_method_name,
            ]

          const matchesSearch =
            query.length ===
              0 ||
            values.some(
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
            matchesStatus &&
            matchesSearch
          )
        },
      )
    }, [
      orders,
      searchQuery,
      statusFilter,
    ])

  const paymentReviewCount =
    orders.filter(
      (order) =>
        normalizeStatus(
          order.status,
        ) ===
        'payment_review',
    ).length

  const paymentPartialCount =
    orders.filter(
      (order) =>
        normalizeStatus(
          order.status,
        ) ===
        'payment_partial',
    ).length

  const processingCount =
    orders.filter(
      (order) =>
        [
          'payment_confirmed',
          'processing',
        ].includes(
          normalizeStatus(
            order.status,
          ),
        ),
    ).length

  const awaitingCustomerCount =
    orders.filter(
      (order) =>
        normalizeStatus(
          order.status,
        ) ===
        'fulfillment_sent',
    ).length

  const disputeCount =
    orders.filter(
      (order) =>
        normalizeStatus(
          order.status,
        ) ===
        'disputed',
    ).length

  const completedCount =
    orders.filter(
      (order) =>
        normalizeStatus(
          order.status,
        ) ===
        'completed',
    ).length

  const activeFilters =
    searchQuery
      .trim()
      .length >
      0 ||
    statusFilter !==
      'all'

  const clearFilters =
    () => {
      setSearchQuery(
        '',
      )

      setStatusFilter(
        'all',
      )

      setHighlightedOrderNumber(
        null,
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
      currency: string,
    ) =>
      `${formatNumber(
        amount,
        2,
      )} ${formatCurrencyLabel(
        currency,
      )}`

  const formatDate =
    (
      value:
        | string
        | null,
    ) => {
      if (!value) {
        return '—'
      }

      try {
        return new Intl.DateTimeFormat(
          locale,
          {
            dateStyle:
              'short',
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

  const getStatusLabel =
    (
      status:
        OrderStatus,
    ) => {
      const labels:
        Record<
          OrderStatus,
          string
        > = {
        payment_review:
          'Paiement à vérifier',

        payment_partial:
          'Complément requis',

        payment_confirmed:
          'Paiement confirmé',

        processing:
          'En traitement',

        fulfillment_sent:
          'Envoyée au client',

        disputed:
          'Litige ouvert',

        completed:
          'Terminée',

        cancelled:
          'Annulée',

        refunded:
          'Remboursée',
      }

      return labels[
        status
      ]
    }

  const getStatusClasses =
    (
      status:
        OrderStatus,
    ) => {
      const classes:
        Record<
          OrderStatus,
          string
        > = {
        payment_review:
          'border-amber-100 bg-amber-50 text-amber-700',

        payment_partial:
          'border-orange-100 bg-orange-50 text-orange-700',

        payment_confirmed:
          'border-blue-100 bg-blue-50 text-blue-700',

        processing:
          'border-indigo-100 bg-indigo-50 text-indigo-700',

        fulfillment_sent:
          'border-violet-100 bg-violet-50 text-violet-700',

        disputed:
          'border-rose-100 bg-rose-50 text-rose-700',

        completed:
          'border-emerald-100 bg-emerald-50 text-emerald-700',

        cancelled:
          'border-slate-200 bg-slate-100 text-slate-600',

        refunded:
          'border-slate-200 bg-slate-100 text-slate-600',
      }

      return classes[
        status
      ]
    }

  const getFulfillmentTitle =
    (
      type:
        | string
        | null,
    ) => {
      const labels:
        Record<
          string,
          string
        > = {
        account_credentials:
          'Identifiants du compte',

        activation_code:
          'Code d’activation',

        activation_link:
          'Lien d’activation',

        activation_code_or_link:
          'Code ou lien d’activation',

        customer_email:
          'Activation sur le compte du client',

        player_id_verification:
          'Livraison sur Player ID',

        automatic_chat:
          'Livraison via discussion',
      }

      if (
        !type ||
        !labels[
          type
        ]
      ) {
        return 'Livraison du service'
      }

      return labels[
        type
      ]
    }

  const updateOrderStatus =
    async (
      order:
        DigitalOrderRow,
      nextStatus:
        OrderStatus,
      extraValues:
        Record<
          string,
          unknown
        > = {},
    ) => {
      setUpdatingOrderId(
        order.id,
      )

      const updatedAt =
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
              nextStatus,

            updated_at:
              updatedAt,

            ...extraValues,
          })
          .eq(
            'id',
            order.id,
          )

      if (error) {
        console.error(
          'Unable to update order:',
          error,
        )

        showToast({
          type:
            'error',

          title:
            'Modification impossible',

          message:
            error.message,
        })

        setUpdatingOrderId(
          null,
        )

        return false
      }

      await loadOrders(
        false,
        false,
      )

      setUpdatingOrderId(
        null,
      )

      return true
    }

  const handlePrimaryAction =
    async (
      order:
        DigitalOrderRow,
    ) => {
      const status =
        normalizeStatus(
          order.status,
        )

      if (
        status ===
        'payment_review'
      ) {
        const success =
          await updateOrderStatus(
            order,
            'payment_confirmed',
            {
              amount_received:
                order.total_amount,

              amount_remaining:
                0,

              payment_issue_code:
                null,

              payment_issue_reason:
                null,
            },
          )

        if (success) {
          showToast({
            type:
              'success',

            title:
              'Paiement confirmé',

            message:
              `${order.order_number} peut maintenant être traitée.`,
          })
        }

        return
      }

      if (
        status ===
        'payment_confirmed'
      ) {
        const success =
          await updateOrderStatus(
            order,
            'processing',
            {
              fulfillment_status:
                'preparing',
            },
          )

        if (success) {
          showToast({
            type:
              'success',

            title:
              'Traitement démarré',

            message:
              `${order.order_number} est maintenant en préparation.`,
          })
        }
      }
    }

  const handleViewProof =
    async (
      order:
        DigitalOrderRow,
    ) => {
      if (
        !order.payment_proof_path
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
        showToast({
          type:
            'error',

          title:
            'Preuve inaccessible',

          message:
            error?.message ??
            "Impossible d'ouvrir la preuve.",
        })

        return
      }

      setProofPreviewOrder(
        order,
      )

      setProofPreviewUrl(
        data.signedUrl,
      )
    }

  const openNoteModal =
    (
      order:
        DigitalOrderRow,
    ) => {
      setNoteOrder(
        order,
      )

      setAdminNote(
        order.admin_note ??
          '',
      )
    }

  const closeNoteModal =
    () => {
      if (
        isSavingNote
      ) {
        return
      }

      setNoteOrder(
        null,
      )

      setAdminNote(
        '',
      )
    }

  const handleSaveNote =
    async () => {
      if (!noteOrder) {
        return
      }

      setIsSavingNote(
        true,
      )

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
            admin_note:
              adminNote.trim() ||
              null,

            updated_at:
              now,
          })
          .eq(
            'id',
            noteOrder.id,
          )

      if (error) {
        showToast({
          type:
            'error',

          title:
            'Note non enregistrée',

          message:
            error.message,
        })

        setIsSavingNote(
          false,
        )

        return
      }

      setIsSavingNote(
        false,
      )

      setNoteOrder(
        null,
      )

      setAdminNote(
        '',
      )

      await loadOrders(
        false,
        false,
      )

      showToast({
        type:
          'success',

        title:
          'Note enregistrée',
      })
    }

  const openRejectionModal =
    (
      order:
        DigitalOrderRow,
    ) => {
      setRejectionOrder(
        order,
      )

      setRejectionCode(
        '',
      )

      setCustomRejectionReason(
        '',
      )
    }

  const closeRejectionModal =
    () => {
      if (
        isRejecting
      ) {
        return
      }

      setRejectionOrder(
        null,
      )

      setRejectionCode(
        '',
      )

      setCustomRejectionReason(
        '',
      )
    }

  const selectedRejection =
    rejectionReasons.find(
      (
        reason,
      ) =>
        reason.code ===
        rejectionCode,
    )

  const resolvedRejectionReason =
    rejectionCode ===
    'other'
      ? customRejectionReason.trim()
      : selectedRejection
        ?.description ??
        ''

  const canReject =
    Boolean(
      rejectionOrder,
    ) &&
    rejectionCode.length >
      0 &&
    resolvedRejectionReason.length >
      0 &&
    !isRejecting

  const handleRejectOrder =
    async () => {
      if (
        !rejectionOrder ||
        !canReject
      ) {
        return
      }

      setIsRejecting(
        true,
      )

      const now =
        new Date().toISOString()

      const orderNumber =
        rejectionOrder.order_number

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
              rejectionCode,

            rejection_reason:
              resolvedRejectionReason,

            rejected_at:
              now,

            updated_at:
              now,
          })
          .eq(
            'id',
            rejectionOrder.id,
          )

      if (error) {
        showToast({
          type:
            'error',

          title:
            'Refus impossible',

          message:
            error.message,
        })

        setIsRejecting(
          false,
        )

        return
      }

      setIsRejecting(
        false,
      )

      setRejectionOrder(
        null,
      )

      setRejectionCode(
        '',
      )

      setCustomRejectionReason(
        '',
      )

      await loadOrders(
        false,
        false,
      )

      showToast({
        type:
          'success',

        title:
          'Paiement refusé',

        message:
          `${orderNumber} a été annulée.`,
      })
    }

  const openFulfillmentModal =
    (
      order:
        DigitalOrderRow,
    ) => {
      setFulfillmentOrder(
        order,
      )

      setFulfillmentForm({
        email:
          order.fulfillment_email ??
          '',

        password:
          order.fulfillment_password ??
          '',

        code:
          order.fulfillment_code ??
          '',

        link:
          order.fulfillment_link ??
          '',

        note:
          order.fulfillment_note ??
          '',
      })
    }

  const closeFulfillmentModal =
    () => {
      if (
        isSendingFulfillment
      ) {
        return
      }

      setFulfillmentOrder(
        null,
      )

      setFulfillmentForm({
        email: '',
        password: '',
        code: '',
        link: '',
        note: '',
      })
    }

  const canSendFulfillment =
    useMemo(() => {
      if (
        !fulfillmentOrder
      ) {
        return false
      }

      const type =
        fulfillmentOrder.fulfillment_type

      if (
        type ===
        'account_credentials'
      ) {
        return (
          fulfillmentForm.email
            .trim()
            .length >
            0 &&
          fulfillmentForm.password
            .trim()
            .length >
            0
        )
      }

      if (
        type ===
        'activation_code'
      ) {
        return (
          fulfillmentForm.code
            .trim()
            .length >
          0
        )
      }

      if (
        type ===
        'activation_link'
      ) {
        return (
          fulfillmentForm.link
            .trim()
            .length >
          0
        )
      }

      if (
        type ===
        'activation_code_or_link'
      ) {
        return (
          fulfillmentForm.code
            .trim()
            .length >
            0 ||
          fulfillmentForm.link
            .trim()
            .length >
            0
        )
      }

      return (
        fulfillmentForm.note
          .trim()
          .length >
        0
      )
    }, [
      fulfillmentForm,
      fulfillmentOrder,
    ])

  const requestSendFulfillment =
    () => {
      if (
        !fulfillmentOrder ||
        !canSendFulfillment
      ) {
        return
      }

      setConfirmation({
        type:
          'fulfillment',

        order:
          fulfillmentOrder,
      })
    }

  const handleSendFulfillment =
    async () => {
      if (
        !fulfillmentOrder ||
        !canSendFulfillment
      ) {
        return
      }

      setConfirmation(
        null,
      )

      setIsSendingFulfillment(
        true,
      )

      const now =
        new Date().toISOString()

      const orderNumber =
        fulfillmentOrder.order_number

      const {
        error,
      } =
        await supabase
          .from(
            'digital_orders',
          )
          .update({
            status:
              'fulfillment_sent',

            fulfillment_status:
              'sent',

            fulfillment_email:
              fulfillmentForm.email.trim() ||
              null,

            fulfillment_password:
              fulfillmentForm.password.trim() ||
              null,

            fulfillment_code:
              fulfillmentForm.code.trim() ||
              null,

            fulfillment_link:
              fulfillmentForm.link.trim() ||
              null,

            fulfillment_note:
              fulfillmentForm.note.trim() ||
              null,

            fulfillment_sent_at:
              now,

            customer_confirmed_at:
              null,

            updated_at:
              now,
          })
          .eq(
            'id',
            fulfillmentOrder.id,
          )

      if (error) {
        showToast({
          type:
            'error',

          title:
            'Envoi impossible',

          message:
            error.message,
        })

        setIsSendingFulfillment(
          false,
        )

        return
      }

      setIsSendingFulfillment(
        false,
      )

      setFulfillmentOrder(
        null,
      )

      setFulfillmentForm({
        email: '',
        password: '',
        code: '',
        link: '',
        note: '',
      })

      await loadOrders(
        false,
        false,
      )

      showToast({
        type:
          'success',

        title:
          'Commande envoyée',

        message:
          `${orderNumber} est maintenant en attente de confirmation client.`,
      })
    }

  const openDisputeModal =
    (
      order:
        DigitalOrderRow,
    ) => {
      setDisputeOrder(
        order,
      )

      setDisputeResolution(
        order.dispute_resolution ??
          '',
      )
    }

  const closeDisputeModal =
    () => {
      if (
        isResolvingDispute
      ) {
        return
      }

      setDisputeOrder(
        null,
      )

      setDisputeResolution(
        '',
      )
    }

  const handleStartDisputeReview =
    async () => {
      if (!disputeOrder) {
        return
      }

      setIsResolvingDispute(
        true,
      )

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
            dispute_status:
              'reviewing',

            updated_at:
              now,
          })
          .eq(
            'id',
            disputeOrder.id,
          )

      if (error) {
        showToast({
          type:
            'error',

          title:
            'Litige non modifié',

          message:
            error.message,
        })

        setIsResolvingDispute(
          false,
        )

        return
      }

      setDisputeOrder(
        (
          current,
        ) =>
          current
            ? {
                ...current,

                dispute_status:
                  'reviewing',
              }
            : current,
      )

      setIsResolvingDispute(
        false,
      )

      await loadOrders(
        false,
        false,
      )

      showToast({
        type:
          'success',

        title:
          'Litige pris en charge',
      })
    }

  const handleResolveAndResend =
    async () => {
      if (
        !disputeOrder ||
        disputeResolution
          .trim()
          .length ===
          0
      ) {
        return
      }

      setIsResolvingDispute(
        true,
      )

      const now =
        new Date().toISOString()

      const orderNumber =
        disputeOrder.order_number

      const {
        error,
      } =
        await supabase
          .from(
            'digital_orders',
          )
          .update({
            status:
              'fulfillment_sent',

            fulfillment_status:
              'sent',

            dispute_status:
              'resolved',

            dispute_resolution:
              disputeResolution.trim(),

            dispute_resolved_at:
              now,

            customer_confirmed_at:
              null,

            updated_at:
              now,
          })
          .eq(
            'id',
            disputeOrder.id,
          )

      if (error) {
        showToast({
          type:
            'error',

          title:
            'Résolution impossible',

          message:
            error.message,
        })

        setIsResolvingDispute(
          false,
        )

        return
      }

      setIsResolvingDispute(
        false,
      )

      setDisputeOrder(
        null,
      )

      setDisputeResolution(
        '',
      )

      await loadOrders(
        false,
        false,
      )

      showToast({
        type:
          'success',

        title:
          'Litige résolu',

        message:
          `${orderNumber} a été renvoyée au client.`,
      })
    }

  const requestRefund =
    () => {
      if (
        !disputeOrder ||
        disputeResolution
          .trim()
          .length ===
          0
      ) {
        return
      }

      setConfirmation({
        type:
          'refund',

        order:
          disputeOrder,
      })
    }

  const handleRefundDispute =
    async () => {
      if (
        !disputeOrder ||
        disputeResolution
          .trim()
          .length ===
          0
      ) {
        return
      }

      setConfirmation(
        null,
      )

      setIsResolvingDispute(
        true,
      )

      const now =
        new Date().toISOString()

      const orderNumber =
        disputeOrder.order_number

      const {
        error,
      } =
        await supabase
          .from(
            'digital_orders',
          )
          .update({
            status:
              'refunded',

            dispute_status:
              'refunded',

            dispute_resolution:
              disputeResolution.trim(),

            dispute_resolved_at:
              now,

            updated_at:
              now,
          })
          .eq(
            'id',
            disputeOrder.id,
          )

      if (error) {
        showToast({
          type:
            'error',

          title:
            'Remboursement non enregistré',

          message:
            error.message,
        })

        setIsResolvingDispute(
          false,
        )

        return
      }

      setIsResolvingDispute(
        false,
      )

      setDisputeOrder(
        null,
      )

      setDisputeResolution(
        '',
      )

      await loadOrders(
        false,
        false,
      )

      showToast({
        type:
          'success',

        title:
          'Commande remboursée',

        message:
          `${orderNumber} est maintenant clôturée.`,
      })
    }

  const renderTimeline =
    (
      order:
        DigitalOrderRow,
    ) => {
      const status =
        normalizeStatus(
          order.status,
        )

      if (
        status ===
          'cancelled' ||
        status ===
          'refunded'
      ) {
        return (
          <div
            className={[
              'rounded-[16px] border p-4',

              status ===
              'cancelled'
                ? 'border-rose-100 bg-rose-50'
                : 'border-slate-200 bg-slate-50',
            ].join(
              ' ',
            )}
          >
            <p className="text-sm font-black text-slate-950">
              {status ===
              'cancelled'
                ? 'Commande annulée'
                : 'Commande remboursée'}
            </p>

            {order.rejection_reason && (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {
                  order.rejection_reason
                }
              </p>
            )}
          </div>
        )
      }

      if (
        status ===
        'disputed'
      ) {
        return (
          <div className="rounded-[16px] border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-black text-rose-700">
              Progression suspendue — litige ouvert
            </p>

            <p className="mt-2 text-xs leading-5 text-rose-600">
              Le workflow reste bloqué jusqu'à la résolution du dossier.
            </p>
          </div>
        )
      }

      const rank =
        status ===
          'payment_review' ||
        status ===
          'payment_partial'
          ? 0
          : status ===
              'payment_confirmed'
            ? 1
            : status ===
                'processing'
              ? 2
              : status ===
                  'fulfillment_sent'
                ? 3
                : status ===
                    'completed'
                  ? 4
                  : 0

      const steps = [
        'Paiement reçu',
        'Paiement confirmé',
        'Préparation',
        'Envoyée',
        'Confirmée',
      ]

      return (
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {steps.map(
            (
              label,
              index,
            ) => {
              const completed =
                index <=
                rank

              const current =
                index ===
                rank

              return (
                <div
                  key={
                    label
                  }
                  className="min-w-0"
                >
                  <div
                    className={[
                      'h-1.5 rounded-full',

                      completed
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-500'
                        : 'bg-slate-200',
                    ].join(
                      ' ',
                    )}
                  />

                  <p
                    className={[
                      'mt-2 text-xs font-black leading-4',

                      current
                        ? 'text-blue-600'
                        : completed
                          ? 'text-slate-700'
                          : 'text-slate-400',
                    ].join(
                      ' ',
                    )}
                  >
                    {
                      label
                    }
                  </p>
                </div>
              )
            },
          )}
        </div>
      )
    }

  return (
    <div
      dir="ltr"
      className="pb-10"
    >
      {toast && (
        <div className="fixed right-4 top-4 z-[250] w-[calc(100%-2rem)] max-w-sm">
          <div
            className={[
              'rounded-[18px] border bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.18)]',

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
                  <p className="mt-1 text-xs leading-5 text-slate-500">
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
                className="text-lg font-black text-slate-300"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <section
        className="relative overflow-hidden rounded-[30px] border border-slate-800/40 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-7"
        style={{
          background:
            'linear-gradient(135deg,#020617 0%,#0d1b3e 50%,#312e81 100%)',
        }}
      >
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />

              <span className="text-xs font-black uppercase tracking-[0.14em] text-white/65">
                TEO STORE
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black sm:text-4xl">
              Commandes numériques
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
              Supervision des traitements, livraisons, confirmations client et litiges.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-[16px] border border-white/10 bg-white/[0.06] px-4 py-3">
              <p className="text-xs font-black uppercase text-white/40">
                Commandes
              </p>

              <p
                dir="ltr"
                className="mt-1 text-lg font-black"
              >
                {formatNumber(
                  orders.length,
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadOrders(
                  false,
                  true,
                )
              }
              disabled={
                isRefreshing ||
                isLoading
              }
              className="min-h-[54px] rounded-[16px] border border-white/10 bg-white/[0.08] px-5 text-sm font-black text-white"
            >
              {isRefreshing
                ? 'Actualisation...'
                : 'Actualiser'}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          {
            label:
              'À vérifier',
            value:
              paymentReviewCount,
            className:
              'border-amber-100 bg-amber-50 text-amber-700',
          },
          {
            label:
              'Paiements partiels',
            value:
              paymentPartialCount,
            className:
              'border-orange-100 bg-orange-50 text-orange-700',
          },
          {
            label:
              'À traiter',
            value:
              processingCount,
            className:
              'border-indigo-100 bg-indigo-50 text-indigo-700',
          },
          {
            label:
              'Chez client',
            value:
              awaitingCustomerCount,
            className:
              'border-violet-100 bg-violet-50 text-violet-700',
          },
          {
            label:
              'Litiges',
            value:
              disputeCount,
            className:
              'border-rose-100 bg-rose-50 text-rose-700',
          },
          {
            label:
              'Terminées',
            value:
              completedCount,
            className:
              'border-emerald-100 bg-emerald-50 text-emerald-700',
          },
        ].map(
          (
            item,
          ) => (
            <div
              key={
                item.label
              }
              className={[
                'rounded-[20px] border p-4',

                item.className,
              ].join(
                ' ',
              )}
            >
              <p className="text-xs font-black uppercase">
                {
                  item.label
                }
              </p>

              <p
                dir="ltr"
                className="mt-2 text-3xl font-black"
              >
                {formatNumber(
                  item.value,
                )}
              </p>
            </div>
          ),
        )}
      </section>

      {requestedOrderNumber &&
        searchQuery ===
          requestedOrderNumber && (
          <section className="mt-5 rounded-[18px] border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-blue-900">
                  Commande ouverte automatiquement
                </p>

                <p
                  dir="ltr"
                  className="mt-1 text-left text-xs font-black text-blue-600"
                >
                  {
                    requestedOrderNumber
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="rounded-[11px] bg-white px-3 py-2 text-xs font-black text-blue-700"
              >
                Voir toutes les commandes
              </button>
            </div>
          </section>
        )}

      <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_250px_auto]">
          <input
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
            placeholder="Commande, client, service..."
            className="h-12 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={
              statusFilter
            }
            onChange={(
              event,
            ) =>
              setStatusFilter(
                event.target
                  .value as
                  | 'all'
                  | OrderStatus,
              )
            }
            className="h-12 rounded-[14px] border border-slate-200 bg-slate-50 px-3 text-sm font-black"
          >
            <option value="all">
              Toutes les commandes
            </option>

            <option value="payment_review">
              Paiement à vérifier
            </option>

            <option value="payment_partial">
              Complément requis
            </option>

            <option value="payment_confirmed">
              Paiement confirmé
            </option>

            <option value="processing">
              En traitement
            </option>

            <option value="fulfillment_sent">
              Envoyée au client
            </option>

            <option value="disputed">
              Litige ouvert
            </option>

            <option value="completed">
              Terminée
            </option>

            <option value="cancelled">
              Annulée
            </option>

            <option value="refunded">
              Remboursée
            </option>
          </select>

          <button
            type="button"
            onClick={
              clearFilters
            }
            disabled={
              !activeFilters
            }
            className="h-12 rounded-[14px] border border-slate-200 px-4 text-sm font-black text-slate-600 disabled:opacity-30"
          >
            Réinitialiser
          </button>
        </div>
      </section>

      {loadError && (
        <div className="mt-5 rounded-[18px] border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {
            loadError
          }
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-bold text-slate-400">
            Chargement des commandes...
          </p>
        </div>
      ) : filteredOrders.length >
        0 ? (
        <div className="mt-6 space-y-4">
          {filteredOrders.map(
            (
              order,
            ) => {
              const status =
                normalizeStatus(
                  order.status,
                )

              const isUpdating =
                updatingOrderId ===
                order.id

              return (
                <article
                  id={`admin-order-${order.id}`}
                  key={
                    order.id
                  }
                  className={[
                    'overflow-hidden rounded-[25px] border bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition-all duration-300',

                    status ===
                    'disputed'
                      ? 'border-rose-200'
                      : status ===
                          'payment_partial'
                        ? 'border-orange-200'
                        : 'border-slate-200',

                    highlightedOrderNumber ===
                    order.order_number
                      ? 'ring-4 ring-blue-200 shadow-[0_18px_60px_rgba(37,99,235,0.20)]'
                      : '',
                  ].join(
                    ' ',
                  )}
                >
                  <div className="border-b border-slate-100 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            dir="ltr"
                            className="text-left text-sm font-black text-blue-600"
                          >
                            {
                              order.order_number
                            }
                          </p>

                          <span
                            className={[
                              'rounded-full border px-3 py-1.5 text-xs font-black',

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

                        <p className="mt-2 text-xs text-slate-400">
                          Créée le{' '}

                          <span dir="ltr">
                            {formatDate(
                              order.created_at,
                            )}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {order.payment_proof_path && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleViewProof(
                                order,
                              )
                            }
                            disabled={
                              proofLoadingOrderId ===
                              order.id
                            }
                            className="rounded-[12px] border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-black text-blue-700"
                          >
                            {proofLoadingOrderId ===
                            order.id
                              ? 'Ouverture...'
                              : 'Voir la preuve'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            openNoteModal(
                              order,
                            )
                          }
                          className="rounded-[12px] border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700"
                        >
                          {order.admin_note
                            ? 'Modifier la note'
                            : 'Note interne'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-5">
                      {renderTimeline(
                        order,
                      )}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[17px] bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase text-slate-400">
                          Service
                        </p>

                        <p className="mt-2 text-sm font-black text-slate-950">
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

                      <div className="rounded-[17px] bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase text-slate-400">
                          Client
                        </p>

                        <p className="mt-2 text-sm font-black text-slate-950">
                          {
                            order.customer_name
                          }
                        </p>

                        <p
                          dir="ltr"
                          className="mt-1 text-left text-xs text-slate-500"
                        >
                          {
                            order.customer_phone
                          }
                        </p>
                      </div>

                      <div className="rounded-[17px] bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase text-slate-400">
                          Paiement
                        </p>

                        <p className="mt-2 text-sm font-black text-slate-950">
                          {order.payment_method_name ||
                            order.payment_method}
                        </p>

                        {order.payment_sender_number && (
                          <p
                            dir="ltr"
                            className="mt-1 text-left text-xs text-slate-500"
                          >
                            {
                              order.payment_sender_number
                            }
                          </p>
                        )}
                      </div>

                      <div className="rounded-[17px] bg-slate-950 p-4 text-white">
                        <p className="text-xs font-black uppercase text-white/40">
                          Total
                        </p>

                        <p
                          dir="ltr"
                          className="mt-2 text-left text-lg font-black"
                        >
                          {formatAmount(
                            order.total_amount,
                            order.currency,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {getFulfillmentTitle(
                            order.fulfillment_type,
                          )}
                        </p>
                      </div>
                    </div>

                    {status ===
                      'payment_partial' && (
                      <div className="mt-4 rounded-[18px] border border-orange-100 bg-orange-50 p-4">
                        <p className="text-sm font-black text-orange-700">
                          Paiement partiel
                        </p>

                        <p className="mt-2 text-sm text-orange-700">
                          {order.payment_issue_reason ||
                            'Le client doit compléter le paiement.'}
                        </p>
                      </div>
                    )}

                    {status ===
                      'disputed' && (
                      <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 p-4">
                        <p className="text-sm font-black text-rose-700">
                          Litige client
                        </p>

                        <p className="mt-2 text-sm font-black text-slate-950">
                          {order.dispute_reason_code ||
                            'Problème signalé'}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {order.dispute_reason ||
                            'Aucune description.'}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            openDisputeModal(
                              order,
                            )
                          }
                          className="mt-4 rounded-[13px] bg-rose-600 px-4 py-3 text-sm font-black text-white"
                        >
                          Gérer le litige
                        </button>
                      </div>
                    )}

                    {order.admin_note && (
                      <div className="mt-4 rounded-[16px] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase text-slate-400">
                          Note interne
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {
                            order.admin_note
                          }
                        </p>
                      </div>
                    )}

                    {status ===
                      'payment_review' && (
                      <div className="mt-5 grid gap-2 border-t border-slate-100 pt-5 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() =>
                            void handlePrimaryAction(
                              order,
                            )
                          }
                          disabled={
                            isUpdating
                          }
                          className="min-h-[48px] rounded-[14px] bg-blue-600 px-5 text-sm font-black text-white disabled:opacity-50"
                        >
                          {isUpdating
                            ? 'Validation...'
                            : 'Confirmer le paiement'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openRejectionModal(
                              order,
                            )
                          }
                          disabled={
                            isUpdating
                          }
                          className="min-h-[48px] rounded-[14px] border border-rose-200 text-sm font-black text-rose-600"
                        >
                          Refuser le paiement
                        </button>
                      </div>
                    )}

                    {status ===
                      'payment_confirmed' && (
                      <div className="mt-5 border-t border-slate-100 pt-5">
                        <div className="rounded-[17px] border border-indigo-100 bg-indigo-50 p-4">
                          <p className="text-sm font-black text-indigo-900">
                            Paiement validé — commande prête à traiter
                          </p>

                          <p className="mt-1 text-xs leading-5 text-indigo-600">
                            Démarrez maintenant la préparation du service.
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              void handlePrimaryAction(
                                order,
                              )
                            }
                            disabled={
                              isUpdating
                            }
                            className="mt-4 min-h-[48px] rounded-[14px] bg-indigo-600 px-5 text-sm font-black text-white disabled:opacity-50"
                          >
                            {isUpdating
                              ? 'Mise à jour...'
                              : 'Démarrer le traitement'}
                          </button>
                        </div>
                      </div>
                    )}

                    {status ===
                      'processing' && (
                      <div className="mt-5 border-t border-slate-100 pt-5">
                        <div className="rounded-[18px] border border-blue-100 bg-blue-50 p-4">
                          <p className="text-sm font-black text-blue-800">
                            Livraison obligatoire
                          </p>

                          <p className="mt-1 text-xs leading-5 text-blue-600">
                            Envoyez le service au client pour poursuivre la commande.
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              openFulfillmentModal(
                                order,
                              )
                            }
                            className="mt-4 min-h-[46px] rounded-[13px] bg-blue-600 px-5 text-sm font-black text-white"
                          >
                            Envoyer au client
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            },
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-black text-slate-700">
            Aucune commande trouvée
          </p>

          <button
            type="button"
            onClick={
              clearFilters
            }
            className="mt-4 rounded-[12px] bg-slate-950 px-4 py-2.5 text-sm font-black text-white"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {proofPreviewUrl &&
        proofPreviewOrder && (
          <div
            className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 p-4"
            onClick={() => {
              setProofPreviewUrl(
                null,
              )

              setProofPreviewOrder(
                null,
              )
            }}
          >
            <div
              className="w-full max-w-2xl overflow-hidden rounded-[26px] bg-white"
              onClick={(
                event,
              ) =>
                event.stopPropagation()
              }
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <p className="text-sm font-black">
                    Preuve de paiement
                  </p>

                  <p
                    dir="ltr"
                    className="mt-1 text-left text-xs font-black text-blue-600"
                  >
                    {
                      proofPreviewOrder.order_number
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProofPreviewUrl(
                      null,
                    )

                    setProofPreviewOrder(
                      null,
                    )
                  }}
                  className="h-10 w-10 rounded-xl bg-slate-100 text-lg font-black"
                >
                  ×
                </button>
              </div>

              <div className="bg-slate-100 p-4">
                <img
                  src={
                    proofPreviewUrl
                  }
                  alt="Preuve de paiement"
                  className="mx-auto max-h-[70vh] max-w-full rounded-[18px] object-contain"
                />
              </div>
            </div>
          </div>
        )}

      {noteOrder && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg rounded-[26px] bg-white p-6">
            <h3 className="text-xl font-black">
              Note interne
            </h3>

            <p
              dir="ltr"
              className="mt-1 text-left text-xs font-black text-blue-600"
            >
              {
                noteOrder.order_number
              }
            </p>

            <textarea
              rows={6}
              value={
                adminNote
              }
              onChange={(
                event,
              ) =>
                setAdminNote(
                  event.target.value,
                )
              }
              className="mt-5 w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50 p-4 text-sm"
              placeholder="Ajoutez une note visible uniquement par l'administration..."
            />

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={
                  closeNoteModal
                }
                className="h-12 rounded-[14px] border border-slate-200 font-black"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleSaveNote()
                }
                disabled={
                  isSavingNote
                }
                className="h-12 rounded-[14px] bg-blue-600 font-black text-white disabled:opacity-40"
              >
                {isSavingNote
                  ? 'Enregistrement...'
                  : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectionOrder && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[26px] bg-white p-6">
            <h3 className="text-xl font-black">
              Refuser le paiement
            </h3>

            <p
              dir="ltr"
              className="mt-1 text-left text-xs font-black text-blue-600"
            >
              {
                rejectionOrder.order_number
              }
            </p>

            <div className="mt-5 space-y-2">
              {rejectionReasons.map(
                (
                  reason,
                ) => (
                  <button
                    key={
                      reason.code
                    }
                    type="button"
                    onClick={() =>
                      setRejectionCode(
                        reason.code,
                      )
                    }
                    className={[
                      'w-full rounded-[16px] border p-4 text-left',

                      rejectionCode ===
                      reason.code
                        ? 'border-rose-300 bg-rose-50'
                        : 'border-slate-200',
                    ].join(
                      ' ',
                    )}
                  >
                    <p className="text-sm font-black">
                      {
                        reason.label
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {
                        reason.description
                      }
                    </p>
                  </button>
                ),
              )}
            </div>

            {rejectionCode ===
              'other' && (
              <textarea
                rows={4}
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
                className="mt-4 w-full rounded-[14px] border border-slate-200 p-3 text-sm"
                placeholder="Décrivez précisément la raison..."
              />
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={
                  closeRejectionModal
                }
                className="h-12 rounded-[14px] border border-slate-200 font-black"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleRejectOrder()
                }
                disabled={
                  !canReject
                }
                className="h-12 rounded-[14px] bg-rose-600 font-black text-white disabled:opacity-40"
              >
                {isRejecting
                  ? 'Refus...'
                  : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {fulfillmentOrder && (
        <div className="fixed inset-0 z-[180] flex items-end justify-center bg-slate-950/70 sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 sm:max-w-xl sm:rounded-[28px] sm:p-6">
            <h3 className="text-xl font-black">
              {getFulfillmentTitle(
                fulfillmentOrder.fulfillment_type,
              )}
            </h3>

            <p
              dir="ltr"
              className="mt-1 text-left text-sm font-black text-blue-600"
            >
              {
                fulfillmentOrder.order_number
              }
            </p>

            {fulfillmentOrder.fulfillment_type ===
              'account_credentials' && (
              <div className="mt-5 space-y-3">
                <input
                  type="text"
                  value={
                    fulfillmentForm.email
                  }
                  onChange={(
                    event,
                  ) =>
                    setFulfillmentForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        email:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="E-mail / Identifiant"
                  className="h-12 w-full rounded-[14px] border border-slate-200 px-4"
                />

                <input
                  type="text"
                  value={
                    fulfillmentForm.password
                  }
                  onChange={(
                    event,
                  ) =>
                    setFulfillmentForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        password:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="Mot de passe"
                  className="h-12 w-full rounded-[14px] border border-slate-200 px-4"
                />
              </div>
            )}

            {[
              'activation_code',
              'activation_code_or_link',
            ].includes(
              fulfillmentOrder.fulfillment_type ??
                '',
            ) && (
              <input
                type="text"
                value={
                  fulfillmentForm.code
                }
                onChange={(
                  event,
                ) =>
                  setFulfillmentForm(
                    (
                      current,
                    ) => ({
                      ...current,

                      code:
                        event.target.value,
                    }),
                  )
                }
                placeholder="Code d'activation"
                className="mt-5 h-12 w-full rounded-[14px] border border-slate-200 px-4"
              />
            )}

            {[
              'activation_link',
              'activation_code_or_link',
            ].includes(
              fulfillmentOrder.fulfillment_type ??
                '',
            ) && (
              <input
                type="url"
                value={
                  fulfillmentForm.link
                }
                onChange={(
                  event,
                ) =>
                  setFulfillmentForm(
                    (
                      current,
                    ) => ({
                      ...current,

                      link:
                        event.target.value,
                    }),
                  )
                }
                placeholder="Lien d'activation"
                className="mt-5 h-12 w-full rounded-[14px] border border-slate-200 px-4"
              />
            )}

            <textarea
              rows={4}
              value={
                fulfillmentForm.note
              }
              onChange={(
                event,
              ) =>
                setFulfillmentForm(
                  (
                    current,
                  ) => ({
                    ...current,

                    note:
                      event.target.value,
                  }),
                )
              }
              placeholder="Message au client..."
              className="mt-5 w-full rounded-[16px] border border-slate-200 p-4"
            />

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={
                  closeFulfillmentModal
                }
                className="h-12 rounded-[14px] border border-slate-200 font-black"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={
                  requestSendFulfillment
                }
                disabled={
                  !canSendFulfillment ||
                  isSendingFulfillment
                }
                className="h-12 rounded-[14px] bg-blue-600 font-black text-white disabled:opacity-40"
              >
                Envoyer au client
              </button>
            </div>
          </div>
        </div>
      )}

      {disputeOrder && (
        <div className="fixed inset-0 z-[180] flex items-end justify-center bg-slate-950/70 sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 sm:max-w-xl sm:rounded-[28px]">
            <p className="text-xs font-black uppercase text-rose-600">
              Litige Digital
            </p>

            <h3 className="mt-2 text-xl font-black">
              Gérer le problème client
            </h3>

            <p
              dir="ltr"
              className="mt-1 text-left text-sm font-black text-blue-600"
            >
              {
                disputeOrder.order_number
              }
            </p>

            <div className="mt-5 rounded-[18px] border border-rose-100 bg-rose-50 p-4">
              <p className="text-sm font-black">
                {disputeOrder.dispute_reason_code ||
                  'Problème signalé'}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {disputeOrder.dispute_reason ||
                  'Aucun détail supplémentaire.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleStartDisputeReview()
              }
              disabled={
                disputeOrder.dispute_status ===
                  'reviewing' ||
                isResolvingDispute
              }
              className="mt-4 h-11 w-full rounded-[14px] border border-blue-100 bg-blue-50 text-sm font-black text-blue-700 disabled:opacity-50"
            >
              {disputeOrder.dispute_status ===
              'reviewing'
                ? 'Litige en cours de traitement'
                : 'Prendre le litige en charge'}
            </button>

            <textarea
              rows={5}
              value={
                disputeResolution
              }
              onChange={(
                event,
              ) =>
                setDisputeResolution(
                  event.target.value,
                )
              }
              placeholder="Expliquez au client comment le problème a été résolu..."
              className="mt-5 w-full rounded-[16px] border border-slate-200 p-4 text-sm"
            />

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={
                  requestRefund
                }
                disabled={
                  disputeResolution
                    .trim()
                    .length ===
                    0 ||
                  isResolvingDispute
                }
                className="h-12 rounded-[14px] bg-rose-600 text-sm font-black text-white disabled:opacity-40"
              >
                Rembourser et clôturer
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleResolveAndResend()
                }
                disabled={
                  disputeResolution
                    .trim()
                    .length ===
                    0 ||
                  isResolvingDispute
                }
                className="h-12 rounded-[14px] bg-blue-600 text-sm font-black text-white disabled:opacity-40"
              >
                Résoudre et renvoyer
              </button>
            </div>

            <button
              type="button"
              onClick={
                closeDisputeModal
              }
              className="mt-3 h-11 w-full rounded-[14px] border border-slate-200 font-black text-slate-600"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {confirmation && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/75 p-4">
          <div className="w-full max-w-md rounded-[26px] bg-white p-6">
            <h3 className="text-xl font-black">
              {confirmation.type ===
              'refund'
                ? 'Confirmer le remboursement'
                : 'Envoyer la commande'}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {confirmation.type ===
              'refund'
                ? `La commande ${confirmation.order.order_number} sera marquée comme remboursée.`
                : `Les informations de livraison de ${confirmation.order.order_number} seront envoyées au client.`}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmation(
                    null,
                  )
                }
                className="h-12 rounded-[14px] border border-slate-200 font-black"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  if (
                    confirmation.type ===
                    'refund'
                  ) {
                    void handleRefundDispute()

                    return
                  }

                  void handleSendFulfillment()
                }}
                className={[
                  'h-12 rounded-[14px] font-black text-white',

                  confirmation.type ===
                  'refund'
                    ? 'bg-rose-600'
                    : 'bg-blue-600',
                ].join(
                  ' ',
                )}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrdersPage