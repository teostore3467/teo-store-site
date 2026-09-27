import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'

import type { ServiceCatalogItem } from '../data/serviceCatalog'
import { fetchPublicServiceCatalog } from '../data/supabaseServiceCatalog'

type ProductTone =
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'sky'
  | 'red'
  | 'emerald'
  | 'cyan'
  | 'pink'
  | 'slate'
  | 'yellow'
  | 'orange'

type LocalizedText = {
  fr: string
  ar: string
}

type ServiceLogoMap = Record<string, string>

type ServiceLogoRow = {
  service_slug: string
  logo_path: string
}

type ProductPresentation = {
  slug: string
  name: string
  subtitle: LocalizedText
  badge?: LocalizedText
  letter: string
  tone: ProductTone
}

type ProductSection = {
  id: string
  eyebrow: LocalizedText
  title: LocalizedText
  description: LocalizedText
  products: ProductPresentation[]
}

const SERVICE_LOGOS_BUCKET = 'service-logos'

function getLogoPublicUrl(path: string) {
  const { data } = supabase.storage
    .from(SERVICE_LOGOS_BUCKET)
    .getPublicUrl(path)

  return data.publicUrl
}

const sections: ProductSection[] = [
  {
    id: 'intelligence-artificielle',
    eyebrow: {
      fr: 'IA & PRODUCTIVITÉ',
      ar: 'الذكاء الاصطناعي والإنتاجية',
    },
    title: {
      fr: 'Intelligence artificielle',
      ar: 'الذكاء الاصطناعي',
    },
    description: {
      fr: 'Outils IA premium pour travailler, créer et gagner du temps.',
      ar: 'أدوات ذكاء اصطناعي مميزة للعمل والإبداع وتوفير الوقت.',
    },
    products: [
      {
        slug: 'chatgpt-plus',
        name: 'ChatGPT Plus',
        subtitle: {
          fr: 'Compte partagé ou recharge personnelle',
          ar: 'حساب مشترك أو شحن شخصي',
        },
        badge: {
          fr: 'Populaire',
          ar: 'الأكثر طلبًا',
        },
        letter: 'C',
        tone: 'blue',
      },
      {
        slug: 'gemini-pro',
        name: 'Gemini Pro',
        subtitle: {
          fr: 'Abonnement premium',
          ar: 'اشتراك مميز',
        },
        badge: {
          fr: 'Premium',
          ar: 'مميز',
        },
        letter: 'G',
        tone: 'indigo',
      },
      {
        slug: 'claude-pro',
        name: 'Claude Pro',
        subtitle: {
          fr: 'Assistant IA premium',
          ar: 'مساعد ذكاء اصطناعي مميز',
        },
        letter: 'C',
        tone: 'orange',
      },
      {
        slug: 'perplexity-pro',
        name: 'Perplexity Pro',
        subtitle: {
          fr: 'Recherche IA avancée',
          ar: 'بحث متقدم بالذكاء الاصطناعي',
        },
        letter: 'P',
        tone: 'blue',
      },
      {
        slug: 'microsoft-copilot-pro',
        name: 'Microsoft Copilot Pro',
        subtitle: {
          fr: 'Productivité avec IA',
          ar: 'إنتاجية مدعومة بالذكاء الاصطناعي',
        },
        letter: 'M',
        tone: 'sky',
      },
      {
        slug: 'midjourney',
        name: 'Midjourney',
        subtitle: {
          fr: 'Création d’images IA',
          ar: 'إنشاء الصور بالذكاء الاصطناعي',
        },
        letter: 'M',
        tone: 'violet',
      },
      {
        slug: 'elevenlabs',
        name: 'ElevenLabs',
        subtitle: {
          fr: 'Voix et audio IA',
          ar: 'الصوت والمحتوى الصوتي بالذكاء الاصطناعي',
        },
        letter: 'E',
        tone: 'pink',
      },
      {
        slug: 'notion-ai',
        name: 'Notion AI',
        subtitle: {
          fr: 'Productivité intelligente',
          ar: 'إنتاجية ذكية',
        },
        letter: 'N',
        tone: 'slate',
      },
      {
        slug: 'leonardo-ai',
        name: 'Leonardo AI',
        subtitle: {
          fr: 'Design et images IA',
          ar: 'تصميم وصور بالذكاء الاصطناعي',
        },
        letter: 'L',
        tone: 'cyan',
      },
      {
        slug: 'runway',
        name: 'Runway',
        subtitle: {
          fr: 'Vidéo générative IA',
          ar: 'إنشاء الفيديو بالذكاء الاصطناعي',
        },
        letter: 'R',
        tone: 'violet',
      },
    ],
  },

  {
    id: 'gaming-recharge',
    eyebrow: {
      fr: 'GAMING',
      ar: 'الألعاب',
    },
    title: {
      fr: 'Gaming & Recharge',
      ar: 'الألعاب والشحن',
    },
    description: {
      fr: 'Recharges rapides pour vos jeux et comptes préférés.',
      ar: 'شحن سريع لألعابك وحساباتك المفضلة.',
    },
    products: [
      {
        slug: 'pubg-uc',
        name: 'PUBG UC',
        subtitle: {
          fr: 'Recharge par Player ID',
          ar: 'شحن عبر Player ID',
        },
        badge: {
          fr: 'Top-up',
          ar: 'شحن',
        },
        letter: 'P',
        tone: 'yellow',
      },
      {
        slug: 'free-fire-diamonds',
        name: 'Free Fire',
        subtitle: {
          fr: 'Diamants Global',
          ar: 'ألماس Global',
        },
        letter: 'F',
        tone: 'orange',
      },
      {
        slug: 'call-of-duty-mobile-cp',
        name: 'Call of Duty Mobile',
        subtitle: {
          fr: 'CP Recharge',
          ar: 'شحن CP',
        },
        letter: 'C',
        tone: 'slate',
      },
      {
        slug: 'mobile-legends-diamonds',
        name: 'Mobile Legends',
        subtitle: {
          fr: 'Diamonds',
          ar: 'ألماس',
        },
        letter: 'M',
        tone: 'blue',
      },
      {
        slug: 'valorant-points',
        name: 'Valorant Points',
        subtitle: {
          fr: 'Recharge VP',
          ar: 'شحن VP',
        },
        letter: 'V',
        tone: 'red',
      },
      {
        slug: 'roblox-robux',
        name: 'Roblox Robux',
        subtitle: {
          fr: 'Robux Recharge',
          ar: 'شحن Robux',
        },
        letter: 'R',
        tone: 'red',
      },
      {
        slug: 'fortnite-vbucks',
        name: 'Fortnite V-Bucks',
        subtitle: {
          fr: 'V-Bucks',
          ar: 'V-Bucks',
        },
        letter: 'F',
        tone: 'blue',
      },
      {
        slug: 'genshin-impact',
        name: 'Genshin Impact',
        subtitle: {
          fr: 'Recharge',
          ar: 'شحن',
        },
        letter: 'G',
        tone: 'sky',
      },
      {
        slug: 'ea-sports-fc-points',
        name: 'EA SPORTS FC Points',
        subtitle: {
          fr: 'FC Points',
          ar: 'نقاط FC',
        },
        letter: 'E',
        tone: 'emerald',
      },
      {
        slug: 'honkai-star-rail',
        name: 'Honkai: Star Rail',
        subtitle: {
          fr: 'Recharge',
          ar: 'شحن',
        },
        letter: 'H',
        tone: 'violet',
      },
    ],
  },

  {
    id: 'gaming-codes',
    eyebrow: {
      fr: 'JEUX & CODES',
      ar: 'الألعاب والأكواد',
    },
    title: {
      fr: 'Jeux & Codes',
      ar: 'الألعاب والأكواد',
    },
    description: {
      fr: 'Cartes et codes numériques pour gaming.',
      ar: 'بطاقات وأكواد رقمية للألعاب.',
    },
    products: [
      {
        slug: 'minecraft-minecoins',
        name: 'Minecraft Minecoins',
        subtitle: {
          fr: 'USD Global',
          ar: 'USD Global',
        },
        letter: 'M',
        tone: 'emerald',
      },
      {
        slug: 'league-of-legends-card',
        name: 'League of Legends',
        subtitle: {
          fr: 'USD United States',
          ar: 'USD الولايات المتحدة',
        },
        letter: 'L',
        tone: 'blue',
      },
      {
        slug: 'razer-gold-global',
        name: 'Razer Gold',
        subtitle: {
          fr: 'Global',
          ar: 'Global',
        },
        letter: 'R',
        tone: 'emerald',
      },
      {
        slug: 'battlefield-6-xbox',
        name: 'Battlefield 6',
        subtitle: {
          fr: 'XBOX Games Global',
          ar: 'XBOX Games Global',
        },
        letter: 'B',
        tone: 'orange',
      },
    ],
  },

  {
    id: 'streaming',
    eyebrow: {
      fr: 'DIVERTISSEMENT',
      ar: 'الترفيه',
    },
    title: {
      fr: 'Streaming',
      ar: 'البث والترفيه',
    },
    description: {
      fr: 'Films, séries, musique et divertissement premium.',
      ar: 'أفلام ومسلسلات وموسيقى وترفيه مميز.',
    },
    products: [
      {
        slug: 'netflix',
        name: 'Netflix',
        subtitle: {
          fr: 'Fenêtre privée ou compte privé',
          ar: 'نافذة خاصة أو حساب خاص',
        },
        badge: {
          fr: 'Streaming',
          ar: 'بث',
        },
        letter: 'N',
        tone: 'red',
      },
      {
        slug: 'prime-video',
        name: 'Prime Video',
        subtitle: {
          fr: 'Compte premium',
          ar: 'حساب مميز',
        },
        letter: 'P',
        tone: 'sky',
      },
      {
        slug: 'shahid-vip',
        name: 'Shahid VIP',
        subtitle: {
          fr: 'Recharge ou compte privé',
          ar: 'شحن أو حساب خاص',
        },
        letter: 'S',
        tone: 'blue',
      },
      {
        slug: 'spotify-premium',
        name: 'Spotify Premium',
        subtitle: {
          fr: 'Compte privé',
          ar: 'حساب خاص',
        },
        letter: 'S',
        tone: 'emerald',
      },
      {
        slug: 'osn-plus',
        name: 'OSN+',
        subtitle: {
          fr: 'Compte partagé',
          ar: 'حساب مشترك',
        },
        letter: 'O',
        tone: 'violet',
      },
    ],
  },

  {
    id: 'design',
    eyebrow: {
      fr: 'CRÉATION',
      ar: 'التصميم والإبداع',
    },
    title: {
      fr: 'Design & Création',
      ar: 'التصميم والإبداع',
    },
    description: {
      fr: 'Outils premium pour vos créations, vidéos et contenus.',
      ar: 'أدوات مميزة للتصميم والفيديو وصناعة المحتوى.',
    },
    products: [
      {
        slug: 'canva-pro',
        name: 'Canva Pro',
        subtitle: {
          fr: 'Design premium',
          ar: 'تصميم مميز',
        },
        letter: 'C',
        tone: 'cyan',
      },
      {
        slug: 'adobe-creative-cloud',
        name: 'Adobe Creative Cloud',
        subtitle: {
          fr: 'Suite créative',
          ar: 'حزمة إبداعية',
        },
        letter: 'A',
        tone: 'red',
      },
      {
        slug: 'picsart-pro',
        name: 'Picsart Pro',
        subtitle: {
          fr: 'Photo & design',
          ar: 'صور وتصميم',
        },
        letter: 'P',
        tone: 'violet',
      },
      {
        slug: 'capcut-pro',
        name: 'CapCut Pro',
        subtitle: {
          fr: 'Montage vidéo premium',
          ar: 'مونتاج فيديو مميز',
        },
        letter: 'C',
        tone: 'slate',
      },
    ],
  },

  {
    id: 'logiciels-securite',
    eyebrow: {
      fr: 'LOGICIELS',
      ar: 'البرامج',
    },
    title: {
      fr: 'Logiciels & Sécurité',
      ar: 'البرامج والأمان',
    },
    description: {
      fr: 'Licences, outils professionnels et protection numérique.',
      ar: 'تراخيص وأدوات احترافية وحماية رقمية.',
    },
    products: [
      {
        slug: 'windows-license',
        name: 'Windows 10 / 11',
        subtitle: {
          fr: 'Pro & Home · Licence',
          ar: 'Pro & Home · ترخيص',
        },
        letter: 'W',
        tone: 'blue',
      },
      {
        slug: 'expressvpn',
        name: 'ExpressVPN',
        subtitle: {
          fr: 'PC · 1 appareil',
          ar: 'PC · جهاز واحد',
        },
        letter: 'E',
        tone: 'red',
      },
      {
        slug: 'avast-premium',
        name: 'Avast Premium',
        subtitle: {
          fr: 'Sécurité',
          ar: 'حماية',
        },
        letter: 'A',
        tone: 'orange',
      },
      {
        slug: 'adobe-creative-cloud-key',
        name: 'Adobe Creative Cloud Key',
        subtitle: {
          fr: 'Licence numérique',
          ar: 'ترخيص رقمي',
        },
        letter: 'A',
        tone: 'red',
      },
    ],
  },

  {
    id: 'gift-cards',
    eyebrow: {
      fr: 'CARTES NUMÉRIQUES',
      ar: 'البطاقات الرقمية',
    },
    title: {
      fr: 'Gift Cards',
      ar: 'بطاقات الهدايا',
    },
    description: {
      fr: 'Cartes numériques pour vos plateformes et boutiques préférées.',
      ar: 'بطاقات رقمية لمنصاتك ومتاجرك المفضلة.',
    },
    products: [
      {
        slug: 'apple-itunes-gift-card',
        name: 'Apple Gift Card',
        subtitle: {
          fr: 'iTunes · USD',
          ar: 'iTunes · USD',
        },
        letter: 'A',
        tone: 'slate',
      },
      {
        slug: 'netflix-usa-card',
        name: 'Netflix USA Card',
        subtitle: {
          fr: 'United States',
          ar: 'الولايات المتحدة',
        },
        letter: 'N',
        tone: 'red',
      },
      {
        slug: 'likee-global-card',
        name: 'Likee Global Card',
        subtitle: {
          fr: 'Global',
          ar: 'Global',
        },
        letter: 'L',
        tone: 'pink',
      },
      {
        slug: 'steam-gift-card',
        name: 'Steam',
        subtitle: {
          fr: 'Gift Card',
          ar: 'بطاقة هدايا',
        },
        letter: 'S',
        tone: 'slate',
      },
      {
        slug: 'playstation-gift-card',
        name: 'PlayStation',
        subtitle: {
          fr: 'Sony Gift Card',
          ar: 'بطاقة هدايا Sony',
        },
        letter: 'P',
        tone: 'blue',
      },
      {
        slug: 'amazon-gift-card',
        name: 'Amazon Card',
        subtitle: {
          fr: 'Gift Card',
          ar: 'بطاقة هدايا',
        },
        letter: 'A',
        tone: 'orange',
      },
      {
        slug: 'google-play-usd',
        name: 'Google Play USD',
        subtitle: {
          fr: 'United States',
          ar: 'الولايات المتحدة',
        },
        letter: 'G',
        tone: 'emerald',
      },
      {
        slug: 'google-play-tr',
        name: 'Google Play TR',
        subtitle: {
          fr: 'Turquie',
          ar: 'تركيا',
        },
        letter: 'G',
        tone: 'emerald',
      },
    ],
  },

  {
    id: 'social-premium',
    eyebrow: {
      fr: 'SOCIAL',
      ar: 'التواصل',
    },
    title: {
      fr: 'Social & Premium',
      ar: 'التواصل والخدمات المميزة',
    },
    description: {
      fr: 'Abonnements premium pour vos réseaux et communautés.',
      ar: 'اشتراكات مميزة لشبكات التواصل والمجتمعات.',
    },
    products: [
      {
        slug: 'snapchat-plus',
        name: 'Snapchat+',
        subtitle: {
          fr: 'Premium',
          ar: 'مميز',
        },
        letter: 'S',
        tone: 'yellow',
      },
      {
        slug: 'telegram-premium',
        name: 'Telegram Premium',
        subtitle: {
          fr: 'Premium',
          ar: 'مميز',
        },
        letter: 'T',
        tone: 'blue',
      },
      {
        slug: 'discord-nitro',
        name: 'Discord Nitro',
        subtitle: {
          fr: 'Premium',
          ar: 'مميز',
        },
        letter: 'D',
        tone: 'indigo',
      },
      {
        slug: 'x-premium',
        name: 'X Premium',
        subtitle: {
          fr: 'Premium',
          ar: 'مميز',
        },
        letter: 'X',
        tone: 'slate',
      },
      {
        slug: 'linkedin-premium',
        name: 'LinkedIn Premium',
        subtitle: {
          fr: 'Premium',
          ar: 'مميز',
        },
        letter: 'L',
        tone: 'blue',
      },
      {
        slug: 'youtube-premium',
        name: 'YouTube Premium',
        subtitle: {
          fr: 'Premium',
          ar: 'مميز',
        },
        letter: 'Y',
        tone: 'red',
      },
      {
        slug: 'twitch-subscription',
        name: 'Twitch Subscription',
        subtitle: {
          fr: 'Subscription',
          ar: 'اشتراك',
        },
        letter: 'T',
        tone: 'violet',
      },
      {
        slug: 'tiktok-coins',
        name: 'TikTok Coins',
        subtitle: {
          fr: 'Recharge',
          ar: 'شحن',
        },
        letter: 'T',
        tone: 'pink',
      },
      {
        slug: 'reddit-premium',
        name: 'Reddit Premium',
        subtitle: {
          fr: 'Premium',
          ar: 'مميز',
        },
        letter: 'R',
        tone: 'orange',
      },
      {
        slug: 'patreon-membership',
        name: 'Patreon Membership',
        subtitle: {
          fr: 'Membership',
          ar: 'عضوية',
        },
        letter: 'P',
        tone: 'orange',
      },
    ],
  },
]

