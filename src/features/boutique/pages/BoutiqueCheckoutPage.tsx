import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  MapPin,
  UserRound,
  Phone,
  Truck,
  ShieldCheck,
  PackageCheck,
  CheckCircle2,
  Pencil,
  CreditCard,
  Upload,
  FileText,
  X,
  AlertCircle,
} from 'lucide-react'

import { useLanguage } from '../../../i18n/LanguageContext'
import { useBoutiqueCart } from '../context/BoutiqueCartContext'
import { boutiqueProducts } from '../data/products'

type CheckoutForm = {
  fullName: string
  phone: string
  city: string
  address: string
  notes: string
}

type PaymentMethod = 'bankily' | 'masrvi' | 'sedad'

const initialForm: CheckoutForm = {
  fullName: '',
  phone: '',
  city: '',
  address: '',
  notes: '',
}

const paymentMethods: {
  id: PaymentMethod
  name: string
  nameAr: string
}[] = [
  {
    id: 'bankily',
    name: 'Bankily',
    nameAr: 'بنكيلي',
  },
  {
    id: 'masrvi',
    name: 'Masrvi',
    nameAr: 'مصرفي',
  },
  {
    id: 'sedad',
    name: 'Sedad',
    nameAr: 'سداد',
  },
]

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024

const ALLOWED_RECEIPT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export default function BoutiqueCheckoutPage() {
  const { language, currencyLabel } = useLanguage()

  const {
    items,
    itemCount,
    subtotal,
    amountDueNow,
    remainingAmount,
  } = useBoutiqueCart()

  const [form, setForm] = useState<CheckoutForm>(initialForm)
  const [reviewMode, setReviewMode] = useState(false)

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('bankily')

  const [receipt, setReceipt] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(
    null
  )
  const [receiptError, setReceiptError] = useState('')
  const [paymentReviewed, setPaymentReviewed] = useState(false)

  const ar = language === 'ar'

  const tr = (fr: string, arabic: string) =>
    ar ? arabic : fr

  const BackArrow = ar ? ArrowRight : ArrowLeft

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(value)

  useEffect(() => {
    if (!receipt || !receipt.type.startsWith('image/')) {
      return
    }

    const url = URL.createObjectURL(receipt)
    setReceiptPreview(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [receipt])

  const updateField = (
    field: keyof CheckoutForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (itemCount === 0) return

    setForm((current) => ({
      ...current,
      fullName: current.fullName.trim(),
      phone: current.phone.trim(),
      city: current.city.trim(),
      address: current.address.trim(),
      notes: current.notes.trim(),
    }))

    setReviewMode(true)
    setPaymentReviewed(false)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleReceiptChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    setReceiptError('')
    setPaymentReviewed(false)
    setReceiptPreview(null)

    if (!file) {
      setReceipt(null)
      return
    }

    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      setReceipt(null)
      setReceiptError(
        tr(
          'Format non accepté. Utilisez JPG, PNG, WEBP ou PDF.',
          'صيغة الملف غير مدعومة. استخدم JPG أو PNG أو WEBP أو PDF.'
        )
      )
      event.target.value = ''
      return
    }

    if (file.size > MAX_RECEIPT_SIZE) {
      setReceipt(null)
      setReceiptError(
        tr(
          'Le fichier ne doit pas dépasser 5 Mo.',
          'يجب ألا يتجاوز حجم الملف 5 ميغابايت.'
        )
      )
      event.target.value = ''
      return
    }

    setReceipt(file)
  }

  const removeReceipt = () => {
    setReceipt(null)
    setReceiptPreview(null)
    setReceiptError('')
    setPaymentReviewed(false)

    const input = document.getElementById(
      'boutique-receipt'
    ) as HTMLInputElement | null

    if (input) input.value = ''
  }

  const handlePaymentReview = () => {
    if (!receipt || itemCount === 0) {
      setReceiptError(
        tr(
          'Veuillez ajouter votre justificatif de paiement.',
          'يرجى إرفاق إثبات الدفع أولًا.'
        )
      )
      return
    }

    setReceiptError('')
    setPaymentReviewed(true)
  }

  const selectedPayment = paymentMethods.find(
    (method) => method.id === paymentMethod
  )

  return (
    <main
      dir={ar ? 'rtl' : 'ltr'}
      lang={language}
      className="min-h-screen bg-[#fafaf9] text-slate-900"
    >
      <div className="mx-auto max-w-7xl px-5 py-10">
        <Link
          to="/boutique/panier"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-amber-700"
        >
          <BackArrow size={18} />
          {tr('Retour au panier', 'العودة إلى السلة')}
        </Link>

        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
            BOUTIQUE TEO
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {reviewMode
              ? tr(
                  'Vérification de la commande',
                  'مراجعة الطلب'
                )
              : tr(
                  'Finaliser la commande',
                  'إتمام الطلب'
                )}
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            {reviewMode
              ? tr(
                  'Vérifiez vos informations et choisissez votre mode de paiement.',
                  'راجع بياناتك واختر وسيلة الدفع المناسبة.'
                )
              : tr(
                  'Renseignez vos coordonnées pour préparer votre commande.',
                  'أدخل بياناتك لتجهيز طلبك.'
                )}
          </p>
        </div>

        {itemCount === 0 ? (
          <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-12 text-center">
            <ShoppingBag
              size={48}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-5 text-xl font-bold">
              {tr(
                'Votre panier est vide',
                'سلة التسوق فارغة'
              )}
            </h2>

            <Link
              to="/boutique"
              className="mt-6 inline-flex rounded-xl bg-slate-950 px-6 py-3 font-bold text-white"
            >
              {tr(
                'Découvrir les produits',
                'تصفح المنتجات'
              )}
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_370px]">
            <div className="space-y-6">
              {!reviewMode ? (
                /* Customer information */
                <form
                  onSubmit={handleReview}
                  className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-9"
                >
                  <div className="flex items-center gap-3">
                    <UserRound
                      size={23}
                      className="text-amber-700"
                    />

                    <h2 className="text-xl font-black">
                      {tr(
                        'Informations personnelles',
                        'البيانات الشخصية'
                      )}
                    </h2>
                  </div>

                  <div className="mt-7 grid gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="boutique-full-name"
                        className="mb-2 block text-sm font-semibold"
                      >
                        {tr('Nom complet', 'الاسم الكامل')}
                      </label>

                      <input
                        id="boutique-full-name"
                        type="text"
                        required
                        minLength={2}
                        maxLength={120}
                        autoComplete="name"
                        value={form.fullName}
                        onChange={(e) =>
                          updateField(
                            'fullName',
                            e.target.value
                          )
                        }
                        placeholder={tr(
                          'Votre nom complet',
                          'أدخل اسمك الكامل'
                        )}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="boutique-phone"
                        className="mb-2 flex items-center gap-2 text-sm font-semibold"
                      >
                        <Phone size={16} />
                        {tr(
                          'Téléphone / WhatsApp',
                          'الهاتف / واتساب'
                        )}
                      </label>

                      <input
                        id="boutique-phone"
                        type="tel"
                        required
                        minLength={8}
                        maxLength={20}
                        autoComplete="tel"
                        dir="ltr"
                        value={form.phone}
                        onChange={(e) =>
                          updateField(
                            'phone',
                            e.target.value
                          )
                        }
                        placeholder="222XXXXXXXX"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="boutique-city"
                        className="mb-2 flex items-center gap-2 text-sm font-semibold"
                      >
                        <MapPin size={16} />
                        {tr('Ville', 'المدينة')}
                      </label>

                      <input
                        id="boutique-city"
                        type="text"
                        required
                        maxLength={100}
                        autoComplete="address-level2"
                        value={form.city}
                        onChange={(e) =>
                          updateField(
                            'city',
                            e.target.value
                          )
                        }
                        placeholder={tr(
                          'Votre ville',
                          'أدخل المدينة'
                        )}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="boutique-address"
                        className="mb-2 block text-sm font-semibold"
                      >
                        {tr(
                          'Quartier / Adresse',
                          'الحي / العنوان'
                        )}
                      </label>

                      <input
                        id="boutique-address"
                        type="text"
                        required
                        maxLength={200}
                        autoComplete="street-address"
                        value={form.address}
                        onChange={(e) =>
                          updateField(
                            'address',
                            e.target.value
                          )
                        }
                        placeholder={tr(
                          'Quartier et adresse',
                          'الحي والعنوان بالتفصيل'
                        )}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="boutique-notes"
                        className="mb-2 block text-sm font-semibold"
                      >
                        {tr(
                          'Notes supplémentaires (facultatif)',
                          'ملاحظات إضافية (اختياري)'
                        )}
                      </label>

                      <textarea
                        id="boutique-notes"
                        rows={4}
                        maxLength={1000}
                        value={form.notes}
                        onChange={(e) =>
                          updateField(
                            'notes',
                            e.target.value
                          )
                        }
                        placeholder={tr(
                          'Informations utiles pour la livraison...',
                          'أي معلومات تساعد في التوصيل...'
                        )}
                        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl bg-amber-50 p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck
                        size={22}
                        className="shrink-0 text-amber-700"
                      />

                      <p className="text-sm leading-7 text-amber-900">
                        {tr(
                          'Les frais de livraison et les modalités de paiement seront confirmés avant toute commande définitive.',
                          'سيتم تأكيد رسوم التوصيل وطريقة الدفع قبل اعتماد أي طلب نهائي.'
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-7 w-full rounded-xl bg-slate-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-amber-500 hover:text-slate-950"
                  >
                    {tr(
                      'Vérifier ma commande',
                      'مراجعة طلبي'
                    )}
                  </button>
                </form>
              ) : (
                <>
                  {/* Customer review */}
                  <section className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-9">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2
                          size={23}
                          className="text-emerald-700"
                        />

                        <h2 className="text-xl font-black">
                          {tr(
                            'Coordonnées du client',
                            'بيانات العميل'
                          )}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setReviewMode(false)
                          setPaymentReviewed(false)
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50"
                      >
                        <Pencil size={16} />
                        {tr('Modifier', 'تعديل')}
                      </button>
                    </div>

                    <dl className="mt-7 grid gap-5 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-slate-500">
                          {tr('Nom complet', 'الاسم الكامل')}
                        </dt>
                        <dd className="mt-1 font-bold">
                          {form.fullName}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-slate-500">
                          {tr('Téléphone', 'الهاتف')}
                        </dt>
                        <dd className="mt-1 font-bold" dir="ltr">
                          {form.phone}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-slate-500">
                          {tr('Ville', 'المدينة')}
                        </dt>
                        <dd className="mt-1 font-bold">
                          {form.city}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-slate-500">
                          {tr('Adresse', 'العنوان')}
                        </dt>
                        <dd className="mt-1 font-bold">
                          {form.address}
                        </dd>
                      </div>

                      {form.notes && (
                        <div className="sm:col-span-2">
                          <dt className="text-slate-500">
                            {tr('Notes', 'الملاحظات')}
                          </dt>
                          <dd className="mt-1 whitespace-pre-wrap font-medium">
                            {form.notes}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </section>

                  {/* Product review */}
                  <section className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-9">
                    <div className="flex items-center gap-3">
                      <ShoppingBag
                        size={23}
                        className="text-amber-700"
                      />

                      <h2 className="text-xl font-black">
                        {tr(
                          'Produits commandés',
                          'المنتجات المطلوبة'
                        )}
                      </h2>
                    </div>

                    <div className="mt-6 divide-y divide-slate-100">
                      {items.map((item) => {
                        const product = boutiqueProducts.find(
                          (p) => p.id === item.productId
                        )

                        if (!product) return null

                        const colorIndex =
                          product.colors.indexOf(item.color)

                        const displayedColor =
                          ar && colorIndex >= 0
                            ? product.colorsAr[colorIndex] ??
                              item.color
                            : item.color

                        const displayedSize =
                          item.size === 'Unique'
                            ? tr('Unique', 'مقاس واحد')
                            : item.size

                        return (
                          <div
                            key={item.key}
                            className="flex gap-4 py-5"
                          >
                            <img
                              src={product.image}
                              alt={tr(
                                product.name,
                                product.nameAr
                              )}
                              className="h-24 w-20 shrink-0 rounded-xl object-cover"
                            />

                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold">
                                {tr(
                                  product.name,
                                  product.nameAr
                                )}
                              </h3>

                              <p className="mt-2 text-xs text-slate-500">
                                {tr('Couleur', 'اللون')}:{' '}
                                {displayedColor}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {tr('Taille', 'المقاس')}:{' '}
                                {displayedSize}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {tr('Quantité', 'الكمية')}:{' '}
                                <bdi>{item.quantity}</bdi>
                              </p>

                              <p className="mt-2 text-xs font-semibold text-amber-800">
                                {product.type === 'preorder'
                                  ? tr(
                                      'Acompte de 50%',
                                      'دفعة مقدمة 50%'
                                    )
                                  : tr(
                                      'Paiement à 100%',
                                      'دفع كامل 100%'
                                    )}
                              </p>

                              <p className="mt-2 font-black">
                                <bdi>
                                  {formatPrice(
                                    product.price *
                                      item.quantity
                                  )}
                                </bdi>{' '}
                                {currencyLabel}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  {/* Payment method */}
                  <section className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-9">
                    <div className="flex items-center gap-3">
                      <CreditCard
                        size={24}
                        className="text-amber-700"
                      />

                      <h2 className="text-xl font-black">
                        {tr(
                          'Mode de paiement',
                          'طريقة الدفع'
                        )}
                      </h2>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {tr(
                        'Choisissez le service utilisé pour votre transfert.',
                        'اختر الخدمة التي ستستخدمها لتحويل المبلغ.'
                      )}
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(method.id)
                            setPaymentReviewed(false)
                          }}
                          aria-pressed={
                            paymentMethod === method.id
                          }
                          className={`rounded-2xl border p-5 text-center transition ${
                            paymentMethod === method.id
                              ? 'border-amber-500 bg-amber-50 text-slate-950 ring-1 ring-amber-500'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300'
                          }`}
                        >
                          <CreditCard
                            size={24}
                            className="mx-auto mb-3"
                          />

                          <span className="font-bold">
                            {ar ? method.nameAr : method.name}
                          </span>

                          <span className="mt-1 block text-xs text-slate-500">
                            {method.name}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Transfer information */}
                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <p className="text-sm font-bold text-amber-950">
                        {tr(
                          'Service sélectionné',
                          'وسيلة الدفع المختارة'
                        )}
                        :{' '}
                        {ar
                          ? selectedPayment?.nameAr
                          : selectedPayment?.name}
                      </p>

                      <p className="mt-3 text-sm leading-7 text-amber-900">
                        {tr(
                          'Le numéro de réception sera affiché après configuration par TEO STORE. Aucun transfert ne doit être effectué avant sa publication.',
                          'سيظهر رقم استقبال التحويل بعد إعداده من طرف TEO STORE. لا تقم بتحويل أي مبلغ قبل نشر رقم الاستقبال الرسمي.'
                        )}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amber-200 pt-4">
                        <span className="text-sm font-semibold">
                          {tr(
                            'Montant à transférer',
                            'المبلغ المطلوب تحويله'
                          )}
                        </span>

                        <strong className="text-xl text-amber-900">
                          <bdi>
                            {formatPrice(amountDueNow)}
                          </bdi>{' '}
                          {currencyLabel}
                        </strong>
                      </div>
                    </div>

                    {/* Receipt upload */}
                    <div className="mt-8">
                      <label
                        htmlFor="boutique-receipt"
                        className="mb-3 block text-sm font-bold"
                      >
                        {tr(
                          'Justificatif de paiement',
                          'إثبات الدفع'
                        )}
                      </label>

                      <label
                        htmlFor="boutique-receipt"
                        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:border-amber-400 hover:bg-amber-50"
                      >
                        <Upload
                          size={32}
                          className="text-slate-500"
                        />

                        <span className="mt-4 text-sm font-bold">
                          {tr(
                            'Choisir une image ou un PDF',
                            'اختر صورة أو ملف PDF'
                          )}
                        </span>

                        <span className="mt-2 text-xs text-slate-500">
                          JPG, PNG, WEBP, PDF — 5 MB max
                        </span>
                      </label>

                      <input
                        id="boutique-receipt"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleReceiptChange}
                        className="sr-only"
                      />

                      {receiptError && (
                        <div
                          role="alert"
                          className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                        >
                          <AlertCircle
                            size={19}
                            className="shrink-0"
                          />
                          {receiptError}
                        </div>
                      )}

                      {receipt && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <FileText
                                size={23}
                                className="shrink-0 text-amber-700"
                              />

                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold">
                                  {receipt.name}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {(
                                    receipt.size /
                                    1024 /
                                    1024
                                  ).toFixed(2)}{' '}
                                  MB
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={removeReceipt}
                              aria-label={tr(
                                'Supprimer le fichier',
                                'حذف الملف'
                              )}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            >
                              <X size={19} />
                            </button>
                          </div>

                          {receiptPreview && (
                            <img
                              src={receiptPreview}
                              alt={tr(
                                'Aperçu du justificatif',
                                'معاينة إثبات الدفع'
                              )}
                              className="mt-4 max-h-80 w-full rounded-xl object-contain"
                            />
                          )}

                          {receipt.type ===
                            'application/pdf' && (
                            <p className="mt-3 text-xs text-slate-500">
                              {tr(
                                'Fichier PDF sélectionné.',
                                'تم اختيار ملف PDF.'
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handlePaymentReview}
                      disabled={!receipt}
                      className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl bg-slate-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-amber-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCircle2 size={20} />
                      {tr(
                        'Vérifier le justificatif',
                        'مراجعة إثبات الدفع'
                      )}
                    </button>

                    {paymentReviewed && receipt && (
                      <div
                        role="status"
                        className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5"
                      >
                        <div className="flex items-center gap-2 font-bold text-emerald-800">
                          <CheckCircle2 size={20} />
                          {tr(
                            'Fichier prêt pour la prochaine étape',
                            'الملف جاهز للمرحلة التالية'
                          )}
                        </div>

                        <p className="mt-3 text-sm leading-7 text-emerald-900">
                          {tr(
                            'Le fichier a été vérifié localement (format et taille). Il n’a pas été envoyé au serveur et le paiement n’a pas été confirmé.',
                            'تم التحقق محليًا من صيغة الملف وحجمه فقط. لم يتم إرساله إلى الخادم ولم يتم تأكيد الدفع.'
                          )}
                        </p>
                      </div>
                    )}
                  </section>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck
                        size={22}
                        className="shrink-0 text-amber-700"
                      />

                      <p className="text-sm leading-7 text-amber-900">
                        {tr(
                          'Les paiements seront vérifiés manuellement par TEO STORE après la mise en place du système de commandes. Ne transférez aucun montant tant que le numéro officiel n’est pas affiché.',
                          'سيتم التحقق من المدفوعات يدويًا بواسطة TEO STORE بعد تجهيز نظام الطلبات. لا تحول أي مبلغ حتى يظهر رقم الاستقبال الرسمي.'
                        )}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Order summary */}
            <aside className="rounded-3xl border border-slate-100 bg-white p-6 lg:sticky lg:top-6">
              <div className="flex items-center gap-3">
                <PackageCheck
                  size={23}
                  className="text-amber-700"
                />

                <h2 className="text-xl font-black">
                  {tr(
                    'Résumé de la commande',
                    'ملخص الطلب'
                  )}
                </h2>
              </div>

              <p className="mt-5 text-sm text-slate-500">
                {tr('Nombre d’articles :', 'عدد القطع:')}{' '}
                <bdi>{itemCount}</bdi>
              </p>

              <div className="mt-7 space-y-5 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">
                    {tr('Sous-total', 'مجموع المنتجات')}
                  </span>

                  <strong>
                    <bdi>{formatPrice(subtotal)}</bdi>{' '}
                    {currencyLabel}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-slate-500">
                    <Truck size={17} />
                    {tr('Livraison', 'التوصيل')}
                  </span>

                  <span className="font-medium">
                    {tr('À confirmer', 'يحدد لاحقًا')}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <div className="flex justify-between gap-3">
                    <span className="font-bold">
                      {tr(
                        'À payer maintenant',
                        'المطلوب دفعه الآن'
                      )}
                    </span>

                    <strong className="text-lg text-amber-700">
                      <bdi>
                        {formatPrice(amountDueNow)}
                      </bdi>{' '}
                      {currencyLabel}
                    </strong>
                  </div>
                </div>

                {remainingAmount > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">
                      {tr(
                        'Reste à la réception',
                        'المتبقي عند الاستلام'
                      )}
                    </span>

                    <strong>
                      <bdi>
                        {formatPrice(remainingAmount)}
                      </bdi>{' '}
                      {currencyLabel}
                    </strong>
                  </div>
                )}
              </div>

              <div className="mt-7 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
                {tr(
                  'Les produits en stock sont payables à 100%. Les articles sur commande nécessitent un acompte de 50%.',
                  'المنتجات المتوفرة تُدفع بنسبة 100%، والمنتجات حسب الطلب تتطلب دفعة مقدمة بنسبة 50%.'
                )}
              </div>

              <p className="mt-5 text-center text-xs leading-6 text-slate-400">
                {tr(
                  'Frais de livraison non inclus. Aucun paiement confirmé.',
                  'رسوم التوصيل غير مشمولة. لم يتم تأكيد أي دفع.'
                )}
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}