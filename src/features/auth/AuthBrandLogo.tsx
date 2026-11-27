import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Brand = { logo: string; darkLogo: string }
export default function AuthBrandLogo({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  const [brand, setBrand] = useState<Brand>({ logo: '', darkLogo: '' })
  const [themeDark, setThemeDark] = useState(() => document.documentElement.dataset.teoTheme === 'dark')
  const [failed, setFailed] = useState('')
  useEffect(() => {
    let active = true
    const load = async () => {
      const { data, error } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'store').maybeSingle()
      if (!active || error) return
      const value = data?.setting_value
      if (!value || typeof value !== 'object' || Array.isArray(value)) return
      const s = value as Record<string, unknown>
      setBrand({ logo: typeof s.logoUrl === 'string' ? s.logoUrl : '', darkLogo: typeof s.logoDarkUrl === 'string' ? s.logoDarkUrl : '' })
    }
    void load().catch(() => {})
    const observer = new MutationObserver(() => setThemeDark(document.documentElement.dataset.teoTheme === 'dark'))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-teo-theme'] })
    return () => { active = false; observer.disconnect() }
  }, [])
  const isDark = dark || themeDark
  const url = isDark ? brand.darkLogo || brand.logo : brand.logo
  return <div className={`flex shrink-0 items-center justify-center ${className}`} style={{ background: 'transparent', border: 0, boxShadow: 'none' }}>
    {url && url !== failed ? <img src={url} alt="TEO STORE" className="h-full w-full object-contain" onError={() => setFailed(url)} /> : <span className="text-2xl font-black" style={{ color: isDark ? '#fff' : '#1d4ed8' }}>T</span>}
  </div>
}
