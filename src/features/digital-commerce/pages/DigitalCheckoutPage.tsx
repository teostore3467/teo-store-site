import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react'

import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'

import ServiceLogo from '../components/ServiceLogo'

import type {
  ServiceCatalogItem,
} from '../data/serviceCatalog'

import {
  fetchPublicServiceBySlug,
} from '../data/supabaseServiceCatalog'

import {
  getLocalizedCategory,
  getLocalizedCustomerField,
  getLocalizedFulfillmentInstructions,
  getLocalizedFulfillmentLabel,
  getLocalizedFulfillmentWarning,
  getLocalizedGroupShortName,
  getLocalizedPlanLabel,
  getLocalizedServiceName,
} from '../data/serviceCatalogTranslations'

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
  setting_value: Record<string, unknown> | null
}

const PAYMENT_PROOFS_BUCKET =
  'payment-proofs'

const MAX_PAYMENT_PROOF_SIZE =
  5 * 1024 * 1024

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
      'Effectuez le paiement puis أرسل إثبات العملية.',
    instructionsAr:
      'قم بالدفع ثم أرسل إثبات العملية.',
  },
]

function readString(
  value: unknown,
  fallback: string,
) {
  return typeof value === 'string'
    ? value
    : fallback
}

function readBoolean(
  value: unknown,
  fallback: boolean,
) {
  return typeof value === 'boolean'
    ? value
    : fallback
}

function getPaymentProofExtension(
  file: File,
) {
  if (file.type === 'image/png') {
    return 'png'
  }

  if (
    file.type === 'image/jpeg' ||
    file.type === 'image/jpg'
  ) {
    return 'jpg'
  }

  if (file.type === 'image/webp') {
    return 'webp'
  }

  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        '',
      )

  return extension || 'jpg'
}

function createOrderNumber() {
  return `TEO-${Math.floor(
    100000 +
      Math.random() *
        900000,
  )}`
}

