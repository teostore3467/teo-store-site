import type {
  CustomerField,
  ServiceAvailabilityStatus,
  ServiceFulfillmentConfig,
  ServiceFulfillmentType,
} from '../types/serviceFulfillment'

export type ServicePlan = {
  id: string
  label: string
  price: number
  currency: 'MRU'
  availability: ServiceAvailabilityStatus
  popular?: boolean
}

export type ServiceGroup = {
  id: string
  name: string
  shortName: string
  availability: ServiceAvailabilityStatus
  fulfillment: ServiceFulfillmentConfig
  plans: ServicePlan[]
  description?: string
}

export type ServiceCatalogItem = {
  slug: string
  name: string
  category: string
  availability: ServiceAvailabilityStatus
  description?: string
  groups: ServiceGroup[]
}

const paymentRequired = true

const accountDelivery = [
  {
    id: 'email',
    label: 'E-mail',
    type: 'email' as const,
    sensitive: true,
  },
  {
    id: 'password',
    label: 'Mot de passe',
    type: 'password' as const,
    sensitive: true,
  },
  {
    id: 'note',
    label: 'Note',
    type: 'note' as const,
  },
]

const codeDelivery = [
  {
    id: 'code',
    label: 'Code',
    type: 'code' as const,
    sensitive: true,
  },
  {
    id: 'note',
    label: 'Note',
    type: 'note' as const,
  },
]

const comingSoonFulfillment = (): ServiceFulfillmentConfig => ({
  type: 'coming_soon',
  availability: 'coming_soon',
  customerFields: [],
  deliveryFields: [],
  requiresPaymentBeforeFulfillment: true,
  opensChatAfterPayment: false,
  requiresCustomerConfirmation: false,
  adminCanCloseChat: false,
})

const accountFulfillment = (): ServiceFulfillmentConfig => ({
  type: 'account_credentials',
  availability: 'available',
  customerFields: [],
  deliveryFields: accountDelivery,
  requiresPaymentBeforeFulfillment: paymentRequired,
  opensChatAfterPayment: false,
  requiresCustomerConfirmation: false,
  adminCanCloseChat: false,
})

const chatFulfillment = (): ServiceFulfillmentConfig => ({
  type: 'automatic_chat',
  availability: 'available',
  customerFields: [],
  deliveryFields: [],
  requiresPaymentBeforeFulfillment: paymentRequired,
  opensChatAfterPayment: true,
  requiresCustomerConfirmation: true,
  adminCanCloseChat: true,
})

const codeFulfillment = (
  instructions?: string,
  warning?: string,
): ServiceFulfillmentConfig => ({
  type: 'activation_code',
  availability: 'available',
  customerFields: [],
  deliveryFields: codeDelivery,
  requiresPaymentBeforeFulfillment: paymentRequired,
  opensChatAfterPayment: false,
  requiresCustomerConfirmation: false,
  adminCanCloseChat: false,
  instructions,
  warning,
})

const emailField = (
  helpText?: string,
): CustomerField => ({
  id: 'customer-email',
  label: 'E-mail',
  type: 'email',
  placeholder: 'Votre adresse e-mail',
  required: true,
  helpText,
})

const comingSoonService = (
  slug: string,
  name: string,
  category: string,
): ServiceCatalogItem => ({
  slug,
  name,
  category,
  availability: 'coming_soon',
  groups: [
    {
      id: 'coming-soon',
      name: name,
      shortName: name,
      availability: 'coming_soon',
      fulfillment: comingSoonFulfillment(),
      plans: [],
    },
  ],
})

