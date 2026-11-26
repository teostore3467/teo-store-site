import { copyText } from '../../../lib/copyText'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'
import ServiceLogo from '../components/ServiceLogo'
import { fetchPublicServiceBySlug, type PublicServiceCatalogItem } from '../data/supabaseServiceCatalog'
import {
  getLocalizedCategory,
  getLocalizedCustomerField,
  getLocalizedFulfillmentInstructions,
  getLocalizedFulfillmentLabel,
  getLocalizedFulfillmentWarning,
  getLocalizedGroupShortName,
  getLocalizedPlanLabel,
  getLocalizedServiceName,
} from '../data/serviceCatalogTranslations'

type PaymentMethod = {
  id: string
  code: string
  name: string
  payment_number: string
  image_path: string | null
  instructions_fr: string | null
  instructions_ar: string | null
  is_active: boolean
  sort_order: number
  name_ar: string | null
  name_fr: string | null
  payment_type: string | null
  beneficiary_name: string | null
  payment_network: string | null
  payment_currency: string | null
  receiver_label_ar: string | null
  receiver_label_fr: string | null
  sender_label_ar: string | null
  sender_label_fr: string | null
  qr_image_path: string | null
}

type CheckoutQuote = { plan_id: string; original_price: number; total_mru: number; discount_mru: number; currency: string; checkout_enabled: boolean; discount_type: string; coupon_code?: string | null }

async function fetchCheckoutQuote(planId: string, coupon: string | null): Promise<CheckoutQuote> {
  const { data, error } = await supabase.rpc('teo_v6_checkout_quote', { p_plan_id: planId, p_coupon_code: coupon })
  if (error) throw new Error(error.message)
  const q = data as CheckoutQuote | null
  if (!q || q.plan_id !== planId || q.currency !== 'MRU' || typeof q.checkout_enabled !== 'boolean' || !Number.isFinite(Number(q.total_mru)) || Number(q.total_mru) <= 0 || !Number.isFinite(Number(q.original_price)) || Number(q.total_mru) > Number(q.original_price)) throw new Error('INVALID_QUOTE')
  return { ...q, original_price: Number(q.original_price), total_mru: Number(q.total_mru), discount_mru: Number(q.original_price) - Number(q.total_mru) }
}

const PAYMENT_PROOFS_BUCKET = 'payment-proofs'
const MAX_PAYMENT_PROOF_SIZE = 5 * 1024 * 1024
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isDatabaseId(value: string | undefined): value is string {
  return typeof value === 'string' && uuidPattern.test(value)
}

function paymentImage(method: PaymentMethod) {
  if (!method.image_path) return null
  return supabase.storage.from('payment-methods').getPublicUrl(method.image_path).data.publicUrl
}

function PaymentLogo({ method }: { method: PaymentMethod }) {
  const url = paymentImage(method)
  return url
    ? <img src={url} alt={method.name} className="h-full w-full rounded-full object-contain p-0.5" style={{ backgroundColor: '#ffffff' }} />
    : <span className="text-xs font-bold" style={{ color: '#0f172a' }}>{method.name.slice(0, 2).toUpperCase()}</span>
}

const panel = 'rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5'
const inputClass = 'mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500'
const smallTitle = 'text-xs font-black uppercase tracking-wide'

