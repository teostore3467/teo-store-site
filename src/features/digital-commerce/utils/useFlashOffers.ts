import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export type FlashOffer = {
  plan_id: string
  original_price: number
  flash_price: number
  discount_percent: number
  ends_at: string
  quantity_remaining: number | null
  show_discount_badge: boolean
  preview_only?: boolean
  display_only?: boolean
  purchase_allowed?: boolean
  title_ar?: string
  title_fr?: string
  campaign_id?: string
  starts_at?: string
  currency?: string
}

export function useFlashOffers(
  ids: (string | undefined)[],
  preview = false,
  publicDisplay = false
) {
  const key = [
    ...new Set(
      ids.filter((id): id is string => !!id)
    )
  ].sort().join(',')

  const requestKey =
    `${preview ? 'preview' : publicDisplay ? 'display' : 'public'}:${key}`

  const [result, setResult] = useState<{
    key: string
    offers: Record<string, FlashOffer>
  }>({
    key: '',
    offers: {}
  })

  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    let alive = true
    let version = 0

    const load = async () => {
      const request = ++version

      if (!key) {
        if (alive) {
          setResult({
            key: requestKey,
            offers: {}
          })
        }
        return
      }

      try {
        const planIds = key.split(',')
        const offers: Record<string, FlashOffer> = {}

        for (
          let i = 0;
          i < planIds.length;
          i += 100
        ) {
          const batch = planIds.slice(i, i + 100)

          let rows: any[] = []

          if (preview) {
            const { data, error } =
              await supabase.rpc(
                'teo_v6_admin_preview_flash_offers',
                { p_plan_ids: batch }
              )

            if (error) throw error

            rows = Array.isArray(data)
              ? data.filter(row =>
                  row?.preview_only === true &&
                  row?.purchase_allowed === false
                )
              : []

          } else {
            const gate = await supabase.rpc(
              'teo_v6_get_flash_display_status'
            )

            let liveRows: any[] = []

            if (
              !gate.error &&
              gate.data?.purchase_allowed === true
            ) {
              const live = await supabase.rpc(
                'teo_v6_public_flash_offers',
                { p_plan_ids: batch }
              )

              if (!live.error && Array.isArray(live.data)) {
                liveRows = live.data
              }
            }

            rows = liveRows
              .filter(row =>
                row &&
                row.preview_only !== true &&
                row.display_only !== true &&
                row.purchase_allowed !== false
              )
              .map(row => ({
                ...row,
                preview_only: false,
                display_only: false,
                purchase_allowed: true
              }))

            if (publicDisplay) {
              const display = await supabase.rpc(
                'teo_v6_public_flash_display_offers',
                { p_plan_ids: batch }
              )

              if (!display.error &&
                  Array.isArray(display.data)) {

                const liveIds = new Set(
                  rows.map(row => row.plan_id)
                )

                for (const row of display.data) {
                  if (
                    row &&
                    !liveIds.has(row.plan_id) &&
                    row.display_only === true &&
                    row.purchase_allowed === false &&
                    row.preview_only === false
                  ) {
                    rows.push(row)
                  }
                }
              }
            }
          }

          for (const row of rows) {
            if (!row) continue

            if (!batch.includes(row.plan_id)) {
              continue
            }

            if (!preview &&
                row.preview_only === true) {
              continue
            }

            if (!preview && !publicDisplay &&
                row.purchase_allowed !== true) {
              continue
            }

            const originalPrice =
              Number(row.original_price)

            const flashPrice =
              Number(row.flash_price)

            const discountPercent =
              Number(row.discount_percent)

            const endsAt =
              Date.parse(row.ends_at)

            if (
              !Number.isFinite(originalPrice) ||
              !Number.isFinite(flashPrice) ||
              !Number.isFinite(discountPercent) ||
              !Number.isFinite(endsAt) ||
              originalPrice <= 0 ||
              flashPrice <= 0 ||
              flashPrice >= originalPrice ||
              endsAt <= Date.now()
            ) {
              continue
            }

            offers[row.plan_id] = {
              ...row,
              original_price: originalPrice,
              flash_price: flashPrice,
              discount_percent: discountPercent
            }
          }
        }

        if (alive && request === version) {
          setResult({
            key: requestKey,
            offers
          })
        }

      } catch {
        if (alive && request === version) {
          setResult({
            key: requestKey,
            offers: {}
          })
        }
      }
    }

    void load()

    const timer = window.setInterval(
      () => void load(),
      30000
    )

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      if (!alive) return

      ++version

      setResult({
        key: requestKey,
        offers: {}
      })

      window.setTimeout(() => {
        if (alive) void load()
      }, 0)
    })

    const clock = window.setInterval(
      () => setNow(Date.now()),
      1000
    )

    return () => {
      alive = false
      window.clearInterval(timer)
      window.clearInterval(clock)
      subscription.unsubscribe()
    }

  }, [key, preview, publicDisplay, requestKey])

  const offers =
    result.key === requestKey
      ? Object.fromEntries(
          Object.entries(result.offers)
            .filter(
              ([, offer]) =>
                Date.parse(offer.ends_at) > now
            )
        )
      : {}

  return {
    offers,
    now
  }
}