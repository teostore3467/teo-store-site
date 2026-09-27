import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'

const steps = {
  fr: [
    {
      number: '01',
      title: 'Choisissez votre service',
      description:
        'Parcourez les catégories et sélectionnez le service qui correspond à votre besoin.',
    },
    {
      number: '02',
      title: 'Sélectionnez votre formule',
      description:
        'Choisissez la durée, le type d’accès ou l’option disponible pour votre commande.',
    },
    {
      number: '03',
      title: 'Effectuez le paiement',
      description:
        'Suivez les instructions de paiement et envoyez les informations demandées.',
    },
    {
      number: '04',
      title: 'Recevez votre service',
      description:
        'Après validation, votre code, recharge, invitation ou accès vous est livré.',
    },
  ],
  ar: [
    {
      number: '01',
      title: 'اختر خدمتك',
      description:
        'تصفح التصنيفات واختر الخدمة التي تناسب احتياجك.',
    },
    {
      number: '02',
      title: 'اختر الخطة',
      description:
        'اختر المدة أو نوع الوصول أو الخيار المتوفر لطلبك.',
    },
    {
      number: '03',
      title: 'أكمل عملية الدفع',
      description:
        'اتبع تعليمات الدفع وأرسل المعلومات المطلوبة.',
    },
    {
      number: '04',
      title: 'استلم خدمتك',
      description:
        'بعد التحقق، يتم تسليم الكود أو الشحن أو الدعوة أو بيانات الوصول.',
    },
  ],
}

function HowItWorksSection() {
  const { language } = useLanguage()

  const isArabic = language === 'ar'
  const currentSteps = steps[language]

  return (
    <section
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24"
      style={{
        background:
          'linear-gradient(135deg, #07101f 0%, #0b1530 48%, #172554 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full blur-3xl"
        style={{
          backgroundColor: 'rgba(37, 99, 235, 0.18)',
        }}
      />

      <Container className="relative">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-extrabold text-white/65">
            {isArabic
              ? 'كيف يعمل'
              : 'COMMENT ÇA MARCHE'}
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            {isArabic
              ? 'بسيط من البداية'
              : 'Simple du début'}

            <span
              className="block bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, #60a5fa 0%, #818cf8 55%, #c084fc 100%)',
              }}
            >
              {isArabic
                ? 'حتى استلام الخدمة.'
                : 'jusqu’à la livraison.'}
            </span>
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
            {isArabic
              ? 'تجربة واضحة بخطوات بسيطة وبدون إجراءات معقدة.'
              : 'Une expérience claire en quelques étapes, sans processus compliqué.'}
          </p>
        </div>

        <div className="relative mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-7 hidden h-px bg-white/10 lg:block" />

          {currentSteps.map((step) => (
            <article
              key={step.number}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-blue-400/25 hover:bg-white/[0.07] sm:p-5"
            >
              <div
                className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-black text-white shadow-lg"
                style={{
                  background:
                    'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                }}
              >
                {step.number}
              </div>

              <h3 className="mt-5 text-sm font-black text-white sm:text-base">
                {step.title}
              </h3>

              <p className="mt-2 text-xs leading-5 text-white/45 sm:text-sm sm:leading-6">
                {step.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-xs font-semibold text-white/45">
          <span>
            ✓{' '}
            {isArabic
              ? 'خطوات واضحة'
              : 'Processus clair'}
          </span>

          <span>
            ✓{' '}
            {isArabic
              ? 'تحقق آمن'
              : 'Validation sécurisée'}
          </span>

          <span>
            ✓{' '}
            {isArabic
              ? 'متابعة الطلب'
              : 'Suivi de commande'}
          </span>

          <span>
            ✓{' '}
            {isArabic
              ? 'دعم متوفر'
              : 'Support disponible'}
          </span>
        </div>
      </Container>
    </section>
  )
}

export default HowItWorksSection