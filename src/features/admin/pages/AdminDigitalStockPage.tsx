import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Lang = 'ar' | 'fr'
type ItemType = 'account' | 'activation_code' | 'gift_card' | 'link' | 'other'
type DeliveryMode = 'manual' | 'automatic'
type StockStatus = 'available' | 'reserved' | 'delivered' | 'disabled'
type Action = 'delete' | 'disable' | 'enable'

const itemTypes: ItemType[] = [
  'account',
  'activation_code',
  'gift_card',
  'link',
  'other',
]

type Plan = {
  id: string
  label: string
  plan_key: string
  digital_service_groups: {
    name: string
    digital_services: { name: string } | null
  } | null
}

type Count = {
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

type ServiceGroup = {
  name: string
  plans: Plan[]
  available: number
}

const i18n = {
  ar: {
    title: 'إدارة المخزون الرقمي',
    subtitle: 'إدارة الخدمات والباقات والمخزون في مكان واحد',
    services: 'الخدمات',
    packages: 'الباقات',
    inventory: 'عناصر المخزون',
    search: 'ابحث عن خدمة أو باقة...',
    refresh: 'تحديث',
    allServices: 'جميع الخدمات',
    available: 'متوفر',
    reserved: 'محجوز',
    delivered: 'تم التسليم',
    disabled: 'معطّل',
    add: 'إضافة مخزون',
    manage: 'إدارة المخزون',
    back: 'العودة',
    close: 'إغلاق',
    cancel: 'إلغاء',
    save: 'حفظ المخزون',
    saving: 'جارٍ الحفظ...',
    processing: 'جارٍ التنفيذ...',
    type: 'نوع المنتج',
    mode: 'طريقة التسليم',
    account: 'حساب جاهز',
    activation_code: 'كود تفعيل',
    gift_card: 'بطاقة هدية',
    link: 'رابط تفعيل',
    other: 'منتج آخر',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    show: 'إظهار',
    hide: 'إخفاء',
    manual: 'يدوي',
    automatic: 'تلقائي',
    manualHelp: 'تسليم المنتج بواسطة المدير',
    automaticHelp: 'يتطلب نظامًا فعّالًا لتأكيد الدفع والتسليم',
    autoWarning: 'اختيار الوضع التلقائي لا يفعّل التسليم تلقائيًا دون ربط نظام الطلبات والدفع.',
    lines: 'أدخل عنصرًا واحدًا في كل سطر (100 كحد أقصى)',
    noServices: 'لا توجد خدمات مطابقة',
    noPlans: 'لا توجد باقات',
    noStock: 'لا يوجد مخزون لهذه الباقة',
    loading: 'جارٍ التحميل...',
    delete: 'حذف',
    disable: 'تعطيل',
    enable: 'إعادة التفعيل',
    confirm: 'تأكيد العملية',
    deleteWarning: 'سيُحذف العنصر نهائيًا ولا يمكن استرجاعه.',
    disableWarning: 'سيُمنع هذا العنصر من البيع مؤقتًا.',
    enableWarning: 'سيصبح العنصر متوفرًا للبيع مجددًا.',
    security: 'بيانات الحسابات والأكواد مشفّرة ولا تظهر في قائمة الإدارة.',
    protected: 'العناصر المحجوزة والمسلّمة محمية من الحذف والتعديل.',
    success: 'تمت العملية بنجاح',
    failed: 'فشلت العملية',
    invalid: 'تحقق من البيانات المدخلة',
    limit: 'الحد الأقصى 100 عنصر',
    partial: 'تم حفظ بعض العناصر فقط. احتفظنا بالعناصر التي فشلت.',
    serviceCount: 'باقة',
    status: 'الحالة',
    date: 'تاريخ الإضافة',
    retry: 'إعادة المحاولة',
  },
  fr: {
    title: 'Gestion du stock',
    subtitle: 'Services, forfaits et inventaire au même endroit',
    services: 'Services',
    packages: 'Forfaits',
    inventory: 'Éléments du stock',
    search: 'Rechercher un service ou un forfait...',
    refresh: 'Actualiser',
    allServices: 'Tous les services',
    available: 'Disponibles',
    reserved: 'Réservés',
    delivered: 'Livrés',
    disabled: 'Désactivés',
    add: 'Ajouter du stock',
    manage: 'Gérer le stock',
    back: 'Retour',
    close: 'Fermer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    processing: 'Traitement...',
    type: 'Type de produit',
    mode: 'Mode de livraison',
    account: 'Compte prêt',
    activation_code: "Code d'activation",
    gift_card: 'Carte cadeau',
    link: "Lien d'activation",
    other: 'Autre produit',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    show: 'Afficher',
    hide: 'Masquer',
    manual: 'Manuelle',
    automatic: 'Automatique',
    manualHelp: "Livraison effectuée par l'administrateur",
    automaticHelp: 'Nécessite un système de paiement et de livraison actif',
    autoWarning: "Ce choix n'active pas la livraison sans intégration des commandes et paiements.",
    lines: 'Un élément par ligne (maximum 100)',
    noServices: 'Aucun service correspondant',
    noPlans: 'Aucun forfait',
    noStock: 'Aucun élément dans ce forfait',
    loading: 'Chargement...',
    delete: 'Supprimer',
    disable: 'Désactiver',
    enable: 'Réactiver',
    confirm: 'Confirmer',
    deleteWarning: 'Cet élément sera définitivement supprimé.',
    disableWarning: 'Cet élément ne sera plus disponible à la vente.',
    enableWarning: 'Cet élément redeviendra disponible à la vente.',
    security: 'Les secrets sont chiffrés et ne sont pas affichés dans la gestion.',
    protected: 'Les éléments réservés ou livrés sont protégés.',
    success: 'Opération réussie',
    failed: "Échec de l'opération",
    invalid: 'Vérifiez les données saisies',
    limit: 'Maximum 100 éléments',
    partial: 'Enregistrement partiel. Les éléments échoués sont conservés.',
    serviceCount: 'forfaits',
    status: 'Statut',
    date: "Date d'ajout",
    retry: 'Réessayer',
  },
}

function getLang(): Lang {
  if (typeof document === 'undefined') return 'fr'
  return document.documentElement.lang.toLowerCase().startsWith('ar')
    ? 'ar'
    : 'fr'
}

function getError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return String(error)
}