function DigitalCheckoutPage() {
  const { productSlug } =
    useParams()

  const [searchParams] =
    useSearchParams()

  const location =
    useLocation()

  const navigate =
    useNavigate()

  const {
    language,
    formatCurrencyText,
  } = useLanguage()

  const isArabic =
    language === 'ar'

  const [
    authChecking,
    setAuthChecking,
  ] = useState(true)

  const [
    authenticatedUserId,
    setAuthenticatedUserId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    customerName,
    setCustomerName,
  ] = useState('')

  const [
    customerPhone,
    setCustomerPhone,
  ] = useState('')

  const [
    customerValues,
    setCustomerValues,
  ] = useState<
    Record<
      string,
      string | boolean
    >
  >({})

  const [
    paymentMethods,
    setPaymentMethods,
  ] = useState<
    PaymentMethod[]
  >(
    DEFAULT_PAYMENT_METHODS,
  )

  const [
    selectedPaymentId,
    setSelectedPaymentId,
  ] =
    useState<PaymentMethodId | null>(
      null,
    )

  const [
    paymentProofFile,
    setPaymentProofFile,
  ] =
    useState<File | null>(
      null,
    )

  const [
    paymentProofName,
    setPaymentProofName,
  ] = useState('')

  const [
    paymentSenderNumber,
    setPaymentSenderNumber,
  ] = useState('')

  const [
    paymentNumberCopied,
    setPaymentNumberCopied,
  ] = useState(false)

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const [
    submissionError,
    setSubmissionError,
  ] =
    useState<string | null>(
      null,
    )

  const groupId =
    searchParams.get('groupId')

  const planId =
    searchParams.get('planId')

  const [
    service,
    setService,
  ] =
    useState<ServiceCatalogItem | null>(
      null,
    )

  const [
    catalogLoading,
    setCatalogLoading,
  ] =
    useState(true)

  const activePaymentMethods =
    useMemo(
      () =>
        paymentMethods.filter(
          (method) =>
            method.active &&
            method.paymentNumber
              .trim()
              .length > 0,
        ),
      [paymentMethods],
    )

  const selectedGroup =
    useMemo(() => {
      if (!service) {
        return null
      }

      return (
        service.groups.find(
          (group) =>
            group.id === groupId,
        ) ?? null
      )
    }, [service, groupId])

  const selectedPlan =
    useMemo(() => {
      if (!selectedGroup) {
        return null
      }

      return (
        selectedGroup.plans.find(
          (plan) =>
            plan.id === planId,
        ) ?? null
      )
    }, [selectedGroup, planId])

  const selectedPayment =
    useMemo(() => {
      if (!selectedPaymentId) {
        return null
      }

      return (
        activePaymentMethods.find(
          (method) =>
            method.id ===
            selectedPaymentId,
        ) ?? null
      )
    }, [
      activePaymentMethods,
      selectedPaymentId,
    ])

  useEffect(() => {
    let active = true

    const loadService =
      async () => {
        setCatalogLoading(
          true,
        )

        if (!productSlug) {
          if (active) {
            setService(null)

            setCatalogLoading(
              false,
            )
          }

          return
        }

        try {
          const nextService =
            await fetchPublicServiceBySlug(
              productSlug,
            )

          if (active) {
            setService(
              nextService,
            )
          }
        } catch (error) {
          console.error(
            'Unable to load checkout service:',
            error,
          )

          if (active) {
            setService(null)
          }
        } finally {
          if (active) {
            setCatalogLoading(
              false,
            )
          }
        }
      }

    void loadService()

    return () => {
      active = false
    }
  }, [productSlug])

  useEffect(() => {
    let active = true

    const loadPaymentMethods =
      async () => {
        try {
          const {
            data,
            error,
          } = await supabase
            .from('app_settings')
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

          if (!active) {
            return
          }

          if (error) {
            console.error(
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

          const nextMethods =
            DEFAULT_PAYMENT_METHODS.map(
              (fallback) => {
                const row =
                  rows.find(
                    (item) =>
                      item.setting_key ===
                      `payment_${fallback.id}`,
                  )

                if (
                  !row ||
                  !row.setting_value
                ) {
                  return fallback
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
            nextMethods,
          )

          setSelectedPaymentId(
            (current) => {
              if (!current) {
                return null
              }

              const exists =
                nextMethods.some(
                  (method) =>
                    method.id ===
                      current &&
                    method.active &&
                    method.paymentNumber
                      .trim()
                      .length >
                      0,
                )

              return exists
                ? current
                : null
            },
          )
        } catch (error) {
          console.error(
            'Unable to load payment settings:',
            error,
          )

          if (active) {
            setPaymentMethods(
              DEFAULT_PAYMENT_METHODS,
            )
          }
        }
      }

    void loadPaymentMethods()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const checkAuthentication =
      async () => {
        setAuthChecking(true)

        const {
          data,
          error,
        } =
          await supabase.auth.getUser()

        if (!active) {
          return
        }

        if (
          error ||
          !data.user
        ) {
          const redirectPath =
            `${location.pathname}${location.search}`

          navigate(
            `/connexion?redirect=${encodeURIComponent(
              redirectPath,
            )}`,
            {
              replace: true,
            },
          )

          return
        }

        setAuthenticatedUserId(
          data.user.id,
        )

        setAuthChecking(false)
      }

    void checkAuthentication()

    return () => {
      active = false
    }
  }, [
    location.pathname,
    location.search,
    navigate,
  ])

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [
    productSlug,
    groupId,
    planId,
  ])

  useEffect(() => {
    setCustomerName('')
    setCustomerPhone('')
    setCustomerValues({})
    setSelectedPaymentId(null)
    setPaymentProofFile(null)
    setPaymentProofName('')
    setPaymentSenderNumber('')
    setPaymentNumberCopied(false)
    setIsSubmitting(false)
    setSubmissionError(null)
  }, [
    productSlug,
    groupId,
    planId,
  ])

  const handleCustomerValueChange = (
    fieldId: string,
    value:
      | string
      | boolean,
  ) => {
    setCustomerValues(
      (current) => ({
        ...current,
        [fieldId]: value,
      }),
    )

    setSubmissionError(null)
  }

  const handlePaymentProofChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0]

    setSubmissionError(null)

    if (!file) {
      setPaymentProofFile(null)
      setPaymentProofName('')
      return
    }

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ]

    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      setPaymentProofFile(null)
      setPaymentProofName('')

      setSubmissionError(
        isArabic
          ? 'يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP.'
          : 'Veuillez choisir une image JPG, PNG ou WEBP.',
      )

      event.target.value = ''

      return
    }

    if (
      file.size >
      MAX_PAYMENT_PROOF_SIZE
    ) {
      setPaymentProofFile(null)
      setPaymentProofName('')

      setSubmissionError(
        isArabic
          ? 'يجب ألا يتجاوز حجم صورة إثبات الدفع 5 MB.'
          : 'La preuve de paiement ne doit pas dépasser 5 MB.',
      )

      event.target.value = ''

      return
    }

    setPaymentProofFile(
      file,
    )

    setPaymentProofName(
      file.name,
    )
  }

  const handleCopyPaymentNumber =
    async () => {
      if (!selectedPayment) {
        return
      }

      const value =
        selectedPayment.paymentNumber

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
          await navigator.clipboard.writeText(
            value,
          )
        } else {
          fallbackCopy()
        }

        setPaymentNumberCopied(
          true,
        )

        window.setTimeout(
          () => {
            setPaymentNumberCopied(
              false,
            )
          },
          1800,
        )
      } catch {
        try {
          fallbackCopy()

          setPaymentNumberCopied(
            true,
          )

          window.setTimeout(
            () => {
              setPaymentNumberCopied(
                false,
              )
            },
            1800,
          )
        } catch {
          setPaymentNumberCopied(
            false,
          )
        }
      }
    }

  if (
    authChecking ||
    catalogLoading
  ) {
    return (
      <main className="min-h-[60vh] bg-[#f7f9fc]">
        <Container>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-xs font-bold text-slate-500">
                {isArabic
                  ? 'جارٍ التحقق من حسابك...'
                  : 'Vérification de votre compte...'}
              </p>
            </div>
          </div>
        </Container>
      </main>
    )
  }

  if (!authenticatedUserId) {
    return null
  }

  if (
    !service ||
    !selectedGroup ||
    !selectedPlan ||
    service.availability !==
      'available' ||
    selectedGroup.availability !==
      'available' ||
    selectedPlan.availability !==
      'available'
  ) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] py-8 sm:py-12">
        <Container>
          <div className="mx-auto max-w-md rounded-[22px] border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-400">
              !
            </div>

            <h1 className="mt-4 text-xl font-black text-slate-950">
              {isArabic
                ? 'اختيار غير صالح'
                : 'Sélection invalide'}
            </h1>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {isArabic
                ? 'الخطة المختارة غير متوفرة أو رابط الطلب غير مكتمل.'
                : "La formule sélectionnée n'est pas disponible ou le lien de commande est incomplet."}
            </p>

            <Link
              to={
                productSlug
                  ? `/services-numeriques/${productSlug}`
                  : '/services-numeriques'
              }
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-xs font-black text-white transition hover:bg-blue-500"
            >
              {isArabic
                ? 'العودة إلى الخدمة'
                : 'Retour au service'}
            </Link>
          </div>
        </Container>
      </main>
    )
  }

  const localizedServiceName =
    getLocalizedServiceName(
      service,
      language,
    )

  const localizedGroupName =
    getLocalizedGroupShortName(
      selectedGroup,
      language,
    )

  const localizedPlanLabel =
    getLocalizedPlanLabel(
      selectedPlan,
      language,
    )

  const localizedCategory =
    getLocalizedCategory(
      service.category,
      language,
    )

  const fulfillmentLabel =
    getLocalizedFulfillmentLabel(
      selectedGroup.fulfillment
        .type,
      language,
    )

  const localizedWarning =
    getLocalizedFulfillmentWarning(
      service.slug,
      selectedGroup,
      language,
    )

  const localizedInstructions =
    getLocalizedFulfillmentInstructions(
      service.slug,
      selectedGroup,
      language,
    )

  const customerFields =
    selectedGroup.fulfillment.customerFields.map(
      (field) =>
        getLocalizedCustomerField(
          service.slug,
          selectedGroup.id,
          field,
          language,
        ),
    )

  const fulfillmentType =
    selectedGroup.fulfillment
      .type

  const serviceLetter =
    service.name
      .trim()
      .charAt(0)
      .toUpperCase() ||
    'T'

  const formatPrice = (
    price: number,
    currency: 'MRU',
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
        Number(price),
      )

    return formatCurrencyText(
      `${formattedNumber} ${currency}`,
    )
  }

  const totalLabel =
    formatPrice(
      selectedPlan.price,
      selectedPlan.currency,
    )

  const areContactFieldsComplete =
    customerName.trim().length >
      0 &&
    customerPhone.trim().length >
      0

  const areRequiredCustomerFieldsComplete =
    selectedGroup.fulfillment.customerFields.every(
      (field) => {
        const value =
          customerValues[
            field.id
          ]

        if (!field.required) {
          return true
        }

        if (
          field.type ===
          'checkbox'
        ) {
          return value === true
        }

        return (
          typeof value ===
            'string' &&
          value.trim().length >
            0
        )
      },
    )

  const canConfirmPayment =
    service.availability ===
      'available' &&
    selectedGroup.availability ===
      'available' &&
    selectedPlan.availability ===
      'available' &&
    areContactFieldsComplete &&
    Boolean(
      selectedPayment,
    ) &&
    paymentSenderNumber
      .trim()
      .length >
      0 &&
    Boolean(
      paymentProofFile,
    ) &&
    areRequiredCustomerFieldsComplete &&
    !isSubmitting

  const getPaymentDescription = (
    method: PaymentMethod,
  ) => {
    const instructions =
      isArabic
        ? method.instructionsAr
        : method.instructionsFr

    if (
      instructions
        .trim()
        .length > 0
    ) {
      return instructions
    }

    if (isArabic) {
      return `أرسل مبلغ الطلب إلى رقم ${method.name} الخاص بـ TEO STORE.`
    }

    return `Effectuez le paiement vers le numéro ${method.name} TEO STORE.`
  }

  const handleSubmitOrder =
    async () => {
      if (
        !canConfirmPayment ||
        !selectedPayment ||
        !paymentProofFile
      ) {
        return
      }

      setIsSubmitting(
        true,
      )

      setSubmissionError(
        null,
      )

      let uploadedProofPath:
        string | null = null

      try {
        const {
          data: userData,
          error: userError,
        } =
          await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        const user =
          userData.user

        if (!user) {
          const redirectPath =
            `${location.pathname}${location.search}`

          navigate(
            `/connexion?redirect=${encodeURIComponent(
              redirectPath,
            )}`,
            {
              replace: true,
            },
          )

          return
        }

        const generatedOrderNumber =
          createOrderNumber()

        const extension =
          getPaymentProofExtension(
            paymentProofFile,
          )

        const proofFilePath =
          `${user.id}/${generatedOrderNumber}-${Date.now()}.${extension}`

        const {
          error:
            proofUploadError,
        } =
          await supabase.storage
            .from(
              PAYMENT_PROOFS_BUCKET,
            )
            .upload(
              proofFilePath,
              paymentProofFile,
              {
                cacheControl:
                  '3600',
                upsert: false,
                contentType:
                  paymentProofFile.type,
              },
            )

        if (proofUploadError) {
          throw proofUploadError
        }

        uploadedProofPath =
          proofFilePath

        const emailField =
          selectedGroup.fulfillment.customerFields.find(
            (field) =>
              field.type ===
              'email',
          )

        const emailValue =
          emailField
            ? customerValues[
                emailField.id
              ]
            : undefined

        const customerEmail =
          typeof emailValue ===
            'string' &&
          emailValue
            .trim()
            .length >
            0
            ? emailValue.trim()
            : user.email ??
              null

        const {
          data:
            orderRpcData,
          error:
            orderRpcError,
        } =
          await supabase.rpc(
            'customer_create_digital_order',
            {
              p_service_slug:
                service.slug,

              p_group_id:
                selectedGroup.id,

              p_plan_id:
                selectedPlan.id,

              p_customer_name:
                customerName.trim(),

              p_customer_phone:
                customerPhone.trim(),

              p_customer_email:
                customerEmail ?? '',

              p_customer_values: {
                ...customerValues,
              },

              p_payment_method:
                selectedPayment.id,

              p_payment_sender_number:
                paymentSenderNumber.trim(),

              p_payment_proof_path:
                proofFilePath,
            },
          )

        if (orderRpcError) {
          throw orderRpcError
        }

        const createdOrder =
          Array.isArray(
            orderRpcData,
          )
            ? orderRpcData[0]
            : orderRpcData

        const createdOrderNumber =
          typeof createdOrder?.order_number ===
          'string'
            ? createdOrder.order_number
            : ''

        if (
          createdOrderNumber
            .trim()
            .length ===
          0
        ) {
          throw new Error(
            isArabic
              ? 'تم إنشاء الطلب بدون رقم صالح.'
              : 'La commande a été créée sans numéro valide.',
          )
        }

        navigate(
          `/commande/${createdOrderNumber}`,
          {
            replace: true,
          },
        )
      } catch (error) {
        console.error(
          'Digital order submission failed:',
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

          if (rollbackError) {
            console.warn(
              'Unable to remove payment proof after order failure:',
              rollbackError,
            )
          }
        }

        const message =
          error instanceof Error
            ? error.message
            : isArabic
              ? 'حدث خطأ غير معروف.'
              : 'Une erreur inconnue est survenue.'

        setSubmissionError(
          isArabic
            ? `تعذر إرسال الطلب. ${message}`
            : `Impossible d’envoyer la commande. ${message}`,
        )
      } finally {
        setIsSubmitting(
          false,
        )
      }
    }

  const renderFulfillmentInformation =
    () => {
      if (
        customerFields.length >
        0
      ) {
        return (
          <div className="mt-4 space-y-3">
            {customerFields.map(
              (field) => {
                if (
                  field.type ===
                  'checkbox'
                ) {
                  return (
                    <label
                      key={
                        field.id
                      }
                      className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-slate-200 bg-slate-50 p-3"
                    >
                      <input
                        type="checkbox"
                        checked={
                          customerValues[
                            field.id
                          ] === true
                        }
                        onChange={(
                          event,
                        ) =>
                          handleCustomerValueChange(
                            field.id,
                            event
                              .target
                              .checked,
                          )
                        }
                        className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                      />

                      <div>
                        <p className="text-[10px] font-bold leading-5 text-slate-700 sm:text-xs">
                          {
                            field.label
                          }
                        </p>

                        {field.helpText && (
                          <p className="mt-1 text-[8px] leading-4 text-slate-400 sm:text-[9px]">
                            {
                              field.helpText
                            }
                          </p>
                        )}
                      </div>
                    </label>
                  )
                }

                return (
                  <label
                    key={
                      field.id
                    }
                    className="block"
                  >
                    <span className="text-[9px] font-black text-slate-600">
                      {
                        field.label
                      }

                      {field.required && (
                        <span
                          className={
                            isArabic
                              ? 'mr-1 text-red-500'
                              : 'ml-1 text-red-500'
                          }
                        >
                          *
                        </span>
                      )}
                    </span>

                    <input
                      type={
                        field.type ===
                        'email'
                          ? 'email'
                          : 'text'
                      }
                      value={
                        typeof customerValues[
                          field.id
                        ] ===
                        'string'
                          ? (customerValues[
                              field.id
                            ] as string)
                          : ''
                      }
                      onChange={(
                        event,
                      ) =>
                        handleCustomerValueChange(
                          field.id,
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder={
                        field.placeholder ??
                        ''
                      }
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500"
                    />

                    {field.helpText && (
                      <p className="mt-1.5 text-[8px] leading-4 text-slate-400 sm:text-[9px]">
                        {
                          field.helpText
                        }
                      </p>
                    )}
                  </label>
                )
              },
            )}
          </div>
        )
      }

      if (
        fulfillmentType ===
        'automatic_chat'
      ) {
        return (
          <div className="mt-4 rounded-[16px] border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-blue-600">
              {isArabic
                ? 'محادثة بعد الدفع'
                : 'DISCUSSION APRÈS PAIEMENT'}
            </p>

            <p className="mt-2 text-[10px] leading-5 text-slate-600 sm:text-xs">
              {isArabic
                ? 'بعد تأكيد الدفع، ستُفتح محادثة مع إدارة TEO STORE لإكمال طلبك.'
                : "Après confirmation du paiement, une discussion avec l'administration TEO STORE permettra de terminer votre commande."}
            </p>
          </div>
        )
      }

      if (
        fulfillmentType ===
        'account_credentials'
      ) {
        return (
          <div className="mt-4 rounded-[16px] border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-blue-600">
              {isArabic
                ? 'بيانات الحساب بعد الدفع'
                : 'IDENTIFIANTS FOURNIS APRÈS PAIEMENT'}
            </p>

            <p className="mt-2 text-[10px] leading-5 text-slate-600 sm:text-xs">
              {isArabic
                ? 'بعد تأكيد الدفع، سيرسل لك TEO STORE معلومات الحساب الخاصة بالخدمة.'
                : 'Après confirmation du paiement, TEO STORE vous transmettra les informations de votre compte.'}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 text-[8px] font-black text-slate-600">
                {isArabic
                  ? 'البريد الإلكتروني'
                  : 'E-mail'}
              </span>

              <span className="rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 text-[8px] font-black text-slate-600">
                {isArabic
                  ? 'كلمة المرور'
                  : 'Mot de passe'}
              </span>

              <span className="rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 text-[8px] font-black text-slate-600">
                {isArabic
                  ? 'ملاحظة'
                  : 'Note'}
              </span>
            </div>
          </div>
        )
      }

      if (
        fulfillmentType ===
        'activation_code'
      ) {
        return (
          <div className="mt-4 rounded-[16px] border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-blue-600">
              {isArabic
                ? 'الكود بعد الدفع'
                : 'CODE APRÈS PAIEMENT'}
            </p>

            <p className="mt-2 text-[10px] leading-5 text-slate-600 sm:text-xs">
              {isArabic
                ? 'بعد تأكيد الدفع، سيرسل لك TEO STORE الكود أو المفتاح الرقمي مع التعليمات اللازمة.'
                : 'Après confirmation du paiement, TEO STORE vous transmettra votre code ou clé numérique avec les instructions nécessaires.'}
            </p>
          </div>
        )
      }

      if (
        fulfillmentType ===
        'activation_link'
      ) {
        return (
          <div className="mt-4 rounded-[16px] border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-blue-600">
              {isArabic
                ? 'رابط التفعيل'
                : "LIEN D'ACTIVATION"}
            </p>

            <p className="mt-2 text-[10px] leading-5 text-slate-600 sm:text-xs">
              {isArabic
                ? 'بعد تأكيد الدفع، سيتم تجهيز رابط التفعيل حسب شروط هذه الخطة.'
                : "Après confirmation du paiement, votre lien d'activation sera préparé selon les conditions de cette formule."}
            </p>
          </div>
        )
      }

      if (
        fulfillmentType ===
        'activation_code_or_link'
      ) {
        return (
          <div className="mt-4 rounded-[16px] border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-blue-600">
              {isArabic
                ? 'التفعيل بعد الدفع'
                : 'ACTIVATION APRÈS PAIEMENT'}
            </p>

            <p className="mt-2 text-[10px] leading-5 text-slate-600 sm:text-xs">
              {isArabic
                ? 'بعد تأكيد الدفع، سيرسل لك TEO STORE كودًا أو رابط تفعيل حسب الخطة.'
                : "Après confirmation du paiement, TEO STORE vous transmettra un code ou un lien d'activation selon la formule."}
            </p>
          </div>
        )
      }

      if (
        fulfillmentType ===
        'customer_email'
      ) {
        return (
          <div className="mt-4 rounded-[16px] border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-blue-600">
              {isArabic
                ? 'التفعيل عبر البريد الإلكتروني'
                : 'ACTIVATION PAR E-MAIL'}
            </p>

            <p className="mt-2 text-[10px] leading-5 text-slate-600 sm:text-xs">
              {isArabic
                ? 'سيتم تنفيذ التفعيل باستخدام البريد الإلكتروني الذي أدخلته في هذا الطلب.'
                : "Votre activation sera effectuée à partir de l'adresse e-mail indiquée dans cette commande."}
            </p>
          </div>
        )
      }

      if (
        fulfillmentType ===
        'player_id_verification'
      ) {
        return (
          <div className="mt-4 rounded-[16px] border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-blue-600">
              {isArabic
                ? 'التحقق من Player ID'
                : 'VÉRIFICATION DU PLAYER ID'}
            </p>

            <p className="mt-2 text-[10px] leading-5 text-slate-600 sm:text-xs">
              {isArabic
                ? 'بعد الدفع، سيتحقق TEO STORE من Player ID وسيظهر لك اسم اللاعب للتأكيد قبل تنفيذ الشحن.'
                : 'Après paiement, TEO STORE vérifiera votre Player ID. Le nom du joueur vous sera présenté pour confirmation avant la recharge.'}
            </p>
          </div>
        )
      }

      return null
    }

  return (
    <main
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
      className="min-h-screen bg-[#f7f9fc]"
    >
      <section className="border-b border-slate-200 bg-white">
        <Container className="py-3">
          <div className="flex min-w-0 items-center gap-2 overflow-hidden text-[9px] font-semibold text-slate-400 sm:text-xs">
            <Link
              to="/services-numeriques"
              className="shrink-0 transition hover:text-blue-600"
            >
              {isArabic
                ? 'الخدمات الرقمية'
                : 'Services numériques'}
            </Link>

            <span>/</span>

            <Link
              to={`/services-numeriques/${service.slug}`}
              className="truncate transition hover:text-blue-600"
            >
              {
                localizedServiceName
              }
            </Link>

            <span>/</span>

            <span className="shrink-0 text-slate-700">
              {isArabic
                ? 'الطلب'
                : 'Commande'}
            </span>
          </div>
        </Container>
      </section>

      <section className="py-6 sm:py-9 lg:py-12">
        <Container>
          <div className="mx-auto max-w-5xl">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-blue-600 sm:text-[9px]">
                  {isArabic
                    ? 'طلب رقمي'
                    : 'COMMANDE DIGITALE'}
                </span>
              </div>

              <h1 className="mt-3 text-[26px] font-black tracking-[-0.035em] text-slate-950 sm:text-3xl lg:text-4xl">
                {isArabic
                  ? 'أكمل طلبك'
                  : 'Finalisez votre commande'}
              </h1>

              <p className="mt-2 max-w-xl text-[11px] leading-5 text-slate-500 sm:text-sm sm:leading-6">
                {isArabic
                  ? 'راجع اختيارك، اختر طريقة الدفع واتبع التعليمات لإرسال الطلب.'
                  : 'Vérifiez votre sélection, choisissez votre mode de paiement et suivez les instructions.'}
              </p>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
              <div className="space-y-4">
                <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl p-2 text-base font-black text-white"
                      style={{
                        background:
                          'linear-gradient(145deg, #2563eb 0%, #4338ca 100%)',
                      }}
                    >
                      <ServiceLogo
                        serviceSlug={
                          service.slug
                        }
                        fallback={
                          serviceLetter
                        }
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-blue-600">
                        {
                          localizedCategory
                        }
                      </p>

                      <h2 className="mt-0.5 truncate text-sm font-black text-slate-950 sm:text-base">
                        {
                          localizedServiceName
                        }
                      </h2>

                      <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                        {
                          localizedGroupName
                        }{' '}
                        ·{' '}
                        {
                          localizedPlanLabel
                        }
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-600">
                      1
                    </div>

                    <div>
                      <h2 className="text-sm font-black text-slate-950 sm:text-base">
                        {isArabic
                          ? 'معلوماتك'
                          : 'Vos informations'}
                      </h2>

                      <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                        {isArabic
                          ? 'معلومات التواصل'
                          : 'Informations de contact'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-[9px] font-black text-slate-600">
                        {isArabic
                          ? 'الاسم'
                          : 'Nom'}

                        <span
                          className={
                            isArabic
                              ? 'mr-1 text-red-500'
                              : 'ml-1 text-red-500'
                          }
                        >
                          *
                        </span>
                      </span>

                      <input
                        type="text"
                        value={
                          customerName
                        }
                        onChange={(
                          event,
                        ) => {
                          setCustomerName(
                            event.target.value,
                          )

                          setSubmissionError(
                            null,
                          )
                        }}
                        placeholder={
                          isArabic
                            ? 'اسمك'
                            : 'Votre nom'
                        }
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[9px] font-black text-slate-600">
                        {isArabic
                          ? 'الهاتف'
                          : 'Téléphone'}

                        <span
                          className={
                            isArabic
                              ? 'mr-1 text-red-500'
                              : 'ml-1 text-red-500'
                          }
                        >
                          *
                        </span>
                      </span>

                      <input
                        dir="ltr"
                        type="tel"
                        inputMode="tel"
                        value={
                          customerPhone
                        }
                        onChange={(
                          event,
                        ) => {
                          setCustomerPhone(
                            event.target.value,
                          )

                          setSubmissionError(
                            null,
                          )
                        }}
                        placeholder="+222 ..."
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-left text-xs font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500"
                      />
                    </label>
                  </div>
                </section>

                <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-600">
                      2
                    </div>

                    <div>
                      <h2 className="text-sm font-black text-slate-950 sm:text-base">
                        {isArabic
                          ? 'معلومات الخدمة'
                          : 'Informations du service'}
                      </h2>

                      <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                        {
                          fulfillmentLabel
                        }
                      </p>
                    </div>
                  </div>

                  {renderFulfillmentInformation()}

                  {localizedWarning && (
                    <div className="mt-3 rounded-[14px] border border-amber-200 bg-amber-50 p-3">
                      <p className="text-[8px] font-black uppercase tracking-wide text-amber-700">
                        {isArabic
                          ? 'مهم'
                          : 'Important'}
                      </p>

                      <p className="mt-1 text-[9px] leading-5 text-amber-700 sm:text-[10px]">
                        {
                          localizedWarning
                        }
                      </p>
                    </div>
                  )}

                  {localizedInstructions && (
                    <div className="mt-3 rounded-[14px] border border-blue-100 bg-blue-50/50 p-3">
                      <p className="text-[8px] font-black uppercase tracking-wide text-blue-700">
                        {isArabic
                          ? 'التعليمات'
                          : 'Instructions'}
                      </p>

                      <p className="mt-1 text-[9px] leading-5 text-slate-600 sm:text-[10px]">
                        {
                          localizedInstructions
                        }
                      </p>
                    </div>
                  )}
                </section>

                <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xs font-black text-violet-600">
                      3
                    </div>

                    <div>
                      <h2 className="text-sm font-black text-slate-950 sm:text-base">
                        {isArabic
                          ? 'طريقة الدفع'
                          : 'Mode de paiement'}
                      </h2>

                      <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                        {isArabic
                          ? 'اختر طريقة الدفع'
                          : 'Choisissez votre méthode'}
                      </p>
                    </div>
                  </div>

                  {activePaymentMethods.length >
                  0 ? (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {activePaymentMethods.map(
                        (method) => {
                          const isSelected =
                            selectedPaymentId ===
                            method.id

                          return (
                            <button
                              key={
                                method.id
                              }
                              type="button"
                              onClick={() => {
                                setSelectedPaymentId(
                                  method.id,
                                )

                                setPaymentNumberCopied(
                                  false,
                                )

                                setSubmissionError(
                                  null,
                                )
                              }}
                              className={[
                                'min-h-[76px] rounded-[15px] border p-2 text-center transition',
                                isSelected
                                  ? 'border-2 border-blue-600 bg-blue-50'
                                  : 'border-slate-200 bg-white hover:border-blue-200',
                              ].join(
                                ' ',
                              )}
                            >
                              <p
                                className={[
                                  'text-[10px] font-black sm:text-xs',
                                  isSelected
                                    ? 'text-blue-700'
                                    : 'text-slate-800',
                                ].join(
                                  ' ',
                                )}
                              >
                                {
                                  method.name
                                }
                              </p>

                              <p
                                className={[
                                  'mt-1 text-[7px] font-bold',
                                  isSelected
                                    ? 'text-blue-400'
                                    : 'text-slate-300',
                                ].join(
                                  ' ',
                                )}
                              >
                                {isSelected
                                  ? isArabic
                                    ? 'محدد'
                                    : 'Sélectionné'
                                  : isArabic
                                    ? 'اختيار'
                                    : 'Choisir'}
                              </p>
                            </button>
                          )
                        },
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[14px] border border-amber-200 bg-amber-50 p-3 text-center">
                      <p className="text-[9px] font-bold leading-5 text-amber-700">
                        {isArabic
                          ? 'لا توجد وسيلة دفع متاحة حاليًا.'
                          : "Aucun moyen de paiement n'est disponible actuellement."}
                      </p>
                    </div>
                  )}

                  {selectedPayment ? (
                    <div className="mt-4 overflow-hidden rounded-[16px] border border-blue-100 bg-blue-50/50">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-blue-600">
                              {isArabic
                                ? 'الدفع عبر'
                                : 'PAIEMENT VIA'}
                            </p>

                            <p className="mt-1 text-sm font-black text-slate-950">
                              {
                                selectedPayment.name
                              }
                            </p>
                          </div>

                          <div className="rounded-full bg-blue-600 px-2.5 py-1 text-[7px] font-black uppercase text-white">
                            {isArabic
                              ? 'نشط'
                              : 'Actif'}
                          </div>
                        </div>

                        <p className="mt-2 text-[9px] leading-5 text-slate-500 sm:text-[10px]">
                          {getPaymentDescription(
                            selectedPayment,
                          )}
                        </p>
                      </div>

                      <div className="border-t border-blue-100 bg-white p-4">
                        <p className="text-[8px] font-black uppercase tracking-wide text-slate-400">
                          {isArabic
                            ? 'رقم الدفع'
                            : 'NUMÉRO DE PAIEMENT'}
                        </p>

                        <div
                          dir="ltr"
                          className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                        >
                          <p className="min-w-0 truncate text-lg font-black tracking-wide text-slate-950">
                            {
                              selectedPayment.paymentNumber
                            }
                          </p>

                          <button
                            type="button"
                            onClick={
                              handleCopyPaymentNumber
                            }
                            className={[
                              'shrink-0 rounded-lg px-3 py-2 text-[9px] font-black transition',
                              paymentNumberCopied
                                ? 'bg-slate-900 text-white'
                                : 'bg-blue-600 text-white hover:bg-blue-500',
                            ].join(
                              ' ',
                            )}
                          >
                            {paymentNumberCopied
                              ? isArabic
                                ? 'تم النسخ ✓'
                                : 'Copié ✓'
                              : isArabic
                                ? 'نسخ'
                                : 'Copier'}
                          </button>
                        </div>

                        <p className="mt-2 text-[8px] leading-4 text-slate-400">
                          {isArabic
                            ? 'أرسل المبلغ الكامل للطلب إلى هذا الرقم بالضبط.'
                            : 'Envoyez exactement le montant de votre commande à ce numéro.'}
                        </p>

                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <label className="block">
                            <span className="text-[9px] font-black text-slate-700">
                              {isArabic
                                ? 'الرقم المستخدم للدفع'
                                : 'Numéro utilisé pour le paiement'}

                              <span
                                className={
                                  isArabic
                                    ? 'mr-1 text-red-500'
                                    : 'ml-1 text-red-500'
                                }
                              >
                                *
                              </span>
                            </span>

                            <p className="mt-1 text-[8px] leading-4 text-slate-400">
                              {isArabic
                                ? 'أدخل الرقم الذي أرسلت منه مبلغ الدفع.'
                                : 'Entrez le numéro depuis lequel vous avez envoyé le paiement.'}
                            </p>

                            <input
                              dir="ltr"
                              type="tel"
                              inputMode="numeric"
                              value={
                                paymentSenderNumber
                              }
                              onChange={(
                                event,
                              ) => {
                                setPaymentSenderNumber(
                                  event.target.value,
                                )

                                setSubmissionError(
                                  null,
                                )
                              }}
                              placeholder="Ex. 22 00 00 00"
                              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-left text-xs font-bold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-blue-500"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    activePaymentMethods.length >
                      0 && (
                      <div className="mt-4 rounded-[14px] border border-dashed border-slate-200 bg-slate-50 p-3 text-center">
                        <p className="text-[9px] font-bold text-slate-400">
                          {isArabic
                            ? 'اختر طريقة دفع للمتابعة.'
                            : 'Sélectionnez une méthode de paiement pour continuer.'}
                        </p>
                      </div>
                    )
                  )}

                  {selectedPayment && (
                    <div className="mt-4">
                      <p className="text-[9px] font-black text-slate-700">
                        {isArabic
                          ? 'إثبات الدفع'
                          : 'Preuve de paiement'}

                        <span
                          className={
                            isArabic
                              ? 'mr-1 text-red-500'
                              : 'ml-1 text-red-500'
                          }
                        >
                          *
                        </span>
                      </p>

                      <p className="mt-1 text-[8px] leading-4 text-slate-400">
                        {isArabic
                          ? 'أضف صورة لعملية الدفع. سيتم حفظها بشكل خاص واستخدامها للتحقق من معاملتك.'
                          : 'Ajoutez une capture du paiement. Elle sera stockée de manière privée et utilisée pour vérifier votre transaction.'}
                      </p>

                      <label className="mt-3 flex min-h-[92px] cursor-pointer items-center justify-center rounded-[15px] border border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-blue-300 hover:bg-blue-50/40">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={
                            handlePaymentProofChange
                          }
                          className="hidden"
                        />

                        <div className="min-w-0">
                          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                            ↑
                          </div>

                          <p className="mt-2 truncate text-[9px] font-black text-slate-600 sm:text-[10px]">
                            {paymentProofName ||
                              (isArabic
                                ? 'اختر صورة إثبات الدفع'
                                : 'Choisir la preuve de paiement')}
                          </p>

                          <p className="mt-1 text-[8px] text-slate-400">
                            JPG · PNG · WEBP · 5 MB max
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  {submissionError && (
                    <div className="mt-4 rounded-[14px] border border-red-200 bg-red-50 p-3">
                      <p className="text-[9px] font-bold leading-5 text-red-600 sm:text-[10px]">
                        {
                          submissionError
                        }
                      </p>
                    </div>
                  )}
                </section>
              </div>

              <aside className="lg:sticky lg:top-6">
                <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_36px_rgba(15,23,42,0.06)]">
                  <div className="border-b border-slate-100 p-5">
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-blue-600">
                      {isArabic
                        ? 'ملخص الطلب'
                        : 'RÉCAPITULATIF'}
                    </p>

                    <h2 className="mt-2 text-base font-black text-slate-950">
                      {
                        localizedServiceName
                      }
                    </h2>

                    <p className="mt-1 text-[10px] leading-5 text-slate-400">
                      {
                        localizedGroupName
                      }{' '}
                      ·{' '}
                      {
                        localizedPlanLabel
                      }
                    </p>
                  </div>

                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-4 rounded-[14px] bg-slate-50 p-3">
                      <span className="text-[9px] font-bold text-slate-400">
                        {isArabic
                          ? 'الخدمة'
                          : 'Service'}
                      </span>

                      <span className="text-right text-[9px] font-black text-slate-700">
                        {
                          localizedServiceName
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-[14px] bg-slate-50 p-3">
                      <span className="text-[9px] font-bold text-slate-400">
                        {isArabic
                          ? 'الخيار'
                          : 'Option'}
                      </span>

                      <span className="text-right text-[9px] font-black text-slate-700">
                        {
                          localizedGroupName
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-[14px] bg-slate-50 p-3">
                      <span className="text-[9px] font-bold text-slate-400">
                        {isArabic
                          ? 'الخطة'
                          : 'Formule'}
                      </span>

                      <span className="text-right text-[9px] font-black text-slate-700">
                        {
                          localizedPlanLabel
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-[14px] bg-slate-950 p-4 text-white">
                      <span className="text-[9px] font-black uppercase tracking-wide text-white/40">
                        {isArabic
                          ? 'الإجمالي'
                          : 'Total'}
                      </span>

                      <span
                        dir="ltr"
                        className="text-lg font-black"
                      >
                        {
                          totalLabel
                        }
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={
                        handleSubmitOrder
                      }
                      disabled={
                        !canConfirmPayment
                      }
                      className="flex h-12 w-full items-center justify-center rounded-[14px] bg-blue-600 px-4 text-xs font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      {isSubmitting
                        ? isArabic
                          ? 'جارٍ إرسال الطلب...'
                          : 'Envoi en cours...'
                        : isArabic
                          ? 'تأكيد الدفع وإرسال الطلب'
                          : 'Confirmer le paiement'}
                    </button>

                    <p className="text-center text-[8px] leading-4 text-slate-400">
                      {isArabic
                        ? 'بعد الإرسال سيتم توجيهك إلى صفحة متابعة الطلب.'
                        : 'Après validation, vous serez redirigé vers le suivi de votre commande.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
                    {isArabic
                      ? 'طريقة التسليم'
                      : 'Méthode de livraison'}
                  </p>

                  <p className="mt-1 text-[9px] leading-4 text-slate-400">
                    {
                      fulfillmentLabel
                    }
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}

export default DigitalCheckoutPage