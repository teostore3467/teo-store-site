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

type PaymentMethodRow = {
  id: string
  code: string
  name: string
  payment_number: string
  image_path: string | null
  instructions_fr: string | null
  instructions_ar: string | null
  is_active: boolean
  sort_order: number
}

type PaymentMethod = {
  id: string
  code: string
  name: string
  paymentNumber: string
  imagePath: string | null
  instructionsFr: string
  instructionsAr: string
  active: boolean
  sortOrder: number
}

type ToastState = {
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
}

type PriceValue =
  | string
  | number

const PAYMENT_PROOFS_BUCKET =
  'payment-proofs'

const PAYMENT_METHODS_BUCKET =
  'payment-methods'

const MAX_PROOF_SIZE =
  5 * 1024 * 1024

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

function createProofReference() {
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
    useState<
      PaymentMethod[]
    >([])

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
    selectedPaymentCode,
    setSelectedPaymentCode,
  ] =
    useState('')

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
    copiedNumber,
    setCopiedNumber,
  ] =
    useState(false)

  const [
    copiedAmount,
    setCopiedAmount,
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
              'payment_methods',
            )
            .select(
              `
                id,
                code,
                name,
                payment_number,
                image_path,
                instructions_fr,
                instructions_ar,
                is_active,
                sort_order
              `,
            )
            .eq(
              'is_active',
              true,
            )
            .order(
              'sort_order',
              {
                ascending:
                  true,
              },
            )
            .order(
              'created_at',
              {
                ascending:
                  true,
              },
            )

        if (error) {
          console.error(
            'Unable to load eSIM payment methods:',
            error,
          )

          setPaymentMethods(
            [],
          )

          setSelectedPaymentCode(
            '',
          )

          return
        }

        const methods =
          (
            (data ??
              []) as PaymentMethodRow[]
          ).map(
            (
              row,
            ) => ({
              id:
                row.id,

              code:
                row.code,

              name:
                row.name,

              paymentNumber:
                row.payment_number,

              imagePath:
                row.image_path,

              instructionsFr:
                row.instructions_fr ??
                '',

              instructionsAr:
                row.instructions_ar ??
                '',

              active:
                row.is_active,

              sortOrder:
                row.sort_order,
            }),
          )

        setPaymentMethods(
          methods,
        )

        setSelectedPaymentCode(
          (
            current,
          ) => {
            if (
              !current
            ) {
              return ''
            }

            const stillAvailable =
              methods.some(
                (
                  method,
                ) =>
                  method.code ===
                  current &&
                  method.active,
              )

            return stillAvailable
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

  useEffect(
    () => {
      void Promise.all([
        loadVerifiedPlan(),
        loadPaymentMethods(),
      ])
    },
    [
      loadPaymentMethods,
      loadVerifiedPlan,
    ],
  )

  useEffect(
    () => {
      const channel =
        supabase
          .channel(
            `esim-payment-methods-${Date.now()}`,
          )
          .on(
            'postgres_changes',
            {
              event:
                '*',

              schema:
                'public',

              table:
                'payment_methods',
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
    },
    [
      loadPaymentMethods,
    ],
  )

  useEffect(
    () => {
      let active =
        true

      const loadUser =
        async () => {
          const {
            data,
          } =
            await supabase.auth
              .getUser()

          if (
            !active
          ) {
            return
          }

          const user =
            data.user

          if (
            !user
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

          const metadataName =
            typeof user
              .user_metadata
              ?.full_name ===
            'string'
              ? user
                  .user_metadata
                  .full_name
              : ''

          const metadataPhone =
            typeof user
              .user_metadata
              ?.phone ===
            'string'
              ? user
                  .user_metadata
                  .phone
              : ''

          setFullName(
            (
              current,
            ) =>
              current ||
              metadataName,
          )

          setPhone(
            (
              current,
            ) =>
              current ||
              user.phone ||
              metadataPhone,
          )

          setEmail(
            (
              current,
            ) =>
              current ||
              user.email ||
              '',
          )
        }

      void loadUser()

      return () => {
        active =
          false
      }
    },
    [
      location.pathname,
      location.state,
      navigate,
    ],
  )

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

  const selectedMethod =
    useMemo(
      () => {
        if (
          !selectedPaymentCode
        ) {
          return null
        }

        return (
          paymentMethods.find(
            (
              method,
            ) =>
              method.code ===
              selectedPaymentCode &&
              method.active,
          ) ??
          null
        )
      },
      [
        paymentMethods,
        selectedPaymentCode,
      ],
    )

  const getPaymentImageUrl =
    useCallback(
      (
        imagePath:
          | string
          | null,
      ) => {
        if (
          !imagePath
        ) {
          return null
        }

        const {
          data,
        } =
          supabase.storage
            .from(
              PAYMENT_METHODS_BUCKET,
            )
            .getPublicUrl(
              imagePath,
            )

        return (
          data.publicUrl ||
          null
        )
      },
      [],
    )

  const formatAmount =
    useCallback(
      (
        value:
          number,
      ) => {
        const formatted =
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
          `${formatted} MRU`,
        )
      },
      [
        formatCurrencyText,
        isArabic,
      ],
    )

  const canSubmit =
    Boolean(
      country &&
        requestedPlan &&
        countryActive &&
        planActive &&
        verifiedPrice >
          0 &&
        !verificationError &&
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
        selectedMethod &&
        senderNumber
          .trim()
          .length >
          0 &&
        proofFile &&
        !isSubmitting,
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

      const allowedTypes = [
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
        event.target.value =
          ''

        setProofFile(
          null,
        )

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
        MAX_PROOF_SIZE
      ) {
        event.target.value =
          ''

        setProofFile(
          null,
        )

        showToast({
          type:
            'error',

          title:
            isArabic
              ? 'الملف كبير جدًا'
              : 'Fichier trop volumineux',

          message:
            isArabic
              ? 'الحد الأقصى 5 MB.'
              : 'La taille maximale est de 5 MB.',
        })

        return
      }

      setProofFile(
        file,
      )
    }

  const copyText =
    async (
      value:
        string,

      type:
        'number'
        | 'amount',
    ) => {
      const fallback =
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

          document.body
            .appendChild(
              textarea,
            )

          textarea.select()

          document.execCommand(
            'copy',
          )

          document.body
            .removeChild(
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
          fallback()
        }

        if (
          type ===
          'number'
        ) {
          setCopiedNumber(
            true,
          )

          window.setTimeout(
            () =>
              setCopiedNumber(
                false,
              ),
            1800,
          )
        } else {
          setCopiedAmount(
            true,
          )

          window.setTimeout(
            () =>
              setCopiedAmount(
                false,
              ),
            1800,
          )
        }
      } catch {
        showToast({
          type:
            'error',

          title:
            isArabic
              ? 'تعذر النسخ'
              : 'Copie impossible',
        })
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
          countryResult,
          planResult,
          paymentResult,
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
                'payment_methods',
              )
              .select(
                `
                  id,
                  code,
                  name,
                  payment_number,
                  image_path,
                  instructions_fr,
                  instructions_ar,
                  is_active,
                  sort_order
                `,
              )
              .eq(
                'code',
                selectedMethod.code,
              )
              .eq(
                'is_active',
                true,
              )
              .maybeSingle(),
          ])

        if (
          countryResult.error ||
          planResult.error
        ) {
          throw new Error(
            isArabic
              ? 'تعذر التحقق من الباقة قبل إنشاء الطلب.'
              : 'Impossible de vérifier le forfait avant la commande.',
          )
        }

        if (
          !(
            countryResult
              .data
              ?.active ??
            true
          ) ||
          !(
            planResult
              .data
              ?.active ??
            true
          )
        ) {
          throw new Error(
            isArabic
              ? 'هذه الباقة لم تعد متوفرة.'
              : 'Ce forfait n’est plus disponible.',
          )
        }

        const authoritativePrice =
          planResult.data
            ?.price !==
          undefined
            ? Number(
                planResult
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

        if (
          paymentResult.error ||
          !paymentResult.data
        ) {
          await loadPaymentMethods()

          throw new Error(
            isArabic
              ? 'طريقة الدفع المختارة لم تعد متوفرة.'
              : 'Le moyen de paiement sélectionné n’est plus disponible.',
          )
        }

        const payment =
          paymentResult
            .data as PaymentMethodRow

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
          createProofReference()

        const proofPath =
          `${authData.user.id}/${proofReference}-${Date.now()}.${getFileExtension(
            proofFile,
          )}`

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
                `${requestedPlan.data.fr} · ${requestedPlan.duration.fr}`,

              p_plan_data_fr:
                requestedPlan.data.fr,

              p_plan_data_ar:
                requestedPlan.data.ar,

              p_plan_duration_fr:
                requestedPlan.duration.fr,

              p_plan_duration_ar:
                requestedPlan.duration.ar,

              p_customer_name:
                fullName.trim(),

              p_customer_phone:
                phone.trim(),

              p_customer_email:
                email.trim(),

              p_payment_method:
                payment.code,

              p_payment_sender_number:
                senderNumber.trim(),

              p_payment_proof_path:
                proofPath,
            },
          )

        if (
          orderError
        ) {
          throw orderError
        }

        const createdOrder =
          Array.isArray(
            orderData,
          )
            ? orderData[0]
            : orderData

        const orderNumber =
          typeof createdOrder
            ?.order_number ===
          'string'
            ? createdOrder
                .order_number
            : ''

        const securedPrice =
          Number(
            createdOrder
              ?.total_amount ??
              authoritativePrice,
          )

        if (
          !orderNumber
        ) {
          throw new Error(
            isArabic
              ? 'لم يتم إنشاء رقم طلب صالح.'
              : 'Aucun numéro de commande valide n’a été créé.',
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

              serviceName:
                `eSIM · ${country.name.fr}`,

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
                payment.name,

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
              'Unable to rollback eSIM proof:',
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
      <main className="min-h-screen bg-[#f7f9fc] py-10">
        <Container>
          <div className="mx-auto max-w-xl rounded-[26px] border border-slate-200 bg-white p-8 text-center">
            <h1 className="text-xl font-black text-slate-950">
              {isArabic
                ? 'لم يتم اختيار باقة eSIM'
                : 'Aucun forfait eSIM sélectionné'}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {isArabic
                ? 'ارجع إلى صفحة الدولة واختر الباقة.'
                : 'Retournez à la destination et choisissez un forfait.'}
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
              className="mt-5 rounded-[14px] bg-blue-600 px-5 py-3 text-sm font-black text-white"
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
      <main className="min-h-screen bg-[#f7f9fc] py-10">
        <Container>
          <div className="mx-auto max-w-xl rounded-[26px] border border-rose-100 bg-white p-8 text-center">
            <h1 className="text-xl font-black text-slate-950">
              {isArabic
                ? 'تعذر التحقق من الباقة'
                : 'Vérification impossible'}
            </h1>

            <button
              type="button"
              onClick={() =>
                void loadVerifiedPlan()
              }
              className="mt-5 w-full rounded-[14px] bg-slate-950 px-5 py-3 text-sm font-black text-white"
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
      <main className="min-h-screen bg-[#f7f9fc] py-10">
        <Container>
          <div className="mx-auto max-w-xl rounded-[26px] border border-amber-100 bg-white p-8 text-center">
            <div className="text-4xl">
              {
                country.flag
              }
            </div>

            <h1 className="mt-4 text-xl font-black text-slate-950">
              {isArabic
                ? 'هذه الباقة غير متوفرة حاليًا'
                : 'Ce forfait est indisponible'}
            </h1>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/esim/${country.slug}`,
                )
              }
              className="mt-5 w-full rounded-[14px] bg-blue-600 px-5 py-3 text-sm font-black text-white"
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

  const amountLabel =
    formatAmount(
      verifiedPrice,
    )

  const paymentSteps =
    selectedMethod
      ? isArabic
        ? [
            `افتح تطبيق ${selectedMethod.name}.`,
            'اختر التحويل أو إرسال الأموال.',
            `أدخل رقم TEO STORE: ${selectedMethod.paymentNumber}.`,
            `أدخل المبلغ بالضبط: ${amountLabel}.`,
            'راجع المعلومات ثم أكد عملية الدفع.',
            'التقط Screenshot واضحة بعد نجاح التحويل.',
            'ارجع إلى TEO STORE وأدخل رقم المرسل.',
            'ارفع Screenshot ثم أكد الطلب.',
          ]
        : [
            `Ouvrez l’application ${selectedMethod.name}.`,
            'Choisissez le transfert ou l’envoi d’argent.',
            `Saisissez le numéro TEO STORE : ${selectedMethod.paymentNumber}.`,
            `Saisissez exactement : ${amountLabel}.`,
            'Vérifiez les informations puis confirmez le paiement.',
            'Faites une capture d’écran claire après le transfert.',
            'Revenez sur TEO STORE et indiquez votre numéro expéditeur.',
            'Ajoutez la capture puis confirmez la commande.',
          ]
      : []

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
            <p className="text-sm font-black text-slate-950">
              {
                toast.title
              }
            </p>

            {toast.message && (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {
                  toast.message
                }
              </p>
            )}
          </div>
        </div>
      )}

      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
              TEO STORE eSIM
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
              {isArabic
                ? 'إتمام طلب eSIM'
                : 'Finaliser votre eSIM'}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {country.flag}{' '}
              {
                country.name[
                  language
                ]
              }
              {' · '}
              {
                requestedPlan.data[
                  language
                ]
              }
              {' · '}
              {
                requestedPlan.duration[
                  language
                ]
              }
            </p>
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="min-w-0">
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="space-y-6"
                >
                  <section>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      {isArabic
                        ? 'معلومات العميل'
                        : 'VOS INFORMATIONS'}
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-black text-slate-700">
                          {isArabic
                            ? 'الاسم'
                            : 'Nom'}
                        </span>

                        <input
                          type="text"
                          required
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
                          className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-black text-slate-700">
                          {isArabic
                            ? 'الهاتف'
                            : 'Téléphone'}
                        </span>

                        <input
                          dir="ltr"
                          type="tel"
                          required
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
                          className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-left text-sm outline-none focus:border-blue-500 focus:bg-white"
                        />
                      </label>
                    </div>

                    <label className="mt-4 block">
                      <span className="text-sm font-black text-slate-700">
                        E-mail
                      </span>

                      <input
                        dir="ltr"
                        type="email"
                        required
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
                        className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-left text-sm outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </label>
                  </section>

                  <section className="border-t border-slate-100 pt-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        {isArabic
                          ? 'الدفع'
                          : 'PAIEMENT'}
                      </p>

                      <h2 className="mt-2 text-base font-black text-slate-950">
                        {isArabic
                          ? 'اختر وسيلة الدفع'
                          : 'Choisissez votre moyen de paiement'}
                      </h2>
                    </div>

                    {paymentMethods.length >
                    0 ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {paymentMethods.map(
                          (
                            method,
                          ) => {
                            const selected =
                              selectedPaymentCode ===
                              method.code

                            const imageUrl =
                              getPaymentImageUrl(
                                method.imagePath,
                              )

                            return (
                              <button
                                key={
                                  method.id
                                }
                                type="button"
                                onClick={() => {
                                  setSelectedPaymentCode(
                                    method.code,
                                  )

                                  setCopiedNumber(
                                    false,
                                  )

                                  setCopiedAmount(
                                    false,
                                  )
                                }}
                                className={[
                                  'relative min-h-[116px] overflow-hidden rounded-[18px] border p-3 transition',

                                  selected
                                    ? 'border-2 border-blue-600 bg-blue-50 shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-blue-200',
                                ].join(
                                  ' ',
                                )}
                              >
                                {selected && (
                                  <span className="absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white">
                                    ✓
                                  </span>
                                )}

                                <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-[16px] border border-slate-100 bg-white">
                                  {imageUrl ? (
                                    <img
                                      src={
                                        imageUrl
                                      }
                                      alt={
                                        method.name
                                      }
                                      className="h-full w-full object-contain p-1"
                                    />
                                  ) : (
                                    <span className="text-sm font-black text-blue-600">
                                      {method.name
                                        .slice(
                                          0,
                                          2,
                                        )
                                        .toUpperCase()}
                                    </span>
                                  )}
                                </div>

                                <p
                                  className={[
                                    'mt-3 truncate text-sm font-black',

                                    selected
                                      ? 'text-blue-700'
                                      : 'text-slate-700',
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  {
                                    method.name
                                  }
                                </p>
                              </button>
                            )
                          },
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-black text-amber-700">
                          {isArabic
                            ? 'لا توجد وسيلة دفع متاحة حاليًا.'
                            : 'Aucun moyen de paiement disponible actuellement.'}
                        </p>
                      </div>
                    )}
                  </section>

                  {selectedMethod && (
                    <>
                      <section className="overflow-hidden rounded-[22px] bg-slate-950 text-white">
                        <div className="p-4 sm:p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-white">
                              {getPaymentImageUrl(
                                selectedMethod.imagePath,
                              ) ? (
                                <img
                                  src={
                                    getPaymentImageUrl(
                                      selectedMethod.imagePath,
                                    ) ??
                                    ''
                                  }
                                  alt={
                                    selectedMethod.name
                                  }
                                  className="h-full w-full object-contain p-1"
                                />
                              ) : (
                                <span className="text-sm font-black text-slate-900">
                                  {selectedMethod.name
                                    .slice(
                                      0,
                                      2,
                                    )
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-black uppercase tracking-wide text-white/40">
                                {isArabic
                                  ? 'الدفع عبر'
                                  : 'Paiement via'}
                              </p>

                              <p className="mt-1 truncate text-lg font-black">
                                {
                                  selectedMethod.name
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid border-t border-white/10 sm:grid-cols-2">
                          <div className="border-b border-white/10 p-4 sm:border-b-0 sm:border-e">
                            <p className="text-xs font-black uppercase text-white/40">
                              {isArabic
                                ? 'رقم المستفيد'
                                : 'Numéro bénéficiaire'}
                            </p>

                            <p
                              dir="ltr"
                              className="mt-2 text-left text-xl font-black"
                            >
                              {
                                selectedMethod.paymentNumber
                              }
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                void copyText(
                                  selectedMethod.paymentNumber,
                                  'number',
                                )
                              }
                              className="mt-3 rounded-[10px] bg-white px-3 py-2 text-xs font-black text-slate-900"
                            >
                              {copiedNumber
                                ? isArabic
                                  ? 'تم النسخ ✓'
                                  : 'Copié ✓'
                                : isArabic
                                  ? 'نسخ الرقم'
                                  : 'Copier'}
                            </button>
                          </div>

                          <div className="p-4">
                            <p className="text-xs font-black uppercase text-white/40">
                              {isArabic
                                ? 'المبلغ'
                                : 'Montant'}
                            </p>

                            <p
                              dir="ltr"
                              className="mt-2 text-left text-xl font-black text-blue-300"
                            >
                              {
                                amountLabel
                              }
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                void copyText(
                                  String(
                                    verifiedPrice,
                                  ),
                                  'amount',
                                )
                              }
                              className="mt-3 rounded-[10px] bg-white px-3 py-2 text-xs font-black text-slate-900"
                            >
                              {copiedAmount
                                ? isArabic
                                  ? 'تم النسخ ✓'
                                  : 'Copié ✓'
                                : isArabic
                                  ? 'نسخ المبلغ'
                                  : 'Copier le montant'}
                            </button>
                          </div>
                        </div>
                      </section>

                      <section className="rounded-[20px] border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
                        <h3 className="text-sm font-black text-slate-950">
                          {isArabic
                            ? 'طريقة الدفع'
                            : 'Comment payer ?'}
                        </h3>

                        {(isArabic
                          ? selectedMethod.instructionsAr
                          : selectedMethod.instructionsFr
                        ) && (
                          <p className="mt-2 text-xs font-semibold leading-6 text-blue-700">
                            {isArabic
                              ? selectedMethod.instructionsAr
                              : selectedMethod.instructionsFr}
                          </p>
                        )}

                        <div className="mt-4 space-y-3">
                          {paymentSteps.map(
                            (
                              step,
                              index,
                            ) => (
                              <div
                                key={
                                  `${selectedMethod.code}-${index}`
                                }
                                className="flex items-start gap-3"
                              >
                                <span
                                  dir="ltr"
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-blue-600 shadow-sm"
                                >
                                  {
                                    index +
                                    1
                                  }
                                </span>

                                <p className="pt-1 text-xs font-semibold leading-5 text-slate-600">
                                  {
                                    step
                                  }
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </section>
                    </>
                  )}

                  <label className="block">
                    <span className="text-sm font-black text-slate-700">
                      {isArabic
                        ? 'الرقم الذي دفعت منه'
                        : 'Numéro utilisé pour payer'}
                    </span>

                    <p className="mt-1 text-xs text-slate-400">
                      {selectedMethod
                        ? isArabic
                          ? `أدخل رقم حساب ${selectedMethod.name} الذي أرسلت منه المبلغ.`
                          : `Indiquez le numéro ${selectedMethod.name} utilisé pour envoyer le paiement.`
                        : isArabic
                          ? 'اختر وسيلة الدفع أولًا.'
                          : 'Choisissez d’abord un moyen de paiement.'}
                    </p>

                    <input
                      dir="ltr"
                      type="tel"
                      required
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
                      className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-left text-sm outline-none focus:border-blue-500 focus:bg-white"
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
                        'mt-2 rounded-[18px] border border-dashed p-5 text-center transition',

                        proofFile
                          ? 'border-emerald-200 bg-emerald-50'
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
                        className="block w-full text-xs text-slate-500 file:me-3 file:rounded-[10px] file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:text-xs file:font-black file:text-white"
                      />

                      {proofFile && (
                        <p className="mt-3 break-all text-xs font-black text-emerald-700">
                          ✓{' '}
                          {
                            proofFile.name
                          }
                        </p>
                      )}

                      <p className="mt-3 text-[10px] leading-5 text-slate-400">
                        JPG · PNG · WEBP · PDF · 5 MB max
                      </p>
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={
                      !canSubmit
                    }
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
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
                        ? 'تأكيد الدفع وإرسال الطلب'
                        : 'Confirmer le paiement'
                    )}
                  </button>

                  <p className="text-center text-xs leading-5 text-slate-400">
                    {isArabic
                      ? 'سيتم إرسال الدفع للمراجعة من TEO STORE قبل تفعيل eSIM.'
                      : 'Votre paiement sera vérifié par TEO STORE avant l’activation de votre eSIM.'}
                  </p>
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
                <div className="p-5 sm:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">
                    {isArabic
                      ? 'ملخص الطلب'
                      : 'RÉCAPITULATIF'}
                  </p>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/10 text-3xl">
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

                      <p className="mt-1 text-xs text-white/40">
                        TEO STORE eSIM
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 rounded-[18px] border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-white/50">
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
                      <span className="text-sm text-white/50">
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

                    <div className="h-px bg-white/10" />

                    <div className="flex items-end justify-between gap-3">
                      <span className="text-sm text-white/50">
                        {isArabic
                          ? 'الإجمالي'
                          : 'Total'}
                      </span>

                      <span
                        dir="ltr"
                        className="text-xl font-black text-blue-300"
                      >
                        {
                          amountLabel
                        }
                      </span>
                    </div>
                  </div>

                  {selectedMethod && (
                    <div className="mt-3 flex items-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.05] p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white">
                        {getPaymentImageUrl(
                          selectedMethod.imagePath,
                        ) ? (
                          <img
                            src={
                              getPaymentImageUrl(
                                selectedMethod.imagePath,
                              ) ??
                              ''
                            }
                            alt={
                              selectedMethod.name
                            }
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-[10px] font-black text-slate-900">
                            {selectedMethod.name
                              .slice(
                                0,
                                2,
                              )
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase text-white/40">
                          {isArabic
                            ? 'الدفع'
                            : 'Paiement'}
                        </p>

                        <p className="mt-1 truncate text-sm font-black">
                          {
                            selectedMethod.name
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 space-y-2 text-xs font-semibold leading-5 text-white/45">
                    <p>
                      ✓{' '}
                      {isArabic
                        ? 'السعر يتم التحقق منه قبل إنشاء الطلب'
                        : 'Prix revérifié avant la commande'}
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
            </aside>
          </div>
        </div>
      </Container>
    </main>
  )
}

export default EsimCheckoutPage