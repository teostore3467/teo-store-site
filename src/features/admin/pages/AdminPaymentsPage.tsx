import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

type Status = 'payment_review' | 'payment_partial' | 'payment_confirmed' | 'processing' | 'fulfillment_sent' | 'disputed' | 'completed' | 'cancelled' | 'refunded';
type Filter = 'all' | 'payment_review' | 'payment_partial' | 'payment_confirmed' | 'cancelled' | 'refunded';
type Order = {
  id: string; order_number: string; customer_name?: string | null; customer_phone?: string | null; customer_email?: string | null;
  service_name: string; plan_label: string; total_amount: number; currency: string; amount_received?: number | null;
  amount_remaining?: number | null; payment_method_name: string | null; payment_sender_number?: string | null;
  payment_proof_path?: string | null; status: string; rejection_reason?: string | null; payment_issue_reason?: string | null;
  payment_completion_requested_at?: string | null; created_at: string; updated_at?: string | null;
};
type Method = { id: string; code: string; name: string; payment_number: string; image_path: string | null; instructions_fr: string | null; instructions_ar: string | null; is_active: boolean; sort_order: number; created_at: string; updated_at: string };
type Draft = { code: string; name: string; payment_number: string; instructions_fr: string; instructions_ar: string; is_active: boolean; sort_order: string };
type Toast = { kind: 'success' | 'error' | 'info'; title: string; detail?: string };
const blank: Draft = { code: '', name: '', payment_number: '', instructions_fr: '', instructions_ar: '', is_active: true, sort_order: '10' };
const reasons = [
  ['proof_unreadable', 'Preuve illisible', 'La preuve de paiement envoyée est illisible ou incomplète.'],
  ['payment_not_found', 'Paiement introuvable', "Nous n'avons pas pu retrouver ce paiement avec les informations fournies."],
  ['sender_number_mismatch', 'Numéro incorrect', 'Le numéro utilisé pour le paiement ne correspond pas aux informations envoyées.'],
  ['duplicate_payment', 'Paiement déjà utilisé', 'Cette preuve ou cette transaction semble déjà associée à une autre commande.'],
  ['invalid_proof', 'Preuve non valide', "La preuve envoyée ne permet pas de confirmer qu'un paiement valide a été effectué."],
  ['other', 'Autre raison', 'Indiquez manuellement le motif du refus.'],
] as const;
const confirmedStatuses: Status[] = ['payment_confirmed', 'processing', 'fulfillment_sent', 'disputed', 'completed'];
const statuses: Record<Status, { label: string; cls: string }> = {
  payment_review: { label: 'À vérifier', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  payment_partial: { label: 'Complément requis', cls: 'bg-orange-50 text-orange-700 ring-orange-200' },
  payment_confirmed: { label: 'Confirmé', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  processing: { label: 'En traitement', cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  fulfillment_sent: { label: 'Service envoyé', cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  disputed: { label: 'Litige', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  completed: { label: 'Terminée', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  cancelled: { label: 'Refusée', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  refunded: { label: 'Remboursée', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
};
const statusOf = (s: string): Status => s in statuses ? s as Status : 'payment_review';
const money = (n: number, c = 'MRU') => `${new Intl.NumberFormat('fr-FR-u-nu-latn', { maximumFractionDigits: 2 }).format(Number(n) || 0)} ${c}`;
const date = (s?: string | null) => s ? new Intl.DateTimeFormat('fr-FR-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(s)) : '—';
const card = 'rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.035)]';
const primary = 'inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50';
const secondary = 'inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50';
const input = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export default function AdminPaymentsPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [tab, setTab] = useState<'transactions' | 'methods'>('transactions');
  const [busy, setBusy] = useState<string | null>(null);
  const [proofBusy, setProofBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ order: Order; url: string } | null>(null);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);
  const [partialOrder, setPartialOrder] = useState<Order | null>(null);
  const [received, setReceived] = useState('');
  const [partialNote, setPartialNote] = useState('');
  const [rejectOrder, setRejectOrder] = useState<Order | null>(null);
  const [reasonCode, setReasonCode] = useState<string>(reasons[0][0]);
  const [otherReason, setOtherReason] = useState('');
  const [editor, setEditor] = useState(false);
  const [editing, setEditing] = useState<Method | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const notify = useCallback((kind: Toast['kind'], title: string, detail?: string) => setToast({ kind, title, detail }), []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 4500); return () => window.clearTimeout(timer); }, [toast]);
  const loadOrders = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    const { data, error: e } = await supabase.from('digital_orders').select('id,order_number,customer_name,customer_phone,customer_email,service_name,plan_label,total_amount,currency,amount_received,amount_remaining,payment_method_name,payment_sender_number,payment_proof_path,status,rejection_reason,payment_issue_reason,payment_completion_requested_at,created_at,updated_at').order('created_at', { ascending: false });
    if (e) setError(`Impossible de charger les paiements : ${e.message}`);
    else setOrders((data ?? []) as Order[]);
    setLoading(false);
  }, []);
  const loadMethods = useCallback(async () => {
    const { data, error: e } = await supabase.from('payment_methods').select('id,code,name,payment_number,image_path,instructions_fr,instructions_ar,is_active,sort_order,created_at,updated_at').order('sort_order', { ascending: true }).order('created_at', { ascending: true });
    if (e) notify('error', 'Moyens de paiement indisponibles', e.message);
    else setMethods((data ?? []) as Method[]);
    setMethodsLoading(false);
  }, [notify]);
  useEffect(() => {
    void loadOrders(true); void loadMethods();
    const c1 = supabase.channel(`admin-payment-orders-${Date.now()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'digital_orders' }, () => { void loadOrders(); }).subscribe();
    const c2 = supabase.channel(`admin-payment-methods-${Date.now()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, () => { void loadMethods(); }).subscribe();
    const focus = () => { void loadOrders(); void loadMethods(); };
    const visibility = () => { if (document.visibilityState === 'visible') focus(); };
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visibility); void supabase.removeChannel(c1); void supabase.removeChannel(c2); };
  }, [loadOrders, loadMethods]);
  const refresh = async () => { setRefreshing(true); await Promise.all([loadOrders(), loadMethods()]); setRefreshing(false); };
  const payments = useMemo(() => orders.filter(o => Boolean(o.payment_method_name || o.payment_proof_path || o.payment_sender_number)), [orders]);
  const stats = useMemo(() => ({
    review: payments.filter(o => statusOf(o.status) === 'payment_review').length,
    partial: payments.filter(o => statusOf(o.status) === 'payment_partial').length,
    confirmed: payments.filter(o => confirmedStatuses.includes(statusOf(o.status))).length,
    remaining: payments.filter(o => statusOf(o.status) === 'payment_partial' && o.currency?.toUpperCase() === 'MRU').reduce((sum, o) => sum + Number(o.amount_remaining || 0), 0),
    volume: payments.filter(o => confirmedStatuses.includes(statusOf(o.status)) && o.currency?.toUpperCase() === 'MRU').reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
  }), [payments]);
  const filtered = useMemo(() => payments.filter(o => {
    const s = statusOf(o.status);
    if (filter === 'payment_confirmed' ? !confirmedStatuses.includes(s) : filter !== 'all' && s !== filter) return false;
    const q = search.trim().toLowerCase();
    return !q || [o.order_number, o.service_name, o.plan_label, o.customer_name, o.customer_phone, o.customer_email, o.payment_method_name, o.payment_sender_number].some(v => v?.toLowerCase().includes(q));
  }), [payments, filter, search]);
  const openProof = async (o: Order) => {
    if (!o.payment_proof_path || proofBusy) return;
    setProofBusy(o.id);
    const { data, error: e } = await supabase.storage.from('payment-proofs').createSignedUrl(o.payment_proof_path, 300);
    setProofBusy(null);
    if (e || !data?.signedUrl) notify('error', 'Preuve inaccessible', e?.message || 'Fichier introuvable');
    else setPreview({ order: o, url: data.signedUrl });
  };
  const updateOrder = async (o: Order, payload: Record<string, unknown>, allowed: string[]) => {
    setBusy(o.id);
    try {
      const { data, error: e } = await supabase.from('digital_orders').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', o.id).in('status', allowed).select('id');
      if (e) throw e;
      if (!data?.length) throw new Error('Statut modifié ou accès refusé. Actualisez la page.');
      await loadOrders(); return true;
    } catch (e) { notify('error', 'Opération impossible', e instanceof Error ? e.message : 'Erreur inconnue'); return false; }
    finally { setBusy(null); }
  };
  const confirm = async () => {
    if (!confirmOrder || busy) return;
    const o = confirmOrder;
    const ok = await updateOrder(o, { status: 'payment_confirmed', amount_received: o.total_amount, amount_remaining: 0, payment_issue_code: null, payment_issue_reason: null, payment_issue_at: null, payment_completion_requested_at: null, rejection_code: null, rejection_reason: null, rejected_at: null }, ['payment_review', 'payment_partial']);
    if (ok) { setConfirmOrder(null); setPreview(null); navigate(`/admin/orders?order=${encodeURIComponent(o.order_number)}`, { state: { orderNumber: o.order_number, autoOpen: true, source: 'payment-confirmed' } }); }
  };
  const parsedReceived = received.trim() === '' ? NaN : Number(received.replace(',', '.'));
  const canPartial = partialOrder && Number.isFinite(parsedReceived) && parsedReceived > 0 && parsedReceived < Number(partialOrder.total_amount) && !busy;
  const savePartial = async () => {
    if (!partialOrder || !canPartial) return;
    const o = partialOrder; const remaining = Number((Number(o.total_amount) - parsedReceived).toFixed(2));
    const note = partialNote.trim() || `Paiement incomplet. Montant reçu : ${money(parsedReceived, o.currency)}. Montant restant : ${money(remaining, o.currency)}.`;
    const now = new Date().toISOString();
    const ok = await updateOrder(o, { status: 'payment_partial', amount_received: parsedReceived, amount_remaining: remaining, payment_issue_code: 'insufficient_amount', payment_issue_reason: note, payment_issue_at: now, payment_completion_requested_at: now, rejection_code: null, rejection_reason: null, rejected_at: null }, ['payment_review', 'payment_partial']);
    if (ok) { setPartialOrder(null); notify('success', 'Complément demandé', `${o.order_number} : ${money(remaining, o.currency)} restants`); }
  };
  const selectedReason = reasons.find(r => r[0] === reasonCode);
  const rejectReason = reasonCode === 'other' ? otherReason.trim() : selectedReason?.[2] || '';
  const reject = async () => {
    if (!rejectOrder || !rejectReason || busy) return;
    const o = rejectOrder;
    const ok = await updateOrder(o, { status: 'cancelled', rejection_code: reasonCode, rejection_reason: rejectReason, rejected_at: new Date().toISOString(), payment_issue_code: null, payment_issue_reason: null, payment_issue_at: null, payment_completion_requested_at: null }, ['payment_review']);
    if (ok) { setRejectOrder(null); notify('success', 'Paiement refusé', o.order_number); }
  };
  const openEditor = (m?: Method) => {
    setEditing(m || null); setDraft(m ? { code: m.code, name: m.name, payment_number: m.payment_number, instructions_fr: m.instructions_fr || '', instructions_ar: m.instructions_ar || '', is_active: m.is_active, sort_order: String(m.sort_order) } : { ...blank, sort_order: String((methods.length + 1) * 10) });
    setImageFile(null); setEditor(true);
  };
  const changeDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(d => ({ ...d, [key]: value }));
  const saveMethod = async () => {
    if (saving) return;
    const code = draft.code.trim().toLowerCase(); const name = draft.name.trim(); const payment_number = draft.payment_number.trim(); const sort = Number(draft.sort_order);
    if (!code || !name || !payment_number) { notify('error', 'Champs obligatoires', 'Nom, code et numéro de réception sont requis.'); return; }
    if (!Number.isInteger(sort) || sort < 0) { notify('error', 'Ordre invalide', 'Utilisez un entier positif ou nul.'); return; }
    if (imageFile && (!['image/png', 'image/jpeg', 'image/webp'].includes(imageFile.type) || imageFile.size > 5 * 1024 * 1024)) { notify('error', 'Image invalide', 'JPG, PNG ou WEBP, 5 MB maximum.'); return; }
    setSaving(true); let uploaded: string | null = null;
    try {
      let image_path = editing?.image_path || null;
      if (imageFile) {
        const ext = imageFile.type === 'image/png' ? 'png' : imageFile.type === 'image/webp' ? 'webp' : 'jpg';
        const path = `logos/${code.replace(/[^a-z0-9_-]/g, '-')}-${Date.now()}.${ext}`;
        const { error: e } = await supabase.storage.from('payment-methods').upload(path, imageFile, { upsert: false, cacheControl: '3600', contentType: imageFile.type });
        if (e) throw e; uploaded = path; image_path = path;
      }
      const payload = { code, name, payment_number, image_path, instructions_fr: draft.instructions_fr.trim() || null, instructions_ar: draft.instructions_ar.trim() || null, is_active: draft.is_active, sort_order: sort };
      if (editing) {
        const { data, error: e } = await supabase.from('payment_methods').update(payload).eq('id', editing.id).select('id');
        if (e) throw e; if (!data?.length) throw new Error('Aucune modification enregistrée. Vérifiez les autorisations.');
      } else {
        const { data, error: e } = await supabase.from('payment_methods').insert(payload).select('id');
        if (e) throw e; if (!data?.length) throw new Error('Insertion non autorisée.');
      }
      if (uploaded && editing?.image_path && editing.image_path !== uploaded) {
        const { error: e } = await supabase.storage.from('payment-methods').remove([editing.image_path]);
        if (e) console.warn('Old payment logo cleanup failed:', e);
      }
      await loadMethods(); setEditor(false); setEditing(null); setImageFile(null); notify('success', editing ? 'Moyen modifié' : 'Moyen ajouté', name);
    } catch (e) {
      if (uploaded) await supabase.storage.from('payment-methods').remove([uploaded]);
      notify('error', 'Enregistrement impossible', e instanceof Error ? e.message : 'Erreur inconnue');
    } finally { setSaving(false); }
  };
  const toggleMethod = async (m: Method) => {
    if (toggling) return; setToggling(m.id);
    const { data, error: e } = await supabase.from('payment_methods').update({ is_active: !m.is_active }).eq('id', m.id).select('id');
    if (e || !data?.length) notify('error', 'Modification impossible', e?.message || 'Accès refusé');
    else { await loadMethods(); notify('success', m.is_active ? 'Moyen désactivé' : 'Moyen activé', m.name); }
    setToggling(null);
  };
  const deleteMethod = async (m: Method) => {
    if (deleting || !window.confirm(`Supprimer définitivement « ${m.name} » ?`)) return;
    setDeleting(m.id);
    try {
      const { data, error: e } = await supabase.from('payment_methods').delete().eq('id', m.id).select('id');
      if (e) throw e; if (!data?.length) throw new Error('Aucune ligne supprimée. Vérifiez les autorisations Supabase (RLS).');
      if (m.image_path) { const { error: imageError } = await supabase.storage.from('payment-methods').remove([m.image_path]); if (imageError) console.warn('Logo cleanup failed:', imageError); }
      await loadMethods(); notify('success', 'Moyen supprimé', m.name);
    } catch (e) { notify('error', 'Suppression impossible', e instanceof Error ? e.message : 'Erreur inconnue'); }
    finally { setDeleting(null); }
  };
  const imageUrl = (path: string | null) => path ? supabase.storage.from('payment-methods').getPublicUrl(path).data.publicUrl : null;
  const filters: { key: Filter; label: string; count?: number }[] = [
    { key: 'all', label: 'Tous', count: payments.length }, { key: 'payment_review', label: 'À vérifier', count: stats.review },
    { key: 'payment_partial', label: 'Compléments', count: stats.partial }, { key: 'payment_confirmed', label: 'Validés', count: stats.confirmed },
    { key: 'cancelled', label: 'Refusés' }, { key: 'refunded', label: 'Remboursés' },
  ];
  return <div dir="ltr" className="min-w-0 space-y-6 pb-12 text-slate-900">
    {toast && <div role="alert" className={`fixed right-4 top-4 z-[300] w-[calc(100%-2rem)] max-w-sm rounded-2xl border bg-white p-4 shadow-2xl ${toast.kind === 'error' ? 'border-rose-300' : toast.kind === 'success' ? 'border-emerald-300' : 'border-blue-300'}`}><div className="flex justify-between gap-3"><div><p className="font-bold">{toast.title}</p>{toast.detail && <p className="mt-1 break-words text-sm text-slate-500">{toast.detail}</p>}</div><button onClick={() => setToast(null)} aria-label="Fermer" className="self-start text-xl text-slate-400">×</button></div></div>}
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">TEO STORE / ADMINISTRATION</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Paiements</h1><p className="mt-2 text-sm text-slate-500">Contrôlez les transactions, les justificatifs et les moyens de paiement depuis un seul espace.</p></div>
      <button onClick={() => void refresh()} disabled={refreshing || loading} className={secondary}>{refreshing ? 'Actualisation…' : '↻ Actualiser les données'}</button>
    </header>
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[
        { title: 'À vérifier', val: stats.review, icon: '◷', accent: 'text-amber-700 bg-amber-50', filter: 'payment_review' as Filter, sub: 'Action requise' },
        { title: 'Compléments', val: stats.partial, icon: '◐', accent: 'text-orange-700 bg-orange-50', filter: 'payment_partial' as Filter, sub: 'Soldes en attente' },
        { title: 'Paiements validés', val: stats.confirmed, icon: '✓', accent: 'text-emerald-700 bg-emerald-50', filter: 'payment_confirmed' as Filter, sub: 'Workflow confirmé' },
        { title: 'Reste à recevoir', val: money(stats.remaining), icon: '↗', accent: 'text-blue-700 bg-blue-50', filter: 'payment_partial' as Filter, sub: 'En MRU uniquement' },
      ].map(s => <button key={s.title} type="button" onClick={() => { setTab('transactions'); setFilter(s.filter); }} className={`${card} min-w-0 p-4 text-left transition hover:border-blue-300 hover:shadow-md sm:p-5`}><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-500 sm:text-sm">{s.title}</span><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${s.accent}`}>{s.icon}</span></div><p className="mt-4 break-words text-2xl font-extrabold tracking-tight sm:text-3xl">{s.val}</p><p className="mt-2 text-xs text-slate-400">{s.sub}</p></button>)}
    </section>
    <div className={`${card} flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5`}><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Volume confirmé · MRU</p><p className="mt-1 text-xl font-extrabold text-slate-900">{money(stats.volume)}</p></div><div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">{payments.length} transactions enregistrées</div></div>
    <div className="flex gap-2 border-b border-slate-200" role="tablist" aria-label="Gestion des paiements">
      <button role="tab" aria-selected={tab === 'transactions'} onClick={() => setTab('transactions')} className={`border-b-[3px] px-4 py-3 text-sm font-bold ${tab === 'transactions' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`}>Transactions</button>
      <button role="tab" aria-selected={tab === 'methods'} onClick={() => setTab('methods')} className={`border-b-[3px] px-4 py-3 text-sm font-bold ${tab === 'methods' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`}>Moyens de paiement <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">{methods.length}</span></button>
    </div>
    {tab === 'transactions' ? <section className="space-y-4">
      <div className={`${card} p-4 sm:p-5`}><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="flex-1"><label htmlFor="payment-search" className="sr-only">Rechercher</label><input id="payment-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher : commande, client, numéro, service…" className={`${input} mt-0`} /></div><button onClick={() => { setSearch(''); setFilter('all'); }} className={secondary}>Réinitialiser</button></div><div className="mt-4 flex flex-wrap gap-2">{filters.map(f => <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-xl px-3 py-2 text-xs font-bold transition sm:text-sm ${filter === f.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f.label}{f.count !== undefined ? ` · ${f.count}` : ''}</button>)}</div></div>
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold">Transactions</h2><p className="text-xs text-slate-500">{filtered.length} résultat(s) sur {payments.length}</p></div></div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {loading ? <div className={`${card} p-12 text-center text-slate-500`}>Chargement des paiements…</div> : filtered.length === 0 ? <div className={`${card} p-12 text-center`}><p className="text-lg font-bold">Aucun paiement trouvé</p><p className="mt-2 text-sm text-slate-500">Essayez une autre recherche ou réinitialisez les filtres.</p></div> : <div className="space-y-3">{filtered.map(o => {
        const s = statusOf(o.status); const actionable = s === 'payment_review' || s === 'payment_partial';
        return <article key={o.id} className={`${card} overflow-hidden`}><div className="flex flex-col gap-4 p-4 sm:p-5 xl:flex-row xl:items-start xl:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-extrabold text-blue-700">{o.order_number}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statuses[s].cls}`}>{statuses[s].label}</span></div><h3 className="mt-2 break-words text-base font-extrabold">{o.service_name}</h3><p className="mt-1 text-sm text-slate-500">{o.plan_label}</p></div><div className="min-w-0 rounded-xl bg-slate-50 px-4 py-3 xl:min-w-44"><p className="text-xs font-bold text-slate-400">Montant total</p><p className="mt-1 break-words text-lg font-extrabold">{money(o.total_amount, o.currency)}</p></div></div>
          <div className="grid gap-3 border-t border-slate-100 px-4 py-4 sm:grid-cols-2 sm:px-5 xl:grid-cols-4"><div><p className="text-xs font-bold text-slate-400">Client</p><p className="mt-1 break-words text-sm font-semibold">{o.customer_name || o.customer_email || o.customer_phone || 'Client TEO STORE'}</p><p className="mt-1 break-all text-xs text-slate-500">{o.customer_phone || o.customer_email || ''}</p></div><div><p className="text-xs font-bold text-slate-400">Méthode</p><p className="mt-1 text-sm font-semibold">{o.payment_method_name || '—'}</p><p className="mt-1 text-xs text-slate-500">{o.payment_sender_number || ''}</p></div><div><p className="text-xs font-bold text-slate-400">Date</p><p className="mt-1 text-sm font-semibold">{date(o.created_at)}</p></div><div><p className="text-xs font-bold text-slate-400">Justificatif</p><button onClick={() => void openProof(o)} disabled={!o.payment_proof_path || Boolean(proofBusy)} className="mt-1 text-left text-sm font-bold text-blue-700 underline-offset-2 hover:underline disabled:text-slate-400">{proofBusy === o.id ? 'Ouverture…' : o.payment_proof_path ? '▣ Voir la preuve' : 'Aucune preuve'}</button></div></div>
          {s === 'payment_partial' && <div className="mx-4 mb-4 grid grid-cols-2 gap-3 rounded-xl bg-orange-50 p-3 sm:mx-5"><div><p className="text-xs font-semibold text-orange-600">Reçu</p><p className="font-extrabold text-slate-900">{money(Number(o.amount_received || 0), o.currency)}</p></div><div><p className="text-xs font-semibold text-orange-600">Restant</p><p className="font-extrabold text-orange-800">{money(Number(o.amount_remaining || 0), o.currency)}</p></div>{o.payment_issue_reason && <p className="col-span-2 text-xs text-orange-700">{o.payment_issue_reason}</p>}</div>}
          {s === 'cancelled' && o.rejection_reason && <p className="mx-4 mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 sm:mx-5">Motif : {o.rejection_reason}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5"><span className="text-xs text-slate-400">Mise à jour : {date(o.updated_at)}</span><div className="flex flex-wrap gap-2">{s === 'payment_review' && <><button disabled={Boolean(busy)} onClick={() => { setRejectOrder(o); setReasonCode(reasons[0][0]); setOtherReason(''); }} className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50">Refuser</button><button disabled={Boolean(busy)} onClick={() => { setPartialOrder(o); setReceived(Number(o.amount_received || 0) > 0 ? String(o.amount_received) : ''); setPartialNote(o.payment_issue_reason || ''); }} className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-orange-700 disabled:opacity-50">Paiement partiel</button></>}{s === 'payment_partial' && <button disabled={Boolean(busy)} onClick={() => { setPartialOrder(o); setReceived(String(o.amount_received || '')); setPartialNote(o.payment_issue_reason || ''); }} className={secondary}>Modifier le complément</button>}{actionable && <button disabled={Boolean(busy)} onClick={() => setConfirmOrder(o)} className={primary}>{busy === o.id ? 'Traitement…' : s === 'payment_partial' ? 'Confirmer le solde' : 'Confirmer le paiement'}</button>}{!actionable && <span className="text-xs font-bold text-slate-500">{confirmedStatuses.includes(s) ? '✓ Paiement validé' : statuses[s].label}</span>}</div></div>
        </article>;
      })}</div>}
    </section> : <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold">Moyens de paiement</h2><p className="mt-1 text-sm text-slate-500">Gérez les numéros, logos, instructions et disponibilités.</p></div><button className={primary} onClick={() => openEditor()}>+ Ajouter un moyen</button></div>
      {methodsLoading ? <div className={`${card} p-12 text-center text-slate-500`}>Chargement des moyens…</div> : methods.length === 0 ? <div className={`${card} p-12 text-center text-slate-500`}>Aucun moyen de paiement. Ajoutez-en un pour commencer.</div> : <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{methods.map(m => <article key={m.id} className={`${card} overflow-hidden`}><div className="p-5"><div className="flex items-start gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">{imageUrl(m.image_path) ? <img src={imageUrl(m.image_path)!} alt={m.name} className="h-full w-full object-contain p-1" /> : <span className="font-bold text-blue-700">{m.name.slice(0, 2).toUpperCase()}</span>}</div><div className="min-w-0 flex-1"><h3 className="truncate font-extrabold">{m.name}</h3><p className="text-xs text-slate-400">{m.code}</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${m.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{m.is_active ? 'Actif' : 'Inactif'}</span></div><div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">Numéro de réception</p><p dir="ltr" className="mt-1 break-all text-lg font-extrabold">{m.payment_number}</p></div><p className="mt-3 text-xs text-slate-400">Ordre d’affichage : {m.sort_order}</p></div><div className="grid grid-cols-3 border-t border-slate-100"><button onClick={() => openEditor(m)} className="min-h-12 text-xs font-bold text-blue-700 hover:bg-blue-50">Modifier</button><button disabled={Boolean(toggling)} onClick={() => void toggleMethod(m)} className="min-h-12 border-x border-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">{toggling === m.id ? 'Patientez…' : m.is_active ? 'Désactiver' : 'Activer'}</button><button disabled={Boolean(deleting)} onClick={() => void deleteMethod(m)} className="min-h-12 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50">{deleting === m.id ? 'Suppression…' : 'Supprimer'}</button></div></article>)}</div>}
    </section>}
    {editor && <div className="fixed inset-0 z-[220] flex items-end justify-center bg-slate-950/70 sm:items-center sm:p-4"><div role="dialog" aria-modal="true" aria-label="Moyen de paiement" className="max-h-[95dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"><div className="flex items-start justify-between"><div><p className="text-xs font-bold text-blue-600">MOYENS DE PAIEMENT</p><h2 className="mt-1 text-xl font-extrabold">{editing ? 'Modifier le moyen' : 'Ajouter un moyen'}</h2></div><button disabled={saving} onClick={() => setEditor(false)} className="text-2xl text-slate-400">×</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Nom *<input className={input} value={draft.name} onChange={e => changeDraft('name', e.target.value)} placeholder="Bankily" /></label><label className="text-sm font-bold">Code *<input className={input} value={draft.code} onChange={e => changeDraft('code', e.target.value)} placeholder="bankily" /></label><label className="text-sm font-bold">Numéro de réception *<input dir="ltr" className={input} value={draft.payment_number} onChange={e => changeDraft('payment_number', e.target.value)} /></label><label className="text-sm font-bold">Ordre d’affichage<input type="number" min="0" step="1" className={input} value={draft.sort_order} onChange={e => changeDraft('sort_order', e.target.value)} /></label></div><label className="mt-4 block text-sm font-bold">Logo (JPG, PNG, WEBP · 5 MB max)<input type="file" accept="image/jpeg,image/png,image/webp" className={`${input} file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-bold file:text-blue-700`} onChange={e => setImageFile(e.target.files?.[0] || null)} />{editing?.image_path && <span className="mt-1 block text-xs font-normal text-slate-400">Une nouvelle image remplacera l’ancienne.</span>}</label><label className="mt-4 block text-sm font-bold">Instructions en français<textarea rows={3} className={input} value={draft.instructions_fr} onChange={e => changeDraft('instructions_fr', e.target.value)} /></label><label className="mt-4 block text-sm font-bold">التعليمات بالعربية<textarea dir="rtl" rows={3} className={input} value={draft.instructions_ar} onChange={e => changeDraft('instructions_ar', e.target.value)} /></label><label className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold"><input type="checkbox" checked={draft.is_active} onChange={e => changeDraft('is_active', e.target.checked)} className="h-5 w-5 accent-blue-600" />Moyen actif et visible pour les clients</label><div className="mt-6 flex justify-end gap-2"><button disabled={saving} className={secondary} onClick={() => setEditor(false)}>Annuler</button><button disabled={saving} className={primary} onClick={() => void saveMethod()}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button></div></div></div>}
    {preview && <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/90 p-3" onClick={() => setPreview(null)}><div className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-900 text-white" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between border-b border-white/10 p-4"><div><p className="text-sm font-bold">Preuve de paiement · {preview.order.order_number}</p><p className="text-xs text-slate-400">{preview.order.payment_method_name} · {preview.order.payment_sender_number}</p></div><button className="text-2xl" onClick={() => setPreview(null)}>×</button></div><div className="min-h-0 overflow-auto p-4 text-center"><img src={preview.url} alt={`Preuve ${preview.order.order_number}`} className="mx-auto max-h-[70dvh] max-w-full object-contain" /></div><div className="border-t border-white/10 p-3 text-center text-sm font-bold">{money(preview.order.total_amount, preview.order.currency)}</div></div></div>}
    {confirmOrder && <div className="fixed inset-0 z-[230] flex items-center justify-center bg-slate-950/70 p-3"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-extrabold">Confirmer le paiement ?</h2><p className="mt-3 text-sm leading-6 text-slate-600">Vous confirmez avoir réellement reçu <strong>{money(confirmOrder.total_amount, confirmOrder.currency)}</strong> pour la commande <strong>{confirmOrder.order_number}</strong>.</p>{statusOf(confirmOrder.status) === 'payment_partial' && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Vérifiez le versement du solde avant de valider la totalité.</p>}<p className="mt-3 text-xs text-slate-500">Vous serez redirigé vers la commande à traiter.</p><div className="mt-6 flex justify-end gap-2"><button disabled={Boolean(busy)} className={secondary} onClick={() => setConfirmOrder(null)}>Annuler</button><button disabled={Boolean(busy)} className={primary} onClick={() => void confirm()}>{busy ? 'Validation…' : 'Confirmer et traiter'}</button></div></div></div>}
    {partialOrder && <div className="fixed inset-0 z-[230] flex items-end justify-center bg-slate-950/70 sm:items-center sm:p-4"><div role="dialog" aria-modal="true" className="max-h-[95dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl"><h2 className="text-xl font-extrabold">Demander un complément</h2><p className="mt-1 text-sm font-bold text-blue-700">{partialOrder.order_number}</p><p className="mt-4 rounded-xl bg-slate-900 p-4 font-extrabold text-white">Total attendu : {money(partialOrder.total_amount, partialOrder.currency)}</p><label className="mt-4 block text-sm font-bold">Montant réellement reçu<input type="number" min="0" step="0.01" className={input} value={received} onChange={e => setReceived(e.target.value)} /></label>{Number.isFinite(parsedReceived) && parsedReceived > 0 && <p className="mt-3 rounded-xl bg-orange-50 p-3 text-sm font-bold text-orange-800">Reste : {money(Math.max(0, Number(partialOrder.total_amount) - parsedReceived), partialOrder.currency)}</p>}<label className="mt-4 block text-sm font-bold">Message au client<textarea rows={4} className={input} value={partialNote} onChange={e => setPartialNote(e.target.value)} placeholder="Montant manquant et instructions…" /></label><div className="mt-6 flex justify-end gap-2"><button disabled={Boolean(busy)} className={secondary} onClick={() => setPartialOrder(null)}>Annuler</button><button disabled={!canPartial} className={primary} onClick={() => void savePartial()}>{busy ? 'Enregistrement…' : 'Demander le complément'}</button></div></div></div>}
    {rejectOrder && <div className="fixed inset-0 z-[230] flex items-end justify-center bg-slate-950/70 sm:items-center sm:p-4"><div role="dialog" aria-modal="true" className="max-h-[95dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl"><h2 className="text-xl font-extrabold">Refuser le paiement</h2><p className="mt-1 text-sm font-bold text-blue-700">{rejectOrder.order_number}</p><p className="mt-3 rounded-xl bg-orange-50 p-3 text-xs text-orange-800">Si le montant est insuffisant, préférez « Paiement partiel ».</p><div className="mt-4 space-y-2">{reasons.map(r => <label key={r[0]} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${reasonCode === r[0] ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}><input type="radio" name="rejection-reason" checked={reasonCode === r[0]} onChange={() => setReasonCode(r[0])} className="accent-rose-600" /><span><strong className="block text-sm">{r[1]}</strong><span className="text-xs text-slate-500">{r[2]}</span></span></label>)}</div>{reasonCode === 'other' && <textarea rows={3} className={input} value={otherReason} onChange={e => setOtherReason(e.target.value)} placeholder="Motif précis du refus…" />}<div className="mt-6 flex justify-end gap-2"><button disabled={Boolean(busy)} className={secondary} onClick={() => setRejectOrder(null)}>Annuler</button><button disabled={!rejectReason || Boolean(busy)} className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50" onClick={() => void reject()}>{busy ? 'Enregistrement…' : 'Confirmer le refus'}</button></div></div></div>}
  </div>;
}
