import { useNavigate } from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'

type CategoryItem = {
  id: string
  shortLabel: string
  name: {
    fr: string
    ar: string
  }
  description: {
    fr: string
    ar: string
  }
}

const categories: CategoryItem[] = [
  {
    id: 'ai',
    shortLabel: 'AI',
    name: {
      fr: 'Intelligence artificielle',
      ar: 'الذكاء الاصطناعي',
    },
    description: {
      fr: 'ChatGPT, Gemini, Claude, Perplexity et plus.',
      ar: 'ChatGPT وGemini وClaude وPerplexity والمزيد.',
    },
  },
  {
    id: 'gaming',
    shortLabel: 'GA',
    name: {
      fr: 'Gaming & Codes',
      ar: 'الألعاب والأكواد',
    },
    description: {
      fr: 'Recharges gaming et clés digitales.',
      ar: 'شحن الألعاب والأكواد الرقمية.',
    },
  },
  {
    id: 'streaming',
    shortLabel: 'ST',
    name: {
      fr: 'Streaming',
      ar: 'البث',
    },
    description: {
      fr: 'Netflix, Shahid, Spotify et plus.',
      ar: 'Netflix وShahid وSpotify والمزيد.',
    },
  },
  {
    id: 'design',
    shortLabel: 'DE',
    name: {
      fr: 'Design',
      ar: 'التصميم',
    },
    description: {
      fr: 'Canva, Adobe, Picsart et CapCut.',
      ar: 'Canva وAdobe وPicsart وCapCut.',
    },
  },
  {
    id: 'software',
    shortLabel: 'SO',
    name: {
      fr: 'Logiciels',
      ar: 'البرامج',
    },
    description: {
      fr: 'Windows, VPN et logiciels numériques.',
      ar: 'Windows وVPN والبرامج الرقمية.',
    },
  },
  {
    id: 'gift-cards',
    shortLabel: 'GI',
    name: {
      fr: 'Gift Cards',
      ar: 'بطاقات الهدايا',
    },
    description: {
      fr: 'Cartes cadeaux digitales.',
      ar: 'بطاقات هدايا رقمية.',
    },
  },
  {
    id: 'social',
    shortLabel: 'SO',
    name: {
      fr: 'Social',
      ar: 'الخدمات الاجتماعية',
    },
    description: {
      fr: 'Abonnements premium sociaux.',
      ar: 'اشتراكات مميزة للخدمات الاجتماعية.',
    },
  },
]

function DigitalCategoriesSection() {
  const navigate = useNavigate()

  const { language } = useLanguage()

  const isArabic = language === 'ar'

  const handleCategoryClick = (
    categoryId: string,
  ) => {
    navigate(
      `/services-numeriques?category=${categoryId}`,
    )
  }

  return (
    <section className="border-b border-slate-200 bg-[#f7f9fc] py-8 sm:py-10 lg:py-12">
      <Container>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
            {isArabic ? 'الفئات' : 'CATÉGORIES'}
          </p>

          <h2 className="mt-2 text-[28px] font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">
            {isArabic
              ? 'استكشف الخدمات'
              : 'Explorer les services'}
          </h2>

          <p className="mt-2 max-w-2xl text-[12px] leading-6 text-slate-500 sm:text-sm">
            {isArabic
              ? 'انتقل مباشرة إلى نوع الخدمة التي تبحث عنها.'
              : 'Accédez directement au type de service que vous recherchez.'}
          </p>
        </div>

        <div
          className="mt-6 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory lg:gap-4 [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {categories.map((category) => (
            <article
              key={category.id}
              className={[
                'w-[164px] shrink-0 snap-start rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]',
                'sm:w-[190px]',
                'lg:w-[220px] lg:p-5',
                'xl:w-[230px]',
                isArabic ? 'text-right' : 'text-left',
              ].join(' ')}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-black text-white shadow-[0_8px_20px_rgba(37,99,235,0.16)]">
                {category.shortLabel}
              </div>

              <h3 className="mt-4 text-sm font-black leading-5 text-slate-950 sm:text-base">
                {category.name[language]}
              </h3>

              <p className="mt-2 min-h-[42px] text-[11px] leading-5 text-slate-500 sm:text-xs">
                {category.description[language]}
              </p>

              <button
                type="button"
                onClick={() =>
                  handleCategoryClick(
                    category.id,
                  )
                }
                className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-blue-600 transition hover:text-blue-500"
              >
                {isArabic ? 'استكشف' : 'Explorer'}

                <span
                  className={
                    isArabic ? 'rotate-180' : ''
                  }
                >
                  →
                </span>
              </button>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}

export default DigitalCategoriesSection