import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../../../lib/supabase'

type Lang = 'ar' | 'fr'
type ItemType =
  | 'account'
  | 'activation_code'
  | 'gift_card'
  | 'link'
  | 'other'
type DeliveryMode = 'manual' | 'automatic'
type StockStatus =
  | 'available'
  | 'reserved'
  | 'delivered'
  | 'disabled'

type Plan = {
  id: string
  label: string
  plan_key: string
  digital_service_groups: {
    name: string
    digital_services: {
      name: string
    } | null
  } | null
}

type StockCount = {
  plan_id: string
  available_count: number
  reserved_count: number
  delivered_count: number
  disabled_count: number
}

type StockItem = {
  id: string
  item_type: ItemType
  status: StockStatus
  delivery_mode: DeliveryMode
  created_at: string
}

type Notice = {
  kind: 'success' | 'error' | 'warning'
  message: string
}

type Action = 'delete' | 'disable' | 'enable'

const itemTypes: ItemType[] = [
  'account',
  'activation_code',
  'gift_card',
  'link',
  'other',
]

const messages = {
  ar: {
    title: 'إدارة المخزون الرقمي',
    subtitle: 'إضافة وإدارة الحسابات والأكواد حسب الباقة',
    search: 'ابحث عن خدمة أو باقة...',
    refresh: 'تحديث',
    available: 'متوفر',
    reserved: 'محجوز',
    delivered: 'تم التسليم',
    disabled: 'معطّل',
    add: 'إضافة',
    manage: 'إدارة',
    addTitle: 'إضافة مخزون',
    manageTitle: 'إدارة عناصر المخزون',
    type: 'نوع المنتج',
    mode: 'طريقة التسليم',
    manual: 'يدوي',
    automatic: 'تلقائي',
    manualHint: 'تقوم بتسليم المنتج بنفسك.',
    automaticHint:
      'التسليم التلقائي يتطلب ربط الطلبات وتأكيد الدفع.',
    account: 'حساب',
    activation_code: 'كود تفعيل',
    gift_card: 'بطاقة هدية',
    link: 'رابط',
    other: 'منتج آخر',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    show: 'إظهار',
    hide: 'إخفاء',
    values: 'الأكواد أو الروابط',
    onePerLine: 'عنصر واحد في كل سطر، بحد أقصى 100.',
    save: 'حفظ المخزون',
    saving: 'جارٍ الحفظ...',
    cancel: 'إلغاء',
    close: 'إغلاق',
    loading: 'جارٍ التحميل...',
    empty: 'لا توجد باقات',
    noStock: 'لا توجد عناصر مخزون لهذه الباقة',
    delete: 'حذف',
    disable: 'تعطيل',
    enable: 'تفعيل',
    deleting: 'جارٍ التنفيذ...',
    confirmDelete: 'تأكيد الحذف النهائي',
    confirmDisable: 'تأكيد التعطيل',
    confirmEnable: 'تأكيد إعادة التفعيل',
    deleteWarning:
      'سيتم حذف هذا العنصر نهائيًا. لا يمكن التراجع عن العملية.',
    disableWarning:
      'سيتوقف هذا العنصر عن التوفر للبيع.',
    enableWarning:
      'سيعود هذا العنصر إلى المخزون المتوفر.',
    confirm: 'تأكيد العملية',
    successAdd: 'تمت إضافة المخزون بنجاح',
    successAction: 'تم تنفيذ العملية بنجاح',
    failed: 'فشلت العملية',
    partial: 'تمت إضافة بعض العناصر فقط',
    invalidAccount: 'أدخل البريد الإلكتروني وكلمة المرور',
    invalidLink: 'الرابط غير صحيح',
    noItems: 'أدخل بيانات المخزون',
    maxItems: 'الحد الأقصى 100 عنصر',
    added: 'نجح',
    errors: 'فشل',
    security:
      'البيانات السرية مشفّرة على الخادم ولا تظهر في قائمة الإدارة.',
    history:
      'العناصر المحجوزة والمسلّمة لا يمكن حذفها أو تعديل حالتها.',
    date: 'تاريخ الإضافة',
    status: 'الحالة',
    actions: 'الإجراءات',
    item: 'العنصر',
    retry:
      'احتفظنا بالعناصر التي لم تُحفظ لإعادة المحاولة.',
    accountRetry:
      'لم يتم حفظ الحساب. يمكنك تصحيح البيانات وإعادة المحاولة.',
    all: 'الكل',
    loadError: 'تعذر تحميل البيانات',
    service: 'الخدمة',
    stockItems: 'عناصر المخزون',
    autoWarning:
      'اختيار تلقائي لا يفعّل إرسال المنتجات حتى نكمل نظام التسليم.',
  },
  fr: {
    title: 'Gestion du stock',
    subtitle: 'Gestion des comptes et codes par forfait',
    search: 'Rechercher un service ou un forfait...',
    refresh: 'Actualiser',
    available: 'Disponibles',
    reserved: 'Réservés',
    delivered: 'Livrés',
    disabled: 'Désactivés',
    add: 'Ajouter',
    manage: 'Gérer',
    addTitle: 'Ajouter du stock',
    manageTitle: 'Gestion des éléments',
    type: 'Type de produit',
    mode: 'Mode de livraison',
    manual: 'Manuelle',
    automatic: 'Automatique',
    manualHint: 'Vous livrez le produit manuellement.',
    automaticHint:
      'La livraison automatique nécessite les commandes et la validation du paiement.',
    account: 'Compte',
    activation_code: "Code d'activation",
    gift_card: 'Carte cadeau',
    link: 'Lien',
    other: 'Autre produit',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    show: 'Afficher',
    hide: 'Masquer',
    values: 'Codes ou liens',
    onePerLine: 'Un élément par ligne, maximum 100.',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    cancel: 'Annuler',
    close: 'Fermer',
    loading: 'Chargement...',
    empty: 'Aucun forfait trouvé',
    noStock: 'Aucun élément dans ce forfait',
    delete: 'Supprimer',
    disable: 'Désactiver',
    enable: 'Réactiver',
    deleting: 'Traitement...',
    confirmDelete: 'Confirmer la suppression',
    confirmDisable: 'Confirmer la désactivation',
    confirmEnable: 'Confirmer la réactivation',
    deleteWarning:
      'Cet élément sera définitivement supprimé.',
    disableWarning:
      'Cet élément ne sera plus disponible à la vente.',
    enableWarning:
      "Cet élément redeviendra disponible.",
    confirm: 'Confirmer',
    successAdd: 'Stock ajouté avec succès',
    successAction: 'Opération réussie',
    failed: "Échec de l'opération",
    partial: 'Ajout partiellement terminé',
    invalidAccount: 'Saisissez un e-mail et un mot de passe',
    invalidLink: 'Lien invalide',
    noItems: 'Saisissez les données du stock',
    maxItems: 'Maximum 100 éléments',
    added: 'Réussis',
    errors: 'Échecs',
    security:
      'Les secrets sont chiffrés côté serveur et ne sont pas affichés.',
    history:
      'Les éléments réservés ou livrés ne peuvent pas être supprimés ou modifiés.',
    date: "Date d'ajout",
    status: 'Statut',
    actions: 'Actions',
    item: 'Élément',
    retry:
      'Les éléments non enregistrés ont été conservés.',
    accountRetry:
      'Le compte n’a pas été enregistré. Vous pouvez réessayer.',
    all: 'Tous',
    loadError: 'Chargement impossible',
    service: 'Service',
    stockItems: 'Éléments du stock',
    autoWarning:
      "La sélection automatique n'active pas encore la livraison.",
  },
}

