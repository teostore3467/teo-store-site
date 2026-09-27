import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  supabase,
} from '../../../lib/supabase'

type SettingsTab =
  | 'store'
  | 'payments'
  | 'orders'
  | 'reviews'
  | 'maintenance'

type StoreSettings = {
  storeName: string
  sloganFr: string
  sloganAr: string
  currency: string
  country: string
}

type SupportSettings = {
  phone: string
  whatsapp: string
  email: string
  supportMessageFr: string
  supportMessageAr: string
}

type PaymentSettings = {
  id:
    | 'bankily'
    | 'masrvi'
    | 'sedad'

  name: string
  number: string
  active: boolean
  instructionsFr: string
  instructionsAr: string
}

type OrderSettings = {
  estimatedProcessingMinutes: number
  allowDisputes: boolean
  disputeWindowHours: number
  customerConfirmationRequired: boolean
  paymentReviewMessageFr: string
  paymentReviewMessageAr: string
  processingMessageFr: string
  processingMessageAr: string
}

type ReviewSettings = {
  enabled: boolean
  allowComment: boolean
  publicReviews: boolean
  minimumPublicRating: number
  showAverageRating: boolean
}

type MaintenanceSettings = {
  enabled: boolean
  messageFr: string
  messageAr: string
}

type AppSettingsRow = {
  setting_key: string
  setting_value: Record<
    string,
    unknown
  >
  is_public: boolean
  updated_at: string
}

type ToastState = {
  type:
    | 'success'
    | 'error'
    | 'info'

  title: string
  message?: string
}

const defaultStoreSettings:
  StoreSettings = {
    storeName:
      'TEO STORE',

    sloganFr:
      'Services numériques simples et rapides',

    sloganAr:
      'خدمات رقمية بسيطة وسريعة',

    currency:
      'MRU',

    country:
      'Mauritanie',
  }

const defaultSupportSettings:
  SupportSettings = {
    phone: '',
    whatsapp: '',
    email: '',

    supportMessageFr:
      "Besoin d'aide ? Contactez TEO STORE.",

    supportMessageAr:
      'تحتاج مساعدة؟ تواصل مع TEO STORE.',
  }

const defaultPayments:
  PaymentSettings[] = [
    {
      id:
        'bankily',

      name:
        'Bankily',

      number:
        '37109097',

      active:
        true,

      instructionsFr:
        'Effectuez le paiement puis envoyez la preuve.',

      instructionsAr:
        'قم بالدفع ثم أرسل إثبات العملية.',
    },
    {
      id:
        'masrvi',

      name:
        'Masrvi',

      number:
        '37109097',

      active:
        true,

      instructionsFr:
        'Effectuez le paiement puis envoyez la preuve.',

      instructionsAr:
        'قم بالدفع ثم أرسل إثبات العملية.',
    },
    {
      id:
        'sedad',

      name:
        'Sedad',

      number:
        '37109097',

      active:
        true,

      instructionsFr:
        'Effectuez le paiement puis envoyez la preuve.',

      instructionsAr:
        'قم بالدفع ثم أرسل إثبات العملية.',
    },
  ]

const defaultOrderSettings:
  OrderSettings = {
    estimatedProcessingMinutes:
      30,

    allowDisputes:
      true,

    disputeWindowHours:
      72,

    customerConfirmationRequired:
      true,

    paymentReviewMessageFr:
      'Votre paiement est en cours de vérification.',

    paymentReviewMessageAr:
      'عملية الدفع قيد التحقق.',

    processingMessageFr:
      'Votre commande est en cours de préparation.',

    processingMessageAr:
      'طلبك قيد التجهيز.',
  }

const defaultReviewSettings:
  ReviewSettings = {
    enabled:
      true,

    allowComment:
      true,

    publicReviews:
      false,

    minimumPublicRating:
      4,

    showAverageRating:
      false,
  }

