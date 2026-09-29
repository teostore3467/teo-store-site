import {
  useCallback,
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

type PaymentMethod = {
  id: string
  code: string
  name: string
  payment_number: string
  image_path: string | null
  instructions_fr: string | null
  instructions_ar: string | null
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

const PAYMENT_PROOFS_BUCKET =
  'payment-proofs'

const PAYMENT_METHODS_BUCKET =
  'payment-methods'

const MAX_PAYMENT_PROOF_SIZE =
  5 * 1024 * 1024

function getPaymentProofExtension(
  file: File,
) {
  if (
    file.type ===
    'image/png'
  ) {
    return 'png'
  }

  if (
    file.type ===
      'image/jpeg' ||
    file.type ===
      'image/jpg'
  ) {
    return 'jpg'
  }

  if (
    file.type ===
    'image/webp'
  ) {
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

  return (
    extension ||
    'jpg'
  )
}

function createProofReference() {
  return `TEO-${Math.floor(
    100000 +
      Math.random() *
        900000,
  )}`
}

function DigitalCheckoutPage() {
  const {
    productSlug,
  } =
    useParams()

  const [
    searchParams,
  ] =
    useSearchParams()

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

  const [
    authChecking,
    setAuthChecking,
  ] =
    useState(
      true,
    )

  const [
    authenticatedUserId,
    setAuthenticatedUserId,
  ] =
    useState<
      string | null
    >(
      null,
    )

  const [
    customerName,
    setCustomerName,
  ] =
    useState(
      '',
    )

  const [
    customerPhone,
    setCustomerPhone,
  ] =
    useState(
      '',
    )

  const [
    customerValues,
    setCustomerValues,
  ] =
    useState<
      Record<
        string,
        | string
        | boolean
      >
    >(
      {},
    )

  const [
    paymentMethods,
    setPaymentMethods,
  ] =
    useState<
      PaymentMethod[]
    >(
      [],
    )

  const [
    paymentMethodsLoading,
    setPaymentMethodsLoading,
  ] =
    useState(
      true,
    )

  const [
    selectedPaymentCode,
    setSelectedPaymentCode,
  ] =
    useState(
      '',
    )

  const [
    paymentProofFile,
    setPaymentProofFile,
  ] =
    useState<
      File | null
    >(
      null,
    )

  const [
    paymentProofName,
    setPaymentProofName,
  ] =
    useState(
      '',
    )

  const [
    paymentSenderNumber,
    setPaymentSenderNumber,
  ] =
    useState(
      '',
    )

  const [
    paymentNumberCopied,
    setPaymentNumberCopied,
  ] =
    useState(
      false,
    )

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(
      false,
    )

  const [
    submissionError,
    setSubmissionError,
  ] =
    useState<
      string | null
    >(
      null,
    )

  const groupId =
    searchParams.get(
      'groupId',
    )

  const planId =
    searchParams.get(
      'planId',
    )

  const [
    service,
    setService,
  ] =
    useState<
      ServiceCatalogItem | null
    >(
      null,
    )

  const [
    catalogLoading,
    setCatalogLoading,
  ] =
    useState(
      true,
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
            .select(`
              id,
              code,
              name,
              payment_number,
              image_path,
              instructions_fr,
              instructions_ar,
              is_active,
              sort_order,
              created_at,
              updated_at
            `)
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

        if (
          error
        ) {
          console.error(
            'Unable to load payment methods:',
            error,
          )

          setPaymentMethods(
            [],
          )

          setPaymentMethodsLoading(
            false,
          )

          return
        }

        const methods =
          (
            data ??
            []
          ) as PaymentMethod[]

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

            const stillExists =
              methods.some(
                (
                  method,
                ) =>
                  method.code ===
                  current,
              )

            return stillExists
              ? current
              : ''
          },
        )

        setPaymentMethodsLoading(
          false,
        )
      },
      [],
    )

  useEffect(
    () => {
      void loadPaymentMethods()

      const channel =
        supabase
          .channel(
            `digital-checkout-payment-methods-${Date.now()}`,
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

  const getPaymentMethodImageUrl =
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

  const selectedGroup =
    useMemo(
      () => {
        if (
          !service
        ) {
          return null
        }

        return (
          service.groups.find(
            (
              group,
            ) =>
              group.id ===
              groupId,
          ) ??
          null
        )
      },
      [
        service,
        groupId,
      ],
    )

  const selectedPlan =
    useMemo(
      () => {
        if (
          !selectedGroup
        ) {
          return null
        }

        return (
          selectedGroup.plans.find(
            (
              plan,
            ) =>
              plan.id ===
              planId,
          ) ??
          null
        )
      },
      [
        selectedGroup,
        planId,
      ],
    )

  const selectedPayment =
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
              method.is_active,
          ) ??
          null
        )
      },
      [
        paymentMethods,
        selectedPaymentCode,
      ],
    )

  useEffect(
    () => {
      let active =
        true

      const loadService =
        async () => {
          setCatalogLoading(
            true,
          )

          if (
            !productSlug
          ) {
            if (
              active
            ) {
              setService(
                null,
              )

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

            if (
              active
            ) {
              setService(
                nextService,
              )
            }
          } catch (
            error
          ) {
            console.error(
              'Unable to load checkout service:',
              error,
            )

            if (
              active
            ) {
              setService(
                null,
              )
            }
          } finally {
            if (
              active
            ) {
              setCatalogLoading(
                false,
              )
            }
          }
        }

      void loadService()

      return () => {
        active =
          false
      }
    },
    [
      productSlug,
    ],
  )

  useEffect(
    () => {
      let active =
        true

      const checkAuthentication =
        async () => {
          setAuthChecking(
            true,
          )

          const {
            data,
            error,
          } =
            await supabase.auth
              .getUser()

          if (
            !active
          ) {
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
                replace:
                  true,
              },
            )

            return
          }

          setAuthenticatedUserId(
            data.user.id,
          )

          const metadataName =
            data.user
              .user_metadata
              ?.full_name

          if (
            typeof metadataName ===
              'string' &&
            metadataName
              .trim()
              .length >
              0
          ) {
            setCustomerName(
              (
                current,
              ) =>
                current ||
                metadataName.trim(),
            )
          }

          const authPhone =
            typeof data.user
              .phone ===
              'string'
              ? data.user.phone
              : ''

          const metadataPhone =
            typeof data.user
              .user_metadata
              ?.phone ===
              'string'
              ? data.user
                  .user_metadata
                  .phone
              : ''

          const resolvedPhone =
            authPhone
              .trim() ||
            metadataPhone
              .trim()

          if (
            resolvedPhone
          ) {
            setCustomerPhone(
              (
                current,
              ) =>
                current ||
                resolvedPhone,
            )
          }

          setAuthChecking(
            false,
          )
        }

      void checkAuthentication()

      return () => {
        active =
          false
      }
    },
    [
      location.pathname,
      location.search,
      navigate,
    ],
  )

  useEffect(
    () => {
      window.scrollTo({
        top:
          0,

        left:
          0,

        behavior:
          'instant',
      })
    },
    [
      productSlug,
      groupId,
      planId,
    ],
  )

  useEffect(
    () => {
      setCustomerValues(
        {},
      )

      setSelectedPaymentCode(
        '',
      )

      setPaymentProofFile(
        null,
      )

      setPaymentProofName(
        '',
      )

      setPaymentSenderNumber(
        '',
      )

      setPaymentNumberCopied(
        false,
      )

      setIsSubmitting(
        false,
      )

      setSubmissionError(
        null,
      )
    },
    [
      productSlug,
      groupId,
      planId,
    ],
  )

  const handleCustomerValueChange =
    (
      fieldId:
        string,

      value:
        | string
        | boolean,
    ) => {
      setCustomerValues(
        (
          current,
        ) => ({
          ...current,

          [fieldId]:
            value,
        }),
      )

      setSubmissionError(
        null,
      )
    }

  const handlePaymentProofChange =
    (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target
          .files?.[0]

      setSubmissionError(
        null,
      )

      if (
        !file
      ) {
        setPaymentProofFile(
          null,
        )

        setPaymentProofName(
          '',
        )

        return
      }

      const allowedTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
      ]

      if (
        !allowedTypes.includes(
          file.type,
        )
      ) {
        setPaymentProofFile(
          null,
        )

        setPaymentProofName(
          '',
        )

        setSubmissionError(
          isArabic
            ? 'يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP.'
            : 'Veuillez choisir une image JPG, PNG ou WEBP.',
        )

        event.target.value =
          ''

        return
      }

      if (
        file.size >
        MAX_PAYMENT_PROOF_SIZE
      ) {
        setPaymentProofFile(
          null,
        )

        setPaymentProofName(
          '',
        )

        setSubmissionError(
          isArabic
            ? 'يجب ألا يتجاوز حجم صورة إثبات الدفع 5 MB.'
            : 'La preuve de paiement ne doit pas dépasser 5 MB.',
        )

        event.target.value =
          ''

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
      if (
        !selectedPayment
      ) {
        return
      }

      const value =
        selectedPayment.payment_number

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

          document.body
            .appendChild(
              textarea,
            )

          textarea.focus()

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

  if (
    !authenticatedUserId
  ) {
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
      selectedGroup
        .fulfillment.type,
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
    selectedGroup
      .fulfillment
      .customerFields
      .map(
        (
          field,
        ) =>
          getLocalizedCustomerField(
            service.slug,
            selectedGroup.id,
            field,
            language,
          ),
      )

  const fulfillmentType =
    selectedGroup
      .fulfillment.type

  const serviceLetter =
    service.name
      .trim()
      .charAt(
        0,
      )
      .toUpperCase() ||
    'T'

  const formatPrice =
    (
      price:
        number,

      currency:
        'MRU',
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
          Number(
            price,
          ),
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
    customerName
      .trim()
      .length >
      0 &&
    customerPhone
      .trim()
      .length >
      0

  const areRequiredCustomerFieldsComplete =
    selectedGroup
      .fulfillment
      .customerFields
      .every(
        (
          field,
        ) => {
          const value =
            customerValues[
              field.id
            ]

          if (
            !field.required
          ) {
            return true
          }

          if (
            field.type ===
            'checkbox'
          ) {
            return (
              value ===
              true
            )
          }

          return (
            typeof value ===
              'string' &&
            value
              .trim()
              .length >
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

  const getPaymentDescription =
    (
      method:
        PaymentMethod,
    ) => {
      const instructions =
        isArabic
          ? method.instructions_ar
          : method.instructions_fr

      if (
        instructions &&
        instructions
          .trim()
          .length >
          0
      ) {
        return instructions
      }

      if (
        isArabic
      ) {
        return `قم بتحويل مبلغ الطلب من تطبيق ${method.name} إلى رقم TEO STORE ثم ارفع إثبات الدفع.`
      }

      return `Effectuez le transfert depuis ${method.name} vers le numéro TEO STORE puis ajoutez votre preuve de paiement.`
    }

  const paymentSteps =
    selectedPayment
      ? isArabic
        ? [
            `افتح تطبيق ${selectedPayment.name} على هاتفك.`,
            'سجّل الدخول إلى حسابك.',
            'اختر التحويل أو إرسال الأموال.',
            `أدخل رقم المستفيد الخاص بـ TEO STORE: ${selectedPayment.payment_number}.`,
            `أدخل مبلغ الطلب بالضبط: ${totalLabel}.`,
            'راجع رقم المستفيد والمبلغ جيدًا ثم أكد التحويل.',
            'بعد نجاح العملية، التقط Screenshot واضحة لإثبات الدفع.',
            'ارجع إلى TEO STORE، أدخل الرقم الذي دفعت منه، ارفع الصورة ثم أكد الطلب.',
          ]
        : [
            `Ouvrez l’application ${selectedPayment.name} sur votre téléphone.`,
            'Connectez-vous à votre compte.',
            'Choisissez le transfert ou l’envoi d’argent.',
            `Saisissez le numéro bénéficiaire TEO STORE : ${selectedPayment.payment_number}.`,
            `Saisissez exactement le montant : ${totalLabel}.`,
            'Vérifiez soigneusement le numéro et le montant puis confirmez le transfert.',
            'Après le paiement, faites une capture d’écran claire de la transaction.',
            'Revenez sur TEO STORE, indiquez le numéro utilisé, ajoutez la capture puis confirmez la commande.',
          ]
      : []

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
        string | null =
        null

      try {
        const {
          data:
            userData,

          error:
            userError,
        } =
          await supabase.auth
            .getUser()

        if (
          userError
        ) {
          throw userError
        }

        const user =
          userData.user

        if (
          !user
        ) {
          const redirectPath =
            `${location.pathname}${location.search}`

          navigate(
            `/connexion?redirect=${encodeURIComponent(
              redirectPath,
            )}`,
            {
              replace:
                true,
            },
          )

          return
        }

        /*
         * Revalidate the selected payment method immediately
         * before uploading the proof / creating the order.
         *
         * This prevents using a payment method that an admin
         * disabled while the checkout page was already open.
         */
        const {
          data:
            authoritativePayment,

          error:
            authoritativePaymentError,
        } =
          await supabase
            .from(
              'payment_methods',
            )
            .select(`
              id,
              code,
              name,
              payment_number,
              image_path,
              instructions_fr,
              instructions_ar,
              is_active,
              sort_order
            `)
            .eq(
              'code',
              selectedPayment.code,
            )
            .eq(
              'is_active',
              true,
            )
            .maybeSingle()

        if (
          authoritativePaymentError
        ) {
          throw authoritativePaymentError
        }

        if (
          !authoritativePayment
        ) {
          await loadPaymentMethods()

          throw new Error(
            isArabic
              ? 'وسيلة الدفع المختارة لم تعد متاحة. اختر وسيلة أخرى.'
              : 'Ce moyen de paiement n’est plus disponible. Choisissez-en un autre.',
          )
        }

        const proofReference =
          createProofReference()

        const extension =
          getPaymentProofExtension(
            paymentProofFile,
          )

        const proofFilePath =
          `${user.id}/${proofReference}-${Date.now()}.${extension}`

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

                upsert:
                  false,

                contentType:
                  paymentProofFile.type,
              },
            )

        if (
          proofUploadError
        ) {
          throw proofUploadError
        }

        uploadedProofPath =
          proofFilePath

        const emailField =
          selectedGroup
            .fulfillment
            .customerFields
            .find(
              (
                field,
              ) =>
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
            ? emailValue
                .trim()
            : user.email ??
              ''

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
                customerEmail,

              p_customer_values: {
                ...customerValues,
              },

              p_payment_method:
                authoritativePayment.code,

              p_payment_sender_number:
                paymentSenderNumber.trim(),

              p_payment_proof_path:
                proofFilePath,
            },
          )

        if (
          orderRpcError
        ) {
          throw orderRpcError
        }

        const createdOrder =
          Array.isArray(
            orderRpcData,
          )
            ? orderRpcData[
                0
              ]
            : orderRpcData

        const createdOrderNumber =
          typeof createdOrder
            ?.order_number ===
          'string'
            ? createdOrder
                .order_number
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

        uploadedProofPath =
          null

        navigate(
          `/commande/${createdOrderNumber}`,
          {
            replace:
              true,
          },
        )
      } catch (
        error
      ) {
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

          if (
            rollbackError
          ) {
            console.warn(
              'Unable to remove payment proof after order failure:',
              rollbackError,
            )
          }
        }

        const message =
          error instanceof
          Error
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
              (
                field,
              ) => {
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
                          ] ===
                          true
                        }
                        onChange={(
                          event,
                        ) =>
                          handleCustomerValueChange(
                            field.id,
                            event.target.checked,
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
                          ? customerValues[
                              field.id
                            ] as string
                          : ''
                      }
                      onChange={(
                        event,
                      ) =>
                        handleCustomerValueChange(
                          field.id,
                          event.target.value,
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
                : 'IDENTIFIANTS APRÈS PAIEMENT'}
            </p>

            <p className="mt-2 text-[10px] leading-5 text-slate-600 sm:text-xs">
              {isArabic
                ? 'بعد تأكيد الدفع، سيرسل لك TEO STORE معلومات الحساب الخاصة بالخدمة.'
                : 'Après confirmation du paiement, TEO STORE vous transmettra les informations de votre compte.'}
            </p>
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
                ? 'بعد تأكيد الدفع، سيرسل لك TEO STORE الكود أو المفتاح الرقمي مع التعليمات.'
                : 'Après confirmation du paiement, TEO STORE vous transmettra votre code ou clé numérique avec les instructions.'}
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
                ? 'بعد تأكيد الدفع، سيتم تجهيز رابط التفعيل حسب الخطة.'
                : "Après confirmation du paiement, votre lien d'activation sera préparé selon la formule."}
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
                ? 'بعد الدفع، سيتحقق TEO STORE من Player ID قبل تنفيذ الشحن.'
                : 'Après paiement, TEO STORE vérifiera votre Player ID avant la recharge.'}
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

            <span>
              /
            </span>

            <Link
              to={`/services-numeriques/${service.slug}`}
              className="truncate transition hover:text-blue-600"
            >
              {
                localizedServiceName
              }
            </Link>

            <span>
              /
            </span>

            <span className="shrink-0 text-slate-700">
              {isArabic
                ? 'الطلب'
                : 'Commande'}
            </span>
          </div>
        </Container>
      </section>

      <section className="py-5 sm:py-9 lg:py-12">
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
                  ? 'أدخل معلوماتك، ادفع من تطبيقك، ثم ارفع إثبات الدفع.'
                  : 'Renseignez vos informations, payez depuis votre application puis ajoutez votre preuve de paiement.'}
              </p>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
              <div className="space-y-4">
                <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
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
                        }
                        {' · '}
                        {
                          localizedPlanLabel
                        }
                      </p>
                    </div>

                    <p
                      dir="ltr"
                      className="ms-auto shrink-0 text-sm font-black text-blue-600"
                    >
                      {
                        totalLabel
                      }
                    </p>
                  </div>
                </section>

                <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-black text-white">
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
                          ? 'بيانات التواصل'
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

                        <span className="text-red-500">
                          {' *'}
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
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-950 outline-none focus:border-blue-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[9px] font-black text-slate-600">
                        {isArabic
                          ? 'الهاتف'
                          : 'Téléphone'}

                        <span className="text-red-500">
                          {' *'}
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
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-left text-xs font-semibold text-slate-950 outline-none focus:border-blue-500"
                      />
                    </label>
                  </div>
                </section>

                <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white">
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

                <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white">
                      3
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-sm font-black text-slate-950 sm:text-base">
                        {isArabic
                          ? 'الدفع'
                          : 'Paiement'}
                      </h2>

                      <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">
                        {isArabic
                          ? 'اختر تطبيق الدفع واتبع الخطوات'
                          : 'Choisissez votre application et suivez les étapes'}
                      </p>
                    </div>
                  </div>

                  {paymentMethodsLoading ? (
                    <div className="mt-5 flex min-h-[120px] items-center justify-center rounded-[18px] bg-slate-50">
                      <div className="text-center">
                        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                        <p className="mt-3 text-[9px] font-bold text-slate-400">
                          {isArabic
                            ? 'جارٍ تحميل وسائل الدفع...'
                            : 'Chargement des moyens de paiement...'}
                        </p>
                      </div>
                    </div>
                  ) : paymentMethods.length >
                    0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {paymentMethods.map(
                        (
                          method,
                        ) => {
                          const isSelected =
                            selectedPaymentCode ===
                            method.code

                          const imageUrl =
                            getPaymentMethodImageUrl(
                              method.image_path,
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

                                setPaymentNumberCopied(
                                  false,
                                )

                                setSubmissionError(
                                  null,
                                )
                              }}
                              className={[
                                'relative min-w-0 overflow-hidden rounded-[18px] border p-3 text-center transition',

                                isSelected
                                  ? 'border-2 border-blue-600 bg-blue-50 shadow-[0_8px_24px_rgba(37,99,235,0.12)]'
                                  : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50',
                              ].join(
                                ' ',
                              )}
                            >
                              {isSelected && (
                                <span className="absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white">
                                  ✓
                                </span>
                              )}

                              <div
                                className={[
                                  'mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-[17px] border',

                                  isSelected
                                    ? 'border-blue-100 bg-white'
                                    : 'border-slate-100 bg-slate-50',
                                ].join(
                                  ' ',
                                )}
                              >
                                {imageUrl ? (
                                  <img
                                    src={
                                      imageUrl
                                    }
                                    alt={
                                      method.name
                                    }
                                    className="h-full w-full object-contain p-1.5"
                                  />
                                ) : (
                                  <span
                                    className={[
                                      'text-base font-black',

                                      isSelected
                                        ? 'text-blue-600'
                                        : 'text-slate-700',
                                    ].join(
                                      ' ',
                                    )}
                                  >
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
                                  'mt-3 truncate text-xs font-black',

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

                              {isSelected && (
                                <p className="mt-1 text-[8px] font-black text-blue-500">
                                  {isArabic
                                    ? 'تم الاختيار'
                                    : 'Sélectionné'}
                                </p>
                              )}
                            </button>
                          )
                        },
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-center">
                      <p className="text-[10px] font-bold leading-5 text-amber-700">
                        {isArabic
                          ? 'لا توجد وسيلة دفع متاحة حاليًا.'
                          : "Aucun moyen de paiement n'est disponible actuellement."}
                      </p>
                    </div>
                  )}

                  {selectedPayment && (
                    <div className="mt-5 space-y-4">
                      <div className="overflow-hidden rounded-[22px] bg-slate-950 text-white shadow-[0_14px_38px_rgba(15,23,42,0.18)]">
                        <div className="p-4 sm:p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-white">
                              {getPaymentMethodImageUrl(
                                selectedPayment.image_path,
                              ) ? (
                                <img
                                  src={
                                    getPaymentMethodImageUrl(
                                      selectedPayment.image_path,
                                    ) ??
                                    ''
                                  }
                                  alt={
                                    selectedPayment.name
                                  }
                                  className="h-full w-full object-contain p-1.5"
                                />
                              ) : (
                                <span className="text-sm font-black text-slate-950">
                                  {selectedPayment.name
                                    .slice(
                                      0,
                                      2,
                                    )
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/40">
                                {isArabic
                                  ? 'طريقة الدفع'
                                  : 'Paiement via'}
                              </p>

                              <p className="mt-1 truncate text-base font-black">
                                {
                                  selectedPayment.name
                                }
                              </p>
                            </div>
                          </div>

                          <p className="mt-4 text-[10px] leading-5 text-white/60 sm:text-xs">
                            {getPaymentDescription(
                              selectedPayment,
                            )}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 border-t border-white/10 sm:grid-cols-2">
                          <div className="border-b border-white/10 p-4 sm:border-b-0 sm:border-e">
                            <p className="text-[8px] font-black uppercase tracking-wide text-white/35">
                              {isArabic
                                ? 'المبلغ المطلوب'
                                : 'Montant à envoyer'}
                            </p>

                            <p
                              dir="ltr"
                              className="mt-2 break-words text-left text-xl font-black"
                            >
                              {
                                totalLabel
                              }
                            </p>
                          </div>

                          <div className="p-4">
                            <p className="text-[8px] font-black uppercase tracking-wide text-white/35">
                              {isArabic
                                ? 'رقم المستفيد'
                                : 'Numéro bénéficiaire'}
                            </p>

                            <p
                              dir="ltr"
                              className="mt-2 break-all text-left text-xl font-black tracking-wide"
                            >
                              {
                                selectedPayment.payment_number
                              }
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-white/10 p-3">
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopyPaymentNumber()
                            }
                            className={[
                              'flex h-11 w-full items-center justify-center rounded-[12px] text-xs font-black transition',

                              paymentNumberCopied
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white text-slate-950 hover:bg-slate-100',
                            ].join(
                              ' ',
                            )}
                          >
                            {paymentNumberCopied
                              ? isArabic
                                ? 'تم نسخ الرقم ✓'
                                : 'Numéro copié ✓'
                              : isArabic
                                ? 'نسخ رقم المستفيد'
                                : 'Copier le numéro'}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-blue-100 bg-blue-50/50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-blue-600 text-sm font-black text-white">
                            ?
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-slate-950">
                              {isArabic
                                ? 'كيف أدفع؟'
                                : 'Comment payer ?'}
                            </h3>

                            <p className="mt-0.5 truncate text-[9px] text-slate-400">
                              {isArabic
                                ? `خطوات الدفع عبر ${selectedPayment.name}`
                                : `Étapes de paiement avec ${selectedPayment.name}`}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          {paymentSteps.map(
                            (
                              step,
                              index,
                            ) => (
                              <div
                                key={
                                  `${selectedPayment.code}-${index}`
                                }
                                className="flex items-start gap-3"
                              >
                                <div
                                  dir="ltr"
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-blue-600 shadow-sm ring-1 ring-blue-100"
                                >
                                  {
                                    index +
                                    1
                                  }
                                </div>

                                <p className="pt-1 text-[10px] font-semibold leading-5 text-slate-600 sm:text-xs">
                                  {
                                    step
                                  }
                                </p>
                              </div>
                            ),
                          )}
                        </div>

                        <div className="mt-4 rounded-[14px] border border-amber-200 bg-amber-50 p-3">
                          <p className="text-[9px] font-bold leading-5 text-amber-800">
                            {isArabic
                              ? 'تأكد من رقم المستفيد والمبلغ قبل تأكيد التحويل. لا ترسل مبلغًا إلى رقم آخر.'
                              : 'Vérifiez le numéro du bénéficiaire et le montant avant de confirmer. N’envoyez pas le paiement vers un autre numéro.'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                        <label className="block">
                          <span className="text-[10px] font-black text-slate-800">
                            {isArabic
                              ? 'الرقم الذي دفعت منه'
                              : 'Numéro utilisé pour payer'}

                            <span className="text-red-500">
                              {' *'}
                            </span>
                          </span>

                          <p className="mt-1 text-[9px] leading-4 text-slate-400">
                            {isArabic
                              ? `أدخل رقم حساب ${selectedPayment.name} الذي أرسلت منه المبلغ.`
                              : `Indiquez le numéro du compte ${selectedPayment.name} utilisé pour envoyer le paiement.`}
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
                            className="mt-2 h-12 w-full rounded-[13px] border border-slate-200 bg-white px-3 text-left text-sm font-bold text-slate-950 outline-none focus:border-blue-500"
                          />
                        </label>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-slate-800">
                          {isArabic
                            ? 'إثبات الدفع'
                            : 'Preuve de paiement'}

                          <span className="text-red-500">
                            {' *'}
                          </span>
                        </p>

                        <p className="mt-1 text-[9px] leading-4 text-slate-400">
                          {isArabic
                            ? 'بعد نجاح الدفع، ارفع Screenshot واضحة تظهر عملية التحويل.'
                            : 'Après le paiement, ajoutez une capture d’écran claire de la transaction.'}
                        </p>

                        <label
                          className={[
                            'mt-3 flex min-h-[130px] cursor-pointer items-center justify-center rounded-[18px] border border-dashed p-4 text-center transition',

                            paymentProofFile
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40',
                          ].join(
                            ' ',
                          )}
                        >
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={
                              handlePaymentProofChange
                            }
                            className="hidden"
                          />

                          <div className="min-w-0">
                            <div
                              className={[
                                'mx-auto flex h-11 w-11 items-center justify-center rounded-[14px] text-lg font-black shadow-sm',

                                paymentProofFile
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-white text-blue-600',
                              ].join(
                                ' ',
                              )}
                            >
                              {paymentProofFile
                                ? '✓'
                                : '↑'}
                            </div>

                            <p className="mt-3 max-w-[280px] truncate text-[10px] font-black text-slate-700 sm:text-xs">
                              {paymentProofName ||
                                (
                                  isArabic
                                    ? 'اضغط لاختيار Screenshot الدفع'
                                    : 'Appuyez pour choisir la capture du paiement'
                                )}
                            </p>

                            <p className="mt-1 text-[8px] text-slate-400">
                              JPG · PNG · WEBP · 5 MB max
                            </p>
                          </div>
                        </label>
                      </div>
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
                      }

                      {' · '}

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
                          ? 'الخطة'
                          : 'Formule'}
                      </span>

                      <span className="text-right text-[9px] font-black text-slate-700">
                        {
                          localizedPlanLabel
                        }
                      </span>
                    </div>

                    {selectedPayment && (
                      <div className="flex items-center gap-3 rounded-[14px] bg-emerald-50 p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-white">
                          {getPaymentMethodImageUrl(
                            selectedPayment.image_path,
                          ) ? (
                            <img
                              src={
                                getPaymentMethodImageUrl(
                                  selectedPayment.image_path,
                                ) ??
                                ''
                              }
                              alt={
                                selectedPayment.name
                              }
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-[9px] font-black text-emerald-700">
                              {selectedPayment.name
                                .slice(
                                  0,
                                  2,
                                )
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-bold text-emerald-600">
                            {isArabic
                              ? 'طريقة الدفع'
                              : 'Paiement'}
                          </p>

                          <p className="mt-0.5 truncate text-[10px] font-black text-emerald-800">
                            {
                              selectedPayment.name
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4 rounded-[14px] bg-slate-950 p-4 text-white">
                      <span className="text-[9px] font-black uppercase tracking-wide text-white/40">
                        {isArabic
                          ? 'المبلغ المطلوب'
                          : 'Montant à payer'}
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
                      onClick={() =>
                        void handleSubmitOrder()
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

                    {!canConfirmPayment &&
                      !isSubmitting && (
                        <p className="text-center text-[8px] leading-4 text-slate-400">
                          {isArabic
                            ? 'أكمل المعلومات واختر طريقة الدفع وارفع الإثبات لتفعيل الزر.'
                            : 'Complétez les informations, choisissez un moyen de paiement et ajoutez la preuve.'}
                        </p>
                      )}

                    {canConfirmPayment && (
                      <p className="text-center text-[8px] font-bold leading-4 text-emerald-600">
                        {isArabic
                          ? 'كل شيء جاهز لإرسال الطلب ✓'
                          : 'Tout est prêt pour envoyer la commande ✓'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
                    {isArabic
                      ? 'بعد إرسال الطلب'
                      : 'Après la commande'}
                  </p>

                  <p className="mt-2 text-[9px] leading-5 text-slate-500">
                    {isArabic
                      ? 'سيظهر طلبك في حسابك وستتمكن من متابعة التحقق من الدفع وتجهيز الخدمة والتسليم داخل TEO STORE.'
                      : 'Votre commande apparaîtra dans votre compte. Vous pourrez suivre la vérification du paiement, le traitement et la livraison directement dans TEO STORE.'}
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