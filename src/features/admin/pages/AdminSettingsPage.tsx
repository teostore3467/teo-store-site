import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../../../lib/supabase'

type SettingsTab = 'store' | 'preorders' | 'payments' | 'orders' | 'reviews' | 'maintenance'
type StoreSettings = { storeName: string; sloganFr: string; sloganAr: string; currency: string; country: string; logoUrl: string; logoDarkUrl: string; logoFooterUrl: string }
type PreorderItem = { id: string; titleAr: string; titleFr: string; imageUrl: string; price: number; deliveryMinDays: number; deliveryMaxDays: number; whatsappNumber: string; referenceCode: string; visible: boolean }
type PreorderSettings = { enabled: boolean; titleAr: string; titleFr: string; whatsappNumber: string; items: PreorderItem[] }
const defaultPreorderItem = (n: number): PreorderItem => ({ id: `teo-featured-${n}`, titleAr: '', titleFr: '', imageUrl: '', price: 0, deliveryMinDays: 4, deliveryMaxDays: 17, whatsappNumber: '', referenceCode: `TEO-${n}`, visible: false })
const defaultPreorderSettings: PreorderSettings = { enabled: false, titleAr: 'مختارات TEO STORE حسب الطلب', titleFr: 'Sélection TEO STORE sur commande', whatsappNumber: '', items: [defaultPreorderItem(1), defaultPreorderItem(2)] }
const parsePreorderSettings = (value: unknown): PreorderSettings => {
  const source = asObject(value)
  const items = Array.isArray(source.items) ? source.items : []
  return {
    enabled: source.enabled === true,
    titleAr: typeof source.titleAr === 'string' ? source.titleAr : defaultPreorderSettings.titleAr,
    titleFr: typeof source.titleFr === 'string' ? source.titleFr : defaultPreorderSettings.titleFr,
    whatsappNumber: typeof source.whatsappNumber === 'string' ? source.whatsappNumber : '',
    items: [0, 1].map(i => {
      const item = asObject(items[i]); const base = defaultPreorderItem(i + 1)
      return {
        id: typeof item.id === 'string' && item.id ? item.id : base.id,
        titleAr: typeof item.titleAr === 'string' ? item.titleAr : '',
        titleFr: typeof item.titleFr === 'string' ? item.titleFr : '',
        imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '',
        price: typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0,
        deliveryMinDays: typeof item.deliveryMinDays === 'number' ? item.deliveryMinDays : 4,
        deliveryMaxDays: typeof item.deliveryMaxDays === 'number' ? item.deliveryMaxDays : 17,
        whatsappNumber: typeof item.whatsappNumber === 'string' ? item.whatsappNumber : '',
        referenceCode: typeof item.referenceCode === 'string' ? item.referenceCode : base.referenceCode,
        visible: item.visible === true,
      }
    }),
  }
}
type SupportSettings = { phone: string; whatsapp: string; whatsappActive: boolean; email: string; supportMessageFr: string; supportMessageAr: string }
type PaymentId = 'bankily' | 'masrvi' | 'sedad'
type PaymentSettings = { id: PaymentId; name: string; number: string; active: boolean; instructionsFr: string; instructionsAr: string }
type OrderSettings = { estimatedProcessingMinutes: number; allowDisputes: boolean; disputeWindowHours: number; customerConfirmationRequired: boolean; paymentReviewMessageFr: string; paymentReviewMessageAr: string; processingMessageFr: string; processingMessageAr: string }
type ReviewSettings = { enabled: boolean; allowComment: boolean; publicReviews: boolean; minimumPublicRating: number; showAverageRating: boolean }
type MaintenanceSettings = { enabled: boolean; messageFr: string; messageAr: string }
type AppSettingsRow = { setting_key: string; setting_value: Record<string, unknown> | null; updated_at: string | null }
type ToastState = { type: 'success' | 'error' | 'info'; title: string; message?: string }

