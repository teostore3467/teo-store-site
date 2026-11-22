import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { serviceCatalog } from '../../digital-commerce/data/serviceCatalog'

type Availability = 'available' | 'out_of_stock' | 'coming_soon'
type Filter = 'all' | Availability
type Service = {
  id: string; slug: string; name: string; category: string; availability: Availability
  description: string | null; active: boolean; sort_order: number
  created_at: string; updated_at: string; digital_service_groups?: { count: number }[]
}
type Logo = { path: string; url: string }
type Toast = { type: 'success' | 'error' | 'info'; title: string; message?: string }
type Draft = { slug: string; name: string; category: string; availability: Availability; description: string }
const BUCKET = 'service-logos'
const emptyDraft: Draft = { slug: '', name: '', category: '', availability: 'available', description: '' }
const labelStatus: Record<Availability, string> = { available: 'Disponible', out_of_stock: 'Rupture', coming_soon: 'Bientôt' }
const statusStyle: Record<Availability, string> = {
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  out_of_stock: 'bg-rose-50 text-rose-700 ring-rose-200',
  coming_soon: 'bg-amber-50 text-amber-700 ring-amber-200',
}
const inputClass = 'mt-1.5 h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [logos, setLogos] = useState<Record<string, Logo>>({})
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [isCreating, setIsCreating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null)
  const [removeLogoTarget, setRemoveLogoTarget] = useState<Service | null>(null)
  const [removingLogo, setRemovingLogo] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [logoPreview, setLogoPreview] = useState<{ name: string; url: string } | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const showToast = useCallback((next: Toast) => setToast(next), [])

  const loadData = useCallback(async (initial = false) => {
    if (initial) setIsLoading(true)
    else setIsRefreshing(true)
    setLoadError(null)
    try {
      const [serviceResult, logoResult] = await Promise.all([
        supabase.from('digital_services').select('id, slug, name, category, availability, description, active, sort_order, created_at, updated_at, digital_service_groups(count)').order('sort_order', { ascending: true }).order('name', { ascending: true }),
        supabase.from('service_logos').select('service_slug, logo_path'),
      ])
      if (serviceResult.error) throw serviceResult.error
      setServices((serviceResult.data ?? []) as Service[])
      if (logoResult.error) {
        console.warn('Service logos unavailable:', logoResult.error)
        showToast({ type: 'info', title: 'Logos indisponibles', message: logoResult.error.message })
      } else {
        const next: Record<string, Logo> = {}
        for (const row of logoResult.data ?? []) {
          const path = String(row.logo_path)
          next[String(row.service_slug)] = { path, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
        }
        setLogos(next)
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Impossible de charger le catalogue.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [showToast])

  useEffect(() => {
    void loadData(true)
    const channel = supabase.channel(`admin-services-${Date.now()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'digital_services' }, () => { void loadData() }).on('postgres_changes', { event: '*', schema: 'public', table: 'service_logos' }, () => { void loadData() }).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [loadData])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return services.filter(s => (filter === 'all' || s.availability === filter) && (!q || [s.name, s.slug, s.category, s.description ?? ''].some(v => v.toLowerCase().includes(q))))
  }, [services, query, filter])
  const stats = useMemo(() => ({
    total: services.length,
    available: services.filter(s => s.availability === 'available').length,
    out: services.filter(s => s.availability === 'out_of_stock').length,
    soon: services.filter(s => s.availability === 'coming_soon').length,
    active: services.filter(s => s.active).length,
  }), [services])

  const createService = async () => {
    if (isCreating) return
    const slug = draft.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
    if (!slug || !draft.name.trim() || !draft.category.trim()) {
      showToast({ type: 'error', title: 'Informations incomplètes', message: 'Slug, nom et catégorie sont obligatoires.' }); return
    }
    setIsCreating(true)
    try {
      const { data, error } = await supabase.from('digital_services').insert({ slug, name: draft.name.trim(), category: draft.category.trim(), availability: draft.availability, description: draft.description.trim() || null, active: true, sort_order: services.length }).select('id')
      if (error) throw error
      if (!data?.length) throw new Error('Création non confirmée. Vérifiez les autorisations Supabase.')
      setDraft(emptyDraft); setCreateOpen(false)
      await loadData()
      showToast({ type: 'success', title: 'Service créé', message: `${draft.name.trim()} est enregistré dans Supabase.` })
    } catch (error) { showToast({ type: 'error', title: 'Création impossible', message: error instanceof Error ? error.message : 'Erreur inconnue.' }) }
    finally { setIsCreating(false) }
  }

  const importCatalog = async () => {
    if (isImporting || services.length) return
    if (!window.confirm('Importer le catalogue local dans la base Supabase vide ?')) return
    setIsImporting(true)
    try {
      const { data, error } = await supabase.rpc('import_digital_service_catalog', { p_catalog: serviceCatalog })
      if (error) throw error
      await loadData()
      const result = data as { services?: number; groups?: number; plans?: number } | null
      showToast({ type: 'success', title: 'Catalogue importé', message: result ? `${result.services ?? 0} services, ${result.groups ?? 0} groupes, ${result.plans ?? 0} plans.` : 'Import terminé.' })
    } catch (error) { showToast({ type: 'error', title: 'Import impossible', message: error instanceof Error ? error.message : 'Erreur inconnue.' }) }
    finally { setIsImporting(false) }
  }

  const toggleService = async (service: Service) => {
    if (togglingId) return
    setTogglingId(service.id)
    try {
      const { data, error } = await supabase.from('digital_services').update({ active: !service.active, updated_at: new Date().toISOString() }).eq('id', service.id).select('id')
      if (error) throw error
      if (!data?.length) throw new Error('Modification non confirmée. Vérifiez les autorisations Supabase.')
      await loadData()
      showToast({ type: 'success', title: service.active ? 'Service désactivé' : 'Service activé', message: service.name })
    } catch (error) { showToast({ type: 'error', title: 'Modification impossible', message: error instanceof Error ? error.message : 'Erreur inconnue.' }) }
    finally { setTogglingId(null) }
  }

  const uploadLogo = async (service: Service, file?: File) => {
    if (!file || uploadingSlug) return
    const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
    if (!extensions[file.type]) { showToast({ type: 'error', title: 'Format refusé', message: 'Utilisez JPG, PNG ou WEBP (SVG non accepté).' }); return }
    if (file.size > 3 * 1024 * 1024) { showToast({ type: 'error', title: 'Fichier trop volumineux', message: 'Maximum 3 MB.' }); return }
    setUploadingSlug(service.slug)
    const previous = logos[service.slug]
    const path = `${service.slug}/logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensions[file.type]}`
    let uploaded = false
    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, cacheControl: '3600', contentType: file.type })
      if (uploadError) throw uploadError
      uploaded = true
      const { error: dbError } = await supabase.from('service_logos').upsert({ service_slug: service.slug, logo_path: path, updated_at: new Date().toISOString() }, { onConflict: 'service_slug' })
      if (dbError) throw dbError
      uploaded = false
      if (previous?.path && previous.path !== path) {
        const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([previous.path])
        if (cleanupError) console.warn('Old logo cleanup:', cleanupError)
      }
      await loadData()
      showToast({ type: 'success', title: 'Logo enregistré', message: service.name })
    } catch (error) {
      if (uploaded) { const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([path]); if (cleanupError) console.warn('Logo rollback:', cleanupError) }
      showToast({ type: 'error', title: 'Envoi impossible', message: error instanceof Error ? error.message : 'Erreur inconnue.' })
    } finally { setUploadingSlug(null) }
  }

  const removeLogo = async () => {
    if (!removeLogoTarget || removingLogo) return
    const target = removeLogoTarget
    const logo = logos[target.slug]
    if (!logo) { setRemoveLogoTarget(null); return }
    setRemovingLogo(true)
    try {
      const { data, error } = await supabase.from('service_logos').delete().eq('service_slug', target.slug).select('service_slug')
      if (error) throw error
      if (!data?.length) throw new Error('Suppression non confirmée. Vérifiez les autorisations Supabase.')
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([logo.path])
      if (storageError) console.warn('Logo storage cleanup:', storageError)
      setRemoveLogoTarget(null)
      await loadData()
      showToast({ type: 'success', title: 'Logo retiré', message: target.name })
    } catch (error) { showToast({ type: 'error', title: 'Suppression impossible', message: error instanceof Error ? error.message : 'Erreur inconnue.' }) }
    finally { setRemovingLogo(false) }
  }

  const deleteService = async () => {
    if (!deleteTarget || isDeleting || deleteConfirmation.trim() !== deleteTarget.slug) return
    const target = deleteTarget
    setIsDeleting(true)
    try {
      const { data, error } = await supabase.rpc('admin_delete_digital_service', { p_service_id: target.id })
      if (error) throw error
      if (data !== true) throw new Error('La fonction Supabase n’a pas confirmé la suppression. Vérifiez la fonction RPC et les autorisations.')
      const logo = logos[target.slug]
      const { error: rowError } = await supabase.from('service_logos').delete().eq('service_slug', target.slug)
      if (rowError) console.warn('Logo row cleanup:', rowError)
      else if (logo?.path) {
        const { error: storageError } = await supabase.storage.from(BUCKET).remove([logo.path])
        if (storageError) console.warn('Logo storage cleanup:', storageError)
      }
      setDeleteTarget(null); setDeleteConfirmation('')
      setServices(current => current.filter(s => s.id !== target.id))
      await loadData()
      showToast({ type: 'success', title: 'Service supprimé', message: `${target.name} a été supprimé de Supabase.` })
    } catch (error) { showToast({ type: 'error', title: 'Suppression impossible', message: error instanceof Error ? error.message : 'Erreur inconnue.' }) }
    finally { setIsDeleting(false) }
  }

  return (
    <div dir="ltr" className="min-w-0 space-y-5 pb-10 text-slate-900">
      {toast && <div role="status" className="fixed inset-x-3 top-3 z-[260] sm:left-auto sm:right-5 sm:w-96"><div className={`flex gap-3 rounded-2xl border bg-white p-4 shadow-xl ${toast.type === 'error' ? 'border-rose-200' : toast.type === 'success' ? 'border-emerald-200' : 'border-blue-200'}`}><span className="mt-0.5 font-black">{toast.type === 'error' ? '!' : toast.type === 'success' ? '✓' : 'i'}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{toast.title}</p>{toast.message && <p className="mt-1 break-words text-xs leading-5 text-slate-500">{toast.message}</p>}</div><button type="button" onClick={() => setToast(null)} aria-label="Fermer" className="self-start text-lg text-slate-400">×</button></div></div>}

      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">TEO STORE / ADMIN</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-[28px]">Services numériques</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Gérez le catalogue, les disponibilités, les logos et l’accès aux groupes et aux plans.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void loadData()} disabled={isRefreshing || isLoading} className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{isRefreshing ? 'Actualisation...' : '↻ Actualiser'}</button><button type="button" onClick={() => setCreateOpen(true)} className="min-h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">+ Nouveau service</button></div>
      </header>

      <section aria-label="Statistiques du catalogue" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {([{ label: 'Total services', value: stats.total, color: 'text-slate-900' }, { label: 'Disponibles', value: stats.available, color: 'text-emerald-700' }, { label: 'En rupture', value: stats.out, color: 'text-rose-700' }, { label: 'Bientôt', value: stats.soon, color: 'text-amber-700' }, { label: 'Actifs', value: stats.active, color: 'text-blue-700' }]).map(item => <div key={item.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">{item.label}</p><p className={`mt-2 text-2xl font-black tabular-nums ${item.color}`}>{item.value}</p></div>)}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-base font-black">Catalogue des services</h2><p className="mt-1 text-xs text-slate-500">{filtered.length} résultat(s) sur {services.length}</p></div><div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"><label className="relative min-w-0 flex-1 lg:w-72"><span className="sr-only">Rechercher</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un service..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none focus:border-blue-500" /></label><label><span className="sr-only">Filtrer par statut</span><select value={filter} onChange={e => setFilter(e.target.value as Filter)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold sm:w-40"><option value="all">Tous les statuts</option><option value="available">Disponible</option><option value="out_of_stock">Rupture</option><option value="coming_soon">Bientôt</option></select></label>{(query || filter !== 'all') && <button type="button" onClick={() => { setQuery(''); setFilter('all') }} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold">Effacer</button>}</div></div>
      </section>

      {loadError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><strong>Chargement impossible.</strong> {loadError}<button type="button" onClick={() => void loadData()} className="ml-3 font-bold underline">Réessayer</button></div>}

      {isLoading ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Chargement des services...</div> : filtered.length ? (
        <section className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-3" aria-label="Liste des services">
          {filtered.map(service => {
            const logo = logos[service.slug]
            const count = service.digital_service_groups?.[0]?.count ?? 0
            return <article key={service.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
              <div className="flex min-w-0 items-start gap-3"><button type="button" disabled={!logo} onClick={() => logo && setLogoPreview({ name: service.name, url: logo.url })} title={logo ? 'Agrandir le logo' : 'Aucun logo'} className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 disabled:cursor-default">{logo ? <img src={logo.url} alt={`Logo ${service.name}`} className="h-full w-full object-contain p-1" /> : <span className="text-sm font-black text-slate-400">{service.name.slice(0, 2).toUpperCase()}</span>}</button><div className="min-w-0 flex-1"><h3 className="truncate text-base font-black" title={service.name}>{service.name}</h3><p className="mt-0.5 truncate text-xs text-slate-500">{service.category}</p><p className="mt-0.5 truncate text-[11px] text-slate-400">{service.slug}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyle[service.availability]}`}>{labelStatus[service.availability]}</span></div>
              <p className="mt-3 min-h-[40px] line-clamp-2 text-xs leading-5 text-slate-500">{service.description || 'Aucune description enregistrée.'}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-y border-slate-100 py-3"><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">{count} groupe(s)</span><span className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${service.active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{service.active ? '● Publié' : '○ Désactivé'}</span><span className="ml-auto text-xs text-slate-400">Ordre {service.sort_order}</span></div>
              <div className="mt-auto pt-3"><div className="grid grid-cols-2 gap-2"><Link to={`/admin/services/${service.slug}`} className="flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-bold text-white hover:bg-blue-700">Gérer le service</Link><button type="button" onClick={() => void toggleService(service)} disabled={Boolean(togglingId)} className="min-h-10 rounded-xl border border-slate-200 px-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{togglingId === service.id ? 'Patientez...' : service.active ? 'Désactiver' : 'Activer'}</button></div><div className="mt-2 flex flex-wrap gap-2"><label className={`flex min-h-9 cursor-pointer items-center rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 ${uploadingSlug ? 'pointer-events-none opacity-50' : ''}`}>{uploadingSlug === service.slug ? 'Envoi...' : logo ? 'Changer logo' : 'Ajouter logo'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={Boolean(uploadingSlug)} className="sr-only" onChange={e => { const file = e.target.files?.[0]; void uploadLogo(service, file); e.currentTarget.value = '' }} /></label>{logo && <button type="button" onClick={() => setRemoveLogoTarget(service)} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">Retirer logo</button>}<button type="button" onClick={() => { setDeleteTarget(service); setDeleteConfirmation('') }} className="ml-auto min-h-9 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100">Supprimer</button></div></div>
            </article>
          })}
        </section>
      ) : <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="text-base font-black">Aucun service trouvé</h2><p className="mt-2 text-sm text-slate-500">{services.length ? 'Modifiez votre recherche ou le filtre.' : 'Votre catalogue Supabase est vide.'}</p>{services.length === 0 && <button type="button" disabled={isImporting} onClick={() => void importCatalog()} className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{isImporting ? 'Import en cours...' : 'Importer le catalogue actuel'}</button>}</section>}

      {createOpen && <div className="fixed inset-0 z-[190] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"><div role="dialog" aria-modal="true" aria-labelledby="create-title" className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Catalogue</p><h2 id="create-title" className="mt-1 text-xl font-black">Nouveau service</h2><p className="mt-1 text-xs text-slate-500">Créez le service, puis gérez ses groupes et plans.</p></div><button type="button" disabled={isCreating} onClick={() => setCreateOpen(false)} aria-label="Fermer" className="text-2xl text-slate-400">×</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700">Nom *<input value={draft.name} onChange={e => setDraft(v => ({ ...v, name: e.target.value }))} className={inputClass} placeholder="Ex. Disney Plus" /></label><label className="text-xs font-bold text-slate-700">Slug *<input dir="ltr" value={draft.slug} onChange={e => setDraft(v => ({ ...v, slug: e.target.value }))} className={inputClass} placeholder="disney-plus" /></label><label className="text-xs font-bold text-slate-700">Catégorie *<input value={draft.category} onChange={e => setDraft(v => ({ ...v, category: e.target.value }))} className={inputClass} placeholder="Streaming" /></label><label className="text-xs font-bold text-slate-700">Disponibilité<select value={draft.availability} onChange={e => setDraft(v => ({ ...v, availability: e.target.value as Availability }))} className={inputClass}><option value="available">Disponible</option><option value="out_of_stock">Rupture</option><option value="coming_soon">Bientôt</option></select></label><label className="text-xs font-bold text-slate-700 sm:col-span-2">Description<textarea rows={4} value={draft.description} onChange={e => setDraft(v => ({ ...v, description: e.target.value }))} className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" /></label></div><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" disabled={isCreating} onClick={() => setCreateOpen(false)} className="min-h-11 rounded-xl border border-slate-200 text-sm font-bold">Annuler</button><button type="button" disabled={isCreating} onClick={() => void createService()} className="min-h-11 rounded-xl bg-blue-600 text-sm font-bold text-white disabled:opacity-50">{isCreating ? 'Création...' : 'Créer le service'}</button></div></div></div>}

      {removeLogoTarget && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/65 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h2 className="text-lg font-black">Retirer le logo ?</h2><p className="mt-2 text-sm text-slate-500">{removeLogoTarget.name} utilisera son affichage par défaut.</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" disabled={removingLogo} onClick={() => setRemoveLogoTarget(null)} className="min-h-11 rounded-xl border border-slate-200 text-sm font-bold">Annuler</button><button type="button" disabled={removingLogo} onClick={() => void removeLogo()} className="min-h-11 rounded-xl bg-rose-600 text-sm font-bold text-white disabled:opacity-50">{removingLogo ? 'Suppression...' : 'Retirer'}</button></div></div></div>}

      {deleteTarget && <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/70 p-3"><div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><p className="text-xs font-black uppercase tracking-wider text-rose-600">Action irréversible</p><h2 id="delete-title" className="mt-2 text-xl font-black">Supprimer définitivement ?</h2><p className="mt-2 break-words text-sm font-semibold">{deleteTarget.name}</p><p className="mt-2 text-sm leading-6 text-slate-500">Cette action demande à Supabase de supprimer le service et ses groupes et plans. La suppression dépend de la fonction RPC installée.</p><p dir="rtl" className="mt-2 text-sm leading-6 text-slate-600">اكتب رمز الخدمة للتأكيد. سيتم حذف الخدمة ومجموعاتها وباقاتها نهائيًا إذا سمحت قاعدة البيانات بذلك.</p><label htmlFor="delete-slug" className="mt-4 block text-xs font-bold text-slate-700">Recopiez ce slug :</label><code className="mt-2 block rounded-lg bg-slate-100 px-3 py-2 text-sm">{deleteTarget.slug}</code><input id="delete-slug" dir="ltr" autoComplete="off" spellCheck={false} value={deleteConfirmation} onChange={e => setDeleteConfirmation(e.target.value)} className={inputClass} placeholder={deleteTarget.slug} /><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" disabled={isDeleting} onClick={() => { setDeleteTarget(null); setDeleteConfirmation('') }} className="min-h-11 rounded-xl border border-slate-200 text-sm font-bold">Annuler</button><button type="button" disabled={isDeleting || deleteConfirmation.trim() !== deleteTarget.slug} onClick={() => void deleteService()} className="min-h-11 rounded-xl bg-rose-600 px-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{isDeleting ? 'Suppression...' : 'Supprimer le service'}</button></div></div></div>}

      {logoPreview && <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setLogoPreview(null)}><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-4" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between gap-3"><h2 className="truncate text-sm font-black">{logoPreview.name}</h2><button type="button" onClick={() => setLogoPreview(null)} aria-label="Fermer" className="text-2xl text-slate-500">×</button></div><img src={logoPreview.url} alt={`Logo ${logoPreview.name}`} className="mt-3 max-h-[65dvh] w-full rounded-xl object-contain" /></div></div>}
    </div>
  )
}

export default AdminServicesPage
