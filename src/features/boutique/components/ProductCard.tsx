import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useLanguage } from '../../../i18n/LanguageContext'

type ProductCardProps = {
  id: string
  name: string
  nameAr?: string
  price: number
  oldPrice?: number
  image: string
  type: 'stock' | 'preorder'
}

export default function ProductCard({
  id,
  name,
  nameAr,
  price,
  oldPrice,
  image,
  type,
}: ProductCardProps) {
  const { language, currencyLabel } = useLanguage()

  const ar = language === 'ar'
  const preorder = type === 'preorder'

  const productName = ar ? nameAr || name : name
  const productUrl = `/boutique/produit/${id}`
  const Arrow = ar ? ArrowLeft : ArrowRight

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(value)

  return (
    <article
      dir={ar ? 'rtl' : 'ltr'}
      className="group overflow-hidden rounded-2xl border border-slate-100 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Product image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        <Link
          to={productUrl}
          aria-label={
            ar
              ? `عرض تفاصيل ${productName}`
              : `Voir les détails de ${productName}`
          }
          className="block h-full w-full"
        >
          <img
            src={image}
            alt={productName}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Product status */}
        <span
          className={`pointer-events-none absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
            preorder
              ? 'bg-amber-100 text-amber-900'
              : 'bg-emerald-100 text-emerald-900'
          }`}
        >
          {preorder
            ? ar
              ? 'حسب الطلب'
              : 'Sur commande'
            : ar
              ? 'متوفر الآن'
              : 'En stock'}
        </span>
      </div>

      {/* Product information */}
      <div className="p-4">
        <Link
          to={productUrl}
          className="block hover:text-amber-700"
        >
          <h3 className="min-h-12 text-sm font-semibold text-slate-800 transition group-hover:text-amber-700">
            {productName}
          </h3>
        </Link>

        {/* Prices */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-lg font-black text-slate-950">
            <bdi>{formatPrice(price)}</bdi> {currencyLabel}
          </span>

          {oldPrice !== undefined && oldPrice > price && (
            <span className="text-xs text-slate-400 line-through">
              <bdi>{formatPrice(oldPrice)}</bdi> {currencyLabel}
            </span>
          )}
        </div>

        {/* Payment information */}
        <p className="mt-2 text-xs text-slate-500">
          {preorder ? (
            <>
              {ar ? 'دفعة مقدمة 50%:' : 'Acompte 50% :'}{' '}
              <bdi>{formatPrice(price / 2)}</bdi> {currencyLabel}
            </>
          ) : ar ? (
            'الدفع الكامل عند الشراء'
          ) : (
            'Paiement intégral'
          )}
        </p>

        {/* Product details link */}
        <Link
          to={productUrl}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-500 hover:text-slate-950"
        >
          {ar ? 'عرض التفاصيل' : 'Voir les détails'}
          <Arrow size={17} strokeWidth={2} />
        </Link>
      </div>
    </article>
  )
}