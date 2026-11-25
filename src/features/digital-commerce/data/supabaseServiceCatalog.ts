import { supabase } from '../../../lib/supabase'

import {
  type ServiceCatalogItem,
  type ServiceGroup,
  type ServicePlan,
} from './serviceCatalog'

import type {
  ServiceFulfillmentConfig,
} from '../types/serviceFulfillment'

export type PublicServicePlan = ServicePlan & {
  databaseId?: string
  delivery_minutes?: number | null
  warranty_days?: number | null
  warranty_full_subscription?: boolean | null
  validity_days?: number | null
}

export type PublicServiceGroup = Omit<ServiceGroup, 'plans'> & {
  databaseId?: string
  plans: PublicServicePlan[]
}

export type PublicServiceCatalogItem = Omit<ServiceCatalogItem, 'groups'> & {
  groups: PublicServiceGroup[]
  description_ar?: string | null
  description_fr?: string | null
  delivery_minutes?: number | null
  warranty_days?: number | null
  warranty_full_subscription?: boolean | null
  validity_days?: number | null
}

type ServiceRow = {
  name_ar: string | null
  name_fr: string | null
  image_url: string | null

  id: string
  slug: string
  name: string
  category: string
  availability: ServiceCatalogItem['availability']
  description: string | null
  description_ar: string | null
  description_fr: string | null
  delivery_minutes: number | null
  warranty_days: number | null
  warranty_full_subscription: boolean | null
  validity_days: number | null
  sort_order: number
}

type GroupRow = {
  name_ar: string | null
  name_fr: string | null
  short_name_ar: string | null
  short_name_fr: string | null
  image_url: string | null
  description_ar: string | null
  description_fr: string | null
  instructions_ar: string | null
  instructions_fr: string | null
  delivery_minutes: number | null
  warranty_days: number | null
  validity_days: number | null
  warranty_full_subscription: boolean | null
  description_enabled: boolean | null
  instructions_enabled: boolean | null

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
  label_ar: string | null
  label_fr: string | null
  old_price: number | null
  duration_value: number | null
  duration_unit: string | null

  id: string
  group_id: string
  plan_key: string
  label: string
  price: number | string
  currency: string
  availability: ServicePlan['availability']
  popular: boolean
  delivery_minutes: number | null
  warranty_days: number | null
  warranty_full_subscription: boolean | null
  validity_days: number | null
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
): PublicServiceCatalogItem[] {
  const plansByGroup = new Map<string, PublicServicePlan[]>()

  for (const plan of plans) {
    const parsedPrice = Number(plan.price)

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || plan.currency !== 'MRU') {
      console.warn('Invalid service plan price:', plan.id)
      continue
    }

    const current = plansByGroup.get(plan.group_id) ?? []

    current.push({
      id: plan.plan_key,
    label_ar: plan.label_ar,
    label_fr: plan.label_fr,
    old_price: plan.old_price,
    duration_value: plan.duration_value,
    duration_unit: plan.duration_unit,

      databaseId: plan.id,
      label: plan.label,
      price: parsedPrice,
      currency: 'MRU',
      availability: plan.availability,
      popular: plan.popular,
      delivery_minutes: plan.delivery_minutes,
      warranty_days: plan.warranty_days,
      warranty_full_subscription: plan.warranty_full_subscription,
      validity_days: plan.validity_days,
    })

    plansByGroup.set(plan.group_id, current)
  }

  const groupsByService = new Map<string, PublicServiceGroup[]>()

  for (const group of groups) {
    const current = groupsByService.get(group.service_id) ?? []

    current.push({
      id: group.group_key,
    name_ar: group.name_ar,
    name_fr: group.name_fr,
    short_name_ar: group.short_name_ar,
    short_name_fr: group.short_name_fr,
    image_url: group.image_url,
    description_ar: group.description_ar,
    description_fr: group.description_fr,
    instructions_ar: group.instructions_ar,
    instructions_fr: group.instructions_fr,
    delivery_minutes: group.delivery_minutes,
    warranty_days: group.warranty_days,
    validity_days: group.validity_days,
    warranty_full_subscription: group.warranty_full_subscription,
    description_enabled: group.description_enabled,
    instructions_enabled: group.instructions_enabled,

      databaseId: group.id,
      name: group.name,
      shortName: group.short_name,
      availability: group.availability,
      fulfillment: group.fulfillment,
      plans: plansByGroup.get(group.id) ?? [],
      description: group.description ?? undefined,
    })

    groupsByService.set(group.service_id, current)
  }

  return services.map((service) => ({
    slug: service.slug,
    name_ar: service.name_ar,
    name_fr: service.name_fr,
    image_url: service.image_url,

    name: service.name,
    category: service.category,
    availability: service.availability,
    description: service.description ?? undefined,
    description_ar: service.description_ar,
    description_fr: service.description_fr,
    delivery_minutes: service.delivery_minutes,
    warranty_days: service.warranty_days,
    warranty_full_subscription: service.warranty_full_subscription,
    validity_days: service.validity_days,
    groups: groupsByService.get(service.id) ?? [],
  }))
}

export async function fetchPublicServiceCatalog(): Promise<
  PublicServiceCatalogItem[]
> {
  try {
    const servicesResult = await supabase
      .from('digital_services')
      .select(`
        id,
        slug,
        name_ar, name_fr, image_url,
        name,
        category,
        availability,
        description,
        description_ar,
        description_fr,
        delivery_minutes,
        warranty_days,
        warranty_full_subscription,
        validity_days,
        sort_order
      `)
      .eq('active', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })

    if (servicesResult.error) {
      console.error('Unable to load digital_services:', servicesResult.error)
      return []
    }

    const services = (servicesResult.data ?? []) as ServiceRow[]

    if (services.length === 0) {
      return []
    }

    const serviceIds = services.map((service) => service.id)

    const groupsResult = await supabase
      .from('digital_service_groups')
      .select(`
        id,
        service_id,
        group_key,
        name_ar, name_fr, short_name_ar, short_name_fr, image_url, description_ar, description_fr, instructions_ar, instructions_fr, delivery_minutes, warranty_days, validity_days, warranty_full_subscription, description_enabled, instructions_enabled,
        name,
        short_name,
        availability,
        description,
        fulfillment,
        sort_order
      `)
      .in('service_id', serviceIds)
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (groupsResult.error) {
      console.error(
        'Unable to load digital_service_groups:',
        groupsResult.error,
      )
      return []
    }

    const groups = (groupsResult.data ?? []) as GroupRow[]

    if (groups.length === 0) {
      return mapCatalog(services, [], [])
    }

    const groupIds = groups.map((group) => group.id)

    const plansResult = await supabase
      .from('digital_service_plans')
      .select(`
        id,
        group_id,
        plan_key,
        label_ar, label_fr, old_price, duration_value, duration_unit,
        label,
        price,
        currency,
        availability,
        popular,
        delivery_minutes,
        warranty_days,
        warranty_full_subscription,
        validity_days,
        sort_order
      `)
      .in('group_id', groupIds)
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (plansResult.error) {
      console.error(
        'Unable to load digital_service_plans:',
        plansResult.error,
      )
      return []
    }

    const plans = (plansResult.data ?? []) as PlanRow[]

    return mapCatalog(services, groups, plans)
  } catch (error) {
    console.error('Unable to load public service catalog:', error)
    return []
  }
}

export async function fetchPublicServiceBySlug(
  slug: string,
): Promise<PublicServiceCatalogItem | null> {
  const normalizedSlug = slug.trim().toLowerCase()

  if (!normalizedSlug) {
    return null
  }

  const catalog = await fetchPublicServiceCatalog()

  return (
    catalog.find(
      (service) => service.slug.trim().toLowerCase() === normalizedSlug,
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
    const normalizedSlug = serviceSlug.trim().toLowerCase()

    if (!normalizedSlug) {
      return []
    }

    const { data, error } = await supabase.rpc(
      'get_public_service_reviews',
      {
        p_service_slug: normalizedSlug,
        p_limit: 50,
      },
    )

    if (error) {
      console.error('Unable to load digital service reviews:', error)
      return []
    }

    const rows = (data ?? []) as PublicServiceReviewRpcRow[]

    return rows
      .map(
        (review): DigitalServiceReview => ({
          id: review.id,
          rating: Number(review.rating),
          comment: review.comment ?? null,
          created_at: review.created_at,
        }),
      )
      .filter(
        (review) =>
          Number.isFinite(review.rating) &&
          review.rating >= 1 &&
          review.rating <= 5,
      )
  } catch (error) {
    console.error('Unable to load digital service reviews:', error)
    return []
  }
}