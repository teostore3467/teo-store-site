import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useParams,
} from 'react-router-dom'

import {
  supabase,
} from '../../../lib/supabase'

type AvailabilityStatus =
  | 'available'
  | 'out_of_stock'
  | 'coming_soon'

type FulfillmentType =
  | 'account_credentials'
  | 'activation_code'
  | 'activation_link'
  | 'activation_code_or_link'
  | 'automatic_chat'
  | 'customer_email'
  | 'player_id_verification'
  | 'coming_soon'

type ServiceRow = {
  id: string
  slug: string
  name: string
  category: string
  availability:
    AvailabilityStatus
  description: string | null
  active: boolean
  sort_order: number
}

type GroupRow = {
  id: string
  service_id: string
  group_key: string
  name: string
  short_name: string
  availability:
    AvailabilityStatus
  description: string | null
  fulfillment:
    Record<string, unknown>
  active: boolean
  sort_order: number
}

type PlanRow = {
  id: string
  group_id: string
  plan_key: string
  label: string
  price: number
  currency: string
  availability:
    AvailabilityStatus
  popular: boolean
  active: boolean
  sort_order: number
}

type GroupWithPlans =
  GroupRow & {
    plans: PlanRow[]
  }

type ToastState = {
  type:
    | 'success'
    | 'error'
    | 'info'
  title: string
  message?: string
}

type NewGroupForm = {
  groupKey: string
  name: string
  shortName: string
  availability:
    AvailabilityStatus
  description: string
  fulfillmentType:
    FulfillmentType
}

type NewPlanForm = {
  groupId: string
  planKey: string
  label: string
  price: string
  availability:
    AvailabilityStatus
  popular: boolean
}

function defaultFulfillment(
  type:
    FulfillmentType,
) {
  const base = {
    type,
    availability:
      type ===
      'coming_soon'
        ? 'coming_soon'
        : 'available',
    customerFields: [],
    deliveryFields: [],
    requiresPaymentBeforeFulfillment:
      true,
    opensChatAfterPayment:
      false,
    requiresCustomerConfirmation:
      false,
    adminCanCloseChat:
      false,
  }

  if (
    type ===
    'account_credentials'
  ) {
    return {
      ...base,
      deliveryFields: [
        {
          id:
            'email',
          label:
            'E-mail',
          type:
            'email',
          sensitive:
            true,
        },
        {
          id:
            'password',
          label:
            'Mot de passe',
          type:
            'password',
          sensitive:
            true,
        },
        {
          id:
            'note',
          label:
            'Note',
          type:
            'note',
        },
      ],
    }
  }

  if (
    type ===
    'activation_code'
  ) {
    return {
      ...base,
      deliveryFields: [
        {
          id:
            'code',
          label:
            'Code',
          type:
            'code',
          sensitive:
            true,
        },
        {
          id:
            'note',
          label:
            'Note',
          type:
            'note',
        },
      ],
    }
  }

  if (
    type ===
    'activation_link'
  ) {
    return {
      ...base,
      deliveryFields: [
        {
          id:
            'activation-link',
          label:
            'Lien d’activation',
          type:
            'link',
          sensitive:
            true,
        },
        {
          id:
            'note',
          label:
            'Note',
          type:
            'note',
        },
      ],
    }
  }

  if (
    type ===
    'activation_code_or_link'
  ) {
    return {
      ...base,
      deliveryFields: [
        {
          id:
            'code',
          label:
            'Code',
          type:
            'code',
          sensitive:
            true,
        },
        {
          id:
            'link',
          label:
            'Lien',
          type:
            'link',
          sensitive:
            true,
        },
        {
          id:
            'note',
          label:
            'Note',
          type:
            'note',
        },
      ],
    }
  }

  if (
    type ===
    'automatic_chat'
  ) {
    return {
      ...base,
      opensChatAfterPayment:
        true,
      requiresCustomerConfirmation:
        true,
      adminCanCloseChat:
        true,
    }
  }

  if (
    type ===
    'customer_email'
  ) {
    return {
      ...base,
      customerFields: [
        {
          id:
            'customer-email',
          label:
            'E-mail',
          type:
            'email',
          placeholder:
            'Votre adresse e-mail',
          required:
            true,
        },
      ],
      deliveryFields: [
        {
          id:
            'link',
          label:
            'Lien',
          type:
            'link',
          sensitive:
            true,
        },
        {
          id:
            'note',
          label:
            'Note',
          type:
            'note',
        },
      ],
    }
  }

  if (
    type ===
    'player_id_verification'
  ) {
    return {
      ...base,
      customerFields: [
        {
          id:
            'player-id',
          label:
            'Player ID',
          type:
            'player_id',
          placeholder:
            'Entrez votre Player ID',
          required:
            true,
        },
        {
          id:
            'player-id-confirm',
          label:
            'Je confirme que le Player ID saisi est correct.',
          type:
            'checkbox',
          required:
            true,
        },
      ],
      deliveryFields: [
        {
          id:
            'verified-username',
          label:
            'Nom du joueur vérifié',
          type:
            'username',
        },
        {
          id:
            'note',
          label:
            'Note',
          type:
            'note',
        },
      ],
      requiresCustomerConfirmation:
        true,
    }
  }

  return base
}

