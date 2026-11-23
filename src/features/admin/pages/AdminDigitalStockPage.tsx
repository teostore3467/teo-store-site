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

type Notice = {
  type: 'success' | 'error' | 'warning'
  message: string
}

const types: ItemType[] = [
  'account',
  'activation_code',
  'gift_card',
  'link',
  'other',
]

const translations = {
  ar: {
    title: 'المخزون الرقمي',
    subtitle: 'إدارة الحسابات والأكواد والروابط لكل باقة',
    search: 'ابحث عن خدمة أو باقة...',
    refresh: 'تحديث',
    available: 'متوفر',
    reserved: 'محجوز',
    delivered: 'تم التسليم',
    disabled: 'معطّل',
    add: 'إضافة مخزون',
    addTitle: 'إضافة مخزون جديد',
    service: 'الخدمة',
    plan: 'الباقة',
    type: 'نوع المخزون',
    mode: 'طريقة التسليم',
    manual: 'يدوي',
    automatic: 'تلقائي',
    manualDescription:
      'تراجع الطلب ثم ترسل بيانات المنتج للزبون بنفسك.',
    automaticDescription:
      'يُرسل النظام المنتج بعد تأكيد الدفع، عند اكتمال ربط الطلبات.',
    account: 'حساب جاهز',
    activation_code: 'كود تفعيل',
    gift_card: 'بطاقة هدية',
    link: 'رابط تفعيل',
    other: 'منتج آخر',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    show: 'إظهار',
    hide: 'إخفاء',
    items: 'الأكواد أو الروابط',
    itemsHint: 'ضع عنصرًا واحدًا في كل سطر.',
    accountHint: 'أدخل البريد الإلكتروني وكلمة المرور للحساب.',
    automaticWarning:
      'التسليم التلقائي غير جاهز بعد. يجب ربطه بتأكيد الدفع والطلبات.',
    security:
      'تُرسل البيانات إلى Supabase لتشفيرها على الخادم. لن تظهر الأكواد أو كلمات المرور بعد الحفظ.',
    save: 'حفظ المخزون',
    saving: 'جارٍ الحفظ...',
    cancel: 'إلغاء',
    close: 'إغلاق',
    loading: 'جارٍ تحميل المخزون...',
    empty: 'لم يتم العثور على باقات',
    success: 'تم حفظ المخزون بنجاح',
    failed: 'فشل حفظ المخزون',
    partial: 'تم حفظ بعض العناصر فقط',
    noItems: 'أدخل بيانات المخزون أولًا',
    invalidAccount: 'أدخل بريدًا إلكترونيًا وكلمة مرور',
    invalidLink: 'أدخل رابطًا صحيحًا يبدأ بـ https:// أو http://',
    maxItems: 'الحد الأقصى 100 عنصر في العملية',
    retry: 'احتفظنا بالعناصر الفاشلة فقط لإعادة المحاولة.',
    added: 'نجح',
    errors: 'فشل',
    result: 'نتيجة الحفظ',
    stock: 'المخزون',
    accountOnly: 'يمكنك إضافة حساب واحد في كل عملية.',
    noSecrets: 'لن تُعرض البيانات السرية بعد الحفظ.',
  },
  fr: {
    title: 'Stock Digital',
    subtitle: 'Gestion des comptes, codes et liens par forfait',
    search: 'Rechercher un service ou un forfait...',
    refresh: 'Actualiser',
    available: 'Disponibles',
    reserved: 'Réservés',
    delivered: 'Livrés',
    disabled: 'Désactivés',
    add: 'Ajouter du stock',
    addTitle: 'Ajouter du stock',
    service: 'Service',
    plan: 'Forfait',
    type: 'Type de stock',
    mode: 'Mode de livraison',
    manual: 'Manuelle',
    automatic: 'Automatique',
    manualDescription:
      'Vous vérifiez la commande et envoyez les données au client.',
    automaticDescription:
      'Le système livrera après paiement confirmé, une fois les commandes intégrées.',
    account: 'Compte prêt',
    activation_code: "Code d'activation",
    gift_card: 'Carte cadeau',
    link: "Lien d'activation",
    other: 'Autre produit',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    show: 'Afficher',
    hide: 'Masquer',
    items: 'Codes ou liens',
    itemsHint: 'Saisissez un élément par ligne.',
    accountHint: 'Saisissez les identifiants du compte.',
    automaticWarning:
      "La livraison automatique n'est pas encore active. Elle nécessite la confirmation des paiements et l'intégration des commandes.",
    security:
      'Les données sont envoyées à Supabase pour être chiffrées côté serveur. Les secrets ne seront plus affichés après enregistrement.',
    save: 'Enregistrer le stock',
    saving: 'Enregistrement...',
    cancel: 'Annuler',
    close: 'Fermer',
    loading: 'Chargement du stock...',
    empty: 'Aucun forfait trouvé',
    success: 'Stock enregistré avec succès',
    failed: "Échec de l'enregistrement",
    partial: 'Certains éléments ont été enregistrés',
    noItems: 'Saisissez les données du stock',
    invalidAccount: 'Saisissez un e-mail et un mot de passe',
    invalidLink: 'Saisissez une URL http:// ou https:// valide',
    maxItems: 'Maximum 100 éléments par opération',
    retry: 'Seuls les éléments échoués ont été conservés.',
    added: 'Réussis',
    errors: 'Échecs',
    result: "Résultat de l'enregistrement",
    stock: 'Stock',
    accountOnly: 'Vous pouvez ajouter un compte par opération.',
    noSecrets: 'Les secrets ne sont plus affichés après enregistrement.',
  },
}

