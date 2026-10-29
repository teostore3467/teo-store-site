import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  Truck,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react'

import { useLanguage } from '../../../i18n/LanguageContext'
import { getBoutiqueProductById } from '../data/products'
import { useBoutiqueCart } from '../context/BoutiqueCartContext'

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { language, currencyLabel } = useLanguage()
  const { addItem, itemCount } = useBoutiqueCart()

  const ar = language === 'ar'
  const tr = (fr: string, arabic: string) => ar ? arabic : fr
  const BackArrow = ar ? ArrowRight : ArrowLeft
  const ForwardArrow = ar ? ArrowLeft : ArrowRight

  const product = getBoutiqueProductById(id)

  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedSize, setSelectedSize] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(value)

  if (!product) {
    return (
      <main
        dir={ar ? 'rtl' : 'ltr'}
        className="min-h-screen bg-[#fafaf9] px-5 py-20 text-center"
      >
        <h1 className="text-2xl font-bold">
          {tr('Produit introuvable', 'المنتج غير موجود')}
        </h1>

        <Link
          to="/boutique"
          className="mt-6 inline-block text-amber-700 underline"
        >
          {tr('Retour à la boutique', 'العودة إلى المتجر')}
        </Link>
      </main>
    )
  }

  const preorder = product.type === 'preorder'
  const maxQuantity = preorder ? 10 : product.stock ?? 0
  const available = maxQuantity > 0
  const safeQuantity = Math.min(quantity, Math.max(1, maxQuantity))
  const total = product.price * safeQuantity
  const deposit = preorder ? total / 2 : total

  const handleAddToCart = () => {
    if (!available) return

    const color = product.colors[selectedColor]
    const size = product.sizes[selectedSize]

    if (!color || !size) return

    addItem(product, color, size, safeQuantity)
    setAdded(true)
  }

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
          <BackArrow size={18} />
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
            <span
              className={`inline-block rounded-full px-4 py-2 text-xs font-bold ${
                preorder
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
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

            {/* Prices */}
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <span className="text-3xl font-black">
                <bdi>{formatPrice(product.price)}</bdi> {currencyLabel}
              </span>

              {product.oldPrice !== undefined &&
                product.oldPrice > product.price && (
                  <span className="text-lg text-slate-400 line-through">
                    <bdi>{formatPrice(product.oldPrice)}</bdi> {currencyLabel}
                  </span>
                )}
            </div>

            {/* Colors */}
            <div className="mt-8 border-t border-slate-200 pt-7">
              <h2 className="mb-3 text-sm font-bold">
                {tr('Couleur', 'اللون')}
              </h2>

              <div className="flex flex-wrap gap-2">
                {product.colors.map((color, index) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(index)
                      setAdded(false)
                    }}
                    aria-pressed={selectedColor === index}
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

            {/* Sizes */}
            <div className="mt-7">
              <h2 className="mb-3 text-sm font-bold">
                {tr('Taille', 'المقاس')}
              </h2>

              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size, index) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(index)
                      setAdded(false)
                    }}
                    aria-pressed={selectedSize === index}
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

            {/* Quantity */}
            <div className="mt-7">
              <h2 className="mb-3 text-sm font-bold">
                {tr('Quantité', 'الكمية')}
              </h2>

              <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setQuantity((q) => Math.max(1, q - 1))
                    setAdded(false)
                  }}
                  disabled={!available || safeQuantity <= 1}
                  className="px-5 py-3 disabled:opacity-30"
                  aria-label={tr('Diminuer la quantité', 'تقليل الكمية')}
                >
                  −
                </button>

                <span className="min-w-12 text-center font-bold">
                  {available ? safeQuantity : 0}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setQuantity((q) => Math.min(maxQuantity, q + 1))
                    setAdded(false)
                  }}
                  disabled={!available || safeQuantity >= maxQuantity}
                  className="px-5 py-3 disabled:opacity-30"
                  aria-label={tr('Augmenter la quantité', 'زيادة الكمية')}
                >
                  +
                </button>
              </div>
            </div>

            {/* Payment summary */}
            <div className="mt-8 rounded-2xl bg-amber-50 p-6">
              <div className="flex justify-between gap-3 text-sm">
                <span>{tr('Total', 'المجموع')}</span>
                <strong>
                  <bdi>{formatPrice(available ? total : 0)}</bdi>{' '}
                  {currencyLabel}
                </strong>
              </div>

              <div className="mt-4 flex justify-between gap-3 text-sm">
                <span>
                  {preorder
                    ? tr('Acompte 50%', 'الدفعة المقدمة 50%')
                    : tr('Paiement intégral', 'الدفع الكامل')}
                </span>

                <strong className="text-amber-800">
                  <bdi>{formatPrice(available ? deposit : 0)}</bdi>{' '}
                  {currencyLabel}
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

            {/* Add to cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!available}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-slate-950 px-6 py-4 font-bold text-white transition hover:bg-amber-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingBag size={20} />
              {available
                ? tr('Ajouter au panier', 'إضافة إلى السلة')
                : tr('Rupture de stock', 'نفدت الكمية')}
            </button>

            {/* Success message and cart link */}
            {added && (
              <div
                role="status"
                className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
              >
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 size={20} />
                  {tr(
                    'Produit ajouté au panier !',
                    'تمت إضافة المنتج إلى السلة!'
                  )}
                </div>

                <p className="mt-2 text-sm text-emerald-700">
                  {tr('Articles dans le panier :', 'عدد القطع في السلة:')}{' '}
                  <bdi>{itemCount}</bdi>
                </p>

                <Link
                  to="/boutique/panier"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
                >
                  <ShoppingBag size={18} />
                  {tr('Voir mon panier', 'عرض السلة')}
                  <ForwardArrow size={17} />
                </Link>
              </div>
            )}

            {/* Delivery and payment information */}
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