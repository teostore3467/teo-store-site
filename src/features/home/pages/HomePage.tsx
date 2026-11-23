import { Link } from 'react-router-dom'
import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import FAQSection from '../components/FAQSection'
import FeaturedDigitalSection from '../components/FeaturedDigitalSection'
import HowItWorksSection from '../components/HowItWorksSection'
import WhyTeoSection from '../components/WhyTeoSection'

/**
 * TEO STORE — storefront landing page.
 * Existing product, FAQ, benefits and purchase components remain connected.
 * The header renders the store logo configured through ADMIN.
 */
function HomePage() {
  const { language, t } = useLanguage()
  const ar = language === 'ar'

  const categories = [
    { icon: '✦', name: ar ? 'الذكاء الاصطناعي' : 'Intelligence artificielle', detail: ar ? 'أدوات وخدمات AI' : 'Outils et services IA', color: 'from-blue-500/25 to-sky-500/5' },
    { icon: '◈', name: ar ? 'البطاقات الرقمية' : 'Cartes numériques', detail: ar ? 'بطاقات وأكواد رقمية' : 'Cartes et codes numériques', color: 'from-indigo-500/25 to-blue-500/5' },
    { icon: '▣', name: ar ? 'الاشتراكات' : 'Abonnements', detail: ar ? 'خدمات الترفيه والإنتاجية' : 'Divertissement et productivité', color: 'from-violet-500/25 to-indigo-500/5' },
    { icon: '⌘', name: ar ? 'شحن الألعاب' : 'Recharge gaming', detail: ar ? 'ألعاب وخدمات رقمية' : 'Jeux et services numériques', color: 'from-cyan-500/25 to-blue-500/5' },
  ]

  const steps = [
    { n: '01', title: ar ? 'اختر الخدمة' : 'Choisissez', description: ar ? 'تصفح المنتجات واقرأ تفاصيل التفعيل والضمان.' : 'Consultez les produits et les conditions.' },
    { n: '02', title: ar ? 'أرسل طلبك' : 'Commandez', description: ar ? 'أكمل البيانات وأرفق إثبات الدفع.' : 'Renseignez les informations et le justificatif.' },
    { n: '03', title: ar ? 'تابع الاستلام' : 'Suivez la livraison', description: ar ? 'تابع حالة طلبك من حسابك حتى التسليم.' : 'Suivez votre commande depuis votre compte.' },
  ]

  return (
    <main dir={ar ? 'rtl' : 'ltr'} className="min-h-screen overflow-hidden bg-[#f7f9fd] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#071334] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_5%,rgba(34,110,255,0.34),transparent_43%),radial-gradient(ellipse_at_0%_95%,rgba(18,73,172,0.30),transparent_43%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-44 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full border border-white/10" />
        <Container className="relative py-14 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-xs font-bold tracking-wide text-blue-100">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                TEO STORE <span className="text-blue-200/50">/</span> {ar ? 'موريتانيا' : 'Mauritanie'}
              </div>
              <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.18] tracking-tight sm:text-5xl lg:text-[3.65rem]">
                {ar ? 'تسوّق خدماتك الرقمية' : 'Vos services numériques,'}
                <span className="mt-2 block bg-gradient-to-r from-[#69b5ff] via-[#91b9ff] to-white bg-clip-text text-transparent">
                  {ar ? 'بوضوح وثقة.' : 'en toute simplicité.'}
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                {ar
                  ? 'اكتشف الاشتراكات والبطاقات الرقمية وخدمات الألعاب والذكاء الاصطناعي. تفاصيل واضحة قبل الشراء، وطلبات يمكنك متابعتها خطوة بخطوة.'
                  : 'Découvrez les abonnements, cartes numériques, services gaming et outils IA. Des informations claires et un suivi de commande étape par étape.'}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/services-numeriques" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#1265ed] px-7 py-3 text-sm font-extrabold text-white shadow-[0_14px_35px_rgba(12,86,225,0.3)] transition hover:-translate-y-0.5 hover:bg-[#287bff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300">
                  {t.home.exploreServices} <span aria-hidden="true">{ar ? '←' : '→'}</span>
                </Link>
                <Link to="/connexion" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-7 py-3 text-sm font-bold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                  {t.common.myAccount}
                </Link>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                {[t.home.securePayment, t.home.verifiedProducts, t.home.fastDelivery].map((label, i) => (
                  <span key={i} className="inline-flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-bold text-emerald-300">✓</span>{label}</span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[540px]">
              <div aria-hidden="true" className="absolute -inset-5 rounded-[40px] bg-blue-600/20 blur-3xl" />
              <div className="relative rounded-[30px] border border-white/15 bg-white/[0.08] p-4 shadow-[0_35px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs font-extrabold tracking-[0.2em] text-blue-300">TEO STORE</p>
                    <h2 className="mt-1 text-xl font-black">{ar ? 'اكتشف ما يناسبك' : 'Découvrez nos univers'}</h2>
                    <p className="mt-1 text-xs text-slate-300">{ar ? 'خدمات متنوعة، تجربة واحدة سهلة' : 'Tous vos services, au même endroit'}</p>
                  </div>
                  <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black shadow-lg shadow-blue-950/50">T</div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <Link key={category.name} to="/services-numeriques" className={`group rounded-2xl border border-white/10 bg-gradient-to-br ${category.color} p-4 transition hover:-translate-y-0.5 hover:border-blue-300/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300`}>
                      <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-2xl text-blue-100">{category.icon}</span>
                      <h3 className="mt-4 text-sm font-extrabold sm:text-base">{category.name}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-300">{category.detail}</p>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-blue-300/15 bg-[#0a2457]/70 p-4">
                  <div><p className="text-xs text-blue-200">{ar ? 'ابدأ من هنا' : 'Commencez ici'}</p><p className="mt-1 text-sm font-bold">{ar ? 'تصفح جميع المنتجات' : 'Voir tous les produits'}</p></div>
                  <Link to="/services-numeriques" aria-label={ar ? 'عرض المنتجات' : 'Voir les produits'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-black text-[#071334] transition hover:bg-blue-100">{ar ? '←' : '→'}</Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-slate-200/80 bg-white">
        <Container className="py-6 sm:py-8">
          <div className="grid gap-5 sm:grid-cols-3 sm:gap-8">
            {[
              { icon: '✓', title: ar ? 'معلومات واضحة' : 'Informations claires', description: ar ? 'تعرف على نوع الخدمة وشروطها قبل الطلب' : 'Conditions détaillées avant commande' },
              { icon: '◷', title: ar ? 'تتبع الطلب' : 'Suivi de commande', description: ar ? 'تابع مراحل المعالجة والتسليم' : 'Suivez chaque étape de votre commande' },
              { icon: '◇', title: ar ? 'حسابك في مكان واحد' : 'Votre espace client', description: ar ? 'طلباتك وتفاصيلها من صفحة واحدة' : 'Vos commandes et leurs détails réunis' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-700">{item.icon}</span>
                <div><h2 className="text-sm font-extrabold text-slate-900">{item.title}</h2><p className="mt-1 text-xs leading-6 text-slate-500">{item.description}</p></div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-[#f7f9fd] py-12 sm:py-16">
        <Container>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">TEO CATEGORIES</p><h2 className="mt-2 text-2xl font-black text-[#0a1c46] sm:text-3xl">{ar ? 'تصفح حسب نوع الخدمة' : 'Explorez nos catégories'}</h2><p className="mt-2 text-sm text-slate-500">{ar ? 'اختر القسم المناسب لك بسهولة' : 'Trouvez rapidement le service recherché'}</p></div>
            <Link to="/services-numeriques" className="text-sm font-extrabold text-blue-700 hover:text-blue-900">{ar ? 'عرض كل الخدمات ←' : 'Tous les services →'}</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {categories.map((category) => (
              <Link key={category.name} to="/services-numeriques" className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,35,80,0.035)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_35px_rgba(15,55,140,0.1)] sm:p-6">
                <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-bold text-blue-700">{category.icon}</span>
                <h3 className="mt-5 text-sm font-extrabold text-[#0a1c46] sm:text-base">{category.name}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{category.detail}</p>
                <span aria-hidden="true" className="mt-4 inline-block text-lg text-blue-700 transition group-hover:translate-x-1">{ar ? '←' : '→'}</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Existing section owns real Supabase products, pricing and availability. */}
      <FeaturedDigitalSection />

      <section className="bg-white py-12 sm:py-16">
        <Container>
          <div className="mb-8 text-center"><p className="text-xs font-extrabold tracking-[0.2em] text-blue-700">HOW IT WORKS</p><h2 className="mt-2 text-2xl font-black text-[#0a1c46] sm:text-3xl">{ar ? 'كيف تطلب من TEO STORE؟' : 'Comment commander ?'}</h2></div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n} className="rounded-3xl border border-slate-200 bg-[#f9fbff] p-6 sm:p-7">
                <span className="text-3xl font-black text-blue-200">{step.n}</span><h3 className="mt-4 text-lg font-extrabold text-[#0a1c46]">{step.title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <WhyTeoSection />
      <HowItWorksSection />
      <FAQSection />

      <section className="bg-[#071334] py-12 text-white sm:py-16">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div><p className="text-xs font-extrabold tracking-[0.2em] text-blue-300">TEO STORE</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">{ar ? 'جاهز لاختيار خدمتك؟' : 'Prêt à découvrir nos services ?'}</h2><p className="mt-2 text-sm leading-7 text-slate-300">{ar ? 'تصفح الخدمات، راجع التفاصيل، ثم أكمل طلبك بسهولة.' : 'Parcourez nos offres et commandez en toute simplicité.'}</p></div>
          <Link to="/services-numeriques" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 px-7 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500">{t.home.exploreServices} <span className="ms-3">{ar ? '←' : '→'}</span></Link>
        </Container>
      </section>
    </main>
  )
}

export default HomePage
