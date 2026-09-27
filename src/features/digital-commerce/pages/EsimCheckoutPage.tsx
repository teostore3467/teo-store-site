import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'

import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'
import { getEsimCountryBySlug } from '../data/esimCatalog'

type EsimCheckoutState = {
  countrySlug?: string

  countryName?: {
    fr: string
    ar: string
  }

  countryFlag?: string

  countryImage?: string | null

  planId?: string

  planData?: {
    fr: string
    ar: string
  }

  planDuration?: {
    fr: string
    ar: string
  }

  planPrice?: string | number
}

type CountrySettingRow = {
  country_slug: string
  image_path: string | null
  active: boolean
  updated_at: string
}

type PlanSettingRow = {
  country_slug: string
  plan_id: string
  price: number
  active: boolean
  popular: boolean
  updated_at: string
}

type PaymentMethodId =
  | 'bankily'
  | 'masrvi'
  | 'sedad'

type PaymentMethod = {
  id: PaymentMethodId
  name: string
  paymentNumber: string
  active: boolean
  instructionsFr: string
  instructionsAr: string
}

type AppSettingRow = {
  setting_key: string
  setting_value: Record<string, unknown>
}

type ToastState = {
  type:
    | 'success'
    | 'error'
    | 'info'

  title: string
  message?: string
}

type PriceValue =
  | string
  | number

const PAYMENT_PROOFS_BUCKET =
  'payment-proofs'

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'bankily',
    name: 'Bankily',
    paymentNumber: '37109097',
    active: true,
    instructionsFr:
      'Effectuez le paiement puis envoyez la preuve.',
    instructionsAr:
      'قم بالدفع ثم أرسل إثبات العملية.',
  },
  {
    id: 'masrvi',
    name: 'Masrvi',
    paymentNumber: '37109097',
    active: true,
    instructionsFr:
      'Effectuez le paiement puis envoyez la preuve.',
    instructionsAr:
      'قم بالدفع ثم أرسل إثبات العملية.',
  },
  {
    id: 'sedad',
    name: 'Sedad',
    paymentNumber: '37109097',
    active: true,
    instructionsFr:
      'Effectuez le paiement puis envoyez la preuve.',
    instructionsAr:
      'قم بالدفع ثم أرسل إثبات العملية.',
  },
]

function parsePrice(
  value: PriceValue,
) {
  if (
    typeof value ===
    'number'
  ) {
    return Number.isFinite(
      value,
    )
      ? value
      : 0
  }

  const normalized =
    value
      .replace(
        /\s/g,
        '',
      )
      .replace(
        ',',
        '.',
      )
      .replace(
        /[^0-9.-]/g,
        '',
      )

  const parsed =
    Number(
      normalized,
    )

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0
}

function getFileExtension(
  file: File,
) {
  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        '',
      )
      .slice(
        0,
        8,
      )

  if (extension) {
    return extension
  }

  if (
    file.type ===
    'application/pdf'
  ) {
    return 'pdf'
  }

  if (
    file.type ===
    'image/png'
  ) {
    return 'png'
  }

  if (
    file.type ===
    'image/webp'
  ) {
    return 'webp'
  }

  return 'jpg'
}

function createOrderNumber() {
  const timestamp =
    Date.now()

  const random =
    Math.random()
      .toString(36)
      .slice(
        2,
        7,
      )
      .toUpperCase()

  return `ESIM-${timestamp}-${random}`
}

function readString(
  value: unknown,
  fallback: string,
) {
  return typeof value ===
    'string'
    ? value
    : fallback
}

function readBoolean(
  value: unknown,
  fallback: boolean,
) {
  return typeof value ===
    'boolean'
    ? value
    : fallback
}