function currentLanguage(): Lang {
  if (typeof document === 'undefined') return 'fr'

  return document.documentElement.lang
    .toLowerCase()
    .startsWith('ar')
    ? 'ar'
    : 'fr'
}

function createPayload(
  value: string,
  itemType: ItemType
): Record<string, string> {
  if (itemType === 'link') {
    let parsed: URL

    try {
      parsed = new URL(value)
    } catch {
      throw new Error('INVALID_LINK')
    }

    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error('INVALID_LINK')
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
    currentLanguage
  )

  const [plans, setPlans] = useState<Plan[]>([])
  const [counts, setCounts] = useState<StockCount[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)

  const [selectedPlan, setSelectedPlan] =
    useState<Plan | null>(null)
  const [itemType, setItemType] =
    useState<ItemType>('account')
  const [deliveryMode, setDeliveryMode] =
    useState<DeliveryMode>('manual')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rawItems, setRawItems] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [modalNotice, setModalNotice] =
    useState<Notice | null>(null)

  const t = translations[language]
  const isArabic = language === 'ar'

  useEffect(() => {
    const update = () => setLanguage(currentLanguage())
    const observer = new MutationObserver(update)

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!selectedPlan) return

    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = oldOverflow
    }
  }, [selectedPlan])

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
      setPageError(
        error instanceof Error
          ? error.message
          : 'Loading failed'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

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
      bg: 'bg-emerald-50',
    },
    {
      label: t.reserved,
      value: totals.reserved,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
    },
    {
      label: t.delivered,
      value: totals.delivered,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    {
      label: t.disabled,
      value: totals.disabled,
      color: 'text-slate-700',
      bg: 'bg-slate-100',
    },
  ]

  const openModal = (plan: Plan) => {
    setSelectedPlan(plan)
    setItemType('account')
    setDeliveryMode('manual')
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setRawItems('')
    setModalError('')
    setModalNotice(null)
  }

  const closeModal = () => {
    if (saving) return

    setSelectedPlan(null)
    setEmail('')
    setPassword('')
    setRawItems('')
    setModalError('')
    setModalNotice(null)
  }

  const changeItemType = (type: ItemType) => {
    setItemType(type)
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setRawItems('')
    setModalError('')
    setModalNotice(null)
  }

  const saveStock = async () => {
    if (!selectedPlan || saving) return

    setModalError('')
    setModalNotice(null)

    let payloads: Record<string, string>[] = []
    let originalItems: string[] = []

    if (itemType === 'account') {
      if (!email.trim() || !password) {
        setModalError(t.invalidAccount)
        return
      }

      payloads = [{
        email: email.trim(),
        password,
      }]
    } else {
      originalItems = rawItems
        .split(/\r?\n/)
        .map(value => value.trim())
        .filter(Boolean)

      if (originalItems.length === 0) {
        setModalError(t.noItems)
        return
      }

      if (originalItems.length > 100) {
        setModalError(t.maxItems)
        return
      }

      try {
        payloads = originalItems.map(item =>
          createPayload(item, itemType)
        )
      } catch {
        setModalError(t.invalidLink)
        return
      }
    }

    setSaving(true)

    let added = 0
    const failedItems: string[] = []
    const errorMessages: string[] = []

    try {
      for (let index = 0; index < payloads.length; index++) {
        try {
          const { error } = await supabase.rpc(
            'admin_add_digital_stock',
            {
              p_plan_id: selectedPlan.id,
              p_item_type: itemType,
              p_secret_payload: payloads[index],
              p_delivery_mode: deliveryMode,
            }
          )

          if (error) {
            failedItems.push(originalItems[index] ?? '')
            if (errorMessages.length < 3) {
              errorMessages.push(
                `${error.code ?? 'ERROR'}: ${error.message}`
              )
            }
          } else {
            added += 1
          }
        } catch (error) {
          failedItems.push(originalItems[index] ?? '')
          if (errorMessages.length < 3) {
            errorMessages.push(
              error instanceof Error
                ? error.message
                : t.failed
            )
          }
        }
      }

      if (failedItems.length === 0) {
        setNotice({
          type: 'success',
          message: `${t.success} (${added})`,
        })

        setSelectedPlan(null)
        setEmail('')
        setPassword('')
        setRawItems('')
      } else {
        setModalNotice({
          type: added > 0 ? 'warning' : 'error',
          message:
            `${added > 0 ? t.partial : t.failed}: ` +
            `${t.added} ${added}, ` +
            `${t.errors} ${failedItems.length}`,
        })

        setModalError(
          errorMessages.join(' | ') || t.failed
        )

        if (itemType !== 'account') {
          setRawItems(failedItems.join('\n'))
        }
      }

      await refresh()
    } catch (error) {
      setModalError(
        error instanceof Error
          ? error.message
          : t.failed
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="space-y-6 pb-12"
    >
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
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
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            ↻ {t.refresh}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(stat => (
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
            notice.type === 'success'
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
            const stock = countsByPlan.get(plan.id)

            const serviceName =
              plan.digital_service_groups
                ?.digital_services?.name ?? ''

            const groupName =
              plan.digital_service_groups?.name ?? ''

            return (
              <article
                key={plan.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <p className="text-xs font-bold text-blue-600">
                  {[serviceName, groupName]
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
                      value: stock?.available_count ?? 0,
                      color: 'text-emerald-700',
                    },
                    {
                      label: t.reserved,
                      value: stock?.reserved_count ?? 0,
                      color: 'text-amber-700',
                    },
                    {
                      label: t.delivered,
                      value: stock?.delivered_count ?? 0,
                      color: 'text-blue-700',
                    },
                    {
                      label: t.disabled,
                      value: stock?.disabled_count ?? 0,
                      color: 'text-slate-600',
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

                <button
                  type="button"
                  onClick={() => openModal(plan)}
                  className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-blue-700"
                >
                  + {t.add}
                </button>
              </article>
            )
          })
        )}
      </section>

      {selectedPlan && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-modal-title"
            dir={isArabic ? 'rtl' : 'ltr'}
            className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold text-blue-600">
                  TEO STORE / STOCK
                </p>

                <h2
                  id="stock-modal-title"
                  className="mt-1 text-xl font-black text-slate-950"
                >
                  {t.addTitle}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {t.plan}: {selectedPlan.label}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label={t.close}
                className="rounded-xl bg-slate-100 px-3 py-2 font-bold text-slate-700 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
              <div>
                <h3 className="mb-3 text-sm font-black text-slate-900">
                  01 · {t.type}
                </h3>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {types.map(type => (
                    <button
                      key={type}
                      type="button"
                      disabled={saving}
                      onClick={() => changeItemType(type)}
                      className={`rounded-xl border p-3 text-sm font-bold transition ${
                        itemType === type
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-black text-slate-900">
                  02 · {t.stock}
                </h3>

                {itemType === 'account' ? (
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">
                      {t.email}
                      <input
                        type="email"
                        dir="ltr"
                        value={email}
                        disabled={saving}
                        onChange={event =>
                          setEmail(event.target.value)
                        }
                        placeholder="email@example.com"
                        autoComplete="off"
                        className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-mono text-sm outline-none focus:border-blue-500"
                      />
                    </label>

                    <label className="block text-sm font-bold text-slate-700">
                      {t.password}
                      <div className="mt-2 flex gap-2">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          dir="ltr"
                          value={password}
                          disabled={saving}
                          onChange={event =>
                            setPassword(event.target.value)
                          }
                          placeholder="••••••••"
                          autoComplete="off"
                          spellCheck={false}
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3 font-mono text-sm outline-none focus:border-blue-500"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(value => !value)
                          }
                          className="rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700"
                        >
                          {showPassword ? t.hide : t.show}
                        </button>
                      </div>
                    </label>

                    <p className="text-xs text-slate-500">
                      {t.accountHint}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-slate-700">
                      {t.items}
                      <textarea
                        dir="ltr"
                        value={rawItems}
                        disabled={saving}
                        onChange={event =>
                          setRawItems(event.target.value)
                        }
                        rows={5}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={
                          itemType === 'link'
                            ? 'https://example.com/activate'
                            : 'CODE-001\nCODE-002\nCODE-003'
                        }
                        className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-3 font-mono text-sm outline-none focus:border-blue-500"
                      />
                    </label>

                    <p className="mt-2 text-xs text-slate-500">
                      {t.itemsHint}
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
                      onClick={() => setDeliveryMode(mode)}
                      aria-pressed={deliveryMode === mode}
                      className={`rounded-2xl border-2 p-4 text-start transition ${
                        deliveryMode === mode
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-slate-900">
                          {mode === 'manual' ? '✋' : '⚡'}{' '}
                          {t[mode]}
                        </span>

                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                            deliveryMode === mode
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {deliveryMode === mode ? '✓' : ''}
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {mode === 'manual'
                          ? t.manualDescription
                          : t.automaticDescription}
                      </p>
                    </button>
                  ))}
                </div>

                {deliveryMode === 'automatic' && (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    {t.automaticWarning}
                  </p>
                )}
              </div>

              {modalNotice && (
                <div
                  role="status"
                  className={`rounded-xl border p-4 text-sm font-bold ${
                    modalNotice.type === 'warning'
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  {t.result}: {modalNotice.message}
                </div>
              )}

              {modalError && (
                <div
                  role="alert"
                  className="break-words rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
                >
                  {modalError}
                </div>
              )}

              <p className="rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                🔒 {t.security}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-100 bg-white p-5 sm:p-6">
              <button
                type="button"
                onClick={() => void saveStock()}
                disabled={saving}
                className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? t.saving : t.save}
              </button>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"
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