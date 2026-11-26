import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  esimCountries,
  type EsimCountry,
  type EsimPlan
} from './esimCatalog'

type LocalText = {
  ar: string
  fr: string
}

export type LivePlan = EsimPlan & {
  tier: string
  daily: number | null
  reduced: string
  reset: number | null
  oldPrice: string | null
  deliveryMinutes: number | null
  validityDays: number | null
  dataGb: number | null
  label: LocalText
  description: LocalText
  warranty: LocalText
  activationPolicy: LocalText
  fairUsage: LocalText
  networkName: string
  networkType: string
  hotspotSupported: boolean | null
  topupSupported: boolean | null
  planType:
    | 'limited'
    | 'unlimited_standard'
    | 'unlimited_fup'
    | 'unlimited_incomplete'
}

export type LiveCountry =
  Omit<EsimCountry, 'plans'> & {
    plans: LivePlan[]
    active: boolean
    image_path: string | null
    flag_image_path?: string | null
    region?: LocalText
    guide?: {
      compatible_devices_ar?: string
      compatible_devices_fr?: string
      installation_guide_ar?: string
      installation_guide_fr?: string
      terms_ar?: string
      terms_fr?: string
    }
  }

function numberOrNull(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) return null

  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function text(value: unknown): string {
  return typeof value === 'string'
    ? value.trim()
    : ''
}

function localized(
  ar: unknown,
  fr: unknown
): LocalText {
  return {
    ar: text(ar),
    fr: text(fr)
  }
}

