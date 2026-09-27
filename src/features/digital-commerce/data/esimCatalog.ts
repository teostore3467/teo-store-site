export type LocalizedText = {
  fr: string
  ar: string
}

export type EsimPlan = {
  id: string
  data: LocalizedText
  duration: LocalizedText
  speed?: LocalizedText
  price: string
  type: 'limited' | 'unlimited'
  popular?: boolean
}

export type EsimCountry = {
  slug: string
  code: string
  name: LocalizedText
  flag: string
  description: LocalizedText
  imageLabel: LocalizedText
  plans: EsimPlan[]
}

export const networkSpeed: LocalizedText = {
  fr: '4G / 5G',
  ar: '4G / 5G',
}

export const highSpeed: LocalizedText = {
  fr: 'Haut débit',
  ar: 'سرعة عالية',
}

export const esimCountries: EsimCountry[] = [
  {
    slug: 'china',
    code: 'CN',
    name: {
      fr: 'Chine',
      ar: 'الصين',
    },
    flag: '🇨🇳',
    description: {
      fr: 'Restez connecté en Chine avec une eSIM digitale rapide, simple à activer et prête pour votre voyage.',
      ar: 'ابقَ متصلًا في الصين مع eSIM رقمية سريعة وسهلة التفعيل وجاهزة لرحلتك.',
    },
    imageLabel: {
      fr: 'Shanghai · Chine',
      ar: 'شنغهاي · الصين',
    },
    plans: [
      {
        id: 'china-1gb-7d',
        data: {
          fr: '1 GB',
          ar: '1 GB',
        },
        duration: {
          fr: '7 jours',
          ar: '7 أيام',
        },
        speed: networkSpeed,
        price: '190 MRU',
        type: 'limited',
      },
      {
        id: 'china-3gb-15d',
        data: {
          fr: '3 GB',
          ar: '3 GB',
        },
        duration: {
          fr: '15 jours',
          ar: '15 يومًا',
        },
        speed: networkSpeed,
        price: '390 MRU',
        type: 'limited',
        popular: true,
      },
      {
        id: 'china-5gb-30d',
        data: {
          fr: '5 GB',
          ar: '5 GB',
        },
        duration: {
          fr: '30 jours',
          ar: '30 يومًا',
        },
        speed: networkSpeed,
        price: '590 MRU',
        type: 'limited',
      },
      {
        id: 'china-10gb-30d',
        data: {
          fr: '10 GB',
          ar: '10 GB',
        },
        duration: {
          fr: '30 jours',
          ar: '30 يومًا',
        },
        speed: networkSpeed,
        price: '890 MRU',
        type: 'limited',
      },
      {
        id: 'china-unlimited-1d',
        data: {
          fr: 'Illimité',
          ar: 'غير محدود',
        },
        duration: {
          fr: '1 jour',
          ar: 'يوم واحد',
        },
        speed: highSpeed,
        price: '220 MRU',
        type: 'unlimited',
      },
      {
        id: 'china-unlimited-3d',
        data: {
          fr: 'Illimité',
          ar: 'غير محدود',
        },
        duration: {
          fr: '3 jours',
          ar: '3 أيام',
        },
        speed: highSpeed,
        price: '450 MRU',
        type: 'unlimited',
      },
      {
        id: 'china-unlimited-5d',
        data: {
          fr: 'Illimité',
          ar: 'غير محدود',
        },
        duration: {
          fr: '5 jours',
          ar: '5 أيام',
        },
        speed: highSpeed,
        price: '650 MRU',
        type: 'unlimited',
        popular: true,
      },
      {
        id: 'china-unlimited-10d',
        data: {
          fr: 'Illimité',
          ar: 'غير محدود',
        },
        duration: {
          fr: '10 jours',
          ar: '10 أيام',
        },
        speed: highSpeed,
        price: '1 100 MRU',
        type: 'unlimited',
      },
    ],
  },

  {
    slug: 'turkey',
    code: 'TR',
    name: {
      fr: 'Turquie',
      ar: 'تركيا',
    },
    flag: '🇹🇷',
    description: {
      fr: 'Profitez d’une connexion eSIM en Turquie avec plusieurs forfaits data et illimités.',
      ar: 'استمتع باتصال eSIM في تركيا مع مجموعة من باقات البيانات والباقات غير المحدودة.',
    },
    imageLabel: {
      fr: 'Istanbul · Turquie',
      ar: 'إسطنبول · تركيا',
    },
    plans: [
      {
        id: 'turkey-1gb-7d',
        data: {
          fr: '1 GB',
          ar: '1 GB',
        },
        duration: {
          fr: '7 jours',
          ar: '7 أيام',
        },
        speed: networkSpeed,
        price: '180 MRU',
        type: 'limited',
      },
      {
        id: 'turkey-3gb-15d',
        data: {
          fr: '3 GB',
          ar: '3 GB',
        },
        duration: {
          fr: '15 jours',
          ar: '15 يومًا',
        },
        speed: networkSpeed,
        price: '350 MRU',
        type: 'limited',
        popular: true,
      },
      {
        id: 'turkey-5gb-30d',
        data: {
          fr: '5 GB',
          ar: '5 GB',
        },
        duration: {
          fr: '30 jours',
          ar: '30 يومًا',
        },
        speed: networkSpeed,
        price: '520 MRU',
        type: 'limited',
      },
      {
        id: 'turkey-unlimited-3d',
        data: {
          fr: 'Illimité',
          ar: 'غير محدود',
        },
        duration: {
          fr: '3 jours',
          ar: '3 أيام',
        },
        speed: highSpeed,
        price: '430 MRU',
        type: 'unlimited',
      },
      {
        id: 'turkey-unlimited-7d',
        data: {
          fr: 'Illimité',
          ar: 'غير محدود',
        },
        duration: {
          fr: '7 jours',
          ar: '7 أيام',
        },
        speed: highSpeed,
        price: '790 MRU',
        type: 'unlimited',
        popular: true,
      },
    ],
  },

  {
    slug: 'uae',
    code: 'AE',
    name: {
      fr: 'Émirats arabes unis',
      ar: 'الإمارات العربية المتحدة',
    },
    flag: '🇦🇪',
    description: {
      fr: 'eSIM digitale pour les Émirats arabes unis avec activation rapide et plusieurs options de données.',
      ar: 'eSIM رقمية للإمارات العربية المتحدة مع تفعيل سريع وخيارات متعددة للبيانات.',
    },
    imageLabel: {
      fr: 'Dubai · Émirats arabes unis',
      ar: 'دبي · الإمارات العربية المتحدة',
    },
    plans: [
      {
        id: 'uae-1gb-7d',
        data: {
          fr: '1 GB',
          ar: '1 GB',
        },
        duration: {
          fr: '7 jours',
          ar: '7 أيام',
        },
        speed: networkSpeed,
        price: '220 MRU',
        type: 'limited',
      },
      {
        id: 'uae-3gb-15d',
        data: {
          fr: '3 GB',
          ar: '3 GB',
        },
        duration: {
          fr: '15 jours',
          ar: '15 يومًا',
        },
        speed: networkSpeed,
        price: '420 MRU',
        type: 'limited',
        popular: true,
      },
      {
        id: 'uae-5gb-30d',
        data: {
          fr: '5 GB',
          ar: '5 GB',
        },
        duration: {
          fr: '30 jours',
          ar: '30 يومًا',
        },
        speed: networkSpeed,
        price: '650 MRU',
        type: 'limited',
      },
      {
        id: 'uae-unlimited-3d',
        data: {
          fr: 'Illimité',
          ar: 'غير محدود',
        },
        duration: {
          fr: '3 jours',
          ar: '3 أيام',
        },
        speed: highSpeed,
        price: '480 MRU',
        type: 'unlimited',
      },
      {
        id: 'uae-unlimited-7d',
        data: {
          fr: 'Illimité',
          ar: 'غير محدود',
        },
        duration: {
          fr: '7 jours',
          ar: '7 أيام',
        },
        speed: highSpeed,
        price: '890 MRU',
        type: 'unlimited',
        popular: true,
      },
    ],
  },

  {
    slug: 'saudi-arabia',
    code: 'SA',
    name: {
      fr: 'Arabie saoudite',
      ar: 'السعودية',
    },
    flag: '🇸🇦',
    description: {
      fr: 'Connexion eSIM pour l’Arabie saoudite avec plusieurs forfaits adaptés à votre séjour.',
      ar: 'اتصال eSIM في السعودية مع مجموعة من الباقات المناسبة لمدة إقامتك.',
    },
    imageLabel: {
      fr: 'Riyad · Arabie saoudite',
      ar: 'الرياض · السعودية',
    },
    plans: [
      {
        id: 'saudi-1gb-7d',
        data: {
          fr: '1 GB',
          ar: '1 GB',
        },
        duration: {
          fr: '7 jours',
          ar: '7 أيام',
        },
        speed: networkSpeed,
        price: '200 MRU',
        type: 'limited',
      },
      {
        id: 'saudi-3gb-15d',
        data: {
          fr: '3 GB',
          ar: '3 GB',
        },
        duration: {
          fr: '15 jours',
          ar: '15 يومًا',
        },
        speed: networkSpeed,
        price: '390 MRU',
        type: 'limited',
        popular: true,
      },
      {
        id: 'saudi-5gb-30d',
        data: {
          fr: '5 GB',
          ar: '5 GB',
        },
        duration: {
          fr: '30 jours',
          ar: '30 يومًا',
        },
        speed: networkSpeed,
        price: '590 MRU',
        type: 'limited',
      },
      {
        id: 'saudi-unlimited-5d',
        data: {
          fr: 'Illimité',
          ar: 'غير محدود',
        },
        duration: {
          fr: '5 jours',
          ar: '5 أيام',
        },
        speed: highSpeed,
        price: '690 MRU',
        type: 'unlimited',
        popular: true,
      },
    ],
  },

  {
    slug: 'france',
    code: 'FR',
    name: {
      fr: 'France',
      ar: 'فرنسا',
    },
    flag: '🇫🇷',
    description: {
      fr: 'Restez connecté en France avec une eSIM simple, rapide et entièrement digitale.',
      ar: 'ابقَ متصلًا في فرنسا مع eSIM بسيطة وسريعة ورقمية بالكامل.',
    },
    imageLabel: {
      fr: 'Paris · France',
      ar: 'باريس · فرنسا',
    },
    plans: [
      {
        id: 'france-1gb-7d',
        data: {
          fr: '1 GB',
          ar: '1 GB',
        },
        duration: {
          fr: '7 jours',
          ar: '7 أيام',
        },
        speed: networkSpeed,
        price: '190 MRU',
        type: 'limited',
      },
      {
        id: 'france-5gb-30d',
        data: {
          fr: '5 GB',
          ar: '5 GB',
        },
        duration: {
          fr: '30 jours',
          ar: '30 يومًا',
        },
        speed: networkSpeed,
        price: '480 MRU',
        type: 'limited',
        popular: true,
      },
      {
        id: 'france-10gb-30d',
        data: {
          fr: '10 GB',
          ar: '10 GB',
        },
        duration: {
          fr: '30 jours',
          ar: '30 يومًا',
        },
        speed: networkSpeed,
        price: '750 MRU',
        type: 'limited',
      },
      {
        id: 'france-unlimited-7d',
        data: {
          fr: 'Illimité',
          ar: 'غير محدود',
        },
        duration: {
          fr: '7 jours',
          ar: '7 أيام',
        },
        speed: highSpeed,
        price: '850 MRU',
        type: 'unlimited',
        popular: true,
      },
    ],
  },

  {
    slug: 'usa',
    code: 'US',
    name: {
      fr: 'États-Unis',
      ar: 'الولايات المتحدة',
    },
    flag: '🇺🇸',
    description: {
      fr: 'Voyagez aux États-Unis avec une eSIM digitale et plusieurs forfaits flexibles.',
      ar: 'سافر إلى الولايات المتحدة مع eSIM رقمية وباقات مرنة متعددة.',
    },
    imageLabel: {
      fr: 'New York · États-Unis',
      ar: 'نيويورك · الولايات المتحدة',
    },
    plans: [
      {
        id: 'usa-1gb-7d',
        data: {
          fr: '1 GB',
          ar: '1 GB',
        },
        duration: {
          fr: '7 jours',
          ar: '7 أيام',
        },
        speed: networkSpeed,
        price: '220 MRU',
        type: 'limited',
      },
      {
        id: 'usa-5gb-30d',
        data: {
          fr: '5 GB',
          ar: '5 GB',
        },
        duration: {
          fr: '30 jours',
          ar: '30 يومًا',
        },
        speed: networkSpeed,
        price: '550 MRU',
        type: 'limited',
        popular: true,
      },
      {
        id: 'usa-10gb-30d',
        data: {
          fr: '10 GB',
          ar: '10 GB',
        },
        duration: {
          fr: '30 jours',
          ar: '30 يومًا',
        },
        speed: networkSpeed,
        price: '850 MRU',
        type: 'limited',
      },
      {
        id: 'usa-unlimited-7d',
        data: {
          fr: 'Illimité',
          ar: 'غير محدود',
        },
        duration: {
          fr: '7 jours',
          ar: '7 أيام',
        },
        speed: highSpeed,
        price: '950 MRU',
        type: 'unlimited',
        popular: true,
      },
    ],
  },

  {
    slug: 'spain',
    code: 'ES',
    name: {
      fr: 'Espagne',
      ar: 'إسبانيا',
    },
    flag: '🇪🇸',
    description: {
      fr: 'Connexion eSIM pour l’Espagne avec activation simple et forfaits flexibles.',
      ar: 'اتصال eSIM في إسبانيا مع تفعيل بسيط وباقات مرنة.',
    },
    imageLabel: {
      fr: 'Madrid · Espagne',
      ar: 'مدريد · إسبانيا',
    },
    plans: [
      {
        id: 'spain-1gb-7d',
        data: {
          fr: '1 GB',
          ar: '1 GB',
        },
        duration: {
          fr: '7 jours',
          ar: '7 أيام',
        },
        speed: networkSpeed,
        price: '190 MRU',
        type: 'limited',
      },
      {
        id: 'spain-5gb-30d',
        data: {
          fr: '5 GB',
          ar: '5 GB',
        },
        duration: {
          fr: '30 jours',
          ar: '30 يومًا',
        },
        speed: networkSpeed,
        price: '490 MRU',
        type: 'limited',
        popular: true,
      },
      {
        id: 'spain-10gb-30d',
        data: {
          fr: '10 GB',
          ar: '10 GB',
        },
        duration: {
          fr: '30 jours',
          ar: '30 يومًا',
        },
        speed: networkSpeed,
        price: '760 MRU',
        type: 'limited',
      },
      {
        id: 'spain-unlimited-7d',
        data: {
          fr: 'Illimité',
          ar: 'غير محدود',
        },
        duration: {
          fr: '7 jours',
          ar: '7 أيام',
        },
        speed: highSpeed,
        price: '860 MRU',
        type: 'unlimited',
        popular: true,
      },
    ],
  },
]

export function getEsimCountryBySlug(
  slug: string | undefined,
) {
  return (
    esimCountries.find(
      (country) =>
        country.slug === slug,
    ) ?? esimCountries[0]
  )
}