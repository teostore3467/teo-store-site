import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

type Period = 1 | 7 | 30 | 90
type Order = { id: string; order_number: string; customer_name: string; service_name: string; total_amount: number; currency: string; status: string; created_at: string; updated_at: string }
type Review = { rating: number | string; is_visible: boolean; reviewed_at: string | null }
type Service = { id: string; availability: string; active: boolean }
type Group = { id: string }
type Plan = { id: string }
type EsimCountry = { id: string }
type EsimPlan = { id: string }
type Dataset = { orders: Order[]; storeReviews: Review[]; productReviews: Review[]; services: Service[]; groups: Group[]; plans: Plan[]; esimCountries: EsimCountry[]; esimPlans: EsimPlan[] }
const EMPTY: Dataset = { orders: [], storeReviews: [], productReviews: [], services: [], groups: [], plans: [], esimCountries: [], esimPlans: [] }
const moneyStatuses = new Set(['payment_confirmed', 'processing', 'fulfillment_sent', 'disputed', 'completed'])
const fmt = (value: number, decimals = 0) => new Intl.NumberFormat('fr-FR-u-nu-latn', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(Number.isFinite(value) ? value : 0)
const amount = (value: number) => `${fmt(value)} MRU`
const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const dateShift = (date: Date, days: number) => { const next = new Date(date); next.setDate(next.getDate() + days); return next }
const between = (date: string, start: Date, end: Date) => { const ms = new Date(date).getTime(); return ms >= start.getTime() && ms < end.getTime() }
const statusLabels: Record<string, string> = { payment_review: 'Paiement à vérifier', payment_partial: 'Paiement incomplet', payment_confirmed: 'Paiement confirmé', processing: 'En traitement', fulfillment_sent: 'Service envoyé', disputed: 'Litige', completed: 'Terminée', cancelled: 'Annulée', refunded: 'Remboursée' }
const statusColor = (status: string) => status === 'completed' ? 'bg-emerald-50 text-emerald-700' : status === 'disputed' || status === 'cancelled' || status === 'refunded' ? 'bg-rose-50 text-rose-700' : status === 'payment_review' || status === 'payment_partial' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
const dateLabel = (date: string) => { const value = new Date(date); return Number.isNaN(value.getTime()) ? '—' : new Intl.DateTimeFormat('fr-FR-u-nu-latn', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(value) }
const panel = 'rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6'

// Supabase paginates table reads. This helper avoids the default 1,000-row truncation.
async function readAll<T>(table: string, columns: string, orderBy?: string): Promise<T[]> {
  const output: T[] = []
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase.from(table).select(columns).range(offset, offset + pageSize - 1)
    if (orderBy) query = query.order(orderBy, { ascending: false })
    const { data, error } = await query
    if (error) throw new Error(`${table}: ${error.message}`)
    const rows = (data ?? []) as T[]
    output.push(...rows)
    if (rows.length < pageSize) return output
  }
}

function Metric({ title, value, note, to, tone = 'blue' }: { title: string; value: string; note?: string; to?: string; tone?: 'blue' | 'amber' | 'rose' | 'emerald' }) {
  const inner = <><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${tone === 'amber' ? 'bg-amber-500' : tone === 'rose' ? 'bg-rose-500' : tone === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}`} /><span className="text-xs font-bold text-slate-500">{title}</span></div><p dir="ltr" className="mt-4 break-words text-left text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{value}</p>{note && <p className="mt-2 text-xs leading-5 text-slate-400">{note}</p>}</>
  return to ? <Link to={to} className={`${panel} block transition hover:border-blue-300 hover:shadow-md`}>{inner}</Link> : <div className={panel}>{inner}</div>
}

function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>(30)
  const [data, setData] = useState<Dataset>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true)
    setError(null); setWarning(null)
    const issues: string[] = []
    try {
      // Orders are essential: don't silently replace them with zero on failure.
      const orders = await readAll<Order>('digital_orders', 'id,order_number,customer_name,service_name,total_amount,currency,status,created_at,updated_at', 'created_at')
      const readOptional = async <T,>(table: string, columns: string): Promise<T[] | null> => {
        try { return await readAll<T>(table, columns) }
        catch (e) { issues.push(e instanceof Error ? e.message : `${table}: erreur inconnue`); return null }
      }
      const [storeReviews, productReviews, services, groups, plans, esimCountries, esimPlans] = await Promise.all([
        readOptional<Review>('store_reviews', 'rating,is_visible,reviewed_at'),
        readOptional<Review>('digital_order_reviews', 'rating,is_visible,reviewed_at'),
        readOptional<Service>('digital_services', 'id,availability,active'),
        readOptional<Group>('digital_service_groups', 'id'),
        readOptional<Plan>('digital_service_plans', 'id'),
        readOptional<EsimCountry>('esim_countries', 'id'),
        readOptional<EsimPlan>('esim_plans', 'id'),
      ])
      setData({ orders, storeReviews: storeReviews ?? [], productReviews: productReviews ?? [], services: services ?? [], groups: groups ?? [], plans: plans ?? [], esimCountries: esimCountries ?? [], esimPlans: esimPlans ?? [] })
      setWarning(issues.length ? `Certaines statistiques sont indisponibles : ${issues.join(' · ')}` : null)
      setLastUpdated(new Date().toISOString()); setNow(new Date())
    } catch (e) { setError(e instanceof Error ? e.message : 'Chargement impossible') }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    void load()
    const channel = supabase.channel('teo-admin-dashboard-v2').on('postgres_changes', { event: '*', schema: 'public', table: 'digital_orders' }, () => { void load(true) }).on('postgres_changes', { event: '*', schema: 'public', table: 'digital_services' }, () => { void load(true) }).subscribe()
    const focus = () => { void load(true) }
    window.addEventListener('focus', focus)
    return () => { void supabase.removeChannel(channel); window.removeEventListener('focus', focus) }
  }, [load])

  const start = useMemo(() => dateShift(dayStart(now), 1 - period), [now, period])
  const end = useMemo(() => dateShift(dayStart(now), 1), [now])
  const previousStart = useMemo(() => dateShift(start, -period), [start, period])
  const current = useMemo(() => data.orders.filter(o => between(o.created_at, start, end)), [data.orders, start, end])
  const previous = useMemo(() => data.orders.filter(o => between(o.created_at, previousStart, start)), [data.orders, previousStart, start])
  const confirmedValue = (orders: Order[]) => orders.filter(o => moneyStatuses.has(o.status) && o.currency === 'MRU').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
  const currentValue = confirmedValue(current)
  const previousValue = confirmedValue(previous)
  const growth = (a: number, b: number) => b === 0 ? (a === 0 ? '0,0 %' : 'Nouveau') : `${a >= b ? '+' : ''}${fmt(((a - b) / b) * 100, 1)} %`
  const countStatus = (statuses: string[]) => data.orders.filter(o => statuses.includes(o.status)).length
  const pendingPayments = countStatus(['payment_review', 'payment_partial'])
  const pendingOrders = countStatus(['payment_confirmed', 'processing'])
  const disputes = countStatus(['disputed'])
  const reviews = [...data.storeReviews, ...data.productReviews]
  const visibleRatings = reviews.filter(r => r.is_visible).map(r => Number(r.rating)).filter(n => Number.isFinite(n) && n >= 1 && n <= 5)
  const avgRating = visibleRatings.length ? visibleRatings.reduce((a, b) => a + b, 0) / visibleRatings.length : 0
  const completed = current.filter(o => o.status === 'completed').length
  const daily = useMemo(() => Array.from({ length: period }, (_, i) => {
    const d = dateShift(start, i)
    const next = dateShift(d, 1)
    const orders = current.filter(o => between(o.created_at, d, next))
    return { key: d.toISOString(), label: new Intl.DateTimeFormat('fr-FR-u-nu-latn', { day: '2-digit', month: '2-digit' }).format(d), value: confirmedValue(orders), count: orders.length }
  }), [start, period, current])
  const maxDaily = Math.max(1, ...daily.map(d => d.value))
  const ranking = useMemo(() => {
    const map = new Map<string, { name: string; count: number; value: number }>()
    for (const o of current) {
      const key = o.service_name || 'Service sans nom'
      const entry = map.get(key) ?? { name: key, count: 0, value: 0 }
      entry.count += 1
      if (moneyStatuses.has(o.status) && o.currency === 'MRU') entry.value += Number(o.total_amount) || 0
      map.set(key, entry)
    }
    return [...map.values()].sort((a, b) => b.value - a.value || b.count - a.count).slice(0, 5)
  }, [current])
  const otherCurrencies = current.some(o => o.currency !== 'MRU')

  return <div dir="ltr" className="min-w-0 space-y-5 overflow-x-hidden pb-12 text-slate-900 sm:space-y-6">
    <header className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-5 text-white shadow-xl sm:p-8">
      <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-widest text-blue-100"><span className="h-2 w-2 rounded-full bg-emerald-400" /> TEO STORE · ADMIN</span><h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Dashboard</h1><p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/75">Vue d’ensemble des commandes, paiements, services et avis clients.</p></div>
        <div className="flex flex-col gap-3 sm:flex-row lg:items-end"><div className="grid grid-cols-4 gap-1 rounded-2xl bg-white/10 p-1">{([1, 7, 30, 90] as Period[]).map(p => <button key={p} type="button" onClick={() => setPeriod(p)} aria-pressed={period === p} className={`rounded-xl px-3 py-3 text-xs font-bold transition ${period === p ? 'bg-white text-slate-950' : 'text-white/80 hover:bg-white/10'}`}>{p === 1 ? 'Jour' : `${p} j`}</button>)}</div><button type="button" onClick={() => void load(true)} disabled={loading || refreshing} className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold transition hover:bg-white/20 disabled:opacity-50">{loading || refreshing ? 'Actualisation…' : '↻ Actualiser'}</button></div>
      </div><p className="relative mt-5 text-xs text-blue-100/65">{lastUpdated ? `Mis à jour : ${dateLabel(lastUpdated)}` : 'Chargement des données…'} · Période : {new Intl.DateTimeFormat('fr-FR-u-nu-latn', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(start)} – {new Intl.DateTimeFormat('fr-FR-u-nu-latn', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateShift(end, -1))}</p>
    </header>
    {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">Échec de chargement : {error}. Les dernières données disponibles restent affichées.</div>}
    {warning && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">{warning}. Les indicateurs correspondants peuvent être incomplets.</div>}
    {otherCurrencies && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">Les montants affichés en MRU excluent les commandes libellées dans d’autres devises.</div>}
    <section aria-label="Indicateurs" className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Metric title="Commandes" value={fmt(current.length)} note={`Évolution : ${growth(current.length, previous.length)}`} to="/admin/orders"/><Metric title="Valeur confirmée" value={amount(currentValue)} note={`Évolution : ${growth(currentValue, previousValue)}`}/><Metric title="Panier moyen" value={amount(current.length ? currentValue / current.length : 0)} note="Valeur confirmée / toutes commandes"/><Metric title="Actions urgentes" value={fmt(pendingPayments + disputes)} note="Paiements + litiges · tous les jours" tone="rose" to="/admin/orders"/></section>
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric title="Paiements à vérifier" value={fmt(pendingPayments)} to="/admin/payments" tone="amber"/><Metric title="À traiter" value={fmt(pendingOrders)} to="/admin/orders"/><Metric title="Litiges" value={fmt(disputes)} to="/admin/orders" tone="rose"/><Metric title="Finalisation" value={`${fmt(current.length ? (completed / current.length) * 100 : 0, 1)} %`} note="Commandes terminées / créées sur la période" tone="emerald"/></section>
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <section className={panel}><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Performance</p><h2 className="mt-1 text-lg font-black">Valeur des commandes confirmées</h2></div><span className="text-xs text-slate-400">MRU · par jour</span></div><div className="mt-7 flex h-48 items-end gap-1 overflow-x-auto border-b border-slate-100 pb-2 sm:h-56">{daily.map((d, i) => <div key={d.key} title={`${d.label} : ${amount(d.value)} · ${d.count} commandes`} className="group flex h-full min-w-[5px] flex-1 flex-col justify-end" aria-label={`${d.label}: ${amount(d.value)}`}><div className="w-full rounded-t bg-blue-500 transition hover:bg-indigo-600" style={{ height: `${d.value ? Math.max(3, (d.value / maxDaily) * 100) : 2}%` }} />{(period <= 7 || (period === 30 && i % 5 === 0) || (period === 90 && i % 15 === 0)) && <span className="mt-2 whitespace-nowrap text-center text-[9px] text-slate-400">{d.label}</span>}</div>)}</div><p className="mt-3 text-xs text-slate-400">Survolez les barres pour voir les montants. Les commandes annulées ou remboursées sont exclues.</p></section>
      <section className={panel}><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Catalogue</p><h2 className="mt-1 text-lg font-black">Services et offres</h2></div><Link to="/admin/services" className="text-xs font-bold text-blue-600">Gérer</Link></div><div className="mt-5 grid grid-cols-2 gap-3">{[{ name: 'Services', value: data.services.length, to: '/admin/services' }, { name: 'Disponibles et actifs', value: data.services.filter(s => s.active && s.availability === 'available').length, to: '/admin/services' }, { name: 'Groupes', value: data.groups.length, to: '/admin/services' }, { name: 'Plans', value: data.plans.length, to: '/admin/plans' }, { name: 'Pays eSIM', value: data.esimCountries.length, to: '/admin/esim' }, { name: 'Plans eSIM', value: data.esimPlans.length, to: '/admin/esim' }].map(item => <Link to={item.to} key={item.name} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200"><p className="text-xs text-slate-500">{item.name}</p><p className="mt-2 text-2xl font-black">{fmt(item.value)}</p></Link>)}</div></section>
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <section className={panel}><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Activité récente</p><h2 className="mt-1 text-lg font-black">Dernières commandes</h2></div><Link to="/admin/orders" className="text-xs font-bold text-blue-600">Tout voir</Link></div><div className="mt-5 space-y-2">{loading ? <p className="py-8 text-center text-sm text-slate-400">Chargement…</p> : data.orders.length ? data.orders.slice(0, 8).map(o => <Link key={o.id} to="/admin/orders" className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-3 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:p-4"><div className="min-w-0"><p className="truncate text-sm font-bold">{o.service_name}</p><p className="mt-1 truncate text-xs text-slate-400">{o.order_number} · {o.customer_name}</p><p className="mt-1 text-[11px] text-slate-400">{dateLabel(o.created_at)}</p></div><div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColor(o.status)}`}>{statusLabels[o.status] ?? o.status}</span><span className="text-sm font-black">{fmt(Number(o.total_amount) || 0)} {o.currency || 'MRU'}</span></div></Link>) : <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-400">Aucune commande</p>}</div></section>
      <div className="space-y-5"><section className={panel}><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-amber-600">Avis clients</p><h2 className="mt-1 text-lg font-black">Réputation</h2></div><Link to="/admin/store-reviews" className="text-xs font-bold text-blue-600">Gérer</Link></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-amber-50 p-4"><p className="text-xs text-amber-700">Note visible moyenne</p><p className="mt-2 text-2xl font-black">{fmt(avgRating, 1)} ★</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Total avis</p><p className="mt-2 text-2xl font-black">{fmt(reviews.length)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Visibles</p><p className="mt-2 text-2xl font-black">{fmt(reviews.filter(r => r.is_visible).length)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">À consulter</p><p className="mt-2 text-2xl font-black">{fmt(reviews.filter(r => !r.reviewed_at).length)}</p></div></div></section>
      <section className={panel}><h2 className="text-lg font-black">Services les plus performants</h2><p className="mt-1 text-xs text-slate-400">Par valeur confirmée sur la période</p><div className="mt-4 space-y-3">{ranking.length ? ranking.map((r, i) => <div key={r.name} className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">{i + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{r.name}</p><p className="text-[11px] text-slate-400">{fmt(r.count)} commande(s)</p></div><span className="shrink-0 text-xs font-black">{amount(r.value)}</span></div>) : <p className="py-6 text-center text-xs text-slate-400">Aucune donnée pour cette période</p>}</div></section></div>
    </div>
    <section className={panel}><h2 className="text-lg font-black">Accès rapide</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{[{ label: 'Commandes', to: '/admin/orders' }, { label: 'Paiements', to: '/admin/payments' }, { label: 'Services numériques', to: '/admin/services' }, { label: 'Avis clients', to: '/admin/store-reviews' }, { label: 'Paramètres', to: '/admin/settings' }].map(item => <Link key={item.to} to={item.to} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs font-bold transition hover:border-blue-300 hover:bg-blue-50">{item.label}</Link>)}</div></section>
    <p className="px-1 text-xs leading-6 text-slate-400">Les valeurs confirmées correspondent aux montants des commandes dont le statut indique un paiement confirmé ou un traitement en cours. Elles ne représentent ni les encaissements vérifiés, ni le bénéfice net. Les indicateurs d’actions urgentes portent sur toutes les commandes.</p>
  </div>
}
export default AdminDashboardPage
