import {
  serviceCatalog,
  type ServiceCatalogItem,
} from '../data/serviceCatalog'

import {
  getLocalizedCategory,
  getLocalizedGroupName,
  getLocalizedGroupShortName,
  getLocalizedPlanLabel,
  getLocalizedServiceDescription,
  getLocalizedServiceName,
} from '../data/serviceCatalogTranslations'

export type ServiceSearchResult = {
  service: ServiceCatalogItem
  matchedText: string
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ـ/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function addSearchValue(
  values: string[],
  value: string | undefined | null,
) {
  if (value) {
    values.push(value)
  }
}

function getServiceSearchText(
  service: ServiceCatalogItem,
) {
  const values: string[] = []

  addSearchValue(values, service.slug)
  addSearchValue(values, service.name)
  addSearchValue(values, service.category)

  for (const language of ['fr', 'ar'] as const) {
    addSearchValue(
      values,
      getLocalizedServiceName(service, language),
    )

    addSearchValue(
      values,
      getLocalizedServiceDescription(service, language),
    )

    addSearchValue(
      values,
      getLocalizedCategory(service.category, language),
    )
  }

  service.groups.forEach((group) => {
    addSearchValue(values, group.id)
    addSearchValue(values, group.name)
    addSearchValue(values, group.shortName)

    for (const language of ['fr', 'ar'] as const) {
      addSearchValue(
        values,
        getLocalizedGroupName(group, language),
      )

      addSearchValue(
        values,
        getLocalizedGroupShortName(group, language),
      )
    }

    group.plans.forEach((plan) => {
      addSearchValue(values, plan.id)
      addSearchValue(values, plan.label)

      for (const language of ['fr', 'ar'] as const) {
        addSearchValue(
          values,
          getLocalizedPlanLabel(plan, language),
        )
      }
    })
  })

  return values.join(' ')
}

export function searchServices(
  query: string,
  limitOrCatalog: number | readonly ServiceCatalogItem[] = 8,
  catalogOrLimit?: readonly ServiceCatalogItem[] | number,
): ServiceSearchResult[] {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return []
  }

  const catalog =
    typeof limitOrCatalog !== 'number'
      ? limitOrCatalog
      : typeof catalogOrLimit !== 'number' &&
          catalogOrLimit !== undefined
        ? catalogOrLimit
        : serviceCatalog

  const limit =
    typeof limitOrCatalog === 'number'
      ? limitOrCatalog
      : typeof catalogOrLimit === 'number'
        ? catalogOrLimit
        : 8

  const words = normalizedQuery.split(' ')

  return catalog
    .map((service) => ({
      service,
      matchedText: normalizeSearchText(
        getServiceSearchText(service),
      ),
    }))
    .filter(({ matchedText }) =>
      words.every((word) =>
        matchedText.includes(word),
      ),
    )
    .slice(0, Math.max(0, limit))
}