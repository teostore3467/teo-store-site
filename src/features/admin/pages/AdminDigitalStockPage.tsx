import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../../../lib/supabase'

type Lang = 'ar' | 'fr'
type ItemType =
  | 'gift_card'
  | 'account'
  | 'activation_code'
  | 'link'
  | 'other'
type DeliveryMode = 'automatic' | 'manual'

type StockCount = {
  plan_id: string
  available_count: number
  reserved_count: number
  delivered_count: number
  disabled_count: number
}

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

const messages = {
  ar: {
    heading: 'إدارة المخزون الرقمي',
    subtitle: 'إدارة آمنة للأكواد والحسابات حسب الخدمة والباقة',
    refresh: 'تحديث',
    available: 'متوفر',
    reserved: 'محجوز',
    delivered: 'تم التسليم',
    disabled: 'معطّل',
    search: 'البحث عن خدمة أو باقة',
    loading: 'جارٍ التحميل...',
    empty: 'لم يتم العثور على باقات',
    service: 'الخدمة',
    add: 'إضافة مخزون',
    addTitle: 'إضافة مخزون مشفّر',
    type: 'نوع المنتج',
    mode: 'طريقة التسليم',
    automatic: 'تلقائي بعد تأكيد الدفع',
    manual: 'يدوي بواسطة المدير',
    codes: 'بيانات المخزون',
    codesHint:
      'أدخل عنصرًا واحدًا في كل سطر. سيتم تشفير كل عنصر قبل حفظه في قاعدة البيانات.',
    accountHint:
      'للحسابات: البريد الإلكتروني ثم | ثم كلمة المرور، حساب واحد في كل سطر.',
    cancel: 'إلغاء',
    save: 'حفظ المخزون',
    saving: 'جارٍ الحفظ...',
    success: 'تمت إضافة المخزون بنجاح',
    partial: 'اكتملت الإضافة جزئيًا',
    noCodes: 'أدخل عنصرًا واحدًا على الأقل',
    gift_card: 'بطاقة هدية',
    account: 'حساب',
    activation_code: 'كود تفعيل',
    link: 'رابط تفعيل',
    other: 'منتج آخر',
    security:
      'الأكواد لا تظهر بعد الحفظ. التسليم التلقائي للزبائن لن يعمل حتى نكمل ربط الطلبات وتأكيد الدفع.',
    failed: 'تعذرت إضافة المخزون',
    selected: 'الباقة المحددة',
    added: 'تمت الإضافة',
    errors: 'فشل',
  },
  fr: {
    heading: 'Stock Digital',
    subtitle: 'Gestion sécurisée des codes et comptes par forfait',
    refresh: 'Actualiser',
    available: 'Disponibles',
    reserved: 'Réservés',
    delivered: 'Livrés',
    disabled: 'Désactivés',
    search: 'Rechercher un service ou un forfait',
    loading: 'Chargement...',
    empty: 'Aucun forfait trouvé',
    service: 'Service',
    add: 'Ajouter du stock',
    addTitle: 'Ajouter du stock chiffré',
    type: 'Type de produit',
    mode: 'Mode de livraison',
    automatic: 'Automatique après paiement confirmé',
    manual: 'Manuel par administrateur',
    codes: 'Données du stock',
    codesHint:
      'Un élément par ligne. Chaque élément sera chiffré avant stockage.',
    accountHint:
      'Comptes : email puis | puis mot de passe, un compte par ligne.',
    cancel: 'Annuler',
    save: 'Enregistrer le stock',
    saving: 'Enregistrement...',
    success: 'Stock ajouté avec succès',
    partial: 'Ajout partiellement terminé',
    noCodes: 'Saisissez au moins un élément',
    gift_card: 'Carte cadeau',
    account: 'Compte',
    activation_code: "Code d'activation",
    link: "Lien d'activation",
    other: 'Autre produit',
    security:
      "Les secrets ne sont pas affichés après enregistrement. La livraison automatique aux clients reste inactive jusqu'à la validation des paiements.",
    failed: "Impossible d'ajouter le stock",
    selected: 'Forfait sélectionné',
    added: 'Ajoutés',
    errors: 'Échecs',
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
  itemType: ItemType
): Record<string, string> {
  if (itemType === 'account') {
    const separator = value.indexOf('|')

    if (separator < 1) {
      throw new Error(
        'Account format: email | password'
      )
    }

    const email = value.slice(0, separator).trim()
    const password = value.slice(separator + 1).trim()

    if (!email || !password) {
      throw new Error(
        'Account format: email | password'
      )
    }

    return { email, password }
  }

  if (itemType === 'link') {
    const url = new URL(value)

    if (!['https:', 'http:'].includes(url.protocol)) {
      throw new Error('Invalid activation URL')
    }

    return { url: value }
  }

  if (itemType === 'other') {
    return { value }
  }

  return { code: value }
}

export default function AdminDigitalStockPage() {
  const [language, setLanguage] = useState<Lang>(
    getLanguage
  )

  const [plans, setPlans] = useState<Plan[]>([])
  const [counts, setCounts] = useState<StockCount[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedPlan, setSelectedPlan] =
    useState<Plan | null>(null)
  const [itemType, setItemType] =
    useState<ItemType>('activation_code')
  const [deliveryMode, setDeliveryMode] =
    useState<DeliveryMode>('manual')
  const [rawItems, setRawItems] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

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

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

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

    if (plansResult.error || countsResult.error) {
      setError(
        plansResult.error?.message ||
          countsResult.error?.message ||
          'Loading failed'
      )
      setLoading(false)
      return
    }

    setPlans(
      (plansResult.data ?? []) as unknown as Plan[]
    )
    setCounts(
      (countsResult.data ?? []) as StockCount[]
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const countsByPlan = useMemo(
    () =>
      new Map(
        counts.map(item => [item.plan_id, item])
      ),
    [counts]
  )

  const totals = useMemo(
    () =>
      counts.reduce(
        (result, item) => ({
          available:
            result.available +
            Number(item.available_count),
          reserved:
            result.reserved +
            Number(item.reserved_count),
          delivered:
            result.delivered +
            Number(item.delivered_count),
          disabled:
            result.disabled +
            Number(item.disabled_count),
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

    return plans.filter(plan => {
      const content = [
        plan.label,
        plan.plan_key,
        plan.digital_service_groups?.name,
        plan.digital_service_groups
          ?.digital_services?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return content.includes(search)
    })
  }, [plans, query])

  const stats = [
    {
      label: t.available,
      value: totals.available,
      color: 'text-emerald-700',
    },
    {
      label: t.reserved,
      value: totals.reserved,
      color: 'text-amber-700',
    },
    {
      label: t.delivered,
      value: totals.delivered,
      color: 'text-blue-700',
    },
    {
      label: t.disabled,
      value: totals.disabled,
      color: 'text-slate-600',
    },
  ]

  const openAdd = (plan: Plan) => {
    setSelectedPlan(plan)
    setRawItems('')
    setItemType('activation_code')
    setDeliveryMode('manual')
    setNotice('')
  }

  const saveStock = async () => {
    if (!selectedPlan || saving) return

    const items = rawItems
      .split(/\r?\n/)
      .map(item => item.trim())
      .filter(Boolean)

    if (items.length === 0) {
      setNotice(t.noCodes)
      return
    }

    if (items.length > 100) {
      setNotice(
        isArabic
          ? 'الحد الأقصى 100 عنصر في العملية'
          : 'Maximum 100 éléments par opération'
      )
      return
    }

    const payloads: Record<string, string>[] = []

    try {
      for (const item of items) {
        payloads.push(makePayload(item, itemType))
      }
    } catch (err) {
      setNotice(
        err instanceof Error
          ? err.message
          : t.failed
      )
      return
    }

    setSaving(true)
    setNotice('')

    let added = 0
    let failed = 0

    for (const payload of payloads) {
      const { error: rpcError } = await supabase.rpc(
        'admin_add_digital_stock',
        {
          p_plan_id: selectedPlan.id,
          p_item_type: itemType,
          p_secret_payload: payload,
          p_delivery_mode: deliveryMode,
        }
      )

      if (rpcError) {
        failed += 1
      } else {
        added += 1
      }
    }

    setSaving(false)

    if (failed === 0) {
      setNotice(
        `${t.success} (${added})`
      )
      setRawItems('')
      setSelectedPlan(null)
    } else {
      setNotice(
        `${t.partial}: ${t.added} ${added}, ${t.errors} ${failed}`
      )
    }

    await refresh()
  }

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="space-y-5 pb-10"
    >
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              TEO STORE · ADMIN
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-950">
              {t.heading}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {t.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 disabled:opacity-50"
          >
            ↻ {t.refresh}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="rounded-xl bg-slate-50 p-4"
            >
              <p className="text-xs font-semibold text-slate-500">
                {stat.label}
              </p>

              <p
                className={`mt-1 text-2xl font-black ${stat.color}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
        >
          {notice}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label
          htmlFor="stock-search"
          className="mb-2 block text-sm font-bold text-slate-700"
        >
          {t.search}
        </label>

        <input
          id="stock-search"
          value={query}
          onChange={event =>
            setQuery(event.target.value)
          }
          placeholder="Apple Gift Card, Netflix, Shahid..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
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
            const stock = countsByPlan.get(plan.id)

            const quantities = [
              {
                label: t.available,
                value: stock?.available_count ?? 0,
              },
              {
                label: t.reserved,
                value: stock?.reserved_count ?? 0,
              },
              {
                label: t.delivered,
                value: stock?.delivered_count ?? 0,
              },
              {
                label: t.disabled,
                value: stock?.disabled_count ?? 0,
              },
            ]

            return (
              <article
                key={plan.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-bold text-blue-600">
                  {plan.digital_service_groups
                    ?.digital_services?.name ??
                    t.service}
                  {' · '}
                  {plan.digital_service_groups?.name ??
                    ''}
                </p>

                <h2 className="mt-1 text-lg font-black text-slate-950">
                  {plan.label}
                </h2>

                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  {quantities.map(item => (
                    <div
                      key={item.label}
                      className="rounded-lg bg-slate-50 p-2"
                    >
                      <p className="text-lg font-black text-slate-900">
                        {item.value}
                      </p>

                      <p className="text-[10px] font-medium text-slate-500">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => openAdd(plan)}
                  className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
                >
                  + {t.add}
                </button>
              </article>
            )
          })
        )}
      </section>

      {selectedPlan && (
        <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            {t.addTitle}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {t.selected}: {selectedPlan.label}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              {t.type}
              <select
                value={itemType}
                onChange={event =>
                  setItemType(
                    event.target.value as ItemType
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 p-3"
              >
                {(
                  [
                    'gift_card',
                    'account',
                    'activation_code',
                    'link',
                    'other',
                  ] as ItemType[]
                ).map(type => (
                  <option key={type} value={type}>
                    {t[type]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              {t.mode}
              <select
                value={deliveryMode}
                onChange={event =>
                  setDeliveryMode(
                    event.target.value as DeliveryMode
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 p-3"
              >
                <option value="manual">
                  {t.manual}
                </option>
                <option value="automatic">
                  {t.automatic}
                </option>
              </select>
            </label>
          </div>

          <label className="mt-5 block text-sm font-bold text-slate-700">
            {t.codes}
            <textarea
              dir="ltr"
              value={rawItems}
              onChange={event =>
                setRawItems(event.target.value)
              }
              rows={7}
              autoComplete="off"
              spellCheck={false}
              placeholder={
                itemType === 'account'
                  ? 'email@example.com | password'
                  : 'CODE-001\nCODE-002\nCODE-003'
              }
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-mono text-sm outline-none focus:border-blue-500"
            />
          </label>

          <p className="mt-2 text-xs text-slate-500">
            {itemType === 'account'
              ? t.accountHint
              : t.codesHint}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void saveStock()}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50"
            >
              {saving ? t.saving : t.save}
            </button>

            <button
              type="button"
              onClick={() => {
                if (saving) return
                setSelectedPlan(null)
                setRawItems('')
              }}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700"
            >
              {t.cancel}
            </button>
          </div>
        </section>
      )}

      <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        {t.security}
      </p>
    </main>
  )
}