const defaultStoreSettings: StoreSettings = { storeName: 'TEO STORE', sloganFr: 'Services numériques simples et rapides', sloganAr: 'خدمات رقمية بسيطة وسريعة', currency: 'MRU', country: 'Mauritanie', logoUrl: '', logoDarkUrl: '', logoFooterUrl: '' }
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
  const [showSaveDetails, setShowSaveDetails] = useState(false)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings)
  const [footerSettings, setFooterSettings] = useState<Record<string, unknown>>({})
  const [preorderSettings, setPreorderSettings] = useState<PreorderSettings>(defaultPreorderSettings)
  const [uploadingPreorder, setUploadingPreorder] = useState<number | null>(null)
  const [supportSettings, setSupportSettings] = useState<SupportSettings>(defaultSupportSettings)
  const [payments, setPayments] = useState<PaymentSettings[]>(defaultPayments)
  const [orderSettings, setOrderSettings] = useState<OrderSettings>(defaultOrderSettings)
  const [reviewSettings, setReviewSettings] = useState<ReviewSettings>(defaultReviewSettings)
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings>(defaultMaintenanceSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
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
  const changePreorder = (values: Partial<PreorderSettings>) => { markDirty(); setPreorderSettings(current => ({ ...current, ...values })) }
  const changePreorderItem = (index: number, values: Partial<PreorderItem>) => { markDirty(); setPreorderSettings(current => ({ ...current, items: current.items.map((item, i) => i === index ? { ...item, ...values } : item) })) }
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
    setFooterSettings(asObject(findValue('footer_public')))
    setStoreSettings(mergeKnown(defaultStoreSettings, findValue('store')))
    setPreorderSettings(parsePreorderSettings(findValue('preorder_featured')))
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

  const handleLogoUpload = async (file: File | undefined, field: 'logoUrl' | 'logoDarkUrl' | 'logoFooterUrl' = 'logoUrl') => {
    if (!file) return
    if (!['image/png', 'image/webp'].includes(file.type)) {
      showToast({ type: 'error', title: 'Format non accepté', message: 'Utilisez un PNG ou WebP transparent.' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast({ type: 'error', title: 'Fichier trop volumineux', message: 'Maximum 2 Mo.' })
      return
    }
    setIsUploadingLogo(true)
    try {
      const { data: sessionData } = await supabase.auth.getUser()
      if (!sessionData.user) throw new Error('Connexion administrateur requise')
      const extension = file.type === 'image/png' ? 'png' : 'webp'
      const path = `logos/${crypto.randomUUID()}.${extension}`
      const { error } = await supabase.storage.from('store-branding').upload(path, file, { contentType: file.type, upsert: false, cacheControl: '3600' })
      if (error) throw error
      const { data } = supabase.storage.from('store-branding').getPublicUrl(path)
      changeStore({ [field]: data.publicUrl })
      showToast({ type: 'success', title: 'Logo importé', message: 'Cliquez sur Enregistrer pour publier le nouveau logo.' })
    } catch (error) {
      showToast({ type: 'error', title: 'Import impossible', message: error instanceof Error ? error.message : 'Erreur inconnue' })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handlePreorderImageUpload = async (index: number, file: File | undefined) => {
    if (!file) return
    if (!['image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      showToast({ type: 'error', title: 'Image refusée', message: 'Choisissez PNG ou WebP de 2 Mo maximum.' })
      return
    }
    setUploadingPreorder(index)
    try {
      const { data: session } = await supabase.auth.getUser()
      if (!session.user) throw new Error('Connectez-vous en tant qu’administrateur.')
      const ext = file.type === 'image/png' ? 'png' : 'webp'
      const path = `preorders/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('store-branding').upload(path, file, { contentType: file.type, upsert: false, cacheControl: '3600' })
      if (error) throw error
      const { data } = supabase.storage.from('store-branding').getPublicUrl(path)
      changePreorderItem(index, { imageUrl: data.publicUrl })
      showToast({ type: 'success', title: 'Image ajoutée', message: 'Cliquez sur Enregistrer tout pour publier.' })
    } catch (error) {
      showToast({ type: 'error', title: 'Échec du téléchargement', message: error instanceof Error ? error.message : 'Erreur inconnue' })
    } finally { setUploadingPreorder(null) }
  }

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
    if (preorderSettings.enabled) {
      const active = preorderSettings.items.filter(item => item.visible && item.imageUrl.trim())
      if (active.some(item => (!item.titleAr.trim() && !item.titleFr.trim()) || !Number.isFinite(item.price) || item.price <= 0 || item.deliveryMinDays < 1 || item.deliveryMaxDays < item.deliveryMinDays)) {
        showToast({ type: 'error', title: 'Produits sur commande', message: 'Vérifiez les noms, prix et délais des produits visibles.' }); return
      }
      const phones = [preorderSettings.whatsappNumber, ...active.map(item => item.whatsappNumber)].filter(Boolean)
      if (phones.some(phone => !/^222\d{8}$/.test(normalizeWhatsapp(phone)))) {
        showToast({ type: 'error', title: 'WhatsApp invalide', message: 'Utilisez 8 chiffres mauritaniens ou 222 + 8 chiffres.' }); return
      }
      if (active.length && !active.every(item => item.whatsappNumber || preorderSettings.whatsappNumber || supportSettings.whatsapp)) {
        showToast({ type: 'error', title: 'WhatsApp requis' }); return
      }
    }
    if (isUploadingLogo) { showToast({ type: 'info', title: 'Importation en cours' }); return }
    savingRef.current = true
    setIsSaving(true)
    loadSequenceRef.current += 1
    const entries: Array<[string, Record<string, unknown>]> = [
      ['store', { ...storeSettings }],
      ['footer_public', { ...footerSettings }],
      ['preorder_featured', { ...preorderSettings, whatsappNumber: normalizeWhatsapp(preorderSettings.whatsappNumber || supportSettings.whatsapp), items: preorderSettings.items.map(item => ({ ...item, whatsappNumber: item.whatsappNumber ? normalizeWhatsapp(item.whatsappNumber) : '' })) }],
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
    { id: 'store', label: 'Boutique', description: 'Identité et support' },
    { id: 'preorders', label: 'Sélection sur commande', description: 'Deux produits sur WhatsApp' },
    { id: 'payments', label: 'Paiements', description: 'Bankily, Masrvi, Sedad' },
    { id: 'orders', label: 'Commandes', description: 'Workflow client' },
    { id: 'reviews', label: 'Évaluations', description: 'Avis clients' },
    { id: 'maintenance', label: 'Système', description: 'Maintenance' },
  ]

  if (isLoading) return <div dir="ltr" className="flex min-h-[420px] items-center justify-center"><div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" /><p className="mt-4 text-sm font-black text-slate-500">Chargement des paramètres...</p></div></div>

  return <div dir="ltr" className="min-w-0 pb-10">
    {toast && <div className="fixed right-4 top-4 z-[300] w-[calc(100%-2rem)] max-w-sm"><div className={`rounded-[18px] border bg-white p-4 shadow-xl ${toast.type === 'success' ? 'border-emerald-200' : toast.type === 'error' ? 'border-rose-200' : 'border-blue-200'}`}><div className="flex items-start gap-3"><span className="text-xl font-black">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '!' : 'i'}</span><div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-950">{toast.title}</p>{toast.message && <p className="mt-1 text-sm text-slate-500">{toast.message}</p>}</div><button type="button" onClick={() => setToast(null)} aria-label="Fermer" className="text-xl text-slate-400">×</button></div></div></div>}
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">TEO STORE / Administration</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Paramètres</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Gérez la boutique, les paiements, les commandes, les avis et le système depuis un seul endroit.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-2 text-xs font-black ${isDirty ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
            {isDirty ? '● Modifications à enregistrer' : '✓ Aucune modification en attente'}
          </span>
          <button type="button" onClick={() => void handleSaveAll()} disabled={isSaving || Boolean(loadError) || !isDirty} className="min-h-[44px] rounded-xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-500">Dernière modification : <span className="font-black text-slate-700">{formatDate(lastUpdatedAt)}</span></p>
        <button type="button" onClick={() => setShowSaveDetails(value => !value)} className="text-xs font-bold text-blue-600 hover:underline">{showSaveDetails ? 'Masquer les informations' : 'Informations sur l’enregistrement'}</button>
      </div>
      {showSaveDetails && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">Le bouton Enregistrer sauvegarde les modifications de tous les onglets dans Supabase. Les changements non enregistrés restent dans ce navigateur tant que la page est ouverte.</p>}
    </section>
    {loadError && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="font-black text-rose-700">Impossible de charger les paramètres</p><p className="mt-1 text-sm text-rose-600">{loadError}</p><button type="button" className="mt-3 text-sm font-bold text-rose-700 underline" onClick={() => void loadSettings(true)}>Réessayer</button></div>}
    <div className="mt-5 grid items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-2 shadow-sm">
        <p className="px-3 pb-2 pt-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Navigation</p>
        <nav aria-label="Sections des paramètres" className="grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-1">
          {tabs.map((tab, index) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined} className={`flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition ${activeTab === tab.id ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100' : 'text-slate-700 hover:bg-slate-50'}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{String(index + 1).padStart(2, '0')}</span>
            <span className="min-w-0"><span className="block truncate text-sm font-black">{tab.label}</span><span className="hidden truncate text-xs text-slate-400 xl:block">{tab.description}</span></span>
          </button>)}
        </nav>
        <div className="mx-2 mt-3 hidden rounded-xl bg-slate-50 p-3 xl:block"><p className="text-xs font-black text-slate-700">Sauvegarde globale</p><p className="mt-1 text-xs leading-5 text-slate-500">Modifiez plusieurs sections, puis enregistrez une seule fois.</p></div>
      </aside>
      <main className="min-w-0">
        <div className="mb-4 rounded-[18px] border border-slate-200 bg-white px-5 py-4 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-blue-600">Section {tabs.findIndex(tab => tab.id === activeTab) + 1} / {tabs.length}</p><h2 className="mt-1 text-xl font-black text-slate-950">{tabs.find(tab => tab.id === activeTab)?.label}</h2><p className="mt-1 text-sm text-slate-500">{tabs.find(tab => tab.id === activeTab)?.description}</p></div>
      {activeTab === 'store' && <div className="space-y-4"><SettingsCard title="Identité de TEO STORE" description="Informations générales visibles sur TEO STORE."><div className="grid gap-4 sm:grid-cols-2"><TextField label="Nom de la plateforme" value={storeSettings.storeName} onChange={value => changeStore({ storeName: value })} /><TextField label="Devise" value={storeSettings.currency} onChange={value => changeStore({ currency: value })} /><TextField label="Pays" value={storeSettings.country} onChange={value => changeStore({ country: value })} /><div /><TextAreaField label="Slogan français" value={storeSettings.sloganFr} onChange={value => changeStore({ sloganFr: value })} /><TextAreaField label="Slogan arabe" dir="rtl" value={storeSettings.sloganAr} onChange={value => changeStore({ sloganAr: value })} /></div></SettingsCard><SettingsCard title="Identité visuelle / الهوية البصرية" description="PNG ou WebP transparent, maximum 2 Mo par image."><div className="grid gap-4 md:grid-cols-3">{([{ field: 'logoUrl', title: 'Header — Clair / نهاري', bg: '#ffffff' }, { field: 'logoDarkUrl', title: 'Header — Sombre / ليلي', bg: '#111827' }, { field: 'logoFooterUrl', title: 'Footer / أسفل الموقع', bg: '#0b1428' }] as const).map(({ field, title, bg }) => <div key={field} className="space-y-3 rounded-xl border border-slate-200 p-3"><p className="text-sm font-bold">{title}</p><div className="flex h-24 items-center justify-center rounded-lg p-3" style={{ background: bg }}>{storeSettings[field] ? <img src={storeSettings[field]} alt={title} className="max-h-full max-w-full object-contain" style={{ background: 'transparent' }} /> : <span className="text-xs" style={{ color: field === 'logoUrl' ? '#64748b' : '#cbd5e1' }}>Aucun logo</span>}</div><label className="inline-flex cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white">{isUploadingLogo ? 'Importation...' : 'Choisir / رفع'}<input type="file" accept="image/png,image/webp" className="sr-only" disabled={isUploadingLogo || isSaving} onChange={event => { void handleLogoUpload(event.target.files?.[0], field); event.currentTarget.value = '' }} /></label>{storeSettings[field] && <button type="button" disabled={isUploadingLogo || isSaving} onClick={() => changeStore({ [field]: '' })} className="block text-sm text-rose-600">Supprimer / إزالة</button>}</div>)}</div><p className="mt-3 text-xs text-slate-500">Cliquez sur Enregistrer après l’import.</p></SettingsCard><SettingsCard title="Réseaux sociaux / التواصل الاجتماعي" description="Liens HTTPS. Laissez vide pour masquer une icône."><div className="grid gap-4 sm:grid-cols-3">{(['facebook', 'tiktok', 'instagram'] as const).map(key => <TextField key={key} label={key === 'facebook' ? 'Facebook' : key === 'tiktok' ? 'TikTok' : 'Instagram'} value={typeof footerSettings[key] === 'string' ? String(footerSettings[key]) : ''} onChange={value => { markDirty(); setFooterSettings(current => ({ ...current, [key]: value.trim() })) }} />)}</div></SettingsCard><SettingsCard title="Support client" description="Coordonnées utilisées pour aider les clients." action={<Toggle checked={supportSettings.whatsappActive} label={supportSettings.whatsappActive ? 'WhatsApp actif' : 'WhatsApp inactif'} onChange={checked => changeSupport({ whatsappActive: checked })} />}><div className="grid gap-4 sm:grid-cols-2"><TextField label="Téléphone" value={supportSettings.phone} onChange={value => changeSupport({ phone: value })} /><div><TextField label="WhatsApp" value={supportSettings.whatsapp} onChange={value => changeSupport({ whatsapp: value })} /><p className="mt-2 text-xs text-slate-400">Saisissez 8 chiffres. L’indicatif 222 est ajouté lors de l’enregistrement.</p></div><TextField label="E-mail" type="email" value={supportSettings.email} onChange={value => changeSupport({ email: value })} /><div /><TextAreaField label="Message WhatsApp français" value={supportSettings.supportMessageFr} onChange={value => changeSupport({ supportMessageFr: value })} /><TextAreaField label="Message WhatsApp arabe" dir="rtl" value={supportSettings.supportMessageAr} onChange={value => changeSupport({ supportMessageAr: value })} /></div></SettingsCard></div>}
      {activeTab === 'preorders' && <div className="space-y-4">
        <SettingsCard title="Sélection Premium — TEO STORE" description="Choisissez jusqu’à deux produits sur commande. Une carte sans image ou désactivée est automatiquement masquée sur l’accueil." action={<Toggle checked={preorderSettings.enabled} label={preorderSettings.enabled ? 'Section visible' : 'Section masquée'} onChange={enabled => changePreorder({ enabled })} />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Titre français" value={preorderSettings.titleFr} onChange={titleFr => changePreorder({ titleFr })} />
            <TextField label="العنوان بالعربية" dir="rtl" value={preorderSettings.titleAr} onChange={titleAr => changePreorder({ titleAr })} />
            <TextField label="WhatsApp par défaut (8 chiffres)" value={preorderSettings.whatsappNumber} onChange={whatsappNumber => changePreorder({ whatsappNumber })} />
          </div>
          <p className="mt-3 text-xs text-slate-500">Le numéro de support est utilisé si vous laissez le WhatsApp de cette section vide. La référence produit n’est pas un numéro de suivi de commande.</p>
        </SettingsCard>
        {preorderSettings.items.map((item, index) => <SettingsCard key={item.id} title={`Produit ${index + 1} / المنتج ${index + 1}`} description="Un produit sans photo ne sera pas affiché." action={<Toggle checked={item.visible} label={item.visible ? 'Afficher' : 'Masquer'} onChange={visible => changePreorderItem(index, { visible })} />}>
          <div className="grid gap-5 lg:grid-cols-[190px_1fr]">
            <div className="space-y-3">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.titleFr || item.titleAr || 'Produit'} className="h-full w-full object-contain" /> : <span className="px-3 text-center text-sm text-slate-400">Aucune photo</span>}
              </div>
              <label className="flex cursor-pointer justify-center rounded-xl bg-blue-600 px-3 py-3 text-center text-xs font-bold text-white hover:bg-blue-700">
                {uploadingPreorder === index ? 'Téléchargement...' : 'Importer une photo PNG / WebP'}
                <input type="file" accept="image/png,image/webp" className="sr-only" disabled={uploadingPreorder !== null} onChange={event => { void handlePreorderImageUpload(index, event.target.files?.[0]); event.currentTarget.value = '' }} />
              </label>
              {item.imageUrl && <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => changePreorderItem(index, { imageUrl: '', visible: false })}>Retirer la photo et masquer</button>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Nom français" value={item.titleFr} onChange={titleFr => changePreorderItem(index, { titleFr })} />
              <TextField label="اسم المنتج بالعربية" dir="rtl" value={item.titleAr} onChange={titleAr => changePreorderItem(index, { titleAr })} />
              <NumberField label="Prix (MRU / أوقية جديدة)" min={0} value={item.price} onChange={price => changePreorderItem(index, { price })} />
              <TextField label="Référence du produit" value={item.referenceCode} onChange={referenceCode => changePreorderItem(index, { referenceCode })} />
              <NumberField label="Livraison minimum (jours)" min={1} value={item.deliveryMinDays} onChange={deliveryMinDays => changePreorderItem(index, { deliveryMinDays })} />
              <NumberField label="Livraison maximum (jours)" min={1} value={item.deliveryMaxDays} onChange={deliveryMaxDays => changePreorderItem(index, { deliveryMaxDays })} />
              <TextField label="WhatsApp spécifique (facultatif)" value={item.whatsappNumber} onChange={whatsappNumber => changePreorderItem(index, { whatsappNumber })} />
            </div>
          </div>
        </SettingsCard>)}
        <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">Après vos modifications, cliquez sur « Enregistrer tout ». Le suivi des commandes par code nécessite un système de commandes distinct ; le bouton WhatsApp transmet pour le moment la référence du produit.</p>
      </div>}
      {activeTab === 'payments' && <div className="space-y-4">{payments.map(payment => <SettingsCard key={payment.id} title={payment.name} description={`Compte de réception ${payment.name}`} action={<Toggle checked={payment.active} label={payment.active ? 'Actif' : 'Inactif'} onChange={checked => updatePayment(payment.id, { active: checked })} />}><div className="grid gap-4 sm:grid-cols-2"><TextField label="Nom" value={payment.name} onChange={value => updatePayment(payment.id, { name: value })} /><TextField label="Numéro de réception" value={payment.number} onChange={value => updatePayment(payment.id, { number: value })} /><TextAreaField label="Instructions françaises" value={payment.instructionsFr} onChange={value => updatePayment(payment.id, { instructionsFr: value })} /><TextAreaField label="Instructions arabes" dir="rtl" value={payment.instructionsAr} onChange={value => updatePayment(payment.id, { instructionsAr: value })} /></div></SettingsCard>)}</div>}
      {activeTab === 'orders' && <div className="space-y-4"><SettingsCard title="Traitement des commandes" description="Paramètres généraux du workflow client."><div className="grid gap-4 sm:grid-cols-2"><NumberField label="Temps estimé de traitement (minutes)" min={1} value={orderSettings.estimatedProcessingMinutes} onChange={value => changeOrder({ estimatedProcessingMinutes: value })} /><NumberField label="Délai maximum de litige (heures)" min={1} value={orderSettings.disputeWindowHours} onChange={value => changeOrder({ disputeWindowHours: value })} /></div><div className="mt-5 space-y-3"><ToggleRow title="Autoriser les litiges" description="Le client peut signaler un problème après livraison." checked={orderSettings.allowDisputes} onChange={checked => changeOrder({ allowDisputes: checked })} /><ToggleRow title="Confirmation client obligatoire" description="Le client doit confirmer la réception avant de terminer la commande." checked={orderSettings.customerConfirmationRequired} onChange={checked => changeOrder({ customerConfirmationRequired: checked })} /></div></SettingsCard><SettingsCard title="Messages de suivi" description="Textes pouvant être affichés au client pendant le traitement."><div className="grid gap-4 sm:grid-cols-2"><TextAreaField label="Vérification du paiement — français" value={orderSettings.paymentReviewMessageFr} onChange={value => changeOrder({ paymentReviewMessageFr: value })} /><TextAreaField label="Vérification du paiement — arabe" dir="rtl" value={orderSettings.paymentReviewMessageAr} onChange={value => changeOrder({ paymentReviewMessageAr: value })} /><TextAreaField label="Commande en préparation — français" value={orderSettings.processingMessageFr} onChange={value => changeOrder({ processingMessageFr: value })} /><TextAreaField label="Commande en préparation — arabe" dir="rtl" value={orderSettings.processingMessageAr} onChange={value => changeOrder({ processingMessageAr: value })} /></div></SettingsCard></div>}
      {activeTab === 'reviews' && <SettingsCard title="Évaluations clients" description="Contrôlez le système d'avis après commande."><div className="space-y-3"><ToggleRow title="Activer les évaluations" description="Les clients peuvent noter une commande terminée." checked={reviewSettings.enabled} onChange={checked => changeReview({ enabled: checked })} /><ToggleRow title="Autoriser les commentaires" description="Permet au client d'ajouter un commentaire avec les étoiles." checked={reviewSettings.allowComment} onChange={checked => changeReview({ allowComment: checked })} /><ToggleRow title="Afficher les avis publiquement" description="Prépare l'affichage futur des avis sur les pages publiques." checked={reviewSettings.publicReviews} onChange={checked => changeReview({ publicReviews: checked })} /><ToggleRow title="Afficher la note moyenne" description="Affiche la moyenne générale des évaluations." checked={reviewSettings.showAverageRating} onChange={checked => changeReview({ showAverageRating: checked })} /><NumberField label="Note minimum pour affichage public" min={1} max={5} value={reviewSettings.minimumPublicRating} onChange={value => changeReview({ minimumPublicRating: Math.max(1, Math.min(5, value)) })} /></div></SettingsCard>}
      {activeTab === 'maintenance' && <div className="space-y-4"><SettingsCard title="État du site" description="Contrôlez le mode maintenance."><ToggleRow title="Mode maintenance" description="Cette option enregistre le paramètre. Le blocage public nécessite une intégration au layout public." checked={maintenanceSettings.enabled} danger onChange={checked => changeMaintenance({ enabled: checked })} /><div className="mt-5 grid gap-4 sm:grid-cols-2"><TextAreaField label="Message maintenance français" value={maintenanceSettings.messageFr} onChange={value => changeMaintenance({ messageFr: value })} /><TextAreaField label="Message maintenance arabe" dir="rtl" value={maintenanceSettings.messageAr} onChange={value => changeMaintenance({ messageAr: value })} /></div>{maintenanceSettings.enabled && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Le paramètre est activé. Vérifiez que le layout public applique bien le mode maintenance.</div>}</SettingsCard><SettingsCard title="Sécurité" description="Informations importantes concernant les paramètres sensibles."><div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm font-black text-blue-900">Clés privées protégées</p><p className="mt-2 text-sm text-blue-700">Les mots de passe, la Service Role Key Supabase et les secrets serveur ne sont pas modifiables depuis cette page.</p></div></SettingsCard></div>}
      <div className="sticky bottom-3 z-10 mt-5"><div className="flex flex-col gap-3 rounded-[18px] border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-slate-900">Enregistrer les modifications</p><p className="mt-0.5 text-xs text-slate-400">Tous les onglets seront enregistrés dans Supabase.</p></div><button type="button" onClick={() => void handleSaveAll()} disabled={isSaving || Boolean(loadError) || !isDirty} className="min-h-[46px] rounded-[13px] bg-blue-600 px-6 text-sm font-black text-white disabled:opacity-50">{isSaving ? 'Enregistrement...' : 'Enregistrer tout'}</button></div></div>
      </main>
    </div>
  </div>
}

type SettingsCardProps = { title: string; description: string; children: ReactNode; action?: ReactNode }
function SettingsCard({ title, description, children, action }: SettingsCardProps) { return <section className="rounded-[18px] border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-400">{description}</p></div>{action}</div><div className="p-4 sm:p-5">{children}</div></section> }
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