export function useEsimCatalog() {
  const [countries,setCountries] =
    useState<LiveCountry[]>([])

  const [loading,setLoading] =
    useState(true)

  const [error,setError] =
    useState('')

  useEffect(()=>{
    let live = true
    let version = 0

    const load = async ()=>{
      const request = ++version

      try {
        const [settings,c,p] =
          await Promise.all([
            supabase.rpc(
              'teo_v5_get_esim_settings'
            ),

            supabase
              .from('esim_country_settings')
              .select('*')
              .order('sort_order'),

            supabase
              .from('esim_plan_settings')
              .select('*')
              .order('sort_order')
          ])

        if (!live || request !== version) return

        if (settings.error || c.error || p.error) {
          throw Error(
            settings.error?.message ||
            c.error?.message ||
            p.error?.message ||
            'ESIM_CATALOG_ERROR'
          )
        }

        if (
          settings.data?.catalog_enabled !== true
        ) {
          setCountries([])
          setError('')
          setLoading(false)
          return
        }

        const result: LiveCountry[] =
          (c.data ?? [])
            .filter(r => r.active === true)
            .map((r): LiveCountry => {

              const fallback =
                esimCountries.find(
                  x => x.slug === r.country_slug
                )

              const plans: LivePlan[] =
                (p.data ?? [])
                  .filter(q =>
                    q.country_slug === r.country_slug &&
                    q.active === true &&
                    Number.isFinite(Number(q.price)) &&
                    Number(q.price) > 0
                  )
                  .map((q): LivePlan => {

                    const tier = text(q.speed_tier)

                    const daily =
                      numberOrNull(q.daily_high_speed_gb)

                    const reduced =
                      text(q.reduced_speed)

                    const reset =
                      numberOrNull(q.reset_hours)

                    const unlimited =
                      q.unlimited === true

                    const hasFup =
                      !!tier ||
                      daily !== null ||
                      !!reduced ||
                      reset !== null

                    const fullFup =
                      ['Fast','Faster','Fastest'].includes(tier) &&
                      daily !== null &&
                      daily > 0 &&
                      !!reduced &&
                      reset !== null &&
                      Number.isInteger(reset) &&
                      reset > 0

                    const planType: LivePlan['planType'] =
                      !unlimited
                        ? 'limited'
                        : !hasFup
                          ? 'unlimited_standard'
                          : fullFup
                            ? 'unlimited_fup'
                            : 'unlimited_incomplete'

                    const oldPrice =
                      numberOrNull(q.old_price)

                    const delivery =
                      numberOrNull(q.delivery_minutes)

                    const networkType =
                      text(q.network_type)

                    return {
                      id: q.plan_id,

                      label: localized(
                        q.label_ar,
                        q.label_fr
                      ),

                      data: {
                        ar:
                          text(q.data_ar) ||
                          text(q.label_ar) ||
                          (unlimited
                            ? 'غير محدود'
                            : `${q.data_gb ?? ''} GB`),

                        fr:
                          text(q.data_fr) ||
                          text(q.label_fr) ||
                          (unlimited
                            ? 'Illimité'
                            : `${q.data_gb ?? ''} GB`)
                      },

                      duration: {
                        ar:
                          text(q.duration_ar) ||
                          `${q.validity_days ?? ''} يوم`,

                        fr:
                          text(q.duration_fr) ||
                          `${q.validity_days ?? ''} jours`
                      },

                      speed: {
                        ar: networkType,
                        fr: networkType
                      },

                      price: String(q.price),

                      oldPrice:
                        oldPrice !== null &&
                        oldPrice > Number(q.price)
                          ? String(oldPrice)
                          : null,

                      deliveryMinutes:
                        delivery !== null &&
                        delivery >= 0 &&
                        Number.isInteger(delivery)
                          ? delivery
                          : null,

                      type: unlimited
                        ? 'unlimited'
                        : 'limited',

                      planType,

                      popular: q.popular === true,

                      tier,
                      daily,
                      reduced,
                      reset,

                      validityDays:
                        numberOrNull(q.validity_days),

                      dataGb:
                        numberOrNull(q.data_gb),

                      description: localized(
                        q.description_ar,
                        q.description_fr
                      ),

                      warranty: localized(
                        q.warranty_ar,
                        q.warranty_fr
                      ),

                      activationPolicy: localized(
                        q.activation_policy_ar,
                        q.activation_policy_fr
                      ),

                      fairUsage: localized(
                        q.fair_usage_ar,
                        q.fair_usage_fr
                      ),

                      networkName:
                        text(q.network_name),

                      networkType,

                      hotspotSupported:
                        typeof q.hotspot_supported === 'boolean'
                          ? q.hotspot_supported
                          : null,

                      topupSupported:
                        typeof q.topup_supported === 'boolean'
                          ? q.topup_supported
                          : null
                    }

                  })
                  .filter(q =>
                    q.planType !== 'unlimited_incomplete' &&
                    q.validityDays !== null &&
                    q.validityDays > 0 &&
                    (
                      q.type === 'unlimited' ||
                      (
                        q.dataGb !== null &&
                        q.dataGb > 0
                      )
                    )
                  )

              return {
                slug: r.country_slug,

                code:
                  text(r.iso_code) ||
                  fallback?.code ||
                  '',

                name: {
                  ar:
                    text(r.name_ar) ||
                    fallback?.name.ar ||
                    r.country_slug,

                  fr:
                    text(r.name_fr) ||
                    fallback?.name.fr ||
                    r.country_slug
                },

                flag:
                  text(r.flag) ||
                  fallback?.flag ||
                  '🌐',

                description: localized(
                  r.description_ar,
                  r.description_fr
                ),

                imageLabel: localized(
                  r.name_ar,
                  r.name_fr
                ),

                active: true,

                image_path:
                  r.cover_image_path ||
                  r.image_path ||
                  null,

                flag_image_path:
                  r.flag_image_path || null,

                region: localized(
                  r.region_ar,
                  r.region_fr
                ),

                guide: {
                  compatible_devices_ar:
                    r.compatibility_ar || undefined,

                  compatible_devices_fr:
                    r.compatibility_fr || undefined,

                  installation_guide_ar:
                    r.instructions_ar || undefined,

                  installation_guide_fr:
                    r.instructions_fr || undefined,

                  terms_ar:
                    r.terms_ar || undefined,

                  terms_fr:
                    r.terms_fr || undefined
                },

                plans
              }
            })

        if (live && request === version) {
          setCountries(result)
          setError('')
          setLoading(false)
        }

      } catch(e) {
        if (live && request === version) {
          setCountries([])

          setError(
            e instanceof Error
              ? e.message
              : String(e)
          )

          setLoading(false)
        }
      }
    }

    void load()

    const channel =
      supabase
        .channel('esim-live-' + Math.random())
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'esim_country_settings'
          },
          load
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'esim_plan_settings'
          },
          load
        )
        .subscribe()

    const timer =
      window.setInterval(load,10000)

    window.addEventListener('focus',load)

    return ()=>{
      live = false

      window.clearInterval(timer)

      window.removeEventListener(
        'focus',
        load
      )

      void supabase.removeChannel(channel)
    }

  },[])

  return {
    countries,
    loading,
    error
  }
}