function EsimCheckoutPage() {
  const {
    countrySlug,
  } =
    useParams()

  const location =
    useLocation()

  const navigate =
    useNavigate()

  const {
    language,
    formatCurrencyText,
  } =
    useLanguage()

  const isArabic =
    language ===
    'ar'

  const navigationState =
    (
      location.state as
        | EsimCheckoutState
        | null
    ) ??
    null

  const country =
    useMemo(
      () =>
        getEsimCountryBySlug(
          countrySlug,
        ),
      [
        countrySlug,
      ],
    )

  const requestedPlan =
    useMemo(
      () => {
        if (
          !country ||
          !navigationState
            ?.planId
        ) {
          return undefined
        }

        return country.plans.find(
          (
            plan,
          ) =>
            plan.id ===
            navigationState.planId,
        )
      },
      [
        country,
        navigationState
          ?.planId,
      ],
    )

  const [
    countrySetting,
    setCountrySetting,
  ] =
    useState<
      CountrySettingRow | null
    >(null)

  const [
    planSetting,
    setPlanSetting,
  ] =
    useState<
      PlanSettingRow | null
    >(null)

  const [
    paymentMethods,
    setPaymentMethods,
  ] =
    useState<PaymentMethod[]>(
      DEFAULT_PAYMENT_METHODS,
    )

  const [
    isVerifying,
    setIsVerifying,
  ] =
    useState(true)

  const [
    verificationError,
    setVerificationError,
  ] =
    useState<
      string | null
    >(null)

  const [
    fullName,
    setFullName,
  ] =
    useState('')

  const [
    phone,
    setPhone,
  ] =
    useState('')

  const [
    email,
    setEmail,
  ] =
    useState('')

  const [
    selectedPaymentMethod,
    setSelectedPaymentMethod,
  ] =
    useState<PaymentMethodId | ''>(
      '',
    )

  const [
    senderNumber,
    setSenderNumber,
  ] =
    useState('')

  const [
    proofFile,
    setProofFile,
  ] =
    useState<
      File | null
    >(null)

  const [
    copiedPaymentNumber,
    setCopiedPaymentNumber,
  ] =
    useState(false)

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false)

  const [
    toast,
    setToast,
  ] =
    useState<
      ToastState | null
    >(null)

  const showToast =
    useCallback(
      (
        nextToast:
          ToastState,
      ) => {
        setToast(
          nextToast,
        )

        window.setTimeout(
          () => {
            setToast(
              null,
            )
          },
          4200,
        )
      },
      [],
    )

  const loadPaymentMethods =
    useCallback(
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'app_settings',
            )
            .select(
              'setting_key, setting_value',
            )
            .in(
              'setting_key',
              [
                'payment_bankily',
                'payment_masrvi',
                'payment_sedad',
              ],
            )

        if (error) {
          console.warn(
            'Unable to load payment settings:',
            error,
          )

          setPaymentMethods(
            DEFAULT_PAYMENT_METHODS,
          )

          return
        }

        const rows =
          (data ??
            []) as AppSettingRow[]

        const methods =
          DEFAULT_PAYMENT_METHODS.map(
            (
              fallback,
            ) => {
              const row =
                rows.find(
                  (
                    item,
                  ) =>
                    item.setting_key ===
                    `payment_${fallback.id}`,
                )

              if (
                !row
              ) {
                return {
                  ...fallback,
                }
              }

              const value =
                row.setting_value

              return {
                id:
                  fallback.id,

                name:
                  readString(
                    value.name,
                    fallback.name,
                  ),

                paymentNumber:
                  readString(
                    value.number ??
                      value.paymentNumber,
                    fallback.paymentNumber,
                  ),

                active:
                  readBoolean(
                    value.active,
                    fallback.active,
                  ),

                instructionsFr:
                  readString(
                    value.instructionsFr,
                    fallback.instructionsFr,
                  ),

                instructionsAr:
                  readString(
                    value.instructionsAr,
                    fallback.instructionsAr,
                  ),
              }
            },
          )

        setPaymentMethods(
          methods,
        )

        setSelectedPaymentMethod(
          (
            current,
          ) => {
            if (
              !current
            ) {
              return current
            }

            const stillActive =
              methods.some(
                (
                  method,
                ) =>
                  method.id ===
                    current &&
                  method.active,
              )

            return stillActive
              ? current
              : ''
          },
        )
      },
      [],
    )

  const loadVerifiedPlan =
    useCallback(
      async () => {
        if (
          !country ||
          !requestedPlan
        ) {
          setIsVerifying(
            false,
          )

          return
        }

        setIsVerifying(
          true,
        )

        setVerificationError(
          null,
        )

        const [
          countryResult,
          planResult,
        ] =
          await Promise.all([
            supabase
              .from(
                'esim_country_settings',
              )
              .select(
                'country_slug, image_path, active, updated_at',
              )
              .eq(
                'country_slug',
                country.slug,
              )
              .maybeSingle(),

            supabase
              .from(
                'esim_plan_settings',
              )
              .select(
                'country_slug, plan_id, price, active, popular, updated_at',
              )
              .eq(
                'country_slug',
                country.slug,
              )
              .eq(
                'plan_id',
                requestedPlan.id,
              )
              .maybeSingle(),
          ])

        if (
          countryResult.error ||
          planResult.error
        ) {
          const message =
            countryResult.error
              ?.message ??
            planResult.error
              ?.message ??
            'Erreur inconnue'

          console.error(
            'Unable to verify eSIM checkout:',
            message,
          )

          setVerificationError(
            message,
          )

          setIsVerifying(
            false,
          )

          return
        }

        setCountrySetting(
          countryResult.data
            ? (
                countryResult.data as CountrySettingRow
              )
            : null,
        )

        setPlanSetting(
          planResult.data
            ? (
                planResult.data as PlanSettingRow
              )
            : null,
        )

        setIsVerifying(
          false,
        )
      },
      [
        country,
        requestedPlan,
      ],
    )

  useEffect(() => {
    void Promise.all([
      loadVerifiedPlan(),
      loadPaymentMethods(),
    ])
  }, [
    loadPaymentMethods,
    loadVerifiedPlan,
  ])

  useEffect(() => {
    const channel =
      supabase
        .channel(
          `esim-checkout-settings-${Date.now()}`,
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema:
              'public',
            table:
              'app_settings',
          },
          () => {
            void loadPaymentMethods()
          },
        )
        .subscribe()

    return () => {
      void supabase
        .removeChannel(
          channel,
        )
    }
  }, [
    loadPaymentMethods,
  ])

  const verifiedPrice =
    useMemo(
      () => {
        if (
          !requestedPlan
        ) {
          return 0
        }

        if (
          planSetting
        ) {
          return Number(
            planSetting.price,
          )
        }

        return parsePrice(
          requestedPlan.price,
        )
      },
      [
        planSetting,
        requestedPlan,
      ],
    )

  const countryActive =
    countrySetting
      ?.active ??
    true

  const planActive =
    planSetting
      ?.active ??
    true

  const activePaymentMethods =
    useMemo(
      () =>
        paymentMethods.filter(
          (
            method,
          ) =>
            method.active &&
            method.paymentNumber
              .trim()
              .length >
              0,
        ),
      [
        paymentMethods,
      ],
    )

  const selectedMethod =
    useMemo(
      () => {
        if (
          !selectedPaymentMethod
        ) {
          return null
        }

        return (
          activePaymentMethods.find(
            (
              method,
            ) =>
              method.id ===
              selectedPaymentMethod,
          ) ??
          null
        )
      },
      [
        activePaymentMethods,
        selectedPaymentMethod,
      ],
    )

  const formatAmount =
    useCallback(
      (
        value:
          number,
      ) => {
        const formattedNumber =
          new Intl.NumberFormat(
            isArabic
              ? 'ar-MR-u-nu-latn'
              : 'fr-FR-u-nu-latn',
            {
              numberingSystem:
                'latn',
              maximumFractionDigits:
                2,
            },
          ).format(
            value,
          )

        return formatCurrencyText(
          `${formattedNumber} MRU`,
        )
      },
      [
        formatCurrencyText,
        isArabic,
      ],
    )

  const isReady =
    Boolean(
      country &&
        requestedPlan &&
        countryActive &&
        planActive &&
        verifiedPrice >
          0 &&
        !verificationError,
    )

  const canSubmit =
    isReady &&
    !isVerifying &&
    !isSubmitting &&
    fullName
      .trim()
      .length >
      1 &&
    phone
      .trim()
      .length >
      0 &&
    email
      .trim()
      .length >
      0 &&
    Boolean(
      selectedMethod,
    ) &&
    senderNumber
      .trim()
      .length >
      0 &&
    Boolean(
      proofFile,
    )

  const handleProofChange =
    (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target
          .files?.[0]

      if (
        !file
      ) {
        setProofFile(
          null,
        )

        return
      }

      const allowedTypes =
        [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'application/pdf',
        ]

      if (
        !allowedTypes.includes(
          file.type,
        )
      ) {
        setProofFile(
          null,
        )

        event.target.value =
          ''

        showToast({
          type:
            'error',

          title:
            isArabic
              ? 'صيغة غير مدعومة'
              : 'Format non accepté',

          message:
            isArabic
              ? 'استخدم JPG أو PNG أو WEBP أو PDF.'
              : 'Utilisez JPG, PNG, WEBP ou PDF.',
        })

        return
      }

      if (
        file.size >
        5 *
          1024 *
          1024
      ) {
        setProofFile(
          null,
        )

        event.target.value =
          ''

        showToast({
          type:
            'error',

          title:
            isArabic
              ? 'الملف كبير جدًا'
              : 'Fichier trop volumineux',

          message:
            isArabic
              ? 'الحد الأقصى 5 ميغابايت.'
              : 'La taille maximale est de 5 MB.',
        })

        return
      }

      setProofFile(
        file,
      )
    }

  const copyPaymentNumber =
    async () => {
      if (
        !selectedMethod
      ) {
        return
      }

      const value =
        selectedMethod
          .paymentNumber

      const fallbackCopy =
        () => {
          const textarea =
            document.createElement(
              'textarea',
            )

          textarea.value =
            value

          textarea.style.position =
            'fixed'

          textarea.style.opacity =
            '0'

          document.body.appendChild(
            textarea,
          )

          textarea.focus()
          textarea.select()

          document.execCommand(
            'copy',
          )

          document.body.removeChild(
            textarea,
          )
        }

      try {
        if (
          navigator.clipboard &&
          window.isSecureContext
        ) {
          await navigator.clipboard
            .writeText(
              value,
            )
        } else {
          fallbackCopy()
        }

        setCopiedPaymentNumber(
          true,
        )

        window.setTimeout(
          () => {
            setCopiedPaymentNumber(
              false,
            )
          },
          1800,
        )
      } catch {
        try {
          fallbackCopy()

          setCopiedPaymentNumber(
            true,
          )

          window.setTimeout(
            () => {
              setCopiedPaymentNumber(
                false,
              )
            },
            1800,
          )
        } catch {
          setCopiedPaymentNumber(
            false,
          )
        }
      }
    }

  const handleSubmit =
    async (
      event:
        FormEvent,
    ) => {
      event.preventDefault()

      if (
        !canSubmit ||
        !selectedMethod ||
        !proofFile ||
        !country ||
        !requestedPlan
      ) {
        return
      }

      setIsSubmitting(
        true,
      )

      let uploadedProofPath:
        string | null =
        null

      try {
        const [
          latestCountryResult,
          latestPlanResult,
          latestPaymentResult,
        ] =
          await Promise.all([
            supabase
              .from(
                'esim_country_settings',
              )
              .select(
                'active',
              )
              .eq(
                'country_slug',
                country.slug,
              )
              .maybeSingle(),

            supabase
              .from(
                'esim_plan_settings',
              )
              .select(
                'price, active',
              )
              .eq(
                'country_slug',
                country.slug,
              )
              .eq(
                'plan_id',
                requestedPlan.id,
              )
              .maybeSingle(),

            supabase
              .from(
                'app_settings',
              )
              .select(
                'setting_value',
              )
              .eq(
                'setting_key',
                `payment_${selectedMethod.id}`,
              )
              .maybeSingle(),
          ])

        if (
          latestCountryResult.error ||
          latestPlanResult.error
        ) {
          throw new Error(
            isArabic
              ? 'تعذر التحقق من الباقة قبل إنشاء الطلب.'
              : 'Impossible de vérifier le forfait avant la commande.',
          )
        }

        const latestCountryActive =
          latestCountryResult
            .data?.active ??
          true

        const latestPlanActive =
          latestPlanResult
            .data?.active ??
          true

        if (
          !latestCountryActive ||
          !latestPlanActive
        ) {
          throw new Error(
            isArabic
              ? 'هذه الباقة لم تعد متوفرة.'
              : 'Ce forfait n’est plus disponible.',
          )
        }

        const authoritativePrice =
          latestPlanResult
            .data
            ?.price !==
          undefined
            ? Number(
                latestPlanResult
                  .data
                  .price,
              )
            : parsePrice(
                requestedPlan.price,
              )

        if (
          !Number.isFinite(
            authoritativePrice,
          ) ||
          authoritativePrice <=
            0
        ) {
          throw new Error(
            isArabic
              ? 'سعر الباقة غير صالح.'
              : 'Le prix du forfait est invalide.',
          )
        }

        let authoritativePayment =
          selectedMethod

        if (
          !latestPaymentResult.error &&
          latestPaymentResult.data
            ?.setting_value
        ) {
          const value =
            latestPaymentResult.data
              .setting_value as Record<
                string,
                unknown
              >

          const active =
            readBoolean(
              value.active,
              true,
            )

          const number =
            readString(
              value.number ??
                value.paymentNumber,
              selectedMethod
                .paymentNumber,
            )

          if (
            !active ||
            number
              .trim()
              .length ===
              0
          ) {
            throw new Error(
              isArabic
                ? 'طريقة الدفع المختارة لم تعد متوفرة.'
                : 'Le moyen de paiement sélectionné n’est plus disponible.',
            )
          }

          authoritativePayment = {
            ...selectedMethod,

            name:
              readString(
                value.name,
                selectedMethod.name,
              ),

            paymentNumber:
              number,

            active,

            instructionsFr:
              readString(
                value.instructionsFr,
                selectedMethod
                  .instructionsFr,
              ),

            instructionsAr:
              readString(
                value.instructionsAr,
                selectedMethod
                  .instructionsAr,
              ),
          }
        }

        const {
          data:
            authData,
          error:
            authError,
        } =
          await supabase.auth
            .getUser()

        if (
          authError ||
          !authData.user
        ) {
          navigate(
            '/connexion',
            {
              state: {
                from:
                  location.pathname,

                checkoutState:
                  location.state,
              },
            },
          )

          return
        }

        const proofReference =
          createOrderNumber()

        const extension =
          getFileExtension(
            proofFile,
          )

        const proofPath =
          `${authData.user.id}/${proofReference}-${Date.now()}.${extension}`

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              PAYMENT_PROOFS_BUCKET,
            )
            .upload(
              proofPath,
              proofFile,
              {
                upsert:
                  false,

                cacheControl:
                  '3600',

                contentType:
                  proofFile.type,
              },
            )

        if (
          uploadError
        ) {
          throw new Error(
            isArabic
              ? `تعذر رفع إثبات الدفع: ${uploadError.message}`
              : `Impossible d’envoyer la preuve de paiement : ${uploadError.message}`,
          )
        }

        uploadedProofPath =
          proofPath

        const planLabel =
          `${requestedPlan.data.fr} · ${requestedPlan.duration.fr}`

        const serviceName =
          `eSIM · ${country.name.fr}`

        const {
          data:
            orderData,
          error:
            orderError,
        } =
          await supabase.rpc(
            'customer_create_esim_order',
            {
              p_country_slug:
                country.slug,

              p_country_name_fr:
                country.name.fr,

              p_country_name_ar:
                country.name.ar,

              p_country_flag:
                country.flag,

              p_plan_id:
                requestedPlan.id,

              p_plan_label:
                planLabel,

              p_plan_data_fr:
                requestedPlan
                  .data.fr,

              p_plan_data_ar:
                requestedPlan
                  .data.ar,

              p_plan_duration_fr:
                requestedPlan
                  .duration.fr,

              p_plan_duration_ar:
                requestedPlan
                  .duration.ar,

              p_customer_name:
                fullName.trim(),

              p_customer_phone:
                phone.trim(),

              p_customer_email:
                email.trim(),

              p_payment_method:
                authoritativePayment.id,

              p_payment_sender_number:
                senderNumber.trim(),

              p_payment_proof_path:
                proofPath,
            },
          )

        if (
          orderError
        ) {
          const {
            error:
              cleanupError,
          } =
            await supabase.storage
              .from(
                PAYMENT_PROOFS_BUCKET,
              )
              .remove([
                proofPath,
              ])

          uploadedProofPath =
            null

          if (
            cleanupError
          ) {
            console.warn(
              'Unable to cleanup failed payment proof:',
              cleanupError,
            )
          }

          throw new Error(
            isArabic
              ? `تعذر إنشاء الطلب: ${orderError.message}`
              : `Impossible de créer la commande : ${orderError.message}`,
          )
        }

        const createdOrder =
          Array.isArray(
            orderData,
          )
            ? orderData[0]
            : orderData

        const orderNumber =
          typeof createdOrder?.order_number ===
          'string'
            ? createdOrder.order_number
            : ''

        const securedPrice =
          Number(
            createdOrder?.total_amount ??
              authoritativePrice,
          )

        if (
          orderNumber
            .trim()
            .length ===
          0
        ) {
          const {
            error:
              cleanupError,
          } =
            await supabase.storage
              .from(
                PAYMENT_PROOFS_BUCKET,
              )
              .remove([
                proofPath,
              ])

          uploadedProofPath =
            null

          if (
            cleanupError
          ) {
            console.warn(
              'Unable to cleanup payment proof after an invalid RPC response:',
              cleanupError,
            )
          }

          throw new Error(
            isArabic
              ? 'تم إنشاء الطلب بدون رقم صالح. حاول مرة أخرى.'
              : 'La commande a été créée sans numéro valide. Réessayez.',
          )
        }

        uploadedProofPath =
          null

        navigate(
          `/commande/${orderNumber}`,
          {
            replace:
              true,

            state: {
              orderNumber,

              serviceName,

              status:
                'payment_review',

              orderType:
                'esim',

              countrySlug:
                country.slug,

              countryName:
                country.name,

              countryFlag:
                country.flag,

              planId:
                requestedPlan.id,

              planData:
                requestedPlan.data,

              planDuration:
                requestedPlan.duration,

              planPrice:
                securedPrice,

              paymentMethod:
                authoritativePayment.name,

              senderNumber:
                senderNumber.trim(),

              customerName:
                fullName.trim(),

              customerPhone:
                phone.trim(),

              customerEmail:
                email.trim(),
            },
          },
        )
      } catch (
        error
      ) {
        console.error(
          'Unable to create eSIM order:',
          error,
        )

        if (
          uploadedProofPath
        ) {
          const {
            error:
              rollbackError,
          } =
            await supabase.storage
              .from(
                PAYMENT_PROOFS_BUCKET,
              )
              .remove([
                uploadedProofPath,
              ])

          if (
            rollbackError
          ) {
            console.warn(
              'Unable to rollback eSIM payment proof:',
              rollbackError,
            )
          }
        }

        showToast({
          type:
            'error',

          title:
            isArabic
              ? 'تعذر إرسال الطلب'
              : 'Commande impossible',

          message:
            error instanceof
            Error
              ? error.message
              : isArabic
                ? 'حدث خطأ غير متوقع.'
                : 'Une erreur inattendue est survenue.',
        })

        await Promise.all([
          loadVerifiedPlan(),
          loadPaymentMethods(),
        ])
      } finally {
        setIsSubmitting(
          false,
        )
      }
    }

  if (
    isVerifying
  ) {
    return (
      <main className="min-h-screen bg-[#f7f9fc]">
        <Container className="flex min-h-[70vh] items-center justify-center py-10">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-black text-slate-500">
              {isArabic
                ? 'جاري التحقق من الباقة والسعر...'
                : 'Vérification du forfait et du prix...'}
            </p>
          </div>
        </Container>
      </main>
    )
  }

  if (
    !country ||
    !requestedPlan
  ) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] py-10 sm:py-14">
        <Container>
          <div className="mx-auto max-w-xl rounded-[26px] border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-slate-100 text-xl font-black">
              eSIM
            </div>

            <h1 className="mt-5 text-xl font-black text-slate-950">
              {isArabic
                ? 'لم يتم اختيار باقة eSIM'
                : 'Aucun forfait eSIM sélectionné'}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isArabic
                ? 'ارجع إلى صفحة الدولة واختر الباقة أولًا.'
                : 'Retournez à la page de la destination et choisissez d’abord un forfait.'}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  countrySlug
                    ? `/esim/${countrySlug}`
                    : '/services-numeriques',
                )
              }
              className="mt-5 min-h-[48px] rounded-[14px] bg-blue-600 px-5 text-sm font-black text-white"
            >
              {isArabic
                ? 'العودة'
                : 'Retour'}
            </button>
          </div>
        </Container>
      </main>
    )
  }

  if (
    verificationError
  ) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] py-10 sm:py-14">
        <Container>
          <div className="mx-auto max-w-xl rounded-[26px] border border-rose-100 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-rose-50 font-black text-rose-600">
              !
            </div>

            <h1 className="mt-5 text-xl font-black text-slate-950">
              {isArabic
                ? 'تعذر التحقق من الباقة'
                : 'Vérification impossible'}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isArabic
                ? 'لم نتمكن من التحقق من السعر والحالة الحالية للباقة.'
                : 'Nous n’avons pas pu vérifier le prix et la disponibilité actuels du forfait.'}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadVerifiedPlan()
              }
              className="mt-5 min-h-[48px] w-full rounded-[14px] bg-slate-950 px-5 text-sm font-black text-white"
            >
              {isArabic
                ? 'إعادة المحاولة'
                : 'Réessayer'}
            </button>
          </div>
        </Container>
      </main>
    )
  }

  if (
    !countryActive ||
    !planActive
  ) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] py-10 sm:py-14">
        <Container>
          <div className="mx-auto max-w-xl rounded-[26px] border border-amber-100 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-amber-50 text-2xl">
              {
                country.flag
              }
            </div>

            <h1 className="mt-5 text-xl font-black text-slate-950">
              {isArabic
                ? 'هذه الباقة غير متوفرة حاليًا'
                : 'Ce forfait est indisponible'}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isArabic
                ? 'تم تعطيل هذه الوجهة أو هذه الباقة مؤقتًا.'
                : 'Cette destination ou ce forfait a été temporairement désactivé.'}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/esim/${country.slug}`,
                )
              }
              className="mt-5 min-h-[48px] w-full rounded-[14px] bg-blue-600 px-5 text-sm font-black text-white"
            >
              {isArabic
                ? 'اختيار باقة أخرى'
                : 'Choisir un autre forfait'}
            </button>
          </div>
        </Container>
      </main>
    )
  }

  return (
    <main
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
      className="min-h-screen overflow-x-hidden bg-[#f7f9fc] py-5 sm:py-9 lg:py-12"
    >
      {toast && (
        <div className="fixed inset-x-3 top-3 z-[300] sm:left-auto sm:right-4 sm:w-full sm:max-w-sm">
          <div
            className={[
              'rounded-[18px] border bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.20)]',

              toast.type ===
              'error'
                ? 'border-rose-100'
                : toast.type ===
                    'success'
                  ? 'border-emerald-100'
                  : 'border-blue-100',
            ].join(
              ' ',
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] font-black',

                  toast.type ===
                  'error'
                    ? 'bg-rose-50 text-rose-600'
                    : toast.type ===
                        'success'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-blue-50 text-blue-600',
                ].join(
                  ' ',
                )}
              >
                {toast.type ===
                'error'
                  ? '!'
                  : toast.type ===
                      'success'
                    ? '✓'
                    : 'i'}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950">
                  {
                    toast.title
                  }
                </p>

                {toast.message && (
                  <p className="mt-1 break-words text-sm leading-5 text-slate-500">
                    {
                      toast.message
                    }
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setToast(
                    null,
                  )
                }
                className="text-lg font-black text-slate-300"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            <span>
              TEO STORE
            </span>

            <span>
              /
            </span>

            <span>
              eSIM
            </span>

            <span>
              /
            </span>

            <span className="text-blue-600">
              {isArabic
                ? 'الدفع'
                : 'Commande'}
            </span>
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-[1fr_0.82fr] lg:gap-6">
            <section className="min-w-0">
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

                      <span className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                        TEO STORE eSIM
                      </span>
                    </div>

                    <h1 className="mt-3 text-[26px] font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">
                      {isArabic
                        ? 'إتمام طلب eSIM'
                        : 'Finaliser votre commande eSIM'}
                    </h1>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                      {isArabic
                        ? 'تم التحقق من الباقة والسعر. أدخل بياناتك ثم أرسل إثبات الدفع.'
                        : 'Le forfait et son prix ont été vérifiés. Renseignez vos informations puis envoyez votre preuve de paiement.'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 rounded-[13px] border border-emerald-100 bg-emerald-50 px-3 py-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
                      ✓
                    </span>

                    <span className="text-xs font-black text-emerald-700">
                      {isArabic
                        ? 'السعر متحقق'
                        : 'Prix vérifié'}
                    </span>
                  </div>
                </div>

                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="mt-6 space-y-5"
                >
                  <section>
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      {isArabic
                        ? 'معلومات العميل'
                        : 'INFORMATIONS CLIENT'}
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-black text-slate-700">
                          {isArabic
                            ? 'الاسم الكامل'
                            : 'Nom complet'}
                        </span>

                        <input
                          value={
                            fullName
                          }
                          onChange={(
                            event,
                          ) =>
                            setFullName(
                              event.target.value,
                            )
                          }
                          type="text"
                          autoComplete="name"
                          required
                          className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-black text-slate-700">
                          {isArabic
                            ? 'رقم الهاتف'
                            : 'Téléphone'}
                        </span>

                        <input
                          value={
                            phone
                          }
                          onChange={(
                            event,
                          ) =>
                            setPhone(
                              event.target.value,
                            )
                          }
                          type="tel"
                          dir="ltr"
                          autoComplete="tel"
                          required
                          className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white"
                        />
                      </label>
                    </div>

                    <label className="mt-4 block">
                      <span className="text-sm font-black text-slate-700">
                        {isArabic
                          ? 'البريد الإلكتروني لاستلام eSIM'
                          : 'E-mail de réception eSIM'}
                      </span>

                      <input
                        value={
                          email
                        }
                        onChange={(
                          event,
                        ) =>
                          setEmail(
                            event.target.value,
                          )
                        }
                        type="email"
                        dir="ltr"
                        autoComplete="email"
                        required
                        placeholder="exemple@email.com"
                        className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white"
                      />
                    </label>
                  </section>

                  <section className="border-t border-slate-100 pt-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      {isArabic
                        ? 'الدفع'
                        : 'PAIEMENT'}
                    </p>

                    <p className="mt-2 text-sm font-black text-slate-700">
                      {isArabic
                        ? 'وسيلة الدفع'
                        : 'Moyen de paiement'}
                    </p>

                    {activePaymentMethods.length >
                    0 ? (
                      <div
                        className={[
                          'mt-3 grid gap-2',

                          activePaymentMethods.length ===
                          1
                            ? 'grid-cols-1'
                            : activePaymentMethods.length ===
                                2
                              ? 'grid-cols-2'
                              : 'grid-cols-3',
                        ].join(
                          ' ',
                        )}
                      >
                        {activePaymentMethods.map(
                          (
                            method,
                          ) => {
                            const isSelected =
                              selectedPaymentMethod ===
                              method.id

                            return (
                              <button
                                key={
                                  method.id
                                }
                                type="button"
                                onClick={() => {
                                  setSelectedPaymentMethod(
                                    method.id,
                                  )

                                  setCopiedPaymentNumber(
                                    false,
                                  )
                                }}
                                className={[
                                  'min-h-[48px] rounded-[14px] border px-3 text-sm font-black transition',

                                  isSelected
                                    ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200',
                                ].join(
                                  ' ',
                                )}
                              >
                                {
                                  method.name
                                }
                              </button>
                            )
                          },
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-[14px] border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-black text-amber-800">
                          {isArabic
                            ? 'لا توجد وسيلة دفع متوفرة حاليًا.'
                            : 'Aucun moyen de paiement disponible actuellement.'}
                        </p>
                      </div>
                    )}
                  </section>

                  {selectedMethod && (
                    <section className="overflow-hidden rounded-[18px] border border-blue-100 bg-blue-50">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-wide text-blue-600">
                              {isArabic
                                ? 'رقم الدفع'
                                : 'Numéro de paiement'}
                            </p>

                            <p
                              dir="ltr"
                              className="mt-1 text-left text-xl font-black text-slate-950"
                            >
                              {
                                selectedMethod.paymentNumber
                              }
                            </p>

                            <p className="mt-1 text-xs font-bold text-blue-500">
                              {
                                selectedMethod.name
                              }
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={
                              copyPaymentNumber
                            }
                            className="shrink-0 rounded-[12px] border border-blue-200 bg-white px-3 py-2 text-sm font-black text-blue-600"
                          >
                            {copiedPaymentNumber
                              ? isArabic
                                ? 'تم النسخ ✓'
                                : 'Copié ✓'
                              : isArabic
                                ? 'نسخ'
                                : 'Copier'}
                          </button>
                        </div>

                        <div className="mt-4 rounded-[14px] bg-white/70 p-3">
                          <p className="text-sm leading-6 text-slate-600">
                            {isArabic
                              ? `أرسل ${formatAmount(
                                  verifiedPrice,
                                )} عبر ${selectedMethod.name} إلى الرقم أعلاه، ثم أضف إثبات الدفع.`
                              : `Envoyez ${formatAmount(
                                  verifiedPrice,
                                )} via ${selectedMethod.name} au numéro ci-dessus, puis ajoutez la preuve du paiement.`}
                          </p>

                          <p className="mt-2 text-sm font-semibold leading-6 text-blue-700">
                            {isArabic
                              ? selectedMethod.instructionsAr
                              : selectedMethod.instructionsFr}
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  <label className="block">
                    <span className="text-sm font-black text-slate-700">
                      {isArabic
                        ? 'رقم المرسل'
                        : 'Numéro de l’expéditeur'}
                    </span>

                    <p className="mt-1 text-xs text-slate-400">
                      {isArabic
                        ? 'أدخل الرقم الذي أرسلت منه المبلغ.'
                        : 'Indiquez le numéro utilisé pour envoyer le paiement.'}
                    </p>

                    <input
                      value={
                        senderNumber
                      }
                      onChange={(
                        event,
                      ) =>
                        setSenderNumber(
                          event.target.value,
                        )
                      }
                      type="tel"
                      dir="ltr"
                      required
                      className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-slate-700">
                      {isArabic
                        ? 'إثبات الدفع'
                        : 'Preuve de paiement'}
                    </span>

                    <div
                      className={[
                        'mt-2 rounded-[18px] border border-dashed p-4 transition',

                        proofFile
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-slate-300 bg-slate-50',
                      ].join(
                        ' ',
                      )}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={
                          handleProofChange
                        }
                        disabled={
                          isSubmitting
                        }
                        className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-[10px] file:border-0 file:bg-blue-600 file:px-3 file:py-2.5 file:text-sm file:font-black file:text-white"
                      />

                      {proofFile ? (
                        <div className="mt-3 flex items-center gap-3 rounded-[12px] bg-white p-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-emerald-50 font-black text-emerald-600">
                            ✓
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-700">
                              {
                                proofFile.name
                              }
                            </p>

                            <p
                              dir="ltr"
                              className="mt-1 text-xs text-slate-400"
                            >
                              {(
                                proofFile.size /
                                1024 /
                                1024
                              ).toFixed(
                                2,
                              )}{' '}
                              MB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs leading-5 text-slate-400">
                          {isArabic
                            ? 'JPG أو PNG أو WEBP أو PDF — الحد الأقصى 5 MB.'
                            : 'JPG, PNG, WEBP ou PDF — maximum 5 MB.'}
                        </p>
                      )}
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={
                      !canSubmit
                    }
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-blue-600 px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.16)] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        <span>
                          {isArabic
                            ? 'جاري إرسال الطلب...'
                            : 'Envoi de la commande...'}
                        </span>
                      </>
                    ) : (
                      isArabic
                        ? 'تأكيد الطلب'
                        : 'Confirmer la commande'
                    )}
                  </button>

                  <div className="rounded-[14px] bg-slate-50 px-4 py-3 text-center">
                    <p className="text-xs leading-5 text-slate-400">
                      {isArabic
                        ? 'سيتم إرسال الطلب للمراجعة. الدفع لا يعتبر مؤكدًا حتى تتم مراجعته من TEO STORE.'
                        : 'La commande sera envoyée pour vérification. Le paiement ne sera confirmé qu’après validation par TEO STORE.'}
                    </p>
                  </div>
                </form>
              </div>
            </section>

            <aside className="min-w-0">
              <div
                className="overflow-hidden rounded-[24px] text-white shadow-[0_18px_50px_rgba(15,23,42,0.15)] lg:sticky lg:top-6"
                style={{
                  background:
                    'linear-gradient(135deg,#06101f 0%,#101d44 55%,#312e81 100%)',
                }}
              >
                <div className="relative overflow-hidden p-5 sm:p-6">
                  <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/15 blur-[70px]" />

                  <div className="relative">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">
                        {isArabic
                          ? 'ملخص الطلب'
                          : 'RÉCAPITULATIF'}
                      </p>

                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-black text-emerald-200">
                        {isArabic
                          ? 'متحقق'
                          : 'Vérifié'}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-white/10 text-3xl">
                        {
                          country.flag
                        }
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-base font-black">
                          {
                            country.name[
                              language
                            ]
                          }
                        </p>

                        <p className="mt-1 text-xs font-black uppercase tracking-wide text-white/40">
                          TEO STORE eSIM
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3 rounded-[18px] border border-white/10 bg-white/[0.05] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white/50">
                          {isArabic
                            ? 'البيانات'
                            : 'Données'}
                        </span>

                        <span
                          dir="ltr"
                          className="text-sm font-black"
                        >
                          {
                            requestedPlan.data[
                              language
                            ]
                          }
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white/50">
                          {isArabic
                            ? 'المدة'
                            : 'Durée'}
                        </span>

                        <span className="text-sm font-black">
                          {
                            requestedPlan.duration[
                              language
                            ]
                          }
                        </span>
                      </div>

                      {requestedPlan.speed && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-white/50">
                            {isArabic
                              ? 'الشبكة'
                              : 'Réseau'}
                          </span>

                          <span
                            dir="ltr"
                            className="text-sm font-black"
                          >
                            {
                              requestedPlan.speed[
                                language
                              ]
                            }
                          </span>
                        </div>
                      )}

                      <div className="h-px bg-white/10" />

                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <span className="text-sm font-semibold text-white/50">
                            {isArabic
                              ? 'الإجمالي'
                              : 'Total'}
                          </span>

                          <p className="mt-1 text-xs font-semibold text-white/30">
                            {isArabic
                              ? 'السعر الحالي المعتمد'
                              : 'Prix actuel vérifié'}
                          </p>
                        </div>

                        <span
                          dir="ltr"
                          className="text-xl font-black text-blue-300"
                        >
                          {formatAmount(
                            verifiedPrice,
                          )}
                        </span>
                      </div>
                    </div>

                    {selectedMethod && (
                      <div className="mt-3 rounded-[16px] border border-white/10 bg-white/[0.05] p-4">
                        <p className="text-xs font-black uppercase text-white/40">
                          {isArabic
                            ? 'الدفع'
                            : 'Paiement'}
                        </p>

                        <p className="mt-1 text-sm font-black">
                          {
                            selectedMethod.name
                          }
                        </p>
                      </div>
                    )}

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-[13px] border border-white/10 bg-white/[0.04] p-3 text-center">
                        <p className="text-xs font-black text-white/40">
                          {isArabic
                            ? 'آمن'
                            : 'Sécurisé'}
                        </p>
                      </div>

                      <div className="rounded-[13px] border border-white/10 bg-white/[0.04] p-3 text-center">
                        <p className="text-xs font-black text-white/40">
                          {isArabic
                            ? 'رقمي'
                            : 'Digital'}
                        </p>
                      </div>

                      <div className="rounded-[13px] border border-white/10 bg-white/[0.04] p-3 text-center">
                        <p className="text-xs font-black text-white/40">
                          {isArabic
                            ? 'مدعوم'
                            : 'Support'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2 text-xs font-semibold leading-5 text-white/45">
                      <p>
                        ✓{' '}
                        {isArabic
                          ? 'السعر يعاد التحقق منه قبل إنشاء الطلب'
                          : 'Prix revérifié avant la création de la commande'}
                      </p>

                      <p>
                        ✓{' '}
                        {isArabic
                          ? 'إثبات الدفع محفوظ بشكل خاص'
                          : 'Preuve de paiement stockée de manière privée'}
                      </p>

                      <p>
                        ✓{' '}
                        {isArabic
                          ? 'الدفع يخضع لمراجعة TEO STORE'
                          : 'Paiement soumis à la validation TEO STORE'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </main>
  )
}

export default EsimCheckoutPage