import { useLanguage } from '../../../i18n/LanguageContext'

type ProductCardProps = {
  name: string
  nameAr?: string
  price: number
  oldPrice?: number
  image: string
  type: 'stock' | 'preorder'
}

export default function ProductCard({
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

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(value)

  return (
    <article
      dir={ar ? 'rtl' : 'ltr'}
      className="group overflow-hidden rounded-2xl border border-slate-100 bg-white transition hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={ar ? nameAr || name : name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <span
          className={`absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
            preorder
              ? 'bg-amber-100 text-amber-900'
              : 'bg-emerald-100 text-emerald-900'
          }`}
        >
          {preorder
            ? ar ? 'حسب الطلب' : 'Sur commande'
            : ar ? 'متوفر الآن' : 'En stock'}
        </span>
      </div>

      <div className="p-4">
        <h3 className="min-h-12 text-sm font-semibold text-slate-800">
          {ar ? nameAr || name : name}
        </h3>

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

        <p className="mt-2 text-xs text-slate-500">
          {preorder
            ? (
              <>
                {ar ? 'دفعة مقدمة 50%:' : 'Acompte 50% :'}{' '}
                <bdi>{formatPrice(price / 2)}</bdi> {currencyLabel}
              </>
            )
            : ar ? 'الدفع الكامل عند الشراء' : 'Paiement intégral'}
        </p>

        <button
          type="button"
          disabled
          className="mt-4 w-full cursor-not-allowed rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white opacity-60"
        >
          {ar ? 'الطلب قريبًا' : 'Commander bientôt'}
        </button>
      </div>
    </article>
  )
}