function payloadFor(
  value: string,
  type: ItemType
): Record<string, string> {
  if (type === 'link') {
    const url = new URL(value)

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid URL protocol')
    }

    return { url: value }
  }

  if (type === 'other') {
    return { value }
  }

  return { code: value }
}

const buttonBase =
  'rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50'

export default function AdminDigitalStockPage() {
  const [lang, setLang] = useState<Lang>(getLang)
  const t = i18n[lang]
  const rtl = lang === 'ar'

  const [plans, setPlans] = useState<Plan[]>([])
  const [counts, setCounts] = useState<Count[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [service, setService] = useState<string | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [view, setView] = useState<'add' | 'manage' | null>(null)

  const [type, setType] = useState<ItemType>('account')
  const [mode, setMode] = useState<DeliveryMode>('manual')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [lines, setLines] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [items, setItems] = useState<StockItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemsError, setItemsError] = useState('')
  const [filter, setFilter] = useState<'all' | StockStatus>('all')
  const [pending, setPending] = useState<{ item: StockItem; action: Action } | null>(null)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    const observer = new MutationObserver(() => setLang(getLang()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!view) return
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = old
    }
  }, [view])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [p, c] = await Promise.all([
        supabase.from('digital_service_plans').select(`
          id, label, plan_key,
          digital_service_groups (
            name,
            digital_services (name)
          )
        `),
        supabase.rpc('admin_digital_stock_summary'),
      ])
      if (p.error) throw p.error
      if (c.error) throw c.error
      setPlans((p.data ?? []) as unknown as Plan[])
      setCounts((c.data ?? []) as Count[])
    } catch (e) {
      setError(getError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const byPlan = useMemo(
    () => new Map(counts.map(c => [c.plan_id, c])),
    [counts]
  )

  const totals = useMemo(
    () => counts.reduce(
      (a, c) => ({
        available: a.available + Number(c.available_count),
        reserved: a.reserved + Number(c.reserved_count),
        delivered: a.delivered + Number(c.delivered_count),
        disabled: a.disabled + Number(c.disabled_count),
      }),
      { available: 0, reserved: 0, delivered: 0, disabled: 0 }
    ),
    [counts]
  )

  const groups = useMemo<ServiceGroup[]>(() => {
    const map = new Map<string, ServiceGroup>()
    for (const p of plans) {
      const name =
        p.digital_service_groups?.digital_services?.name ||
        p.digital_service_groups?.name ||
        'Autres'
      const existing = map.get(name) ?? { name, plans: [], available: 0 }
      existing.plans.push(p)
      existing.available += Number(byPlan.get(p.id)?.available_count ?? 0)
      map.set(name, existing)
    }
    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [plans, byPlan])

  const selectedGroup = groups.find(g => g.name === service)

  const searchValue = search.trim().toLowerCase()

  const shownGroups = groups.filter(g =>
    [g.name, ...g.plans.map(p => p.label)]
      .join(' ')
      .toLowerCase()
      .includes(searchValue)
  )

  const shownPlans = selectedGroup?.plans.filter(p =>
    !searchValue ||
    [p.label, p.plan_key, selectedGroup.name]
      .join(' ')
      .toLowerCase()
      .includes(searchValue)
  ) ?? []

  const loadItems = useCallback(async (planId: string) => {
    setItemsLoading(true)
    setItemsError('')
    try {
      const { data, error: rpcError } = await supabase.rpc(
        'admin_list_digital_stock',
        { p_plan_id: planId }
      )
      if (rpcError) throw rpcError
      setItems((data ?? []) as StockItem[])
    } catch (e) {
      setItems([])
      setItemsError(getError(e))
    } finally {
      setItemsLoading(false)
    }
  }, [])

  const openAdd = (p: Plan) => {
    setPlan(p)
    setView('add')
    setType('account')
    setMode('manual')
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setLines('')
    setFormError('')
    setNotice('')
  }

  const openManage = (p: Plan) => {
    setPlan(p)
    setView('manage')
    setItems([])
    setItemsError('')
    setFilter('all')
    void loadItems(p.id)
  }

  const close = () => {
    if (saving || acting) return
    setView(null)
    setPlan(null)
    setPending(null)
    setEmail('')
    setPassword('')
    setLines('')
    setFormError('')
  }

  const save = async () => {
    if (!plan || saving) return
    setFormError('')

    let originals: string[] = []
    let payloads: Record<string, string>[] = []

    try {
      if (type === 'account') {
        if (!email.trim() || !password) throw new Error(t.invalid)
        payloads = [{ email: email.trim(), password }]
      } else {
        originals = lines.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
        if (!originals.length) throw new Error(t.invalid)
        if (originals.length > 100) throw new Error(t.limit)
        payloads = originals.map(value => payloadFor(value, type))
      }
    } catch (e) {
      setFormError(getError(e))
      return
    }

    setSaving(true)
    let success = 0
    const failed: string[] = []
    const errors: string[] = []

    try {
      for (let i = 0; i < payloads.length; i++) {
        try {
          const { error: rpcError } = await supabase.rpc(
            'admin_add_digital_stock',
            {
              p_plan_id: plan.id,
              p_item_type: type,
              p_secret_payload: payloads[i],
              p_delivery_mode: mode,
            }
          )
          if (rpcError) throw rpcError
          success++
        } catch (e) {
          failed.push(originals[i] ?? '')
          if (errors.length < 2) errors.push(getError(e))
        }
      }

      await refresh()

      if (!failed.length) {
        setNotice(`${t.success} (${success})`)
        setView(null)
        setPlan(null)
        setEmail('')
        setPassword('')
        setLines('')
      } else {
        setFormError(
          `${success ? t.partial : t.failed} — ${success}/${payloads.length}. ` +
          errors.join(' | ')
        )
        if (type !== 'account') setLines(failed.join('\n'))
      }
    } catch (e) {
      setFormError(getError(e))
    } finally {
      setSaving(false)
    }
  }

  const perform = async () => {
    if (!pending || !plan || acting) return
    setActing(true)
    setItemsError('')

    try {
      const { error: rpcError } = await supabase.rpc(
        'admin_manage_digital_stock',
        {
          p_item_id: pending.item.id,
          p_action: pending.action,
        }
      )
      if (rpcError) throw rpcError

      setPending(null)
      setNotice(t.success)

      await Promise.all([loadItems(plan.id), refresh()])
    } catch (e) {
      setItemsError(getError(e))
    } finally {
      setActing(false)
    }
  }

  const visibleItems = items.filter(
    item => filter === 'all' || item.status === filter
  )

  const statusColor = (status: StockStatus) => ({
    available: 'bg-emerald-50 text-emerald-700',
    reserved: 'bg-amber-50 text-amber-700',
    delivered: 'bg-blue-50 text-blue-700',
    disabled: 'bg-slate-100 text-slate-600',
  }[status])

  return (
    <main dir={rtl ? 'rtl' : 'ltr'} className="space-y-5 pb-12">
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-widest text-blue-600">
              TEO STORE / ADMIN
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">
              {t.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className={`${buttonBase} border border-slate-200 text-slate-700`}
          >
            ↻ {t.refresh}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {([
            ['available', 'bg-emerald-50 text-emerald-700'],
            ['reserved', 'bg-amber-50 text-amber-700'],
            ['delivered', 'bg-blue-50 text-blue-700'],
            ['disabled', 'bg-slate-100 text-slate-700'],
          ] as const).map(([key, color]) => (
            <div key={key} className={`rounded-2xl p-4 ${color}`}>
              <p className="text-xs font-bold opacity-75">{t[key]}</p>
              <p className="mt-2 text-3xl font-black">{totals[key]}</p>
            </div>
          ))}
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          ✓ {notice}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setService(null)}
            className={`rounded-lg px-3 py-2 font-bold ${
              service === null
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t.services}
          </button>
          {service && (
            <>
              <span className="text-slate-400">/</span>
              <span className="font-bold text-slate-900">{service}</span>
            </>
          )}
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t.search}
          aria-label={t.search}
          className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
        />
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">{t.loading}</p>
      ) : !service ? (
        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900">{t.services}</h2>
          {shownGroups.length === 0 ? (
            <p className="text-sm text-slate-500">{t.noServices}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {shownGroups.map(group => (
                <button
                  key={group.name}
                  type="button"
                  onClick={() => {
                    setService(group.name)
                    setSearch('')
                  }}
                  className="rounded-2xl border border-slate-200 bg-white p-5 text-start shadow-sm transition hover:border-blue-400 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                      ◈
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-black text-slate-900">
                        {group.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {group.plans.length} {t.serviceCount}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                    <span className="text-xs font-bold text-emerald-700">
                      {t.available}
                    </span>
                    <span className="text-xl font-black text-emerald-700">
                      {group.available}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <button
                type="button"
                onClick={() => {
                  setService(null)
                  setSearch('')
                }}
                className="mb-2 text-sm font-bold text-blue-600"
              >
                ← {t.back}
              </button>
              <h2 className="text-xl font-black text-slate-900">
                {service}
              </h2>
              <p className="text-xs text-slate-500">{t.packages}</p>
            </div>
          </div>

          {shownPlans.length === 0 ? (
            <p className="text-sm text-slate-500">{t.noPlans}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shownPlans.map(p => {
                const c = byPlan.get(p.id)
                return (
                  <article
                    key={p.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <h3 className="text-lg font-black text-slate-900">
                      {p.label}
                    </h3>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {([
                        ['available', c?.available_count ?? 0],
                        ['reserved', c?.reserved_count ?? 0],
                        ['delivered', c?.delivered_count ?? 0],
                        ['disabled', c?.disabled_count ?? 0],
                      ] as const).map(([key, value]) => (
                        <div key={key} className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xl font-black text-slate-900">
                            {value}
                          </p>
                          <p className="text-xs text-slate-500">{t[key]}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openAdd(p)}
                        className={`${buttonBase} bg-blue-600 text-white hover:bg-blue-700`}
                      >
                        + {t.add}
                      </button>
                      <button
                        type="button"
                        onClick={() => openManage(p)}
                        className={`${buttonBase} border border-slate-200 text-slate-700 hover:bg-slate-50`}
                      >
                        ⚙ {t.manage}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {view && plan && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-dialog-title"
            dir={rtl ? 'rtl' : 'ltr'}
            className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <p className="text-xs font-bold text-blue-600">
                  TEO STORE / STOCK
                </p>
                <h2 id="stock-dialog-title" className="mt-1 text-xl font-black">
                  {view === 'add' ? t.add : t.manage}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{plan.label}</p>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={saving || acting}
                aria-label={t.close}
                className="rounded-xl bg-slate-100 px-3 py-2 font-bold disabled:opacity-50"
              >
                ✕
              </button>
            </header>

            <div className="space-y-5 overflow-y-auto p-5">
              {view === 'add' ? (
                <>
                  <div>
                    <h3 className="mb-3 text-sm font-black">01 · {t.type}</h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {itemTypes.map(option => (
                        <button
                          key={option}
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            setType(option)
                            setEmail('')
                            setPassword('')
                            setLines('')
                            setFormError('')
                          }}
                          className={`rounded-xl border p-3 text-sm font-bold ${
                            type === option
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {t[option]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-black">02 · {t.inventory}</h3>
                    {type === 'account' ? (
                      <div className="space-y-3">
                        <label className="block text-sm font-bold">
                          {t.email}
                          <input
                            type="email"
                            dir="ltr"
                            autoComplete="off"
                            value={email}
                            disabled={saving}
                            onChange={e => setEmail(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-mono text-sm"
                          />
                        </label>
                        <label className="block text-sm font-bold">
                          {t.password}
                          <div className="mt-2 flex gap-2">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              dir="ltr"
                              autoComplete="off"
                              spellCheck={false}
                              value={password}
                              disabled={saving}
                              onChange={e => setPassword(e.target.value)}
                              className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3 font-mono text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(v => !v)}
                              className="rounded-xl border border-slate-200 px-4 text-xs font-bold"
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
                          value={lines}
                          disabled={saving}
                          onChange={e => setLines(e.target.value)}
                          placeholder={
                            type === 'link'
                              ? 'https://example.com/activate'
                              : 'CODE-001\nCODE-002'
                          }
                          className="w-full rounded-xl border border-slate-200 p-3 font-mono text-sm"
                        />
                        <p className="mt-2 text-xs text-slate-500">{t.lines}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-black">03 · {t.mode}</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(['manual', 'automatic'] as DeliveryMode[]).map(m => (
                        <button
                          key={m}
                          type="button"
                          disabled={saving}
                          onClick={() => setMode(m)}
                          aria-pressed={mode === m}
                          className={`rounded-xl border-2 p-4 text-start ${
                            mode === m
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200'
                          }`}
                        >
                          <p className="font-black">
                            {m === 'manual' ? '✋' : '⚡'} {t[m]}
                            {mode === m ? ' ✓' : ''}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {m === 'manual' ? t.manualHelp : t.automaticHelp}
                          </p>
                        </button>
                      ))}
                    </div>
                    {mode === 'automatic' && (
                      <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                        {t.autoWarning}
                      </p>
                    )}
                  </div>

                  {formError && (
                    <p role="alert" className="break-words rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                      {formError}
                    </p>
                  )}
                  <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    🔒 {t.security}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'available', 'reserved', 'delivered', 'disabled'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFilter(s)}
                        className={`rounded-xl px-3 py-2 text-xs font-bold ${
                          filter === s
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s === 'all' ? t.allServices : t[s]}
                      </button>
                    ))}
                  </div>

                  {itemsError && (
                    <p role="alert" className="break-words rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                      {itemsError}
                    </p>
                  )}

                  {itemsLoading ? (
                    <p className="text-sm text-slate-500">{t.loading}</p>
                  ) : visibleItems.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                      {t.noStock}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {visibleItems.map((item, index) => (
                        <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-black">
                                {i18n[lang][item.item_type]} #{index + 1}
                              </p>
                              <p className="mt-1 font-mono text-xs text-slate-400">
                                {item.id.slice(0, 8)}
                              </p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor(item.status)}`}>
                              {t[item.status]}
                            </span>
                          </div>
                          <p className="mt-3 text-xs text-slate-500">
                        {i18n[lang][item.item_type]} #{index + 1}
                            {new Date(item.created_at).toLocaleDateString(
                              rtl ? 'ar-MR' : 'fr-FR'
                            )}
                          </p>

                          {(item.status === 'available' || item.status === 'disabled') && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={acting}
                                onClick={() => setPending({
                                  item,
                                  action: item.status === 'available' ? 'disable' : 'enable',
                                })}
                                className={`${buttonBase} border border-slate-200 text-slate-700`}
                              >
                                {item.status === 'available' ? t.disable : t.enable}
                              </button>
                              <button
                                type="button"
                                disabled={acting}
                                onClick={() => setPending({ item, action: 'delete' })}
                                className={`${buttonBase} bg-rose-50 text-rose-700`}
                              >
                                {t.delete}
                              </button>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                  <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    🔒 {t.protected}
                  </p>
                </>
              )}
            </div>

            <footer className="flex gap-3 border-t border-slate-100 p-5">
              {view === 'add' && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save()}
                  className={`${buttonBase} flex-1 bg-blue-600 text-white`}
                >
                  {saving ? t.saving : t.save}
                </button>
              )}
              <button
                type="button"
                disabled={saving || acting}
                onClick={close}
                className={`${buttonBase} border border-slate-200 text-slate-700`}
              >
                {t.close}
              </button>
            </footer>
          </section>
        </div>
      )}

      {pending && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-stock-title"
            dir={rtl ? 'rtl' : 'ltr'}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 id="confirm-stock-title" className="text-xl font-black">
              {t.confirm}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {pending.action === 'delete'
                ? t.deleteWarning
                : pending.action === 'disable'
                ? t.disableWarning
                : t.enableWarning}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={acting}
                onClick={() => void perform()}
                className={`${buttonBase} flex-1 text-white ${
                  pending.action === 'delete' ? 'bg-rose-600' : 'bg-blue-600'
                }`}
              >
                {acting ? t.processing : t.confirm}
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={() => setPending(null)}
                className={`${buttonBase} border border-slate-200 text-slate-700`}
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