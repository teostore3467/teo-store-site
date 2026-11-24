import { useEffect, useState } from 'react'
import { fetchPublicServiceCatalog, type PublicServiceCatalogItem } from '../data/supabaseServiceCatalog'
export function useLiveCatalog() {
  const [catalog, setCatalog] = useState<PublicServiceCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    void fetchPublicServiceCatalog().then(items => { if (active) setCatalog(items) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  return { catalog, loading }
}
