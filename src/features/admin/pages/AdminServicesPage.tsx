import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'
import { serviceCatalog } from '../../digital-commerce/data/serviceCatalog'

type Availability = 'available' | 'out_of_stock' | 'coming_soon'
type Service = {
  name_ar?: string | null
  name_fr?: string | null
  image_url?: string | null
  id: string
  slug: string
  name: string
  category: string
  availability: Availability
  description: string | null
  active: boolean
  sort_order: number
  deleted_at: string | null
  digital_service_groups?: { id: string; active: boolean; availability: Availability; digital_service_plans: { id: string; active: boolean; availability: Availability; price: number | string; currency: string }[] }[]
}
type Draft = { slug: string; name: string; name_ar: string; name_fr: string; category: string; availability: Availability; description: string }
const emptyDraft: Draft = { slug: '', name: '', name_ar: '', name_fr: '', category: '', availability: 'available', description: '' }
const statusText: Record<Availability, string> = { available: 'Disponible', out_of_stock: 'Rupture', coming_soon: 'Bientôt' }
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export default function AdminServicesPage() {
  const {language} = useLanguage()
  const ar = language === 'ar'
  const tr=(fr:string,a:string)=>ar?a:fr
  const [services, setServices] = useState<Service[]>([])
  const [, setLogos] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<'current' | 'trash'>('current')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)

  const load = useCallback(async () => {
    try {
      const [result, logoResult] = await Promise.all([
        supabase.from('digital_services')
          .select('id, slug, name, name_ar, name_fr, image_url, category, availability, description, active, sort_order, deleted_at, digital_service_groups(id, active, availability, digital_service_plans(id, active, availability, price, currency))')
          .order('sort_order', { ascending: true }).order('name', { ascending: true }),
        supabase.from('service_logos').select('service_slug, logo_path'),
      ])
      if (result.error) throw result.error
      setServices((result.data ?? []) as Service[])
      if (!logoResult.error) {
        const next: Record<string, string> = {}
        for (const row of logoResult.data ?? []) {
          next[String(row.service_slug)] = supabase.storage.from('service-logos').getPublicUrl(String(row.logo_path)).data.publicUrl
        }
        setLogos(next)
      }
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : 'Impossible de charger les services.' })
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    void load()
    const channel = supabase.channel('admin-services-corbeille')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'digital_services' }, () => { void load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'digital_service_groups' }, () => { void load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'digital_service_plans' }, () => { void load() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [load])

  const catalogStatus = (s: Service): { ok: boolean; text: string } => {
    const groups = s.digital_service_groups ?? []
    if (s.deleted_at) return {ok:false,text:tr('Dans la corbeille','في سلة المحذوفات')}
    if (!s.active) return {ok:false,text:tr('Service parent désactivé','الخدمة الأم معطلة')}
    if (s.availability !== 'available') return {ok:false,text:tr('Service parent indisponible','الخدمة الأم غير متوفرة')}
    if (!groups.length) return {ok:false,text:tr('Aucun produit associé','لا توجد منتجات تابعة')}
    const active = groups.filter(g=>g.active)
    if (!active.length) return {ok:false,text:tr('Tous les produits sont masqués','جميع المنتجات مخفية')}
    const available = active.filter(g=>g.availability==='available')
    if (!available.length) return {ok:false,text:tr('Aucun produit disponible','لا يوجد منتج متوفر')}
    const plans = available.flatMap(g=>g.digital_service_plans ?? [])
    if (!plans.length) return {ok:false,text:tr('Aucun forfait associé','لا توجد باقات')}
    if (!plans.some(p=>p.active)) return {ok:false,text:tr('Tous les forfaits sont désactivés','جميع الباقات معطلة')}
    if (!plans.some(p=>p.active && p.availability==='available' && p.currency==='MRU' && Number.isFinite(Number(p.price)) && Number(p.price)>0)) return {ok:false,text:tr('Aucun forfait disponible avec prix MRU valide','لا توجد باقة متوفرة بسعر صالح بالأوقية')}
    return {ok:true,text:tr('Catalogue : forfait disponible','الكتالوج: توجد باقة متوفرة')}
  }
  const current = useMemo(() => services.filter(s => !s.deleted_at), [services])
  const trash = useMemo(() => services.filter(s => Boolean(s.deleted_at)), [services])
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase()
    return (tab === 'current' ? current : trash).filter(s =>
      (tab === 'trash' || statusFilter === 'all' || (statusFilter === 'active' ? s.active : !s.active)) &&
      (!q || [s.name, s.slug, s.name_ar ?? '', s.name_fr ?? '', s.category, s.description ?? ''].some(v => v.toLocaleLowerCase().includes(q)))
    )
  }, [current, trash, tab, statusFilter, query])

  const changeService = async (service: Service, action: 'activate' | 'deactivate' | 'trash' | 'restore') => {
    if (busy) return
    if (action === 'trash' && !window.confirm(`Déplacer « ${service.name} » dans la corbeille ? Les forfaits et les prix seront conservés.`)) return
    setBusy(service.id)
    setMessage(null)
    const values: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (action === 'activate') values.active = true
    if (action === 'deactivate') values.active = false
    if (action === 'trash') { values.deleted_at = new Date().toISOString(); values.active = false }
    if (action === 'restore') { values.deleted_at = null; values.active = false }
    try {
      const { data, error } = await supabase.from('digital_services').update(values).eq('id', service.id).select('id')
      if (error) throw error
      if (!data?.length) throw new Error('Modification non confirmée. Vérifiez les droits administrateur Supabase.')
      await load()
      const label = { activate: 'activé', deactivate: 'désactivé', trash: 'placé dans la corbeille', restore: 'restauré (désactivé)' }[action]
      setMessage({ error: false, text: `${service.name} : ${label}.` })
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : 'Modification impossible.' })
    } finally { setBusy(null) }
  }

  const createService = async () => {
    if (busy) return
    const slug = (draft.slug.trim() || draft.name.trim()).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
    if (!slug || !draft.name.trim() || !draft.category.trim()) {
      setMessage({ error: true, text: 'Slug, nom et catégorie sont obligatoires.' }); return
    }
    setBusy('create')
    try {
      const { data, error } = await supabase.from('digital_services').insert({
        slug, name: draft.name.trim(), name_ar: draft.name_ar.trim() || null, name_fr: draft.name_fr.trim() || null, category: draft.category.trim(), availability: draft.availability,
        description: draft.description.trim() || null, active: false, sort_order: current.length,
      }).select('id')
      if (error) throw error
      if (!data?.length) throw new Error('Création non confirmée.')
      setCreateOpen(false); setDraft(emptyDraft)
      setTab('current'); setStatusFilter('all'); setQuery('')
      await load()
      setMessage({ error: false, text: 'Service créé (désactivé). Configurez-le avant de l’activer.' })
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : 'Création impossible.' })
    } finally { setBusy(null) }
  }

  const importCatalog = async () => {
    if (busy || services.length || !window.confirm('Importer le catalogue local dans une base vide ?')) return
    setBusy('import')
    try {
      const { error } = await supabase.rpc('import_digital_service_catalog', { p_catalog: serviceCatalog })
      if (error) throw error
      await load()
      setMessage({ error: false, text: 'Catalogue importé.' })
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : 'Import impossible.' })
    } finally { setBusy(null) }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">TEO STORE · ADMIN</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{tr('Services parents','الخدمات الأم')}</h1>
          <p className="mt-1 text-sm text-slate-500">{tr('Gérez les produits et forfaits de chaque service','أدر المنتجات والباقات التابعة لكل خدمة')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setLoading(true); void load() }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">Actualiser</button>
          <button type="button" onClick={() => setCreateOpen(true)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{tr('+ Nouveau service','+ خدمة أم جديدة')}</button>
        </div>
      </div>

      {message && <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${message.error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{message.text}</div>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Services actuels', current.length],
          ['Activés', current.filter(s => s.active).length],
          ['Désactivés', current.filter(s => !s.active).length],
          ['Corbeille', trash.length],
        ].map(([label, count]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{count}</p></div>)}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          <button type="button" onClick={() => setTab('current')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'current' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Services actuels ({current.length})</button>
          <button type="button" onClick={() => setTab('trash')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'trash' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>Corbeille ({trash.length})</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un service..." aria-label="Rechercher un service" className={`${inputClass} flex-1 sm:min-w-64`} />
          {tab === 'current' && <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')} aria-label="Filtrer par activation" className={`${inputClass} sm:w-48`}><option value="all">Tous les états</option><option value="active">Activés</option><option value="inactive">Désactivés</option></select>}
        </div>
      </div>

      {loading ? <div className="py-16 text-center text-sm text-slate-500">Chargement des services...</div> : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center text-sm text-slate-500">
          {tab === 'trash' ? 'La corbeille est vide.' : 'Aucun service correspondant.'}
          {tab === 'current' && services.length === 0 && <div className="mt-4"><button type="button" disabled={Boolean(busy)} onClick={() => void importCatalog()} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Importer le catalogue initial</button></div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map(service => <div key={service.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-base font-bold text-slate-500">
                {service.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-bold text-slate-900" title={service.name}>{service.name}</h2><p className="truncate text-xs text-slate-500">{service.category}</p></div>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${service.deleted_at ? 'bg-slate-400' : service.active ? 'bg-emerald-500' : 'bg-amber-400'}`} title={service.deleted_at ? 'Corbeille' : service.active ? 'Activé' : 'Désactivé'} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <span className="truncate text-xs text-slate-500">{service.deleted_at ? 'Dans la corbeille' : `${statusText[service.availability]} · ${service.active ? 'Activé' : 'Désactivé'}`}</span>
              <span className="shrink-0 text-xs text-slate-400">{(service.digital_service_groups??[]).reduce((n,g)=>n+g.digital_service_plans.length,0)} forfaits</span>
            </div>
            <p className={`mt-2 rounded-lg px-3 py-2 text-xs font-medium ${catalogStatus(service).ok ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'}`}>{catalogStatus(service).text}</p>
            {tab === 'current' ? <div className="mt-3 flex gap-2">
              <Link to={`/admin/services/${service.slug}`} className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white">{tr('Gérer','إدارة')}</Link>
              <button type="button" disabled={Boolean(busy)} onClick={() => void changeService(service, service.active ? 'deactivate' : 'activate')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-50">{service.active ? 'Désactiver' : 'Activer'}</button>
              <button type="button" disabled={Boolean(busy)} title="Déplacer dans la corbeille" aria-label={`Mettre ${service.name} dans la corbeille`} onClick={() => void changeService(service, 'trash')} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 disabled:opacity-50">Corbeille</button>
            </div> : <div className="mt-3"><button type="button" disabled={Boolean(busy)} onClick={() => void changeService(service, 'restore')} className="w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Restaurer le service</button></div>}
          </div>)}
        </div>
      )}

      {createOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true" aria-label="Nouveau service">
        <div className="max-h-[90vh] overflow-y-auto w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-xl">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">Nouveau service</h2><button type="button" onClick={() => setCreateOpen(false)} className="text-slate-500">Fermer</button></div>
          <label className="block text-sm text-slate-700">Nom<input className={`${inputClass} mt-1`} value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} /></label>
          <label className="block text-sm text-slate-700">الاسم بالعربية<input dir="rtl" className={`${inputClass} mt-1`} value={draft.name_ar} onChange={e=>setDraft(d=>({...d,name_ar:e.target.value}))}/></label>
          <label className="block text-sm text-slate-700">Nom français<input className={`${inputClass} mt-1`} value={draft.name_fr} onChange={e=>setDraft(d=>({...d,name_fr:e.target.value}))}/></label>
          <label className="block text-sm text-slate-700">Slug (identifiant URL)<input className={`${inputClass} mt-1`} value={draft.slug} onChange={e => setDraft(d => ({ ...d, slug: e.target.value }))} placeholder="exemple-service" /></label>
          <label className="block text-sm text-slate-700">Catégorie<input className={`${inputClass} mt-1`} value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} /></label>
          <label className="block text-sm text-slate-700">Disponibilité<select className={`${inputClass} mt-1`} value={draft.availability} onChange={e => setDraft(d => ({ ...d, availability: e.target.value as Availability }))}><option value="available">Disponible</option><option value="out_of_stock">Rupture</option><option value="coming_soon">Bientôt</option></select></label>
          <label className="block text-sm text-slate-700">Description<textarea rows={3} className={`${inputClass} mt-1`} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} /></label>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setCreateOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Annuler</button><button type="button" disabled={Boolean(busy)} onClick={() => void createService()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy === 'create' ? 'Création...' : 'Créer'}</button></div>
        </div>
      </div>}
    </div>
  )
}
