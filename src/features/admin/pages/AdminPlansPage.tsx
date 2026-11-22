import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

type Availability = 'available' | 'out_of_stock' | 'coming_soon'
type Plan = {
  id: string; plan_key: string; label: string; price: number; currency: string
  availability: Availability; popular: boolean; active: boolean; sort_order: number; group_id: string
  digital_service_groups: {
    id: string; name: string; short_name: string; service_id: string
    digital_services: { id: string; slug: string; name: string; category: string; deleted_at: string | null } | null
  } | null
}
type Notice = { kind: 'success' | 'error'; text: string }
const availabilityLabels: Record<Availability, string> = {
  available: 'Disponible', out_of_stock: 'Rupture', coming_soon: 'Bientôt',
}
const amount = (value: number) => `${new Intl.NumberFormat('fr-FR-u-nu-latn', { maximumFractionDigits: 2 }).format(value)} MRU`

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [original, setOriginal] = useState<Record<string, Plan>>({})
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | Availability>('all')
  const [visibility, setVisibility] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('digital_service_plans').select(`
      id, plan_key, label, price, currency, availability, popular, active, sort_order, group_id,
      digital_service_groups (
        id, name, short_name, service_id,
        digital_services (id, slug, name, category, deleted_at)
      )
    `).order('sort_order', { ascending: true })
    setLoading(false)
    if (error) { setNotice({ kind: 'error', text: error.message }); return }
    const rows = ((data ?? []) as unknown as Plan[]).filter(p => p.digital_service_groups?.digital_services?.deleted_at == null && p.digital_service_groups?.digital_services != null)
    setPlans(rows)
    setOriginal(Object.fromEntries(rows.map(p => [p.id, { ...p }])))
  }, [])

  useEffect(() => { void load() }, [load])
  const update = (id: string, patch: Partial<Plan>) => setPlans(current => current.map(p => p.id === id ? { ...p, ...patch } : p))
  const changed = (p: Plan) => {
    const before = original[p.id]
    return !!before && ['label', 'price', 'availability', 'popular', 'active', 'sort_order'].some(key => p[key as keyof Plan] !== before[key as keyof Plan])
  }
  const save = async (p: Plan) => {
    if (!p.label.trim() || !Number.isFinite(Number(p.price)) || Number(p.price) <= 0 || !Number.isInteger(Number(p.sort_order))) {
      setNotice({ kind: 'error', text: 'Vérifiez le nom, le prix (supérieur à 0) et l’ordre.' }); return
    }
    setSavingId(p.id)
    const { error } = await supabase.from('digital_service_plans').update({
      label: p.label.trim(), price: Number(p.price), currency: 'MRU', availability: p.availability,
      popular: p.popular, active: p.active, sort_order: Number(p.sort_order),
    }).eq('id', p.id)
    setSavingId(null)
    if (error) { setNotice({ kind: 'error', text: error.message }); return }
    setNotice({ kind: 'success', text: `Modifications enregistrées : ${p.label}` })
    await load()
  }
  const filtered = useMemo(() => plans.filter(p => {
    const group = p.digital_service_groups
    const service = group?.digital_services
    const text = [p.label, p.plan_key, group?.name, service?.name, service?.slug].join(' ').toLowerCase()
    return text.includes(query.trim().toLowerCase()) && (status === 'all' || p.availability === status) && (visibility === 'all' || (visibility === 'active' ? p.active : !p.active))
  }), [plans, query, status, visibility])
  const stats = useMemo(() => ({ total: plans.length, active: plans.filter(p => p.active).length, available: plans.filter(p => p.active && p.availability === 'available').length, popular: plans.filter(p => p.popular).length }), [plans])
  const field = 'mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  return <div className="space-y-5 pb-10">
    <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Catalogue · Administration</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Plans et prix</h1>
          <p className="mt-2 text-sm text-slate-500">Gérez les tarifs et la disponibilité, sans encombrer la liste.</p></div>
        <button type="button" onClick={() => void load()} disabled={loading} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">↻ Actualiser</button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {([['Total des plans', stats.total], ['Actifs', stats.active], ['Disponibles', stats.available], ['Populaires', stats.popular]] as const).map(([label, value]) =>
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p></div>)}
      </div>
    </header>

    {notice && <div role="status" className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${notice.kind === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}><span>{notice.text}</span><button type="button" onClick={() => setNotice(null)} aria-label="Fermer">×</button></div>}

    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_170px_auto]">
        <input aria-label="Rechercher" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher service, groupe ou plan..." className={field + ' mt-0'} />
        <select aria-label="Disponibilité" value={status} onChange={e => setStatus(e.target.value as typeof status)} className={field + ' mt-0'}><option value="all">Tous les statuts</option><option value="available">Disponible</option><option value="out_of_stock">Rupture</option><option value="coming_soon">Bientôt</option></select>
        <select aria-label="Activation" value={visibility} onChange={e => setVisibility(e.target.value as typeof visibility)} className={field + ' mt-0'}><option value="all">Tous les plans</option><option value="active">Actifs</option><option value="inactive">Désactivés</option></select>
        <button type="button" onClick={() => { setQuery(''); setStatus('all'); setVisibility('all') }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Effacer</button>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{filtered.length} plan(s) affiché(s) · Les services dans la corbeille sont exclus.</p>
    </section>

    <section className="space-y-2">
      {loading ? <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">Chargement des plans...</div> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Aucun plan trouvé.</div> : filtered.map(p => {
        const service = p.digital_service_groups?.digital_services
        const isExpanded = expandedId === p.id
        const dirty = changed(p)
        return <article key={p.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${dirty ? 'border-amber-300' : 'border-slate-200'}`}>
          <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-blue-600">{service?.name ?? 'Service'} · {p.digital_service_groups?.name ?? 'Groupe'}</p>
              <h2 className="mt-1 truncate text-sm font-black text-slate-950 sm:text-base">{p.label}</h2></div>
            <div className="text-right"><p className="text-base font-black text-slate-950" dir="ltr">{amount(Number(p.price))}</p><p className="mt-1 text-xs text-slate-500">{p.popular ? '★ Populaire · ' : ''}{availabilityLabels[p.availability]}</p></div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{p.active ? 'Actif' : 'Désactivé'}</span>
            {dirty && <span className="text-xs font-bold text-amber-700">Non enregistré</span>}
            <button type="button" onClick={() => setExpandedId(isExpanded ? null : p.id)} aria-expanded={isExpanded} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">{isExpanded ? 'Fermer' : 'Modifier'}</button>
          </div>
          {isExpanded && <div className="border-t border-slate-100 bg-slate-50/70 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-bold text-slate-600">Nom du plan<input className={field} value={p.label} onChange={e => update(p.id, { label: e.target.value })}/></label>
              <label className="text-xs font-bold text-slate-600">Prix (MRU)<input className={field} type="number" min="0.01" step="0.01" value={p.price} onChange={e => update(p.id, { price: Number(e.target.value) })}/></label>
              <label className="text-xs font-bold text-slate-600">Disponibilité<select className={field} value={p.availability} onChange={e => update(p.id, { availability: e.target.value as Availability })}><option value="available">Disponible</option><option value="out_of_stock">Rupture</option><option value="coming_soon">Bientôt</option></select></label>
              <label className="text-xs font-bold text-slate-600">Ordre d’affichage<input className={field} type="number" step="1" value={p.sort_order} onChange={e => update(p.id, { sort_order: Number(e.target.value) })}/></label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={p.active} onChange={e => update(p.id, { active: e.target.checked })}/>Plan actif</label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={p.popular} onChange={e => update(p.id, { popular: e.target.checked })}/>Mettre en avant</label>
              <span className="text-xs text-slate-400" dir="ltr">{p.plan_key}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              {service?.slug ? <Link to={`/admin/services/${service.slug}`} className="text-sm font-bold text-blue-600 hover:underline">Gérer le service →</Link> : <span/>}
              <div className="flex gap-2"><button type="button" onClick={() => { const before = original[p.id]; if (before) update(p.id, before) }} disabled={!dirty} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-40">Annuler</button>
                <button type="button" onClick={() => void save(p)} disabled={!dirty || savingId === p.id} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40">{savingId === p.id ? 'Enregistrement...' : 'Enregistrer'}</button></div>
            </div>
          </div>}
        </article>
      })}
    </section>
  </div>
}
