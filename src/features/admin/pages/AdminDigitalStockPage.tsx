import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type StockCount = {
  plan_id: string
  available_count: number
  reserved_count: number
  delivered_count: number
  disabled_count: number
}

type Plan = {
  id: string
  label: string
  plan_key: string
  digital_service_groups: {
    name: string
    digital_services: { name: string } | null
  } | null
}

export default function AdminDigitalStockPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [counts, setCounts] = useState<StockCount[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

    const [plansResult, countsResult] = await Promise.all([
      supabase
        .from('digital_service_plans')
        .select(`
          id,
          label,
          plan_key,
          digital_service_groups (
            name,
            digital_services (name)
          )
        `),
      supabase.rpc('admin_digital_stock_summary'),
    ])

    if (plansResult.error || countsResult.error) {
      setError(
        plansResult.error?.message ||
        countsResult.error?.message ||
        'Erreur de chargement'
      )
      setLoading(false)
      return
    }

    setPlans((plansResult.data ?? []) as unknown as Plan[])
    setCounts((countsResult.data ?? []) as StockCount[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const countsByPlan = useMemo(
    () => new Map(counts.map(item => [item.plan_id, item])),
    [counts]
  )

  const totals = useMemo(
    () =>
      counts.reduce(
        (result, item) => ({
          available:
            result.available + Number(item.available_count),
          reserved:
            result.reserved + Number(item.reserved_count),
          delivered:
            result.delivered + Number(item.delivered_count),
          disabled:
            result.disabled + Number(item.disabled_count),
        }),
        {
          available: 0,
          reserved: 0,
          delivered: 0,
          disabled: 0,
        }
      ),
    [counts]
  )

  const filteredPlans = useMemo(() => {
    const search = query.trim().toLowerCase()

    return plans.filter(plan => {
      const content = [
        plan.label,
        plan.plan_key,
        plan.digital_service_groups?.name,
        plan.digital_service_groups?.digital_services?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return content.includes(search)
    })
  }, [plans, query])

  const stats = [
    {
      label: 'Disponibles',
      value: totals.available,
      color: 'text-emerald-700',
    },
    {
      label: 'Réservés',
      value: totals.reserved,
      color: 'text-amber-700',
    },
    {
      label: 'Livrés',
      value: totals.delivered,
      color: 'text-blue-700',
    },
    {
      label: 'Désactivés',
      value: totals.disabled,
      color: 'text-slate-600',
    },
  ]

  return (
    <main className="space-y-5 pb-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Catalogue · Administration
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-950">
              Stock Digital
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Inventaire sécurisé par service et par forfait.
              Aucun code secret n'est affiché.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 disabled:opacity-50"
          >
            ↻ Actualiser
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="rounded-xl bg-slate-50 p-4"
            >
              <p className="text-xs font-semibold text-slate-500">
                {stat.label}
              </p>

              <p className={`mt-1 text-2xl font-black ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label
          htmlFor="stock-search"
          className="mb-2 block text-sm font-bold text-slate-700"
        >
          Rechercher un service ou un forfait
        </label>

        <input
          id="stock-search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Apple Gift Card, Netflix, Shahid..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {loading ? (
          <p className="text-sm text-slate-500">
            Chargement...
          </p>
        ) : filteredPlans.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucun forfait trouvé.
          </p>
        ) : (
          filteredPlans.map(plan => {
            const stock = countsByPlan.get(plan.id)

            const quantities = [
              {
                label: 'Disponible',
                value: stock?.available_count ?? 0,
              },
              {
                label: 'Réservé',
                value: stock?.reserved_count ?? 0,
              },
              {
                label: 'Livré',
                value: stock?.delivered_count ?? 0,
              },
              {
                label: 'Inactif',
                value: stock?.disabled_count ?? 0,
              },
            ]

            return (
              <article
                key={plan.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-bold text-blue-600">
                  {plan.digital_service_groups
                    ?.digital_services?.name ?? 'Service'}
                  {' · '}
                  {plan.digital_service_groups?.name ?? ''}
                </p>

                <h2 className="mt-1 text-lg font-black text-slate-950">
                  {plan.label}
                </h2>

                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  {quantities.map(item => (
                    <div
                      key={item.label}
                      className="rounded-lg bg-slate-50 p-2"
                    >
                      <p className="text-lg font-black text-slate-900">
                        {item.value}
                      </p>

                      <p className="text-[10px] font-medium text-slate-500">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            )
          })
        )}
      </section>

      <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        Consultation uniquement. L'ajout des codes et la livraison
        seront activés après sécurisation des données et
        vérification des paiements.
      </p>
    </main>
  )
}