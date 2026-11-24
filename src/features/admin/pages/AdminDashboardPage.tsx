import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag,
  Wallet,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Boxes,
  Star,
  Headphones,
  Settings,
  Smartphone,
  Layers,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Activity,
  Globe,
  type LucideIcon,
} from 'lucide-react'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'

type Period = 1 | 7 | 30 | 90 | 365

type CustomerStats = {
  total_inscrits: number
  clients_connectes: number
  connectes_30_jours: number
  nouveaux_30_jours: number
}

type Order = {
  id: string
  order_number: string
  customer_name: string
  service_name: string
  total_amount: number
  currency: string
  status: string
  created_at: string
  updated_at: string
}

type Review = {
  rating: number | string
  is_visible: boolean
  reviewed_at: string | null
}

type Service = {
  id: string
  availability: string
  active: boolean
}

type RecordId = {
  id: string
}

type Dataset = {
  orders: Order[]
  storeReviews: Review[] | null
  productReviews: Review[] | null
  services: Service[] | null
  groups: RecordId[] | null
  plans: RecordId[] | null
  esimCountries: RecordId[] | null
  esimPlans: RecordId[] | null
}

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'purple'

const EMPTY: Dataset = {
  orders: [],
  storeReviews: null,
  productReviews: null,
  services: null,
  groups: null,
  plans: null,
  esimCountries: null,
  esimPlans: null,
}

const MONEY_STATUSES = new Set([
  'payment_confirmed',
  'processing',
  'fulfillment_sent',
  'disputed',
  'completed',
])

const STATUS_LABELS: Record<string, [string, string]> = {
  payment_review: ['الدفع قيد المراجعة', 'Paiement à vérifier'],
  payment_partial: ['دفع غير مكتمل', 'Paiement incomplet'],
  payment_confirmed: ['الدفع مؤكد', 'Paiement confirmé'],
  processing: ['قيد التجهيز', 'En traitement'],
  fulfillment_sent: ['تم إرسال الخدمة', 'Service envoyé'],
  disputed: ['نزاع', 'Litige'],
  completed: ['مكتمل', 'Terminée'],
  cancelled: ['ملغى', 'Annulée'],
  refunded: ['مسترجع', 'Remboursée'],
}

const TONES: Record<Tone, string> = {
  blue: '#2563eb',
  green: '#059669',
  amber: '#d97706',
  red: '#e11d48',
  purple: '#7c3aed',
}

const fmt = (value: number, decimals = 0) =>
  new Intl.NumberFormat('fr-FR-u-nu-latn', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value : 0)

const amount = (value: number) => `${fmt(value, 2)} MRU`

const dayStart = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

const dateShift = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const between = (date: string, start: Date, end: Date) => {
  const value = new Date(date).getTime()
  return value >= start.getTime() && value < end.getTime()
}

const dateLabel = (date: string, ar = false) => {
  const value = new Date(date)

  if (Number.isNaN(value.getTime())) return '—'

  return new Intl.DateTimeFormat(
    ar ? 'ar-MR-u-nu-latn' : 'fr-FR-u-nu-latn',
    {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(value)
}

const confirmedValue = (orders: Order[]) =>
  orders
    .filter(
      order =>
        MONEY_STATUSES.has(order.status) &&
        order.currency === 'MRU',
    )
    .reduce(
      (sum, order) => sum + (Number(order.total_amount) || 0),
      0,
    )

const statusTone = (status: string): Tone => {
  if (status === 'completed') return 'green'

  if (
    ['disputed', 'cancelled', 'refunded'].includes(status)
  ) return 'red'

  if (
    ['payment_review', 'payment_partial'].includes(status)
  ) return 'amber'

  return 'blue'
}

async function readAll<T>(
  table: string,
  columns: string,
  orderBy = 'id',
): Promise<T[]> {
  const output: T[] = []
  const pageSize = 500

  for (let offset = 0; ; offset += pageSize) {
    let query = supabase
      .from(table)
      .select(columns)
      .order(orderBy, { ascending: false })

    if (orderBy !== 'id') {
      query = query.order('id', { ascending: false })
    }

    const { data, error } = await query.range(
      offset,
      offset + pageSize - 1,
    )

    if (error) {
      throw new Error(`${table}: ${error.message}`)
    }

    const rows = (data ?? []) as unknown as T[]

    output.push(...rows)

    if (rows.length < pageSize) return output
  }
}

function Metric({
  title,
  value,
  note,
  icon: Icon,
  tone = 'blue',
  to,
  change,
}: {
  title: string
  value: string
  note?: string
  icon: LucideIcon
  tone?: Tone
  to?: string
  change?: number | null
}) {
  const color = TONES[tone]

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className="text-xs font-bold leading-5 sm:text-sm"
          style={{ color: 'var(--dash-muted)' }}
        >
          {title}
        </span>

        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            color,
            background: `${color}18`,
          }}
        >
          <Icon size={20} strokeWidth={1.8} />
        </span>
      </div>

      <p
        dir="ltr"
        className="mt-4 break-words text-start text-xl font-black tracking-tight sm:text-[26px]"
        style={{ color: 'var(--dash-text)' }}
      >
        {value}
      </p>

      {typeof change === 'number' && (
        <div
          dir="ltr"
          className="mt-2 flex items-center gap-1 text-xs font-bold"
          style={{
            color: change >= 0 ? '#059669' : '#e11d48',
          }}
        >
          {change >= 0
            ? <TrendingUp size={15} />
            : <TrendingDown size={15} />}

          {change > 0 ? '+' : ''}
          {fmt(change, 1)}%
        </div>
      )}

      {note && (
        <p
          className="mt-2 text-[11px] leading-5"
          style={{ color: 'var(--dash-muted)' }}
        >
          {note}
        </p>
      )}
    </>
  )

  const classes =
    'teo-dash-card block min-w-0 rounded-2xl border p-4 transition sm:p-5'

  return to ? (
    <Link to={to} className={`${classes} hover:-translate-y-0.5`}>
      {inner}
    </Link>
  ) : (
    <div className={classes}>{inner}</div>
  )
}

function AdminDashboardPage() {
  const { language } = useLanguage()
  const ar = language === 'ar'

  const t = (a: string, f: string) => ar ? a : f

  const [period, setPeriod] = useState<Period>(30)
  const [data, setData] = useState<Dataset>(EMPTY)

  const [customerStats, setCustomerStats] =
    useState<CustomerStats | null>(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issues, setIssues] = useState<string[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())

  const [chartMode, setChartMode] =
    useState<'sales' | 'orders'>('sales')

  const [selectedBar, setSelectedBar] =
    useState<string | null>(null)

  const [dark, setDark] = useState(
    () => document.documentElement.dataset.teoTheme === 'dark',
  )

  const busy = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    const sync = () => {
      setDark(
        document.documentElement.dataset.teoTheme === 'dark',
      )
    }

    const observer = new MutationObserver(sync)

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-teo-theme'],
    })

    sync()

    return () => observer.disconnect()
  }, [])

  const load = useCallback(async (refresh = false) => {
    if (busy.current) return

    busy.current = true

    if (refresh) setRefreshing(true)
    else setLoading(true)

    setError(null)

    const errors: string[] = []

    const optional = async <T,>(
      table: string,
      columns: string,
    ): Promise<T[] | null> => {
      try {
        return await readAll<T>(table, columns)
      } catch (e) {
        errors.push(
          e instanceof Error ? e.message : table,
        )

        return null
      }
    }

    try {
      const [
        orders,
        storeReviews,
        productReviews,
        services,
        groups,
        plans,
        esimCountries,
        esimPlans,
        customerResult,
      ] = await Promise.all([
        readAll<Order>(
          'digital_orders',
          'id,order_number,customer_name,service_name,total_amount,currency,status,created_at,updated_at',
          'created_at',
        ),

        optional<Review>(
          'store_reviews',
          'rating,is_visible,reviewed_at',
        ),

        optional<Review>(
          'digital_order_reviews',
          'rating,is_visible,reviewed_at',
        ),

        optional<Service>(
          'digital_services',
          'id,availability,active',
        ),

        optional<RecordId>('digital_service_groups', 'id'),

        optional<RecordId>('digital_service_plans', 'id'),

        optional<RecordId>('esim_countries', 'id'),

        optional<RecordId>('esim_plans', 'id'),

        supabase.rpc('admin_customer_stats'),
      ])

      if (!mounted.current) return

      if (customerResult.error) {
        errors.push(
          `admin_customer_stats: ${customerResult.error.message}`,
        )

        setCustomerStats(null)
      } else {
        const result = customerResult.data

        const row = (
          Array.isArray(result) ? result[0] : result
        ) as CustomerStats | null

        setCustomerStats(
          row
            ? {
                total_inscrits: Number(row.total_inscrits) || 0,
                clients_connectes: Number(row.clients_connectes) || 0,
                connectes_30_jours: Number(row.connectes_30_jours) || 0,
                nouveaux_30_jours: Number(row.nouveaux_30_jours) || 0,
              }
            : null,
        )
      }

      setData({
        orders,
        storeReviews,
        productReviews,
        services,
        groups,
        plans,
        esimCountries,
        esimPlans,
      })

      setIssues(errors)
      setLastUpdated(new Date().toISOString())
      setNow(new Date())
    } catch (e) {
      if (mounted.current) {
        setError(
          e instanceof Error ? e.message : 'Chargement impossible',
        )
      }
    } finally {
      busy.current = false

      if (mounted.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    mounted.current = true

    void load()

    let timer: number | undefined

    const refresh = () => {
      window.clearTimeout(timer)

      timer = window.setTimeout(() => {
        void load(true)
      }, 700)
    }

    const channel = supabase.channel('teo-admin-dashboard-v5')

    const tables = [
      'digital_orders',
      'digital_services',
      'digital_service_groups',
      'digital_service_plans',
      'store_reviews',
      'digital_order_reviews',
      'esim_countries',
      'esim_plans',
    ]

    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        refresh,
      )
    })

    channel.subscribe()

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load(true)
      }
    }, 60000)

    const visibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', visibility)

    return () => {
      mounted.current = false

      window.clearTimeout(timer)
      window.clearInterval(interval)

      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', visibility)

      void supabase.removeChannel(channel)
    }
  }, [load])

  const start = useMemo(
    () => dateShift(dayStart(now), 1 - period),
    [now, period],
  )

  const end = useMemo(
    () => dateShift(dayStart(now), 1),
    [now],
  )

  const previousStart = useMemo(
    () => dateShift(start, -period),
    [start, period],
  )

  const current = useMemo(
    () => data.orders.filter(
      order => between(order.created_at, start, end),
    ),
    [data.orders, start, end],
  )

  const previous = useMemo(
    () => data.orders.filter(
      order => between(order.created_at, previousStart, start),
    ),
    [data.orders, previousStart, start],
  )

  const ready = Boolean(lastUpdated)

  const currentValue = confirmedValue(current)
  const previousValue = confirmedValue(previous)

  const growth = (a: number, b: number) =>
    b === 0 ? (a === 0 ? 0 : null) : ((a - b) / b) * 100

  const growthNote = (a: number, b: number) =>
    b === 0 && a > 0
      ? t('نشاط جديد مقارنة بالفترة السابقة', 'Nouvelle activité')
      : t('مقارنة بالفترة السابقة', 'Comparaison période précédente')

  const countStatus = (statuses: string[]) =>
    data.orders.filter(
      order => statuses.includes(order.status),
    ).length

  const pendingPayments = countStatus([
    'payment_review',
    'payment_partial',
  ])

  const pendingOrders = countStatus([
    'payment_confirmed',
    'processing',
  ])

  const disputes = countStatus(['disputed'])

  const sentOrders = countStatus(['fulfillment_sent'])

  const completed = current.filter(
    order => order.status === 'completed',
  ).length

  const cancelled = current.filter(
    order => order.status === 'cancelled',
  ).length

  const refunded = current.filter(
    order => order.status === 'refunded',
  ).length

  const paidOrders = current.filter(
    order =>
      MONEY_STATUSES.has(order.status) &&
      order.currency === 'MRU',
  )

  const averageOrder = paidOrders.length
    ? currentValue / paidOrders.length
    : 0

  const completionRate = current.length
    ? completed / current.length * 100
    : 0

  const reviewsReady =
    data.storeReviews !== null &&
    data.productReviews !== null

  const reviews = [
    ...(data.storeReviews ?? []),
    ...(data.productReviews ?? []),
  ]

  const visibleRatings = reviews
    .filter(review => review.is_visible)
    .map(review => Number(review.rating))
    .filter(rating => rating >= 1 && rating <= 5)

  const averageRating = visibleRatings.length
    ? visibleRatings.reduce((a, b) => a + b, 0) /
      visibleRatings.length
    : 0

  const unreadReviews = reviews.filter(
    review => !review.reviewed_at,
  ).length

  const availableServices = data.services?.filter(
    service =>
      service.active &&
      service.availability === 'available',
  ).length

  const unavailableServices = data.services?.filter(
    service =>
      service.active &&
      service.availability !== 'available',
  ).length

  const otherCurrencies = current.some(
    order => order.currency !== 'MRU',
  )

  const daily = useMemo(() => {
    const step = period === 365 ? 14 : period === 90 ? 3 : 1

    return Array.from(
      { length: Math.ceil(period / step) },
      (_, index) => {
        const d = dateShift(start, index * step)

        const next = dateShift(
          start,
          Math.min((index + 1) * step, period),
        )

        const orders = current.filter(
          order => between(order.created_at, d, next),
        )

        const formatter = new Intl.DateTimeFormat(
          'fr-FR-u-nu-latn',
          { day: '2-digit', month: '2-digit' },
        )

        return {
          key: d.toISOString(),
          label: formatter.format(d),
          range: step === 1
            ? formatter.format(d)
            : `${formatter.format(d)} – ${formatter.format(dateShift(next, -1))}`,
          value: confirmedValue(orders),
          count: orders.length,
        }
      },
    )
  }, [start, period, current])

  const chartMax = Math.max(
    1,
    ...daily.map(
      day => chartMode === 'sales' ? day.value : day.count,
    ),
  )

  const selectedPoint = daily.find(
    day => day.key === selectedBar,
  )

  const ranking = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; value: number }
    >()

    for (const order of current) {
      if (
        !MONEY_STATUSES.has(order.status) ||
        order.currency !== 'MRU'
      ) continue

      const name = order.service_name || '—'

      const item = map.get(name) ?? {
        name,
        count: 0,
        value: 0,
      }

      item.count += 1
      item.value += Number(order.total_amount) || 0

      map.set(name, item)
    }

    return [...map.values()]
      .sort((a, b) => b.value - a.value || b.count - a.count)
      .slice(0, 5)
  }, [current])

  const rankingMax = Math.max(
    1,
    ...ranking.map(item => item.value),
  )

  const showCount = (value: number | null | undefined) =>
    value === null || value === undefined ? '—' : fmt(value)

  const showOrders = (value: number) =>
    ready ? fmt(value) : '—'

  const showMoney = (value: number) =>
    ready ? amount(value) : '—'

  const exportCSV = () => {
    if (!ready) return

    const escape = (value: unknown) => {
      let text = String(value ?? '')

      // Protect spreadsheets from formula injection.
      if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) {
        text = `'${text}`
      }

      return `"${text.replace(/"/g, '""')}"`
    }

    const headers = [
      t('رقم الطلب', 'Commande'),
      t('العميل', 'Client'),
      t('الخدمة', 'Service'),
      t('المبلغ', 'Montant'),
      t('العملة', 'Devise'),
      t('الحالة', 'Statut'),
      t('التاريخ', 'Date'),
    ]

    const rows = current.map(order => [
      order.order_number,
      order.customer_name,
      order.service_name,
      order.total_amount,
      order.currency,
      STATUS_LABELS[order.status]?.[ar ? 0 : 1] ?? order.status,
      order.created_at,
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(escape).join(';'))
      .join('\r\n')

    const blob = new Blob(
      ['\uFEFF', csv],
      { type: 'text/csv;charset=utf-8;' },
    )

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url
    link.download = `TEO-Orders-${period}days-${new Date().toISOString().slice(0, 10)}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const urgentItems = [
    {
      title: t('مدفوعات تحتاج للمراجعة', 'Paiements à vérifier'),
      count: ready ? pendingPayments : null,
      icon: CreditCard,
      color: '#d97706',
      to: '/admin/payments',
    },
    {
      title: t('طلبات تحتاج للتجهيز', 'Commandes à traiter'),
      count: ready ? pendingOrders : null,
      icon: ShoppingBag,
      color: '#2563eb',
      to: '/admin/orders',
    },
    {
      title: t('نزاعات تحتاج للتدخل', 'Litiges à traiter'),
      count: ready ? disputes : null,
      icon: AlertTriangle,
      color: '#e11d48',
      to: '/admin/orders',
    },
    {
      title: t('تقييمات جديدة', 'Nouveaux avis'),
      count: reviewsReady ? unreadReviews : null,
      icon: Star,
      color: '#7c3aed',
      to: '/admin/store-reviews',
    },
  ]

  const quickLinks = [
    {
      label: t('الطلبات', 'Commandes'),
      icon: ShoppingBag,
      to: '/admin/orders',
    },
    {
      label: t('المدفوعات', 'Paiements'),
      icon: CreditCard,
      to: '/admin/payments',
    },
    {
      label: t('الخدمات', 'Services'),
      icon: Boxes,
      to: '/admin/services',
    },
    {
      label: t('الباقات', 'Plans'),
      icon: Layers,
      to: '/admin/plans',
    },
    {
      label: 'eSIM',
      icon: Smartphone,
      to: '/admin/esim',
    },
    {
      label: t('الدعم', 'Support'),
      icon: Headphones,
      to: '/admin/support',
    },
    {
      label: t('التقييمات', 'Avis'),
      icon: Star,
      to: '/admin/store-reviews',
    },
    {
      label: t('الإعدادات', 'Paramètres'),
      icon: Settings,
      to: '/admin/settings',
    },
  ]

  const panel = 'teo-dash-card min-w-0 rounded-2xl border p-4 sm:p-5'

  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      className={`teo-dashboard-v5 min-w-0 space-y-5 pb-10 ${dark ? 'is-dark' : ''}`}
    >
      <style>{`
        .teo-dashboard-v5 {
          --dash-surface: #ffffff;
          --dash-soft: #f1f5f9;
          --dash-border: #e2e8f0;
          --dash-text: #0f172a;
          --dash-muted: #64748b;
          --dash-blue: #2563eb;
          color: var(--dash-text);
        }

        .teo-dashboard-v5.is-dark {
          --dash-surface: #101827;
          --dash-soft: #192334;
          --dash-border: #293548;
          --dash-text: #f1f5f9;
          --dash-muted: #94a3b8;
          --dash-blue: #93c5fd;
        }

        .teo-dashboard-v5 .teo-dash-card {
          background: var(--dash-surface);
          border-color: var(--dash-border);
          color: var(--dash-text);
          box-shadow: 0 4px 20px rgba(15,23,42,.035);
        }

        .teo-dashboard-v5 .teo-dash-soft {
          background: var(--dash-soft);
          border-color: var(--dash-border);
        }

        .teo-dashboard-v5 .teo-dash-muted {
          color: var(--dash-muted);
        }

        .teo-dashboard-v5 .teo-dash-link {
          color: var(--dash-blue);
        }

        .teo-dashboard-v5 a {
          text-decoration: none;
        }

        .teo-dashboard-v5 button:focus-visible,
        .teo-dashboard-v5 a:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 3px;
        }
      `}</style>

      {/* WELCOME HEADER */}

      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#102a56] via-[#164e9e] to-[#2563eb] p-5 text-white sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-16 -top-24 h-72 w-72 rounded-full border-[40px] border-white/5"
        />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-100">
              <Activity size={16} />
              TEO STORE · ADMIN V5
            </div>

            <h1 className="mt-3 text-2xl font-black sm:text-3xl">
              {t('مرحبًا بك في مركز الإدارة', 'Bienvenue dans votre espace admin')}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-7 text-blue-100">
              {t(
                'تابع مبيعاتك وطلباتك وعملاءك وأداء متجرك من مكان واحد.',
                'Pilotez vos ventes, commandes, clients et performances depuis un seul espace.',
              )}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-blue-100">
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  error
                    ? 'bg-rose-400'
                    : ready
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                }`} />

                {error
                  ? t('خطأ في التحديث', 'Erreur de synchronisation')
                  : ready
                    ? t('بيانات Supabase', 'Données Supabase')
                    : t('جارٍ التحميل', 'Chargement')}
              </span>

              {lastUpdated && (
                <span>
                  {t('آخر تحديث:', 'Dernière mise à jour :')}{' '}
                  {dateLabel(lastUpdated, ar)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || refreshing}
              onClick={() => void load(true)}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing || loading ? 'animate-spin' : ''}
              />

              {t('تحديث', 'Actualiser')}
            </button>

            <button
              type="button"
              disabled={!ready || loading}
              onClick={exportCSV}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-blue-700 disabled:opacity-50"
            >
              <Download size={17} />
              {t('تصدير CSV', 'Exporter CSV')}
            </button>
          </div>
        </div>
      </header>

      {/* ERROR AND WARNING STATES */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-500"
        >
          <p className="font-bold">
            {t('تعذر تحديث البيانات', 'Échec de chargement')}
          </p>

          <p className="mt-2 break-words text-xs" dir="ltr">
            {error}
          </p>

          {ready && (
            <p className="mt-2 text-xs">
              {t(
                'يتم عرض آخر بيانات تم تحميلها بنجاح.',
                'Les dernières données disponibles restent affichées.',
              )}
            </p>
          )}
        </div>
      )}

      {issues.length > 0 && (
        <details className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-600">
          <summary className="cursor-pointer text-xs font-bold">
            {t(
              'بعض الإحصائيات غير متاحة — عرض التفاصيل',
              'Certaines statistiques sont indisponibles — détails',
            )}
          </summary>

          <div className="mt-3 space-y-2">
            {issues.map((issue, index) => (
              <p
                key={index}
                dir="ltr"
                className="break-words text-xs"
              >
                {issue}
              </p>
            ))}
          </div>
        </details>
      )}

      {/* PERIOD FILTER */}

      <section className={panel}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="teo-dash-soft flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <CalendarDays size={20} className="teo-dash-link" />
            </div>

            <div>
              <h2 className="text-sm font-black">
                {t('الفترة الإحصائية', 'Période statistique')}
              </h2>

              <p className="teo-dash-muted mt-1 text-xs" dir="ltr">
                {start.toLocaleDateString('fr-FR')} – {dateShift(end, -1).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="teo-dash-soft grid grid-cols-5 gap-1 rounded-xl p-1">
            {([1, 7, 30, 90, 365] as Period[]).map(value => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                onClick={() => {
                  setPeriod(value)
                  setSelectedBar(null)
                }}
                className={`min-h-10 rounded-lg px-2 text-[10px] font-black transition sm:px-4 sm:text-xs ${
                  period === value
                    ? 'bg-blue-600 text-white'
                    : 'teo-dash-muted'
                }`}
              >
                {value === 1
                  ? t('اليوم', "Aujourd'hui")
                  : t(`${value} يوم`, `${value} j`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PRIMARY METRICS */}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric
          title={t('قيمة الطلبات المؤكدة', 'Valeur confirmée')}
          value={showMoney(currentValue)}
          icon={Wallet}
          tone="green"
          change={ready ? growth(currentValue, previousValue) : null}
          note={growthNote(currentValue, previousValue)}
        />

        <Metric
          title={t('إجمالي الطلبات', 'Total commandes')}
          value={showOrders(current.length)}
          icon={ShoppingBag}
          change={ready ? growth(current.length, previous.length) : null}
          note={growthNote(current.length, previous.length)}
          to="/admin/orders"
        />

        <Metric
          title={t('متوسط الطلب المؤكد', 'Panier moyen confirmé')}
          value={showMoney(averageOrder)}
          icon={CreditCard}
          tone="purple"
          note={t(
            'الطلبات المؤكدة بعملة MRU',
            'Commandes confirmées en MRU',
          )}
        />

        <Metric
          title={t('نسبة إكمال الطلبات', 'Taux de finalisation')}
          value={ready ? `${fmt(completionRate, 1)}%` : '—'}
          icon={CheckCircle2}
          tone="green"
          note={t(
            `${completed} طلب مكتمل خلال الفترة المختارة`,
            `${completed} commande(s) terminée(s) parmi celles de la période`,
          )}
          to="/admin/orders"
        />
      </section>

      {otherCurrencies && (
        <p className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-600">
          {t(
            'المبالغ المعروضة تستثني الطلبات المسجلة بعملات غير MRU.',
            'Les montants excluent les commandes dans les autres devises.',
          )}
        </p>
      )}

      {/* CHART AND URGENT ACTIONS */}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[1.65fr_1fr]">
        <section className={panel}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="teo-dash-link flex items-center gap-2 text-xs font-bold">
                <BarChart3 size={17} />
                {t('الأداء التجاري', 'Performance commerciale')}
              </div>

              <h2 className="mt-2 text-lg font-black">
                {chartMode === 'sales'
                  ? t('تطور قيمة الطلبات المؤكدة', 'Évolution de la valeur confirmée')
                  : t('تطور عدد الطلبات', 'Évolution des commandes')}
              </h2>
            </div>

            <div className="teo-dash-soft flex rounded-lg p-1">
              {(['sales', 'orders'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={chartMode === mode}
                  onClick={() => {
                    setChartMode(mode)
                    setSelectedBar(null)
                  }}
                  className={`rounded-md px-3 py-2 text-xs font-bold ${
                    chartMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'teo-dash-muted'
                  }`}
                >
                  {mode === 'sales'
                    ? t('المبيعات', 'Ventes')
                    : t('الطلبات', 'Commandes')}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-2">
            <div>
              <p className="teo-dash-muted text-xs">
                {t('إجمالي الفترة', 'Total de la période')}
              </p>

              <p dir="ltr" className="mt-1 text-2xl font-black">
                {chartMode === 'sales'
                  ? showMoney(currentValue)
                  : showOrders(current.length)}
              </p>
            </div>

            {selectedPoint && ready && (
              <div className="teo-dash-soft rounded-xl px-3 py-2">
                <p className="teo-dash-muted text-[10px]">
                  {selectedPoint.range}
                </p>

                <p dir="ltr" className="mt-1 text-xs font-black">
                  {chartMode === 'sales'
                    ? amount(selectedPoint.value)
                    : fmt(selectedPoint.count)}
                </p>
              </div>
            )}
          </div>

          {ready ? (
            <div dir="ltr" className="mt-6 flex gap-2">
              <div className="teo-dash-muted flex h-48 shrink-0 flex-col justify-between pb-5 text-[9px] sm:h-60">
                {[1, 0.75, 0.5, 0.25, 0].map(value => (
                  <span key={value}>
                    {fmt(chartMax * value)}
                  </span>
                ))}
              </div>

              <div className="relative min-w-0 flex-1">
                <div className="pointer-events-none absolute inset-x-0 bottom-5 top-0 flex flex-col justify-between">
                  {[0, 1, 2, 3, 4].map(value => (
                    <div
                      key={value}
                      className="border-t border-dashed"
                      style={{ borderColor: 'var(--dash-border)' }}
                    />
                  ))}
                </div>

                <div className="relative flex h-48 items-end gap-1 sm:h-60">
                  {daily.map((day, index) => {
                    const value = chartMode === 'sales'
                      ? day.value
                      : day.count

                    const showLabel =
                      daily.length <= 7 ||
                      index % Math.ceil(daily.length / 6) === 0

                    return (
                      <div
                        key={day.key}
                        className="flex h-full min-w-0 flex-1 flex-col"
                      >
                        <div className="flex min-h-0 flex-1 items-end">
                          <button
                            type="button"
                            onClick={() => setSelectedBar(day.key)}
                            title={`${day.range}: ${
                              chartMode === 'sales'
                                ? amount(value)
                                : fmt(value)
                            }`}
                            aria-label={`${day.range}: ${value}`}
                            className={`w-full rounded-t-sm transition ${
                              selectedBar === day.key
                                ? 'bg-indigo-500'
                                : 'bg-blue-500 hover:bg-blue-400'
                            }`}
                            style={{
                              height: `${value > 0
                                ? Math.max(1, value / chartMax * 100)
                                : 0}%`,
                              minHeight: 3,
                              opacity: value > 0 ? 1 : 0.2,
                            }}
                          />
                        </div>

                        <span className="teo-dash-muted h-5 pt-2 text-center text-[8px]">
                          {showLabel ? day.label : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="teo-dash-muted flex h-48 items-center justify-center text-sm">
              {loading
                ? t('جارٍ تحميل البيانات...', 'Chargement...')
                : t('البيانات غير متاحة', 'Données indisponibles')}
            </div>
          )}

          <p className="teo-dash-muted mt-4 text-[11px] leading-5">
            {t(
              'اضغط على أحد الأعمدة لعرض قيمته. يعتمد الرسم على تاريخ إنشاء الطلب وحالته الحالية.',
              'Cliquez sur une barre pour afficher sa valeur. Calcul selon la date de création et le statut actuel.',
            )}
          </p>
        </section>

        <section className={panel}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />

            <h2 className="text-lg font-black">
              {t('مركز العمليات العاجلة', 'Centre des actions')}
            </h2>
          </div>

          <p className="teo-dash-muted mt-2 text-xs">
            {t(
              'العمليات التي تحتاج إلى تدخل الإدارة — جميع الفترات',
              'Actions nécessitant votre intervention — toutes périodes',
            )}
          </p>

          <div className="mt-5 space-y-3">
            {urgentItems.map(item => {
              const Icon = item.icon

              return (
                <Link
                  key={item.title}
                  to={item.to}
                  className="teo-dash-soft flex items-center gap-3 rounded-xl border p-3"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      color: item.color,
                      background: `${item.color}18`,
                    }}
                  >
                    <Icon size={19} />
                  </span>

                  <span className="min-w-0 flex-1 text-xs font-bold">
                    {item.title}
                  </span>

                  <span
                    className="text-xl font-black"
                    style={{ color: item.color }}
                  >
                    {showCount(item.count)}
                  </span>

                  <ArrowUpRight
                    size={15}
                    className="teo-dash-muted shrink-0"
                  />
                </Link>
              )
            })}
          </div>

          {ready &&
            reviewsReady &&
            urgentItems.every(item => item.count === 0) && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={18} />
                {t('لا توجد عمليات عاجلة', 'Aucune action urgente')}
              </div>
            )}

          <Link
            to="/admin/support"
            className="teo-dash-link mt-4 flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold"
            style={{ borderColor: 'var(--dash-border)' }}
          >
            <Headphones size={18} />
            {t('فتح مركز الدعم', 'Ouvrir le support')}
          </Link>
        </section>
      </div>

      {/* ORDER STATUS */}

      <section className={panel}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">
            {t('حالة الطلبات', 'État des commandes')}
          </h2>

          <Link
            to="/admin/orders"
            className="teo-dash-link text-xs font-bold"
          >
            {t('إدارة الطلبات', 'Gérer les commandes')}
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label: t('مراجعة الدفع', 'À vérifier'),
              value: pendingPayments,
              color: '#d97706',
              note: t('كل الفترات', 'Toutes périodes'),
            },
            {
              label: t('قيد التجهيز', 'À traiter'),
              value: pendingOrders,
              color: '#2563eb',
              note: t('كل الفترات', 'Toutes périodes'),
            },
            {
              label: t('تم الإرسال', 'Envoyées'),
              value: sentOrders,
              color: '#7c3aed',
              note: t('كل الفترات', 'Toutes périodes'),
            },
            {
              label: t('مكتملة', 'Terminées'),
              value: completed,
              color: '#059669',
              note: t('الفترة المختارة', 'Période choisie'),
            },
            {
              label: t('ملغاة', 'Annulées'),
              value: cancelled,
              color: '#e11d48',
              note: t('الفترة المختارة', 'Période choisie'),
            },
            {
              label: t('مسترجعة', 'Remboursées'),
              value: refunded,
              color: '#64748b',
              note: t('الفترة المختارة', 'Période choisie'),
            },
          ].map(item => (
            <Link
              key={item.label}
              to="/admin/orders"
              className="teo-dash-soft rounded-xl border p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: item.color }}
                />

                <span className="text-xs font-bold">
                  {item.label}
                </span>
              </div>

              <p
                className="mt-3 text-2xl font-black"
                style={{ color: item.color }}
              >
                {showOrders(item.value)}
              </p>

              <p className="teo-dash-muted mt-1 text-[10px]">
                {item.note}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CUSTOMER STATISTICS */}

      <section className={panel}>
        <div className="flex items-center gap-2">
          <Users size={21} className="teo-dash-link" />

          <h2 className="text-lg font-black">
            {t('العملاء والحسابات', 'Clients et comptes')}
          </h2>
        </div>

        <p className="teo-dash-muted mt-2 text-xs leading-5">
          {t(
            'إحصائيات حسابات Supabase Auth، وقد تشمل حسابات الإدارة. لا تشمل الزوار المجهولين.',
            'Comptes Supabase Auth, administrateurs éventuels inclus. Les visiteurs anonymes ne sont pas comptabilisés.',
          )}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Metric
            title={t('الحسابات المسجلة', 'Comptes inscrits')}
            value={showCount(customerStats?.total_inscrits)}
            icon={Users}
          />

          <Metric
            title={t('سبق لهم تسجيل الدخول', 'Déjà connectés')}
            value={showCount(customerStats?.clients_connectes)}
            icon={CheckCircle2}
            tone="green"
          />

          <Metric
            title={t('نشطون خلال 30 يومًا', 'Actifs sur 30 jours')}
            value={showCount(customerStats?.connectes_30_jours)}
            icon={Activity}
            tone="purple"
            note={t(
              'حسب آخر تسجيل دخول',
              'Selon la dernière connexion',
            )}
          />

          <Metric
            title={t('حسابات جديدة خلال 30 يومًا', 'Nouveaux sur 30 jours')}
            value={showCount(customerStats?.nouveaux_30_jours)}
            icon={TrendingUp}
            tone="green"
          />
        </div>
      </section>

      {/* CATALOG AND REVIEWS */}

      <div className="grid gap-5 xl:grid-cols-2">
        <section className={panel}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Boxes size={21} className="teo-dash-link" />

              <h2 className="text-lg font-black">
                {t('الكتالوج والخدمات', 'Catalogue et services')}
              </h2>
            </div>

            <Link
              to="/admin/services"
              className="teo-dash-link text-xs font-bold"
            >
              {t('إدارة', 'Gérer')}
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              {
                label: t('إجمالي الخدمات', 'Total services'),
                value: data.services?.length,
                icon: Boxes,
                to: '/admin/services',
              },
              {
                label: t('خدمات متاحة', 'Services disponibles'),
                value: availableServices,
                icon: CheckCircle2,
                to: '/admin/services',
              },
              {
                label: t('نشطة وغير متاحة', 'Actifs indisponibles'),
                value: unavailableServices,
                icon: AlertTriangle,
                to: '/admin/services',
              },
              {
                label: t('المجموعات', 'Groupes'),
                value: data.groups?.length,
                icon: Layers,
                to: '/admin/services',
              },
              {
                label: t('الباقات', 'Plans'),
                value: data.plans?.length,
                icon: ShoppingBag,
                to: '/admin/plans',
              },
              {
                label: t('دول eSIM', 'Pays eSIM'),
                value: data.esimCountries?.length,
                icon: Globe,
                to: '/admin/esim',
              },
              {
                label: t('باقات eSIM', 'Forfaits eSIM'),
                value: data.esimPlans?.length,
                icon: Smartphone,
                to: '/admin/esim',
              },
            ].map(item => {
              const Icon = item.icon

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="teo-dash-soft rounded-xl border p-4"
                >
                  <Icon size={19} className="teo-dash-link" />

                  <p className="teo-dash-muted mt-3 text-xs">
                    {item.label}
                  </p>

                  <p className="mt-2 text-2xl font-black">
                    {showCount(item.value)}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>

        <section className={panel}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Star size={21} className="text-amber-500" />

              <h2 className="text-lg font-black">
                {t('سمعة المتجر والتقييمات', 'Réputation et avis')}
              </h2>
            </div>

            <Link
              to="/admin/store-reviews"
              className="teo-dash-link text-xs font-bold"
            >
              {t('إدارة', 'Gérer')}
            </Link>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-center">
            <p className="text-xs font-bold text-amber-600">
              {t('متوسط التقييمات المنشورة', 'Note moyenne visible')}
            </p>

            <p dir="ltr" className="mt-3 text-4xl font-black">
              {reviewsReady && visibleRatings.length
                ? fmt(averageRating, 1)
                : '—'}

              <span className="text-base text-amber-600"> / 5</span>
            </p>

            <div dir="ltr" className="mt-3 flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map(value => (
                <Star
                  key={value}
                  size={23}
                  color="#f59e0b"
                  fill={
                    reviewsReady &&
                    value <= Math.round(averageRating)
                      ? '#f59e0b'
                      : 'none'
                  }
                />
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              {
                label: t('الإجمالي', 'Total'),
                value: reviews.length,
              },
              {
                label: t('منشورة', 'Visibles'),
                value: reviews.filter(review => review.is_visible).length,
              },
              {
                label: t('جديدة', 'Nouveaux'),
                value: unreadReviews,
              },
            ].map(item => (
              <div
                key={item.label}
                className="teo-dash-soft rounded-xl p-3 text-center"
              >
                <p className="teo-dash-muted text-xs">
                  {item.label}
                </p>

                <p className="mt-2 text-xl font-black">
                  {reviewsReady ? fmt(item.value) : '—'}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* RECENT ORDERS AND BEST SERVICES */}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className={panel}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="teo-dash-link flex items-center gap-2 text-xs font-bold">
                <Clock size={16} />
                {t('النشاط الأخير', 'Activité récente')}
              </div>

              <h2 className="mt-2 text-lg font-black">
                {t('أحدث الطلبات', 'Dernières commandes')}
              </h2>
            </div>

            <Link
              to="/admin/orders"
              className="teo-dash-link text-xs font-bold"
            >
              {t('عرض الكل', 'Tout voir')}
            </Link>
          </div>

          <div className="mt-5 space-y-2">
            {!ready ? (
              <p className="teo-dash-muted py-10 text-center text-sm">
                {loading
                  ? t('جارٍ التحميل...', 'Chargement...')
                  : t('البيانات غير متاحة', 'Données indisponibles')}
              </p>
            ) : data.orders.length ? (
              data.orders.slice(0, 8).map(order => {
                const color = TONES[statusTone(order.status)]

                return (
                  <Link
                    key={order.id}
                    to="/admin/orders"
                    className="teo-dash-soft flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                        <ShoppingBag size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {order.service_name || '—'}
                        </p>

                        <p className="teo-dash-muted mt-1 truncate text-[11px]">
                          {order.order_number} · {order.customer_name}
                        </p>

                        <p className="teo-dash-muted mt-1 text-[10px]">
                          {dateLabel(order.created_at, ar)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-2 sm:flex-col sm:items-end">
                      <span
                        className="rounded-lg px-2 py-1 text-[10px] font-bold"
                        style={{
                          background: `${color}18`,
                          color,
                        }}
                      >
                        {STATUS_LABELS[order.status]?.[ar ? 0 : 1] ??
                          order.status}
                      </span>

                      <span dir="ltr" className="text-sm font-black">
                        {fmt(Number(order.total_amount) || 0, 2)}{' '}
                        {order.currency || '—'}
                      </span>
                    </div>
                  </Link>
                )
              })
            ) : (
              <p className="teo-dash-muted py-10 text-center text-sm">
                {t('لا توجد طلبات', 'Aucune commande')}
              </p>
            )}
          </div>
        </section>

        <section className={panel}>
          <div className="flex items-center gap-2">
            <TrendingUp size={21} className="text-emerald-500" />

            <h2 className="text-lg font-black">
              {t('أفضل الخدمات أداءً', 'Meilleurs services')}
            </h2>
          </div>

          <p className="teo-dash-muted mt-2 text-xs">
            {t(
              'حسب قيمة الطلبات المؤكدة في الفترة المختارة',
              'Par valeur confirmée sur la période sélectionnée',
            )}
          </p>

          <div className="mt-6 space-y-5">
            {ranking.length ? ranking.map((item, index) => (
              <div key={item.name}>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-black text-blue-500">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">
                      {item.name}
                    </p>

                    <p className="teo-dash-muted mt-1 text-[11px]">
                      {fmt(item.count)}{' '}
                      {t('طلب مؤكد', 'commande(s) confirmée(s)')}
                    </p>
                  </div>

                  <span dir="ltr" className="shrink-0 text-xs font-black">
                    {amount(item.value)}
                  </span>
                </div>

                <div className="teo-dash-soft mt-3 h-2 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${Math.max(0, item.value / rankingMax * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )) : (
              <p className="teo-dash-muted py-10 text-center text-xs">
                {ready
                  ? t('لا توجد بيانات مؤكدة لهذه الفترة', 'Aucune donnée confirmée pour cette période')
                  : t('البيانات غير متاحة', 'Données indisponibles')}
              </p>
            )}
          </div>

          <Link
            to="/admin/services"
            className="teo-dash-link mt-6 flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold"
            style={{ borderColor: 'var(--dash-border)' }}
          >
            <Boxes size={17} />
            {t('إدارة الخدمات', 'Gérer les services')}
          </Link>
        </section>
      </div>

      {/* QUICK ACTIONS */}

      <section className={panel}>
        <h2 className="text-lg font-black">
          {t('الوصول السريع', 'Accès rapide')}
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {quickLinks.map(item => {
            const Icon = item.icon

            return (
              <Link
                key={item.to}
                to={item.to}
                className="teo-dash-soft flex min-h-24 flex-col items-center justify-center gap-3 rounded-xl border p-3 text-center transition hover:-translate-y-0.5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Icon size={21} />
                </span>

                <span className="text-xs font-bold">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* FINANCIAL INFORMATION */}

      <section className={panel}>
        <div className="flex items-start gap-3">
          <Wallet size={22} className="teo-dash-link shrink-0" />

          <div>
            <h2 className="text-sm font-black">
              {t('معلومات حول الحسابات المالية', 'Informations financières')}
            </h2>

            <p className="teo-dash-muted mt-2 text-xs leading-6">
              {t(
                'قيمة الطلبات المؤكدة تعتمد على المبلغ المسجل وحالة الطلب الحالية، ولا تمثل بالضرورة الأموال المستلمة فعليًا أو صافي الأرباح. يتم استبعاد الطلبات الملغاة والمسترجعة. ستحتاج حسابات التكاليف والمصاريف والأرباح إلى بيانات مالية مخصصة.',
                'La valeur confirmée dépend du montant enregistré et du statut actuel des commandes. Elle ne représente pas nécessairement les encaissements réels ni le bénéfice net. Les commandes annulées et remboursées sont exclues. Les coûts, dépenses et bénéfices nécessitent des données financières dédiées.',
              )}
            </p>
          </div>
        </div>
      </section>

      <footer className="teo-dash-muted py-3 text-center text-[10px]">
        TEO STORE · ADMIN DASHBOARD V5
      </footer>
    </div>
  )
}

export default AdminDashboardPage