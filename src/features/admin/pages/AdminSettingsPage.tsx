import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../../../lib/supabase'

type SettingsTab = 'store' | 'payments' | 'orders' | 'reviews' | 'maintenance'
type StoreSettings = { storeName: string; sloganFr: string; sloganAr: string; currency: string; country: string }
type SupportSettings = { phone: string; whatsapp: string; whatsappActive: boolean; email: string; supportMessageFr: string; supportMessageAr: string }
type PaymentId = 'bankily' | 'masrvi' | 'sedad'
type PaymentSettings = { id: PaymentId; name: string; number: string; active: boolean; instructionsFr: string; instructionsAr: string }
type OrderSettings = { estimatedProcessingMinutes: number; allowDisputes: boolean; disputeWindowHours: number; customerConfirmationRequired: boolean; paymentReviewMessageFr: string; paymentReviewMessageAr: string; processingMessageFr: string; processingMessageAr: string }
type ReviewSettings = { enabled: boolean; allowComment: boolean; publicReviews: boolean; minimumPublicRating: number; showAverageRating: boolean }
type MaintenanceSettings = { enabled: boolean; messageFr: string; messageAr: string }
type AppSettingsRow = { setting_key: string; setting_value: Record<string, unknown> | null; updated_at: string | null }
type ToastState = { type: 'success' | 'error' | 'info'; title: string; message?: string }

const defaultStoreSettings: StoreSettings = { storeName: 'TEO STORE', sloganFr: 'Services numériques simples et rapides', sloganAr: 'خدمات رقمية بسيطة وسريعة', currency: 'MRU', country: 'Mauritanie' }
const defaultSupportSettings: SupportSettings = { phone: '', whatsapp: '34342869', whatsappActive: true, email: '', supportMessageFr: 'Bonjour TEO STORE, j’ai besoin d’aide.', supportMessageAr: 'مرحبًا TEO STORE، أحتاج إلى المساعدة.' }
const defaultPayments: PaymentSettings[] = (['bankily', 'masrvi', 'sedad'] as const).map(id => ({ id, name: id === 'bankily' ? 'Bankily' : id === 'masrvi' ? 'Masrvi' : 'Sedad', number: '37109097', active: true, instructionsFr: 'Effectuez le paiement puis envoyez la preuve.', instructionsAr: 'قم بالدفع ثم أرسل إثبات العملية.' }))
const defaultOrderSettings: OrderSettings = { estimatedProcessingMinutes: 30, allowDisputes: true, disputeWindowHours: 72, customerConfirmationRequired: true, paymentReviewMessageFr: 'Votre paiement est en cours de vérification.', paymentReviewMessageAr: 'عملية الدفع قيد التحقق.', processingMessageFr: 'Votre commande est en cours de préparation.', processingMessageAr: 'طلبك قيد التجهيز.' }
const defaultReviewSettings: ReviewSettings = { enabled: true, allowComment: true, publicReviews: false, minimumPublicRating: 4, showAverageRating: false }
const defaultMaintenanceSettings: MaintenanceSettings = { enabled: false, messageFr: 'TEO STORE est temporairement en maintenance.', messageAr: 'TEO STORE قيد الصيانة مؤقتًا.' }

const normalizeWhatsapp = (value: string) => { const digits = value.replace(/\D/g, ''); return digits.length === 8 ? `222${digits}` : digits }
const editWhatsapp = (value: unknown) => { const digits = typeof value === 'string' ? value.replace(/\D/g, '') : ''; return digits.startsWith('222') && digits.length === 11 ? digits.slice(3) : digits }
const asObject = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const mergeKnown = <T extends object>(defaults: T, value: unknown): T => {
  const source = asObject(value)
  const result = { ...defaults } as Record<string, unknown>
  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (typeof source[key] === typeof defaultValue) result[key] = source[key]
  }
  return result as T
}

