import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'

const benefits = {
  fr: [
    {
      number: '01',
      title: 'Paiement sécurisé',
      description:
        'Des étapes claires et une validation soignée pour chaque commande.',
    },
    {
      number: '02',
      title: 'Services vérifiés',
      description:
        'Chaque service est contrôlé afin de garantir une expérience fiable.',
    },
    {
      number: '03',
      title: 'Livraison digitale rapide',
      description:
        'Vos accès, codes, invitations ou recharges sont traités rapidement.',
    },
    {
      number: '04',
      title: 'Support disponible',
      description:
        'Une assistance dédiée pour vos commandes, paiements et besoins après achat.',
    },
  ],
  ar: [
    {
      number: '01',
      title: 'دفع آمن',
      description:
        'خطوات واضحة ومراجعة دقيقة لكل طلب.',
    },
    {
      number: '02',
      title: 'خدمات موثوقة',
      description:
        'يتم التحقق من كل خدمة لضمان تجربة موثوقة.',
    },
    {
      number: '03',
      title: 'توصيل رقمي سريع',
      description:
        'يتم تنفيذ الحسابات والأكواد والدعوات وعمليات الشحن بسرعة.',
    },
    {
      number: '04',
      title: 'دعم متوفر',
      description:
        'مساعدة مخصصة للطلبات وعمليات الدفع وما بعد الشراء.',
    },
  ],
}

function WhyTeoSection() {
  const { language } = useLanguage()

  const isArabic = language === 'ar'
  const currentBenefits = benefits[language]

  return (
    <section
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24"
      style={{
        background:
          'linear-gradient(180deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full blur-3xl"
        style={{
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
        }}
      />

      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full blur-3xl"
        style={{
          backgroundColor: 'rgba(79, 70, 229, 0.07)',
        }}
      />

      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 shadow-sm">
              {isArabic
                ? 'لماذا TEO STORE'
                : 'POURQUOI TEO STORE'}
            </div>

            <h2 className="mt-4 max-w-xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              {isArabic
                ? 'تجربة مصممة من أجل'
                : 'Une expérience pensée pour'}

              <span className="block text-blue-600">
                {isArabic
                  ? 'الثقة والبساطة.'
                  : 'la confiance et la simplicité.'}
              </span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              {isArabic
                ? 'يجمع TEO STORE بين السرعة والوضوح والأمان والمساعدة لتسهيل شراء الخدمات الرقمية.'
                : "TEO STORE réunit rapidité, clarté, sécurité et accompagnement pour simplifier l'achat de services numériques."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {currentBenefits.map((benefit) => (
              <article
                key={benefit.number}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-5"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white"
                    style={{
                      background:
                        'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                    }}
                  >
                    {benefit.number}
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-xs font-black text-slate-400 transition group-hover:border-blue-100 group-hover:bg-blue-50 group-hover:text-blue-600">
                    {isArabic ? '↖️' : '↗️'}
                  </div>
                </div>

                <h3 className="mt-5 text-sm font-black text-slate-950 sm:text-base">
                  {benefit.title}
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

export default WhyTeoSection