export const serviceCatalog: ServiceCatalogItem[] = [
  // =========================================================
  // IA & PRODUCTIVITÉ
  // =========================================================

  {
    slug: 'chatgpt-plus',
    name: 'ChatGPT Plus',
    category: 'IA & Productivité',
    availability: 'available',
    groups: [
      {
        id: 'recharge-email',
        name: 'ChatGPT Plus — Recharge E-mail',
        shortName: 'Recharge E-mail',
        availability: 'available',
        description:
          'Après confirmation du paiement, une discussion s’ouvre automatiquement avec l’Admin pour effectuer la recharge.',
        fulfillment: chatFulfillment(),
        plans: [
          {
            id: 'chatgpt-recharge-1m',
            label: '1 Mois',
            price: 1050,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'chatgpt-recharge-3m',
            label: '3 Mois',
            price: 3000,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'chatgpt-recharge-6m',
            label: '6 Mois',
            price: 5500,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },

      {
        id: 'compte-prive',
        name: 'ChatGPT Plus — Compte Privé',
        shortName: 'Compte Privé',
        availability: 'available',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'chatgpt-private-1m',
            label: '1 Mois',
            price: 850,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'chatgpt-private-3m',
            label: '3 Mois',
            price: 2500,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'chatgpt-private-6m',
            label: '6 Mois',
            price: 4800,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },

      {
        id: 'compte-partage',
        name: 'ChatGPT Plus — Compte Partagé',
        shortName: 'Compte Partagé',
        availability: 'available',
        description:
          'Compte partagé avec plusieurs utilisateurs.',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'chatgpt-shared-1m',
            label: '1 Mois',
            price: 400,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'chatgpt-shared-3m',
            label: '3 Mois',
            price: 900,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'chatgpt-shared-6m',
            label: '6 Mois',
            price: 1700,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  {
    slug: 'gemini-pro',
    name: 'Gemini Pro',
    category: 'IA & Productivité',
    availability: 'available',
    groups: [
      {
        id: 'activation-link',
        name: 'Gemini Pro — Lien d’activation',
        shortName: 'Lien d’activation',
        availability: 'available',
        fulfillment: {
          type: 'activation_link',
          availability: 'available',
          customerFields: [
            emailField(
              'Utilisez l’adresse e-mail du compte Gemini sur lequel vous souhaitez activer l’abonnement.',
            ),
            {
              id: 'gemini-confirm-email',
              label:
                'Je confirme que cette adresse e-mail est correcte.',
              type: 'checkbox',
              required: true,
            },
            {
              id: 'gemini-new-subscription',
              label:
                'Je confirme que mon abonnement actuel est terminé.',
              type: 'checkbox',
              required: true,
            },
          ],
          deliveryFields: [
            {
              id: 'activation-link',
              label: 'Lien d’activation',
              type: 'link',
              sensitive: true,
            },
            {
              id: 'note',
              label: 'Note',
              type: 'note',
            },
          ],
          requiresPaymentBeforeFulfillment: true,
          opensChatAfterPayment: false,
          requiresCustomerConfirmation: false,
          adminCanCloseChat: false,
          warning:
            'Ce produit ne peut pas prolonger un abonnement actif. Utilisez-le uniquement après la fin de votre abonnement actuel.',
        },
        plans: [
          {
            id: 'gemini-link-3m',
            label: '3 Mois',
            price: 500,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'gemini-link-6m',
            label: '6 Mois',
            price: 900,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'gemini-link-12m',
            label: '12 Mois',
            price: 1400,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },

      {
        id: 'compte-individuel',
        name: 'Gemini Pro — Compte Individuel',
        shortName: 'Compte Individuel',
        availability: 'available',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'gemini-private-3m',
            label: '3 Mois',
            price: 800,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'gemini-private-6m',
            label: '6 Mois',
            price: 1400,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'gemini-private-12m',
            label: '12 Mois',
            price: 1900,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  {
    slug: 'claude-pro',
    name: 'Claude AI Pro',
    category: 'IA & Productivité',
    availability: 'available',
    groups: [
      {
        id: 'recharge-email',
        name: 'Claude AI Pro — Recharge E-mail',
        shortName: 'Recharge E-mail',
        availability: 'available',
        fulfillment: chatFulfillment(),
        plans: [
          {
            id: 'claude-recharge-1m',
            label: '1 Mois',
            price: 1700,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'claude-recharge-3m',
            label: '3 Mois',
            price: 5000,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },

      {
        id: 'compte-prive',
        name: 'Claude AI Pro — Compte Privé',
        shortName: 'Compte Privé',
        availability: 'available',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'claude-private-1m',
            label: '1 Mois',
            price: 1500,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'claude-private-3m',
            label: '3 Mois',
            price: 4500,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },

      {
        id: 'compte-partage',
        name: 'Claude AI Pro — Compte Partagé',
        shortName: 'Compte Partagé',
        availability: 'available',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'claude-shared-1m',
            label: '1 Mois',
            price: 950,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'claude-shared-3m',
            label: '3 Mois',
            price: 2800,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'claude-shared-6m',
            label: '6 Mois',
            price: 5500,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  {
    slug: 'perplexity-pro',
    name: 'Perplexity Pro',
    category: 'IA & Productivité',
    availability: 'available',
    groups: [
      {
        id: 'compte-prive',
        name: 'Perplexity Pro — Compte Privé',
        shortName: 'Compte Privé',
        availability: 'available',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'perplexity-private-1m',
            label: '1 Mois',
            price: 1000,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'perplexity-private-3m',
            label: '3 Mois',
            price: 2800,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'perplexity-private-6m',
            label: '6 Mois',
            price: 5500,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },

      {
        id: 'compte-partage',
        name: 'Perplexity Pro — Compte Partagé',
        shortName: 'Compte Partagé',
        availability: 'available',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'perplexity-shared-1m',
            label: '1 Mois',
            price: 700,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'perplexity-shared-3m',
            label: '3 Mois',
            price: 2200,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'perplexity-shared-6m',
            label: '6 Mois',
            price: 4300,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  {
    slug: 'microsoft-copilot-pro',
    name: 'Microsoft Copilot Pro',
    category: 'IA & Productivité',
    availability: 'available',
    groups: [
      {
        id: 'compte-prive',
        name: 'Microsoft Copilot Pro — Compte Privé',
        shortName: 'Compte Privé',
        availability: 'available',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'copilot-private-12m',
            label: '12 Mois',
            price: 2200,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'copilot-private-24m',
            label: '24 Mois',
            price: 4000,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  {
    slug: 'midjourney',
    name: 'Midjourney Gift Card USD',
    category: 'IA & Productivité',
    availability: 'available',
    description: 'Rewarble Clé Globale',
    groups: [
      {
        id: 'rewarble-global',
        name: 'Midjourney Gift Card USD — Rewarble Clé Globale',
        shortName: 'Rewarble',
        availability: 'available',
        fulfillment: codeFulfillment(
          'Rendez-vous sur Rewarble.com/redeem, saisissez votre code puis recevez une carte Visa prépayée destinée à votre abonnement Midjourney.',
        ),
        plans: [
          {
            id: 'midjourney-5usd',
            label: '5 USD',
            price: 350,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'midjourney-10usd',
            label: '10 USD',
            price: 650,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'midjourney-20usd',
            label: '20 USD',
            price: 1150,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'midjourney-25usd',
            label: '25 USD',
            price: 1450,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'midjourney-50usd',
            label: '50 USD',
            price: 2800,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  {
    slug: 'elevenlabs',
    name: 'ElevenLabs',
    category: 'IA & Productivité',
    availability: 'available',
    groups: [
      {
        id: 'trial-link',
        name: 'ElevenLabs Plan Trial — Lien d’activation',
        shortName: 'Lien d’activation',
        availability: 'available',
        fulfillment: {
          type: 'activation_link',
          availability: 'available',
          customerFields: [
            emailField(
              'Utilisez une adresse e-mail correspondant à un nouveau compte ElevenLabs.',
            ),
            {
              id: 'elevenlabs-new-account-confirm',
              label:
                'Je confirme que ce compte n’a jamais eu d’abonnement ElevenLabs.',
              type: 'checkbox',
              required: true,
            },
          ],
          deliveryFields: [
            {
              id: 'activation-link',
              label: 'Lien d’activation',
              type: 'link',
              sensitive: true,
            },
            {
              id: 'note',
              label: 'Note',
              type: 'note',
            },
          ],
          requiresPaymentBeforeFulfillment: true,
          opensChatAfterPayment: false,
          requiresCustomerConfirmation: false,
          adminCanCloseChat: false,
          warning:
            'Cette offre Trial fonctionne uniquement avec les nouveaux comptes qui n’ont jamais été abonnés.',
        },
        plans: [
          {
            id: 'elevenlabs-link-12m',
            label: '12 Mois',
            price: 3000,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
        ],
      },

      {
        id: 'trial-code',
        name: 'ElevenLabs Plan Trial — Clé d’activation',
        shortName: 'Clé d’activation',
        availability: 'available',
        fulfillment: codeFulfillment(
          'Utilisez la clé reçue pour activer votre offre.',
          'Cette offre Trial fonctionne uniquement avec les nouveaux comptes qui n’ont jamais été abonnés.',
        ),
        plans: [
          {
            id: 'elevenlabs-code-12m',
            label: '12 Mois',
            price: 4000,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
        ],
      },

      {
        id: 'compte-prive',
        name: 'ElevenLabs Plan Trial — Compte Privé',
        shortName: 'Compte Privé',
        availability: 'available',
        description:
          'Compte privé • Creator Plan • 131 000 crédits',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'elevenlabs-private-1m',
            label: '1 Mois',
            price: 950,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'elevenlabs-private-3m',
            label: '3 Mois',
            price: 2700,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'elevenlabs-private-6m',
            label: '6 Mois',
            price: 5500,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  comingSoonService(
    'notion-ai',
    'Notion AI',
    'IA & Productivité',
  ),

  comingSoonService(
    'leonardo-ai',
    'Leonardo AI',
    'IA & Productivité',
  ),

  {
    slug: 'runway',
    name: 'Runway',
    category: 'IA & Productivité',
    availability: 'available',
    groups: [
      {
        id: 'compte-prive',
        name: 'Runway — Compte Privé',
        shortName: 'Compte Privé',
        availability: 'available',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'runway-private-1m',
            label: '1 Mois',
            price: 1800,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'runway-private-2m',
            label: '2 Mois',
            price: 3500,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },

      {
        id: 'activation-code',
        name: 'Runway — Clé d’activation',
        shortName: 'Clé d’activation',
        availability: 'available',
        fulfillment: {
          type: 'activation_code_or_link',
          availability: 'available',
          customerFields: [
            emailField(
              'Saisissez une adresse e-mail correcte pour un nouveau compte.',
            ),
            {
              id: 'runway-new-account-confirm',
              label:
                'Je confirme que ce compte n’a jamais eu d’abonnement.',
              type: 'checkbox',
              required: true,
            },
          ],
          deliveryFields: [
            {
              id: 'code',
              label: 'Code',
              type: 'code',
              sensitive: true,
            },
            {
              id: 'link',
              label: 'Lien',
              type: 'link',
              sensitive: true,
            },
            {
              id: 'note',
              label: 'Note',
              type: 'note',
            },
          ],
          requiresPaymentBeforeFulfillment: true,
          opensChatAfterPayment: false,
          requiresCustomerConfirmation: false,
          adminCanCloseChat: false,
          warning:
            'Cette offre fonctionne uniquement avec les nouveaux comptes qui n’ont jamais été abonnés.',
        },
        plans: [
          {
            id: 'runway-code-12m',
            label: '12 Mois',
            price: 3500,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
        ],
      },
    ],
  },

  // =========================================================
  // GAMING
  // =========================================================

  {
    slug: 'pubg-uc',
    name: 'PUBG UC',
    category: 'Gaming',
    availability: 'available',
    groups: [
      {
        id: 'pubg-recharge',
        name: 'PUBG UC',
        shortName: 'PUBG UC',
        availability: 'available',
        fulfillment: {
          type: 'player_id_verification',
          availability: 'available',
          customerFields: [
            {
              id: 'player-id',
              label: 'Player ID',
              type: 'player_id',
              placeholder: 'Entrez votre Player ID',
              required: true,
              helpText:
                'Vérifiez attentivement votre Player ID avant de continuer.',
            },
            {
              id: 'player-id-confirm',
              label:
                'Je confirme que le Player ID saisi est correct.',
              type: 'checkbox',
              required: true,
            },
          ],
          deliveryFields: [
            {
              id: 'verified-username',
              label: 'Nom du joueur vérifié',
              type: 'username',
            },
            {
              id: 'note',
              label: 'Note',
              type: 'note',
            },
          ],
          requiresPaymentBeforeFulfillment: true,
          opensChatAfterPayment: false,
          requiresCustomerConfirmation: true,
          adminCanCloseChat: false,
          instructions:
            'Après paiement, l’Admin vérifie le Player ID, envoie le nom du joueur au client pour confirmation, puis effectue la recharge.',
        },
        plans: [
          {
            id: 'pubg-60',
            label: '60 UC',
            price: 50,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'pubg-180',
            label: '180 UC',
            price: 150,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'pubg-360',
            label: '360 UC',
            price: 250,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'pubg-410',
            label: '410 UC',
            price: 300,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'pubg-660',
            label: '660 UC',
            price: 450,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'pubg-720',
            label: '720 UC',
            price: 500,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'pubg-1000',
            label: '1000 UC',
            price: 650,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'pubg-1800',
            label: '1800 UC',
            price: 1000,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'pubg-3850',
            label: '3850 UC',
            price: 2000,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'pubg-4000',
            label: '4000 UC',
            price: 2200,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'pubg-8100',
            label: '8100 UC',
            price: 3800,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  {
    slug: 'free-fire-diamonds',
    name: 'Free Fire Global',
    category: 'Gaming',
    availability: 'available',
    groups: [
      {
        id: 'free-fire-recharge',
        name: 'Free Fire Global',
        shortName: 'Free Fire',
        availability: 'available',
        fulfillment: {
          type: 'player_id_verification',
          availability: 'available',
          customerFields: [
            {
              id: 'player-id',
              label: 'Player ID',
              type: 'player_id',
              placeholder: 'Entrez votre Player ID',
              required: true,
            },
            {
              id: 'player-id-confirm',
              label:
                'Je confirme que le Player ID saisi est correct.',
              type: 'checkbox',
              required: true,
            },
          ],
          deliveryFields: [
            {
              id: 'verified-username',
              label: 'Nom du joueur vérifié',
              type: 'username',
            },
            {
              id: 'note',
              label: 'Note',
              type: 'note',
            },
          ],
          requiresPaymentBeforeFulfillment: true,
          opensChatAfterPayment: false,
          requiresCustomerConfirmation: true,
          adminCanCloseChat: false,
          instructions:
            'Après paiement, l’Admin vérifie le Player ID, affiche le nom du joueur au client pour confirmation, puis effectue la recharge.',
        },
        plans: [
          {
            id: 'freefire-110',
            label: '110 Diamonds',
            price: 90,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'freefire-231',
            label: '231 Diamonds',
            price: 180,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'freefire-583',
            label: '583 Diamonds',
            price: 350,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'freefire-1260',
            label: '1260 Diamonds',
            price: 600,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'freefire-2410',
            label: '2410 Diamonds',
            price: 1100,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  comingSoonService(
    'call-of-duty-mobile-cp',
    'Call of Duty Mobile CP',
    'Gaming',
  ),

  comingSoonService(
    'mobile-legends-diamonds',
    'Mobile Legends Diamonds',
    'Gaming',
  ),

  comingSoonService(
    'valorant-points',
    'Valorant Points',
    'Gaming',
  ),

  comingSoonService(
    'roblox-robux',
    'Roblox Robux',
    'Gaming',
  ),

  comingSoonService(
    'fortnite-vbucks',
    'Fortnite V-Bucks',
    'Gaming',
  ),

  comingSoonService(
    'genshin-impact',
    'Genshin Impact',
    'Gaming',
  ),

  comingSoonService(
    'ea-sports-fc-points',
    'EA SPORTS FC Points',
    'Gaming',
  ),

  comingSoonService(
    'honkai-star-rail',
    'Honkai: Star Rail',
    'Gaming',
  ),

  // =========================================================
  // JEUX & CODES
  // =========================================================

  {
    slug: 'minecraft-minecoins',
    name: 'Minecraft Minecoins USD Global',
    category: 'Jeux & Codes',
    availability: 'available',
    groups: [
      {
        id: 'minecraft-code',
        name: 'Minecraft Minecoins USD Global',
        shortName: 'Minecoins',
        availability: 'available',
        fulfillment: codeFulfillment(
          'Accédez à la page de récupération Minecraft, connectez-vous à votre compte, saisissez le code puis confirmez. Le nouveau solde apparaît ensuite sur votre compte.',
          'Non disponible pour Minecraft Java Edition. Le code ne peut pas être remplacé après livraison. Conservez-le en lieu sûr.',
        ),
        plans: [
          {
            id: 'minecraft-1729',
            label: '1729 Coins',
            price: 500,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'minecraft-3500',
            label: '3500 Coins',
            price: 950,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'minecraft-8800',
            label: '8800 Coins',
            price: 1850,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  comingSoonService(
    'league-of-legends-card',
    'League of Legends USD United States',
    'Jeux & Codes',
  ),

  comingSoonService(
    'razer-gold-global',
    'Razer Gold Global',
    'Jeux & Codes',
  ),

  comingSoonService(
    'battlefield-6-xbox',
    'Battlefield 6 XBOX Games Global',
    'Jeux & Codes',
  ),

  // =========================================================
  // STREAMING
  // =========================================================

  {
    slug: 'netflix',
    name: 'Netflix',
    category: 'Streaming',
    availability: 'available',
    groups: [
      {
        id: 'fenetre',
        name: 'Netflix — Fenêtre',
        shortName: 'Fenêtre',
        availability: 'available',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'netflix-window-1m',
            label: '1 Mois',
            price: 250,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'netflix-window-3m',
            label: '3 Mois',
            price: 600,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'netflix-window-6m',
            label: '6 Mois',
            price: 1000,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  {
    slug: 'prime-video',
    name: 'Prime Video',
    category: 'Streaming',
    availability: 'available',
    groups: [
      {
        id: 'compte-prive',
        name: 'Prime Video — Compte Privé',
        shortName: 'Compte Privé',
        availability: 'available',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'prime-1m',
            label: '1 Mois',
            price: 300,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'prime-3m',
            label: '3 Mois',
            price: 600,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'prime-6m',
            label: '6 Mois',
            price: 1000,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  {
    slug: 'shahid-vip',
    name: 'Shahid VIP',
    category: 'Streaming',
    availability: 'available',
    groups: [
      {
        id: 'compte-prive',
        name: 'Shahid VIP — Compte Privé',
        shortName: 'Compte Privé',
        availability: 'available',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'shahid-private-1m',
            label: '1 Mois',
            price: 250,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'shahid-private-3m',
            label: '3 Mois',
            price: 500,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'shahid-private-6m',
            label: '6 Mois',
            price: 950,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },

      {
        id: 'mobile-recharge-email',
        name: 'Shahid VIP Mobile — Recharge Email',
        shortName: 'Recharge Email',
        availability: 'available',
        fulfillment: chatFulfillment(),
        plans: [
          {
            id: 'shahid-mobile-1m',
            label: '1 Mois',
            price: 300,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'shahid-mobile-3m',
            label: '3 Mois',
            price: 650,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'shahid-mobile-6m',
            label: '6 Mois',
            price: 1150,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  {
    slug: 'spotify-premium',
    name: 'Spotify Premium',
    category: 'Streaming',
    availability: 'available',
    groups: [
      {
        id: 'compte-prive',
        name: 'Spotify Premium — Compte Privé',
        shortName: 'Compte Privé',
        availability: 'available',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'spotify-private-1m',
            label: '1 Mois',
            price: 300,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'spotify-private-3m',
            label: '3 Mois',
            price: 700,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'spotify-private-6m',
            label: '6 Mois',
            price: 1500,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  comingSoonService(
    'osn-plus',
    'OSN+',
    'Streaming',
  ),

  // =========================================================
  // DESIGN & CRÉATION
  // =========================================================

  {
    slug: 'canva-pro',
    name: 'Canva Pro',
    category: 'Design & Création',
    availability: 'available',
    groups: [
      {
        id: 'education',
        name: 'Canva Pro — Éducation',
        shortName: 'Éducation',
        availability: 'available',
        fulfillment: {
          type: 'customer_email',
          availability: 'available',
          customerFields: [
            emailField(
              'Saisissez l’adresse e-mail utilisée sur votre compte Canva.',
            ),
            {
              id: 'canva-email-confirm',
              label:
                'Je confirme que l’adresse e-mail saisie est correcte.',
              type: 'checkbox',
              required: true,
            },
          ],
          deliveryFields: [
            {
              id: 'link',
              label: 'Lien direct',
              type: 'link',
              sensitive: true,
            },
            {
              id: 'code',
              label: 'Code',
              type: 'code',
              sensitive: true,
            },
            {
              id: 'note',
              label: 'Note',
              type: 'note',
            },
          ],
          requiresPaymentBeforeFulfillment: true,
          opensChatAfterPayment: false,
          requiresCustomerConfirmation: false,
          adminCanCloseChat: false,
          instructions:
            'Une invitation est envoyée à l’adresse e-mail Canva du client. Pour certains e-mails non Gmail, l’Admin peut fournir un lien direct et un code.',
        },
        plans: [
          {
            id: 'canva-1y',
            label: '1 an',
            price: 300,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'canva-2y',
            label: '2 ans',
            price: 450,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'canva-lifetime',
            label: 'À vie',
            price: 700,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  comingSoonService(
    'adobe-creative-cloud',
    'Adobe Creative Cloud',
    'Design & Création',
  ),

  comingSoonService(
    'picsart-pro',
    'Picsart Pro',
    'Design & Création',
  ),

  {
    slug: 'capcut-pro',
    name: 'CapCut Pro',
    category: 'Design & Création',
    availability: 'available',
    groups: [
      {
        id: 'compte-prive',
        name: 'CapCut Pro — Compte Privé',
        shortName: 'Compte Privé',
        availability: 'available',
        fulfillment: accountFulfillment(),
        plans: [
          {
            id: 'capcut-private-1m',
            label: '1 Mois',
            price: 350,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'capcut-private-3m',
            label: '3 Mois',
            price: 650,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'capcut-private-6m',
            label: '6 Mois',
            price: 1000,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  // =========================================================
  // LOGICIELS & SÉCURITÉ
  // =========================================================

  {
    slug: 'windows-license',
    name: 'Windows 10 / 11',
    category: 'Logiciels & Sécurité',
    availability: 'available',
    groups: [
      {
        id: 'licence',
        name: 'Windows 10 / 11 — Licence',
        shortName: 'Licence',
        availability: 'available',
        fulfillment: codeFulfillment(
          'Utilisez la clé fournie pour activer Windows.',
        ),
        plans: [
          {
            id: 'windows-lifetime',
            label: 'À vie',
            price: 500,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
        ],
      },
    ],
  },

  {
    slug: 'expressvpn',
    name: 'ExpressVPN PC',
    category: 'Logiciels & Sécurité',
    availability: 'available',
    groups: [
      {
        id: 'one-device',
        name: 'ExpressVPN PC — 1 Appareil',
        shortName: '1 Appareil',
        availability: 'available',
        fulfillment: codeFulfillment(
          'Utilisez le code reçu selon les instructions fournies dans la note.',
        ),
        plans: [
          {
            id: 'expressvpn-1m',
            label: '1 Mois',
            price: 350,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'expressvpn-6m',
            label: '6 Mois',
            price: 700,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'expressvpn-12m',
            label: '12 Mois',
            price: 1300,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  comingSoonService(
    'avast-premium',
    'Avast Premium',
    'Logiciels & Sécurité',
  ),

  comingSoonService(
    'adobe-creative-cloud-key',
    'Adobe Creative Cloud Key',
    'Logiciels & Sécurité',
  ),

  // =========================================================
  // GIFT CARDS
  // =========================================================

  {
    slug: 'apple-itunes-gift-card',
    name: 'Apple Gift Card',
    category: 'Gift Cards',
    availability: 'available',
    description:
      'Carte digitale utilisable pour les produits et services Apple selon la région et les conditions du compte.',
    groups: [
      {
        id: 'apple-gift-card',
        name: 'Apple Gift Card',
        shortName: 'Apple Gift Card',
        availability: 'available',
        fulfillment: codeFulfillment(
          'Depuis App Store ou iTunes, choisissez Redeem puis saisissez le code. Vous pouvez également utiliser la page officielle Apple Redeem.',
        ),
        plans: [
          {
            id: 'apple-5usd',
            label: '5 USD',
            price: 270,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'apple-10usd',
            label: '10 USD',
            price: 550,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'apple-15usd',
            label: '15 USD',
            price: 800,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'apple-20usd',
            label: '20 USD',
            price: 1000,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'apple-25usd',
            label: '25 USD',
            price: 1250,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'apple-50usd',
            label: '50 USD',
            price: 2450,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'apple-100usd',
            label: '100 USD',
            price: 4850,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  comingSoonService(
    'netflix-usa-card',
    'Netflix USA Card',
    'Gift Cards',
  ),

  comingSoonService(
    'likee-global-card',
    'Likee Global Card',
    'Gift Cards',
  ),

  comingSoonService(
    'steam-gift-card',
    'Steam Gift Card',
    'Gift Cards',
  ),

  {
    slug: 'playstation-gift-card',
    name: 'PlayStation Gift Card',
    category: 'Gift Cards',
    availability: 'available',
    groups: [
      {
        id: 'playstation-usd',
        name: 'PlayStation Gift Card USD',
        shortName: 'PlayStation USD',
        availability: 'available',
        fulfillment: codeFulfillment(
          'Connectez-vous à PSN, ouvrez PlayStation Store, choisissez Redeem Codes puis saisissez le code de 12 caractères.',
          'Une carte de paiement peut être demandée pour certaines souscriptions PlayStation Plus.',
        ),
        plans: [
          {
            id: 'ps-5usd',
            label: '5 USD',
            price: 350,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'ps-10usd',
            label: '10 USD',
            price: 700,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'ps-20usd',
            label: '20 USD',
            price: 1250,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'ps-25usd',
            label: '25 USD',
            price: 1400,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'ps-50usd',
            label: '50 USD',
            price: 2700,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'ps-100usd',
            label: '100 USD',
            price: 4500,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'ps-200usd',
            label: '200 USD',
            price: 8500,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'ps-250usd',
            label: '250 USD',
            price: 10700,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  comingSoonService(
    'amazon-gift-card',
    'Amazon Gift Card',
    'Gift Cards',
  ),

  {
    ...comingSoonService(
      'google-play-usd',
      'Google Play USD',
      'Gift Cards',
    ),
    description:
      'Bientôt disponible. La livraison se fera sous forme de code de carte Google Play.',
  },

  {
    ...comingSoonService(
      'google-play-tr',
      'Google Play TR',
      'Gift Cards',
    ),
    description:
      'Bientôt disponible. La livraison se fera sous forme de code Google Play Turquie.',
  },

  // =========================================================
  // SOCIAL & PREMIUM
  // =========================================================

  {
    slug: 'snapchat-plus',
    name: 'Snapchat Plus',
    category: 'Social & Premium',
    availability: 'available',
    groups: [
      {
        id: 'snapchat-plus',
        name: 'Snapchat Plus',
        shortName: 'Snapchat Plus',
        availability: 'available',
        fulfillment: chatFulfillment(),
        plans: [
          {
            id: 'snapchat-3m',
            label: '3 Mois',
            price: 200,
            currency: 'MRU',
            availability: 'available',
            popular: true,
          },
          {
            id: 'snapchat-6m',
            label: '6 Mois',
            price: 450,
            currency: 'MRU',
            availability: 'available',
          },
          {
            id: 'snapchat-12m',
            label: '12 Mois',
            price: 850,
            currency: 'MRU',
            availability: 'available',
          },
        ],
      },
    ],
  },

  comingSoonService(
    'telegram-premium',
    'Telegram Premium',
    'Social & Premium',
  ),

  comingSoonService(
    'discord-nitro',
    'Discord Nitro',
    'Social & Premium',
  ),

  comingSoonService(
    'x-premium',
    'X Premium',
    'Social & Premium',
  ),

  comingSoonService(
    'linkedin-premium',
    'LinkedIn Premium',
    'Social & Premium',
  ),

  comingSoonService(
    'youtube-premium',
    'YouTube Premium',
    'Social & Premium',
  ),

  comingSoonService(
    'twitch-subscription',
    'Twitch Subscription',
    'Social & Premium',
  ),

  comingSoonService(
    'tiktok-coins',
    'TikTok Coins',
    'Social & Premium',
  ),

  comingSoonService(
    'reddit-premium',
    'Reddit Premium',
    'Social & Premium',
  ),

  comingSoonService(
    'patreon-membership',
    'Patreon Membership',
    'Social & Premium',
  ),
]

export function getServiceBySlug(
  slug: string | undefined,
) {
  if (!slug) {
    return null
  }

  return (
    serviceCatalog.find(
      (service) => service.slug === slug,
    ) ?? null
  )
}

export function isServicePurchasable(
  service: ServiceCatalogItem,
) {
  return service.availability === 'available'
}

export function getAvailableServicePlans(
  group: ServiceGroup,
) {
  return group.plans.filter(
    (plan) => plan.availability === 'available',
  )
}

export function getFulfillmentLabel(
  type: ServiceFulfillmentType,
) {
  const labels: Record<
    ServiceFulfillmentType,
    string
  > = {
    account_credentials: 'Envoi des identifiants',
    activation_code: 'Code d’activation',
    activation_link: 'Lien d’activation',
    activation_code_or_link: 'Code ou lien',
    automatic_chat: 'Discussion avec l’Admin',
    customer_email: 'Activation par e-mail',
    player_id_verification:
      'Vérification du Player ID',
    coming_soon: 'Bientôt disponible',
  }

  return labels[type]
}