function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('store')
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings)
  const [supportSettings, setSupportSettings] = useState<SupportSettings>(defaultSupportSettings)
  const [payments, setPayments] = useState<PaymentSettings[]>(defaultPayments)
  const [orderSettings, setOrderSettings] = useState<OrderSettings>(defaultOrderSettings)
  const [reviewSettings, setReviewSettings] = useState<ReviewSettings>(defaultReviewSettings)
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings>(defaultMaintenanceSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)
  const mountedRef = useRef(true)
  const loadSequenceRef = useRef(0)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const markDirty = () => { dirtyRef.current = true; setIsDirty(true) }
  const changeStore = (values: Partial<StoreSettings>) => { markDirty(); setStoreSettings(current => ({ ...current, ...values })) }
  const changeSupport = (values: Partial<SupportSettings>) => { markDirty(); setSupportSettings(current => ({ ...current, ...values })) }
  const changeOrder = (values: Partial<OrderSettings>) => { markDirty(); setOrderSettings(current => ({ ...current, ...values })) }
  const changeReview = (values: Partial<ReviewSettings>) => { markDirty(); setReviewSettings(current => ({ ...current, ...values })) }
  const changeMaintenance = (values: Partial<MaintenanceSettings>) => { markDirty(); setMaintenanceSettings(current => ({ ...current, ...values })) }
  const updatePayment = (id: PaymentId, values: Partial<PaymentSettings>) => { markDirty(); setPayments(current => current.map(payment => payment.id === id ? { ...payment, ...values } : payment)) }

  const showToast = useCallback((next: ToastState) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    if (!mountedRef.current) return
    setToast(next)
    toastTimerRef.current = setTimeout(() => { if (mountedRef.current) setToast(null) }, 4200)
  }, [])

  const loadSettings = useCallback(async (initial = false, force = false) => {
    if (!force && (dirtyRef.current || savingRef.current)) return
    const sequence = ++loadSequenceRef.current
    if (initial) setIsLoading(true)
    setLoadError(null)
    const { data, error } = await supabase.from('app_settings').select('setting_key, setting_value, updated_at')
    if (!mountedRef.current || sequence !== loadSequenceRef.current) return
    if (error) {
      console.error('Unable to load settings:', error)
      setLoadError(error.message)
      if (initial) setIsLoading(false)
      return
    }
    if (!force && (dirtyRef.current || savingRef.current)) { if (initial) setIsLoading(false); return }
    const rows = (data ?? []) as AppSettingsRow[]
    const findValue = (key: string) => rows.find(row => row.setting_key === key)?.setting_value
    setStoreSettings(mergeKnown(defaultStoreSettings, findValue('store')))
    const support = mergeKnown(defaultSupportSettings, findValue('support'))
    const whatsapp = asObject(findValue('support_whatsapp'))
    setSupportSettings({
      ...support,
      whatsappActive: typeof whatsapp.active === 'boolean' ? whatsapp.active : support.whatsappActive,
      whatsapp: typeof whatsapp.number === 'string' ? editWhatsapp(whatsapp.number) : editWhatsapp(support.whatsapp),
      supportMessageFr: typeof whatsapp.messageFr === 'string' ? whatsapp.messageFr : support.supportMessageFr,
      supportMessageAr: typeof whatsapp.messageAr === 'string' ? whatsapp.messageAr : support.supportMessageAr,
    })
    setPayments(defaultPayments.map(defaultPayment => ({ ...mergeKnown(defaultPayment, findValue(`payment_${defaultPayment.id}`)), id: defaultPayment.id })))
    setOrderSettings(mergeKnown(defaultOrderSettings, findValue('orders')))
    setReviewSettings(mergeKnown(defaultReviewSettings, findValue('reviews')))
    setMaintenanceSettings(mergeKnown(defaultMaintenanceSettings, findValue('maintenance')))
    const latest = rows.map(row => row.updated_at).filter((value): value is string => Boolean(value)).sort().at(-1)
    setLastUpdatedAt(latest ?? null)
    if (initial) setIsLoading(false)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    void loadSettings(true)
    const channel = supabase.channel('admin-settings-live').on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => { if (!dirtyRef.current && !savingRef.current) void loadSettings() }).subscribe()
    return () => {
      mountedRef.current = false
      loadSequenceRef.current += 1
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      void supabase.removeChannel(channel)
    }
  }, [loadSettings])

  const handleSaveAll = async () => {
    if (savingRef.current) return
    const number = normalizeWhatsapp(supportSettings.whatsapp)
    if (supportSettings.whatsappActive && !/^222\d{8}$/.test(number)) {
      showToast({ type: 'error', title: 'Numéro WhatsApp invalide', message: 'Saisissez 8 chiffres mauritaniens ou 222 suivi de 8 chiffres.' })
      return
    }
    if (!storeSettings.storeName.trim() || !storeSettings.currency.trim()) {
      showToast({ type: 'error', title: 'Informations manquantes', message: 'Le nom de TEO STORE et la devise sont obligatoires.' })
      return
    }
    if (payments.some(payment => payment.active && !payment.number.trim())) {
      showToast({ type: 'error', title: 'Paiement incomplet', message: 'Chaque moyen de paiement actif doit avoir un numéro de réception.' })
      return
    }
    if (orderSettings.estimatedProcessingMinutes < 1 || orderSettings.disputeWindowHours < 1 || reviewSettings.minimumPublicRating < 1 || reviewSettings.minimumPublicRating > 5) {
      showToast({ type: 'error', title: 'Valeurs incorrectes', message: 'Vérifiez les délais et la note minimale.' })
      return
    }
    savingRef.current = true
    setIsSaving(true)
    loadSequenceRef.current += 1
    const entries: Array<[string, Record<string, unknown>]> = [
      ['store', { ...storeSettings }],
      ['support', { phone: supportSettings.phone, whatsapp: supportSettings.whatsapp, email: supportSettings.email, supportMessageFr: supportSettings.supportMessageFr, supportMessageAr: supportSettings.supportMessageAr }],
      ['support_whatsapp', { active: supportSettings.whatsappActive, number, messageFr: supportSettings.supportMessageFr, messageAr: supportSettings.supportMessageAr }],
      ...payments.map((payment): [string, Record<string, unknown>] => [`payment_${payment.id}`, { ...payment }]),
      ['orders', { ...orderSettings }],
      ['reviews', { ...reviewSettings }],
      ['maintenance', { ...maintenanceSettings }],
    ]
    try {
      // One request avoids parallel partial writes. True atomicity still requires a database transaction/RPC.
      const { error } = await supabase.from('app_settings').upsert(entries.map(([setting_key, setting_value]) => ({ setting_key, setting_value, is_public: true })), { onConflict: 'setting_key' })
      if (error) throw error
      dirtyRef.current = false
      setIsDirty(false)
      showToast({ type: 'success', title: 'Paramètres enregistrés', message: 'Les modifications de TEO STORE ont été enregistrées.' })
      const { data } = await supabase.from('app_settings').select('updated_at').order('updated_at', { ascending: false }).limit(1)
      if (mountedRef.current && data?.[0]?.updated_at) setLastUpdatedAt(data[0].updated_at)
    } catch (error) {
      console.error('Unable to save settings:', error)
      showToast({ type: 'error', title: 'Enregistrement impossible', message: error instanceof Error ? error.message : 'Une erreur inattendue est survenue.' })
    } finally {
      savingRef.current = false
      if (mountedRef.current) setIsSaving(false)
    }
  }

  const formatDate = (value: string | null) => {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('fr-FR-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short', numberingSystem: 'latn' }).format(date)
  }

  const tabs: Array<{ id: SettingsTab; label: string; description: string }> = [
    { id: 'store', label: 'TEO STORE', description: 'Identité et support' },
    { id: 'payments', label: 'Paiements', description: 'Bankily, Masrvi, Sedad' },
    { id: 'orders', label: 'Commandes', description: 'Workflow client' },
    { id: 'reviews', label: 'Évaluations', description: 'Avis clients' },
    { id: 'maintenance', label: 'Système', description: 'Maintenance' },
  ]

  if (isLoading) return <div dir="ltr" className="flex min-h-[420px] items-center justify-center"><div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" /><p className="mt-4 text-sm font-black text-slate-500">Chargement des paramètres...</p></div></div>

  return <div dir="ltr" className="min-w-0 pb-10">
    {toast && <div className="fixed right-4 top-4 z-[300] w-[calc(100%-2rem)] max-w-sm"><div className={`rounded-[18px] border bg-white p-4 shadow-xl ${toast.type === 'success' ? 'border-emerald-200' : toast.type === 'error' ? 'border-rose-200' : 'border-blue-200'}`}><div className="flex items-start gap-3"><span className="text-xl font-black">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '!' : 'i'}</span><div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-950">{toast.title}</p>{toast.message && <p className="mt-1 text-sm text-slate-500">{toast.message}</p>}</div><button type="button" onClick={() => setToast(null)} aria-label="Fermer" className="text-xl text-slate-400">×</button></div></div></div>}
    <section className="relative overflow-hidden rounded-[28px] border border-slate-800/40 p-5 text-white shadow-xl sm:p-7" style={{ background: 'linear-gradient(135deg,#020617 0%,#10265b 52%,#312e81 100%)' }}>
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between"><div><p className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black tracking-widest text-white/70">TEO STORE CONTROL CENTER</p><h1 className="mt-5 text-3xl font-black sm:text-4xl">Paramètres</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">Gérez les services numériques, les paiements, les commandes, les évaluations et l'état du système.</p>{isDirty && <p className="mt-2 text-xs font-bold text-amber-300">Modifications non enregistrées</p>}</div><div className="flex flex-col gap-2 sm:flex-row"><div className="rounded-[15px] border border-white/10 bg-white/[0.06] px-4 py-3"><p className="text-xs font-black text-white/40">Dernière modification</p><p className="mt-1 text-sm font-black">{formatDate(lastUpdatedAt)}</p></div><button type="button" onClick={() => void handleSaveAll()} disabled={isSaving || Boolean(loadError)} className="min-h-[54px] rounded-[15px] bg-blue-500 px-6 text-sm font-black text-white disabled:opacity-50">{isSaving ? 'Enregistrement...' : 'Enregistrer tout'}</button></div></div>
    </section>
    {loadError && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="font-black text-rose-700">Impossible de charger les paramètres</p><p className="mt-1 text-sm text-rose-600">{loadError}</p><button type="button" className="mt-3 text-sm font-bold text-rose-700 underline" onClick={() => void loadSettings(true)}>Réessayer</button></div>}
    <div className="mt-5 grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]"><aside className="h-fit rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm">{tabs.map(tab => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`mb-1 w-full rounded-[14px] px-4 py-3 text-left transition last:mb-0 ${activeTab === tab.id ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-50'}`}><p className="text-sm font-black">{tab.label}</p><p className={`mt-1 text-xs ${activeTab === tab.id ? 'text-white/50' : 'text-slate-400'}`}>{tab.description}</p></button>)}</aside><div className="min-w-0">
      {activeTab === 'store' && <div className="space-y-4"><SettingsCard title="Identité de TEO STORE" description="Informations générales visibles sur TEO STORE."><div className="grid gap-4 sm:grid-cols-2"><TextField label="Nom de la plateforme" value={storeSettings.storeName} onChange={value => changeStore({ storeName: value })} /><TextField label="Devise" value={storeSettings.currency} onChange={value => changeStore({ currency: value })} /><TextField label="Pays" value={storeSettings.country} onChange={value => changeStore({ country: value })} /><div /><TextAreaField label="Slogan français" value={storeSettings.sloganFr} onChange={value => changeStore({ sloganFr: value })} /><TextAreaField label="Slogan arabe" dir="rtl" value={storeSettings.sloganAr} onChange={value => changeStore({ sloganAr: value })} /></div></SettingsCard><SettingsCard title="Support client" description="Coordonnées utilisées pour aider les clients." action={<Toggle checked={supportSettings.whatsappActive} label={supportSettings.whatsappActive ? 'WhatsApp actif' : 'WhatsApp inactif'} onChange={checked => changeSupport({ whatsappActive: checked })} />}><div className="grid gap-4 sm:grid-cols-2"><TextField label="Téléphone" value={supportSettings.phone} onChange={value => changeSupport({ phone: value })} /><div><TextField label="WhatsApp" value={supportSettings.whatsapp} onChange={value => changeSupport({ whatsapp: value })} /><p className="mt-2 text-xs text-slate-400">Saisissez 8 chiffres. L’indicatif 222 est ajouté lors de l’enregistrement.</p></div><TextField label="E-mail" type="email" value={supportSettings.email} onChange={value => changeSupport({ email: value })} /><div /><TextAreaField label="Message WhatsApp français" value={supportSettings.supportMessageFr} onChange={value => changeSupport({ supportMessageFr: value })} /><TextAreaField label="Message WhatsApp arabe" dir="rtl" value={supportSettings.supportMessageAr} onChange={value => changeSupport({ supportMessageAr: value })} /></div></SettingsCard></div>}
      {activeTab === 'payments' && <div className="space-y-4">{payments.map(payment => <SettingsCard key={payment.id} title={payment.name} description={`Compte de réception ${payment.name}`} action={<Toggle checked={payment.active} label={payment.active ? 'Actif' : 'Inactif'} onChange={checked => updatePayment(payment.id, { active: checked })} />}><div className="grid gap-4 sm:grid-cols-2"><TextField label="Nom" value={payment.name} onChange={value => updatePayment(payment.id, { name: value })} /><TextField label="Numéro de réception" value={payment.number} onChange={value => updatePayment(payment.id, { number: value })} /><TextAreaField label="Instructions françaises" value={payment.instructionsFr} onChange={value => updatePayment(payment.id, { instructionsFr: value })} /><TextAreaField label="Instructions arabes" dir="rtl" value={payment.instructionsAr} onChange={value => updatePayment(payment.id, { instructionsAr: value })} /></div></SettingsCard>)}</div>}
      {activeTab === 'orders' && <div className="space-y-4"><SettingsCard title="Traitement des commandes" description="Paramètres généraux du workflow client."><div className="grid gap-4 sm:grid-cols-2"><NumberField label="Temps estimé de traitement (minutes)" min={1} value={orderSettings.estimatedProcessingMinutes} onChange={value => changeOrder({ estimatedProcessingMinutes: value })} /><NumberField label="Délai maximum de litige (heures)" min={1} value={orderSettings.disputeWindowHours} onChange={value => changeOrder({ disputeWindowHours: value })} /></div><div className="mt-5 space-y-3"><ToggleRow title="Autoriser les litiges" description="Le client peut signaler un problème après livraison." checked={orderSettings.allowDisputes} onChange={checked => changeOrder({ allowDisputes: checked })} /><ToggleRow title="Confirmation client obligatoire" description="Le client doit confirmer la réception avant de terminer la commande." checked={orderSettings.customerConfirmationRequired} onChange={checked => changeOrder({ customerConfirmationRequired: checked })} /></div></SettingsCard><SettingsCard title="Messages de suivi" description="Textes pouvant être affichés au client pendant le traitement."><div className="grid gap-4 sm:grid-cols-2"><TextAreaField label="Vérification du paiement — français" value={orderSettings.paymentReviewMessageFr} onChange={value => changeOrder({ paymentReviewMessageFr: value })} /><TextAreaField label="Vérification du paiement — arabe" dir="rtl" value={orderSettings.paymentReviewMessageAr} onChange={value => changeOrder({ paymentReviewMessageAr: value })} /><TextAreaField label="Commande en préparation — français" value={orderSettings.processingMessageFr} onChange={value => changeOrder({ processingMessageFr: value })} /><TextAreaField label="Commande en préparation — arabe" dir="rtl" value={orderSettings.processingMessageAr} onChange={value => changeOrder({ processingMessageAr: value })} /></div></SettingsCard></div>}
      {activeTab === 'reviews' && <SettingsCard title="Évaluations clients" description="Contrôlez le système d'avis après commande."><div className="space-y-3"><ToggleRow title="Activer les évaluations" description="Les clients peuvent noter une commande terminée." checked={reviewSettings.enabled} onChange={checked => changeReview({ enabled: checked })} /><ToggleRow title="Autoriser les commentaires" description="Permet au client d'ajouter un commentaire avec les étoiles." checked={reviewSettings.allowComment} onChange={checked => changeReview({ allowComment: checked })} /><ToggleRow title="Afficher les avis publiquement" description="Prépare l'affichage futur des avis sur les pages publiques." checked={reviewSettings.publicReviews} onChange={checked => changeReview({ publicReviews: checked })} /><ToggleRow title="Afficher la note moyenne" description="Affiche la moyenne générale des évaluations." checked={reviewSettings.showAverageRating} onChange={checked => changeReview({ showAverageRating: checked })} /><NumberField label="Note minimum pour affichage public" min={1} max={5} value={reviewSettings.minimumPublicRating} onChange={value => changeReview({ minimumPublicRating: Math.max(1, Math.min(5, value)) })} /></div></SettingsCard>}
      {activeTab === 'maintenance' && <div className="space-y-4"><SettingsCard title="État du site" description="Contrôlez le mode maintenance."><ToggleRow title="Mode maintenance" description="Cette option enregistre le paramètre. Le blocage public nécessite une intégration au layout public." checked={maintenanceSettings.enabled} danger onChange={checked => changeMaintenance({ enabled: checked })} /><div className="mt-5 grid gap-4 sm:grid-cols-2"><TextAreaField label="Message maintenance français" value={maintenanceSettings.messageFr} onChange={value => changeMaintenance({ messageFr: value })} /><TextAreaField label="Message maintenance arabe" dir="rtl" value={maintenanceSettings.messageAr} onChange={value => changeMaintenance({ messageAr: value })} /></div>{maintenanceSettings.enabled && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Le paramètre est activé. Vérifiez que le layout public applique bien le mode maintenance.</div>}</SettingsCard><SettingsCard title="Sécurité" description="Informations importantes concernant les paramètres sensibles."><div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm font-black text-blue-900">Clés privées protégées</p><p className="mt-2 text-sm text-blue-700">Les mots de passe, la Service Role Key Supabase et les secrets serveur ne sont pas modifiables depuis cette page.</p></div></SettingsCard></div>}
      <div className="sticky bottom-3 mt-5"><div className="flex flex-col gap-3 rounded-[18px] border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-slate-900">Enregistrer les modifications</p><p className="mt-0.5 text-xs text-slate-400">Tous les onglets seront enregistrés dans Supabase.</p></div><button type="button" onClick={() => void handleSaveAll()} disabled={isSaving || Boolean(loadError)} className="min-h-[46px] rounded-[13px] bg-blue-600 px-6 text-sm font-black text-white disabled:opacity-50">{isSaving ? 'Enregistrement...' : 'Enregistrer tout'}</button></div></div>
    </div></div>
  </div>
}

