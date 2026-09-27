import {
  useEffect,
  useState,
} from 'react'

import { Link } from 'react-router-dom'

import Container from '../../../components/layout/Container'
import { useLanguage } from '../../../i18n/LanguageContext'
import { supabase } from '../../../lib/supabase'

import { esimCountries } from '../data/esimCatalog'

type CountrySettingRow = {
  country_slug: string
  image_path: string | null
}

type CountryImageMap = Record<
  string,
  string
>

const ESIM_IMAGES_BUCKET =
  'esim-country-images'

function getCountryImageUrl(
  imagePath: string,
) {
  if (
    imagePath.startsWith(
      'http://',
    ) ||
    imagePath.startsWith(
      'https://',
    )
  ) {
    return imagePath
  }

  const { data } =
    supabase.storage
      .from(
        ESIM_IMAGES_BUCKET,
      )
      .getPublicUrl(
        imagePath,
      )

  return data.publicUrl
}

function EsimSection() {
  const { language } =
    useLanguage()

  const isArabic =
    language === 'ar'

  const [
    countryImages,
    setCountryImages,
  ] =
    useState<CountryImageMap>(
      {},
    )

  useEffect(() => {
    let mounted = true

    const loadCountryImages =
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'esim_country_settings',
            )
            .select(
              `
                country_slug,
                image_path
              `,
            )

        if (!mounted) {
          return
        }

        if (error) {
          console.error(
            'Unable to load eSIM country images:',
            error,
          )

          return
        }

        const nextImages:
          CountryImageMap =
            {}

        const rows =
          (data ??
            []) as CountrySettingRow[]

        rows.forEach(
          (row) => {
            if (
              !row.image_path
            ) {
              return
            }

            nextImages[
              row.country_slug
            ] =
              getCountryImageUrl(
                row.image_path,
              )
          },
        )

        setCountryImages(
          nextImages,
        )
      }

    void loadCountryImages()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <section
      id="esim"
      className="border-t border-slate-200 bg-[#f7f9fc] py-10 sm:py-14 lg:py-20"
    >
      <Container>
        <div className="mx-auto max-w-6xl">
          {/* HEADER */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

                <span className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                  eSIM
                </span>
              </div>

              <h2 className="mt-3 max-w-xl text-[28px] font-black leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-4xl">
                {isArabic
                  ? 'اتصالك،'
                  : 'Votre connexion,'}

                <span className="block text-blue-600">
                  {isArabic
                    ? 'أينما كنت في العالم.'
                    : 'partout dans le monde.'}
                </span>
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:leading-7">
                {isArabic
                  ? 'اختر وجهتك لاكتشاف باقات eSIM المتوفرة.'
                  : 'Sélectionnez votre destination pour découvrir les forfaits eSIM disponibles.'}
              </p>
            </div>

            <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:block">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                {isArabic
                  ? 'التفعيل'
                  : 'Activation'}
              </p>

              <p className="mt-1 text-sm font-black text-slate-950">
                {isArabic
                  ? 'رقمي 100%'
                  : '100% digitale'}
              </p>
            </div>
          </div>

          {/* COUNTRY GRID */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 lg:grid-cols-4">
            {esimCountries.map(
              (country) => {
                const esimLabel =
                  language ===
                  'ar'
                    ? `eSIM ${country.name.ar}`
                    : `${country.name.fr} eSIM`

                const countryImage =
                  countryImages[
                    country.slug
                  ]

                return (
                  <Link
                    key={
                      country.slug
                    }
                    to={`/esim/${country.slug}`}
                    className="group overflow-hidden rounded-[20px] border border-slate-200 bg-white p-2.5 shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.09)] sm:rounded-[24px] sm:p-3"
                  >
                    {/* COUNTRY IMAGE */}
                    <div
                      className="relative flex aspect-[1.28/1] items-center justify-center overflow-hidden rounded-[16px] sm:rounded-[19px]"
                      style={
                        !countryImage
                          ? {
                              background:
                                'linear-gradient(145deg, #07111f 0%, #102250 55%, #1d4ed8 100%)',
                            }
                          : undefined
                      }
                    >
                      {countryImage ? (
                        <>
                          <img
                            src={
                              countryImage
                            }
                            alt={
                              country
                                .name[
                                language
                              ]
                            }
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                          />

                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/5 to-slate-950/10" />
                        </>
                      ) : (
                        <>
                          <div
                            className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
                            style={{
                              backgroundColor:
                                'rgba(96,165,250,0.22)',
                            }}
                          />

                          <span className="relative text-[38px] sm:text-5xl">
                            {
                              country.flag
                            }
                          </span>

                          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent" />
                        </>
                      )}

                      <span
                        className={[
                          'absolute top-2 z-10 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-xs font-black tracking-wide text-white backdrop-blur-md',
                          isArabic
                            ? 'right-2'
                            : 'left-2',
                        ].join(
                          ' ',
                        )}
                      >
                        {
                          country.code
                        }
                      </span>

                      {countryImage && (
                        <div
                          className={[
                            'absolute bottom-2 z-10',
                            isArabic
                              ? 'right-2'
                              : 'left-2',
                          ].join(
                            ' ',
                          )}
                        >
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-white/70">
                            {isArabic
                              ? 'الوجهة'
                              : 'Destination'}
                          </p>

                          <p className="mt-0.5 text-sm font-black text-white">
                            {
                              country
                                .name[
                                language
                              ]
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    {/* COUNTRY INFO */}
                    <div className="px-1 pb-1 pt-3">
                      <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-600">
                        {isArabic
                          ? 'الوجهة'
                          : 'Destination'}
                      </p>

                      <h3 className="mt-1 text-sm font-black leading-5 text-slate-950 transition group-hover:text-blue-600 sm:text-base">
                        {
                          country
                            .name[
                            language
                          ]
                        }
                      </h3>

                      <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
                        {
                          esimLabel
                        }
                      </p>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <span className="text-xs font-black text-slate-500">
                          {isArabic
                            ? 'عرض الباقات'
                            : 'Voir les forfaits'}
                        </span>

                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                          {isArabic
                            ? '←'
                            : '→'}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              },
            )}
          </div>

          {/* MOBILE TRUST STRIP */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8">
            <div className="rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center sm:px-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                {isArabic
                  ? 'التفعيل'
                  : 'Activation'}
              </p>

              <p className="mt-1 text-xs font-black text-slate-950">
                {isArabic
                  ? 'سريع'
                  : 'Rapide'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center sm:px-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                {isArabic
                  ? 'بطاقة SIM'
                  : 'Carte SIM'}
              </p>

              <p className="mt-1 text-xs font-black text-slate-950">
                {isArabic
                  ? 'رقمية 100%'
                  : '100% digitale'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center sm:px-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                {isArabic
                  ? 'الدعم'
                  : 'Support'}
              </p>

              <p className="mt-1 text-xs font-black text-slate-950">
                {isArabic
                  ? 'متوفر'
                  : 'Disponible'}
              </p>
            </div>
          </div>

          {/* COMPATIBILITY */}
          <div
            className="mt-5 overflow-hidden rounded-[22px] p-4 text-white sm:mt-6 sm:rounded-[26px] sm:p-6"
            style={{
              background:
                'linear-gradient(135deg, #06101f 0%, #101d44 55%, #312e81 100%)',
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">
                  {isArabic
                    ? 'توافق eSIM'
                    : 'Compatibilité eSIM'}
                </p>

                <h3 className="mt-1.5 text-sm font-black sm:text-lg">
                  {isArabic
                    ? 'تحقق من جهازك قبل الشراء.'
                    : "Vérifiez votre appareil avant l'achat."}
                </h3>

                <p className="mt-1 max-w-xl text-xs leading-5 text-white/50">
                  {isArabic
                    ? 'يجب أن يدعم هاتفك تقنية eSIM.'
                    : 'Votre smartphone doit prendre en charge la technologie eSIM.'}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-lg sm:h-12 sm:w-12">
                ✓
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default EsimSection