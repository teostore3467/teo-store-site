import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Heart,
  ShoppingBag,
  Shirt,
  Baby,
  House,
  Watch,
  Sparkles,
  Gem,
  ArrowLeft,
  ArrowRight,
  Truck,
  PackageCheck,
  ShieldCheck,
  LayoutGrid,
} from 'lucide-react'

import { useLanguage } from '../../../i18n/LanguageContext'
import ProductCard from '../components/ProductCard'
import { boutiqueProducts } from '../data/products'
import { useBoutiqueCart } from '../context/BoutiqueCartContext'

const categories = [
  { id: 'femme', fr: 'Femme', ar: 'نساء', Icon: ShoppingBag },
  { id: 'homme', fr: 'Homme', ar: 'رجال', Icon: Shirt },
  { id: 'enfants', fr: 'Enfants', ar: 'أطفال', Icon: Baby },
  { id: 'maison', fr: 'Maison', ar: 'المنزل', Icon: House },
  { id: 'accessoires', fr: 'Accessoires', ar: 'إكسسوارات', Icon: Watch },
  { id: 'beaute', fr: 'Beauté', ar: 'الجمال', Icon: Sparkles },
]

export default function BoutiqueHomePage() {
  const { language } = useLanguage()
  const { itemCount } = useBoutiqueCart()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const ar = language === 'ar'
  const tr = (fr: string, arabic: string) => ar ? arabic : fr
  const Arrow = ar ? ArrowLeft : ArrowRight

  const filteredProducts = boutiqueProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      product.category === selectedCategory

    const matchesSearch =
      `${product.name} ${product.nameAr}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())

    return matchesCategory && matchesSearch
  })

  const selectCategory = (id: string) => {
    setSelectedCategory(id)
    document.getElementById('produits')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <main
      dir={ar ? 'rtl' : 'ltr'}
      lang={language}
      className="min-h-screen bg-[#fafaf9] text-slate-900"
    >
      {/* Promotional bar */}
      <div className="bg-slate-950 px-4 py-3 text-center text-xs font-medium text-white sm:text-sm">
        {tr(
          'BOUTIQUE TEO — Votre shopping en Mauritanie',
          'متجر تيو — وجهتك للتسوق في موريتانيا'
        )}
      </div>

      {/* Boutique header */}
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-slate-400">
              TEO STORE
            </p>

            <h1 className="text-2xl font-black sm:text-3xl">
              {tr('BOUTIQUE TEO', 'متجر تيو')}
            </h1>
          </div>

          {/* Search */}
          <div className="relative w-full sm:max-w-md sm:flex-1">
            <Search
              size={19}
              className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tr(
                'Rechercher un produit...',
                'ابحث عن منتج...'
              )}
              aria-label={tr('Rechercher', 'بحث')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pe-4 ps-12 text-sm outline-none focus:border-amber-500"
            />
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Heart size={21} strokeWidth={1.7} />

              <span className="hidden sm:inline">
                {tr('Favoris', 'المفضلة')}
              </span>
            </div>

            {/* Shopping cart */}
            <Link
              to="/boutique/panier"
              aria-label={tr(
                `Panier, ${itemCount} articles`,
                `سلة التسوق، ${itemCount} قطعة`
              )}
              className="group flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium transition hover:bg-amber-50 hover:text-amber-700"
            >
              <span className="relative inline-flex">
                <ShoppingBag size={23} strokeWidth={1.7} />

                {itemCount > 0 && (
                  <span className="absolute -end-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-slate-950 ring-2 ring-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </span>

              <span className="hidden ps-2 sm:inline">
                {tr('Panier', 'السلة')}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl gap-7 overflow-x-auto whitespace-nowrap px-5 py-4 text-sm font-medium">
          <a href="#categories">
            {tr('Catégories', 'الفئات')}
          </a>

          <a href="#produits">
            {tr('Produits', 'المنتجات')}
          </a>

          <a href="#collections">
            {tr('Collections', 'التشكيلات')}
          </a>

          <a href="#commande">
            {tr('Sur commande', 'حسب الطلب')}
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-7 py-16 text-white sm:px-16 sm:py-24">
          <div className="absolute end-0 top-0 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />

          <div className="relative z-10 max-w-2xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-amber-400">
              {tr(
                'La nouvelle expérience shopping',
                'تجربة تسوق جديدة ومميزة'
              )}
            </p>

            <h2 className="text-4xl font-black leading-tight sm:text-6xl">
              {tr('Votre style.', 'أناقتك.')}
              <br />
              {tr('Votre univers.', 'عالمك.')}
              <br />
              <span className="text-amber-400">
                {tr('Votre boutique.', 'متجرك.')}
              </span>
            </h2>

            <p className="mt-6 max-w-lg text-sm leading-8 text-slate-300 sm:text-base">
              {tr(
                'Découvrez la mode, les accessoires, les articles pour enfants et la maison en Mauritanie.',
                'اكتشف الملابس والإكسسوارات ومستلزمات الأطفال والمنزل في موريتانيا.'
              )}
            </p>

            <a
              href="#categories"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-amber-400 px-7 py-4 text-sm font-bold text-slate-950 hover:bg-amber-300"
            >
              {tr('Explorer la boutique', 'تصفح المتجر')}
              <Arrow size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 py-6 sm:grid-cols-3">
        {[
          {
            Icon: ShieldCheck,
            fr: 'Shopping facile',
            ar: 'تسوق بسهولة',
            descFr: 'Une expérience simple et moderne',
            descAr: 'تجربة تسوق سهلة وعصرية',
          },
          {
            Icon: PackageCheck,
            fr: 'Sur commande',
            ar: 'منتجات حسب الطلب',
            descFr: 'Commandez vos articles préférés',
            descAr: 'اطلب المنتجات التي تناسبك',
          },
          {
            Icon: Truck,
            fr: 'En Mauritanie',
            ar: 'داخل موريتانيا',
            descFr: 'Un service adapté à vos besoins',
            descAr: 'خدمات تناسب احتياجاتك',
          },
        ].map((item) => (
          <div
            key={item.fr}
            className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-6"
          >
            <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
              <item.Icon size={25} strokeWidth={1.6} />
            </div>

            <div>
              <h3 className="font-bold">
                {tr(item.fr, item.ar)}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {tr(item.descFr, item.descAr)}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section
        id="categories"
        className="mx-auto max-w-7xl px-5 py-14"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
          {tr('Nos univers', 'أقسام المتجر')}
        </p>

        <h2 className="mb-8 mt-2 text-3xl font-black">
          {tr('Explorez nos catégories', 'تصفح الفئات')}
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => {
            const active = selectedCategory === category.id

            return (
              <button
                type="button"
                key={category.id}
                onClick={() => selectCategory(category.id)}
                aria-pressed={active}
                className={`group flex min-h-40 flex-col items-center justify-center rounded-2xl border p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  active
                    ? 'border-amber-500 bg-amber-50 shadow-md'
                    : 'border-slate-100 bg-white hover:border-amber-300'
                }`}
              >
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
                    active
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-[#f8f5ef] text-slate-800 group-hover:bg-amber-100'
                  }`}
                >
                  <category.Icon
                    size={31}
                    strokeWidth={1.5}
                  />
                </div>

                <h3 className="text-sm font-bold">
                  {tr(category.fr, category.ar)}
                </h3>
              </button>
            )
          })}
        </div>
      </section>

      {/* Products */}
      <section
        id="produits"
        className="mx-auto max-w-7xl scroll-mt-8 px-5 py-14"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
          {tr('Notre sélection', 'مختاراتنا')}
        </p>

        <h2 className="mb-6 mt-2 text-3xl font-black">
          {tr('Nos produits', 'منتجاتنا')}
        </h2>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
              selectedCategory === 'all'
                ? 'bg-slate-950 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-amber-400'
            }`}
          >
            <LayoutGrid size={16} />
            {tr('Tous les produits', 'جميع المنتجات')}
          </button>

          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                selectedCategory === category.id
                  ? 'bg-slate-950 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-amber-400'
              }`}
            >
              {tr(category.fr, category.ar)}
            </button>
          ))}
        </div>

        <p className="mb-5 text-sm text-slate-500">
          {tr('Produits trouvés :', 'عدد المنتجات:')}{' '}
          <bdi>{filteredProducts.length}</bdi>
        </p>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
            <ShoppingBag
              size={36}
              strokeWidth={1.5}
              className="mx-auto mb-4 text-slate-400"
            />

            <p className="font-semibold text-slate-700">
              {tr(
                'Aucun produit dans cette catégorie pour le moment.',
                'لا توجد منتجات في هذه الفئة حاليًا.'
              )}
            </p>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all')
                setSearch('')
              }}
              className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
              {tr(
                'Voir tous les produits',
                'عرض جميع المنتجات'
              )}
            </button>
          </div>
        )}
      </section>

      {/* Collections */}
      <section
        id="collections"
        className="mx-auto max-w-7xl px-5 py-12"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
          {tr('BOUTIQUE TEO', 'متجر تيو')}
        </p>

        <h2 className="mb-8 mt-2 text-3xl font-black">
          {tr(
            'Découvrez nos collections',
            'اكتشف تشكيلاتنا'
          )}
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex min-h-64 flex-col justify-end rounded-3xl bg-[#eae6df] p-9">
            <Gem
              size={30}
              strokeWidth={1.5}
              className="mb-5"
            />

            <h3 className="text-3xl font-black">
              {tr('Mode & Style', 'الموضة والأناقة')}
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              {tr(
                'Découvrez votre prochain look.',
                'اكتشف إطلالتك القادمة.'
              )}
            </p>
          </div>

          <div className="flex min-h-64 flex-col justify-end rounded-3xl bg-[#e4e9e5] p-9">
            <House
              size={30}
              strokeWidth={1.5}
              className="mb-5"
            />

            <h3 className="text-3xl font-black">
              {tr(
                'Maison & Lifestyle',
                'المنزل والحياة اليومية'
              )}
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              {tr(
                'Des essentiels pour votre quotidien.',
                'كل ما تحتاجه لحياتك اليومية.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Preorders */}
      <section
        id="commande"
        className="mx-auto max-w-7xl px-5 py-12"
      >
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-8 sm:p-12">
          <PackageCheck
            size={34}
            strokeWidth={1.5}
            className="mb-5 text-amber-700"
          />

          <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
            {tr(
              'Service sur commande',
              'خدمة الطلب المسبق'
            )}
          </p>

          <h2 className="mt-3 text-3xl font-black">
            {tr(
              'Vous cherchez un produit particulier ?',
              'هل تبحث عن منتج معين؟'
            )}
          </h2>

          <p className="mt-4 max-w-2xl leading-8 text-slate-600">
            {tr(
              'Commandez depuis SHEIN, Amazon, Noon ou Temu. Payez 50% à la commande et le reste à la réception.',
              'اطلب منتجاتك من SHEIN أو Amazon أو Noon أو Temu. ادفع 50% مقدمًا والباقي عند استلام الطلب.'
            )}
          </p>

          <p className="mt-5 text-sm font-semibold text-amber-800">
            {tr(
              'Les délais de livraison sont précisés pour chaque produit.',
              'يتم تحديد مدة التوصيل لكل منتج.'
            )}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 bg-slate-950 px-5 py-12 text-center text-white">
        <h2 className="text-2xl font-black">
          {tr('BOUTIQUE TEO', 'متجر تيو')}
        </h2>

        <p className="mt-3 text-sm text-slate-400">
          {tr(
            'Mode · Accessoires · Maison · Lifestyle',
            'ملابس · إكسسوارات · مستلزمات منزلية · تسوق'
          )}
        </p>

        <p className="mt-5 text-xs text-slate-500">
          © 2026 TEO STORE — Mauritanie
        </p>
      </footer>
    </main>
  )
}