function AdminServiceEditPage() {
  const {
    serviceSlug,
  } = useParams()

  const [
    service,
    setService,
  ] =
    useState<
      ServiceRow | null
    >(null)

  const [
    groups,
    setGroups,
  ] =
    useState<
      GroupWithPlans[]
    >([])

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true)

  const [
    isSavingService,
    setIsSavingService,
  ] =
    useState(false)

  const [
    toast,
    setToast,
  ] =
    useState<
      ToastState | null
    >(null)

  const [
    showGroupModal,
    setShowGroupModal,
  ] =
    useState(false)

  const [
    newGroup,
    setNewGroup,
  ] =
    useState<NewGroupForm>({
      groupKey: '',
      name: '',
      shortName: '',
      availability:
        'available',
      description: '',
      fulfillmentType:
        'account_credentials',
    })

  const [
    isCreatingGroup,
    setIsCreatingGroup,
  ] =
    useState(false)

  const [
    showPlanModal,
    setShowPlanModal,
  ] =
    useState(false)

  const [
    newPlan,
    setNewPlan,
  ] =
    useState<NewPlanForm>({
      groupId: '',
      planKey: '',
      label: '',
      price: '',
      availability:
        'available',
      popular:
        false,
    })

  const [
    isCreatingPlan,
    setIsCreatingPlan,
  ] =
    useState(false)

  const [
    savingPlanId,
    setSavingPlanId,
  ] =
    useState<
      string | null
    >(null)

  const [
    savingGroupId,
    setSavingGroupId,
  ] =
    useState<
      string | null
    >(null)

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<
      | {
          type:
            'group'
          id: string
          name: string
        }
      | {
          type:
            'plan'
          id: string
          name: string
        }
      | null
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

  const loadService =
    useCallback(
      async () => {
        if (
          !serviceSlug
        ) {
          setIsLoading(
            false,
          )
          return
        }

        setIsLoading(
          true,
        )

        const {
          data:
            serviceData,
          error:
            serviceError,
        } =
          await supabase
            .from(
              'digital_services',
            )
            .select(
              `
                id,
                slug,
                name,
                category,
                availability,
                description,
                active,
                sort_order
              `,
            )
            .eq(
              'slug',
              serviceSlug,
            )
            .maybeSingle()

        if (
          serviceError ||
          !serviceData
        ) {
          setService(
            null,
          )
          setGroups(
            [],
          )
          setIsLoading(
            false,
          )
          return
        }

        const nextService =
          serviceData as ServiceRow

        setService(
          nextService,
        )

        const {
          data:
            groupData,
          error:
            groupError,
        } =
          await supabase
            .from(
              'digital_service_groups',
            )
            .select(
              `
                id,
                service_id,
                group_key,
                name,
                short_name,
                availability,
                description,
                fulfillment,
                active,
                sort_order
              `,
            )
            .eq(
              'service_id',
              nextService.id,
            )
            .order(
              'sort_order',
              {
                ascending:
                  true,
              },
            )

        if (
          groupError
        ) {
          showToast({
            type:
              'error',
            title:
              'Chargement impossible',
            message:
              groupError.message,
          })

          setGroups(
            [],
          )
          setIsLoading(
            false,
          )
          return
        }

        const nextGroups =
          (groupData ??
            []) as GroupRow[]

        const groupIds =
          nextGroups.map(
            (
              group,
            ) =>
              group.id,
          )

        let plans:
          PlanRow[] =
            []

        if (
          groupIds.length >
          0
        ) {
          const {
            data:
              planData,
            error:
              planError,
          } =
            await supabase
              .from(
                'digital_service_plans',
              )
              .select(
                `
                  id,
                  group_id,
                  plan_key,
                  label,
                  price,
                  currency,
                  availability,
                  popular,
                  active,
                  sort_order
                `,
              )
              .in(
                'group_id',
                groupIds,
              )
              .order(
                'sort_order',
                {
                  ascending:
                    true,
                },
              )

          if (
            planError
          ) {
            showToast({
              type:
                'error',
              title:
                'Chargement des plans impossible',
              message:
                planError.message,
            })
          } else {
            plans =
              (planData ??
                []) as PlanRow[]
          }
        }

        setGroups(
          nextGroups.map(
            (
              group,
            ) => ({
              ...group,
              plans:
                plans.filter(
                  (
                    plan,
                  ) =>
                    plan.group_id ===
                    group.id,
                ),
            }),
          ),
        )

        setIsLoading(
          false,
        )
      },
      [
        serviceSlug,
        showToast,
      ],
    )

  useEffect(() => {
    void loadService()
  }, [
    loadService,
  ])

  const totalPlans =
    useMemo(
      () =>
        groups.reduce(
          (
            total,
            group,
          ) =>
            total +
            group.plans.length,
          0,
        ),
      [
        groups,
      ],
    )

  const updateServiceField =
    <K extends keyof ServiceRow>(
      key: K,
      value:
        ServiceRow[K],
    ) => {
      setService(
        (
          current,
        ) =>
          current
            ? {
                ...current,
                [key]:
                  value,
              }
            : current,
      )
    }

  const handleSaveService =
    async () => {
      if (
        !service
      ) {
        return
      }

      if (
        !service.name
          .trim() ||
        !service.category
          .trim()
      ) {
        showToast({
          type:
            'error',
          title:
            'Informations incomplètes',
          message:
            'Le nom et la catégorie sont obligatoires.',
        })
        return
      }

      setIsSavingService(
        true,
      )

      const {
        error,
      } =
        await supabase
          .from(
            'digital_services',
          )
          .update({
            name:
              service.name.trim(),
            category:
              service.category.trim(),
            description:
              service.description
                ?.trim() ||
              null,
            availability:
              service.availability,
            active:
              service.active,
            sort_order:
              Number(
                service.sort_order,
              ),
          })
          .eq(
            'id',
            service.id,
          )

      setIsSavingService(
        false,
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
          'Service enregistré',
      })

      await loadService()
    }

  const handleCreateGroup =
    async () => {
      if (
        !service
      ) {
        return
      }

      const groupKey =
        newGroup.groupKey
          .trim()
          .toLowerCase()
          .replace(
            /[^a-z0-9-]+/g,
            '-',
          )
          .replace(
            /^-+|-+$/g,
            '',
          )

      if (
        !groupKey ||
        !newGroup.name
          .trim() ||
        !newGroup.shortName
          .trim()
      ) {
        showToast({
          type:
            'error',
          title:
            'Informations incomplètes',
          message:
            'L’identifiant, le nom et le nom court sont obligatoires.',
        })
        return
      }

      setIsCreatingGroup(
        true,
      )

      const {
        error,
      } =
        await supabase
          .from(
            'digital_service_groups',
          )
          .insert({
            service_id:
              service.id,
            group_key:
              groupKey,
            name:
              newGroup.name.trim(),
            short_name:
              newGroup.shortName.trim(),
            availability:
              newGroup.availability,
            description:
              newGroup.description
                .trim() ||
              null,
            fulfillment:
              defaultFulfillment(
                newGroup.fulfillmentType,
              ),
            active:
              true,
            sort_order:
              groups.length,
          })

      setIsCreatingGroup(
        false,
      )

      if (
        error
      ) {
        showToast({
          type:
            'error',
          title:
            'Création impossible',
          message:
            error.message,
        })
        return
      }

      setShowGroupModal(
        false,
      )

      setNewGroup({
        groupKey: '',
        name: '',
        shortName: '',
        availability:
          'available',
        description: '',
        fulfillmentType:
          'account_credentials',
      })

      await loadService()

      showToast({
        type:
          'success',
        title:
          'Groupe ajouté',
      })
    }

  const handleSaveGroup =
    async (
      group:
        GroupWithPlans,
    ) => {
      setSavingGroupId(
        group.id,
      )

      const {
        error,
      } =
        await supabase
          .from(
            'digital_service_groups',
          )
          .update({
            name:
              group.name.trim(),
            short_name:
              group.short_name.trim(),
            description:
              group.description
                ?.trim() ||
              null,
            availability:
              group.availability,
            active:
              group.active,
            sort_order:
              Number(
                group.sort_order,
              ),
          })
          .eq(
            'id',
            group.id,
          )

      setSavingGroupId(
        null,
      )

      if (
        error
      ) {
        showToast({
          type:
            'error',
          title:
            'Groupe non enregistré',
          message:
            error.message,
        })
        return
      }

      showToast({
        type:
          'success',
        title:
          'Groupe enregistré',
      })

      await loadService()
    }

  const updateGroup =
    (
      groupId: string,
      patch:
        Partial<GroupWithPlans>,
    ) => {
      setGroups(
        (
          current,
        ) =>
          current.map(
            (
              group,
            ) =>
              group.id ===
              groupId
                ? {
                    ...group,
                    ...patch,
                  }
                : group,
          ),
      )
    }

  const openPlanModal =
    (
      groupId:
        string,
    ) => {
      setNewPlan({
        groupId,
        planKey: '',
        label: '',
        price: '',
        availability:
          'available',
        popular:
          false,
      })
      setShowPlanModal(
        true,
      )
    }

  const handleCreatePlan =
    async () => {
      const planKey =
        newPlan.planKey
          .trim()
          .toLowerCase()
          .replace(
            /[^a-z0-9-]+/g,
            '-',
          )
          .replace(
            /^-+|-+$/g,
            '',
          )

      const price =
        Number(
          newPlan.price,
        )

      if (
        !newPlan.groupId ||
        !planKey ||
        !newPlan.label
          .trim() ||
        !Number.isFinite(
          price,
        ) ||
        price < 0
      ) {
        showToast({
          type:
            'error',
          title:
            'Informations invalides',
          message:
            'Vérifiez l’identifiant, le libellé et le prix.',
        })
        return
      }

      const targetGroup =
        groups.find(
          (
            group,
          ) =>
            group.id ===
            newPlan.groupId,
        )

      setIsCreatingPlan(
        true,
      )

      const {
        error,
      } =
        await supabase
          .from(
            'digital_service_plans',
          )
          .insert({
            group_id:
              newPlan.groupId,
            plan_key:
              planKey,
            label:
              newPlan.label.trim(),
            price,
            currency:
              'MRU',
            availability:
              newPlan.availability,
            popular:
              newPlan.popular,
            active:
              true,
            sort_order:
              targetGroup
                ?.plans.length ??
              0,
          })

      setIsCreatingPlan(
        false,
      )

      if (
        error
      ) {
        showToast({
          type:
            'error',
          title:
            'Création impossible',
          message:
            error.message,
        })
        return
      }

      setShowPlanModal(
        false,
      )

      await loadService()

      showToast({
        type:
          'success',
        title:
          'Plan ajouté',
      })
    }

  const updatePlan =
    (
      groupId: string,
      planId: string,
      patch:
        Partial<PlanRow>,
    ) => {
      setGroups(
        (
          current,
        ) =>
          current.map(
            (
              group,
            ) =>
              group.id ===
              groupId
                ? {
                    ...group,
                    plans:
                      group.plans.map(
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
                  }
                : group,
          ),
      )
    }

  const handleSavePlan =
    async (
      plan:
        PlanRow,
    ) => {
      if (
        !plan.label
          .trim() ||
        !Number.isFinite(
          Number(
            plan.price,
          ),
        ) ||
        Number(
          plan.price,
        ) < 0
      ) {
        showToast({
          type:
            'error',
          title:
            'Plan invalide',
          message:
            'Vérifiez le libellé et le prix.',
        })
        return
      }

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
            'Plan non enregistré',
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
      })

      await loadService()
    }

  const handleDelete =
    async () => {
      if (
        !deleteTarget
      ) {
        return
      }

      const table =
        deleteTarget.type ===
        'group'
          ? 'digital_service_groups'
          : 'digital_service_plans'

      const {
        error,
      } =
        await supabase
          .from(
            table,
          )
          .delete()
          .eq(
            'id',
            deleteTarget.id,
          )

      if (
        error
      ) {
        showToast({
          type:
            'error',
          title:
            'Suppression impossible',
          message:
            error.message,
        })
        return
      }

      setDeleteTarget(
        null,
      )

      await loadService()

      showToast({
        type:
          'success',
        title:
          'Élément supprimé',
      })
    }

  if (
    isLoading
  ) {
    return (
      <div className="rounded-[22px] border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400">
        Chargement du service...
      </div>
    )
  }

  if (
    !service
  ) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-[22px] border border-slate-200 bg-white p-6 text-center">
          <h2 className="text-xl font-black text-slate-950">
            Service introuvable
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Le service demandé n’existe pas dans le catalogue Supabase.
          </p>
          <Link
            to="/admin/services"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-black text-white"
          >
            Retour aux services
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-10">
      {toast && (
        <div className="fixed right-4 top-4 z-[250] w-[calc(100%-2rem)] max-w-sm">
          <div
            className={[
              'rounded-[18px] border bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.20)]',
              toast.type ===
              'success'
                ? 'border-emerald-100'
                : toast.type ===
                    'error'
                  ? 'border-rose-100'
                  : 'border-blue-100',
            ].join(
              ' ',
            )}
          >
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

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            to="/admin/services"
            className="text-sm font-black text-blue-600 hover:text-blue-700"
          >
            ← Services
          </Link>

          <h1 className="mt-2 text-3xl font-black text-slate-950">
            {service.name}
          </h1>

          <p
            dir="ltr"
            className="mt-1 text-left text-sm font-bold text-slate-400"
          >
            {service.slug}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setShowGroupModal(
                true,
              )
            }
            className="h-11 rounded-[13px] bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700"
          >
            + Ajouter un groupe
          </button>

          <button
            type="button"
            onClick={() =>
              void handleSaveService()
            }
            disabled={
              isSavingService
            }
            className="h-11 rounded-[13px] bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSavingService
              ? 'Enregistrement...'
              : 'Enregistrer le service'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_300px] xl:items-start">
        <section className="rounded-[22px] border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black text-slate-950">
            Informations principales
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-black text-slate-700">
                Nom
              </span>
              <input
                type="text"
                value={
                  service.name
                }
                onChange={(
                  event,
                ) =>
                  updateServiceField(
                    'name',
                    event.target.value,
                  )
                }
                className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-700">
                Catégorie
              </span>
              <input
                type="text"
                value={
                  service.category
                }
                onChange={(
                  event,
                ) =>
                  updateServiceField(
                    'category',
                    event.target.value,
                  )
                }
                className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-700">
                Disponibilité
              </span>
              <select
                value={
                  service.availability
                }
                onChange={(
                  event,
                ) =>
                  updateServiceField(
                    'availability',
                    event.target
                      .value as AvailabilityStatus,
                  )
                }
                className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-blue-500"
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

            <label className="block">
              <span className="text-sm font-black text-slate-700">
                Ordre
              </span>
              <input
                type="number"
                min="0"
                value={
                  service.sort_order
                }
                onChange={(
                  event,
                ) =>
                  updateServiceField(
                    'sort_order',
                    Number(
                      event.target.value,
                    ),
                  )
                }
                className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </label>

            <label className="md:col-span-2">
              <span className="text-sm font-black text-slate-700">
                Description
              </span>
              <textarea
                rows={4}
                value={
                  service.description ??
                  ''
                }
                onChange={(
                  event,
                ) =>
                  updateServiceField(
                    'description',
                    event.target.value,
                  )
                }
                className="mt-2 w-full resize-none rounded-[14px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 outline-none focus:border-blue-500 focus:bg-white"
              />
            </label>

            <label className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <input
                type="checkbox"
                checked={
                  service.active
                }
                onChange={(
                  event,
                ) =>
                  updateServiceField(
                    'active',
                    event.target.checked,
                  )
                }
                className="h-4 w-4"
              />
              <div>
                <p className="text-sm font-black text-slate-800">
                  Service actif
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Désactivez-le pour le retirer du catalogue public sans supprimer ses données.
                </p>
              </div>
            </label>
          </div>
        </section>

        <aside
          className="rounded-[22px] p-5 text-white xl:sticky xl:top-24"
          style={{
            background:
              'linear-gradient(135deg,#020617 0%,#10265b 55%,#312e81 100%)',
          }}
        >
          <p className="text-xs font-black uppercase tracking-wide text-blue-300">
            Résumé
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[14px] border border-white/10 bg-white/[0.06] p-3">
              <p className="text-xs font-black text-white/40">
                Groupes
              </p>
              <p className="mt-1 text-2xl font-black">
                {groups.length}
              </p>
            </div>

            <div className="rounded-[14px] border border-white/10 bg-white/[0.06] p-3">
              <p className="text-xs font-black text-white/40">
                Plans
              </p>
              <p className="mt-1 text-2xl font-black">
                {totalPlans}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-[14px] border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs font-black text-white/40">
              État
            </p>
            <p className="mt-1 text-sm font-black">
              {service.active
                ? 'Actif'
                : 'Désactivé'}
            </p>
          </div>
        </aside>
      </div>

      <section className="mt-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Groupes et plans
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Modifiez les prix, disponibilités et plans sans toucher au code source.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowGroupModal(
                true,
              )
            }
            className="rounded-[12px] border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm font-black text-indigo-700 hover:bg-indigo-100"
          >
            + Groupe
          </button>
        </div>

        <div className="space-y-4">
          {groups.map(
            (
              group,
            ) => (
              <article
                key={
                  group.id
                }
                className="overflow-hidden rounded-[22px] border border-slate-200 bg-white"
              >
                <div className="border-b border-slate-100 p-5">
                  <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_180px_auto] lg:items-end">
                    <label>
                      <span className="text-xs font-black uppercase text-slate-400">
                        Nom du groupe
                      </span>
                      <input
                        type="text"
                        value={
                          group.name
                        }
                        onChange={(
                          event,
                        ) =>
                          updateGroup(
                            group.id,
                            {
                              name:
                                event.target.value,
                            },
                          )
                        }
                        className="mt-2 h-11 w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-black uppercase text-slate-400">
                        Nom court
                      </span>
                      <input
                        type="text"
                        value={
                          group.short_name
                        }
                        onChange={(
                          event,
                        ) =>
                          updateGroup(
                            group.id,
                            {
                              short_name:
                                event.target.value,
                            },
                          )
                        }
                        className="mt-2 h-11 w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-black uppercase text-slate-400">
                        Disponibilité
                      </span>
                      <select
                        value={
                          group.availability
                        }
                        onChange={(
                          event,
                        ) =>
                          updateGroup(
                            group.id,
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

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void handleSaveGroup(
                            group,
                          )
                        }
                        disabled={
                          savingGroupId ===
                          group.id
                        }
                        className="h-11 rounded-[12px] bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50"
                      >
                        {savingGroupId ===
                        group.id
                          ? 'Enregistrement...'
                          : 'Enregistrer'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type:
                              'group',
                            id:
                              group.id,
                            name:
                              group.name,
                          })
                        }
                        className="h-11 rounded-[12px] border border-rose-100 px-3 text-sm font-black text-rose-600 hover:bg-rose-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={
                          group.active
                        }
                        onChange={(
                          event,
                        ) =>
                          updateGroup(
                            group.id,
                            {
                              active:
                                event.target.checked,
                            },
                          )
                        }
                      />
                      Groupe actif
                    </label>

                    <span className="text-xs text-slate-400">
                      Type de livraison :{' '}
                      <strong className="text-slate-600">
                        {String(
                          group.fulfillment?.[
                            'type'
                          ] ??
                            '—',
                        )}
                      </strong>
                    </span>

                    <span
                      dir="ltr"
                      className="text-xs text-slate-400"
                    >
                      {group.group_key}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-black text-slate-950">
                      Plans
                    </h3>

                    <button
                      type="button"
                      onClick={() =>
                        openPlanModal(
                          group.id,
                        )
                      }
                      className="rounded-[11px] bg-blue-600 px-3 py-2 text-sm font-black text-white hover:bg-blue-700"
                    >
                      + Ajouter un plan
                    </button>
                  </div>

                  {group.plans.length >
                  0 ? (
                    <div className="mt-4 space-y-3">
                      {group.plans.map(
                        (
                          plan,
                        ) => (
                          <div
                            key={
                              plan.id
                            }
                            className="rounded-[16px] border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="grid gap-3 lg:grid-cols-[1.2fr_160px_180px_auto] lg:items-end">
                              <label>
                                <span className="text-xs font-black uppercase text-slate-400">
                                  Libellé
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
                                      group.id,
                                      plan.id,
                                      {
                                        label:
                                          event.target.value,
                                      },
                                    )
                                  }
                                  className="mt-2 h-11 w-full rounded-[12px] border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500"
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
                                      group.id,
                                      plan.id,
                                      {
                                        price:
                                          Number(
                                            event.target.value,
                                          ),
                                      },
                                    )
                                  }
                                  className="mt-2 h-11 w-full rounded-[12px] border border-slate-200 bg-white px-3 text-sm font-black outline-none focus:border-blue-500"
                                />
                              </label>

                              <label>
                                <span className="text-xs font-black uppercase text-slate-400">
                                  Disponibilité
                                </span>
                                <select
                                  value={
                                    plan.availability
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updatePlan(
                                      group.id,
                                      plan.id,
                                      {
                                        availability:
                                          event.target
                                            .value as AvailabilityStatus,
                                      },
                                    )
                                  }
                                  className="mt-2 h-11 w-full rounded-[12px] border border-slate-200 bg-white px-3 text-sm font-black outline-none focus:border-blue-500"
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

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleSavePlan(
                                      plan,
                                    )
                                  }
                                  disabled={
                                    savingPlanId ===
                                    plan.id
                                  }
                                  className="h-11 rounded-[12px] bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-50"
                                >
                                  {savingPlanId ===
                                  plan.id
                                    ? 'Enregistrement...'
                                    : 'Enregistrer'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteTarget({
                                      type:
                                        'plan',
                                      id:
                                        plan.id,
                                      name:
                                        plan.label,
                                    })
                                  }
                                  className="h-11 rounded-[12px] border border-rose-100 px-3 text-sm font-black text-rose-600 hover:bg-rose-50"
                                >
                                  ×
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-4">
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
                                      group.id,
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
                                      group.id,
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
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[14px] border border-dashed border-slate-300 p-5 text-center text-sm font-bold text-slate-400">
                      Aucun plan dans ce groupe.
                    </div>
                  )}
                </div>
              </article>
            ),
          )}

          {groups.length ===
            0 && (
            <div className="rounded-[20px] border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm font-black text-slate-700">
                Aucun groupe
              </p>
              <button
                type="button"
                onClick={() =>
                  setShowGroupModal(
                    true,
                  )
                }
                className="mt-4 rounded-[12px] bg-indigo-600 px-4 py-2.5 text-sm font-black text-white"
              >
                Ajouter le premier groupe
              </button>
            </div>
          )}
        </div>
      </section>

      {showGroupModal && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[26px] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-indigo-600">
                  Nouveau groupe
                </p>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Ajouter une formule de service
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowGroupModal(
                    false,
                  )
                }
                className="h-10 w-10 rounded-full bg-slate-100 text-lg font-black text-slate-500"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Identifiant *
                </span>
                <input
                  type="text"
                  value={
                    newGroup.groupKey
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewGroup(
                      (
                        current,
                      ) => ({
                        ...current,
                        groupKey:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="ex: compte-prive"
                  className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Nom *
                </span>
                <input
                  type="text"
                  value={
                    newGroup.name
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewGroup(
                      (
                        current,
                      ) => ({
                        ...current,
                        name:
                          event.target.value,
                      }),
                    )
                  }
                  className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Nom court *
                </span>
                <input
                  type="text"
                  value={
                    newGroup.shortName
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewGroup(
                      (
                        current,
                      ) => ({
                        ...current,
                        shortName:
                          event.target.value,
                      }),
                    )
                  }
                  className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Type de livraison
                </span>
                <select
                  value={
                    newGroup.fulfillmentType
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewGroup(
                      (
                        current,
                      ) => ({
                        ...current,
                        fulfillmentType:
                          event.target
                            .value as FulfillmentType,
                      }),
                    )
                  }
                  className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-blue-500"
                >
                  <option value="account_credentials">
                    Identifiants du compte
                  </option>
                  <option value="activation_code">
                    Code d’activation
                  </option>
                  <option value="activation_link">
                    Lien d’activation
                  </option>
                  <option value="activation_code_or_link">
                    Code ou lien
                  </option>
                  <option value="automatic_chat">
                    Discussion Admin
                  </option>
                  <option value="customer_email">
                    Activation par e-mail
                  </option>
                  <option value="player_id_verification">
                    Vérification Player ID
                  </option>
                  <option value="coming_soon">
                    Bientôt disponible
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Disponibilité
                </span>
                <select
                  value={
                    newGroup.availability
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewGroup(
                      (
                        current,
                      ) => ({
                        ...current,
                        availability:
                          event.target
                            .value as AvailabilityStatus,
                      }),
                    )
                  }
                  className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-blue-500"
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

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Description
                </span>
                <textarea
                  rows={4}
                  value={
                    newGroup.description
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewGroup(
                      (
                        current,
                      ) => ({
                        ...current,
                        description:
                          event.target.value,
                      }),
                    )
                  }
                  className="mt-2 w-full resize-none rounded-[14px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowGroupModal(
                    false,
                  )
                }
                className="h-12 rounded-[14px] border border-slate-200 text-sm font-black text-slate-700"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleCreateGroup()
                }
                disabled={
                  isCreatingGroup
                }
                className="h-12 rounded-[14px] bg-indigo-600 text-sm font-black text-white disabled:opacity-50"
              >
                {isCreatingGroup
                  ? 'Création...'
                  : 'Ajouter le groupe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlanModal && (
        <div className="fixed inset-0 z-[185] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[26px] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">
                  Nouveau plan
                </p>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Ajouter un prix / une durée
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowPlanModal(
                    false,
                  )
                }
                className="h-10 w-10 rounded-full bg-slate-100 text-lg font-black text-slate-500"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Identifiant *
                </span>
                <input
                  type="text"
                  value={
                    newPlan.planKey
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewPlan(
                      (
                        current,
                      ) => ({
                        ...current,
                        planKey:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="ex: netflix-3m"
                  className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Libellé *
                </span>
                <input
                  type="text"
                  value={
                    newPlan.label
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewPlan(
                      (
                        current,
                      ) => ({
                        ...current,
                        label:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="ex: 3 Mois"
                  className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Prix MRU *
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    newPlan.price
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewPlan(
                      (
                        current,
                      ) => ({
                        ...current,
                        price:
                          event.target.value,
                      }),
                    )
                  }
                  className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Disponibilité
                </span>
                <select
                  value={
                    newPlan.availability
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewPlan(
                      (
                        current,
                      ) => ({
                        ...current,
                        availability:
                          event.target
                            .value as AvailabilityStatus,
                      }),
                    )
                  }
                  className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-blue-500"
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

              <label className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={
                    newPlan.popular
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewPlan(
                      (
                        current,
                      ) => ({
                        ...current,
                        popular:
                          event.target.checked,
                      }),
                    )
                  }
                />
                <span className="text-sm font-black text-slate-700">
                  Marquer comme populaire
                </span>
              </label>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowPlanModal(
                    false,
                  )
                }
                className="h-12 rounded-[14px] border border-slate-200 text-sm font-black text-slate-700"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleCreatePlan()
                }
                disabled={
                  isCreatingPlan
                }
                className="h-12 rounded-[14px] bg-blue-600 text-sm font-black text-white disabled:opacity-50"
              >
                {isCreatingPlan
                  ? 'Création...'
                  : 'Ajouter le plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-black text-slate-950">
              Confirmer la suppression
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Vous allez supprimer « {deleteTarget.name} ».
              {deleteTarget.type ===
              'group'
                ? ' Tous les plans de ce groupe seront également supprimés.'
                : ''}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(
                    null,
                  )
                }
                className="h-11 rounded-[12px] border border-slate-200 text-sm font-black text-slate-700"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDelete()
                }
                className="h-11 rounded-[12px] bg-rose-600 text-sm font-black text-white hover:bg-rose-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminServiceEditPage
