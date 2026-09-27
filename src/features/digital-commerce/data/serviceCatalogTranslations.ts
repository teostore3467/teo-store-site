import type { Language } from '../../../i18n/translations'

import type {
  ServiceCatalogItem,
  ServiceGroup,
  ServicePlan,
} from './serviceCatalog'

import type {
  CustomerField,
  ServiceFulfillmentType,
} from '../types/serviceFulfillment'

const categoryArabic: Record<string, string> = {
  'IA & Productivité': 'الذكاء الاصطناعي والإنتاجية',
  Gaming: 'الألعاب',
  'Jeux & Codes': 'الألعاب والأكواد',
  Streaming: 'البث والترفيه',
  'Design & Création': 'التصميم والإبداع',
  'Logiciels & Sécurité': 'البرامج والأمان',
  'Gift Cards': 'بطاقات الهدايا',
  'Social & Premium': 'التواصل والخدمات المميزة',
}

const groupNameArabic: Record<string, string> = {
  'ChatGPT Plus — Recharge E-mail':
    'ChatGPT Plus — شحن عبر البريد الإلكتروني',
  'ChatGPT Plus — Compte Privé':
    'ChatGPT Plus — حساب خاص',
  'ChatGPT Plus — Compte Partagé':
    'ChatGPT Plus — حساب مشترك',

  'Gemini Pro — Lien d’activation':
    'Gemini Pro — رابط تفعيل',
  'Gemini Pro — Compte Individuel':
    'Gemini Pro — حساب فردي',

  'Claude AI Pro — Recharge E-mail':
    'Claude AI Pro — شحن عبر البريد الإلكتروني',
  'Claude AI Pro — Compte Privé':
    'Claude AI Pro — حساب خاص',
  'Claude AI Pro — Compte Partagé':
    'Claude AI Pro — حساب مشترك',

  'Perplexity Pro — Compte Privé':
    'Perplexity Pro — حساب خاص',
  'Perplexity Pro — Compte Partagé':
    'Perplexity Pro — حساب مشترك',

  'Microsoft Copilot Pro — Compte Privé':
    'Microsoft Copilot Pro — حساب خاص',

  'Midjourney Gift Card USD — Rewarble Clé Globale':
    'Midjourney Gift Card USD — مفتاح Rewarble عالمي',

  'ElevenLabs Plan Trial — Lien d’activation':
    'ElevenLabs Plan Trial — رابط تفعيل',
  'ElevenLabs Plan Trial — Clé d’activation':
    'ElevenLabs Plan Trial — مفتاح تفعيل',
  'ElevenLabs Plan Trial — Compte Privé':
    'ElevenLabs Plan Trial — حساب خاص',

  'Runway — Compte Privé':
    'Runway — حساب خاص',
  'Runway — Clé d’activation':
    'Runway — مفتاح تفعيل',

  'Netflix — Fenêtre':
    'Netflix — نافذة',

  'Prime Video — Compte Privé':
    'Prime Video — حساب خاص',

  'Shahid VIP — Compte Privé':
    'Shahid VIP — حساب خاص',
  'Shahid VIP Mobile — Recharge Email':
    'Shahid VIP Mobile — شحن عبر البريد الإلكتروني',

  'Spotify Premium — Compte Privé':
    'Spotify Premium — حساب خاص',

  'Canva Pro — Éducation':
    'Canva Pro — التعليم',

  'CapCut Pro — Compte Privé':
    'CapCut Pro — حساب خاص',

  'Windows 10 / 11 — Licence':
    'Windows 10 / 11 — ترخيص',

  'ExpressVPN PC — 1 Appareil':
    'ExpressVPN PC — جهاز واحد',
}

const shortNameArabic: Record<string, string> = {
  'Recharge E-mail': 'شحن البريد',
  'Recharge Email': 'شحن البريد',
  'Compte Privé': 'حساب خاص',
  'Compte Partagé': 'حساب مشترك',
  'Compte Individuel': 'حساب فردي',
  'Lien d’activation': 'رابط تفعيل',
  'Clé d’activation': 'مفتاح تفعيل',
  Fenêtre: 'نافذة',
  Éducation: 'التعليم',
  Licence: 'ترخيص',
  '1 Appareil': 'جهاز واحد',
}

const planLabelArabic: Record<string, string> = {
  '1 Mois': 'شهر واحد',
  '2 Mois': 'شهران',
  '3 Mois': '3 أشهر',
  '6 Mois': '6 أشهر',
  '12 Mois': '12 شهرًا',
  '24 Mois': '24 شهرًا',
  '1 an': 'سنة واحدة',
  '2 ans': 'سنتان',
  'À vie': 'مدى الحياة',
}

const serviceDescriptionArabic: Record<string, string> = {
  midjourney: 'مفتاح Rewarble عالمي',

  'apple-itunes-gift-card':
    'بطاقة رقمية لاستخدام منتجات وخدمات Apple حسب منطقة الحساب والشروط المطبقة.',

  'google-play-usd':
    'قريبًا. سيتم تسليم الخدمة على شكل كود بطاقة Google Play.',

  'google-play-tr':
    'قريبًا. سيتم تسليم الخدمة على شكل كود Google Play لتركيا.',
}