const toneClasses: Record<ProductTone, string> = {
  blue: 'from-blue-600 to-blue-800',
  indigo: 'from-indigo-600 to-indigo-900',
  violet: 'from-violet-600 to-indigo-900',
  sky: 'from-sky-500 to-blue-700',
  red: 'from-red-500 to-red-800',
  emerald: 'from-emerald-500 to-emerald-800',
  cyan: 'from-cyan-500 to-blue-700',
  pink: 'from-pink-500 to-violet-700',
  slate: 'from-slate-700 to-slate-950',
  yellow: 'from-amber-400 to-orange-600',
  orange: 'from-orange-500 to-red-700',
}

function getCatalogService(
  catalogServices: ServiceCatalogItem[],
  slug: string,
) {
  return catalogServices.find(
    (service) => service.slug === slug,
  )
}

function getAvailablePrices(
  service: ServiceCatalogItem,
) {
  return service.groups.flatMap((group) =>
    group.availability === 'available'
      ? group.plans
          .filter(
            (plan) =>
              plan.availability === 'available',
          )
          .map((plan) => plan.price)
      : [],
  )
}

function ProductRail({
  section,
  serviceLogos,
  catalogServices,
}: {
  section: ProductSection
  serviceLogos: ServiceLogoMap
  catalogServices: ServiceCatalogItem[]
}) {
  const {
    language,
    formatCurrencyText,
  } = useLanguage()

  const navigate = useNavigate()

  const railRef =
    useRef<HTMLDivElement>(null)

  const pointerStartXRef =
    useRef(0)

  const pointerStartYRef =
    useRef(0)

  const movedRef =
    useRef(false)

  const [isPaused, setIsPaused] =
    useState(false)

  const isArabic =
    language === 'ar'

  const shouldLoop =
    section.products.length >= 4

  const displayedProducts =
    useMemo(
      () =>
        shouldLoop
          ? [
              ...section.products,
              ...section.products,
            ]
          : section.products,
      [
        section.products,
        shouldLoop,
      ],
    )

  useEffect(() => {
    if (
      !shouldLoop ||
      isPaused
    ) {
      return
    }

    const rail =
      railRef.current

    if (!rail) {
      return
    }

    const interval =
      window.setInterval(() => {
        const firstCard =
          rail.querySelector<HTMLElement>(
            '[data-product-card="true"]',
          )

        if (!firstCard) {
          return
        }

        const styles =
          window.getComputedStyle(
            rail,
          )

        const gap =
          Number.parseFloat(
            styles.columnGap ||
              styles.gap,
          ) || 12

        const step =
          firstCard.offsetWidth +
          gap

        const loopPoint =
          rail.scrollWidth / 2

        if (
          rail.scrollLeft >=
          loopPoint - step
        ) {
          rail.scrollLeft =
            rail.scrollLeft -
            loopPoint
        }

        window.requestAnimationFrame(
          () => {
            rail.scrollBy({
              left: step,
              behavior: 'smooth',
            })
          },
        )
      }, 2600)

    return () => {
      window.clearInterval(
        interval,
      )
    }
  }, [
    isPaused,
    shouldLoop,
  ])

  useEffect(() => {
    if (!shouldLoop) {
      return
    }

    const rail =
      railRef.current

    if (!rail) {
      return
    }

    const handleScroll = () => {
      const loopPoint =
        rail.scrollWidth / 2

      if (
        rail.scrollLeft >=
        loopPoint
      ) {
        rail.scrollLeft =
          rail.scrollLeft -
          loopPoint
      }
    }

    rail.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      },
    )

    return () => {
      rail.removeEventListener(
        'scroll',
        handleScroll,
      )
    }
  }, [shouldLoop])

  const handlePointerDown = (
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    pointerStartXRef.current =
      event.clientX

    pointerStartYRef.current =
      event.clientY

    movedRef.current = false

    setIsPaused(true)
  }

  const handlePointerMove = (
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    const differenceX =
      Math.abs(
        event.clientX -
          pointerStartXRef.current,
      )

    const differenceY =
      Math.abs(
        event.clientY -
          pointerStartYRef.current,
      )

    if (
      differenceX > 8 ||
      differenceY > 8
    ) {
      movedRef.current = true
    }
  }

  const handlePointerUp = () => {
    window.setTimeout(() => {
      setIsPaused(false)
      movedRef.current = false
    }, 300)
  }

  const handleProductClick = (
    product: ProductPresentation,
  ) => {
    if (movedRef.current) {
      return
    }

    const service =
      getCatalogService(
        catalogServices,
        product.slug,
      )

    if (!service) {
      return
    }

    navigate(
      `/services-numeriques/${service.slug}`,
    )
  }

  const formatPrice = (
    value: number,
  ) => {
    const formattedNumber =
      new Intl.NumberFormat(
        isArabic
          ? 'ar-MR-u-nu-latn'
          : 'fr-FR-u-nu-latn',
        {
          numberingSystem: 'latn',
          maximumFractionDigits: 2,
        },
      ).format(value)

    return formatCurrencyText(
      `${formattedNumber} MRU`,
    )
  }

  return (
    <div
      ref={railRef}
      dir="ltr"
      onMouseEnter={() =>
        setIsPaused(true)
      }
      onMouseLeave={() =>
        setIsPaused(false)
      }
      onTouchStart={() =>
        setIsPaused(true)
      }
      onTouchEnd={() => {
        window.setTimeout(() => {
          setIsPaused(false)
        }, 300)
      }}
      onTouchCancel={() =>
        setIsPaused(false)
      }
      className="
        mt-4
        flex
        gap-3
        overflow-x-auto
        pb-2
        [scrollbar-width:none]
        [&::-webkit-scrollbar]:hidden
        sm:mt-5
        sm:gap-4
        lg:gap-5
      "
    >
      {displayedProducts.map(
        (
          product,
          index,
        ) => {
          const service =
            getCatalogService(
              catalogServices,
              product.slug,
            )

          const logo =
            serviceLogos[
              product.slug
            ]

          const availablePrices =
            service
              ? getAvailablePrices(
                  service,
                )
              : []

          const minimumPrice =
            availablePrices.length >
            0
              ? Math.min(
                  ...availablePrices,
                )
              : null

          const isAvailable =
            service?.availability ===
              'available' &&
            minimumPrice !== null

          const isOutOfStock =
            service?.availability ===
            'out_of_stock'

          const isComingSoon =
            !service ||
            service.availability ===
              'coming_soon'

          let priceText = ''

          if (
            minimumPrice !== null
          ) {
            const amount =
              formatPrice(
                minimumPrice,
              )

            if (
              availablePrices.length >
              1
            ) {
              priceText =
                isArabic
                  ? `ابتداءً من ${amount}`
                  : `Dès ${amount}`
            } else {
              priceText =
                amount
            }
          } else if (
            isOutOfStock
          ) {
            priceText =
              isArabic
                ? 'غير متوفر'
                : 'Indisponible'
          } else {
            priceText =
              isArabic
                ? 'قريبًا'
                : 'Bientôt'
          }

          const statusBadge =
            isOutOfStock
              ? isArabic
                ? 'غير متوفر'
                : 'Indisponible'
              : isComingSoon
                ? isArabic
                  ? 'قريبًا'
                  : 'Bientôt'
                : null

          return (
            <button
              key={`${product.slug}-${index}`}
              type="button"
              data-product-card="true"
              onPointerDown={
                handlePointerDown
              }
              onPointerMove={
                handlePointerMove
              }
              onPointerUp={
                handlePointerUp
              }
              onPointerCancel={
                handlePointerUp
              }
              onClick={() =>
                handleProductClick(
                  product,
                )
              }
              className={[
                'group block w-[164px] shrink-0 sm:w-[190px] lg:w-[220px] xl:w-[230px]',
                isArabic
                  ? 'text-right'
                  : 'text-left',
                service
                  ? 'cursor-pointer'
                  : 'cursor-default',
              ].join(' ')}
            >
              <article
                dir={
                  isArabic
                    ? 'rtl'
                    : 'ltr'
                }
                className={[
                  'h-full overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition duration-300 lg:rounded-[22px]',
                  service
                    ? 'group-hover:-translate-y-1 group-hover:border-blue-200 group-hover:shadow-[0_18px_40px_rgba(15,23,42,0.09)]'
                    : 'opacity-75',
                ].join(' ')}
              >
                <div
                  className={`
                    relative
                    flex
                    aspect-[1.22/1]
                    items-center
                    justify-center
                    overflow-hidden
                    bg-gradient-to-br
                    ${toneClasses[product.tone]}
                  `}
                >
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl lg:h-28 lg:w-28" />

                  {statusBadge ? (
                    <span
                      className={[
                        'absolute top-2 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs font-black uppercase tracking-wide text-white backdrop-blur lg:top-3',
                        isArabic
                          ? 'right-2 lg:right-3'
                          : 'left-2 lg:left-3',
                      ].join(' ')}
                    >
                      {statusBadge}
                    </span>
                  ) : (
                    product.badge && (
                      <span
                        className={[
                          'absolute top-2 rounded-full border border-white/10 bg-black/15 px-2 py-1 text-xs font-black uppercase tracking-wide text-white backdrop-blur lg:top-3',
                          isArabic
                            ? 'right-2 lg:right-3'
                            : 'left-2 lg:left-3',
                        ].join(' ')}
                      >
                        {
                          product.badge[
                            language
                          ]
                        }
                      </span>
                    )
                  )}

                  {logo ? (
                    <img
                      src={logo}
                      alt=""
                      className="relative h-16 w-16 object-contain sm:h-[72px] sm:w-[72px] lg:h-20 lg:w-20"
                    />
                  ) : (
                    <span className="relative text-[38px] font-black text-white sm:text-[44px] lg:text-[52px]">
                      {product.letter}
                    </span>
                  )}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                <div className="p-3 sm:p-4">
                  <h3
                    className={[
                      'line-clamp-2 min-h-[40px] text-sm font-black leading-5 text-slate-950 transition lg:min-h-[44px] lg:text-[15px]',
                      service
                        ? 'group-hover:text-blue-600'
                        : '',
                    ].join(' ')}
                  >
                    {service?.name ??
                      product.name}
                  </h3>

                  <p className="mt-1 line-clamp-2 min-h-[40px] text-xs leading-5 text-slate-500">
                    {
                      product.subtitle[
                        language
                      ]
                    }
                  </p>

                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          {isArabic
                            ? 'السعر'
                            : 'Prix'}
                        </p>

                        <p
                          dir="ltr"
                          className={[
                            'mt-1 text-left text-sm font-black',
                            isAvailable
                              ? 'text-slate-950'
                              : isOutOfStock
                                ? 'text-rose-600'
                                : 'text-amber-600',
                          ].join(' ')}
                        >
                          {priceText}
                        </p>
                      </div>

                      <span
                        className={[
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black transition',
                          service
                            ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                            : 'bg-slate-100 text-slate-400',
                        ].join(' ')}
                      >
                        {service
                          ? isArabic
                            ? '←'
                            : '→'
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </button>
          )
        },
      )}
    </div>
  )
}

