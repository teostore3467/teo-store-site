import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import {
  supabase,
} from '../../../lib/supabase'

type AvailabilityStatus =
  | 'available'
  | 'out_of_stock'
  | 'coming_soon'

type PlanViewRow = {
  id: string
  plan_key: string
  label: string
  price: number
  currency: string
  availability:
    AvailabilityStatus
  popular: boolean
  active: boolean
  sort_order: number
  group_id: string
  digital_service_groups: {
    id: string
    name: string
    short_name: string
    service_id: string
    digital_services: {
      id: string
      slug: string
      name: string
      category: string
    } | null
  } | null
}

type ToastState = {
  type:
    | 'success'
    | 'error'
    | 'info'
  title: string
  message?: string
}

function AdminPlansPage() {
  const locale =
    'fr-FR-u-nu-latn'

  const [
    plans,
    setPlans,
  ] =
    useState<
      PlanViewRow[]
    >([])

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      | 'all'
      | AvailabilityStatus
    >('all')

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true)

  const [
    savingPlanId,
    setSavingPlanId,
  ] =
    useState<
      string | null
    >(null)

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
          4000,
        )
      },
      [],
    )

  const loadPlans =
    useCallback(
      async () => {
        setIsLoading(
          true,
        )

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'digital_service_plans',
            )
            .select(
              `
                id,
                plan_key,
                label,
                price,
                currency,
                availability,
                popular,
                active,
                sort_order,
                group_id,
                digital_service_groups (
                  id,
                  name,
                  short_name,
                  service_id,
                  digital_services (
                    id,
                    slug,
                    name,
                    category
                  )
                )
              `,
            )
            .order(
              'sort_order',
              {
                ascending:
                  true,
              },
            )

        setIsLoading(
          false,
        )

        if (
          error
        ) {
          showToast({
            type:
              'error',
            title:
              'Chargement impossible',
            message:
              error.message,
          })
          return
        }

        setPlans(
          (data ??
            []) as unknown as PlanViewRow[],
        )
      },
      [
        showToast,
      ],
    )

  useEffect(() => {
    void loadPlans()
  }, [
    loadPlans,
  ])

  const filteredPlans =
    useMemo(
      () => {
        const query =
          searchQuery
            .trim()
            .toLowerCase()

        return plans.filter(
          (
            plan,
          ) => {
            const service =
              plan
                .digital_service_groups
                ?.digital_services

            const group =
              plan
                .digital_service_groups

            const matchesSearch =
              query.length ===
                0 ||
              plan.label
                .toLowerCase()
                .includes(
                  query,
                ) ||
              plan.plan_key
                .toLowerCase()
                .includes(
                  query,
                ) ||
              service?.name
                .toLowerCase()
                .includes(
                  query,
                ) ||
              service?.slug
                .toLowerCase()
                .includes(
                  query,
                ) ||
              group?.name
                .toLowerCase()
                .includes(
                  query,
                )

            const matchesStatus =
              statusFilter ===
                'all' ||
              plan.availability ===
                statusFilter

            return (
              matchesSearch &&
              matchesStatus
            )
          },
        )
      },
      [
        plans,
        searchQuery,
        statusFilter,
      ],
    )

  const stats =
    useMemo(
      () => ({
        total:
          plans.length,
        available:
          plans.filter(
            (
              plan,
            ) =>
              plan.availability ===
              'available',
          ).length,
        outOfStock:
          plans.filter(
            (
              plan,
            ) =>
              plan.availability ===
              'out_of_stock',
          ).length,
        comingSoon:
          plans.filter(
            (
              plan,
            ) =>
              plan.availability ===
              'coming_soon',
          ).length,
        popular:
          plans.filter(
            (
              plan,
            ) =>
              plan.popular,
          ).length,
      }),
      [
        plans,
      ],
    )

  const formatAmount =
    (
      amount: number,
    ) =>
      `${new Intl.NumberFormat(
        locale,
        {
          numberingSystem:
            'latn',
          maximumFractionDigits:
            2,
        },
      ).format(
        Number(
          amount,
        ),
      )} MRU`

  const updatePlan =
    (
      planId: string,
      patch:
        Partial<PlanViewRow>,
    ) => {
      setPlans(
        (
          current,
        ) =>
          current.map(
            (
              plan,
            ) =>
              plan.id ===
              planId
                ? {
                    ...plan,
                    ...patch,
                  }
                : plan,
          ),
      )
    }

  const savePlan =
    async (
      plan:
        PlanViewRow,
    ) => {
      setSavingPlanId(
        plan.id,
      )

      const {
        error,
      } =
        await supabase
          .from(
            'digital_service_plans',
          )
          .update({
            label:
              plan.label.trim(),
            price:
              Number(
                plan.price,
              ),
            currency:
              'MRU',
            availability:
              plan.availability,
            popular:
              plan.popular,
            active:
              plan.active,
            sort_order:
              Number(
                plan.sort_order,
              ),
          })
          .eq(
            'id',
            plan.id,
          )

      setSavingPlanId(
        null,
      )

      if (
        error
      ) {
        showToast({
          type:
            'error',
          title:
            'Enregistrement impossible',
          message:
            error.message,
        })
        return
      }

      showToast({
        type:
          'success',
        title:
          'Plan enregistré',
        message:
          `${plan.label} — ${formatAmount(
            plan.price,
          )}`,
      })

      await loadPlans()
    }

  return (
    <div className="pb-10">
      {toast && (
        <div className="fixed right-4 top-4 z-[250] w-[calc(100%-2rem)] max-w-sm">
          <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-start gap-3">
              <div
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] font-black',
                  toast.type ===
                  'success'
                    ? 'bg-emerald-50 text-emerald-600'
                    : toast.type ===
                        'error'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-blue-50 text-blue-600',
                ].join(
                  ' ',
                )}
              >
                {toast.type ===
                'success'
                  ? '✓'
                  : toast.type ===
                      'error'
                    ? '!'
                    : 'i'}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {toast.message}
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

      <section
        className="rounded-[30px] p-6 text-white sm:p-7"
        style={{
          background:
            'linear-gradient(135deg,#020617 0%,#10265b 50%,#312e81 100%)',
        }}
      >
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
          DIGITAL PRICING CONTROL
        </p>

        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
          Plans et prix
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
          Modifiez les prix, statuts et mises en avant directement dans Supabase.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-5">
          {[
            [
              'Plans',
              stats.total,
            ],
            [
              'Disponibles',
              stats.available,
            ],
            [
              'Rupture',
              stats.outOfStock,
            ],
            [
              'Bientôt',
              stats.comingSoon,
            ],
            [
              'Populaires',
              stats.popular,
            ],
          ].map(
            (
              [
                label,
                value,
              ],
            ) => (
              <div
                key={
                  label
                }
                className="rounded-[16px] border border-white/10 bg-white/[0.06] p-3"
              >
                <p className="text-xs font-black uppercase text-white/40">
                  {label}
                </p>
                <p className="mt-1 text-xl font-black">
                  {value}
                </p>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="mt-6 rounded-[22px] border border-slate-200 bg-white p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_240px_auto]">
          <input
            type="search"
            value={
              searchQuery
            }
            onChange={(
              event,
            ) =>
              setSearchQuery(
                event.target.value,
              )
            }
            placeholder="Service, groupe, plan..."
            className="h-12 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
          />

          <select
            value={
              statusFilter
            }
            onChange={(
              event,
            ) =>
              setStatusFilter(
                event.target
                  .value as
                  | 'all'
                  | AvailabilityStatus,
              )
            }
            className="h-12 rounded-[14px] border border-slate-200 bg-slate-50 px-3 text-sm font-black outline-none focus:border-blue-500"
          >
            <option value="all">
              Tous les statuts
            </option>
            <option value="available">
              Disponible
            </option>
            <option value="out_of_stock">
              Rupture
            </option>
            <option value="coming_soon">
              Bientôt
            </option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchQuery(
                '',
              )
              setStatusFilter(
                'all',
              )
            }}
            className="h-12 rounded-[14px] border border-slate-200 px-4 text-sm font-black text-slate-600 hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="mt-6 rounded-[22px] border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400">
          Chargement des plans...
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredPlans.map(
            (
              plan,
            ) => {
              const group =
                plan
                  .digital_service_groups
              const service =
                group
                  ?.digital_services

              return (
                <article
                  key={
                    plan.id
                  }
                  className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_6px_22px_rgba(15,23,42,0.04)]"
                >
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_180px_180px_auto] xl:items-end">
                    <div>
                      <p className="text-xs font-black uppercase text-blue-600">
                        {service?.name ??
                          'Service'}
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {group?.name ??
                          'Groupe'}
                      </p>
                      {service?.slug && (
                        <Link
                          to={`/admin/services/${service.slug}`}
                          className="mt-2 inline-flex text-xs font-black text-blue-600 hover:text-blue-700"
                        >
                          Gérer le service →
                        </Link>
                      )}
                    </div>

                    <label>
                      <span className="text-xs font-black uppercase text-slate-400">
                        Plan
                      </span>
                      <input
                        type="text"
                        value={
                          plan.label
                        }
                        onChange={(
                          event,
                        ) =>
                          updatePlan(
                            plan.id,
                            {
                              label:
                                event.target.value,
                            },
                          )
                        }
                        className="mt-2 h-11 w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-black uppercase text-slate-400">
                        Prix MRU
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          plan.price
                        }
                        onChange={(
                          event,
                        ) =>
                          updatePlan(
                            plan.id,
                            {
                              price:
                                Number(
                                  event.target.value,
                                ),
                            },
                          )
                        }
                        className="mt-2 h-11 w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 text-sm font-black outline-none focus:border-blue-500"
                      />
                      <p
                        dir="ltr"
                        className="mt-1 text-left text-xs font-bold text-slate-400"
                      >
                        {formatAmount(
                          plan.price,
                        )}
                      </p>
                    </label>

                    <label>
                      <span className="text-xs font-black uppercase text-slate-400">
                        Statut
                      </span>
                      <select
                        value={
                          plan.availability
                        }
                        onChange={(
                          event,
                        ) =>
                          updatePlan(
                            plan.id,
                            {
                              availability:
                                event.target
                                  .value as AvailabilityStatus,
                            },
                          )
                        }
                        className="mt-2 h-11 w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 text-sm font-black outline-none focus:border-blue-500"
                      >
                        <option value="available">
                          Disponible
                        </option>
                        <option value="out_of_stock">
                          Rupture
                        </option>
                        <option value="coming_soon">
                          Bientôt
                        </option>
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        void savePlan(
                          plan,
                        )
                      }
                      disabled={
                        savingPlanId ===
                        plan.id
                      }
                      className="h-11 rounded-[12px] bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingPlanId ===
                      plan.id
                        ? 'Enregistrement...'
                        : 'Enregistrer'}
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-100 pt-3">
                    <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={
                          plan.popular
                        }
                        onChange={(
                          event,
                        ) =>
                          updatePlan(
                            plan.id,
                            {
                              popular:
                                event.target.checked,
                            },
                          )
                        }
                      />
                      Populaire
                    </label>

                    <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={
                          plan.active
                        }
                        onChange={(
                          event,
                        ) =>
                          updatePlan(
                            plan.id,
                            {
                              active:
                                event.target.checked,
                            },
                          )
                        }
                      />
                      Actif
                    </label>

                    <span
                      dir="ltr"
                      className="text-xs text-slate-400"
                    >
                      {plan.plan_key}
                    </span>
                  </div>
                </article>
              )
            },
          )}

          {filteredPlans.length ===
            0 && (
            <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-black text-slate-600">
              Aucun plan trouvé.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminPlansPage
