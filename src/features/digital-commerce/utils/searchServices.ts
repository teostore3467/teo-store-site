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

  addSearchValue(
    values,
    getLocalizedServiceName(
      service,
      'fr',
    ),
  )

  addSearchValue(
    values,
    getLocalizedServiceName(
      service,
      'ar',
    ),
  )

  addSearchValue(
    values,
    getLocalizedServiceDescription(
      service,
      'fr',
    ),
  )

  addSearchValue(
    values,
    getLocalizedServiceDescription(
      service,
      'ar',
    ),
  )

  addSearchValue(
    values,
    getLocalizedCategory(
      service.category,
      'fr',
    ),
  )

  addSearchValue(
    values,
    getLocalizedCategory(
      service.category,
      'ar',
    ),
  )

  service.groups.forEach((group) => {
    addSearchValue(values, group.id)
    addSearchValue(values, group.name)
    addSearchValue(
      values,
      group.shortName,
    )

    addSearchValue(
      values,
      getLocalizedGroupName(
        group,
        'fr',
      ),
    )

    addSearchValue(
      values,
      getLocalizedGroupName(
        group,
        'ar',
      ),
    )

    addSearchValue(
      values,
      getLocalizedGroupShortName(
        group,
        'fr',
      ),
    )

    addSearchValue(
      values,
      getLocalizedGroupShortName(
        group,
        'ar',
      ),
    )

    group.plans.forEach((plan) => {
      addSearchValue(
        values,
        plan.id,
      )

      addSearchValue(
        values,
        plan.label,
      )

      addSearchValue(
        values,
        getLocalizedPlanLabel(
          plan,
          'fr',
        ),
      )

      addSearchValue(
        values,
        getLocalizedPlanLabel(
          plan,
          'ar',
        ),
      )
    })
  })

  return values.join(' ')
}

export function searchServices(
  query: string,
  limit = 8,
): ServiceSearchResult[] {
  const normalizedQuery =
    normalizeSearchText(query)

  if (!normalizedQuery) {
    return []
  }

  return serviceCatalog
    .map((service) => {
      const searchText =
        normalizeSearchText(
          getServiceSearchText(
            service,
          ),
        )

      return {
        service,
        matchedText: searchText,
      }
    })
    .filter(({ matchedText }) =>
      matchedText.includes(
        normalizedQuery,
      ),
    )
    .slice(0, limit)
}