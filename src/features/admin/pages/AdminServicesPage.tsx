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

import {
  serviceCatalog,
} from '../../digital-commerce/data/serviceCatalog'

type ServiceAvailabilityStatus =
  | 'available'
  | 'out_of_stock'
  | 'coming_soon'

type FilterValue =
  | 'all'
  | ServiceAvailabilityStatus

type DigitalServiceRow = {
  id: string
  slug: string
  name: string
  category: string
  availability: ServiceAvailabilityStatus
  description: string | null
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  digital_service_groups?: {
    count: number
  }[]
}

type ServiceLogoRow = {
  service_slug: string
  logo_path: string
}

type ServiceLogoRecord = {
  path: string
  url: string
}

type ServiceLogoMap = Record<
  string,
  ServiceLogoRecord
>

type ToastState = {
  type:
    | 'success'
    | 'error'
    | 'info'
  title: string
  message?: string
}

type NewServiceForm = {
  slug: string
  name: string
  category: string
  availability:
    ServiceAvailabilityStatus
  description: string
}

const SERVICE_LOGOS_BUCKET =
  'service-logos'

function getLogoPublicUrl(
  path: string,
) {
  const {
    data,
  } =
    supabase.storage
      .from(
        SERVICE_LOGOS_BUCKET,
      )
      .getPublicUrl(
        path,
      )

  return data.publicUrl
}

function getFileExtension(
  file: File,
) {
  const parts =
    file.name.split('.')

  const fromName =
    parts.length > 1
      ? parts
          .pop()
          ?.toLowerCase()
      : undefined

  if (fromName) {
    return fromName
      .replace(
        /[^a-z0-9]/g,
        '',
      )
      .slice(
        0,
        8,
      )
  }

  if (
    file.type ===
    'image/jpeg'
  ) {
    return 'jpg'
  }

  if (
    file.type ===
    'image/webp'
  ) {
    return 'webp'
  }

  if (
    file.type ===
    'image/svg+xml'
  ) {
    return 'svg'
  }

  return 'png'
}

function AdminServicesPage() {
  const [
    services,
    setServices,
  ] =
    useState<
      DigitalServiceRow[]
    >([])

  const [
    serviceLogos,
    setServiceLogos,
  ] =
    useState<ServiceLogoMap>(
      {},
    )

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState('')

  const [
    filter,
    setFilter,
  ] =
    useState<FilterValue>(
      'all',
    )

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true)

  const [
    isRefreshing,
    setIsRefreshing,
  ] =
    useState(false)

  const [
    loadError,
    setLoadError,
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

  const [
    showCreateModal,
    setShowCreateModal,
  ] =
    useState(false)

  const [
    newService,
    setNewService,
  ] =
    useState<NewServiceForm>({
      slug: '',
      name: '',
      category: '',
      availability:
        'available',
      description: '',
    })

  const [
    isCreating,
    setIsCreating,
  ] =
    useState(false)

  const [
    isImporting,
    setIsImporting,
  ] =
    useState(false)

  const [
    uploadingSlug,
    setUploadingSlug,
  ] =
    useState<
      string | null
    >(null)

  const [
    removeLogoTarget,
    setRemoveLogoTarget,
  ] =
    useState<{
      slug: string
      name: string
    } | null>(null)

  const [
    logoPreview,
    setLogoPreview,
  ] =
    useState<{
      name: string
      url: string
    } | null>(null)

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

  const loadData =
    useCallback(
      async (
        showLoading = true,
      ) => {
        if (
          showLoading
        ) {
          setIsLoading(
            true,
          )
        } else {
          setIsRefreshing(
            true,
          )
        }

        setLoadError(
          null,
        )

        const [
          servicesResult,
          logosResult,
        ] =
          await Promise.all([
            supabase
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
                  sort_order,
                  created_at,
                  updated_at,
                  digital_service_groups(count)
                `,
              )
              .order(
                'sort_order',
                {
                  ascending:
                    true,
                },
              )
              .order(
                'name',
                {
                  ascending:
                    true,
                },
              ),

            supabase
              .from(
                'service_logos',
              )
              .select(
                'service_slug, logo_path',
              ),
          ])

        if (
          servicesResult.error
        ) {
          setLoadError(
            `Impossible de charger le catalogue. ${servicesResult.error.message}`,
          )

          setIsLoading(
            false,
          )

          setIsRefreshing(
            false,
          )

          return
        }

        setServices(
          (servicesResult.data ??
            []) as DigitalServiceRow[],
        )

        const nextLogos:
          ServiceLogoMap =
            {}

        if (
          !logosResult.error
        ) {
          ;(
            (logosResult.data ??
              []) as ServiceLogoRow[]
          ).forEach(
            (
              row,
            ) => {
              nextLogos[
                row.service_slug
              ] = {
                path:
                  row.logo_path,
                url:
                  getLogoPublicUrl(
                    row.logo_path,
                  ),
              }
            },
          )
        }

        setServiceLogos(
          nextLogos,
        )

        setIsLoading(
          false,
        )

        setIsRefreshing(
          false,
        )
      },
      [],
    )

  useEffect(() => {
    void loadData()

    const servicesChannel =
      supabase
        .channel(
          `admin-digital-services-${Date.now()}`,
        )
        .on(
          'postgres_changes',
          {
            event:
              '*',
            schema:
              'public',
            table:
              'digital_services',
          },
          () => {
            void loadData(
              false,
            )
          },
        )
        .subscribe()

    return () => {
      void supabase.removeChannel(
        servicesChannel,
      )
    }
  }, [
    loadData,
  ])

  const filteredServices =
    useMemo(
      () => {
        const query =
          searchQuery
            .trim()
            .toLowerCase()

        return services.filter(
          (
            service,
          ) => {
            const matchesSearch =
              query.length ===
                0 ||
              service.name
                .toLowerCase()
                .includes(
                  query,
                ) ||
              service.slug
                .toLowerCase()
                .includes(
                  query,
                ) ||
              service.category
                .toLowerCase()
                .includes(
                  query,
                )

            const matchesFilter =
              filter ===
                'all' ||
              service.availability ===
                filter

            return (
              matchesSearch &&
              matchesFilter
            )
          },
        )
      },
      [
        filter,
        searchQuery,
        services,
      ],
    )

  const stats =
    useMemo(
      () => ({
        total:
          services.length,

        available:
          services.filter(
            (
              service,
            ) =>
              service.availability ===
              'available',
          ).length,

        outOfStock:
          services.filter(
            (
              service,
            ) =>
              service.availability ===
              'out_of_stock',
          ).length,

        comingSoon:
          services.filter(
            (
              service,
            ) =>
              service.availability ===
              'coming_soon',
          ).length,

        active:
          services.filter(
            (
              service,
            ) =>
              service.active,
          ).length,
      }),
      [
        services,
      ],
    )

  const getStatusLabel =
    (
      status:
        ServiceAvailabilityStatus,
    ) => {
      if (
        status ===
        'available'
      ) {
        return 'Disponible'
      }

      if (
        status ===
        'out_of_stock'
      ) {
        return 'Rupture'
      }

      return 'Bientôt'
    }

  const getStatusClasses =
    (
      status:
        ServiceAvailabilityStatus,
    ) => {
      if (
        status ===
        'available'
      ) {
        return 'border-emerald-100 bg-emerald-50 text-emerald-700'
      }

      if (
        status ===
        'out_of_stock'
      ) {
        return 'border-rose-100 bg-rose-50 text-rose-700'
      }

      return 'border-amber-100 bg-amber-50 text-amber-700'
    }

  const resetNewService =
    () => {
      setNewService({
        slug: '',
        name: '',
        category: '',
        availability:
          'available',
        description: '',
      })
    }

  const handleCreateService =
    async () => {
      const slug =
        newService.slug
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
        !slug ||
        !newService.name
          .trim() ||
        !newService.category
          .trim()
      ) {
        showToast({
          type:
            'error',
          title:
            'Informations incomplètes',
          message:
            'Le slug, le nom et la catégorie sont obligatoires.',
        })

        return
      }

      setIsCreating(
        true,
      )

      const {
        error,
      } =
        await supabase
          .from(
            'digital_services',
          )
          .insert({
            slug,
            name:
              newService.name.trim(),
            category:
              newService.category.trim(),
            availability:
              newService.availability,
            description:
              newService.description
                .trim() ||
              null,
            active:
              true,
            sort_order:
              services.length,
          })

      setIsCreating(
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

      resetNewService()

      setShowCreateModal(
        false,
      )

      await loadData(
        false,
      )

      showToast({
        type:
          'success',
        title:
          'Service créé',
        message:
          'Le nouveau service est maintenant disponible dans le Dashboard.',
      })
    }

  const handleImportCatalog =
    async () => {
      if (
        services.length >
        0
      ) {
        showToast({
          type:
            'info',
          title:
            'Catalogue déjà initialisé',
          message:
            'L’import local est prévu uniquement pour initialiser une base vide.',
        })

        return
      }

      setIsImporting(
        true,
      )

      const {
        data,
        error,
      } =
        await supabase.rpc(
          'import_digital_service_catalog',
          {
            p_catalog:
              serviceCatalog,
          },
        )

      setIsImporting(
        false,
      )

      if (
        error
      ) {
        showToast({
          type:
            'error',
          title:
            'Import impossible',
          message:
            error.message,
        })

        return
      }

      await loadData(
        false,
      )

      const result =
        data as {
          services?: number
          groups?: number
          plans?: number
        } | null

      showToast({
        type:
          'success',
        title:
          'Catalogue importé',
        message:
          result
            ? `${result.services ?? 0} services, ${result.groups ?? 0} groupes et ${result.plans ?? 0} plans importés.`
            : 'Le catalogue local a été importé dans Supabase.',
      })
    }

  const handleLogoUpload =
    async (
      service:
        DigitalServiceRow,
      file?: File,
    ) => {
      if (
        !file
      ) {
        return
      }

      const allowedTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/svg+xml',
      ]

      if (
        !allowedTypes.includes(
          file.type,
        )
      ) {
        showToast({
          type:
            'error',
          title:
            'Format non accepté',
          message:
            'Utilisez PNG, JPG, WEBP ou SVG.',
        })

        return
      }

      if (
        file.size >
        3 *
          1024 *
          1024
      ) {
        showToast({
          type:
            'error',
          title:
            'Fichier trop volumineux',
          message:
            'Le logo ne doit pas dépasser 3 MB.',
        })

        return
      }

      setUploadingSlug(
        service.slug,
      )

      const previous =
        serviceLogos[
          service.slug
        ]

      const filePath =
        `${service.slug}/logo-${Date.now()}.${getFileExtension(
          file,
        )}`

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            SERVICE_LOGOS_BUCKET,
          )
          .upload(
            filePath,
            file,
            {
              cacheControl:
                '3600',
              upsert:
                false,
              contentType:
                file.type,
            },
          )

      if (
        uploadError
      ) {
        setUploadingSlug(
          null,
        )

        showToast({
          type:
            'error',
          title:
            'Envoi impossible',
          message:
            uploadError.message,
        })

        return
      }

      const {
        error:
          dbError,
      } =
        await supabase
          .from(
            'service_logos',
          )
          .upsert(
            {
              service_slug:
                service.slug,
              logo_path:
                filePath,
              updated_at:
                new Date()
                  .toISOString(),
            },
            {
              onConflict:
                'service_slug',
            },
          )

      if (
        dbError
      ) {
        await supabase.storage
          .from(
            SERVICE_LOGOS_BUCKET,
          )
          .remove([
            filePath,
          ])

        setUploadingSlug(
          null,
        )

        showToast({
          type:
            'error',
          title:
            'Enregistrement impossible',
          message:
            dbError.message,
        })

        return
      }

      if (
        previous?.path
      ) {
        await supabase.storage
          .from(
            SERVICE_LOGOS_BUCKET,
          )
          .remove([
            previous.path,
          ])
      }

      setUploadingSlug(
        null,
      )

      await loadData(
        false,
      )

      showToast({
        type:
          'success',
        title:
          'Logo enregistré',
        message:
          `${service.name} utilise maintenant le nouveau logo.`,
      })
    }

  const handleRemoveLogo =
    async () => {
      if (
        !removeLogoTarget
      ) {
        return
      }

      const logo =
        serviceLogos[
          removeLogoTarget.slug
        ]

      if (
        !logo
      ) {
        setRemoveLogoTarget(
          null,
        )
        return
      }

      const {
        error:
          dbError,
      } =
        await supabase
          .from(
            'service_logos',
          )
          .delete()
          .eq(
            'service_slug',
            removeLogoTarget.slug,
          )

      if (
        dbError
      ) {
        showToast({
          type:
            'error',
          title:
            'Suppression impossible',
          message:
            dbError.message,
        })
        return
      }

      await supabase.storage
        .from(
          SERVICE_LOGOS_BUCKET,
        )
        .remove([
          logo.path,
        ])

      setRemoveLogoTarget(
        null,
      )

      await loadData(
        false,
      )

      showToast({
        type:
          'success',
        title:
          'Logo supprimé',
      })
    }

  return (
    <div className="min-w-0 overflow-x-hidden pb-10">
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
                className="text-lg font-black text-slate-300 hover:text-slate-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <section
        className="relative overflow-hidden rounded-[30px] border border-slate-800/40 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-7"
        style={{
          background:
            'linear-gradient(135deg,#020617 0%,#0d1b3e 50%,#312e81 100%)',
        }}
      >
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">
              DIGITAL CATALOG
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              Services numériques
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
              Ajoutez, modifiez et organisez les services, groupes, plans et prix directement depuis Supabase.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {services.length ===
              0 && (
              <button
                type="button"
                onClick={() =>
                  void handleImportCatalog()
                }
                disabled={
                  isImporting
                }
                className="min-h-[48px] rounded-[14px] border border-white/10 bg-white/[0.08] px-4 text-sm font-black text-white transition hover:bg-white/[0.13] disabled:opacity-50"
              >
                {isImporting
                  ? 'Import en cours...'
                  : 'Importer le catalogue actuel'}
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setShowCreateModal(
                  true,
                )
              }
              className="min-h-[48px] rounded-[14px] bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-500"
            >
              + Nouveau service
            </button>

            <button
              type="button"
              onClick={() =>
                void loadData(
                  false,
                )
              }
              disabled={
                isRefreshing
              }
              className="min-h-[48px] rounded-[14px] border border-white/10 bg-white/[0.08] px-4 text-sm font-black text-white transition hover:bg-white/[0.13] disabled:opacity-50"
            >
              {isRefreshing
                ? 'Actualisation...'
                : 'Actualiser'}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          [
            'Services',
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
            'Actifs',
            stats.active,
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
              className="rounded-[18px] border border-slate-200 bg-white p-4"
            >
              <p className="text-xs font-black uppercase text-slate-400">
                {label}
              </p>

              <p className="mt-2 text-2xl font-black text-slate-950">
                {value}
              </p>
            </div>
          ),
        )}
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
            placeholder="Nom, slug ou catégorie..."
            className="h-12 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
          />

          <select
            value={
              filter
            }
            onChange={(
              event,
            ) =>
              setFilter(
                event.target
                  .value as FilterValue,
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
              setFilter(
                'all',
              )
            }}
            className="h-12 rounded-[14px] border border-slate-200 px-4 text-sm font-black text-slate-600 hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        </div>
      </section>

      {loadError && (
        <div className="mt-5 rounded-[18px] border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {loadError}
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 rounded-[22px] border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400">
          Chargement du catalogue...
        </div>
      ) : filteredServices.length >
        0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredServices.map(
            (
              service,
            ) => {
              const logo =
                serviceLogos[
                  service.slug
                ]

              const groupCount =
                service
                  .digital_service_groups?.[
                  0
                ]?.count ??
                0

              return (
                <article
                  key={
                    service.id
                  }
                  className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.04)]"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            logo
                          ) {
                            setLogoPreview({
                              name:
                                service.name,
                              url:
                                logo.url,
                            })
                          }
                        }}
                        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-slate-200 bg-slate-50"
                      >
                        {logo ? (
                          <img
                            src={
                              logo.url
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-black text-slate-300">
                            {service.name
                              .slice(
                                0,
                                2,
                              )
                              .toUpperCase()}
                          </span>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-base font-black text-slate-950">
                            {service.name}
                          </h2>

                          {!service.active && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-500">
                              Désactivé
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {service.category}
                        </p>

                        <p
                          dir="ltr"
                          className="mt-1 truncate text-left text-xs text-slate-400"
                        >
                          {service.slug}
                        </p>
                      </div>

                      <span
                        className={[
                          'rounded-full border px-2.5 py-1 text-xs font-black',
                          getStatusClasses(
                            service.availability,
                          ),
                        ].join(
                          ' ',
                        )}
                      >
                        {getStatusLabel(
                          service.availability,
                        )}
                      </span>
                    </div>

                    {service.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                        {service.description}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-[14px] bg-slate-50 p-3">
                        <p className="text-xs font-black uppercase text-slate-400">
                          Groupes
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-950">
                          {groupCount}
                        </p>
                      </div>

                      <div className="rounded-[14px] bg-slate-50 p-3">
                        <p className="text-xs font-black uppercase text-slate-400">
                          Logo
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-950">
                          {logo
                            ? 'Personnalisé'
                            : 'Par défaut'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to={`/admin/services/${service.slug}`}
                        className="inline-flex min-h-[42px] flex-1 items-center justify-center rounded-[12px] bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700"
                      >
                        Gérer
                      </Link>

                      <label className="inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-[12px] border border-slate-200 px-3 text-sm font-black text-slate-600 hover:bg-slate-50">
                        {uploadingSlug ===
                        service.slug
                          ? 'Envoi...'
                          : 'Logo'}

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          disabled={
                            uploadingSlug ===
                            service.slug
                          }
                          onChange={(
                            event,
                          ) => {
                            void handleLogoUpload(
                              service,
                              event.target
                                .files?.[
                                0
                              ],
                            )

                            event.currentTarget.value =
                              ''
                          }}
                        />
                      </label>

                      {logo && (
                        <button
                          type="button"
                          onClick={() =>
                            setRemoveLogoTarget({
                              slug:
                                service.slug,
                              name:
                                service.name,
                            })
                          }
                          className="min-h-[42px] rounded-[12px] border border-rose-100 px-3 text-sm font-black text-rose-600 hover:bg-rose-50"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            },
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-[22px] border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-black text-slate-700">
            Aucun service trouvé
          </p>

          {services.length ===
            0 && (
            <button
              type="button"
              onClick={() =>
                void handleImportCatalog()
              }
              disabled={
                isImporting
              }
              className="mt-4 rounded-[12px] bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              {isImporting
                ? 'Import en cours...'
                : 'Importer le catalogue actuel'}
            </button>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[26px] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">
                  Nouveau service
                </p>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Ajouter un service numérique
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(
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
                  Slug *
                </span>
                <input
                  type="text"
                  value={
                    newService.slug
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewService(
                      (
                        current,
                      ) => ({
                        ...current,
                        slug:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="ex: disney-plus"
                  className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Nom *
                </span>
                <input
                  type="text"
                  value={
                    newService.name
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewService(
                      (
                        current,
                      ) => ({
                        ...current,
                        name:
                          event.target.value,
                      }),
                    )
                  }
                  className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Catégorie *
                </span>
                <input
                  type="text"
                  value={
                    newService.category
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewService(
                      (
                        current,
                      ) => ({
                        ...current,
                        category:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="ex: Streaming"
                  className="mt-2 h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Disponibilité
                </span>
                <select
                  value={
                    newService.availability
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewService(
                      (
                        current,
                      ) => ({
                        ...current,
                        availability:
                          event.target
                            .value as ServiceAvailabilityStatus,
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
                    newService.description
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewService(
                      (
                        current,
                      ) => ({
                        ...current,
                        description:
                          event.target.value,
                      }),
                    )
                  }
                  className="mt-2 w-full resize-none rounded-[14px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(
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
                  void handleCreateService()
                }
                disabled={
                  isCreating
                }
                className="h-12 rounded-[14px] bg-blue-600 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreating
                  ? 'Création...'
                  : 'Créer le service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {removeLogoTarget && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-black text-slate-950">
              Retirer le logo ?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {removeLogoTarget.name} utilisera ensuite l’affichage par défaut.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setRemoveLogoTarget(
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
                  void handleRemoveLogo()
                }
                className="h-11 rounded-[12px] bg-rose-600 text-sm font-black text-white hover:bg-rose-700"
              >
                Retirer
              </button>
            </div>
          </div>
        </div>
      )}

      {logoPreview && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() =>
            setLogoPreview(
              null,
            )
          }
        >
          <div
            className="w-full max-w-md rounded-[24px] bg-white p-5"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">
                {logoPreview.name}
              </p>
              <button
                type="button"
                onClick={() =>
                  setLogoPreview(
                    null,
                  )
                }
                className="h-9 w-9 rounded-full bg-slate-100 text-lg font-black text-slate-500"
              >
                ×
              </button>
            </div>

            <img
              src={
                logoPreview.url
              }
              alt=""
              className="mt-4 max-h-[60vh] w-full rounded-[18px] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminServicesPage
