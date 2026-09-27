import { supabase } from '../../../lib/supabase'

import {
  serviceCatalog,
  type ServiceCatalogItem,
  type ServiceGroup,
  type ServicePlan,
} from './serviceCatalog'

import type {
  ServiceFulfillmentConfig,
} from '../types/serviceFulfillment'

type ServiceRow = {
  id: string
  slug: string
  name: string
  category: string
  availability: ServiceCatalogItem['availability']
  description: string | null
  sort_order: number
}

type GroupRow = {
  id: string
  service_id: string
  group_key: string
  name: string
  short_name: string
  availability: ServiceGroup['availability']
  description: string | null
  fulfillment: ServiceFulfillmentConfig
  sort_order: number
}

type PlanRow = {
  id: string
  group_id: string
  plan_key: string
  label: string
  price: number | string
  currency: string
  availability: ServicePlan['availability']
  popular: boolean
  sort_order: number
}

type PublicServiceReviewRpcRow = {
  id: string
  rating: number
  comment: string | null
  created_at: string
}

function mapCatalog(
  services: ServiceRow[],
  groups: GroupRow[],
  plans: PlanRow[],
): ServiceCatalogItem[] {
  const plansByGroup = new Map<
    string,
    ServicePlan[]
  >()

  for (const plan of plans) {
    const current =
      plansByGroup.get(
        plan.group_id,
      ) ?? []

    const parsedPrice =
      Number(plan.price)

    current.push({
      id: plan.plan_key,
      label: plan.label,
      price: Number.isFinite(
        parsedPrice,
      )
        ? parsedPrice
        : 0,
      currency: 'MRU',
      availability:
        plan.availability,
      popular: plan.popular,
    })

    plansByGroup.set(
      plan.group_id,
      current,
    )
  }

  const groupsByService = new Map<
    string,
    ServiceGroup[]
  >()

  for (const group of groups) {
    const current =
      groupsByService.get(
        group.service_id,
      ) ?? []

    current.push({
      id: group.group_key,
      name: group.name,
      shortName:
        group.short_name,
      availability:
        group.availability,
      fulfillment:
        group.fulfillment,
      plans:
        plansByGroup.get(
          group.id,
        ) ?? [],
      description:
        group.description ??
        undefined,
    })

    groupsByService.set(
      group.service_id,
      current,
    )
  }

  return services.map(
    (service) => ({
      slug: service.slug,
      name: service.name,
      category:
        service.category,
      availability:
        service.availability,
      description:
        service.description ??
        undefined,
      groups:
        groupsByService.get(
          service.id,
        ) ?? [],
    }),
  )
}

function hasUsablePlans(
  service: ServiceCatalogItem,
) {
  return service.groups.some(
    (group) =>
      group.plans.some(
        (plan) =>
          Number.isFinite(
            Number(plan.price),
          ) &&
          Number(plan.price) >= 0,
      ),
  )
}

function mergeWithLocalCatalog(
  remoteCatalog: ServiceCatalogItem[],
): ServiceCatalogItem[] {
  /**
   * serviceCatalog المحلي يبقى fallback.
   *
   * إذا كانت الخدمة موجودة بشكل كامل
   * في Supabase، نستخدم نسخة Supabase.
   *
   * إذا كانت الخدمة غير موجودة في Supabase
   * أو موجودة بدون groups/plans صالحة،
   * نستخدم النسخة الموجودة في serviceCatalog.
   *
   * هذا يمنع ظهور "Bientôt" أو اختفاء السعر
   * فقط لأن بيانات Supabase ناقصة.
   */

  const merged =
    serviceCatalog.map(
      (localService) => {
        const remoteService =
          remoteCatalog.find(
            (service) =>
              service.slug ===
              localService.slug,
          )

        if (!remoteService) {
          return localService
        }

        if (
          !hasUsablePlans(
            remoteService,
          )
        ) {
          return localService
        }

        return remoteService
      },
    )

  /**
   * إذا كانت هناك خدمة جديدة في Supabase
   * وغير موجودة بعد في serviceCatalog،
   * لا نحذفها.
   */

  for (const remoteService of remoteCatalog) {
    const alreadyExists =
      merged.some(
        (service) =>
          service.slug ===
          remoteService.slug,
      )

    if (
      !alreadyExists &&
      hasUsablePlans(
        remoteService,
      )
    ) {
      merged.push(
        remoteService,
      )
    }
  }

  return merged
}

export async function fetchPublicServiceCatalog(): Promise<
  ServiceCatalogItem[]
> {
  try {
    const servicesResult =
      await supabase
        .from(
          'digital_services',
        )
        .select(`
          id,
          slug,
          name,
          category,
          availability,
          description,
          sort_order
        `)
        .eq(
          'active',
          true,
        )
        .order(
          'sort_order',
          {
            ascending: true,
          },
        )

    if (
      servicesResult.error
    ) {
      console.error(
        'Unable to load digital_services:',
        servicesResult.error,
      )

      return serviceCatalog
    }

    const services =
      (servicesResult.data ??
        []) as ServiceRow[]

    if (
      services.length === 0
    ) {
      return serviceCatalog
    }

    const serviceIds =
      services.map(
        (service) =>
          service.id,
      )

    const groupsResult =
      await supabase
        .from(
          'digital_service_groups',
        )
        .select(`
          id,
          service_id,
          group_key,
          name,
          short_name,
          availability,
          description,
          fulfillment,
          sort_order
        `)
        .in(
          'service_id',
          serviceIds,
        )
        .eq(
          'active',
          true,
        )
        .order(
          'sort_order',
          {
            ascending: true,
          },
        )

    if (
      groupsResult.error
    ) {
      console.error(
        'Unable to load digital_service_groups:',
        groupsResult.error,
      )

      return serviceCatalog
    }

    const groups =
      (groupsResult.data ??
        []) as GroupRow[]

    if (
      groups.length === 0
    ) {
      return serviceCatalog
    }

    const groupIds =
      groups.map(
        (group) =>
          group.id,
      )

    const plansResult =
      await supabase
        .from(
          'digital_service_plans',
        )
        .select(`
          id,
          group_id,
          plan_key,
          label,
          price,
          currency,
          availability,
          popular,
          sort_order
        `)
        .in(
          'group_id',
          groupIds,
        )
        .eq(
          'active',
          true,
        )
        .order(
          'sort_order',
          {
            ascending: true,
          },
        )

    if (
      plansResult.error
    ) {
      console.error(
        'Unable to load digital_service_plans:',
        plansResult.error,
      )

      return serviceCatalog
    }

    const plans =
      (plansResult.data ??
        []) as PlanRow[]

    const remoteCatalog =
      mapCatalog(
        services,
        groups,
        plans,
      )

    return mergeWithLocalCatalog(
      remoteCatalog,
    )
  } catch (error) {
    console.error(
      'Unable to load public service catalog:',
      error,
    )

    return serviceCatalog
  }
}

export async function fetchPublicServiceBySlug(
  slug: string,
): Promise<ServiceCatalogItem | null> {
  const normalizedSlug =
    slug
      .trim()
      .toLowerCase()

  const catalog =
    await fetchPublicServiceCatalog()

  return (
    catalog.find(
      (service) =>
        service.slug
          .trim()
          .toLowerCase() ===
        normalizedSlug,
    ) ?? null
  )
}

export type DigitalServiceReview = {
  id: string
  rating: number
  comment: string | null
  created_at: string
}

export async function fetchPublicServiceReviews(
  serviceSlug: string,
): Promise<DigitalServiceReview[]> {
  try {
    const normalizedSlug =
      serviceSlug
        .trim()
        .toLowerCase()

    if (
      normalizedSlug.length ===
      0
    ) {
      return []
    }

    const {
      data,
      error,
    } =
      await supabase.rpc(
        'get_public_service_reviews',
        {
          p_service_slug:
            normalizedSlug,

          p_limit:
            50,
        },
      )

    if (error) {
      console.error(
        'Unable to load digital service reviews:',
        error,
      )

      return []
    }

    const rows =
      (data ??
        []) as PublicServiceReviewRpcRow[]

    return rows
      .map(
        (
          review:
            PublicServiceReviewRpcRow,
        ): DigitalServiceReview => ({
          id:
            review.id,

          rating:
            Number(
              review.rating,
            ),

          comment:
            review.comment ??
            null,

          created_at:
            review.created_at,
        }),
      )
      .filter(
        (
          review:
            DigitalServiceReview,
        ) =>
          Number.isFinite(
            review.rating,
          ) &&
          review.rating >=
            1 &&
          review.rating <=
            5,
      )
  } catch (error) {
    console.error(
      'Unable to load digital service reviews:',
      error,
    )

    return []
  }
}