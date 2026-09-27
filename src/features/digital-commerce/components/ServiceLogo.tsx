import {
  useEffect,
  useState,
} from 'react'

import { supabase } from '../../../lib/supabase'

type ServiceLogoProps = {
  serviceSlug: string
  fallback: string
  className?: string
}

type ServiceLogoRow = {
  service_slug: string
  logo_path: string
}

const SERVICE_LOGOS_BUCKET =
  'service-logos'

function ServiceLogo({
  serviceSlug,
  fallback,
  className = 'h-full w-full object-contain',
}: ServiceLogoProps) {
  const [
    logoUrl,
    setLogoUrl,
  ] = useState<string | null>(
    null,
  )

  const [
    imageFailed,
    setImageFailed,
  ] = useState(false)

  useEffect(() => {
    let isMounted = true

    setLogoUrl(null)
    setImageFailed(false)

    const loadLogo =
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from(
            'service_logos',
          )
          .select(
            'service_slug, logo_path',
          )

        if (!isMounted) {
          return
        }

        if (error) {
          console.error(
            'Unable to load service logo:',
            error,
          )

          setLogoUrl(null)

          return
        }

        const rows =
          (data ??
            []) as ServiceLogoRow[]

        const logoRecord =
          rows.find(
            (row) =>
              row.service_slug ===
              serviceSlug,
          )

        if (
          !logoRecord?.logo_path
        ) {
          setLogoUrl(null)

          return
        }

        const {
          data:
            publicUrlData,
        } =
          supabase.storage
            .from(
              SERVICE_LOGOS_BUCKET,
            )
            .getPublicUrl(
              logoRecord.logo_path,
            )

        setLogoUrl(
          `${
            publicUrlData.publicUrl
          }?v=${Date.now()}`,
        )
      }

    void loadLogo()

    return () => {
      isMounted = false
    }
  }, [serviceSlug])

  if (
    !logoUrl ||
    imageFailed
  ) {
    return (
      <span className="flex h-full w-full items-center justify-center">
        {fallback}
      </span>
    )
  }

  return (
    <img
      src={logoUrl}
      alt=""
      className={
        className
      }
      onError={() =>
        setImageFailed(
          true,
        )
      }
    />
  )
}

export default ServiceLogo