const defaultMaintenanceSettings:
  MaintenanceSettings = {
    enabled:
      false,

    messageFr:
      'TEO STORE est temporairement en maintenance.',

    messageAr:
      'TEO STORE قيد الصيانة مؤقتا.',
  }

function AdminSettingsPage() {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<SettingsTab>(
      'store',
    )

  const [
    storeSettings,
    setStoreSettings,
  ] =
    useState<StoreSettings>(
      defaultStoreSettings,
    )

  const [
    supportSettings,
    setSupportSettings,
  ] =
    useState<SupportSettings>(
      defaultSupportSettings,
    )

  const [
    payments,
    setPayments,
  ] =
    useState<PaymentSettings[]>(
      defaultPayments,
    )

  const [
    orderSettings,
    setOrderSettings,
  ] =
    useState<OrderSettings>(
      defaultOrderSettings,
    )

  const [
    reviewSettings,
    setReviewSettings,
  ] =
    useState<ReviewSettings>(
      defaultReviewSettings,
    )

  const [
    maintenanceSettings,
    setMaintenanceSettings,
  ] =
    useState<MaintenanceSettings>(
      defaultMaintenanceSettings,
    )

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true)

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false)

  const [
    lastUpdatedAt,
    setLastUpdatedAt,
  ] =
    useState<
      string | null
    >(null)

  const [
    loadError,
    setLoadError,
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

  const loadSettings =
    useCallback(
      async (
        initial =
          false,
      ) => {
        if (initial) {
          setIsLoading(
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
              'app_settings',
            )
            .select(
              `
                setting_key,
                setting_value,
                is_public,
                updated_at
              `,
            )

        if (error) {
          console.error(
            'Unable to load settings:',
            error,
          )

          setLoadError(
            error.message,
          )

          setIsLoading(
            false,
          )

          return
        }

        const rows =
          (data ??
            []) as AppSettingsRow[]

        const findValue =
          (
            key:
              string,
          ) =>
            rows.find(
              (
                row,
              ) =>
                row.setting_key ===
                key,
            )
              ?.setting_value

        const store =
          findValue(
            'store',
          )

        if (store) {
          setStoreSettings(
            {
              ...defaultStoreSettings,
              ...store,
            } as StoreSettings,
          )
        }

        const support =
          findValue(
            'support',
          )

        if (support) {
          setSupportSettings(
            {
              ...defaultSupportSettings,
              ...support,
            } as SupportSettings,
          )
        }

        setPayments(
          defaultPayments.map(
            (
              defaultPayment,
            ) => {
              const value =
                findValue(
                  `payment_${defaultPayment.id}`,
                )

              if (!value) {
                return defaultPayment
              }

              return {
                ...defaultPayment,
                ...value,
              } as PaymentSettings
            },
          ),
        )

        const orders =
          findValue(
            'orders',
          )

        if (orders) {
          setOrderSettings(
            {
              ...defaultOrderSettings,
              ...orders,
            } as OrderSettings,
          )
        }

        const reviews =
          findValue(
            'reviews',
          )

        if (reviews) {
          setReviewSettings(
            {
              ...defaultReviewSettings,
              ...reviews,
            } as ReviewSettings,
          )
        }

        const maintenance =
          findValue(
            'maintenance',
          )

        if (
          maintenance
        ) {
          setMaintenanceSettings(
            {
              ...defaultMaintenanceSettings,
              ...maintenance,
            } as MaintenanceSettings,
          )
        }

        const latest =
          rows
            .map(
              (
                row,
              ) =>
                row.updated_at,
            )
            .filter(
              Boolean,
            )
            .sort()
            .at(
              -1,
            )

        setLastUpdatedAt(
          latest ??
            null,
        )

        setIsLoading(
          false,
        )
      },
      [],
    )

  useEffect(() => {
    let active =
      true

    void loadSettings(
      true,
    )

    const channel =
      supabase
        .channel(
          `admin-settings-${Date.now()}`,
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema:
              'public',
            table:
              'app_settings',
          },
          () => {
            if (
              active
            ) {
              void loadSettings()
            }
          },
        )
        .subscribe()

    return () => {
      active =
        false

      void supabase
        .removeChannel(
          channel,
        )
    }
  }, [
    loadSettings,
  ])

  const saveSetting =
    async (
      key: string,
      value:
        Record<
          string,
          unknown
        >,
      isPublic =
        true,
    ) => {
      const {
        error,
      } =
        await supabase
          .from(
            'app_settings',
          )
          .upsert(
            {
              setting_key:
                key,

              setting_value:
                value,

              is_public:
                isPublic,
            },
            {
              onConflict:
                'setting_key',
            },
          )

      if (error) {
        throw error
      }
    }

  const handleSaveAll =
    async () => {
      if (
        isSaving
      ) {
        return
      }

      setIsSaving(
        true,
      )

      try {
        await Promise.all([
          saveSetting(
            'store',
            {
              ...storeSettings,
            },
          ),

          saveSetting(
            'support',
            {
              ...supportSettings,
            },
          ),

          ...payments.map(
            (
              payment,
            ) =>
              saveSetting(
                `payment_${payment.id}`,
                {
                  ...payment,
                },
              ),
          ),

          saveSetting(
            'orders',
            {
              ...orderSettings,
            },
          ),

          saveSetting(
            'reviews',
            {
              ...reviewSettings,
            },
          ),

          saveSetting(
            'maintenance',
            {
              ...maintenanceSettings,
            },
          ),
        ])

        await loadSettings()

        showToast({
          type:
            'success',

          title:
            'Paramètres enregistrés',

          message:
            'Les modifications de TEO STORE ont été enregistrées avec succès.',
        })
      } catch (
        error
      ) {
        console.error(
          'Unable to save settings:',
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
              : 'Une erreur inattendue est survenue.',
        })
      } finally {
        setIsSaving(
          false,
        )
      }
    }

  const updatePayment =
    (
      id:
        PaymentSettings['id'],
      values:
        Partial<PaymentSettings>,
    ) => {
      setPayments(
        (
          current,
        ) =>
          current.map(
            (
              payment,
            ) =>
              payment.id ===
              id
                ? {
                    ...payment,
                    ...values,
                  }
                : payment,
          ),
      )
    }

  const formatDate =
    (
      value:
        | string
        | null,
    ) => {
      if (!value) {
        return '—'
      }

      return new Intl.DateTimeFormat(
        'fr-FR-u-nu-latn',
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
    }

  const tabs =
    useMemo(
      () => [
        {
          id:
            'store' as const,

          label:
            'Boutique',

          description:
            'Identité et support',
        },
        {
          id:
            'payments' as const,

          label:
            'Paiements',

          description:
            'Bankily, Masrvi, Sedad',
        },
        {
          id:
            'orders' as const,

          label:
            'Commandes',

          description:
            'Workflow client',
        },
        {
          id:
            'reviews' as const,

          label:
            'Évaluations',

          description:
            'Avis clients',
        },
        {
          id:
            'maintenance' as const,

          label:
            'Système',

          description:
            'Maintenance',
        },
      ],
      [],
    )

  if (
    isLoading
  ) {
    return (
      <div
        dir="ltr"
        className="flex min-h-[420px] items-center justify-center"
      >
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-black text-slate-500">
            Chargement des paramètres...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      dir="ltr"
      className="min-w-0 pb-10"
    >
      {toast && (
        <div className="fixed right-4 top-4 z-[300] w-[calc(100%-2rem)] max-w-sm">
          <div
            className={[
              'rounded-[18px] border bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.20)]',

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
            <div className="flex items-start gap-3">
              <div
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black',

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
                  <p className="mt-1 text-sm leading-5 text-slate-500">
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
                className="text-xl font-black text-slate-300"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <section
        className="relative overflow-hidden rounded-[28px] border border-slate-800/40 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:p-7"
        style={{
          background:
            'linear-gradient(135deg,#020617 0%,#10265b 52%,#312e81 100%)',
        }}
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-[90px]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <span className="text-xs font-black uppercase tracking-[0.14em] text-white/65">
                TEO STORE CONTROL CENTER
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Paramètres
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
              Gérez les informations de la boutique, les paiements, les commandes, les évaluations et l'état du système.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="rounded-[15px] border border-white/10 bg-white/[0.06] px-4 py-3">
              <p className="text-xs font-black uppercase text-white/40">
                Dernière modification
              </p>

              <p
                dir="ltr"
                className="mt-1 text-sm font-black text-white"
              >
                {formatDate(
                  lastUpdatedAt,
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleSaveAll()
              }
              disabled={
                isSaving
              }
              className="min-h-[54px] rounded-[15px] bg-blue-500 px-6 text-sm font-black text-white transition hover:bg-blue-400 disabled:opacity-50"
            >
              {isSaving
                ? 'Enregistrement...'
                : 'Enregistrer tout'}
            </button>
          </div>
        </div>
      </section>

      {loadError && (
        <div className="mt-4 rounded-[16px] border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-black text-rose-700">
            Impossible de charger les paramètres
          </p>

          <p className="mt-1 text-sm text-rose-600">
            {
              loadError
            }
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm">
          {tabs.map(
            (
              tab,
            ) => {
              const active =
                tab.id ===
                activeTab

              return (
                <button
                  key={
                    tab.id
                  }
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab.id,
                    )
                  }
                  className={[
                    'mb-1 w-full rounded-[14px] px-4 py-3 text-left transition last:mb-0',

                    active
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-700 hover:bg-slate-50',
                  ].join(
                    ' ',
                  )}
                >
                  <p className="text-sm font-black">
                    {
                      tab.label
                    }
                  </p>

                  <p
                    className={[
                      'mt-1 text-xs',

                      active
                        ? 'text-white/50'
                        : 'text-slate-400',
                    ].join(
                      ' ',
                    )}
                  >
                    {
                      tab.description
                    }
                  </p>
                </button>
              )
            },
          )}
        </aside>

        <div className="min-w-0">
          {activeTab ===
            'store' && (
            <div className="space-y-4">
              <SettingsCard
                title="Identité de la boutique"
                description="Informations générales visibles sur TEO STORE."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Nom de la boutique"
                    value={
                      storeSettings.storeName
                    }
                    onChange={(
                      value,
                    ) =>
                      setStoreSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          storeName:
                            value,
                        }),
                      )
                    }
                  />

                  <TextField
                    label="Devise"
                    value={
                      storeSettings.currency
                    }
                    onChange={(
                      value,
                    ) =>
                      setStoreSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          currency:
                            value,
                        }),
                      )
                    }
                  />

                  <TextField
                    label="Pays"
                    value={
                      storeSettings.country
                    }
                    onChange={(
                      value,
                    ) =>
                      setStoreSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          country:
                            value,
                        }),
                      )
                    }
                  />

                  <div />

                  <TextAreaField
                    label="Slogan français"
                    value={
                      storeSettings.sloganFr
                    }
                    onChange={(
                      value,
                    ) =>
                      setStoreSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          sloganFr:
                            value,
                        }),
                      )
                    }
                  />

                  <TextAreaField
                    label="Slogan arabe"
                    value={
                      storeSettings.sloganAr
                    }
                    dir="rtl"
                    onChange={(
                      value,
                    ) =>
                      setStoreSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          sloganAr:
                            value,
                        }),
                      )
                    }
                  />
                </div>
              </SettingsCard>

              <SettingsCard
                title="Support client"
                description="Coordonnées utilisées pour aider les clients."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Téléphone"
                    value={
                      supportSettings.phone
                    }
                    dir="ltr"
                    onChange={(
                      value,
                    ) =>
                      setSupportSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          phone:
                            value,
                        }),
                      )
                    }
                  />

                  <TextField
                    label="WhatsApp"
                    value={
                      supportSettings.whatsapp
                    }
                    dir="ltr"
                    onChange={(
                      value,
                    ) =>
                      setSupportSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          whatsapp:
                            value,
                        }),
                      )
                    }
                  />

                  <TextField
                    label="E-mail"
                    value={
                      supportSettings.email
                    }
                    type="email"
                    dir="ltr"
                    onChange={(
                      value,
                    ) =>
                      setSupportSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          email:
                            value,
                        }),
                      )
                    }
                  />

                  <div />

                  <TextAreaField
                    label="Message support français"
                    value={
                      supportSettings.supportMessageFr
                    }
                    onChange={(
                      value,
                    ) =>
                      setSupportSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          supportMessageFr:
                            value,
                        }),
                      )
                    }
                  />

                  <TextAreaField
                    label="Message support arabe"
                    value={
                      supportSettings.supportMessageAr
                    }
                    dir="rtl"
                    onChange={(
                      value,
                    ) =>
                      setSupportSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          supportMessageAr:
                            value,
                        }),
                      )
                    }
                  />
                </div>
              </SettingsCard>
            </div>
          )}

          {activeTab ===
            'payments' && (
            <div className="space-y-4">
              {payments.map(
                (
                  payment,
                ) => (
                  <SettingsCard
                    key={
                      payment.id
                    }
                    title={
                      payment.name
                    }
                    description={`Compte de réception ${payment.name}`}
                    action={
                      <Toggle
                        checked={
                          payment.active
                        }
                        label={
                          payment.active
                            ? 'Actif'
                            : 'Inactif'
                        }
                        onChange={(
                          checked,
                        ) =>
                          updatePayment(
                            payment.id,
                            {
                              active:
                                checked,
                            },
                          )
                        }
                      />
                    }
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        label="Nom"
                        value={
                          payment.name
                        }
                        onChange={(
                          value,
                        ) =>
                          updatePayment(
                            payment.id,
                            {
                              name:
                                value,
                            },
                          )
                        }
                      />

                      <TextField
                        label="Numéro de réception"
                        value={
                          payment.number
                        }
                        dir="ltr"
                        onChange={(
                          value,
                        ) =>
                          updatePayment(
                            payment.id,
                            {
                              number:
                                value,
                            },
                          )
                        }
                      />

                      <TextAreaField
                        label="Instructions françaises"
                        value={
                          payment.instructionsFr
                        }
                        onChange={(
                          value,
                        ) =>
                          updatePayment(
                            payment.id,
                            {
                              instructionsFr:
                                value,
                            },
                          )
                        }
                      />

                      <TextAreaField
                        label="Instructions arabes"
                        value={
                          payment.instructionsAr
                        }
                        dir="rtl"
                        onChange={(
                          value,
                        ) =>
                          updatePayment(
                            payment.id,
                            {
                              instructionsAr:
                                value,
                            },
                          )
                        }
                      />
                    </div>
                  </SettingsCard>
                ),
              )}
            </div>
          )}

          {activeTab ===
            'orders' && (
            <div className="space-y-4">
              <SettingsCard
                title="Traitement des commandes"
                description="Paramètres généraux du workflow client."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    label="Temps estimé de traitement (minutes)"
                    value={
                      orderSettings.estimatedProcessingMinutes
                    }
                    min={
                      1
                    }
                    onChange={(
                      value,
                    ) =>
                      setOrderSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          estimatedProcessingMinutes:
                            value,
                        }),
                      )
                    }
                  />

                  <NumberField
                    label="Délai maximum de litige (heures)"
                    value={
                      orderSettings.disputeWindowHours
                    }
                    min={
                      1
                    }
                    onChange={(
                      value,
                    ) =>
                      setOrderSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          disputeWindowHours:
                            value,
                        }),
                      )
                    }
                  />
                </div>

                <div className="mt-5 space-y-3">
                  <ToggleRow
                    title="Autoriser les litiges"
                    description="Le client peut signaler un problème après livraison."
                    checked={
                      orderSettings.allowDisputes
                    }
                    onChange={(
                      checked,
                    ) =>
                      setOrderSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          allowDisputes:
                            checked,
                        }),
                      )
                    }
                  />

                  <ToggleRow
                    title="Confirmation client obligatoire"
                    description="Le client doit confirmer la réception avant de terminer la commande."
                    checked={
                      orderSettings.customerConfirmationRequired
                    }
                    onChange={(
                      checked,
                    ) =>
                      setOrderSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          customerConfirmationRequired:
                            checked,
                        }),
                      )
                    }
                  />
                </div>
              </SettingsCard>

              <SettingsCard
                title="Messages de suivi"
                description="Textes pouvant être affichés au client pendant le traitement."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextAreaField
                    label="Vérification du paiement — français"
                    value={
                      orderSettings.paymentReviewMessageFr
                    }
                    onChange={(
                      value,
                    ) =>
                      setOrderSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          paymentReviewMessageFr:
                            value,
                        }),
                      )
                    }
                  />

                  <TextAreaField
                    label="Vérification du paiement — arabe"
                    value={
                      orderSettings.paymentReviewMessageAr
                    }
                    dir="rtl"
                    onChange={(
                      value,
                    ) =>
                      setOrderSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          paymentReviewMessageAr:
                            value,
                        }),
                      )
                    }
                  />

                  <TextAreaField
                    label="Commande en préparation — français"
                    value={
                      orderSettings.processingMessageFr
                    }
                    onChange={(
                      value,
                    ) =>
                      setOrderSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          processingMessageFr:
                            value,
                        }),
                      )
                    }
                  />

                  <TextAreaField
                    label="Commande en préparation — arabe"
                    value={
                      orderSettings.processingMessageAr
                    }
                    dir="rtl"
                    onChange={(
                      value,
                    ) =>
                      setOrderSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          processingMessageAr:
                            value,
                        }),
                      )
                    }
                  />
                </div>
              </SettingsCard>
            </div>
          )}

          {activeTab ===
            'reviews' && (
            <SettingsCard
              title="Évaluations clients"
              description="Contrôlez le système d'avis après commande."
            >
              <div className="space-y-3">
                <ToggleRow
                  title="Activer les évaluations"
                  description="Les clients peuvent noter une commande terminée."
                  checked={
                    reviewSettings.enabled
                  }
                  onChange={(
                    checked,
                  ) =>
                    setReviewSettings(
                      (
                        current,
                      ) => ({
                        ...current,

                        enabled:
                          checked,
                      }),
                    )
                  }
                />

                <ToggleRow
                  title="Autoriser les commentaires"
                  description="Permet au client d'ajouter un commentaire avec les étoiles."
                  checked={
                    reviewSettings.allowComment
                  }
                  onChange={(
                    checked,
                  ) =>
                    setReviewSettings(
                      (
                        current,
                      ) => ({
                        ...current,

                        allowComment:
                          checked,
                      }),
                    )
                  }
                />

                <ToggleRow
                  title="Afficher les avis publiquement"
                  description="Prépare l'affichage futur des avis sur les pages publiques."
                  checked={
                    reviewSettings.publicReviews
                  }
                  onChange={(
                    checked,
                  ) =>
                    setReviewSettings(
                      (
                        current,
                      ) => ({
                        ...current,

                        publicReviews:
                          checked,
                      }),
                    )
                  }
                />

                <ToggleRow
                  title="Afficher la note moyenne"
                  description="Affiche la moyenne générale des évaluations."
                  checked={
                    reviewSettings.showAverageRating
                  }
                  onChange={(
                    checked,
                  ) =>
                    setReviewSettings(
                      (
                        current,
                      ) => ({
                        ...current,

                        showAverageRating:
                          checked,
                      }),
                    )
                  }
                />

                <div className="pt-3">
                  <NumberField
                    label="Note minimum pour affichage public"
                    value={
                      reviewSettings.minimumPublicRating
                    }
                    min={
                      1
                    }
                    max={
                      5
                    }
                    onChange={(
                      value,
                    ) =>
                      setReviewSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          minimumPublicRating:
                            Math.max(
                              1,
                              Math.min(
                                5,
                                value,
                              ),
                            ),
                        }),
                      )
                    }
                  />
                </div>
              </div>
            </SettingsCard>
          )}

          {activeTab ===
            'maintenance' && (
            <div className="space-y-4">
              <SettingsCard
                title="État du site"
                description="Contrôlez le mode maintenance."
              >
                <ToggleRow
                  title="Mode maintenance"
                  description="Lorsque cette option est activée, vous pourrez bloquer temporairement l'accès public."
                  checked={
                    maintenanceSettings.enabled
                  }
                  danger
                  onChange={(
                    checked,
                  ) =>
                    setMaintenanceSettings(
                      (
                        current,
                      ) => ({
                        ...current,

                        enabled:
                          checked,
                      }),
                    )
                  }
                />

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <TextAreaField
                    label="Message maintenance français"
                    value={
                      maintenanceSettings.messageFr
                    }
                    onChange={(
                      value,
                    ) =>
                      setMaintenanceSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          messageFr:
                            value,
                        }),
                      )
                    }
                  />

                  <TextAreaField
                    label="Message maintenance arabe"
                    value={
                      maintenanceSettings.messageAr
                    }
                    dir="rtl"
                    onChange={(
                      value,
                    ) =>
                      setMaintenanceSettings(
                        (
                          current,
                        ) => ({
                          ...current,

                          messageAr:
                            value,
                        }),
                      )
                    }
                  />
                </div>

                {maintenanceSettings.enabled && (
                  <div className="mt-4 rounded-[15px] border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-black text-amber-800">
                      Mode maintenance activé
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-700">
                      Le paramètre est actif. L'étape suivante sera de connecter le layout public à cette valeur pour afficher automatiquement l'écran de maintenance.
                    </p>
                  </div>
                )}
              </SettingsCard>

              <SettingsCard
                title="Sécurité"
                description="Informations importantes concernant les paramètres sensibles."
              >
                <div className="rounded-[15px] border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-black text-blue-900">
                    Clés privées protégées
                  </p>

                  <p className="mt-2 text-sm leading-6 text-blue-700">
                    Les mots de passe, la Service Role Key Supabase et les secrets serveur ne sont jamais modifiables depuis cette page.
                  </p>
                </div>
              </SettingsCard>
            </div>
          )}

          <div className="sticky bottom-3 mt-5">
            <div className="flex flex-col gap-3 rounded-[18px] border border-slate-200 bg-white/95 p-3 shadow-[0_15px_50px_rgba(15,23,42,0.12)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">
                  Enregistrer les modifications
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  Tous les onglets seront enregistrés dans Supabase.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleSaveAll()
                }
                disabled={
                  isSaving
                }
                className="min-h-[46px] rounded-[13px] bg-blue-600 px-6 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {isSaving
                  ? 'Enregistrement...'
                  : 'Enregistrer tout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type SettingsCardProps = {
  title: string
  description: string
  children:
    React.ReactNode
  action?:
    React.ReactNode
}

function SettingsCard({
  title,
  description,
  children,
  action,
}: SettingsCardProps) {
  return (
    <section className="rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            {
              title
            }
          </h2>

          <p className="mt-1 text-sm leading-5 text-slate-400">
            {
              description
            }
          </p>
        </div>

        {action}
      </div>

      <div className="p-5">
        {
          children
        }
      </div>
    </section>
  )
}

type TextFieldProps = {
  label: string
  value: string
  onChange:
    (
      value:
        string,
    ) => void
  type?:
    string
  dir?:
    'ltr' | 'rtl'
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  dir = 'ltr',
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">
        {
          label
        }
      </span>

      <input
        type={
          type
        }
        dir={
          dir
        }
        value={
          value
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
        className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white"
      />
    </label>
  )
}

type TextAreaFieldProps = {
  label: string
  value: string
  onChange:
    (
      value:
        string,
    ) => void
  dir?:
    'ltr' | 'rtl'
}

function TextAreaField({
  label,
  value,
  onChange,
  dir = 'ltr',
}: TextAreaFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">
        {
          label
        }
      </span>

      <textarea
        rows={
          4
        }
        dir={
          dir
        }
        value={
          value
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
        className="mt-2 w-full resize-none rounded-[14px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white"
      />
    </label>
  )
}

type NumberFieldProps = {
  label: string
  value: number
  min?:
    number
  max?:
    number
  onChange:
    (
      value:
        number,
    ) => void
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">
        {
          label
        }
      </span>

      <input
        type="number"
        dir="ltr"
        value={
          value
        }
        min={
          min
        }
        max={
          max
        }
        onChange={(
          event,
        ) => {
          const next =
            Number(
              event.target.value,
            )

          onChange(
            Number.isFinite(
              next,
            )
              ? next
              : 0,
          )
        }}
        className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-left text-sm font-black text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white"
      />
    </label>
  )
}

type ToggleProps = {
  checked: boolean
  label?: string
  onChange:
    (
      checked:
        boolean,
    ) => void
}

function Toggle({
  checked,
  label,
  onChange,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={
        checked
      }
      onClick={() =>
        onChange(
          !checked,
        )
      }
      className="flex items-center gap-2"
    >
      {label && (
        <span
          className={[
            'text-sm font-black',

            checked
              ? 'text-emerald-600'
              : 'text-slate-400',
          ].join(
            ' ',
          )}
        >
          {
            label
          }
        </span>
      )}

      <span
        className={[
          'relative block h-7 w-12 rounded-full transition',

          checked
            ? 'bg-emerald-500'
            : 'bg-slate-200',
        ].join(
          ' ',
        )}
      >
        <span
          className={[
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition',

            checked
              ? 'left-6'
              : 'left-1',
          ].join(
            ' ',
          )}
        />
      </span>
    </button>
  )
}