const groupDescriptionArabic: Record<string, string> = {
  'chatgpt-plus:recharge-email':
    'بعد تأكيد الدفع، يتم فتح محادثة تلقائيًا مع الأدمن لإتمام الشحن.',

  'chatgpt-plus:compte-partage':
    'حساب مشترك مع عدة مستخدمين.',

  'elevenlabs:compte-prive':
    'حساب خاص • Creator Plan • 131 000 رصيد',
}

const fulfillmentInstructionsArabic: Record<string, string> = {
  'midjourney:rewarble-global':
    'انتقل إلى Rewarble.com/redeem، أدخل الكود، ثم احصل على بطاقة Visa مسبقة الدفع لاستخدامها في اشتراك Midjourney.',

  'elevenlabs:trial-code':
    'استخدم مفتاح التفعيل الذي تستلمه لتفعيل العرض.',

  'pubg-uc:pubg-recharge':
    'بعد الدفع، يتحقق الأدمن من Player ID ثم يعرض اسم اللاعب لك للتأكيد، وبعد تأكيدك يتم تنفيذ الشحن.',

  'free-fire-diamonds:free-fire-recharge':
    'بعد الدفع، يتحقق الأدمن من Player ID ثم يعرض اسم اللاعب لك للتأكيد، وبعد تأكيدك يتم تنفيذ الشحن.',

  'minecraft-minecoins:minecraft-code':
    'انتقل إلى صفحة استرداد Minecraft، سجّل الدخول إلى حسابك، أدخل الكود ثم أكد العملية. سيظهر الرصيد الجديد بعد ذلك في حسابك.',

  'canva-pro:education':
    'يتم إرسال دعوة إلى البريد الإلكتروني المرتبط بحساب Canva. لبعض عناوين البريد غير Gmail، يمكن للأدمن إرسال رابط مباشر وكود.',

  'windows-license:licence':
    'استخدم المفتاح الذي تستلمه لتفعيل Windows.',

  'expressvpn:one-device':
    'استخدم الكود الذي تستلمه حسب التعليمات الموجودة في الملاحظة.',

  'apple-itunes-gift-card:apple-gift-card':
    'من App Store أو iTunes اختر Redeem ثم أدخل الكود. ويمكن أيضًا استخدام صفحة Apple الرسمية للاسترداد.',

  'playstation-gift-card:playstation-usd':
    'سجّل الدخول إلى PSN، افتح PlayStation Store، اختر Redeem Codes ثم أدخل الكود المكوّن من 12 رمزًا.',
}

const fulfillmentWarningArabic: Record<string, string> = {
  'gemini-pro:activation-link':
    'لا يمكن استخدام هذا المنتج لتمديد اشتراك نشط. استخدمه فقط بعد انتهاء اشتراكك الحالي.',

  'elevenlabs:trial-link':
    'عرض Trial يعمل فقط مع الحسابات الجديدة التي لم يسبق لها الاشتراك في ElevenLabs.',

  'elevenlabs:trial-code':
    'عرض Trial يعمل فقط مع الحسابات الجديدة التي لم يسبق لها الاشتراك في ElevenLabs.',

  'runway:activation-code':
    'هذا العرض يعمل فقط مع الحسابات الجديدة التي لم يسبق لها الاشتراك.',

  'minecraft-minecoins:minecraft-code':
    'غير متوفر لـ Minecraft Java Edition. لا يمكن استبدال الكود بعد التسليم، لذلك احتفظ به في مكان آمن.',

  'playstation-gift-card:playstation-usd':
    'قد تكون هناك حاجة إلى بطاقة دفع لبعض اشتراكات PlayStation Plus.',
}

const customerFieldArabic: Record<
  string,
  {
    label?: string
    placeholder?: string
    helpText?: string
  }
> = {
  'customer-email': {
    label: 'البريد الإلكتروني',
    placeholder: 'أدخل بريدك الإلكتروني',
  },

  'gemini-confirm-email': {
    label:
      'أؤكد أن عنوان البريد الإلكتروني الذي أدخلته صحيح.',
  },

  'gemini-new-subscription': {
    label:
      'أؤكد أن اشتراكي الحالي قد انتهى.',
  },

  'elevenlabs-new-account-confirm': {
    label:
      'أؤكد أن هذا الحساب لم يسبق له الاشتراك في ElevenLabs.',
  },

  'runway-new-account-confirm': {
    label:
      'أؤكد أن هذا الحساب لم يسبق له الاشتراك.',
  },

  'player-id': {
    label: 'Player ID',
    placeholder: 'أدخل Player ID',
    helpText:
      'تحقق جيدًا من Player ID قبل المتابعة.',
  },

  'player-id-confirm': {
    label:
      'أؤكد أن Player ID الذي أدخلته صحيح.',
  },

  'canva-email-confirm': {
    label:
      'أؤكد أن البريد الإلكتروني الذي أدخلته صحيح.',
  },
}

const specificEmailHelpArabic: Record<string, string> = {
  'gemini-pro:activation-link':
    'استخدم البريد الإلكتروني لحساب Gemini الذي تريد تفعيل الاشتراك عليه.',

  'elevenlabs:trial-link':
    'استخدم بريدًا إلكترونيًا لحساب ElevenLabs جديد.',

  'runway:activation-code':
    'أدخل بريدًا إلكترونيًا صحيحًا لحساب جديد.',

  'canva-pro:education':
    'أدخل البريد الإلكتروني المستخدم في حساب Canva.',
}

const fulfillmentLabels = {
  fr: {
    account_credentials:
      'Envoi des identifiants',
    activation_code:
      'Code d’activation',
    activation_link:
      'Lien d’activation',
    activation_code_or_link:
      'Code ou lien',
    automatic_chat:
      'Discussion avec l’Admin',
    customer_email:
      'Activation par e-mail',
    player_id_verification:
      'Vérification du Player ID',
    coming_soon:
      'Bientôt disponible',
  },

  ar: {
    account_credentials:
      'تسليم بيانات الحساب',
    activation_code:
      'كود تفعيل',
    activation_link:
      'رابط تفعيل',
    activation_code_or_link:
      'كود أو رابط',
    automatic_chat:
      'محادثة مع الأدمن',
    customer_email:
      'تفعيل عبر البريد الإلكتروني',
    player_id_verification:
      'التحقق من Player ID',
    coming_soon:
      'قريبًا',
  },
} satisfies Record<
  Language,
  Record<ServiceFulfillmentType, string>
>

export function getLocalizedCategory(
  category: string,
  language: Language,
) {
  if (language === 'fr') {
    return category
  }

  return categoryArabic[category] ?? category
}

export function getLocalizedServiceName(
  service: ServiceCatalogItem,
  _language: Language,
) {
  return service.name
}

export function getLocalizedServiceDescription(
  service: ServiceCatalogItem,
  language: Language,
) {
  if (!service.description) {
    return undefined
  }

  if (language === 'fr') {
    return service.description
  }

  return (
    serviceDescriptionArabic[service.slug] ??
    service.description
  )
}

export function getLocalizedGroupName(
  group: ServiceGroup,
  language: Language,
) {
  if (language === 'fr') {
    return group.name
  }

  return (
    groupNameArabic[group.name] ??
    group.name
  )
}

export function getLocalizedGroupShortName(
  group: ServiceGroup,
  language: Language,
) {
  if (language === 'fr') {
    return group.shortName
  }

  return (
    shortNameArabic[group.shortName] ??
    group.shortName
  )
}

export function getLocalizedGroupDescription(
  serviceSlug: string,
  group: ServiceGroup,
  language: Language,
) {
  if (!group.description) {
    return undefined
  }

  if (language === 'fr') {
    return group.description
  }

  const key =
    `${serviceSlug}:${group.id}`

  return (
    groupDescriptionArabic[key] ??
    group.description
  )
}

export function getLocalizedPlanLabel(
  plan: ServicePlan,
  language: Language,
) {
  if (language === 'fr') {
    return plan.label
  }

  return (
    planLabelArabic[plan.label] ??
    plan.label
  )
}

export function getLocalizedFulfillmentLabel(
  type: ServiceFulfillmentType,
  language: Language,
) {
  return fulfillmentLabels[language][type]
}

export function getLocalizedFulfillmentInstructions(
  serviceSlug: string,
  group: ServiceGroup,
  language: Language,
) {
  const instructions =
    group.fulfillment.instructions

  if (!instructions) {
    return undefined
  }

  if (language === 'fr') {
    return instructions
  }

  const key =
    `${serviceSlug}:${group.id}`

  return (
    fulfillmentInstructionsArabic[key] ??
    instructions
  )
}

export function getLocalizedFulfillmentWarning(
  serviceSlug: string,
  group: ServiceGroup,
  language: Language,
) {
  const warning =
    group.fulfillment.warning

  if (!warning) {
    return undefined
  }

  if (language === 'fr') {
    return warning
  }

  const key =
    `${serviceSlug}:${group.id}`

  return (
    fulfillmentWarningArabic[key] ??
    warning
  )
}

export function getLocalizedCustomerField(
  serviceSlug: string,
  groupId: string,
  field: CustomerField,
  language: Language,
): CustomerField {
  if (language === 'fr') {
    return field
  }

  const translated =
    customerFieldArabic[field.id]

  const specificKey =
    `${serviceSlug}:${groupId}`

  const specificEmailHelp =
    field.id === 'customer-email'
      ? specificEmailHelpArabic[
          specificKey
        ]
      : undefined

  return {
    ...field,

    label:
      translated?.label ??
      field.label,

    placeholder:
      translated?.placeholder ??
      field.placeholder,

    helpText:
      specificEmailHelp ??
      translated?.helpText ??
      field.helpText,
  }
}