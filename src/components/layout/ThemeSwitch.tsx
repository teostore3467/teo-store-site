import { useEffect, useState } from 'react'

const key = 'teo-theme'
export function readTheme(): boolean {
  try { const saved = localStorage.getItem(key); if (saved === 'dark' || saved === 'light') return saved === 'dark' } catch { /* storage unavailable */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}
export default function ThemeSwitch({ arabic = false }: { arabic?: boolean }) {
  const [dark, setDark] = useState(readTheme)
  useEffect(() => {
    const sync = (event: Event) => setDark(event instanceof CustomEvent && typeof event.detail === 'boolean' ? event.detail : readTheme())
    window.addEventListener('teo-theme-change', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('teo-theme-change', sync); window.removeEventListener('storage', sync) }
  }, [])
  useEffect(() => { document.documentElement.dataset.teoTheme = dark ? 'dark' : 'light' }, [dark])
  const label = arabic ? (dark ? 'الوضع النهاري' : 'الوضع الليلي') : (dark ? 'Mode clair' : 'Mode sombre')
  return <button type="button" className="teo-theme-switch" title={label} aria-label={label} aria-pressed={dark} onClick={() => { const next = !dark; try { localStorage.setItem(key, next ? 'dark' : 'light') } catch { /* storage unavailable */ } document.documentElement.dataset.teoTheme = next ? 'dark' : 'light'; setDark(next); window.dispatchEvent(new CustomEvent('teo-theme-change', { detail: next })) }}><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{dark ? <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></> : <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z"/>}</svg></button>
}
