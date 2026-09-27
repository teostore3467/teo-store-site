import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import Container from '../../../components/layout/Container'
import {
  useLanguage,
} from '../../../i18n/LanguageContext'
import {
  supabase,
} from '../../../lib/supabase'

import {
  getEsimCountryBySlug,
} from '../data/esimCatalog'

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

type PriceValue =
  | string
  | number

const COUNTRY_IMAGES_BUCKET =
  'esim-country-images'

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

function EsimCountryPage() {
  const {
    countrySlug,
  } =
    useParams()

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

  const [
    countrySetting,
    setCountrySetting,
  ] =
    useState<
      CountrySettingRow | null
    >(null)

  const [
    planSettings,
    setPlanSettings,
  ] =
    useState<
      Record<
        string,
        PlanSettingRow
      >
    >({})

  const [
    isSettingsLoading,
    setIsSettingsLoading,
  ] =
    useState(true)

  const [
    settingsError,
    setSettingsError,
  ] =
    useState<
      string | null
    >(null)

  const loadSettings =
    useCallback(
      async () => {
        if (
          !country?.slug
        ) {
          return
        }

        setIsSettingsLoading(
          true,
        )

        setSettingsError(
          null,
        )

        const [
          countryResult,
          plansResult,
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
              ),
          ])

        if (
          countryResult.error ||
          plansResult.error
        ) {
          const message =
            countryResult.error
              ?.message ??
            plansResult.error
              ?.message ??
            'Erreur inconnue'

          console.error(
            'Unable to load eSIM public settings:',
            message,
          )

          setSettingsError(
            message,
          )

          setIsSettingsLoading(
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

        const nextPlans:
          Record<
            string,
            PlanSettingRow
          > = {}

        ;(
          plansResult.data ??
          []
        ).forEach(
          (
            row,
          ) => {
            const setting =
              row as PlanSettingRow

            nextPlans[
              setting.plan_id
            ] =
              setting
          },
        )

        setPlanSettings(
          nextPlans,
        )

        setIsSettingsLoading(
          false,
        )
      },
      [
        country?.slug,
      ],
    )

  useEffect(() => {
    void loadSettings()

    if (
      !country?.slug
    ) {
      return
    }

    const channel =
      supabase
        .channel(
          `public-esim-${country.slug}-${Date.now()}`,
        )
        .on(
          'postgres_changes',
          {
            event:
              '*',

            schema:
              'public',

            table:
              'esim_country_settings',

            filter:
              `country_slug=eq.${country.slug}`,
          },
          () => {
            void loadSettings()
          },
        )
        .on(
          'postgres_changes',
          {
            event:
              '*',

            schema:
              'public',

            table:
              'esim_plan_settings',

            filter:
              `country_slug=eq.${country.slug}`,
          },
          () => {
            void loadSettings()
          },
        )
        .subscribe()

    return () => {
      void supabase.removeChannel(
        channel,
      )
    }
  }, [
    country?.slug,
    loadSettings,
  ])

  const countryActive =
    countrySetting
      ?.active ??
    true

  const countryImageUrl =
    useMemo(
      () => {
        const path =
          countrySetting
            ?.image_path

        if (
          !path
        ) {
          return null
        }

        const {
          data,
        } =
          supabase.storage
            .from(
              COUNTRY_IMAGES_BUCKET,
            )
            .getPublicUrl(
              path,
            )

        return data.publicUrl
      },
      [
        countrySetting
          ?.image_path,
      ],
    )

  const effectivePlans =
    useMemo(
      () =>
        country.plans
          .map(
            (
              plan,
            ) => {
              const setting =
                planSettings[
                  plan.id
                ]

              const catalogPrice =
                parsePrice(
                  plan.price,
                )

              return {
                ...plan,

                price:
                  setting
                    ?.price ??
                  catalogPrice,

                popular:
                  setting
                    ?.popular ??
                  Boolean(
                    plan.popular,
                  ),

                active:
                  setting
                    ?.active ??
                  true,
              }
            },
          )
          .filter(
            (
              plan,
            ) =>
              plan.active,
          ),
      [
        country.plans,
        planSettings,
      ],
    )

  const limitedPlans =
    useMemo(
      () =>
        effectivePlans.filter(
          (
            plan,
          ) =>
            plan.type ===
            'limited',
        ),
      [
        effectivePlans,
      ],
    )

  const unlimitedPlans =
    useMemo(
      () =>
        effectivePlans.filter(
          (
            plan,
          ) =>
            plan.type ===
            'unlimited',
        ),
      [
        effectivePlans,
      ],
    )

  const defaultType:
    | 'limited'
    | 'unlimited' =
    limitedPlans.length >
    0
      ? 'limited'
      : 'unlimited'

  const [
    planType,
    setPlanType,
  ] =
    useState<
      | 'limited'
      | 'unlimited'
    >(
      defaultType,
    )

  const availablePlans =
    useMemo(
      () =>
        effectivePlans.filter(
          (
            plan,
          ) =>
            plan.type ===
            planType,
        ),
      [
        effectivePlans,
        planType,
      ],
    )

  const defaultPlan =
    availablePlans.find(
      (
        plan,
      ) =>
        plan.popular,
    ) ??
    availablePlans[0] ??
    effectivePlans[0]

  const [
    selectedPlanId,
    setSelectedPlanId,
  ] =
    useState(
      defaultPlan?.id ??
        '',
    )

  const selectedPlan =
    effectivePlans.find(
      (
        plan,
      ) =>
        plan.id ===
        selectedPlanId,
    ) ??
    defaultPlan

  useEffect(() => {
    if (
      effectivePlans.length ===
      0
    ) {
      setSelectedPlanId(
        '',
      )

      return
    }

    const currentTypePlans =
      effectivePlans.filter(
        (
          plan,
        ) =>
          plan.type ===
          planType,
      )

    if (
      currentTypePlans.length >
      0
    ) {
      const selectedStillExists =
        currentTypePlans.some(
          (
            plan,
          ) =>
            plan.id ===
            selectedPlanId,
        )

      if (
        selectedStillExists
      ) {
        return
      }

      const nextPlan =
        currentTypePlans.find(
          (
            plan,
          ) =>
            plan.popular,
        ) ??
        currentTypePlans[0]

      setSelectedPlanId(
        nextPlan?.id ??
          '',
      )

      return
    }

    const nextType:
      | 'limited'
      | 'unlimited' =
      limitedPlans.length >
      0
        ? 'limited'
        : 'unlimited'

    const nextPlans =
      nextType ===
      'limited'
        ? limitedPlans
        : unlimitedPlans

    const nextPlan =
      nextPlans.find(
        (
          plan,
        ) =>
          plan.popular,
      ) ??
      nextPlans[0]

    setPlanType(
      nextType,
    )

    setSelectedPlanId(
      nextPlan?.id ??
        '',
    )
  }, [
    effectivePlans,
    limitedPlans,
    unlimitedPlans,
    planType,
    selectedPlanId,
  ])

  const handlePlanTypeChange =
    (
      type:
        | 'limited'
        | 'unlimited',
    ) => {
      const plansOfType =
        effectivePlans.filter(
          (
            plan,
          ) =>
            plan.type ===
            type,
        )

      if (
        plansOfType.length ===
        0
      ) {
        return
      }

      setPlanType(
        type,
      )

      const nextPlan =
        plansOfType.find(
          (
            plan,
          ) =>
            plan.popular,
        ) ??
        plansOfType[0]

      setSelectedPlanId(
        nextPlan.id,
      )
    }

  const handleContinue =
    () => {
      if (
        !selectedPlan ||
        !countryActive
      ) {
        return
      }

      navigate(
        `/esim/${country.slug}/commande`,
        {
          state: {
            countrySlug:
              country.slug,

            countryName:
              country.name,

            countryFlag:
              country.flag,

            countryImage:
              countryImageUrl,

            planId:
              selectedPlan.id,

            planData:
              selectedPlan.data,

            planDuration:
              selectedPlan.duration,

            planPrice:
              selectedPlan.price,
          },
        },
      )
    }

  if (
    isSettingsLoading
  ) {
    return (
      <main className="min-h-screen bg-[#f6f8fc]">
        <Container className="flex min-h-[70vh] items-center justify-center py-10">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-xs font-black text-slate-500">
              {isArabic
                ? 'جاري تحميل باقات eSIM...'
                : 'Chargement des forfaits eSIM...'}
            </p>
          </div>
        </Container>
      </main>
    )
  }

  if (
    !countryActive
  ) {
    return (
      <main className="min-h-screen bg-[#f6f8fc]">
        <Container className="flex min-h-[75vh] items-center justify-center py-10">
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-amber-50 text-2xl">
              {
                country.flag
              }
            </div>

            <p className="mt-5 text-[9px] font-black uppercase tracking-[0.16em] text-amber-600">
              TEO STORE eSIM
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-950">
              {isArabic
                ? 'هذه الوجهة غير متوفرة حاليًا'
                : 'Cette destination est indisponible'}
            </h1>

            <p className="mt-3 text-[11px] leading-6 text-slate-500">
              {isArabic
                ? 'تم إيقاف بيع باقات eSIM لهذه الوجهة مؤقتًا.'
                : 'La vente des forfaits eSIM pour cette destination est temporairement désactivée.'}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/',
                )
              }
              className="mt-6 min-h-[48px] w-full rounded-[14px] bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-slate-800"
            >
              {isArabic
  ? 'العودة إلى الصفحة الرئيسية'
  : "Retour à l'accueil"}
            </button>
          </div>
        </Container>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f8fc]">
      <section className="border-b border-slate-200 bg-white">
        <Container className="py-3 sm:py-5">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-400 sm:text-xs">
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

            <span className="text-slate-700">
              {
                country.name[
                  language
                ]
              }
            </span>
          </div>
        </Container>
      </section>

      <section className="py-5 sm:py-9 lg:py-12">
        <Container>
          {settingsError && (
            <div className="mb-5 rounded-[18px] border border-amber-100 bg-amber-50 p-4">
              <p className="text-[10px] font-black text-amber-800">
                {isArabic
                  ? 'تعذر تحميل بعض إعدادات eSIM'
                  : 'Certaines configurations eSIM sont indisponibles'}
              </p>

              <p className="mt-1 text-[9px] leading-5 text-amber-600">
                {isArabic
                  ? 'سيتم استخدام إعدادات الكتالوج الأساسية.'
                  : 'Les valeurs du catalogue principal sont utilisées comme solution de secours.'}
              </p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-10">
            <div className="min-w-0">
              <div
                className="relative overflow-hidden rounded-[24px] text-white shadow-[0_20px_60px_rgba(15,23,42,0.13)]"
                style={{
                  background:
                    'linear-gradient(145deg,#050b18 0%,#0d1b3d 52%,#1d4ed8 100%)',
                }}
              >
                {countryImageUrl && (
                  <img
                    src={
                      countryImageUrl
                    }
                    alt={
                      country.name[
                        language
                      ]
                    }
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                <div
                  className={[
                    'absolute inset-0',
                    countryImageUrl
                      ? 'bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/20'
                      : '',
                  ].join(
                    ' ',
                  )}
                />

                <div className="relative p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/30 px-3 py-1.5 backdrop-blur-md">
                        <span className="text-base">
                          {
                            country.flag
                          }
                        </span>

                        <span
                          dir="ltr"
                          className="text-[9px] font-black uppercase tracking-[0.14em] text-white/70"
                        >
                          {
                            country.code
                          }
                        </span>
                      </div>

                      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">
                        TEO STORE eSIM
                      </p>

                      <h1 className="mt-2 text-[30px] font-black leading-[1.02] tracking-tight sm:text-4xl">
                        {
                          country.name[
                            language
                          ]
                        }

                        <span className="block text-blue-300">
                          eSIM
                        </span>
                      </h1>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/30 text-2xl backdrop-blur-md">
                      {
                        country.flag
                      }
                    </div>
                  </div>

                  <p className="mt-4 max-w-md text-[12px] leading-6 text-white/65 sm:text-sm">
                    {
                      country.description[
                        language
                      ]
                    }
                  </p>

                  <div className="mt-6 overflow-hidden rounded-[20px] border border-white/10 bg-slate-950/20 backdrop-blur-sm">
                    <div className="relative flex aspect-[16/9] items-end overflow-hidden p-4">
                      {countryImageUrl ? (
                        <>
                          <img
                            src={
                              countryImageUrl
                            }
                            alt={
                              country.name[
                                language
                              ]
                            }
                            className="absolute inset-0 h-full w-full object-cover"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                        </>
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              'linear-gradient(145deg,rgba(59,130,246,0.20),rgba(15,23,42,0.10))',
                          }}
                        />
                      )}

                      <div className="relative">
                        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/45">
                          {isArabic
                            ? 'الوجهة'
                            : 'DESTINATION'}
                        </p>

                        <p className="mt-1 text-xs font-black text-white">
                          {countryImageUrl
                            ? country.name[
                                language
                              ]
                            : country.imageLabel[
                                language
                              ]}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3 backdrop-blur">
                      <p className="text-[7px] font-black uppercase tracking-wide text-white/35">
                        {isArabic
                          ? 'الشبكة'
                          : 'Réseau'}
                      </p>

                      <p
                        dir="ltr"
                        className="mt-1 text-[10px] font-black text-white"
                      >
                        4G / 5G
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3 backdrop-blur">
                      <p className="text-[7px] font-black uppercase tracking-wide text-white/35">
                        {isArabic
                          ? 'التفعيل'
                          : 'Activation'}
                      </p>

                      <p className="mt-1 text-[10px] font-black text-white">
                        {isArabic
                          ? 'رقمي'
                          : 'Digitale'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3 backdrop-blur">
                      <p className="text-[7px] font-black uppercase tracking-wide text-white/35">
                        {isArabic
                          ? 'الدعم'
                          : 'Support'}
                      </p>

                      <p className="mt-1 text-[10px] font-black text-white">
                        {isArabic
                          ? 'متوفر'
                          : 'Disponible'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <span className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  {isArabic
                    ? 'eSIM متوفرة'
                    : 'eSIM disponible'}
                </span>
              </div>

              <h2 className="mt-4 text-[28px] font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-4xl">
                {isArabic
                  ? 'اختر باقتك'
                  : 'Choisissez votre forfait'}
              </h2>

              <p className="mt-2 max-w-xl text-[12px] leading-6 text-slate-500 sm:text-sm">
                {isArabic
                  ? 'اختر نوع الباقة وكمية البيانات والمدة المناسبة لرحلتك.'
                  : 'Sélectionnez le type de forfait, la quantité de données et la durée correspondant à votre voyage.'}
              </p>

              {effectivePlans.length >
              0 ? (
                <>
                  <div className="mt-6">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                      {isArabic
                        ? 'نوع الباقة'
                        : 'TYPE DE FORFAIT'}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
                      <button
                        type="button"
                        disabled={
                          limitedPlans.length ===
                          0
                        }
                        onClick={() =>
                          handlePlanTypeChange(
                            'limited',
                          )
                        }
                        className={[
                          'min-h-[46px] rounded-xl px-2 text-xs font-black transition sm:text-sm',
                          planType ===
                          'limited'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500',
                          limitedPlans.length ===
                          0
                            ? 'cursor-not-allowed opacity-40'
                            : '',
                        ].join(
                          ' ',
                        )}
                      >
                        {isArabic
                          ? 'بيانات'
                          : 'Données'}
                      </button>

                      <button
                        type="button"
                        disabled={
                          unlimitedPlans.length ===
                          0
                        }
                        onClick={() =>
                          handlePlanTypeChange(
                            'unlimited',
                          )
                        }
                        className={[
                          'min-h-[46px] rounded-xl px-2 text-xs font-black transition sm:text-sm',
                          planType ===
                          'unlimited'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500',
                          unlimitedPlans.length ===
                          0
                            ? 'cursor-not-allowed opacity-40'
                            : '',
                        ].join(
                          ' ',
                        )}
                      >
                        {isArabic
                          ? 'غير محدود'
                          : 'Illimité'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-end justify-between gap-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                        {isArabic
                          ? 'الباقات المتوفرة'
                          : 'FORFAITS DISPONIBLES'}
                      </p>

                      <p className="text-[9px] font-semibold text-slate-400">
                        {
                          availablePlans.length
                        }{' '}
                        {isArabic
                          ? 'خيار'
                          : `option${
                              availablePlans.length >
                              1
                                ? 's'
                                : ''
                            }`}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {availablePlans.map(
                        (
                          plan,
                        ) => {
                          const isSelected =
                            selectedPlan?.id ===
                            plan.id

                          return (
                            <button
                              key={
                                plan.id
                              }
                              type="button"
                              onClick={() =>
                                setSelectedPlanId(
                                  plan.id,
                                )
                              }
                              className={[
                                'relative min-h-[132px] min-w-0 rounded-[18px] border p-3 transition sm:min-h-[145px] sm:p-4',
                                isArabic
                                  ? 'text-right'
                                  : 'text-left',
                                isSelected
                                  ? 'border-blue-600 bg-blue-50 shadow-[0_10px_28px_rgba(37,99,235,0.10)]'
                                  : 'border-slate-200 bg-white hover:border-blue-200',
                              ].join(
                                ' ',
                              )}
                            >
                              {plan.popular && (
                                <span
                                  className={[
                                    'absolute top-2 rounded-full bg-violet-600 px-2 py-1 text-[6px] font-black uppercase tracking-wide text-white',
                                    isArabic
                                      ? 'left-2'
                                      : 'right-2',
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  {isArabic
                                    ? 'الأكثر طلبًا'
                                    : 'Populaire'}
                                </span>
                              )}

                              <p
                                dir="ltr"
                                className={[
                                  'break-words text-base font-black text-slate-950 sm:text-lg',
                                  isArabic
                                    ? 'text-right'
                                    : 'text-left',
                                ].join(
                                  ' ',
                                )}
                              >
                                {
                                  plan.data[
                                    language
                                  ]
                                }
                              </p>

                              <p className="mt-1 text-[9px] font-semibold text-slate-500">
                                {
                                  plan.duration[
                                    language
                                  ]
                                }
                              </p>

                              {plan.speed && (
                                <p
                                  dir={
                                    plan.speed.fr ===
                                    '4G / 5G'
                                      ? 'ltr'
                                      : undefined
                                  }
                                  className={[
                                    'mt-1 text-[8px] font-semibold text-slate-400',
                                    isArabic
                                      ? 'text-right'
                                      : 'text-left',
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  {
                                    plan.speed[
                                      language
                                    ]
                                  }
                                </p>
                              )}

                              <div className="mt-5 flex items-end justify-between gap-2">
                                <p
                                  className={[
                                    'break-words text-xs font-black sm:text-sm',
                                    isSelected
                                      ? 'text-blue-600'
                                      : 'text-slate-950',
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  {formatCurrencyText(
                                    String(
                                      plan.price,
                                    ),
                                  )}
                                </p>

                                <span
                                  className={[
                                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black',
                                    isSelected
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-100 text-slate-400',
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  ✓
                                </span>
                              </div>
                            </button>
                          )
                        },
                      )}
                    </div>
                  </div>

                  {selectedPlan && (
                    <div
                      className="mt-6 overflow-hidden rounded-[22px] p-4 text-white shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:p-5"
                      style={{
                        background:
                          'linear-gradient(135deg,#06101f 0%,#101d44 52%,#312e81 100%)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/35">
                            {isArabic
                              ? 'باقتك'
                              : 'VOTRE FORFAIT'}
                          </p>

                          <div className="mt-2 flex flex-wrap items-baseline gap-2">
                            <p
                              dir="ltr"
                              className="text-xl font-black"
                            >
                              {
                                selectedPlan.data[
                                  language
                                ]
                              }
                            </p>

                            <span className="text-[10px] font-semibold text-white/40">
                              {
                                selectedPlan.duration[
                                  language
                                ]
                              }
                            </span>
                          </div>

                          <p className="mt-1 text-[9px] font-semibold text-white/40">
                            {
                              country.name[
                                language
                              ]
                            }{' '}
                            eSIM
                          </p>
                        </div>

                        <div
                          className={[
                            'shrink-0',
                            isArabic
                              ? 'text-left'
                              : 'text-right',
                          ].join(
                            ' ',
                          )}
                        >
                          <p className="text-[8px] font-black uppercase tracking-wide text-white/35">
                            {isArabic
                              ? 'الإجمالي'
                              : 'Total'}
                          </p>

                          <p className="mt-1 text-lg font-black text-blue-300">
                            {formatCurrencyText(
                              String(
                                selectedPlan.price,
                              ),
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={
                          handleContinue
                        }
                        className="mt-5 flex min-h-[50px] w-full items-center justify-center rounded-[14px] bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-500"
                      >
                        {isArabic
                          ? 'متابعة'
                          : 'Continuer'}
                      </button>

                      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[8px] font-semibold text-white/35">
                        <span>
                          ✓{' '}
                          {isArabic
                            ? 'دفع آمن'
                            : 'Paiement sécurisé'}
                        </span>

                        <span>
                          ✓{' '}
                          {isArabic
                            ? 'توصيل رقمي'
                            : 'Livraison digitale'}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-6 rounded-[22px] border border-dashed border-slate-300 bg-white p-7 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-100 text-xl">
                    {
                      country.flag
                    }
                  </div>

                  <h3 className="mt-4 text-base font-black text-slate-800">
                    {isArabic
                      ? 'لا توجد باقات متوفرة حاليًا'
                      : 'Aucun forfait disponible'}
                  </h3>

                  <p className="mt-2 text-[10px] leading-5 text-slate-400">
                    {isArabic
                      ? 'تم تعطيل جميع الباقات لهذه الوجهة مؤقتًا.'
                      : 'Tous les forfaits de cette destination sont temporairement désactivés.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-2 sm:mt-10 sm:gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-600">
                1
              </div>

              <h3 className="mt-3 text-[10px] font-black text-slate-950 sm:text-sm">
                {isArabic
                  ? 'اختر'
                  : 'Choisissez'}
              </h3>

              <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">
                {isArabic
                  ? 'اختر الباقة المناسبة.'
                  : 'Sélectionnez votre forfait.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-600">
                2
              </div>

              <h3 className="mt-3 text-[10px] font-black text-slate-950 sm:text-sm">
                {isArabic
                  ? 'استلم'
                  : 'Recevez'}
              </h3>

              <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">
                {isArabic
                  ? 'استلم تفاصيل eSIM.'
                  : 'Recevez les détails eSIM.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-xs font-black text-violet-600">
                3
              </div>

              <h3 className="mt-3 text-[10px] font-black text-slate-950 sm:text-sm">
                {isArabic
                  ? 'فعّل'
                  : 'Activez'}
              </h3>

              <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">
                {isArabic
                  ? 'ثبّت eSIM ثم اتصل بالشبكة.'
                  : 'Installez puis connectez-vous.'}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10px] font-black text-amber-900 sm:text-xs">
              {isArabic
                ? 'تحقق من توافق جهازك'
                : 'Vérifiez la compatibilité de votre appareil'}
            </p>

            <p className="mt-1 text-[9px] leading-5 text-amber-700 sm:text-xs">
              {isArabic
                ? 'يجب أن يدعم هاتفك تقنية eSIM قبل الشراء.'
                : 'Votre téléphone doit prendre en charge la technologie eSIM avant l’achat.'}
            </p>
          </div>
        </Container>
      </section>
    </main>
  )
}

export default EsimCountryPage