function DigitalProductsSection() {
  const { language } =
    useLanguage()

  const [
    serviceLogos,
    setServiceLogos,
  ] =
    useState<ServiceLogoMap>({})

  const [
    catalogServices,
    setCatalogServices,
  ] =
    useState<ServiceCatalogItem[]>(
      [],
    )

  const isArabic =
    language === 'ar'

  useEffect(() => {
    let isMounted = true

    const loadServiceLogos =
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from(
            'service_logos',
          )
          .select(
            'service_slug, logo_path',
          )

        if (!isMounted) {
          return
        }

        if (error) {
          console.error(
            'Unable to load service logos:',
            error,
          )
          return
        }

        const nextLogos:
          ServiceLogoMap = {}

        const rows =
          (data ??
            []) as ServiceLogoRow[]

        rows.forEach((row) => {
          nextLogos[
            row.service_slug
          ] =
            getLogoPublicUrl(
              row.logo_path,
            )
        })

        setServiceLogos(
          nextLogos,
        )
      }

    const loadCatalog =
      async () => {
        try {
          const nextCatalog =
            await fetchPublicServiceCatalog()

          if (isMounted) {
            setCatalogServices(
              nextCatalog,
            )
          }
        } catch (error) {
          console.error(
            'Unable to load digital catalog:',
            error,
          )
        }
      }

    void loadServiceLogos()
    void loadCatalog()

    return () => {
      isMounted = false
    }
  }, [])

  const scrollToEsim = () => {
    document
      .getElementById('esim')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
  }

  return (
    <section className="bg-white py-10 sm:py-16 lg:py-20">
      <Container>
        <div className="mx-auto max-w-[1440px]">
          <section className="mb-12 sm:hidden">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
              {isArabic
                ? 'السفر والاتصال'
                : 'VOYAGE & CONNEXION'}
            </p>

            <h2 className="mt-1.5 text-[22px] font-black tracking-[-0.03em] text-slate-950">
              eSIM
            </h2>

            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              {isArabic
                ? 'اختر وجهتك لاكتشاف باقات eSIM المتوفرة.'
                : 'Choisissez votre destination pour découvrir les forfaits eSIM.'}
            </p>

            <button
              type="button"
              onClick={
                scrollToEsim
              }
              className={[
                'group mt-4 block w-[164px]',
                isArabic
                  ? 'text-right'
                  : 'text-left',
              ].join(' ')}
            >
              <article className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
                <div
                  className="relative flex aspect-[1.22/1] items-center justify-center overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(145deg, #07111f 0%, #102a56 52%, #1d4ed8 100%)',
                  }}
                >
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
                    style={{
                      backgroundColor:
                        'rgba(96,165,250,0.25)',
                    }}
                  />

                  <span
                    className={[
                      'absolute top-2 rounded-full border border-white/10 bg-black/15 px-2 py-1 text-xs font-black uppercase tracking-wide text-white backdrop-blur',
                      isArabic
                        ? 'right-2'
                        : 'left-2',
                    ].join(' ')}
                  >
                    eSIM
                  </span>

                  <span className="relative text-[38px] font-black text-white">
                    e
                  </span>

                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                <div className="p-3">
                  <h3 className="min-h-[40px] text-sm font-black leading-5 text-slate-950">
                    {isArabic
                      ? 'eSIM دولية'
                      : 'eSIM internationale'}
                  </h3>

                  <p className="mt-1 min-h-[40px] text-xs leading-5 text-slate-500">
                    {isArabic
                      ? 'الصين، تركيا، الإمارات، فرنسا والمزيد'
                      : 'Chine, Turquie, UAE, France et plus'}
                  </p>

                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          {isArabic
                            ? 'الوجهة'
                            : 'Destination'}
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-950">
                          {isArabic
                            ? 'اختر'
                            : 'Choisir'}
                        </p>
                      </div>

                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-600">
                        {isArabic
                          ? '←'
                          : '→'}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </button>
          </section>

          <div className="space-y-12 sm:space-y-16 lg:space-y-20">
            {sections.map(
              (section) => (
                <section
                  key={
                    section.id
                  }
                  id={
                    section.id
                  }
                  className="scroll-mt-28 overflow-hidden"
                >
                  <div className="flex items-end justify-between gap-5">
                    <div className="max-w-2xl">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                        {
                          section.eyebrow[
                            language
                          ]
                        }
                      </p>

                      <h2 className="mt-1.5 text-[22px] font-black tracking-[-0.03em] text-slate-950 sm:text-3xl lg:text-[32px]">
                        {
                          section.title[
                            language
                          ]
                        }
                      </h2>

                      <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                        {
                          section.description[
                            language
                          ]
                        }
                      </p>
                    </div>

                    <span className="hidden shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-500 lg:block">
                      {
                        section.products
                          .length
                      }{' '}
                      {isArabic
                        ? 'خدمات'
                        : 'services'}
                    </span>
                  </div>

                  <ProductRail
                    section={
                      section
                    }
                    serviceLogos={
                      serviceLogos
                    }
                    catalogServices={
                      catalogServices
                    }
                  />
                </section>
              ),
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}

export default DigitalProductsSection