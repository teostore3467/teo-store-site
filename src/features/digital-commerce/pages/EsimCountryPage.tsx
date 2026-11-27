import { useEffect, useState } from 'react'
import {
  useNavigate,
  useParams,
  useSearchParams
} from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'

import {
  useEsimCatalog,
  type LivePlan
} from '../data/useEsimCatalog'

import EsimGuide, {
  useEsimPublicSettings
} from '../components/EsimGuide'

import EsimFlag from '../components/EsimFlag'

type PlanKind =
  | 'limited'
  | 'unlimited_standard'
  | 'unlimited_fup'

export default function EsimCountryPage() {

  const {countrySlug} = useParams()
  const navigate = useNavigate()
  const [searchParams]=useSearchParams()
  const requestedPlan=searchParams.get('plan')

  const {
    language,
    formatCurrencyText
  } = useLanguage()

  const ar = language === 'ar'

  const t = (a:string,f:string) =>
    ar ? a : f

  const {
    countries,
    loading,
    error
  } = useEsimCatalog()

  const settings =
    useEsimPublicSettings()

  const [kind,setKind] =
    useState<PlanKind>('limited')

  const [tier,setTier] =
    useState('')

  const [chosen,setChosen] =
    useState('')

  const country =
    countries.find(
      c =>
        c.slug === countrySlug &&
        c.active
    )

  const requestedKind=country?.plans.find(p=>p.id===requestedPlan)?.planType
  useEffect(()=>{
    if(requestedPlan&&requestedKind&&requestedKind!=='unlimited_incomplete'){setKind(requestedKind);setTier('');setChosen(requestedPlan)}
  },[countrySlug,requestedPlan,requestedKind])

  const panel =
    'rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900'

  const price = (value:string) =>
    formatCurrencyText(`${value} MRU`)

  const discount = (p:LivePlan) =>
    p.oldPrice
      ? Math.round(
          (1 - Number(p.price) /
          Number(p.oldPrice)) * 100
        )
      : 0

  const kindLabel = (k:PlanKind) =>
    k === 'limited'
      ? t('محدودة','Limité')
      : k === 'unlimited_standard'
        ? t(
            'غير محدودة عادية',
            'Illimité Standard'
          )
        : t(
            'غير محدودة FUP',
            'Illimité FUP'
          )

  if (loading || error || !country) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Container className="py-16">
          <div className={panel}>
            {loading
              ? t('جاري التحميل…','Chargement…')
              : error
                ? t(
                    'تعذر تحميل الباقات',
                    'Impossible de charger les forfaits'
                  )
                : t(
                    'الوجهة غير متاحة',
                    'Destination indisponible'
                  )}

            <button
              className="mt-4 block text-blue-600"
              onClick={()=>navigate('/')}
            >
              {t('العودة','Retour')}
            </button>
          </div>
        </Container>
      </main>
    )
  }

  const image =
    country.image_path
      ? supabase.storage
          .from('esim-country-images')
          .getPublicUrl(country.image_path)
          .data.publicUrl
      : null

  const published =
    settings?.catalog_enabled === true
      ? country.plans
      : []

  const types: PlanKind[] = [
    'limited',
    'unlimited_standard',
    'unlimited_fup'
  ]

  const availableTypes =
    types.filter(
      k => published.some(p => p.planType === k)
    )

  const effectiveKind =
    availableTypes.includes(kind)
      ? kind
      : availableTypes[0]

  const list =
    published.filter(
      p => p.planType === effectiveKind
    )

  const tiers =
    [...new Set(
      list
        .map(p => p.tier)
        .filter(Boolean)
    )]

  const selectedTier =
    effectiveKind === 'unlimited_fup' &&
    tiers.includes(tier)
      ? tier
      : ''

  const visible =
    list.filter(
      p => !selectedTier ||
           p.tier === selectedTier
    )

  const plan =
    visible.find(p => p.id === chosen) ||
    visible[0]

  const enabled =
    settings?.catalog_enabled === true &&
    settings?.checkout_enabled === true

  const yesNo = (
    value:boolean | null
  ) =>
    value === true
      ? t('مدعوم','Compatible')
      : value === false
        ? t('غير مدعوم','Non compatible')
        : t('غير محدد','Non précisé')

  const details = plan
    ? [
        {
          label:t('الشبكة','Réseau'),
          value:plan.networkName,
          show:settings?.show_networks !== false
        },
        {
          label:t('نوع الشبكة','Type de réseau'),
          value:plan.networkType,
          show:settings?.show_networks !== false
        },
        {
          label:t('مشاركة الإنترنت','Partage de connexion'),
          value:yesNo(plan.hotspotSupported),
          show:plan.hotspotSupported !== null
        },
        {
          label:t('إعادة الشحن','Recharge'),
          value:yesNo(plan.topupSupported),
          show:plan.topupSupported !== null
        }
      ]
    : []

  return (
    <main
      dir={ar?'rtl':'ltr'}
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <Container className="py-6 sm:py-10">

        <button
          onClick={()=>navigate('/')}
          className="mb-5 text-sm font-semibold text-blue-600 dark:text-blue-300"
        >
          {t(
            'العودة إلى المتجر',
            'Retour à la boutique'
          )}
        </button>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">

          <section className={panel+' !p-0 overflow-hidden'}>

            {image
              ? <img
                  src={image}
                  alt={country.name[language]}
                  className="aspect-[4/3] w-full object-cover"
                />
              : <div className="grid aspect-[4/3] place-items-center bg-slate-200 dark:bg-slate-800">
                  <EsimFlag
                    flag={country.flag}
                    code={country.code}
                    path={country.flag_image_path}
                  />
                </div>
            }

            <div className="p-5">

              <div className="flex items-center gap-3">
                <EsimFlag
                  flag={country.flag}
                  code={country.code}
                  path={country.flag_image_path}
                />

                <h1 className="text-2xl font-black">
                  {country.name[language]} eSIM
                </h1>
              </div>

              {country.region?.[language] &&
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {country.region[language]}
                </p>
              }

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                {country.description[language]}
              </p>

            </div>
          </section>


          <section className={panel}>

            <h2 className="text-xl font-black">
              {t(
                'اختر باقتك',
                'Choisissez votre forfait'
              )}
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {published.length
                ? enabled
                  ? t(
                      'باقات متاحة',
                      'Forfaits disponibles'
                    )
                  : t(
                      'الكتالوج متاح — الشراء قريبًا',
                      'Catalogue disponible — achat bientôt'
                    )
                : t(
                    'لا توجد باقات منشورة',
                    'Aucun forfait publié'
                  )}
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">

              {types.map(k=>
                <button
                  type="button"
                  key={k}
                  disabled={!availableTypes.includes(k)}
                  onClick={()=>{
                    setKind(k)
                    setTier('')
                    setChosen('')
                  }}
                  className={
                    'rounded-xl p-3 text-sm font-bold disabled:opacity-40 '+
                    (
                      effectiveKind===k
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 dark:border-slate-600'
                    )
                  }
                >
                  {kindLabel(k)}
                </button>
              )}

            </div>

            {effectiveKind === 'unlimited_fup' &&
             tiers.length > 0 &&
              <div className="mt-4 flex flex-wrap gap-2">
                {['',...tiers].map(k=>
                  <button
                    type="button"
                    key={k}
                    onClick={()=>{
                      setTier(k)
                      setChosen('')
                    }}
                    className={
                      'rounded-full px-4 py-2 text-sm '+
                      (
                        selectedTier===k
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-300 dark:border-slate-600'
                      )
                    }
                  >
                    {k || t('الكل','Tous')}
                  </button>
                )}
              </div>
            }


            {!visible.length
              ? <p className="py-10 text-center text-slate-500">
                  {t(
                    'لا توجد باقات منشورة حاليًا',
                    'Aucun forfait disponible'
                  )}
                </p>
              : <div className="mt-5 grid gap-3 sm:grid-cols-2">

                  {visible.map(p=>
                    <button
                      type="button"
                      key={p.id}
                      onClick={()=>setChosen(p.id)}
                      aria-pressed={plan?.id===p.id}
                      className={
                        'relative rounded-xl border p-4 text-start '+
                        (
                          plan?.id===p.id
                            ? 'border-blue-600 ring-1 ring-blue-600'
                            : 'border-slate-200 dark:border-slate-700'
                        )
                      }
                    >

                      <span className="block text-lg font-black">
                        {p.data[language]}
                      </span>

                      <span className="block text-sm text-slate-500 dark:text-slate-300">
                        {p.duration[language]}
                      </span>

                      {p.tier &&
                        <span className="mt-2 inline-flex rounded-lg bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {p.tier}
                        </span>
                      }

                      {p.planType==='unlimited_fup' &&
                        <span className="mt-2 block space-y-1 text-xs">
                          <span className="block">
                            {p.daily} GB / {t('يوم','jour')}
                          </span>
                          <span className="block">
                            {t(
                              'بعد استهلاك الحصة',
                              'Après le quota'
                            )}: {p.reduced}
                          </span>
                          <span className="block">
                            {t(
                              'تجديد الحصة كل',
                              'Quota renouvelé toutes les'
                            )} {p.reset} h
                          </span>
                        </span>
                      }

                      <span className="mt-3 flex flex-wrap items-baseline gap-2">

                        <span className="font-black text-blue-600 dark:text-blue-300">
                          {price(p.price)}
                        </span>

                        {p.oldPrice &&
                          <>
                            <del className="text-sm text-slate-500 dark:text-slate-400">
                              {price(p.oldPrice)}
                            </del>

                            <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-bold text-green-700 dark:bg-green-950 dark:text-green-300">
                              -{discount(p)}%
                            </span>
                          </>
                        }

                      </span>

                      {p.deliveryMinutes !== null &&
                        <span className="mt-2 block text-xs text-slate-600 dark:text-slate-300">
                          {p.deliveryMinutes === 0
                            ? t(
                                'تسليم فوري',
                                'Livraison immédiate'
                              )
                            : `${t(
                                'التسليم خلال',
                                'Livraison sous'
                              )} ${p.deliveryMinutes} ${t('دقيقة','min')}`
                          }
                        </span>
                      }

                      {p.popular &&
                        <span className="mt-2 block text-xs font-bold text-amber-600">
                          {t('مميزة','Populaire')}
                        </span>
                      }

                    </button>
                  )}

                </div>
            }


            {plan &&
              <div className="mt-6 space-y-4">

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">

                  <h3 className="mb-3 font-black">
                    {t(
                      'تفاصيل الباقة',
                      'Détails du forfait'
                    )}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-sm">

                    <div>
                      <p className="text-slate-500">
                        {t('البيانات','Données')}
                      </p>
                      <p className="font-bold">
                        {plan.data[language]}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        {t('الصلاحية','Validité')}
                      </p>
                      <p className="font-bold">
                        {plan.duration[language]}
                      </p>
                    </div>

                    {details
                      .filter(row=>row.show&&row.value)
                      .map(row=>
                        <div key={row.label}>
                          <p className="text-slate-500">
                            {row.label}
                          </p>
                          <p className="font-bold">
                            {row.value}
                          </p>
                        </div>
                      )
                    }

                  </div>

                </div>


                {[
                  {
                    title:t('الوصف','Description'),
                    value:plan.description[language]
                  },
                  {
                    title:t(
                      'سياسة التفعيل',
                      'Politique d’activation'
                    ),
                    value:plan.activationPolicy[language]
                  },
                  {
                    title:t(
                      'الاستخدام العادل',
                      'Politique FUP'
                    ),
                    value:plan.fairUsage[language]
                  },
                  {
                    title:t('الضمان','Garantie'),
                    value:plan.warranty[language]
                  }
                ]
                  .filter(row=>row.value.trim()!=='')
                  .map(row=>
                    <article
                      key={row.title}
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <h3 className="mb-2 font-bold">
                        {row.title}
                      </h3>

                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {row.value}
                      </p>
                    </article>
                  )
                }


                <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">

                  <div className="flex flex-wrap items-center justify-between gap-3 font-bold">

                    <span>
                      {t('الإجمالي','Total')}
                    </span>

                    <span className="flex items-baseline gap-2">

                      <span className="text-xl text-blue-600 dark:text-blue-300">
                        {price(plan.price)}
                      </span>

                      {plan.oldPrice &&
                        <del className="text-sm font-normal text-slate-500">
                          {price(plan.oldPrice)}
                        </del>
                      }

                    </span>

                  </div>

                  <p className="mt-2 text-sm">
                    {plan.deliveryMinutes === null
                      ? t(
                          'مدة التسليم غير محددة',
                          'Délai de livraison non précisé'
                        )
                      : plan.deliveryMinutes === 0
                        ? t(
                            'تسليم فوري',
                            'Livraison immédiate'
                          )
                        : `${t(
                            'التسليم خلال',
                            'Livraison sous'
                          )} ${plan.deliveryMinutes} ${t('دقيقة','min')}`
                    }
                  </p>

                  <button
                    type="button"
                    disabled={!enabled}
                    onClick={()=>{
                      if (!enabled) return

                      navigate(
                        `/esim/${country.slug}/commande`,
                        {
                          state: {
                            countrySlug:country.slug,
                            countryName:country.name,
                            countryFlag:country.flag,
                            countryImage:image,
                            planId:plan.id,
                            planData:plan.data,
                            planDuration:plan.duration,
                            planPrice:plan.price
                          }
                        }
                      )
                    }}
                    className="mt-4 w-full rounded-xl bg-blue-600 p-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {enabled
                      ? t(
                          'متابعة الشراء',
                          'Continuer'
                        )
                      : t(
                          'الشراء غير متاح حاليًا',
                          'Achat temporairement indisponible'
                        )
                    }
                  </button>

                </div>

              </div>
            }

          </section>

        </div>

        <EsimGuide
          ar={ar}
          settings={{
            ...settings,
            ...Object.fromEntries(
              Object.entries(country.guide??{})
                .filter(([,value])=>
                  Boolean(value?.trim())
                )
            )
          }}
        />

      </Container>
    </main>
  )
}
