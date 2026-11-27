import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'
import { ExternalLink, Plus, Pencil, Trash2, RefreshCw, Globe, Send } from 'lucide-react'

type Supplier = { id: string; slot: number; supplier_name: string; supplier_url: string; supplier_type: 'website' | 'telegram'; active: boolean; sort_order: number; note: string }
type Draft = Omit<Supplier, 'id' | 'slot'>
const empty = (): Draft => ({ supplier_name: '', supplier_url: '', supplier_type: 'website', active: true, sort_order: 100, note: '' })
const table = 'teo_supplier_directory'
const columns = 'id,slot,supplier_name,supplier_url,supplier_type,active,sort_order,note'
function validUrl(value: string, type: Draft['supplier_type']) {
  if (!/^https:\/\/[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^\s\u0000-\u001f\u007f]*)?$/.test(value)) return false
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || value.includes('\\')) return false
    return type !== 'telegram' || /^https:\/\/(t\.me|telegram\.me)\/[A-Za-z0-9_]+([/?#][^\s]*)?$/.test(value)
  } catch { return false }
}
export default function AdminSuppliersPage() {
  const { language } = useLanguage()
  const ar = language === 'ar'
  const t = (a: string, f: string) => ar ? a : f
  const [rows, setRows] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [message, setMessage] = useState<{ ar: string; fr: string; error: boolean } | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const lock = useRef(false)
  const seq = useRef(0)
  const load = useCallback(async () => {
    const version = ++seq.current
    setLoading(true)
    try {
      const { data, error } = await supabase.from(table).select(columns).order('sort_order').order('slot')
      if (error) throw error
      if (version !== seq.current) return
      setRows((data ?? []) as Supplier[])
      setFailed(false)
    } catch { if (version === seq.current) setFailed(true) }
    finally { if (version === seq.current) setLoading(false) }
  }, [])
  useEffect(() => { void load(); return () => { ++seq.current } }, [load])
  const report = (a: string, f: string, error = false) => setMessage({ ar: a, fr: f, error })
  const openNew = () => { setEditId(null); setDraft(empty()); setMessage(null) }
  const openEdit = (row: Supplier) => {
    const { id, slot: _slot, ...fields } = row
    void _slot
    setEditId(id); setDraft(fields); setMessage(null)
  }
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft || lock.current || failed || loading) return
    const value = { ...draft, supplier_name: draft.supplier_name.trim(), supplier_url: draft.supplier_url.trim(), note: draft.note.trim() }
    if (!value.supplier_name || value.supplier_name.length > 150 || value.supplier_url.length > 2000 || !validUrl(value.supplier_url, value.supplier_type) || !Number.isInteger(value.sort_order) || value.sort_order < 1 || value.sort_order > 999) {
      report('تحقق من الاسم والرابط HTTPS والترتيب.', 'Vérifiez le nom, le lien HTTPS et la priorité.', true); return
    }
    lock.current = true; setBusy(true); setMessage(null)
    try {
      if (editId) {
        const { data, error } = await supabase.from(table).update(value).eq('id', editId).select('id').single()
        if (error || !data) throw error ?? new Error('Not saved')
      } else {
        const { data: used, error: readError } = await supabase.from(table).select('slot')
        if (readError) throw readError
        const occupied = new Set((used ?? []).map(row => row.slot))
        const slot = Array.from({ length: 40 }, (_, i) => i + 1).find(i => !occupied.has(i))
        if (slot === undefined) { report('بلغت الحد الأقصى: 40 موردًا.', 'Limite atteinte : 40 fournisseurs.', true); return }
        const { error } = await supabase.from(table).insert({ ...value, slot })
        if (error) throw error
      }
      setDraft(null); setEditId(null); report('تم حفظ المورد.', 'Fournisseur enregistré.'); await load()
    } catch { report('تعذر الحفظ. حدّث القائمة وحاول مجددًا.', 'Enregistrement impossible. Actualisez la liste et réessayez.', true) }
    finally { lock.current = false; setBusy(false) }
  }
  const remove = async (row: Supplier) => {
    if (lock.current || !window.confirm(t('حذف المورد نهائيًا؟', 'Supprimer définitivement ce fournisseur ?') + '\n' + row.supplier_name)) return
    lock.current = true; setBusy(true); setMessage(null)
    try {
      const { data, error } = await supabase.from(table).delete().eq('id', row.id).select('id').single()
      if (error || !data) throw error ?? new Error('Not deleted')
      if (editId === row.id) { setDraft(null); setEditId(null) }
      report('تم حذف المورد.', 'Fournisseur supprimé.'); await load()
    } catch { report('تعذر حذف المورد.', 'Suppression impossible.', true) }
    finally { lock.current = false; setBusy(false) }
  }
  const field = 'w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500'
  const panel = { background: 'var(--color-surface, white)', borderColor: 'var(--color-border, #dbe3ee)', color: 'var(--color-text, #0f172a)' }
  const filtered = rows.filter(row => `${row.supplier_name} ${row.supplier_url}`.toLowerCase().includes(search.toLowerCase().trim()))
  return <section dir={ar ? 'rtl' : 'ltr'} className="space-y-4 p-2 sm:p-4" style={{ color: 'var(--color-text)' }}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-bold text-blue-500">TEO SUPPLIERS CENTER</p><h1 className="text-2xl font-black">{t('دليل الموردين', 'Fournisseurs')}</h1><p className="text-sm opacity-70">{t('روابط مستقلة خاصة بالإدارة فقط.', 'Liens indépendants, réservés à l’administration.')}</p></div>
      <button type="button" disabled={busy || loading || failed || rows.length >= 40} onClick={openNew} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white active:scale-95 disabled:opacity-50"><Plus size={18}/>{t('إضافة مورد', 'Ajouter un fournisseur')}</button>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {[[t('الموردون', 'Fournisseurs'), `${rows.length}/40`], [t('نشط', 'Actifs'), rows.filter(r => r.active).length], [t('متاح للإضافة', 'Places libres'), 40 - rows.length]].map(([label, value]) => <div key={label} className="rounded-2xl border p-4" style={panel}><p className="text-xs opacity-70">{label}</p><p className="text-2xl font-black" dir="ltr">{loading || failed ? '—' : value}</p></div>)}
    </div>
    {message && <p role={message.error ? 'alert' : 'status'} className={`rounded-xl border p-3 text-sm font-bold ${message.error ? 'text-red-500' : 'text-emerald-500'}`}>{ar ? message.ar : message.fr}</p>}
    {draft && <form onSubmit={save} className="space-y-3 rounded-2xl border p-4" style={panel}>
      <h2 className="font-black">{editId ? t('تعديل المورد', 'Modifier le fournisseur') : t('مورد جديد', 'Nouveau fournisseur')}</h2>
      <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">{t('اسم المورد', 'Nom du fournisseur')}<input className={field} style={panel} required maxLength={150} value={draft.supplier_name} onChange={e => setDraft({ ...draft, supplier_name: e.target.value })}/></label>
        <label className="space-y-1 text-sm">{t('النوع', 'Type')}<select className={field} style={panel} value={draft.supplier_type} onChange={e => setDraft({ ...draft, supplier_type: e.target.value as Draft['supplier_type'] })}><option value="website">{t('موقع إلكتروني', 'Site web')}</option><option value="telegram">Bot Telegram</option></select></label>
        <label className="space-y-1 text-sm sm:col-span-2">{t('الرابط', 'Lien HTTPS')}<input className={field} style={panel} dir="ltr" type="url" required maxLength={2000} placeholder="https://" value={draft.supplier_url} onChange={e => setDraft({ ...draft, supplier_url: e.target.value })}/></label>
        <label className="space-y-1 text-sm">{t('ترتيب الظهور (الأقل أولًا)', 'Ordre (le plus petit en premier)')}<input className={field} style={panel} type="number" required min={1} max={999} value={Number.isFinite(draft.sort_order) ? draft.sort_order : ''} onChange={e => setDraft({ ...draft, sort_order: e.target.valueAsNumber })}/></label>
        <label className="flex items-center gap-2 self-end py-3 text-sm"><input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })}/>{t('مورد نشط', 'Fournisseur actif')}</label>
        <label className="space-y-1 text-sm sm:col-span-2">{t('ملاحظات خاصة (اختياري)', 'Notes privées (facultatif)')}<textarea className={field} style={panel} maxLength={1000} rows={3} value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })}/></label>
      </fieldset>
      <div className="flex flex-wrap gap-2"><button type="submit" disabled={busy || loading || failed} className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white active:scale-95 disabled:opacity-50">{busy ? t('جارٍ الحفظ…', 'Enregistrement…') : t('حفظ', 'Enregistrer')}</button><button type="button" disabled={busy} className="rounded-xl border px-4 py-2" onClick={() => { setDraft(null); setEditId(null) }}>{t('إلغاء', 'Annuler')}</button></div>
    </form>}
    <div className="flex items-center gap-2"><input aria-label={t('بحث عن مورد', 'Rechercher un fournisseur')} className={field} style={panel} value={search} onChange={e => setSearch(e.target.value)} placeholder={t('بحث عن مورد…', 'Rechercher un fournisseur…')}/><button type="button" title={t('تحديث', 'Actualiser')} aria-label={t('تحديث', 'Actualiser')} disabled={busy || loading} onClick={() => void load()} className="rounded-xl border p-3 disabled:opacity-50"><RefreshCw size={18}/></button></div>
    {loading ? <p>{t('جارٍ التحميل…', 'Chargement…')}</p> : failed ? <p role="alert" className="text-red-500">{t('تعذر تحميل القائمة.', 'Impossible de charger la liste.')}</p> : !filtered.length ? <p className="rounded-xl border p-5 text-center opacity-70" style={panel}>{t('لا يوجد موردون لعرضهم.', 'Aucun fournisseur à afficher.')}</p> : <div className="grid gap-3 lg:grid-cols-2">{filtered.map(row => <article key={row.id} className="min-w-0 space-y-3 rounded-2xl border p-4" style={panel}>
      <div className="flex items-start gap-3"><div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">{row.supplier_type === 'telegram' ? <Send size={20}/> : <Globe size={20}/>}</div><div className="min-w-0 flex-1"><h3 className="break-words font-black">{row.supplier_name}</h3><p className="text-xs opacity-70">{row.supplier_type === 'telegram' ? 'Telegram' : 'Web'} · #{row.sort_order}</p><p className={`text-xs font-bold ${row.active ? 'text-emerald-500' : 'opacity-60'}`}>{row.active ? t('نشط', 'Actif') : t('مخفي', 'Masqué')}</p></div></div>
      <p dir="ltr" className="break-all text-xs opacity-70">{row.supplier_url}</p>{row.note && <p className="whitespace-pre-wrap break-words text-sm">{row.note}</p>}
      <div className="flex flex-wrap gap-2">{validUrl(row.supplier_url, row.supplier_type) && <a href={row.supplier_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"><ExternalLink size={15}/>{t('فتح الرابط', 'Ouvrir')}</a>}<button type="button" disabled={busy} onClick={() => openEdit(row)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"><Pencil size={15}/>{t('تعديل', 'Modifier')}</button><button type="button" disabled={busy} onClick={() => void remove(row)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-red-500 disabled:opacity-50"><Trash2 size={15}/>{t('حذف', 'Supprimer')}</button></div>
    </article>)}</div>}
  </section>
}
