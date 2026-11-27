import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useParams,
} from 'react-router-dom'

import { useLanguage } from '../../../i18n/LanguageContext'

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
  instructions_ar?: string | null
  instructions_fr?: string | null
  name_ar?: string | null
  name_fr?: string | null
  image_url?: string | null

  id: string
  slug: string
  name: string
  category: string
  availability:
    AvailabilityStatus
  description: string | null
  description_ar: string | null
  description_fr: string | null
  delivery_minutes: number | null
  warranty_days: number | null
  warranty_full_subscription: boolean | null
  validity_days: number | null
  active: boolean
  sort_order: number
}

type GroupRow = {
  name_ar?: string | null
  name_fr?: string | null
  short_name_ar?: string | null
  short_name_fr?: string | null
  image_url?: string | null
  description_ar?: string | null
  description_fr?: string | null
  instructions_ar?: string | null
  instructions_fr?: string | null
  delivery_minutes?: number | null
  warranty_days?: number | null
  validity_days?: number | null
  warranty_full_subscription?: boolean | null
  description_enabled?: boolean | null
  instructions_enabled?: boolean | null

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
  description_ar?: string | null
  description_fr?: string | null
  instructions_ar?: string | null
  instructions_fr?: string | null
  label_ar?: string | null
  label_fr?: string | null
  duration_unit?: string | null
  old_price?: number | null
  duration_value?: number | null

  id: string
  group_id: string
  plan_key: string
  label: string
  price: number
  currency: string
  availability:
    AvailabilityStatus
  popular: boolean
  delivery_minutes: number | null
  warranty_days: number | null
  warranty_full_subscription: boolean | null
  validity_days: number | null
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

async function downloadCatalogImage(url:string) {
  const response=await fetch(url)
  if(!response.ok)throw new Error(`HTTP ${response.status}`)
  const blob=await response.blob()
  const objectUrl=URL.createObjectURL(blob)
  const link=document.createElement('a')
  link.href=objectUrl
  link.download=decodeURIComponent(new URL(url,window.location.href).pathname.split('/').pop()||'image.png')
  document.body.appendChild(link);link.click();link.remove()
  window.setTimeout(()=>URL.revokeObjectURL(objectUrl),1000)
}
const LOGO_BUCKET = 'service-logos'
function CatalogImageArchive({slug,ar,onChoose,disabled=false}: {slug:string;ar:boolean;onChoose:(path:string)=>void;disabled?:boolean}) {
  const t=(fr:string,arabic:string)=>ar?arabic:fr
  const [paths,setPaths]=useState<string[]>([])
  const [busy,setBusy]=useState(false)
  const [opened,setOpened]=useState(false)
  const [error,setError]=useState('')
  useEffect(()=>{setPaths([]);setOpened(false);setError('')},[slug])
  const load=async()=>{
    setBusy(true);setError('');setOpened(true)
    try{
      const found:string[]=[]
      const walk=async(prefix:string,depth:number)=>{
        if(depth>4)return
        for(let offset=0;;offset+=100){
          const {data,error}=await supabase.storage.from(LOGO_BUCKET).list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}})
          if(error)throw error
          for(const item of data??[]){const p=`${prefix}/${item.name}`;if(!item.id)await walk(p,depth+1);else if(/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(item.name))found.push(p)}
          if(!data||data.length<100)break
        }
      }
      await walk(slug,0);setPaths(found)
    }catch(e){setError(String((e as {message?:string})?.message??e))}finally{setBusy(false)}
  }
  return <div className="mt-3 space-y-2"><button type="button" disabled={busy||disabled} onClick={()=>void load()} className="rounded-lg border px-3 py-2 text-sm font-bold">{busy?t('Chargement…','جارٍ التحميل…'):t('Images conservées / actualiser','الصور المحفوظة / تحديث')}</button>{error&&<p role="alert" className="text-sm text-rose-600">{error}</p>}{opened&&!busy&&!error&&paths.length===0&&<p className="text-xs">{t('Aucun fichier trouvé dans ce dossier.','لم يتم العثور على ملفات في هذا المجلد.')}</p>}{opened&&paths.length>0&&<div className="grid grid-cols-2 gap-2 max-h-80 overflow-auto">{paths.map(path=>{const url=supabase.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;return <div key={path} className="rounded-lg border p-2"><img src={url} alt="" loading="lazy" className="aspect-square w-full object-contain bg-[#192638] rounded"/><p className="truncate text-xs" title={path}>{path.split('/').pop()}</p><button type="button" disabled={disabled} className="block text-xs font-bold text-blue-600" onClick={()=>onChoose(path)}>{t('Utiliser','استخدام')}</button><button type="button" className="text-xs text-blue-600" onClick={()=>void downloadCatalogImage(url).catch(e=>setError(String(e)))}>{t('Télécharger','تنزيل')}</button></div>})}</div>}</div>
}
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']

function DeliveryInput({value,onChange,ar}:{value:number|null|undefined;onChange:(value:number|null)=>void;ar:boolean}) {
  const [unit,setUnit]=useState(value && value>=2880 && value%1440===0 ? 'days' : value && value%60===0 ? 'hours' : 'minutes')
  const factor=unit==='days'?1440:unit==='hours'?60:1
  return <div className="mt-2 flex gap-2"><input aria-label={ar?'مدة التسليم':'Délai de livraison'} type="number" min="0" step="any" value={value==null?'':value/factor} onChange={e=>onChange(e.target.value===''?null:Math.round(Number(e.target.value)*factor))} className="min-w-0 w-full rounded-xl border border-slate-200 bg-white p-3"/><select aria-label={ar?'الوحدة':'Unité'} value={unit} onChange={e=>setUnit(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-2"><option value="minutes">{ar?'دقيقة':'min'}</option><option value="hours">{ar?'ساعة':'h'}</option><option value="days">{ar?'يوم':'jours'}</option></select></div>
}

export default function AdminServiceEditPage() {
  const { language } = useLanguage()
  const ar = language === 'ar'
  const tr = (fr: string, arabic: string) => ar ? arabic : fr
  const [imageBusy, setImageBusy] = useState<string | null>(null)
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

  type LogoPaths = {logo_path:string;logo_light_path:string|null;logo_dark_path:string|null}
  const [serviceLogo, setServiceLogo] = useState<LogoPaths | null>(null)
  const [logoBusy, setLogoBusy] = useState(false)
  const [logoLoadingError, setLogoLoadingError] = useState<string | null>(null)
  const refreshLogo = useCallback(async (slug: string) => {
    setServiceLogo(null)
    const {data,error}=await supabase.from('service_logos').select('*').eq('service_slug',slug).maybeSingle()
    setLogoLoadingError(error?.message??null)
    if(!error) setServiceLogo(data as LogoPaths|null)
  },[])
  const uploadServiceLogo = async (file?:File) => {
    if(!service||!file||logoBusy)return
    if(!LOGO_TYPES.includes(file.type)||file.size>3*1024*1024){showToast({type:'error',title:tr('Fichier non accepté','ملف غير مقبول'),message:'PNG / JPG / WEBP · 3 MB'});return}
    setLogoBusy(true)
    const slug=service.slug
    const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'
    const path=`${slug}/logo-${crypto.randomUUID()}.${ext}`
    try {
      const {data:existing,error:readError}=await supabase.from('service_logos').select('logo_path').eq('service_slug',slug).maybeSingle()
      if(readError)throw readError
      const {error:uploadError}=await supabase.storage.from(LOGO_BUCKET).upload(path,file,{contentType:file.type,upsert:false})
      if(uploadError)throw uploadError
      const {error}=existing ? await supabase.from('service_logos').update({logo_path:path,updated_at:new Date().toISOString()}).eq('service_slug',slug).select('service_slug').single() : await supabase.from('service_logos').insert({service_slug:slug,logo_path:path})
      if(error)throw error
      await refreshLogo(slug)
      showToast({type:'success',title:tr('Logo enregistré','تم حفظ الشعار')})
    } catch(error){showToast({type:'error',title:tr('Logo non enregistré','تعذر حفظ الشعار'),message:typeof error==='object'&&error!==null&&'message' in error?String(error.message):String(error)})}
    finally{setLogoBusy(false)}
  }
  const restoreServiceLogo = async (path:string) => {
    if(!service||logoBusy||!path.startsWith(service.slug+'/'))return
    setLogoBusy(true)
    try {
      const {error}=await supabase.from('service_logos').upsert({service_slug:service.slug,logo_path:path,updated_at:new Date().toISOString()},{onConflict:'service_slug'}).select('service_slug').single()
      if(error)throw error
      await refreshLogo(service.slug)
      showToast({type:'success',title:tr('Logo enregistré','تم حفظ الشعار')})
    } catch(e){showToast({type:'error',title:tr('Logo non enregistré','تعذر حفظ الشعار'),message:String((e as {message?:string})?.message??e)})}finally{setLogoBusy(false)}
  }
  const removeServiceLogo = async () => {
    if(!service||logoBusy||!window.confirm(tr('Retirer le logo affiché ? Le fichier restera dans le stockage.','إزالة الشعار من العرض؟ سيبقى الملف محفوظاً في التخزين.')))return
    setLogoBusy(true)
    try {
      const {error}=await supabase.from('service_logos').delete().eq('service_slug',service.slug).select('service_slug').single()
      if(error)throw error
      await refreshLogo(service.slug)
      showToast({type:'success',title:tr('Logo retiré du catalogue','تمت إزالة الشعار من العرض')})
    }catch(e){showToast({type:'error',title:tr('Suppression impossible','تعذرت الإزالة'),message:String((e as {message?:string})?.message??e)})}finally{setLogoBusy(false)}
  }
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
                name_ar, name_fr, image_url,
                name,
                category,
                availability,
                description,
                description_ar,
                description_fr,
                instructions_ar, instructions_fr,
                delivery_minutes,
                warranty_days,
                warranty_full_subscription,
                validity_days,
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
        void refreshLogo(nextService.slug)

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
                name_ar, name_fr, short_name_ar, short_name_fr, image_url, description_ar, description_fr, instructions_ar, instructions_fr, delivery_minutes, warranty_days, validity_days, warranty_full_subscription, description_enabled, instructions_enabled,
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
                  label_ar, label_fr, duration_unit, old_price, duration_value,
                  description_ar, description_fr, instructions_ar, instructions_fr,
                  label,
                  price,
                  currency,
                  availability,
                  popular,
                  delivery_minutes,
                  warranty_days,
                  warranty_full_subscription,
                  validity_days,
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

  const [detailsTab, setDetailsTab] = useState<'general' | 'catalog' | 'legacy'>('catalog')

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
            name_ar: service.name_ar?.trim() || null,
            name_fr: service.name_fr?.trim() || null,
            image_url: service.image_url?.trim() || null,

            category:
              service.category.trim(),
            description:
              service.description?.trim() || null,
            description_ar: service.description_ar?.trim() || null,
            description_fr: service.description_fr?.trim() || null,
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
          .select('id').single()

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

      // Keep other unsaved fields in the editor.
    }

  const handleCreateGroup =
    async () => {
      if (
        !service
      ) {
        return
      }

      const groupKey =
        (newGroup.groupKey.trim() || newGroup.name.trim() || crypto.randomUUID())
          .trim()
          .toLowerCase()
          .replace(
            /[^a-z0-9-]+/g,
            '-',
          )
          .replace(
            /^-+|-+$/g,
            '',
          ) || `offer-${crypto.randomUUID()}`

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
              false,
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
      if (imageBusy || savingGroupId) return
      if (!group.name.trim() || !group.short_name.trim() || [group.delivery_minutes,group.warranty_days,group.validity_days].some(n=>n!=null&&(!Number.isSafeInteger(n)||n<0))) {
        showToast({type:'error',title:tr('Vérifiez les valeurs du produit','تحقق من بيانات المنتج')}); return
      }
      setSavingGroupId(group.id)

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
            name_ar: group.name_ar?.trim() || null,
            name_fr: group.name_fr?.trim() || null,
            short_name_ar: group.short_name_ar?.trim() || null,
            short_name_fr: group.short_name_fr?.trim() || null,
            image_url: group.image_url?.trim() || null,
            description_ar: group.description_ar?.trim() || null,
            description_fr: group.description_fr?.trim() || null,
            instructions_ar: group.instructions_ar?.trim() || null,
            instructions_fr: group.instructions_fr?.trim() || null,
            delivery_minutes: group.delivery_minutes ?? null,
            warranty_days: group.warranty_days ?? null,
            validity_days: group.validity_days ?? null,
            warranty_full_subscription: group.warranty_full_subscription ?? null,
            description_enabled: group.description_enabled ?? true,
            instructions_enabled: group.instructions_enabled ?? true,

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
          .select('id').single()

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

      // Keep other unsaved fields in the editor.
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

  const uploadOfferImage = async (groupId: string, file?: File) => {
    if (!service || !file || imageBusy || savingGroupId) return
    if (!LOGO_TYPES.includes(file.type) || file.size > 3 * 1024 * 1024) {
      showToast({type:'error',title:tr('Image non acceptée','صورة غير مقبولة'),message:'PNG, JPG, WEBP · 3 MB'})
      return
    }
    setImageBusy(groupId)
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${service.slug}/offers/${groupId}/${crypto.randomUUID()}.${ext}`
    try {
      const uploaded = await supabase.storage.from(LOGO_BUCKET).upload(path, file, {contentType:file.type,upsert:false})
      if (uploaded.error) throw uploaded.error
      const url = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl
      const saved = await supabase.from('digital_service_groups').update({image_url:url}).eq('id',groupId).eq('service_id',service.id).select('id').single()
      if (saved.error) throw saved.error
      updateGroup(groupId,{image_url:url})
      showToast({type:'success',title:tr('Image enregistrée','تم حفظ الصورة')})
    } catch (e) {
      showToast({type:'error',title:tr('Échec de l’image','تعذر حفظ الصورة'),message:typeof e === 'object' && e && 'message' in e ? String(e.message) : String(e)})
    } finally {setImageBusy(null)}
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

      if (savingPlanId) return
      if ((plan.old_price != null && (!Number.isFinite(Number(plan.old_price)) || Number(plan.old_price)<Number(plan.price))) || (plan.duration_value == null) !== !plan.duration_unit || (plan.duration_value != null && (!Number.isSafeInteger(plan.duration_value)||plan.duration_value<=0))) {
        showToast({type:'error',title:tr('Vérifiez la durée et le prix barré','تحقق من المدة والسعر القديم')}); return
      }
      setSavingPlanId(plan.id)

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
            label_ar: plan.label_ar?.trim() || null,
            label_fr: plan.label_fr?.trim() || null,
            duration_unit: plan.duration_unit?.trim() || null,
            old_price: plan.old_price ?? null,
            duration_value: plan.duration_value ?? null,

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
            delivery_minutes: plan.delivery_minutes,
            warranty_days: plan.warranty_days,
            warranty_full_subscription: plan.warranty_full_subscription,
            validity_days: plan.validity_days,
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
          .select('id').single()

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

      // Keep other unsaved fields in the editor.
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

      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <Link to="/admin/services" className="text-sm font-bold text-blue-600 hover:underline">{tr('← Retour aux services','العودة إلى الخدمات →')}</Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">TEO STORE / Gestion du service</p>
            <h1 className="mt-1 break-words text-2xl font-black text-slate-950 sm:text-3xl">{service.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${service.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {service.active ? '● Activé' : '● Désactivé'}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{service.availability === 'available' ? 'Disponible' : service.availability === 'out_of_stock' ? 'Rupture' : 'Bientôt'}</span>
              <span dir="ltr" className="max-w-full truncate text-xs text-slate-400">{service.slug}</span>
            </div>
          </div>
          {detailsTab === 'general' && <button type="button" onClick={() => void handleSaveService()} disabled={isSavingService}
            className="min-h-11 shrink-0 rounded-xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50">
            {isSavingService ? tr('Enregistrement…','جارٍ الحفظ…') : tr('Enregistrer le service','حفظ الخدمة')}
          </button>}
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4" role="tablist" aria-label="Sections du service">
          <button type="button" role="tab" aria-selected={detailsTab === 'general'} onClick={() => setDetailsTab('general')}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold ${detailsTab === 'general' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {tr('Paramètres','الإعدادات')}
          </button>
          <button type="button" role="tab" aria-selected={detailsTab === 'catalog'} onClick={() => setDetailsTab('catalog')}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold ${detailsTab === 'catalog' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {tr('Forfaits','الباقات')} ({groups.reduce((n,g)=>n+g.plans.length,0)})
          </button>
        </div>
      </header>

      {detailsTab === 'general' && (
      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_300px] xl:items-start">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5" dir={ar?'rtl':'ltr'}>
          <h2 className="font-black text-slate-950">{tr('Logo du service parent','شعار الخدمة الأم')}</h2>
          <p className="mt-1 text-sm text-slate-500">{tr('Un seul PNG transparent carré, sans marges internes. Max. 3 Mo.','صورة PNG شفافة مربعة واحدة دون فراغات داخلية. الحد الأقصى 3 MB.')}</p>
          {logoLoadingError&&<p className="mt-2 text-sm text-rose-600">{logoLoadingError}</p>}
          <div className="mt-4 max-w-48">
            <div className="aspect-square overflow-hidden rounded-xl bg-[#192638] text-white">{serviceLogo?.logo_path||serviceLogo?.logo_dark_path||serviceLogo?.logo_light_path?<img alt="" src={supabase.storage.from(LOGO_BUCKET).getPublicUrl(serviceLogo?.logo_path||serviceLogo?.logo_dark_path||serviceLogo?.logo_light_path||'').data.publicUrl} className="block h-full w-full object-cover"/>:<span className="flex h-full items-center justify-center text-sm">{tr('Non défini','غير محدد')}</span>}</div>
            <label className="mt-3 inline-block cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white">{logoBusy?tr('Traitement…','جارٍ المعالجة…'):tr('Ajouter / remplacer','إضافة / استبدال')}<input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" disabled={logoBusy} onChange={e=>{void uploadServiceLogo(e.target.files?.[0]);e.currentTarget.value=''}}/></label>
            {serviceLogo&&<div className="mt-2 flex flex-wrap gap-2">{Array.from(new Set([serviceLogo.logo_path,serviceLogo.logo_dark_path,serviceLogo.logo_light_path].filter((p):p is string=>!!p))).map((p,i)=><button type="button" key={p} disabled={logoBusy} className="rounded-lg border px-3 py-2 text-sm" onClick={()=>void downloadCatalogImage(supabase.storage.from(LOGO_BUCKET).getPublicUrl(p).data.publicUrl).catch(e=>showToast({type:'error',title:tr('Téléchargement impossible','تعذر التنزيل'),message:String(e)}))}>{tr('Télécharger','تنزيل')} {i+1}</button>)}<button type="button" disabled={logoBusy} className="rounded-lg border px-3 py-2 text-sm text-rose-600" onClick={()=>void removeServiceLogo()}>{tr('Retirer','إزالة')}</button></div>}
          </div>
          <CatalogImageArchive slug={service.slug} ar={ar} disabled={logoBusy} onChoose={path=>void restoreServiceLogo(path)}/>
          <p className="mt-3 text-xs text-slate-500">{tr('Même image dans les deux thèmes. Les anciennes variantes restent conservées.','نفس الصورة في الوضعين. تبقى النسخ القديمة محفوظة.')}</p>
        </div>
        <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5" dir={ar?'rtl':'ltr'}>
          <h2 className="text-lg font-black text-slate-950">{tr('Informations du service','معلومات الخدمة')}</h2>
          <p className="mt-1 text-sm text-slate-500">{tr('Les prix, délais et garanties se règlent dans chaque produit.','الأسعار والتسليم والضمان تُحدد داخل كل منتج.')}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold">{tr('Nom français','الاسم بالفرنسية')}<input dir="ltr" value={service.name_fr ?? service.name} onChange={e=>{const v=e.target.value;setService(prev=>prev?{...prev,name_fr:v,name:v}:prev)}} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"/></label>
            <label className="text-sm font-bold">{tr('Nom arabe','الاسم بالعربية')}<input dir="rtl" value={service.name_ar ?? ''} onChange={e=>updateServiceField('name_ar',e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"/></label>
            <label className="text-sm font-bold">{tr('Catégorie','التصنيف')}<input value={service.category} onChange={e=>updateServiceField('category',e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"/></label>
            <label className="text-sm font-bold">{tr('Ordre','الترتيب')}<input type="number" min="0" value={service.sort_order} onChange={e=>updateServiceField('sort_order',Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"/></label>
            <label className="text-sm font-bold">{tr('Disponibilité','التوفر')}<select value={service.availability} onChange={e=>updateServiceField('availability',e.target.value as AvailabilityStatus)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"><option value="available">{tr('Disponible','متوفر')}</option><option value="out_of_stock">{tr('Indisponible','غير متوفر')}</option><option value="coming_soon">{tr('Bientôt','قريبًا')}</option></select></label>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={service.active} onChange={e=>updateServiceField('active',e.target.checked)}/>{tr('Afficher dans le catalogue','إظهار في الكتالوج')}</label>
            <label className="text-sm font-bold">{tr('Présentation courte (FR)','وصف مختصر بالفرنسية')}<textarea dir="ltr" rows={3} value={service.description_fr ?? service.description ?? ''} onChange={e=>updateServiceField('description_fr',e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"/></label>
            <label className="text-sm font-bold">{tr('Présentation courte (AR)','وصف مختصر بالعربية')}<textarea dir="rtl" rows={3} value={service.description_ar ?? ''} onChange={e=>updateServiceField('description_ar',e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"/></label>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4"><span className="font-bold">{tr('Forfaits','الباقات')} ({groups.reduce((n,g)=>n+g.plans.length,0)})</span><button type="button" onClick={()=>setDetailsTab('catalog')} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">{tr('Gérer les produits','إدارة المنتجات')}</button></div>
        </section>
      </div>

      )}

      {detailsTab === 'catalog' && <SmartCatalogV4 service={service} groups={groups} ar={ar} reload={loadService} openLegacy={()=>setDetailsTab('legacy')}/> }
      {detailsTab === 'legacy' && (
      <section className="mt-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              {tr('Produits et forfaits','المنتجات والباقات')}
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
            {tr('+ Produit','+ منتج')}
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
                        {tr('Nom du produit','اسم المنتج')}
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
                      {tr('Produit actif','منتج نشط')}
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

                <details className="border-b border-slate-200 p-5" >
                  <summary className="cursor-pointer font-black text-blue-600">{tr('Contenu et paramètres du produit','محتوى وإعدادات المنتج')}</summary>
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {group.image_url && <img src={group.image_url} alt="" className="h-24 w-24 rounded-xl border object-contain"/>}
                      <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">{imageBusy === group.id ? tr('Chargement…','جارٍ الرفع…') : tr('Image du produit','صورة المنتج')}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={!!imageBusy || !!savingGroupId} onChange={e=>{void uploadOfferImage(group.id,e.target.files?.[0]);e.currentTarget.value=''}}/></label>
                      {group.image_url && <button type="button" className="text-sm font-bold text-rose-600" onClick={()=>updateGroup(group.id,{image_url:null})}>{tr('Retirer (puis enregistrer)','إزالة ثم حفظ')}</button>}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(['name_ar','name_fr','short_name_ar','short_name_fr'] as const).map(field=><label key={field} className="text-sm font-bold text-slate-700">{({name_ar:'الاسم بالعربية',name_fr:'Nom français',short_name_ar:'الاسم المختصر بالعربية',short_name_fr:'Nom court français'})[field]}<input dir={field.endsWith('_ar')?'rtl':'ltr'} value={group[field]??''} onChange={e=>updateGroup(group.id,{[field]:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"/></label>)}
                    </div>
                    {(['description','instructions'] as const).map(kind=><div key={kind} className="space-y-3 rounded-xl border border-slate-200 p-3">
                      <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={group[`${kind}_enabled`]??true} onChange={e=>updateGroup(group.id,{[`${kind}_enabled`]:e.target.checked})}/>{kind==='description'?tr('Afficher la description','إظهار الوصف'):tr('Afficher les instructions','إظهار التعليمات')}</label>
                      {(['ar','fr'] as const).map(lang=>{const field=`${kind}_${lang}` as const;return <label key={field} className="block text-sm font-bold">{lang==='ar'?(kind==='description'?'الوصف بالعربية':'التعليمات بالعربية'):(kind==='description'?'Description française':'Instructions françaises')}<textarea dir={lang==='ar'?'rtl':'ltr'} rows={5} value={group[field]??''} onChange={e=>updateGroup(group.id,{[field]:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"/>{group[field]&&<div dir={lang==='ar'?'rtl':'ltr'} className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-sm font-normal">{group[field]}</div>}</label>})}
                    </div>)}
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(['delivery_minutes','warranty_days','validity_days'] as const).map(field=><label key={field} className="text-sm font-bold">{field==='delivery_minutes'?tr('Délai de livraison','مدة التسليم'):field==='warranty_days'?tr('Garantie (jours)','الضمان بالأيام'):tr('Validité (jours)','الصلاحية بالأيام')}{field==='delivery_minutes'?<DeliveryInput value={group[field]} onChange={v=>updateGroup(group.id,{delivery_minutes:v})} ar={ar}/>:<input type="number" min="0" step="1" value={group[field]??''} onChange={e=>updateGroup(group.id,{[field]:e.target.value===''?null:Number(e.target.value)})} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"/>}</label>)}
                    </div>
                    <label className="block text-sm font-bold">{tr('Garantie intégrale','الضمان طوال الاشتراك')}<select value={group.warranty_full_subscription==null?'inherit':String(group.warranty_full_subscription)} onChange={e=>updateGroup(group.id,{warranty_full_subscription:e.target.value==='inherit'?null:e.target.value==='true'})} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3"><option value="inherit">{tr('Hériter','اعتماد الخدمة الأم')}</option><option value="true">{tr('Oui','نعم')}</option><option value="false">{tr('Non','لا')}</option></select></label>
                    <button type="button" disabled={!!imageBusy || !!savingGroupId} onClick={()=>void handleSaveGroup(group)} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50">{tr('Enregistrer le produit','حفظ المنتج')}</button>
                  </div>
                </details>

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
                            <details className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
                              <summary className="cursor-pointer text-sm font-bold text-blue-600">{tr('Traductions, durée et promotion','الترجمة والمدة والتخفيض')}</summary>
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {(['label_ar','label_fr'] as const).map(field=><label key={field} className="text-sm font-bold">{field==='label_ar'?'اسم الباقة بالعربية':'Libellé français'}<input dir={field==='label_ar'?'rtl':'ltr'} value={plan[field]??''} onChange={e=>updatePlan(group.id,plan.id,{[field]:e.target.value})} className="mt-2 w-full rounded-xl border p-3"/></label>)}
                                <label className="text-sm font-bold">{tr('Durée','المدة')}<input type="number" min="1" step="1" value={plan.duration_value??''} onChange={e=>updatePlan(group.id,plan.id,{duration_value:e.target.value===''?null:Number(e.target.value)})} className="mt-2 w-full rounded-xl border p-3"/></label>
                                <label className="text-sm font-bold">{tr('Unité','الوحدة')}<select value={plan.duration_unit??''} onChange={e=>updatePlan(group.id,plan.id,{duration_unit:e.target.value||null})} className="mt-2 w-full rounded-xl border p-3"><option value="">—</option>{[['minutes','Minutes','دقائق'],['hours','Heures','ساعات'],['days','Jours','أيام'],['weeks','Semaines','أسابيع'],['months','Mois','أشهر'],['years','Années','سنوات']].map(([v,fr,a])=><option key={v} value={v}>{tr(fr,a)}</option>)}</select></label>
                                <label className="text-sm font-bold">{tr('Ancien prix (MRU)','السعر القديم (MRU)')}<input type="number" min={plan.price} step="0.01" value={plan.old_price??''} onChange={e=>updatePlan(group.id,plan.id,{old_price:e.target.value===''?null:Number(e.target.value)})} className="mt-2 w-full rounded-xl border p-3"/></label>
                              </div>
                            </details>
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

                              <div className="col-span-full rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                                <p className="text-xs font-black text-slate-700">Paramètres de cette offre / إعدادات هذه الباقة</p>
                                <p className="text-xs text-slate-500">Vide = utiliser la valeur du service. / فارغ = اعتماد إعداد الخدمة.</p>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                  {([['delivery_minutes','Livraison (min)'],['warranty_days','Garantie (jours)'],['validity_days','Validité (jours)']] as const).map(([field,label]) => (
                                    <label key={field} className="text-xs font-semibold text-slate-600">{label}<input type="number" min="0" value={plan[field] ?? ''} onChange={e => updatePlan(group.id,plan.id,{[field]: e.target.value === '' ? null : Math.max(0,Number(e.target.value))})} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3" /></label>
                                  ))}
                                </div>
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={plan.warranty_full_subscription ?? false} onChange={e => updatePlan(group.id,plan.id,{warranty_full_subscription:e.target.checked})} /> Garantie pendant l'abonnement / ضمان طوال الاشتراك</label>
                                <p className="text-xs text-slate-500">{plan.warranty_full_subscription === null ? 'Garantie : héritée du service (si définie).' : 'Garantie : paramètre propre à cette offre.'}</p>
                                <button type="button" onClick={() => updatePlan(group.id,plan.id,{warranty_full_subscription:null})} className="text-xs font-bold text-blue-600 underline">Réinitialiser la garantie / اعتماد ضمان الخدمة</button>
                              </div>
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
      )}

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


function CommonProductEditor({group,ar,onClose,reload}:{group:GroupWithPlans;ar:boolean;onClose:()=>void;reload:()=>Promise<void>}) {
  const t=(fr:string,a:string)=>ar?a:fr
  const [form,setForm]=useState({name_ar:group.name_ar??'',name_fr:group.name_fr??group.name,short_name_ar:group.short_name_ar??'',short_name_fr:group.short_name_fr??group.short_name,description_ar:group.description_ar??'',description_fr:group.description_fr??group.description??'',instructions_ar:group.instructions_ar??'',instructions_fr:group.instructions_fr??'',description_enabled:group.description_enabled??true,instructions_enabled:group.instructions_enabled??true})
  const [busy,setBusy]=useState(false)
  const [saved,setSaved]=useState(false)
  const [message,setMessage]=useState('')
  const input='mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
  const saveCommon=async()=>{
    if(busy||saved)return
    if(!form.name_ar.trim()||!form.name_fr.trim()){setMessage(t('Les deux noms sont requis.','الاسمان مطلوبان.'));return}
    setBusy(true);setMessage('')
    try{
      const {error,data}=await supabase.from('digital_service_groups').update({name:form.name_fr.trim(),name_ar:form.name_ar.trim(),name_fr:form.name_fr.trim(),short_name:form.short_name_fr.trim()||form.name_fr.trim(),short_name_ar:form.short_name_ar.trim()||form.name_ar.trim(),short_name_fr:form.short_name_fr.trim()||form.name_fr.trim(),description:form.description_fr.trim()||null,description_ar:form.description_ar.trim()||null,description_fr:form.description_fr.trim()||null,instructions_ar:form.instructions_ar.trim()||null,instructions_fr:form.instructions_fr.trim()||null,description_enabled:form.description_enabled,instructions_enabled:form.instructions_enabled}).eq('id',group.id).eq('service_id',group.service_id).select('id').single()
      if(error||!data)throw error??new Error('PRODUCT_SAVE_NOT_CONFIRMED')
      setSaved(true);setMessage(t('Informations enregistrées.','تم حفظ المعلومات.'));await reload();onClose()
    }catch(e){setMessage(String((e as {message?:string})?.message??e))}finally{setBusy(false)}
  }
  return <section className="mt-5 space-y-4 rounded-2xl border p-4" dir={ar?'rtl':'ltr'}>
    <div className="flex justify-between items-center gap-2"><h2 className="text-xl font-black">{t('Informations communes','المعلومات المشتركة')}</h2><button type="button" disabled={busy} className="text-blue-600 font-bold" onClick={onClose}>{t('Retour','رجوع')}</button></div>
    <p className="text-sm text-slate-500">{t('Ces informations sont communes à tous les forfaits du produit. Les prix et durées ne changent pas.','هذه المعلومات مشتركة بين جميع باقات المنتج. لن تتغير الأسعار أو المدد.')}</p>
    <fieldset disabled={busy||saved} className="space-y-3">
      {(['name_fr','name_ar','short_name_fr','short_name_ar'] as const).map(key=><label className="block" key={key}>{key==='name_fr'?t('Nom FR','الاسم بالفرنسية'):key==='name_ar'?t('Nom AR','الاسم بالعربية'):key==='short_name_fr'?t('Nom court FR','الاسم المختصر بالفرنسية'):t('Nom court AR','الاسم المختصر بالعربية')}<input className={input} dir={key.endsWith('_ar')?'rtl':'ltr'} value={form[key]} onChange={e=>setForm(old=>({...old,[key]:e.target.value}))}/></label>)}
      {(['description_fr','description_ar','instructions_fr','instructions_ar'] as const).map(key=><label className="block" key={key}>{key==='description_fr'?t('Description FR','الوصف بالفرنسية'):key==='description_ar'?t('Description AR','الوصف بالعربية'):key==='instructions_fr'?t('Instructions FR','التعليمات بالفرنسية'):t('Instructions AR','التعليمات بالعربية')}<textarea rows={5} className={input} dir={key.endsWith('_ar')?'rtl':'ltr'} value={form[key]} onChange={e=>setForm(old=>({...old,[key]:e.target.value}))}/></label>)}
      <label className="flex gap-2"><input type="checkbox" checked={form.description_enabled} onChange={e=>setForm(old=>({...old,description_enabled:e.target.checked}))}/>{t('Afficher la description','إظهار الوصف')}</label>
      <label className="flex gap-2"><input type="checkbox" checked={form.instructions_enabled} onChange={e=>setForm(old=>({...old,instructions_enabled:e.target.checked}))}/>{t('Afficher les instructions','إظهار التعليمات')}</label>
      <button type="button" onClick={()=>void saveCommon()} disabled={busy||saved} className="w-full rounded-xl bg-blue-600 p-3 font-bold text-white disabled:opacity-50">{busy?t('Enregistrement…','جارٍ الحفظ…'):t('Enregistrer les informations','حفظ المعلومات')}</button>
    </fieldset>{message&&<p role="status" className="break-words text-sm">{message}</p>}
  </section>
}

function IndependentPlanEditor({group,plan,ar,onClose,reload}:{group:GroupWithPlans;plan?:PlanRow;ar:boolean;onClose:()=>void;reload:()=>Promise<void>}) {
  const t=(f:string,a:string)=>ar?a:f
  const input='mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
  const units:Record<string,[string,string]>={minutes:['min','دقيقة'],hours:['h','ساعة'],days:['jour','يوم'],weeks:['semaine','أسبوع'],months:['mois','شهر'],years:['an','سنة']}
  const [content,setContent]=useState({description_ar:plan?.description_ar??'',description_fr:plan?.description_fr??'',instructions_ar:plan?.instructions_ar??'',instructions_fr:plan?.instructions_fr??''})
  const [duration,setDuration]=useState(String(plan?.duration_value??''))
  const [unit,setUnit]=useState(plan?.duration_unit??(plan?'':'months'))
  const [labelFr,setLabelFr]=useState(plan?.label_fr??plan?.label??'')
  const [labelAr,setLabelAr]=useState(plan?.label_ar??'')
  const [price,setPrice]=useState(plan?String(plan.price):'')
  const [oldPrice,setOldPrice]=useState(plan?.old_price==null?'':String(plan.old_price))
  const [delivery,setDelivery]=useState<number|null>(plan?.delivery_minutes??null)
  const [validity,setValidity]=useState(plan?.validity_days==null?'':String(plan.validity_days))
  const [warranty,setWarranty]=useState(plan?.warranty_full_subscription===true?'full':plan?.warranty_days===0?'none':plan?.warranty_days!=null?'custom':plan?.warranty_full_subscription===false?'unset':'inherit')
  const [warrantyDays,setWarrantyDays]=useState(plan?.warranty_days==null?'':String(plan.warranty_days))
  const [availability,setAvailability]=useState<AvailabilityStatus>(plan?.availability??'available')
  const [active,setActive]=useState(plan?.active??false)
  const [popular,setPopular]=useState(plan?.popular??false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [saved,setSaved]=useState(false)
  const [requestKey]=useState(()=>`plan-${crypto.randomUUID()}`)
  const count=Number(duration), amount=Number(price), previous=oldPrice.trim()===''?null:Number(oldPrice)
  const validDays=validity.trim()===''?null:Number(validity)
  const days=warranty==='custom'?Number(warrantyDays):warranty==='none'?0:null
  const unitNames=units[unit]
  const generatedFr=unitNames&&count>0?`${count} ${unitNames[0]}${count>1&&['days','weeks','years'].includes(unit)?'s':''}`:''
  const generatedAr=unitNames&&count>0?`${count} ${unitNames[1]}`:''
  const savePlan=async()=>{
    if(busy||saved)return
    setMessage('')
    if(!price.trim()||!Number.isFinite(amount)||amount<=0||(previous!==null&&(!Number.isFinite(previous)||previous<=amount))||(unit!==''&&(!unitNames||!Number.isSafeInteger(count)||count<=0))||(!unit&&duration.trim()!=='')||!(labelFr.trim()||generatedFr)||!(labelAr.trim()||generatedAr)||(delivery!==null&&(!Number.isSafeInteger(delivery)||delivery<0))||(validDays!==null&&(!Number.isSafeInteger(validDays)||validDays<=0))||(warranty==='custom'&&(!Number.isSafeInteger(days)||Number(days)<=0))){setMessage(t('Vérifiez les champs, les prix et les durées.','تحقق من الحقول والأسعار والمدد.'));return}
    setBusy(true)
    try{
      const payload={...Object.fromEntries(Object.entries(content).map(([k,v])=>[k,v.trim()||null])),label:labelFr.trim()||generatedFr,label_fr:labelFr.trim()||generatedFr,label_ar:labelAr.trim()||generatedAr,price:amount,old_price:previous,currency:'MRU',duration_value:unit?count:null,duration_unit:unit||null,validity_days:validDays,delivery_minutes:delivery,warranty_days:days,warranty_full_subscription:warranty==='inherit'?null:warranty==='full',availability,active,popular}
      const table=supabase.from('digital_service_plans')
      const result=plan?await table.update(payload).eq('id',plan.id).eq('group_id',group.id).select('id').single():await table.insert({...payload,group_id:group.id,plan_key:requestKey,sort_order:Math.max(-1,...group.plans.map(p=>Number(p.sort_order)||0))+1}).select('id').single()
      if(result.error||!result.data)throw result.error??new Error('PLAN_SAVE_NOT_CONFIRMED')
      setSaved(true)
      setMessage(t('Forfait enregistré.','تم حفظ الباقة.'))
      await reload()
      onClose()
    }catch(e){setMessage(String((e as {message?:string})?.message??e))}finally{setBusy(false)}
  }
  return <section className="mt-5 space-y-4 rounded-2xl border p-4" dir={ar?'rtl':'ltr'}>
    <div className="flex items-center justify-between gap-2"><div><h2 className="font-black text-xl">{plan?t('Modifier le forfait','تعديل الباقة'):t('Ajouter un forfait','إضافة باقة')}</h2><p className="text-sm">{(ar?group.name_ar:group.name_fr)||group.name}</p></div><button disabled={busy} onClick={onClose} className="text-sm font-bold text-blue-600">{t('Retour','رجوع')}</button></div>
    <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200">{t('Les informations propres au forfait priment sur les valeurs par défaut.','تُستخدم معلومات الباقة الخاصة أولاً، ثم المعلومات الافتراضية.')}</p>
    <fieldset disabled={busy||saved} className="space-y-4"><PricingBox ar={ar} onPrice={setPrice}/>
    <div className="grid gap-3 sm:grid-cols-2">
      <label>{t('Durée','المدة')}<input className={input} type="number" min="1" step="1" disabled={!unit} value={duration} onChange={e=>{setDuration(e.target.value);setValidity('');setLabelAr('');setLabelFr('')}}/></label>
      <label>{t('Unité','الوحدة')}<select className={input} value={unit} onChange={e=>{setUnit(e.target.value);if(!e.target.value)setDuration('');setValidity('');setLabelAr('');setLabelFr('')}}><option value="">{t('Sans durée','بدون مدة')}</option>{Object.entries(units).map(([key,names])=><option key={key} value={key}>{ar?names[1]:names[0]}</option>)}</select></label>
      <label>{t('Libellé FR','اسم الباقة FR')}<input className={input} value={labelFr} placeholder={generatedFr} onChange={e=>setLabelFr(e.target.value)}/></label>
      <label>{t('Libellé AR','اسم الباقة AR')}<input dir="rtl" className={input} value={labelAr} placeholder={generatedAr} onChange={e=>setLabelAr(e.target.value)}/></label>
      <label>{t('Prix MRU','السعر MRU')}<input className={input} type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)}/></label>
      <label>{t('Ancien prix (facultatif)','السعر السابق (اختياري)')}<input className={input} type="number" min="0" step="0.01" value={oldPrice} onChange={e=>setOldPrice(e.target.value)}/></label>
      <div>{t('Délai de livraison (vide : hériter)','مدة التسليم (فارغ: اعتماد المنتج)')}<DeliveryInput ar={ar} value={delivery} onChange={setDelivery}/></div>
      <label>{t('Validité en jours (facultatif)','الصلاحية بالأيام (اختياري)')}<input className={input} type="number" min="1" step="1" value={validity} onChange={e=>setValidity(e.target.value)}/></label>
      <label>{t('Garantie','الضمان')}<select className={input} value={warranty} onChange={e=>setWarranty(e.target.value)}><option value="inherit">{t('Hériter du produit','اعتماد المنتج')}</option><option value="full">{t('Tout l’abonnement','طوال الاشتراك')}</option><option value="custom">{t('Durée personnalisée','مدة محددة')}</option><option value="none">{t('Sans garantie','بدون ضمان')}</option><option value="unset">{t('Non définie','غير محددة')}</option></select></label>
      {warranty==='custom'&&<label>{t('Jours de garantie','أيام الضمان')}<input className={input} type="number" min="1" step="1" value={warrantyDays} onChange={e=>setWarrantyDays(e.target.value)}/></label>}
      <label>{t('Disponibilité','التوفر')}<select className={input} value={availability} onChange={e=>setAvailability(e.target.value as AvailabilityStatus)}><option value="available">{t('Disponible','متوفر')}</option><option value="out_of_stock">{t('Rupture','نفد المخزون')}</option><option value="coming_soon">{t('Bientôt','قريباً')}</option></select></label>
    </div>
    <div className="space-y-3 rounded-xl border p-3"><h3 className="font-bold">{t('Contenu spécifique du forfait','محتوى خاص بالباقة')}</h3><p className="text-xs">{t('Laissez vide pour utiliser le contenu par défaut.','اترك الحقل فارغًا لاستخدام المحتوى الافتراضي.')}</p>{(['description_fr','description_ar','instructions_fr','instructions_ar'] as const).map(k=><label key={k} className="block">{k.startsWith('description')?t('Description','الوصف'):t('Instructions','التعليمات')} — {k.endsWith('_ar')?'AR':'FR'}<textarea className={input} rows={3} dir={k.endsWith('_ar')?'rtl':'ltr'} value={content[k]} onChange={e=>setContent(o=>({...o,[k]:e.target.value}))}/></label>)}</div>
    <label className="flex gap-2"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/>{t('Publier ce forfait','نشر هذه الباقة')}</label>
    <label className="flex gap-2"><input type="checkbox" checked={popular} onChange={e=>setPopular(e.target.checked)}/>{t('Populaire','شائعة')}</label>
    <button type="button" disabled={busy||saved} onClick={()=>void savePlan()} className="w-full rounded-xl bg-blue-600 p-3 font-bold text-white disabled:opacity-50">{busy?t('Enregistrement…','جارٍ الحفظ…'):t('Enregistrer le forfait','حفظ الباقة')}</button>
    </fieldset>
    {message&&<p role="status" className="break-words text-sm">{message}</p>}
  </section>
}

function ServiceDefaultsEditor({service,ar,reload}:{service:ServiceRow;ar:boolean;reload:()=>Promise<void>}){
 const [values,setValues]=useState({description_ar:service.description_ar??'',description_fr:service.description_fr??'',instructions_ar:service.instructions_ar??'',instructions_fr:service.instructions_fr??''});const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const save=async()=>{if(busy)return;setBusy(true);try{const {data,error}=await supabase.from('digital_services').update(Object.fromEntries(Object.entries(values).map(([k,v])=>[k,v.trim()||null]))).eq('id',service.id).select('id').single();if(error||!data)throw error??new Error('SAVE_FAILED');await reload();setMessage(ar?'تم الحفظ':'Enregistré')}catch(e){setMessage(String((e as {message?:string})?.message??e))}finally{setBusy(false)}};return <details className="rounded-xl border p-3"><summary className="cursor-pointer font-bold">{ar?'الوصف والتعليمات الافتراضية للخدمة':'Contenu par défaut du service'}</summary><fieldset disabled={busy} className="mt-3 space-y-3">{(['description_fr','description_ar','instructions_fr','instructions_ar'] as const).map(k=><label className="block text-sm" key={k}>{k.startsWith('description')?(ar?'الوصف':'Description'):(ar?'التعليمات':'Instructions')} — {k.endsWith('_ar')?'AR':'FR'}<textarea dir={k.endsWith('_ar')?'rtl':'ltr'} rows={3} className="mt-1 w-full rounded-xl border p-3 dark:bg-slate-800" value={values[k]} onChange={e=>setValues(o=>({...o,[k]:e.target.value}))}/></label>)}<button type="button" onClick={()=>void save()} className="rounded-xl bg-blue-600 p-3 text-white">{ar?'حفظ الافتراضيات':'Enregistrer les valeurs par défaut'}</button>{message&&<p role="status">{message}</p>}</fieldset></details>
}

function PricingBox({ar,onPrice}:{ar:boolean;onPrice:(price:string)=>void}) {
 const t=(f:string,a:string)=>ar?a:f
 const [settings,setSettings]=useState<{usd_mru:number;rounding_mru:number}|null>(null)
 const [error,setError]=useState('')
 const [currency,setCurrency]=useState('USD')
 const [cost,setCost]=useState('')
 const [margin,setMargin]=useState('30')
 const [fees,setFees]=useState('0')
 useEffect(()=>{let alive=true;void supabase.from('teo_finance_settings').select('usd_mru,rounding_mru').eq('id',true).single().then(({data,error})=>{if(!alive)return;if(error||!data){setError(error?.message??'FINANCE_SETTINGS_UNAVAILABLE');return}setSettings({usd_mru:Number(data.usd_mru),rounding_mru:Number(data.rounding_mru)})});return()=>{alive=false}},[])
 const rate=settings?.usd_mru??0,round=settings?.rounding_mru??0,m=Number(margin),extra=Number(fees),c=Number(cost),total=c*(currency==='USD'?rate:1)+extra
 const valid=!!settings&&[rate,round,m,extra,c,total].every(Number.isFinite)&&rate>0&&round>0&&cost.trim()!==''&&c>0&&margin.trim()!==''&&m>=30&&m<100&&extra>=0
 const price=valid?Math.ceil(total/(1-m/100)/round)*round:0
 const field='mt-1 w-full rounded-xl border p-2 bg-white text-slate-900 dark:bg-slate-800 dark:text-white'
 return <div className="mb-4 rounded-xl border p-3 space-y-3"><h4 className="font-black">TEO Smart Pricing</h4><p className="text-xs opacity-75">{settings?`1 USD = ${rate} MRU · ${t('Arrondi','تقريب')}: ${round} MRU`:error||t('Chargement des paramètres…','جاري تحميل الإعدادات…')}</p><div className="grid grid-cols-2 gap-2"><label>{t('Devise','العملة')}<select className={field} value={currency} onChange={e=>setCurrency(e.target.value)}><option>USD</option><option>MRU</option></select></label><label>{t('Coût d’achat','تكلفة الشراء')}<input className={field} type="number" min="0" step="0.01" value={cost} onChange={e=>setCost(e.target.value)}/></label><label>{t('Marge %','هامش الربح %')}<input className={field} type="number" min="30" max="99" step="1" value={margin} onChange={e=>setMargin(e.target.value)}/></label><label>{t('Frais MRU','مصاريف MRU')}<input className={field} type="number" min="0" step="0.01" value={fees} onChange={e=>setFees(e.target.value)}/></label></div>{valid&&<div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3"><p>{t('Coût total','إجمالي التكلفة')}: {total.toFixed(2)} MRU</p><p>{t('Bénéfice brut','الربح الإجمالي')}: {(price-total).toFixed(2)} MRU</p><strong className="text-xl">{price} MRU</strong></div>}<button type="button" disabled={!valid} onClick={()=>onPrice(String(price))} className="w-full rounded-xl bg-blue-600 p-3 font-bold text-white disabled:opacity-50">{t('Appliquer le prix','اعتماد السعر')}</button><p className="text-xs opacity-75">{t('Calcul du prix seulement. Enregistrez le coût dans Finance pour protéger les remises.','حساب السعر فقط. سجّل التكلفة في قسم المالية لحماية التخفيضات.')}</p></div>
}

function SmartCatalogV4({service,groups,ar,reload,openLegacy}: {service:ServiceRow;groups:GroupWithPlans[];ar:boolean;reload:()=>Promise<void>;openLegacy:()=>void}) {
  const t=(fr:string,arabic:string)=>ar?arabic:fr
  const input='mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
  const panel='rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900'
  const btn='rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50'
  const [commonEditor,setCommonEditor]=useState<string|null>(null)
  const [planEditor,setPlanEditor]=useState<{groupId:string;planId?:string}|null>(null)
  const [draft,setDraft]=useState<null|{groupId:string|null;planId:string|null;name_ar:string;name_fr:string;image_url:string;description_ar:string;description_fr:string;instructions_ar:string;instructions_fr:string;description_enabled:boolean;instructions_enabled:boolean;fulfillment:Record<string,unknown>;availability:AvailabilityStatus;active:boolean;price:string;old_price:string;duration:string;unit:string;legacyLabel:string;legacyLabelAr:string;validity:number|null;delivery:number|null;warranty:string;warrantyDays:string;popular:boolean}>(null)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [query,setQuery]=useState('')
  const [contentLang,setContentLang]=useState(ar?'ar':'fr')

  const start=(g?:GroupWithPlans,p?:PlanRow,copy=false)=>{
    const full=p?.warranty_full_subscription??g?.warranty_full_subscription??service.warranty_full_subscription??false
    const days=p?.warranty_days??g?.warranty_days??service.warranty_days??null
    const label=p?.label??''
    const match=label.match(/^\s*(\d+)\s*(mois|month[s]?|jour[s]?|day[s]?|an[s]?|année[s]?|year[s]?|semaine[s]?|week[s]?)\s*$/i)
    const inferred=match? /mois|month/i.test(match[2])?'months':/jour|day/i.test(match[2])?'days':/semaine|week/i.test(match[2])?'weeks':'years':''
    setMessage('');setContentLang(ar?'ar':'fr')
    setDraft({groupId:copy?null:g?.id??null,planId:copy?null:p?.id??null,name_fr:g?.name_fr??g?.name??service.name_fr??service.name,name_ar:g?.name_ar??service.name_ar??service.name,image_url:copy?'':g?.image_url??'',description_ar:p?.description_ar??g?.description_ar??'',description_fr:p?.description_fr??g?.description_fr??g?.description??'',instructions_ar:p?.instructions_ar??g?.instructions_ar??'',instructions_fr:p?.instructions_fr??g?.instructions_fr??'',description_enabled:g?.description_enabled??true,instructions_enabled:g?.instructions_enabled??true,fulfillment:g?.fulfillment??defaultFulfillment('account_credentials'),availability:p?.availability??g?.availability??'available',active:copy?false:g?g.active&&(p?.active??true):false,price:p?String(p.price):'',old_price:p?.old_price==null?'':String(p.old_price),duration:String(p?.duration_value??match?.[1]??''),unit:p?.duration_unit??inferred,legacyLabel:label,legacyLabelAr:p?.label_ar??'',validity:p?.validity_days??null,delivery:p?.delivery_minutes??g?.delivery_minutes??service.delivery_minutes??null,warranty:full?'full':days===0?'none':days==null?'unset':'custom',warrantyDays:days==null?'':String(days),popular:p?.popular??false})
  }
  const save=async()=>{
    if(!draft||busy)return
    if(!draft.name_fr.trim()||!draft.name_ar.trim()||!draft.price.trim()||!Number.isFinite(Number(draft.price))||Number(draft.price)<=0|| (draft.old_price!==''&&(!Number.isFinite(Number(draft.old_price))||Number(draft.old_price)<=Number(draft.price))) || (draft.unit&&(!['minutes','hours','days','weeks','months','years'].includes(draft.unit)||!Number.isSafeInteger(Number(draft.duration))||Number(draft.duration)<=0)) || (draft.validity!==null&&(!Number.isSafeInteger(draft.validity)||draft.validity<=0)) || (draft.warranty==='custom'&&(!Number.isInteger(Number(draft.warrantyDays))||Number(draft.warrantyDays)<=0))){setMessage(t('Vérifiez les noms, le prix et les durées.','تحقق من الأسماء والسعر والمدد.'));return}
    setBusy(true);setMessage('')
    try{
      const url=draft.image_url||null
      const n=Number(draft.duration)
      const units:Record<string,[string,string,number]>={minutes:['min','دقيقة',0],hours:['h','ساعة',0],days:['jour','يوم',1],weeks:['semaine','أسبوع',7],months:['mois','شهر',30],years:['an','سنة',365]}
      const u=units[draft.unit]
      const labelFr=u?`${n} ${u[0]}${n>1&&u[0]!=='mois'?'s':''}`:draft.legacyLabel||'Standard'
      const labelAr=u?`${n} ${u[1]}`:draft.legacyLabelAr||draft.legacyLabel||'عادي'
      const validity=draft.validity
      const result=await supabase.rpc('admin_save_catalog_product_v4',{p_service_id:service.id,p_group_id:draft.groupId,p_plan_id:draft.planId,p_product:{name_fr:draft.name_fr.trim(),name_ar:draft.name_ar.trim(),image_url:url,description_ar:draft.description_ar,description_fr:draft.description_fr,instructions_ar:draft.instructions_ar,instructions_fr:draft.instructions_fr,description_enabled:draft.description_enabled,instructions_enabled:draft.instructions_enabled,availability:draft.availability,fulfillment:draft.fulfillment,active:draft.active},p_plan:{label_fr:labelFr,label_ar:labelAr,price:Number(draft.price),old_price:draft.old_price===''?null:Number(draft.old_price),duration_value:u?n:null,duration_unit:u?draft.unit:null,delivery_minutes:draft.delivery,warranty_days:draft.warranty==='custom'?Number(draft.warrantyDays):draft.warranty==='none'?0:null,warranty_full_subscription:draft.warranty==='full',validity_days:validity,popular:draft.popular}})
      if(result.error)throw result.error
      setDraft(null);setMessage(t('Produit enregistré.','تم حفظ المنتج.'));await reload()
    }catch(e){setMessage(e instanceof Error?e.message:String((e as {message?:string})?.message??e))}finally{setBusy(false)}
  }
  const kinds: [FulfillmentType,string,string][]=[['account_credentials','Compte prêt','حساب جاهز'],['activation_code','Code','كود تفعيل'],['activation_link','Lien','رابط تفعيل'],['activation_code_or_link','Code ou lien','كود أو رابط'],['automatic_chat','Discussion Admin','محادثة الإدارة'],['customer_email','Activation par e-mail','تفعيل بالبريد'],['player_id_verification','Player ID','معرف اللاعب'],['coming_soon','Bientôt','قريبًا']]
  if(commonEditor){const g=groups.find(x=>x.id===commonEditor);if(g)return <CommonProductEditor key={g.id} group={g} ar={ar} reload={reload} onClose={()=>setCommonEditor(null)}/> }
  if(planEditor){const g=groups.find(x=>x.id===planEditor.groupId);if(g&&(!planEditor.planId||g.plans.some(p=>p.id===planEditor.planId)))return <IndependentPlanEditor key={`${g.id}:${planEditor.planId??'new'}`} group={g} plan={g.plans.find(p=>p.id===planEditor.planId)} ar={ar} reload={reload} onClose={()=>setPlanEditor(null)}/> }
  if(draft)return <section className="mt-5 space-y-4" dir={ar?'rtl':'ltr'}><div className="flex items-center justify-between"><h2 className="text-xl font-black">{draft.groupId?t('Modifier le produit','تعديل المنتج'):t('Nouveau forfait indépendant','باقة مستقلة جديدة')}</h2><button disabled={busy} onClick={()=>{setDraft(null);setMessage('')}} className="text-sm font-bold text-blue-600">{t('Annuler','إلغاء')}</button></div><fieldset disabled={busy} className="space-y-4"><div className={panel}><p className="mb-3 text-sm font-bold text-blue-600">{t('Couverture automatique — aucune image nécessaire','غلاف تلقائي — لا حاجة لصورة')}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">{t('Nom français','الاسم بالفرنسية')}<input className={input} dir="ltr" value={draft.name_fr} onChange={e=>setDraft({...draft,name_fr:e.target.value})}/></label><label className="text-sm font-bold">{t('Nom arabe','الاسم بالعربية')}<input className={input} dir="rtl" value={draft.name_ar} onChange={e=>setDraft({...draft,name_ar:e.target.value})}/></label></div></div>
  <div className={panel}><h3 className="font-black mb-3">{t('Prix et durée','السعر والمدة')}</h3><PricingBox ar={ar} onPrice={price=>setDraft(d=>d?{...d,price}:d)}/><div className="grid grid-cols-2 gap-3"><label>{t('Prix (MRU)','السعر (MRU)')}<input type="number" min="0" className={input} value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})}/></label><label>{t('Ancien prix (facultatif)','السعر القديم (اختياري)')}<input type="number" min="0" className={input} value={draft.old_price} onChange={e=>setDraft({...draft,old_price:e.target.value})}/></label><label>{t('Durée','المدة')}<input type="number" min="1" disabled={!draft.unit} className={input} value={draft.duration} onChange={e=>setDraft({...draft,duration:e.target.value,validity:null})}/></label><label>{t('Unité','الوحدة')}<select className={input} value={draft.unit} onChange={e=>setDraft({...draft,unit:e.target.value,validity:null})}><option value="">{t('Sans durée / existante','بدون مدة / المدة القديمة')}</option><option value="minutes">{t('Minutes','دقائق')}</option><option value="hours">{t('Heures','ساعات')}</option><option value="days">{t('Jours','أيام')}</option><option value="weeks">{t('Semaines','أسابيع')}</option><option value="months">{t('Mois','أشهر')}</option><option value="years">{t('Années','سنوات')}</option></select></label></div></div>
  <div className={panel}><h3 className="font-black mb-3">{t('Livraison et garantie','التسليم والضمان')}</h3><div className="grid gap-3 sm:grid-cols-2"><label>{t('Le client reçoit','يستلم الزبون')}<select className={input} value={String(draft.fulfillment.type??'account_credentials')} onChange={e=>setDraft({...draft,fulfillment:defaultFulfillment(e.target.value as FulfillmentType)})}>{kinds.map(([v,f,a])=><option key={v} value={v}>{t(f,a)}</option>)}</select></label><div>{t('Délai de livraison','مدة التسليم')}<DeliveryInput ar={ar} value={draft.delivery} onChange={v=>setDraft({...draft,delivery:v})}/></div><label>{t('Validité technique en jours (facultatif)','الصلاحية التقنية بالأيام (اختياري)')}<input type="number" min="1" step="1" className={input} value={draft.validity??''} onChange={e=>setDraft({...draft,validity:e.target.value===''?null:Number(e.target.value)})}/></label><label>{t('Garantie','الضمان')}<select className={input} value={draft.warranty} onChange={e=>setDraft({...draft,warranty:e.target.value})}><option value="unset">{t('Non définie','غير محدد')}</option><option value="full">{t('Tout l’abonnement','طوال الاشتراك')}</option><option value="custom">{t('Durée personnalisée','مدة محددة')}</option><option value="none">{t('Sans garantie','بدون ضمان')}</option></select></label>{draft.warranty==='custom'&&<label>{t('Jours de garantie','أيام الضمان')}<input type="number" min="1" className={input} value={draft.warrantyDays} onChange={e=>setDraft({...draft,warrantyDays:e.target.value})}/></label>}</div><p className="mt-3 text-xs text-slate-500">{t('Le mode manuel ou automatique reste dans la gestion du stock.','التسليم اليدوي أو التلقائي يبقى في إدارة المخزون.')}</p></div>
  <div className={panel}><h3 className="font-black mb-3">{t('Description et instructions','الوصف والتعليمات')}</h3><p className="mb-3 text-xs">{t('Laissez vide pour utiliser le contenu par défaut du service.','اترك الحقول فارغة لاستخدام محتوى الخدمة الافتراضي.')}</p><div className="flex gap-2 mb-3">{['fr','ar'].map(l=><button key={l} type="button" onClick={()=>setContentLang(l)} className={`rounded-lg px-3 py-2 text-sm font-bold ${contentLang===l?'bg-blue-600 text-white':'bg-slate-100 text-slate-700'}`}>{l==='fr'?'Français':'العربية'}</button>)}</div><label className="block">{t('Description','الوصف')}<textarea rows={5} dir={contentLang==='ar'?'rtl':'ltr'} className={input} value={contentLang==='ar'?draft.description_ar:draft.description_fr} onChange={e=>setDraft({...draft,[contentLang==='ar'?'description_ar':'description_fr']:e.target.value})}/></label><label className="flex gap-2 items-center text-sm mb-4"><input type="checkbox" checked={draft.description_enabled} onChange={e=>setDraft({...draft,description_enabled:e.target.checked})}/>{t('Afficher la description','إظهار الوصف')}</label><label className="block">{t('Instructions','التعليمات')}<textarea rows={4} dir={contentLang==='ar'?'rtl':'ltr'} className={input} value={contentLang==='ar'?draft.instructions_ar:draft.instructions_fr} onChange={e=>setDraft({...draft,[contentLang==='ar'?'instructions_ar':'instructions_fr']:e.target.value})}/></label><label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={draft.instructions_enabled} onChange={e=>setDraft({...draft,instructions_enabled:e.target.checked})}/>{t('Afficher les instructions','إظهار التعليمات')}</label></div>
  <div className={panel}><div className="grid gap-3 sm:grid-cols-2"><label>{t('Disponibilité','التوفر')}<select className={input} value={draft.availability} onChange={e=>setDraft({...draft,availability:e.target.value as AvailabilityStatus})}><option value="available">{t('Disponible','متوفر')}</option><option value="out_of_stock">{t('Rupture','نفد المخزون')}</option><option value="coming_soon">{t('Bientôt','قريبًا')}</option></select></label><div className="space-y-2"><label className="flex items-center gap-2"><input type="checkbox" checked={draft.active} onChange={e=>setDraft({...draft,active:e.target.checked})}/>{t('Publier le forfait','نشر الباقة')}</label><p className="text-xs text-slate-500">{t('Le service doit être actif et disponible.','يجب أن تكون الخدمة مفعلة ومتوفرة أيضًا.')}</p><label className="flex items-center gap-2"><input type="checkbox" checked={draft.popular} onChange={e=>setDraft({...draft,popular:e.target.checked})}/>{t('Populaire','شائع')}</label></div></div></div></fieldset>{message&&<p role="alert" className="rounded-xl bg-slate-100 p-3 text-sm text-slate-800">{message}</p>}<button disabled={busy} className={`${btn} w-full`} onClick={()=>void save()}>{busy?t('Enregistrement…','جارٍ الحفظ…'):t('Enregistrer le forfait','حفظ الباقة')}</button></section>
  const rows=groups.flatMap(g=>g.plans.map(p=>({g,p})))
  const published=rows.filter(({g,p})=>service.active&&g.active&&p.active).length
  return <section className="mt-5 space-y-3" dir={ar?'rtl':'ltr'}>
    <div className="grid grid-cols-3 gap-2 text-center">{[[t('Forfaits','الباقات'),rows.length],[t('Publiés','منشورة'),published],[t('Masqués','مخفية'),rows.length-published]].map(([label,count])=><div key={label} className={panel}><p className="text-xs opacity-70">{label}</p><strong className="text-xl">{count}</strong></div>)}</div>
    <button type="button" className={btn+' w-full'} onClick={()=>start()}>{t('+ Ajouter un forfait','+ إضافة باقة')}</button>
    <ServiceDefaultsEditor key={service.id} service={service} ar={ar} reload={reload}/>
    <input className={input} placeholder={t('Rechercher un forfait…','ابحث عن باقة…')} value={query} onChange={e=>setQuery(e.target.value)}/>
    {message&&<p role="status" className="text-sm break-words">{message}</p>}
    {rows.filter(({g,p})=>`${g.name} ${g.name_ar??''} ${g.name_fr??''} ${p.label} ${p.label_ar??''} ${p.label_fr??''}`.toLowerCase().includes(query.toLowerCase())).map(({g,p})=><article key={p.id} className={panel}>
      <div className="flex items-start gap-3"><div className="h-14 w-14 shrink-0 rounded-lg bg-gradient-to-br from-indigo-950 to-blue-700 text-white flex items-center justify-center text-xs font-bold text-center p-1">{(ar?p.label_ar:p.label_fr)||p.label}</div><div className="min-w-0 flex-1"><h3 className="font-bold break-words">{(ar?g.name_ar:g.name_fr)||g.name}</h3><p className="text-sm opacity-75">{(ar?p.label_ar:p.label_fr)||p.label}</p><p className="font-black text-blue-600 dark:text-blue-300">{p.price} MRU {p.old_price!=null&&Number(p.old_price)>Number(p.price)&&<del className="text-xs font-normal opacity-60">{p.old_price} MRU</del>}</p></div><span className="text-xs shrink-0">{service.active&&g.active&&p.active?t('Publié','منشورة'):t('Masqué','مخفية')}</span></div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3"><button type="button" className={btn} onClick={()=>setPlanEditor({groupId:g.id,planId:p.id})}>{t('Modifier','تعديل')}</button><button type="button" className="rounded-xl border px-2 py-2 text-sm font-bold" onClick={()=>start(g,p,true)}>{t('Dupliquer','نسخ')}</button></div>
      <details className="mt-3 text-xs"><summary className="cursor-pointer">{t('Options avancées','خيارات متقدمة')}</summary><div className="mt-2 flex flex-wrap gap-3"><button type="button" className="text-blue-600" onClick={()=>setCommonEditor(g.id)}>{t('Informations du produit','معلومات المنتج')}</button>{g.plans.length===1&&<button type="button" className="text-blue-600" onClick={()=>start(g,p)}>{t('Type et publication','النوع والنشر')}</button>}<button type="button" className="text-blue-600" onClick={openLegacy}>{t('Stock et gestion avancée','المخزون والإدارة المتقدمة')}</button></div></details>
    </article>)}
    {groups.filter(g=>!g.plans.length).map(g=><details key={g.id} className={panel}><summary>{(ar?g.name_ar:g.name_fr)||g.name} — {t('Sans forfait','دون باقة')}</summary><button type="button" className={btn} onClick={()=>setPlanEditor({groupId:g.id})}>{t('Ajouter','إضافة')}</button></details>)}
    <button type="button" className="text-xs opacity-70 underline" onClick={openLegacy}>{t('Gestion avancée et stock','الإدارة المتقدمة والمخزون')}</button>
  </section>
}
