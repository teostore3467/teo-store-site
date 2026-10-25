import { useState } from 'react'

const categories = [
  { name: 'Femme', icon: '✦', color: 'bg-rose-50' },
  { name: 'Homme', icon: '◈', color: 'bg-slate-100' },
  { name: 'Enfants', icon: '★', color: 'bg-amber-50' },
  { name: 'Maison', icon: '⌂', color: 'bg-emerald-50' },
  { name: 'Accessoires', icon: '◇', color: 'bg-violet-50' },
  { name: 'Beauté', icon: '✿', color: 'bg-pink-50' },
]

export default function BoutiqueHomePage() {
  const [search, setSearch] = useState('')

  return (
    <main className="min-h-screen bg-[#fafaf9] text-slate-900">

      {/* Bande promotionnelle */}
      <div className="bg-slate-950 px-4 py-3 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        BOUTIQUE TEO — Votre shopping en Mauritanie
      </div>

      {/* En-tête boutique */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6">

          <div>
            <span className="text-xs font-semibold tracking-[0.3em] text-slate-400">
              TEO STORE
            </span>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              BOUTIQUE <span className="text-amber-600">TEO.</span>
            </h1>
          </div>

          <div className="w-full max-w-md sm:w-auto sm:flex-1">
            <input
              type="search"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher un produit"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="flex items-center gap-4 text-sm font-semibold">
            <span>♡ Favoris</span>
            <span>♧ Panier</span>
          </div>

        </div>
      </section>

      {/* Navigation */}
      <nav className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl gap-7 overflow-x-auto whitespace-nowrap px-5 py-4 text-sm font-medium">
          <a href="#categories" className="hover:text-amber-600">Catégories</a>
          <a href="#collections" className="hover:text-amber-600">Collections</a>
          <a href="#commande" className="hover:text-amber-600">Sur commande</a>
          <a href="#avantages" className="hover:text-amber-600">Nos avantages</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-7 py-16 text-white sm:px-16 sm:py-24">

          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 max-w-2xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
              La nouvelle expérience shopping
            </p>

            <h2 className="text-4xl font-black leading-tight sm:text-6xl">
              Votre style.
              <br />
              Votre univers.
              <br />
              <span className="text-amber-400">Votre boutique.</span>
            </h2>

            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
              Découvrez une sélection de mode, accessoires,
              articles pour enfants et maison.
              Disponible en Mauritanie.
            </p>

            <a
              href="#categories"
              className="mt-8 inline-flex rounded-xl bg-amber-400 px-7 py-4 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
            >
              Explorer la boutique →
            </a>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section id="avantages" className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 py-6 sm:grid-cols-3">
        {[
          ['✦', 'Shopping facile', 'Une expérience simple et moderne'],
          ['◇', 'Sur commande', 'Commandez vos articles préférés'],
          ['⌂', 'En Mauritanie', 'Un service adapté à vos besoins'],
        ].map(([icon, title, desc]) => (
          <div key={title} className="rounded-2xl border border-slate-100 bg-white p-6">
            <span className="text-2xl text-amber-600">{icon}</span>
            <h3 className="mt-3 font-bold">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{desc}</p>
          </div>
        ))}
      </section>

      {/* Catégories */}
      <section id="categories" className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
              Nos univers
            </p>
            <h2 className="mt-2 text-3xl font-black">
              Explorez nos catégories
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <div
              key={category.name}
              className={`${category.color} rounded-2xl p-6 text-center transition hover:-translate-y-1 hover:shadow-md`}
            >
              <div className="mb-4 text-4xl">{category.icon}</div>
              <h3 className="text-sm font-bold">{category.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Collections */}
      <section id="collections" className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
            Boutique TEO
          </p>
          <h2 className="mt-2 text-3xl font-black">
            Découvrez nos collections
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex min-h-64 flex-col justify-end rounded-3xl bg-[#eae6df] p-9">
            <p className="mb-2 text-sm font-semibold">COLLECTION</p>
            <h3 className="text-3xl font-black">Mode & Style</h3>
            <p className="mt-2 text-sm text-slate-600">
              Découvrez votre prochain look.
            </p>
          </div>

          <div className="flex min-h-64 flex-col justify-end rounded-3xl bg-[#e4e9e5] p-9">
            <p className="mb-2 text-sm font-semibold">COLLECTION</p>
            <h3 className="text-3xl font-black">Maison & Lifestyle</h3>
            <p className="mt-2 text-sm text-slate-600">
              Des essentiels pour votre quotidien.
            </p>
          </div>
        </div>
      </section>

      {/* Sur commande */}
      <section id="commande" className="mx-auto max-w-7xl px-5 py-12">
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-8 sm:p-12">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
            Service sur commande
          </span>

          <h2 className="mt-3 text-3xl font-black">
            Vous cherchez un produit particulier ?
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            Commandez vos articles depuis SHEIN, Amazon,
            Noon ou Temu. Payez 50 % à la commande
            et le reste à la réception.
          </p>

          <p className="mt-5 text-sm font-semibold text-amber-800">
            Les délais de livraison sont précisés pour chaque produit.
          </p>
        </div>
      </section>

      {/* Footer boutique */}
      <section className="mt-12 bg-slate-950 px-5 py-12 text-center text-white">
        <h2 className="text-2xl font-black">BOUTIQUE TEO.</h2>
        <p className="mt-3 text-sm text-slate-400">
          Mode · Accessoires · Maison · Lifestyle
        </p>
        <p className="mt-5 text-xs text-slate-500">
          © 2026 TEO STORE — Mauritanie
        </p>
      </section>

    </main>
  )
}