type ToggleRowProps = {
  title: string
  description: string
  checked: boolean
  danger?:
    boolean
  onChange:
    (
      checked:
        boolean,
    ) => void
}

function ToggleRow({
  title,
  description,
  checked,
  danger = false,
  onChange,
}: ToggleRowProps) {
  return (
    <div
      className={[
        'flex flex-col gap-3 rounded-[16px] border p-4 sm:flex-row sm:items-center sm:justify-between',

        checked &&
        danger
          ? 'border-rose-200 bg-rose-50'
          : 'border-slate-200 bg-slate-50',
      ].join(
        ' ',
      )}
    >
      <div>
        <p
          className={[
            'text-sm font-black',

            checked &&
            danger
              ? 'text-rose-800'
              : 'text-slate-900',
          ].join(
            ' ',
          )}
        >
          {
            title
          }
        </p>

        <p
          className={[
            'mt-1 text-sm leading-5',

            checked &&
            danger
              ? 'text-rose-600'
              : 'text-slate-500',
          ].join(
            ' ',
          )}
        >
          {
            description
          }
        </p>
      </div>

      <div className="shrink-0">
        <Toggle
          checked={
            checked
          }
          onChange={
            onChange
          }
        />
      </div>
    </div>
  )
}

export default AdminSettingsPage