function getLanguage(): Lang {
  if (typeof document === 'undefined') return 'fr'
  return document.documentElement.lang
    .toLowerCase()
    .startsWith('ar')
    ? 'ar'
    : 'fr'
}

function makePayload(
  value: string,
  type: ItemType
): Record<string, string> {
  if (type === 'link') {
    let url: URL
    try {
      url = new URL(value)
    } catch {
      throw new Error('INVALID_LINK')
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('INVALID_LINK')
    }

    return { url: value }
  }

  if (type === 'other') return { value }
  return { code: value }
}

function errorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    return String(error.message)
  }

  return String(error)
}

export default function AdminDigitalStockPage() {
  const [language, setLanguage] = useState<Lang>(
    getLanguage
  )
  const [plans, setPlans] = useState<Plan[]>([])
  const [counts, setCounts] = useState<StockCount[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)

  const [selectedPlan, setSelectedPlan] =
    useState<Plan | null>(null)
  const [panel, setPanel] =
    useState<'add' | 'manage' | null>(null)

  const [itemType, setItemType] =
    useState<ItemType>('account')
  const [deliveryMode, setDeliveryMode] =
    useState<DeliveryMode>('manual')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rawItems, setRawItems] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formNotice, setFormNotice] =
    useState<Notice | null>(null)

  const [stockItems, setStockItems] =
    useState<StockItem[]>([])
  const [stockLoading, setStockLoading] = useState(false)
  const [stockError, setStockError] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<'all' | StockStatus>('all')

  const [pendingAction, setPendingAction] =
    useState<{
      item: StockItem
      action: Action
    } | null>(null)
  const [acting, setActing] = useState(false)

  const t = messages[language]
  const isArabic = language === 'ar'

  useEffect(() => {
    const update = () => setLanguage(getLanguage())
    const observer = new MutationObserver(update)

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!panel) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previous
    }
  }, [panel])

  const refresh = useCallback(async () => {
    setLoading(true)
    setPageError('')

    try {
      const [plansResult, countsResult] =
        await Promise.all([
          supabase
            .from('digital_service_plans')
            .select(`
              id,
              label,
              plan_key,
              digital_service_groups (
                name,
                digital_services (name)
              )
            `),
          supabase.rpc('admin_digital_stock_summary'),
        ])

      if (plansResult.error) throw plansResult.error
      if (countsResult.error) throw countsResult.error

      setPlans(
        (plansResult.data ?? []) as unknown as Plan[]
      )
      setCounts(
        (countsResult.data ?? []) as StockCount[]
      )
    } catch (error) {
      setPageError(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const loadStock = useCallback(async (planId: string) => {
    setStockLoading(true)
    setStockError('')

    try {
      const { data, error } = await supabase.rpc(
        'admin_list_digital_stock',
        { p_plan_id: planId }
      )

      if (error) throw error

      setStockItems((data ?? []) as StockItem[])
    } catch (error) {
      setStockItems([])
      setStockError(errorMessage(error))
    } finally {
      setStockLoading(false)
    }
  }, [])

  const countsByPlan = useMemo(
    () => new Map(counts.map(c => [c.plan_id, c])),
    [counts]
  )

  const totals = useMemo(
    () =>
      counts.reduce(
        (acc, item) => ({
          available:
            acc.available + Number(item.available_count),
          reserved:
            acc.reserved + Number(item.reserved_count),
          delivered:
            acc.delivered + Number(item.delivered_count),
          disabled:
            acc.disabled + Number(item.disabled_count),
        }),
        {
          available: 0,
          reserved: 0,
          delivered: 0,
          disabled: 0,
        }
      ),
    [counts]
  )

  const filteredPlans = useMemo(() => {
    const search = query.trim().toLowerCase()

    return plans.filter(plan =>
      [
        plan.label,
        plan.plan_key,
        plan.digital_service_groups?.name,
        plan.digital_service_groups
          ?.digital_services?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search)
    )
  }, [plans, query])

  const visibleStock = useMemo(
    () =>
      stockItems.filter(
        item =>
          statusFilter === 'all' ||
          item.status === statusFilter
      ),
    [stockItems, statusFilter]
  )

  const openAdd = (plan: Plan) => {
    setSelectedPlan(plan)
    setPanel('add')
    setItemType('account')
    setDeliveryMode('manual')
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setRawItems('')
    setFormError('')
    setFormNotice(null)
    setNotice(null)
  }

  const openManage = (plan: Plan) => {
    setSelectedPlan(plan)
    setPanel('manage')
    setStatusFilter('all')
    setStockItems([])
    setStockError('')
    setNotice(null)
    void loadStock(plan.id)
  }

  const closePanel = () => {
    if (saving || acting) return

    setPanel(null)
    setSelectedPlan(null)
    setPendingAction(null)
    setEmail('')
    setPassword('')
    setRawItems('')
    setFormError('')
    setFormNotice(null)
  }

  const saveStock = async () => {
    if (!selectedPlan || saving) return

    setFormError('')
    setFormNotice(null)

    let payloads: Record<string, string>[] = []
    let originals: string[] = []

    if (itemType === 'account') {
      if (!email.trim() || !password) {
        setFormError(t.invalidAccount)
        return
      }

      payloads = [{
        email: email.trim(),
        password,
      }]
    } else {
      originals = rawItems
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(Boolean)

      if (!originals.length) {
        setFormError(t.noItems)
        return
      }

      if (originals.length > 100) {
        setFormError(t.maxItems)
        return
      }

      try {
        payloads = originals.map(item =>
          makePayload(item, itemType)
        )
      } catch {
        setFormError(t.invalidLink)
        return
      }
    }

    setSaving(true)
    let added = 0
    const failedItems: string[] = []
    const errors: string[] = []

    try {
      for (let i = 0; i < payloads.length; i++) {
        try {
          const { error } = await supabase.rpc(
            'admin_add_digital_stock',
            {
              p_plan_id: selectedPlan.id,
              p_item_type: itemType,
              p_secret_payload: payloads[i],
              p_delivery_mode: deliveryMode,
            }
          )

          if (error) throw error
          added++
        } catch (error) {
          failedItems.push(originals[i] ?? '')
          if (errors.length < 2) {
            errors.push(errorMessage(error))
          }
        }
      }

      if (!failedItems.length) {
        setNotice({
          kind: 'success',
          message: `${t.successAdd} (${added})`,
        })
        closePanelAfterSave()
      } else {
        setFormNotice({
          kind: added ? 'warning' : 'error',
          message:
            `${added ? t.partial : t.failed}: ` +
            `${t.added} ${added}, ` +
            `${t.errors} ${failedItems.length}`,
        })

        setFormError(errors.join(' | '))

        if (itemType !== 'account') {
          setRawItems(failedItems.join('\n'))
        }
      }

      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const closePanelAfterSave = () => {
    setPanel(null)
    setSelectedPlan(null)
    setEmail('')
    setPassword('')
    setRawItems('')
    setFormError('')
    setFormNotice(null)
  }

  const performAction = async () => {
    if (!pendingAction || !selectedPlan || acting) {
      return
    }

    setActing(true)
    setStockError('')

    try {
      const { error } = await supabase.rpc(
        'admin_manage_digital_stock',
        {
          p_item_id: pendingAction.item.id,
          p_action: pendingAction.action,
        }
      )

      if (error) throw error

      setPendingAction(null)

      setNotice({
        kind: 'success',
        message: t.successAction,
      })

      await Promise.all([
        loadStock(selectedPlan.id),
        refresh(),
      ])
    } catch (error) {
      setStockError(errorMessage(error))
    } finally {
      setActing(false)
    }
  }

  const statCards = [
    {
      label: t.available,
      value: totals.available,
      bg: 'bg-emerald-50',
      color: 'text-emerald-700',
    },
    {
      label: t.reserved,
      value: totals.reserved,
      bg: 'bg-amber-50',
      color: 'text-amber-700',
    },
    {
      label: t.delivered,
      value: totals.delivered,
      bg: 'bg-blue-50',
      color: 'text-blue-700',
    },
    {
      label: t.disabled,
      value: totals.disabled,
      bg: 'bg-slate-100',
      color: 'text-slate-700',
    },
  ]

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="space-y-6 pb-12"
    >
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-widest text-blue-600">
              TEO STORE / ADMIN
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
              {t.title}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {t.subtitle}
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => void refresh()}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"
          >
            ↻ {t.refresh}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map(stat => (
            <div
              key={stat.label}
              className={`rounded-2xl ${stat.bg} p-4`}
            >
              <p className="text-xs font-bold text-slate-500">
                {stat.label}
              </p>

              <p
                className={`mt-2 text-3xl font-black ${stat.color}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </header>

      {pageError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {pageError}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className={`rounded-xl border p-4 text-sm font-bold ${
            notice.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {notice.message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={t.search}
          aria-label={t.search}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <p className="text-sm text-slate-500">
            {t.loading}
          </p>
        ) : filteredPlans.length === 0 ? (
          <p className="text-sm text-slate-500">
            {t.empty}
          </p>
        ) : (
          filteredPlans.map(plan => {
            const count = countsByPlan.get(plan.id)

            const service =
              plan.digital_service_groups
                ?.digital_services?.name ?? ''

            const group =
              plan.digital_service_groups?.name ?? ''

            return (
              <article
                key={plan.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <p className="text-xs font-bold text-blue-600">
                  {[service, group]
                    .filter(Boolean)
                    .join(' · ')}
                </p>

                <h2 className="mt-2 text-lg font-black text-slate-950">
                  {plan.label}
                </h2>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {[
                    {
                      label: t.available,
                      value: count?.available_count ?? 0,
                      color: 'text-emerald-700',
                    },
                    {
                      label: t.reserved,
                      value: count?.reserved_count ?? 0,
                      color: 'text-amber-700',
                    },
                    {
                      label: t.delivered,
                      value: count?.delivered_count ?? 0,
                      color: 'text-blue-700',
                    },
                    {
                      label: t.disabled,
                      value: count?.disabled_count ?? 0,
                      color: 'text-slate-700',
                    },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-slate-50 p-3"
                    >
                      <p className={`text-xl font-black ${item.color}`}>
                        {item.value}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openAdd(plan)}
                    className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    + {t.add}
                  </button>

                  <button
                    type="button"
                    onClick={() => openManage(plan)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    ⚙ {t.manage}
                  </button>
                </div>
              </article>
            )
          })
        )}
      </section>

      {panel && selectedPlan && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-dialog-title"
            dir={isArabic ? 'rtl' : 'ltr'}
            className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold text-blue-600">
                  TEO STORE / STOCK
                </p>

                <h2
                  id="stock-dialog-title"
                  className="mt-1 text-xl font-black text-slate-950"
                >
                  {panel === 'add'
                    ? t.addTitle
                    : t.manageTitle}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {selectedPlan.label}
                </p>
              </div>

              <button
                type="button"
                disabled={saving || acting}
                onClick={closePanel}
                aria-label={t.close}
                className="rounded-xl bg-slate-100 px-3 py-2 font-bold text-slate-700 disabled:opacity-50"
              >
                ✕
              </button>
            </header>

            <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
              {panel === 'add' ? (
                <>
                  <div>
                    <h3 className="mb-3 text-sm font-black text-slate-900">
                      01 · {t.type}
                    </h3>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {itemTypes.map(type => (
                        <button
                          key={type}
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            setItemType(type)
                            setEmail('')
                            setPassword('')
                            setRawItems('')
                            setFormError('')
                            setFormNotice(null)
                          }}
                          className={`rounded-xl border p-3 text-sm font-bold ${
                            itemType === type
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {t[type]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-black text-slate-900">
                      02 · {t.stockItems}
                    </h3>

                    {itemType === 'account' ? (
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-700">
                          {t.email}
                          <input
                            dir="ltr"
                            type="email"
                            autoComplete="off"
                            value={email}
                            disabled={saving}
                            onChange={event =>
                              setEmail(event.target.value)
                            }
                            placeholder="email@example.com"
                            className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-mono text-sm outline-none focus:border-blue-500"
                          />
                        </label>

                        <label className="block text-sm font-bold text-slate-700">
                          {t.password}
                          <div className="mt-2 flex gap-2">
                            <input
                              dir="ltr"
                              type={
                                showPassword
                                  ? 'text'
                                  : 'password'
                              }
                              autoComplete="off"
                              spellCheck={false}
                              value={password}
                              disabled={saving}
                              onChange={event =>
                                setPassword(event.target.value)
                              }
                              className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3 font-mono text-sm outline-none focus:border-blue-500"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword(value => !value)
                              }
                              className="rounded-xl border border-slate-200 px-4 text-sm font-bold"
                            >
                              {showPassword ? t.hide : t.show}
                            </button>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div>
                        <textarea
                          dir="ltr"
                          rows={6}
                          autoComplete="off"
                          spellCheck={false}
                          value={rawItems}
                          disabled={saving}
                          onChange={event =>
                            setRawItems(event.target.value)
                          }
                          placeholder={
                            itemType === 'link'
                              ? 'https://example.com/activate'
                              : 'CODE-001\nCODE-002\nCODE-003'
                          }
                          className="w-full rounded-xl border border-slate-200 p-3 font-mono text-sm outline-none focus:border-blue-500"
                        />

                        <p className="mt-2 text-xs text-slate-500">
                          {t.onePerLine}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-black text-slate-900">
                      03 · {t.mode}
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {(
                        ['manual', 'automatic'] as DeliveryMode[]
                      ).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          disabled={saving}
                          aria-pressed={deliveryMode === mode}
                          onClick={() => setDeliveryMode(mode)}
                          className={`rounded-2xl border-2 p-4 text-start ${
                            deliveryMode === mode
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black">
                              {mode === 'manual'
                                ? '✋'
                                : '⚡'}{' '}
                              {t[mode]}
                            </span>

                            <span>
                              {deliveryMode === mode ? '✓' : '○'}
                            </span>
                          </div>

                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {mode === 'manual'
                              ? t.manualHint
                              : t.automaticHint}
                          </p>
                        </button>
                      ))}
                    </div>

                    {deliveryMode === 'automatic' && (
                      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        {t.autoWarning}
                      </p>
                    )}
                  </div>

                  {formNotice && (
                    <div
                      role="status"
                      className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                    >
                      {formNotice.message}
                    </div>
                  )}

                  {formError && (
                    <div
                      role="alert"
                      className="break-words rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
                    >
                      {formError}
                    </div>
                  )}

                  <p className="rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                    🔒 {t.security}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        'all',
                        'available',
                        'reserved',
                        'delivered',
                        'disabled',
                      ] as const
                    ).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={`rounded-xl px-3 py-2 text-xs font-bold ${
                          statusFilter === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t[status]}
                      </button>
                    ))}
                  </div>

                  {stockError && (
                    <div
                      role="alert"
                      className="break-words rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
                    >
                      {stockError}
                    </div>
                  )}

                  {stockLoading ? (
                    <p className="text-sm text-slate-500">
                      {t.loading}
                    </p>
                  ) : visibleStock.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                      {t.noStock}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visibleStock.map((item, index) => (
                        <article
                          key={item.id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-slate-900">
                                {t[item.item_type]} #{index + 1}
                              </p>

                              <p className="mt-1 font-mono text-xs text-slate-400">
                                {item.id.slice(0, 8)}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                item.status === 'available'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : item.status === 'reserved'
                                  ? 'bg-amber-50 text-amber-700'
                                  : item.status === 'delivered'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {t[item.status]}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                            <span>
                              {t.mode}: {t[item.delivery_mode]}
                            </span>

                            <span>
                              {t.date}:{' '}
                              {new Date(
                                item.created_at
                              ).toLocaleDateString(
                                isArabic ? 'ar-MR' : 'fr-FR'
                              )}
                            </span>
                          </div>

                          {(item.status === 'available' ||
                            item.status === 'disabled') && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={acting}
                                onClick={() =>
                                  setPendingAction({
                                    item,
                                    action:
                                      item.status === 'available'
                                        ? 'disable'
                                        : 'enable',
                                  })
                                }
                                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"
                              >
                                {item.status === 'available'
                                  ? t.disable
                                  : t.enable}
                              </button>

                              <button
                                type="button"
                                disabled={acting}
                                onClick={() =>
                                  setPendingAction({
                                    item,
                                    action: 'delete',
                                  })
                                }
                                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"
                              >
                                {t.delete}
                              </button>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}

                  <p className="rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                    🔒 {t.history}
                  </p>
                </>
              )}
            </div>

            <footer className="flex gap-3 border-t border-slate-100 bg-white p-5">
              {panel === 'add' && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveStock()}
                  className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {saving ? t.saving : t.save}
                </button>
              )}

              <button
                type="button"
                disabled={saving || acting}
                onClick={closePanel}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"
              >
                {t.close}
              </button>
            </footer>
          </section>
        </div>
      )}

      {pendingAction && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="stock-confirm-title"
            dir={isArabic ? 'rtl' : 'ltr'}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2
              id="stock-confirm-title"
              className="text-xl font-black text-slate-950"
            >
              {pendingAction.action === 'delete'
                ? t.confirmDelete
                : pendingAction.action === 'disable'
                ? t.confirmDisable
                : t.confirmEnable}
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              {pendingAction.action === 'delete'
                ? t.deleteWarning
                : pendingAction.action === 'disable'
                ? t.disableWarning
                : t.enableWarning}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={acting}
                onClick={() => void performAction()}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-50 ${
                  pendingAction.action === 'delete'
                    ? 'bg-rose-600'
                    : 'bg-blue-600'
                }`}
              >
                {acting ? t.deleting : t.confirm}
              </button>

              <button
                type="button"
                disabled={acting}
                onClick={() => setPendingAction(null)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"
              >
                {t.cancel}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}