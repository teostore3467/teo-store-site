import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  PackageCheck,
  ShieldCheck,
  Truck,
} from 'lucide-react'

import { useLanguage } from '../../../i18n/LanguageContext'
import { boutiqueProducts } from '../data/products'
import { useBoutiqueCart } from '../context/BoutiqueCartContext'

export default function BoutiqueCartPage() {
  const { language, currencyLabel } = useLanguage()

  const {
    items,
    itemCount,
    subtotal,
    amountDueNow,
    remainingAmount,
    removeItem,
    updateQuantity,
    clearCart,
  } = useBoutiqueCart()

  const ar = language === 'ar'

  const tr = (fr: string, arabic: string) =>
    ar ? arabic : fr

  const BackArrow = ar ? ArrowRight : ArrowLeft
  const ForwardArrow = ar ? ArrowLeft : ArrowRight

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(value)

  return (
    <main
      dir={ar ? 'rtl' : 'ltr'}
      lang={language}
      className="min-h-screen bg-[#fafaf9] text-slate-900"
    >
      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* Back to boutique */}
        <Link
          to="/boutique"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-amber-700"
        >
          <BackArrow size={18} />
          {tr('Continuer mes achats', 'متابعة التسوق')}
        </Link>

        {/* Heading */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
              BOUTIQUE TEO
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              {tr('Mon panier', 'سلة التسوق')}
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              {tr('Articles dans le panier :', 'عدد القطع في السلة:')}{' '}
              <bdi>{itemCount}</bdi>
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={17} />
              {tr('Vider le panier', 'إفراغ السلة')}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty cart */
          <div className="mt-10 rounded-3xl border border-slate-100 bg-white px-6 py-16 text-center">
            <ShoppingBag
              size={48}
              strokeWidth={1.5}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-5 text-xl font-bold">
              {tr('Votre panier est vide', 'سلة التسوق فارغة')}
            </h2>

            <p className="mt-3 text-sm text-slate-500">
              {tr(
                'Découvrez les produits disponibles dans notre boutique.',
                'اكتشف المنتجات المتوفرة في متجرنا.'
              )}
            </p>

            <Link
              to="/boutique"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-amber-500 hover:text-slate-950"
            >
              {tr('Découvrir les produits', 'تصفح المنتجات')}
              <ForwardArrow size={18} />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_370px]">
            {/* Cart items */}
            <section className="space-y-4">
              {items.map((item) => {
                const product = boutiqueProducts.find(
                  (p) => p.id === item.productId
                )

                if (!product) return null

                const preorder = product.type === 'preorder'

                const maxQuantity = preorder
                  ? 10
                  : product.stock ?? 0

                const colorIndex = product.colors.indexOf(
                  item.color
                )

                const displayedColor =
                  ar && colorIndex >= 0
                    ? product.colorsAr[colorIndex] ?? item.color
                    : item.color

                const displayedSize =
                  item.size === 'Unique'
                    ? tr('Unique', 'مقاس واحد')
                    : item.size

                return (
                  <article
                    key={item.key}
                    className="flex flex-col gap-5 rounded-3xl border border-slate-100 bg-white p-5 sm:flex-row"
                  >
                    {/* Product image */}
                    <Link
                      to={`/boutique/produit/${product.id}`}
                      className="block shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:w-36"
                    >
                      <img
                        src={product.image}
                        alt={tr(product.name, product.nameAr)}
                        className="aspect-square w-full object-cover sm:aspect-[4/5]"
                      />
                    </Link>

                    {/* Product details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            to={`/boutique/produit/${product.id}`}
                            className="text-lg font-bold hover:text-amber-700"
                          >
                            {tr(product.name, product.nameAr)}
                          </Link>

                          <p className="mt-2 text-sm text-slate-500">
                            {tr('Couleur', 'اللون')}: {displayedColor}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {tr('Taille', 'المقاس')}: {displayedSize}
                          </p>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          aria-label={tr(
                            'Supprimer le produit',
                            'حذف المنتج'
                          )}
                          className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={19} />
                        </button>
                      </div>

                      {/* Stock status */}
                      <div className="mt-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            preorder
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {preorder
                            ? tr('Sur commande', 'حسب الطلب')
                            : tr('En stock', 'متوفر الآن')}
                        </span>
                      </div>

                      {/* Quantity and total */}
                      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                        <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.key,
                                item.quantity - 1
                              )
                            }
                            disabled={item.quantity <= 1}
                            aria-label={tr(
                              'Diminuer la quantité',
                              'تقليل الكمية'
                            )}
                            className="px-3 py-3 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Minus size={16} />
                          </button>

                          <span className="min-w-10 text-center text-sm font-bold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.key,
                                item.quantity + 1
                              )
                            }
                            disabled={item.quantity >= maxQuantity}
                            aria-label={tr(
                              'Augmenter la quantité',
                              'زيادة الكمية'
                            )}
                            className="px-3 py-3 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="text-end">
                          <p className="text-xs text-slate-500">
                            {tr('Total du produit', 'مجموع المنتج')}
                          </p>

                          <p className="mt-1 text-lg font-black">
                            <bdi>
                              {formatPrice(
                                product.price * item.quantity
                              )}
                            </bdi>{' '}
                            {currencyLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </section>

            {/* Cart summary */}
            <aside className="rounded-3xl border border-slate-100 bg-white p-6 lg:sticky lg:top-6">
              <div className="flex items-center gap-3">
                <PackageCheck
                  size={23}
                  className="text-amber-700"
                />

                <h2 className="text-xl font-black">
                  {tr('Résumé du panier', 'ملخص السلة')}
                </h2>
              </div>

              <div className="mt-7 space-y-5 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">
                    {tr('Nombre d’articles', 'عدد القطع')}
                  </span>

                  <strong>
                    <bdi>{itemCount}</bdi>
                  </strong>
                </div>

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
                      <bdi>{formatPrice(amountDueNow)}</bdi>{' '}
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
                      <bdi>{formatPrice(remainingAmount)}</bdi>{' '}
                      {currencyLabel}
                    </strong>
                  </div>
                )}
              </div>

              {/* Payment policy */}
              <div className="mt-7 rounded-xl bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={20}
                    className="shrink-0 text-amber-700"
                  />

                  <p className="text-xs leading-6 text-amber-900">
                    {tr(
                      'Les produits en stock sont payables à 100%. Les articles sur commande nécessitent un acompte de 50%, avec le reste à la réception.',
                      'المنتجات المتوفرة تُدفع بنسبة 100%، والمنتجات حسب الطلب تتطلب دفعة مقدمة 50% والباقي عند الاستلام.'
                    )}
                  </p>
                </div>
              </div>

              {/* Checkout button */}
              <Link
                to="/boutique/commande"
                className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl bg-slate-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-amber-500 hover:text-slate-950"
              >
                <ShoppingBag size={19} />
                {tr('Passer commande', 'إتمام الطلب')}
                <ForwardArrow size={18} />
              </Link>

              <Link
                to="/boutique"
                className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-amber-700"
              >
                <BackArrow size={16} />
                {tr('Continuer mes achats', 'متابعة التسوق')}
              </Link>

              <p className="mt-5 text-center text-xs leading-6 text-slate-400">
                {tr(
                  'Aucun paiement n’est effectué à cette étape.',
                  'لن يتم تنفيذ أي عملية دفع في هذه المرحلة.'
                )}
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}