type SettingsCardProps = { title: string; description: string; children: ReactNode; action?: ReactNode }
function SettingsCard({ title, description, children, action }: SettingsCardProps) { return <section className="rounded-[22px] border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-400">{description}</p></div>{action}</div><div className="p-5">{children}</div></section> }
type TextFieldProps = { label: string; value: string; onChange: (value: string) => void; type?: string; dir?: 'ltr' | 'rtl' }
function TextField({ label, value, onChange, type = 'text', dir = 'ltr' }: TextFieldProps) { return <label className="block"><span className="text-sm font-black text-slate-700">{label}</span><input type={type} dir={dir} value={value} onChange={event => onChange(event.target.value)} className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500 focus:bg-white" /></label> }
type TextAreaFieldProps = { label: string; value: string; onChange: (value: string) => void; dir?: 'ltr' | 'rtl' }
function TextAreaField({ label, value, onChange, dir = 'ltr' }: TextAreaFieldProps) { return <label className="block"><span className="text-sm font-black text-slate-700">{label}</span><textarea rows={4} dir={dir} value={value} onChange={event => onChange(event.target.value)} className="mt-2 w-full resize-none rounded-[14px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-950 outline-none focus:border-blue-500 focus:bg-white" /></label> }
type NumberFieldProps = { label: string; value: number; min?: number; max?: number; onChange: (value: number) => void }
function NumberField({ label, value, min, max, onChange }: NumberFieldProps) { return <label className="block"><span className="text-sm font-black text-slate-700">{label}</span><input type="number" dir="ltr" min={min} max={max} value={value} onChange={event => { const next = Number(event.target.value); onChange(Number.isFinite(next) ? next : 0) }} className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-left text-sm font-black text-slate-950 outline-none focus:border-blue-500 focus:bg-white" /></label> }
type ToggleProps = { checked: boolean; label?: string; onChange: (checked: boolean) => void }
function Toggle({ checked, label, onChange }: ToggleProps) { return <button type="button" role="switch" aria-checked={checked} aria-label={label ?? 'Changer le statut'} onClick={() => onChange(!checked)} className="flex items-center gap-2">{label && <span className={`text-sm font-black ${checked ? 'text-emerald-600' : 'text-slate-400'}`}>{label}</span>}<span className={`relative block h-7 w-12 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`} /></span></button> }
type ToggleRowProps = { title: string; description: string; checked: boolean; danger?: boolean; onChange: (checked: boolean) => void }
function ToggleRow({ title, description, checked, danger = false, onChange }: ToggleRowProps) { return <div className={`flex flex-col gap-3 rounded-[16px] border p-4 sm:flex-row sm:items-center sm:justify-between ${checked && danger ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}><div><p className={`text-sm font-black ${checked && danger ? 'text-rose-800' : 'text-slate-900'}`}>{title}</p><p className={`mt-1 text-sm leading-5 ${checked && danger ? 'text-rose-600' : 'text-slate-500'}`}>{description}</p></div><div className="shrink-0"><Toggle checked={checked} label={title} onChange={onChange} /></div></div> }
export default AdminSettingsPage
