import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  PackageCheck,
  Truck,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react'
import { useLanguage } from '../../../i18n/LanguageContext'

const products = [
  {
    id: '1',
    name: 'Sac élégant pour femme',
    nameAr: 'حقيبة نسائية أنيقة',
    description: 'Un sac élégant pour vos sorties et votre quotidien.',
    descriptionAr: 'حقيبة نسائية أنيقة مناسبة للخروج والاستخدام اليومي.',
    price: 450,
    oldPrice: 600,
    type: 'stock',
    stock: 8,
    delivery: 'Selon votre zone',
    deliveryAr: 'حسب منطقة التوصيل',
    colors: ['Noir', 'Marron'],
    colorsAr: ['أسود', 'بني'],
    sizes: ['Unique'],
    image: 'https://placehold.co/800x1000/f1e8e1/333333?text=Sac',
  },
  {
    id: '2',
    name: 'Montre homme classique',
    nameAr: 'ساعة رجالية كلاسيكية',
    description: 'Une montre classique au design élégant.',
    descriptionAr: 'ساعة رجالية كلاسيكية بتصميم أنيق.',
    price: 850,
    oldPrice: 1100,
    type: 'preorder',
    stock: null,
    delivery: 'Délai à confirmer',
    deliveryAr: 'مدة التوصيل تُحدد عند الطلب',
    colors: ['Noir', 'Argent'],
    colorsAr: ['أسود', 'فضي'],
    sizes: ['Unique'],
    image: 'https://placehold.co/800x1000/e2e8f0/333333?text=Montre',
  },
  {
    id: '3',
    name: 'Accessoire maison moderne',
    nameAr: 'مستلزمات منزلية عصرية',
    description: 'Un accessoire pratique pour la maison.',
    descriptionAr: 'منتج عملي ومفيد للاستخدام المنزلي.',
    price: 350,
    type: 'stock',
    stock: 12,
    delivery: 'Selon votre zone',
    deliveryAr: 'حسب منطقة التوصيل',
    colors: ['Gris'],
    colorsAr: ['رمادي'],
    sizes: ['Unique'],
    image: 'https://placehold.co/800x1000/e5e7eb/333333?text=Maison',
  },
  {
    id: '4',
    name: 'Ensemble vêtements enfant',
    nameAr: 'طقم ملابس أطفال',
    description: 'Un ensemble confortable pour enfants.',
    descriptionAr: 'طقم ملابس مريح للأطفال.',
    price: 700,
    oldPrice: 900,
    type: 'preorder',
    stock: null,
    delivery: 'Délai à confirmer',
    deliveryAr: 'مدة التوصيل تُحدد عند الطلب',
    colors: ['Bleu', 'Gris'],
    colorsAr: ['أزرق', 'رمادي'],
    sizes: ['2 ans', '4 ans', '6 ans'],
    image: 'https://placehold.co/800x1000/fef3c7/333333?text=Enfants',
  },
]

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { language, currencyLabel } = useLanguage()
  const ar = language === 'ar'
  const tr = (fr: string, arabic: string) => ar ? arabic : fr

  const product = products.find((item) => item.id === id)

  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedSize, setSelectedSize] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(value)

  const Arrow = ar ? ArrowRight : ArrowLeft

  if (!product) {
    return (
      <main className="min-h-screen bg-[#fafaf9] px-5 py-20 text-center">
        <h1 className="text-2xl font-bold">
          {tr('Produit introuvable', 'المنتج غير موجود')}
        </h1>
        <Link to="/boutique" className="mt-6 inline-block text-amber-700 underline">
          {tr('Retour à la boutique', 'العودة إلى المتجر')}
        </Link>
      </main>
    )
  }

  const preorder = product.type === 'preorder'
  const maxQuantity = product.stock ?? 10
  const total = product.price * quantity
  const deposit = preorder ? total / 2 : total

  return (
    <main
      dir={ar ? 'rtl' : 'ltr'}
      lang={language}
      className="min-h-screen bg-[#fafaf9] text-slate-900"
    >
      <div className="mx-auto max-w-7xl px-5 py-8">
        <Link
          to="/boutique"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-amber-700"
        >
          <Arrow size={18} />
          {tr('Retour à la boutique', 'العودة إلى المتجر')}
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Product image */}
          <div className="overflow-hidden rounded-3xl bg-white">
            <img
              src={product.image}
              alt={tr(product.name, product.nameAr)}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>

          {/* Product information */}
          <div>
            <span className={`inline-block rounded-full px-4 py-2 text-xs font-bold ${
              preorder
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {preorder
                ? tr('Sur commande', 'حسب الطلب')
                : tr('En stock', 'متوفر الآن')}
            </span>

            <h1 className="mt-5 text-3xl font-black sm:text-4xl">
              {tr(product.name, product.nameAr)}
            </h1>

            <p className="mt-4 leading-8 text-slate-500">
              {tr(product.description, product.descriptionAr)}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <span className="text-3xl font-black">
                <bdi>{formatPrice(product.price)}</bdi> {currencyLabel}
              </span>

              {product.oldPrice && product.oldPrice > product.price && (
                <span className="text-lg text-slate-400 line-through">
                  <bdi>{formatPrice(product.oldPrice)}</bdi> {currencyLabel}
                </span>
              )}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-7">
              <h2 className="mb-3 text-sm font-bold">
                {tr('Couleur', 'اللون')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color, index) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(index)}
                    className={`rounded-xl border px-5 py-3 text-sm ${
                      selectedColor === index
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {ar ? product.colorsAr[index] : color}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <h2 className="mb-3 text-sm font-bold">
                {tr('Taille', 'المقاس')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size, index) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(index)}
                    className={`rounded-xl border px-5 py-3 text-sm ${
                      selectedSize === index
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {size === 'Unique'
                      ? tr('Unique', 'مقاس واحد')
                      : size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <h2 className="mb-3 text-sm font-bold">
                {tr('Quantité', 'الكمية')}
              </h2>
              <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="px-5 py-3 disabled:opacity-30"
                >
                  −
                </button>
                <span className="min-w-12 text-center font-bold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  disabled={quantity >= maxQuantity}
                  className="px-5 py-3 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-amber-50 p-6">
              <div className="flex justify-between gap-3 text-sm">
                <span>{tr('Total', 'المجموع')}</span>
                <strong>
                  <bdi>{formatPrice(total)}</bdi> {currencyLabel}
                </strong>
              </div>

              <div className="mt-4 flex justify-between gap-3 text-sm">
                <span>
                  {preorder
                    ? tr('Acompte 50%', 'الدفعة المقدمة 50%')
                    : tr('Paiement intégral', 'الدفع الكامل')}
                </span>
                <strong className="text-amber-800">
                  <bdi>{formatPrice(deposit)}</bdi> {currencyLabel}
                </strong>
              </div>

              {preorder && (
                <p className="mt-4 text-xs text-slate-600">
                  {tr(
                    'Le reste est payable à la réception.',
                    'يُدفع المبلغ المتبقي عند الاستلام.'
                  )}
                </p>
              )}
            </div>

            <button
              type="button"
              disabled
              className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl bg-slate-950 px-6 py-4 font-bold text-white opacity-60"
            >
              <ShoppingBag size={20} />
              {tr('Commande bientôt disponible', 'الطلب سيتوفر قريبًا')}
            </button>

            <div className="mt-7 grid gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Truck size={19} />
                <span>
                  {tr('Livraison : ', 'التوصيل: ')}
                  {tr(product.delivery, product.deliveryAr)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <PackageCheck size={19} />
                <span>
                  {preorder
                    ? tr('Produit sur commande', 'منتج حسب الطلب')
                    : tr(
                        `Stock indicatif : ${product.stock}`,
                        `المخزون التجريبي: ${product.stock}`
                      )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheck size={19} />
                <span>
                  {tr(
                    'Paiement à confirmer par TEO STORE',
                    'يتم تأكيد الدفع من طرف متجر تيو'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}