function SectionTitle({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return <div className="flex items-center gap-3">
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white ${['bg-blue-600', 'bg-indigo-600', 'bg-emerald-600'][number - 1]}`}>{number}</div>
    <div><h2 className="text-sm font-black text-slate-950 sm:text-base">{title}</h2>
      <p className="mt-0.5 text-xs text-slate-400 sm:text-xs">{subtitle}</p></div>
  </div>
}

const checkoutStyles = `html[data-teo-theme="dark"] .teo-checkout { background:#0b1220; color:#e2e8f0; }
html[data-teo-theme="dark"] .teo-checkout :is(.bg-white,.bg-slate-50) { background:#152033; color:#e2e8f0; }
html[data-teo-theme="dark"] .teo-checkout :is(.text-slate-950,.text-slate-900,.text-slate-700,.text-slate-600,.text-slate-500,.text-slate-400) { color:#cbd5e1; }
html[data-teo-theme="dark"] .teo-checkout :is(.border-slate-100,.border-slate-200,.border-slate-300) { border-color:#334155; }
html[data-teo-theme="dark"] .teo-checkout :is(.bg-blue-50,[class~="bg-blue-50/50"],[class~="bg-blue-50/60"]) { background:#172b49; border-color:#34527a; }
html[data-teo-theme="dark"] .teo-checkout .bg-amber-50 { background:#392b16; color:#fde68a; border-color:#785b25; }
html[data-teo-theme="dark"] .teo-checkout .bg-emerald-50 { background:#12372e; color:#a7f3d0; }
html[data-teo-theme="dark"] .teo-checkout .text-emerald-800 { color:#a7f3d0; }
html[data-teo-theme="dark"] .teo-checkout .bg-red-50 { background:#3b2029; color:#fecaca; }
html[data-teo-theme="dark"] .teo-checkout .text-blue-600 { color:#93c5fd; }
html[data-teo-theme="dark"] .teo-checkout .bg-slate-950 .bg-white { background:#fff; color:#0f172a; }
.teo-checkout input:focus-visible,.teo-checkout button:focus-visible,.teo-checkout summary:focus-visible { outline:2px solid #3b82f6; outline-offset:2px; }`

function DigitalCheckoutPage() {
  const { productSlug } = useParams()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')
  const planId = searchParams.get('planId')
  const location = useLocation()
  const navigate = useNavigate()
  const { language, formatCurrencyText } = useLanguage()
  const isArabic = language === 'ar'
  const t = (ar: string, fr: string) => isArabic ? ar : fr
  const [authChecking, setAuthChecking] = useState(true)
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null)
  const [service, setService] = useState<PublicServiceCatalogItem | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerValues, setCustomerValues] = useState<Record<string, string | boolean>>({})
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true)
  const [selectedPaymentCode, setSelectedPaymentCode] = useState('')
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)
  const [paymentSenderNumber, setPaymentSenderNumber] = useState('')
  const [paymentNumberCopied, setPaymentNumberCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [uncertainSubmission, setUncertainSubmission] = useState(false)
  const [proofPreview, setProofPreview] = useState('')
  useEffect(() => {
    if (!paymentProofFile) { setProofPreview(''); return }
    const url = URL.createObjectURL(paymentProofFile)
    setProofPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [paymentProofFile])
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const loadPaymentMethods = useCallback(async () => {
    const { data, error } = await supabase.from('payment_methods')
      .select('id,code,name,payment_number,image_path,instructions_fr,instructions_ar,is_active,sort_order,name_ar,name_fr,payment_type,beneficiary_name,payment_network,payment_currency,receiver_label_ar,receiver_label_fr,sender_label_ar,sender_label_fr,qr_image_path')
      .eq('is_active', true).eq('payment_currency', 'MRU').order('sort_order', { ascending: true }).order('created_at', { ascending: true })
    if (error) console.error('Unable to load payment methods:', error)
    const methods = error ? [] : (data ?? []) as PaymentMethod[]
    setPaymentMethods(methods)
    setSelectedPaymentCode(current => methods.some(method => method.code === current) ? current : '')
    setPaymentMethodsLoading(false)
  }, [])

  useEffect(() => {
    void loadPaymentMethods()
    const channel = supabase.channel(`digital-checkout-payment-methods-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, () => { void loadPaymentMethods() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [loadPaymentMethods])

  useEffect(() => {
    let active = true
    setCatalogLoading(true)
    async function loadService() {
      try {
        const next = productSlug ? await fetchPublicServiceBySlug(productSlug) : null
        if (active) setService(next)
      } catch (error) {
        console.error('Unable to load checkout service:', error)
        if (active) setService(null)
      } finally {
        if (active) setCatalogLoading(false)
      }
    }
    void loadService()
    return () => { active = false }
  }, [productSlug])

  useEffect(() => {
    let active = true
    setAuthChecking(true)
    async function checkAuthentication() {
      const { data, error } = await supabase.auth.getUser()
      if (!active) return
      if (error || !data.user) {
        navigate(`/connexion?redirect=${encodeURIComponent(location.pathname + location.search)}`, { replace: true })
        return
      }
      const user = data.user
      setAuthenticatedUserId(user.id)
      const name = user.user_metadata?.full_name
      if (typeof name === 'string' && name.trim()) setCustomerName(current => current || name.trim())
      const metaPhone = user.user_metadata?.phone
      const phone = user.phone?.trim() || (typeof metaPhone === 'string' ? metaPhone.trim() : '')
      if (phone) setCustomerPhone(current => current || phone)
      setAuthChecking(false)
    }
    void checkAuthentication()
    return () => { active = false }
  }, [location.pathname, location.search, navigate])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    setCustomerValues({})
    setSelectedPaymentCode('')
    setPaymentProofFile(null)
    setPaymentSenderNumber('')
    setPaymentNumberCopied(false)
    setSubmissionError(null)
  }, [productSlug, groupId, planId])

  const selectedGroup = useMemo(() => service?.groups.find(group => group.id === groupId), [service, groupId])
  const selectedPlan = useMemo(() => selectedGroup?.plans.find(plan => plan.id === planId), [selectedGroup, planId])
  const selectedPayment = paymentMethods.find(method => method.code === selectedPaymentCode && method.is_active)
  const groupDatabaseId = selectedGroup?.databaseId
  const planDatabaseId = selectedPlan?.databaseId

  const [quote, setQuote] = useState<CheckoutQuote | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [quoteBusy, setQuoteBusy] = useState(true)
  const [quoteError, setQuoteError] = useState('')
  const quoteRequest = useRef(0)
  useEffect(() => {
    const request = ++quoteRequest.current
    setQuote(null); setCouponInput(''); setAppliedCoupon(null); setQuoteError(''); setQuoteBusy(true)
    if (!authenticatedUserId || !isDatabaseId(planDatabaseId)) return
    void fetchCheckoutQuote(planDatabaseId, null).then(q => { if (request === quoteRequest.current) setQuote(q) }).catch(() => { if (request === quoteRequest.current) setQuoteError('QUOTE_UNAVAILABLE') }).finally(() => { if (request === quoteRequest.current) setQuoteBusy(false) })
    return () => { ++quoteRequest.current }
  }, [authenticatedUserId, planDatabaseId])
  async function applyCoupon(code: string | null) {
    if (!isDatabaseId(planDatabaseId) || selectedPaymentCode || quoteBusy || submittingRef.current) return
    const request = ++quoteRequest.current
    setQuoteBusy(true); setQuoteError('')
    try {
      const q = await fetchCheckoutQuote(planDatabaseId, code)
      if (request !== quoteRequest.current) return
      setQuote(q); setAppliedCoupon(q.coupon_code ?? null); setCouponInput(q.coupon_code ?? '')
    } catch (e) { if (request === quoteRequest.current) setQuoteError(e instanceof Error ? e.message : 'QUOTE_UNAVAILABLE') }
    finally { if (request === quoteRequest.current) setQuoteBusy(false) }
  }

  function handlePaymentProofChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setSubmissionError(null)
    setPaymentProofFile(null)
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setSubmissionError(t('يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP.', 'Veuillez choisir une image JPG, PNG ou WEBP.'))
    } else if (file.size > MAX_PAYMENT_PROOF_SIZE) {
      setSubmissionError(t('يجب ألا يتجاوز حجم صورة إثبات الدفع 5 MB.', 'La preuve de paiement ne doit pas dépasser 5 MB.'))
    } else {
      setPaymentProofFile(file)
      return
    }
    event.target.value = ''
  }

  async function copyPaymentNumber() {
    if (!selectedPayment) return
    const number = selectedPayment.payment_number
    try { await copyText(number) } catch { setSubmissionError(t('تعذر النسخ، حدد الرقم وانسخه يدويًا.', 'Copie impossible. Sélectionnez le numéro pour le copier.')); return }
    setPaymentNumberCopied(true)
    window.setTimeout(() => setPaymentNumberCopied(false), 1800)
  }

  if (authChecking || catalogLoading) {
    return <main className="teo-checkout flex min-h-[60vh] items-center justify-center bg-[#f7f9fc] text-center">
      <style>{checkoutStyles}</style><div><div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <p className="mt-4 text-xs font-bold text-slate-500">{t('جارٍ التحقق من حسابك...', 'Vérification de votre compte...')}</p></div>
    </main>
  }
  if (!authenticatedUserId) return null
  if (!service || !selectedGroup || !selectedPlan || service.availability !== 'available' ||
      selectedGroup.availability !== 'available' || selectedPlan.availability !== 'available' ||
      !isDatabaseId(groupDatabaseId) || !isDatabaseId(planDatabaseId)) {
    return <main dir={isArabic ? 'rtl' : 'ltr'} className="teo-checkout min-h-screen bg-[#f7f9fc] py-8 sm:py-12"><style>{checkoutStyles}</style><Container>
      <div className={`mx-auto max-w-md text-center ${panel}`}>
        <h1 className="text-xl font-black">{t('تعذّر فتح الطلب', 'Commande indisponible')}</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">{t('تعذّر التحقق من الخطة المختارة. ارجع إلى الخدمة واختر الخطة مجددًا.', 'Impossible de vérifier la formule sélectionnée. Revenez au service pour la sélectionner à nouveau.')}</p>
        <Link className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white" to={productSlug ? `/services-numeriques/${productSlug}` : '/services-numeriques'}>{t('العودة إلى الخدمة', 'Retour au service')}</Link>
      </div></Container></main>
  }

  const serviceName = getLocalizedServiceName(service, language)
  const groupName = getLocalizedGroupShortName(selectedGroup, language)
  const planLabel = getLocalizedPlanLabel(selectedPlan, language)
  const category = getLocalizedCategory(service.category, language)
  const fulfillmentType = selectedGroup.fulfillment.type
  const fulfillmentLabel = getLocalizedFulfillmentLabel(fulfillmentType, language)
  const warning = getLocalizedFulfillmentWarning(service.slug, selectedGroup, language)
  const instructions = getLocalizedFulfillmentInstructions(service.slug, selectedGroup, language)
  const fields = selectedGroup.fulfillment.customerFields
  const localizedFields = fields.map(field => getLocalizedCustomerField(service.slug, selectedGroup.id, field, language))
  const price = new Intl.NumberFormat(isArabic ? 'ar-MR-u-nu-latn' : 'fr-FR-u-nu-latn', {
    numberingSystem: 'latn', maximumFractionDigits: 2,
  }).format(quote?.total_mru ?? Number(selectedPlan.price))
  const totalLabel = quote && quote.plan_id === planDatabaseId && !quoteBusy ? formatCurrencyText(`${price} ${selectedPlan.currency}`) : t('قيد التحقق', 'À vérifier')
  const fieldsComplete = fields.every(field => {
    const value = customerValues[field.id]
    if (field.type === 'email' && typeof value === 'string' && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return false
    return !field.required || (field.type === 'checkbox' ? value === true : typeof value === 'string' && value.trim().length > 0)
  })
  const quoteReady = Boolean(quote && quote.checkout_enabled === true && quote.plan_id === planDatabaseId && !quoteBusy && quote.original_price === Number(selectedPlan.price))
  const canConfirmPayment = Boolean(quoteReady && customerName.trim() && customerPhone.trim() && selectedPayment &&
    paymentSenderNumber.trim() && paymentProofFile && fieldsComplete && !isSubmitting && !uncertainSubmission)

  const handleSubmitOrder = async () => {
    if (submittingRef.current || !canConfirmPayment || !selectedPayment || !paymentProofFile) return
    submittingRef.current = true
    setIsSubmitting(true)
    setSubmissionError(null)
    let removableProof: string | null = null
    let rpcStarted = false
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!auth.user) {
        navigate(`/connexion?redirect=${encodeURIComponent(location.pathname + location.search)}`, { replace: true })
        return
      }
      const { data: method, error: methodError } = await supabase.from('payment_methods')
        .select('code,payment_number').eq('code', selectedPayment.code).eq('is_active', true).eq('payment_currency', 'MRU').maybeSingle()
      if (methodError) throw methodError
      if (!method) {
        await loadPaymentMethods()
        throw new Error(t('وسيلة الدفع المختارة لم تعد متاحة. اختر وسيلة أخرى.', 'Ce moyen de paiement n’est plus disponible. Choisissez-en un autre.'))
      }
      if (method.payment_number !== selectedPayment.payment_number) {
        await loadPaymentMethods()
        throw new Error(t('تغير رقم المستفيد. إذا دفعت بالفعل، تواصل مع الدعم ولا تدفع مرة أخرى.', 'Le numéro bénéficiaire a changé. Si vous avez déjà payé, contactez le support sans payer à nouveau.'))
      }
      const latest = await fetchPublicServiceBySlug(service.slug)
      const latestGroup = latest?.groups.find(group => group.databaseId === groupDatabaseId)
      const latestPlan = latestGroup?.plans.find(plan => plan.databaseId === planDatabaseId)
      if (latest?.availability !== 'available' || latestGroup?.availability !== 'available' || latestPlan?.availability !== 'available' || Number(latestPlan.price) !== Number(selectedPlan.price) || latestPlan.currency !== selectedPlan.currency) {
        throw new Error(t('تغير السعر أو توفر الخدمة. تواصل مع الدعم إذا دفعت بالفعل، ولا تكرر الدفع.', 'Le prix ou la disponibilité a changé. Si vous avez déjà payé, contactez le support sans repayer.'))
      }
      if (!quote || quote.checkout_enabled !== true || !isDatabaseId(planDatabaseId)) throw new Error('CHECKOUT_DISABLED')
      const currentQuote = await fetchCheckoutQuote(planDatabaseId, appliedCoupon)
      if (currentQuote.checkout_enabled !== true || currentQuote.total_mru !== quote.total_mru || currentQuote.checkout_enabled !== quote.checkout_enabled || currentQuote.discount_type !== quote.discount_type) throw new Error(t('تغير السعر. إذا دفعت بالفعل تواصل مع الدعم ولا تدفع مرة أخرى.', 'Le prix a changé. Si vous avez déjà payé, contactez le support sans repayer.'))
      const extension = paymentProofFile.type === 'image/png' ? 'png' : paymentProofFile.type === 'image/webp' ? 'webp' : 'jpg'
      const reference = Math.floor(100000 + Math.random() * 900000)
      const path = `${auth.user.id}/TEO-${reference}-${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage.from(PAYMENT_PROOFS_BUCKET).upload(path, paymentProofFile, {
        cacheControl: '3600', upsert: false, contentType: paymentProofFile.type,
      })
      if (uploadError) throw uploadError
      const emailField = fields.find(field => field.type === 'email')
      const emailValue = emailField ? customerValues[emailField.id] : undefined
      const customerEmail = typeof emailValue === 'string' && emailValue.trim() ? emailValue.trim() : auth.user.email ?? ''
      rpcStarted = true
      const { data, error, status } = await supabase.rpc('customer_create_digital_order_v6', {
        p_service_slug: service.slug,
        p_group_id: groupDatabaseId,
        p_plan_id: planDatabaseId,
        p_customer_name: customerName.trim(),
        p_customer_phone: customerPhone.trim(),
        p_customer_email: customerEmail,
        p_customer_values: { ...customerValues },
        p_payment_method: method.code,
        p_payment_sender_number: paymentSenderNumber.trim(),
        p_payment_proof_path: path,
        p_expected_total: quote.total_mru, p_coupon_code: appliedCoupon,
      })
      if (error) {
        // A lost response can follow a committed order. Keep its receipt in that case.
        if (status >= 400 && status < 500 && status !== 408) { removableProof = path; rpcStarted = false }
        throw error
      }
      const order = Array.isArray(data) ? data[0] : data
      if (typeof order?.order_number !== 'string' || !order.order_number.trim()) {
        throw new Error(t('تعذّر قراءة رقم الطلب. تحقّق من طلباتك.', 'Numéro de commande indisponible. Vérifiez vos commandes.'))
      }
      navigate(`/commande/${order.order_number}`, { replace: true })
    } catch (error) {
      console.error('Digital order submission failed:', error)
      if (removableProof) {
        try {
          const result = await supabase.storage.from(PAYMENT_PROOFS_BUCKET).remove([removableProof])
          if (result.error) console.warn('Unable to remove payment proof:', result.error)
        } catch (cleanupError) {
          console.warn('Unable to remove payment proof:', cleanupError)
        }
      }
      if (rpcStarted) setUncertainSubmission(true)
      const message = error instanceof Error ? error.message : t('تحقّق من حالة الطلب في حسابك.', 'Vérifiez le statut de la commande dans votre compte.')
      setSubmissionError(t(`تعذّر تأكيد الطلب. ${message}`, `Impossible de confirmer la commande. ${message}`))
    } finally { submittingRef.current = false; setIsSubmitting(false) }
  }

  const fulfillmentNotes: Record<string, string> = {
    automatic_chat: t('بعد تأكيد الدفع، ستُفتح محادثة مع إدارة TEO STORE لإكمال طلبك.', "Après confirmation du paiement, une discussion avec l’administration TEO STORE permettra de terminer votre commande."),
    account_credentials: t('بعد تأكيد الدفع، سيرسل لك TEO STORE معلومات الحساب الخاصة بالخدمة.', 'Après confirmation du paiement, TEO STORE vous transmettra les informations de votre compte.'),
    activation_code: t('بعد تأكيد الدفع، سيرسل لك TEO STORE الكود أو المفتاح الرقمي مع التعليمات.', 'Après confirmation du paiement, TEO STORE vous transmettra votre code ou clé numérique avec les instructions.'),
    activation_link: t('بعد تأكيد الدفع، سيتم تجهيز رابط التفعيل حسب الخطة.', 'Après confirmation du paiement, votre lien d’activation sera préparé selon la formule.'),
    activation_code_or_link: t('بعد تأكيد الدفع، سيرسل لك TEO STORE كودًا أو رابط تفعيل حسب الخطة.', 'Après confirmation du paiement, TEO STORE vous transmettra un code ou un lien d’activation selon la formule.'),
    customer_email: t('سيتم تنفيذ التفعيل باستخدام البريد الإلكتروني الذي أدخلته في هذا الطلب.', 'Votre activation sera effectuée à partir de l’adresse e-mail indiquée dans cette commande.'),
    player_id_verification: t('بعد الدفع، سيتحقق TEO STORE من Player ID قبل تنفيذ الشحن.', 'Après paiement, TEO STORE vérifiera votre Player ID avant la recharge.'),
  }
  const paymentSteps = selectedPayment ? [
    t(`افتح تطبيق ${selectedPayment.name} على هاتفك.`, `Ouvrez l’application ${selectedPayment.name} sur votre téléphone.`),
    t('سجّل الدخول إلى حسابك.', 'Connectez-vous à votre compte.'),
    t('اختر التحويل أو إرسال الأموال.', 'Choisissez le transfert ou l’envoi d’argent.'),
    t(`أدخل بيانات المستفيد الخاصة بـ TEO STORE: ${selectedPayment.payment_number}.`, `Saisissez l’identifiant bénéficiaire TEO STORE : ${selectedPayment.payment_number}.`),
    t(`أدخل مبلغ الطلب بالضبط: ${totalLabel}.`, `Saisissez exactement le montant : ${totalLabel}.`),
    t('راجع رقم المستفيد والمبلغ جيدًا ثم أكد التحويل.', 'Vérifiez soigneusement le numéro et le montant puis confirmez le transfert.'),
    t('بعد نجاح العملية، التقط صورة واضحة لإثبات الدفع.', 'Après le paiement, faites une capture d’écran claire de la transaction.'),
    t('ارجع إلى TEO STORE، أدخل الرقم الذي دفعت منه، ارفع الصورة ثم أكد الطلب.', 'Revenez sur TEO STORE, indiquez le numéro utilisé, ajoutez la capture puis confirmez la commande.'),
  ] : []
  const updateField = (id: string, value: string | boolean) => {
    setCustomerValues(previous => ({ ...previous, [id]: value }))
    setSubmissionError(null)
  }

  return <main dir={isArabic ? 'rtl' : 'ltr'} className="teo-checkout min-h-screen bg-[#f7f9fc]">
    <style>{checkoutStyles}</style>
    <section className="border-b border-slate-200 bg-white">
      <Container className="py-3">
        <div className="flex min-w-0 items-center gap-2 overflow-hidden text-xs font-semibold text-slate-400 sm:text-xs">
          <Link to="/services-numeriques">{t('الخدمات الرقمية', 'Services numériques')}</Link><span>/</span>
          <Link className="truncate" to={`/services-numeriques/${service.slug}`}>{serviceName}</Link><span>/</span>
          <span className="text-slate-700">{t('الطلب', 'Commande')}</span>
        </div>
      </Container>
    </section>
    <section className="py-5 sm:py-9 lg:py-12"><Container><div className="mx-auto max-w-6xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />{t('طلب رقمي', 'COMMANDE DIGITALE')}
      </div>
      <h1 className="mt-3 text-[26px] font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">{t('أكمل طلبك', 'Finalisez votre commande')}</h1>
      <p className="mt-2 max-w-xl text-sm leading-5 text-slate-500 sm:text-sm">{t('أدخل معلوماتك، ادفع من تطبيقك، ثم ارفع إثبات الدفع.', 'Renseignez vos informations, payez depuis votre application puis ajoutez votre preuve de paiement.')}</p>
      <div className="mt-5 grid grid-cols-3 gap-2" aria-label={t('مراحل الطلب', 'Étapes de commande')}>
        {[[t('معلوماتك','Coordonnées'), Boolean(customerName.trim() && customerPhone.trim())], [t('الخدمة','Service'), fieldsComplete], [t('الدفع','Paiement'), Boolean(selectedPayment && paymentSenderNumber.trim() && paymentProofFile)]].map(([label, done], index) => <div key={index} className="rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold"><span className={done ? 'text-emerald-600' : 'text-blue-600'}>{done ? '✓' : index + 1}</span> {label}</div>)}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <fieldset disabled={isSubmitting || uncertainSubmission} className="min-w-0 space-y-4">
          <section className={panel}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#192638] font-black text-white">
                <ServiceLogo serviceSlug={service.slug} fallback={service.name.trim().charAt(0).toUpperCase() || 'T'} />
              </div>
              <div className="min-w-0"><p className={`${smallTitle} text-blue-600`}>{category}</p>
                <h2 className="truncate text-sm font-black text-slate-950 sm:text-base">{serviceName}</h2>
                <p className="text-xs text-slate-400">{groupName} · {planLabel}</p></div>
              <p dir="ltr" className="ms-auto shrink-0 text-sm font-black text-blue-600">{totalLabel}</p>
            </div>
          </section>
          <section className={panel}>
            <SectionTitle number={1} title={t('معلوماتك', 'Vos informations')} subtitle={t('بيانات التواصل', 'Informations de contact')} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-black text-slate-600">{t('الاسم', 'Nom')} <span className="text-red-500">*</span>
                <input className={inputClass} value={customerName} placeholder={t('اسمك', 'Votre nom')} onChange={e => { setCustomerName(e.target.value); setSubmissionError(null) }} />
              </label>
              <label className="block text-xs font-black text-slate-600">{t('الهاتف', 'Téléphone')} <span className="text-red-500">*</span>
                <input dir="ltr" className={inputClass} type="tel" inputMode="tel" value={customerPhone} placeholder="+222 ..." onChange={e => { setCustomerPhone(e.target.value); setSubmissionError(null) }} />
              </label>
            </div>
          </section>
          <section className={panel}>
            <SectionTitle number={2} title={t('معلومات الخدمة', 'Informations du service')} subtitle={fulfillmentLabel} />
            {localizedFields.length > 0 ? <div className="mt-4 space-y-3">{localizedFields.map(field => {
              const value = customerValues[field.id]
              if (field.type === 'checkbox') return <label key={field.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <input type="checkbox" checked={value === true} onChange={e => updateField(field.id, e.target.checked)} />
                <span className="text-xs font-bold text-slate-700">{field.label}{field.helpText && <small className="mt-1 block font-normal">{field.helpText}</small>}</span>
              </label>
              return <label key={field.id} className="block text-xs font-black text-slate-600">{field.label} {field.required && <span className="text-red-500">*</span>}
                <input className={inputClass} type={field.type === 'email' ? 'email' : 'text'} value={typeof value === 'string' ? value : ''} placeholder={field.placeholder ?? ''} onChange={e => updateField(field.id, e.target.value)} />
                {field.helpText && <small className="mt-1.5 block font-normal text-slate-400">{field.helpText}</small>}
              </label>
            })}</div> : fulfillmentNotes[fulfillmentType] && <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-5 text-slate-600">{fulfillmentNotes[fulfillmentType]}</div>}
            {warning && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-700"><strong>{t('مهم', 'Important')}</strong><p>{warning}</p></div>}
            {instructions && <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-slate-600"><strong>{t('التعليمات', 'Instructions')}</strong><p>{instructions}</p></div>}
          </section>
          <section className={panel}>
            <SectionTitle number={3} title={t('الدفع', 'Paiement')} subtitle={t('اختر تطبيق الدفع واتبع الخطوات', 'Choisissez votre application et suivez les étapes')} />
            <div className="mt-4 rounded-xl border border-slate-200 p-3 text-sm">
              {quote?.checkout_enabled === false &&
  <p role="alert" className="mb-3 rounded-xl bg-amber-100 p-3 font-bold text-amber-900">
    {t(
      'الشراء والدفع غير متاحين حاليًا. يرجى عدم تحويل أي مبلغ.',
      'Les achats et paiements sont indisponibles. Ne transférez aucun montant.'
    )}
  </p>
}
{quoteBusy && <p role="status">{t('جارٍ التحقق من السعر...', 'Vérification du prix…')}</p>}
              {!quoteBusy && !quoteReady && <><p role="alert">{t('تعذر تأكيد السعر. لا تدفع الآن.', 'Prix non confirmé. Ne payez pas maintenant.')}</p><button type="button" className="mt-2 font-bold text-blue-600" onClick={() => void applyCoupon(null)} disabled={Boolean(selectedPaymentCode)}>{t('إعادة المحاولة', 'Réessayer')}</button></>}
              {quoteReady && quote?.checkout_enabled && quote.discount_type !== 'flash_sale' && <><label className="font-bold">{t('رمز التخفيض', 'Code promotionnel')}</label><div className="mt-2 flex gap-2"><input className={inputClass} maxLength={40} value={couponInput} disabled={Boolean(selectedPaymentCode) || quote.discount_type === 'flash_sale'} onChange={e => setCouponInput(e.target.value)} /><button type="button" className="rounded-xl bg-blue-600 px-3 text-white disabled:opacity-50" disabled={Boolean(selectedPaymentCode) || !couponInput.trim() || quote.discount_type === 'flash_sale'} onClick={() => void applyCoupon(couponInput.trim().toUpperCase())}>{t('تطبيق', 'Appliquer')}</button></div>{appliedCoupon && <p className="mt-2 text-sm font-semibold text-emerald-600">{t('الكوبون المطبق', 'Code appliqué')} : {appliedCoupon}</p>}{appliedCoupon && <button type="button" disabled={Boolean(selectedPaymentCode)} className="mt-2 text-blue-600" onClick={() => void applyCoupon(null)}>{t('إزالة الكوبون', 'Retirer le code')}</button>}{quote.discount_mru > 0 && <p className="mt-2 font-bold text-emerald-600">{t('التخفيض', 'Réduction')} : {quote.discount_mru} MRU</p>}</>}
              {quoteError && <p role="alert" className="mt-2 text-red-600">{t('تعذر تطبيق السعر أو الكوبون. تحقق من صلاحيته.', 'Prix ou code non validé. Vérifiez sa disponibilité.')}</p>}
            </div>
            {paymentMethodsLoading ? <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-center text-xs">{t('جارٍ تحميل وسائل الدفع...', 'Chargement des moyens de paiement...')}</div>
              : paymentMethods.length ? <div className="mt-4 grid grid-cols-4 gap-x-1 gap-y-3 sm:grid-cols-5 sm:gap-x-2">{paymentMethods.map(method => {
                const selected = method.code === selectedPaymentCode
                return <button type="button" key={method.id} aria-pressed={selected}
                  className={`group relative min-w-0 rounded-lg px-0.5 py-1.5 text-center bg-transparent transition hover:bg-blue-500/5 focus-visible:ring-2 focus-visible:ring-blue-500`}
                  disabled={!quoteReady} onClick={() => { if (!quoteReady) return; if (method.code !== selectedPaymentCode) { setPaymentProofFile(null); setPaymentSenderNumber('') }; setSelectedPaymentCode(method.code); setPaymentNumberCopied(false); setSubmissionError(null) }}>
                  <span className={`relative mx-auto flex h-12 w-12 items-center justify-center rounded-full ring-2 transition ${selected ? 'ring-blue-600' : 'ring-slate-300/70'}`} style={{ backgroundColor: '#ffffff' }}><span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full" style={{ color: '#0f172a' }}><PaymentLogo method={method} /></span>{selected && <span aria-hidden="true" className="absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white">✓</span>}</span>
                  <span className="mt-1.5 block break-words text-[10px] leading-tight font-semibold sm:text-xs">{(isArabic ? method.name_ar : method.name_fr) || method.name}</span>
                </button>
              })}</div> : <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-center text-xs text-amber-700">{t('لا توجد وسيلة دفع متاحة حاليًا.', 'Aucun moyen de paiement n’est disponible actuellement.')}</div>}
            {quoteReady && selectedPayment && <div className="mt-5 space-y-4">
              <div className="overflow-hidden rounded-[22px] bg-slate-950 text-white">
                <div className="p-4 sm:p-5"><div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white"><PaymentLogo method={selectedPayment} /></div>
                  <div><p className={`${smallTitle} text-white/50`}>{t('طريقة الدفع', 'Paiement via')}</p><p className="mt-1 font-black">{selectedPayment.name}</p></div>
                </div><p className="mt-4 text-xs leading-5 text-white/60">{(isArabic ? selectedPayment.instructions_ar : selectedPayment.instructions_fr)?.trim() ||
                  t(`قم بتحويل مبلغ الطلب من تطبيق ${selectedPayment.name} إلى رقم TEO STORE ثم ارفع إثبات الدفع.`, `Effectuez le transfert depuis ${selectedPayment.name} vers le numéro TEO STORE puis ajoutez votre preuve de paiement.`)}</p></div>
                {selectedPayment.beneficiary_name && <p className="px-4 pb-2 text-sm">{t('المستفيد', 'Bénéficiaire')}: {selectedPayment.beneficiary_name}</p>}{selectedPayment.payment_network && <p className="px-4 pb-2 text-sm">{t('الشبكة', 'Réseau')}: {selectedPayment.payment_network}</p>}{selectedPayment.qr_image_path && <img className="mx-auto mb-4 h-32 w-32 rounded-xl bg-white object-contain" alt="QR" src={supabase.storage.from('payment-methods').getPublicUrl(selectedPayment.qr_image_path).data.publicUrl} />}
                <div className="grid border-t border-white/10 sm:grid-cols-2">
                  <div className="p-4"><p className={smallTitle}>{t('المبلغ المطلوب', 'Montant à envoyer')}</p><p dir="ltr" className="mt-2 text-xl font-black">{totalLabel}</p></div>
                  <div className="p-4"><p className={smallTitle}>{(isArabic ? selectedPayment.receiver_label_ar : selectedPayment.receiver_label_fr) || t('بيانات المستفيد', 'Identifiant bénéficiaire')}</p><p dir="ltr" className="mt-2 break-all text-xl font-black">{selectedPayment.payment_number}</p></div>
                </div>
                <div className="border-t border-white/10 p-3"><button type="button" onClick={() => void copyPaymentNumber()} className={`h-11 w-full rounded-xl text-xs font-black ${paymentNumberCopied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-950'}`}>
                  {paymentNumberCopied ? t('تم نسخ الرقم ✓', 'Numéro copié ✓') : t('نسخ رقم المستفيد', 'Copier le numéro')}
                </button></div>
              </div>
              <details className="rounded-[20px] border border-blue-100 bg-blue-50/50 p-4">
                <summary className="cursor-pointer text-sm font-black">{t('كيف أدفع؟', 'Comment payer ?')}</summary><p className="text-xs text-slate-400">{t(`خطوات الدفع عبر ${selectedPayment.name}`, `Étapes de paiement avec ${selectedPayment.name}`)}</p>
                <ol className="mt-4 space-y-3">{paymentSteps.map((step, index) => <li className="flex items-start gap-3 text-xs leading-5 text-slate-600" key={index}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-black text-blue-600">{index + 1}</span>{step}
                </li>)}</ol>
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{t('تأكد من رقم المستفيد والمبلغ قبل تأكيد التحويل. لا ترسل مبلغًا إلى رقم آخر.', 'Vérifiez le numéro du bénéficiaire et le montant avant de confirmer. N’envoyez pas le paiement vers un autre numéro.')}</p>
              </details>
              <label className="block rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-xs font-black">
                {(isArabic ? selectedPayment.sender_label_ar : selectedPayment.sender_label_fr) || t('رقم المرسل أو مرجع التحويل', 'Identifiant expéditeur ou référence')} <span className="text-red-500">*</span>
                <small className="mt-1 block font-normal text-slate-400">{t(`أدخل معرف المرسل أو مرجع التحويل عبر ${selectedPayment.name}.`, `Indiquez votre identifiant ou référence de transfert ${selectedPayment.name}.`)}</small>
                <input dir="ltr" className={inputClass} type="text" value={paymentSenderNumber} onChange={e => { setPaymentSenderNumber(e.target.value); setSubmissionError(null) }} />
              </label>
              <div><p className="text-xs font-black">{t('إثبات الدفع', 'Preuve de paiement')} <span className="text-red-500">*</span></p>
                <p className="mt-1 text-xs text-slate-400">{t('بعد نجاح الدفع، ارفع صورة واضحة تظهر عملية التحويل.', 'Après le paiement, ajoutez une capture d’écran claire de la transaction.')}</p>
                <label className={`mt-3 flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-[18px] border border-dashed p-4 text-center ${paymentProofFile ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 bg-slate-50'}`}>
                  <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePaymentProofChange} onClick={e => { e.currentTarget.value = '' }} />
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black shadow-sm ${paymentProofFile ? 'bg-emerald-500 text-white' : 'bg-white text-blue-600'}`}>{paymentProofFile ? '✓' : '↑'}</span>
                  <span className="mt-3 max-w-[280px] truncate text-xs font-black">{paymentProofFile?.name || t('اضغط لاختيار صورة الدفع', 'Appuyez pour choisir la capture du paiement')}</span>
                  <span className="mt-1 text-xs text-slate-400">JPG · PNG · WEBP · 5 MB max</span>
                </label>
                {paymentProofFile && proofPreview && <div className="mt-3 rounded-xl border border-slate-200 p-3">
                  <img src={proofPreview} alt={t('معاينة إثبات الدفع','Aperçu de la preuve')} className="mx-auto max-h-64 max-w-full rounded-lg object-contain" />
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs"><span>{(paymentProofFile.size / 1024).toFixed(0)} KB</span><button type="button" className="font-bold text-red-600" onClick={() => setPaymentProofFile(null)}>{t('حذف الصورة','Supprimer la capture')}</button></div>
                </div>}
              </div>
            </div>}
            {submissionError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600">{submissionError}</p>}
          </section>
        </fieldset>
        <aside className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><p className={`${smallTitle} text-blue-600`}>{t('ملخص الطلب', 'RÉCAPITULATIF')}</p>
              <h2 className="mt-2 text-base font-black">{serviceName}</h2><p className="mt-1 text-xs text-slate-400">{groupName} · {planLabel}</p></div>
            <div className="space-y-3 p-5">
              {[[t('الخدمة', 'Service'), serviceName], [t('الخطة', 'Formule'), planLabel], [t('طريقة التسليم','Mode de livraison'), fulfillmentLabel]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3 text-xs"><span className="text-slate-400">{label}</span><strong>{value}</strong></div>)}
              {selectedPayment && <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white"><PaymentLogo method={selectedPayment} /></div>
                <div className="text-xs text-emerald-800"><p>{t('طريقة الدفع', 'Paiement')}</p><strong>{selectedPayment.name}</strong></div></div>}
              {quoteReady && quote && quote.discount_mru > 0 && <div className="space-y-2 text-sm"><div className="flex justify-between"><span>{t('السعر الأصلي', 'Prix initial')}</span><del>{quote.original_price} MRU</del></div><div className="flex justify-between text-emerald-600"><span>{t('التخفيض', 'Réduction')}</span><strong>−{quote.discount_mru} MRU</strong></div></div>}
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 text-white"><span className={smallTitle}>{t('المبلغ المطلوب', 'Montant à payer')}</span><strong dir="ltr" className="text-lg">{totalLabel}</strong></div>
              <button type="button" disabled={!canConfirmPayment} onClick={() => void handleSubmitOrder()} className="h-12 w-full rounded-[14px] bg-blue-600 text-xs font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
                {isSubmitting ? t('جارٍ إرسال الطلب...', 'Envoi en cours...') : t('إرسال الطلب للمراجعة', 'Envoyer la commande')}
              </button>
              {uncertainSubmission && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{t('قد يكون الطلب قد سُجل. تحقق من طلباتك أو تواصل مع الدعم قبل إعادة المحاولة. لا تدفع مرة أخرى.', 'La commande a peut-être été enregistrée. Vérifiez vos commandes ou contactez le support avant de réessayer. Ne payez pas à nouveau.')}</p>}
              {submissionError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-600">{submissionError}</p>}
              {!isSubmitting && !uncertainSubmission && <p className={`text-center text-xs ${canConfirmPayment ? 'font-bold text-emerald-600' : 'text-slate-400'}`}>{canConfirmPayment ? t('كل شيء جاهز لإرسال الطلب ✓', 'Tout est prêt pour envoyer la commande ✓') : t('أكمل المعلومات واختر طريقة الدفع وارفع الإثبات لتفعيل الزر.', 'Complétez les informations, choisissez un moyen de paiement et ajoutez la preuve.')}</p>}
            </div>
          </div>
          <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
            <p className={`${smallTitle} text-slate-400`}>{t('بعد إرسال الطلب', 'Après la commande')}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{t('سيظهر طلبك في حسابك وستتمكن من متابعة التحقق من الدفع وتجهيز الخدمة والتسليم داخل TEO STORE.', 'Votre commande apparaîtra dans votre compte. Vous pourrez suivre la vérification du paiement, le traitement et la livraison directement dans TEO STORE.')}</p>
          </div>
        </aside>
      </div>
    </div></Container></section>
  </main>
}

export default DigitalCheckoutPage
