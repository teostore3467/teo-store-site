import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'

const faqs = {
  fr: [
    {
      question: 'Comment passer une commande ?',
      answer:
        'Choisissez votre service, sélectionnez la formule disponible, connectez-vous à votre compte puis suivez les étapes de paiement.',
    },
    {
      question: 'Quand vais-je recevoir mon service ?',
      answer:
        'Le délai dépend du service choisi. Certains produits sont livrés rapidement après validation du paiement, tandis que d’autres nécessitent un traitement manuel.',
    },
    {
      question: 'Quels moyens de paiement sont acceptés ?',
      answer:
        'TEO STORE prend en charge Bankily, Masrvi et Sedad. Les instructions exactes sont affichées pendant le paiement.',
    },
    {
      question: 'Que faire si mon paiement est refusé ?',
      answer:
        'Vous recevrez une notification avec la raison du refus et pourrez soumettre de nouvelles informations de paiement si nécessaire.',
    },
  ],

  ar: [
    {
      question: 'كيف أقدّم طلبًا؟',
      answer:
        'اختر الخدمة، ثم الخطة المتوفرة، وبعد ذلك تابع خطوات الدفع والمعلومات المطلوبة لإكمال الطلب.',
    },
    {
      question: 'متى سأستلم خدمتي؟',
      answer:
        'يعتمد وقت التسليم على نوع الخدمة. بعض الخدمات يتم تسليمها بسرعة بعد التحقق من الدفع، بينما تحتاج خدمات أخرى إلى معالجة يدوية.',
    },
    {
      question: 'ما طرق الدفع المتوفرة؟',
      answer:
        'يدعم TEO STORE الدفع عبر Bankily وMasrvi وSedad. تظهر تعليمات الدفع الدقيقة أثناء إكمال الطلب.',
    },
    {
      question: 'ماذا أفعل إذا تم رفض الدفع؟',
      answer:
        'ستظهر لك حالة الطلب وسبب الرفض، ويمكنك إرسال معلومات دفع جديدة إذا كان ذلك مطلوبًا.',
    },
  ],
}

function FAQSection() {
  const { language } = useLanguage()

  const isArabic = language === 'ar'
  const currentFaqs = faqs[language]

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute -right-32 top-0 h-72 w-72 rounded-full blur-3xl"
        style={{
          backgroundColor: 'rgba(79, 70, 229, 0.06)',
        }}
      />

      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-600">
              {isArabic
                ? 'الأسئلة الشائعة'
                : 'QUESTIONS FRÉQUENTES'}
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              {isArabic
                ? 'هل تحتاج إلى إجابة'
                : "Besoin d'une réponse"}

              <span className="block text-blue-600">
                {isArabic
                  ? 'قبل إتمام الطلب؟'
                  : 'avant de commander ?'}
              </span>
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
              {isArabic
                ? 'ستجد هنا إجابات عن أكثر الأسئلة شيوعًا حول الطلبات والدفع وتسليم الخدمات الرقمية.'
                : 'Retrouvez ici les réponses aux questions les plus courantes sur les commandes, paiements et livraisons digitales.'}
            </p>
          </div>

          <div className="space-y-3">
            {currentFaqs.map((faq, index) => (
              <details
                key={faq.question}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.04)] transition hover:border-blue-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                      }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="text-sm font-black text-slate-950 sm:text-base">
                      {faq.question}
                    </span>
                  </div>

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg font-medium text-slate-500 transition group-open:rotate-45 group-open:border-blue-100 group-open:bg-blue-50 group-open:text-blue-600">
                    +
                  </span>
                </summary>

                <div className="border-t border-slate-100 px-4 pb-5 pt-4 sm:px-5">
                  <p className="text-sm leading-7 text-slate-600">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

export default FAQSection