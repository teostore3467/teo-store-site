import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string
  remove: (id: string) => void
  ready: (callback: () => void) => void
}
const siteKey = String(import.meta.env.VITE_TEO_TURNSTILE_SITE_KEY || '').trim()
const getApi = () => (window as Window & { turnstile?: TurnstileApi }).turnstile
let loading: Promise<TurnstileApi> | undefined
function loadTurnstile(): Promise<TurnstileApi> {
  const api = getApi()
  if (api) return new Promise(resolve => api.ready(() => resolve(api)))
  if (!loading) {
    loading = new Promise<TurnstileApi>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      const fail = () => { script.remove(); reject(new Error('Turnstile unavailable')) }
      script.onerror = fail
      script.onload = () => { const current = getApi(); if (current) current.ready(() => resolve(current)); else fail() }
      document.head.appendChild(script)
    }).catch(error => { loading = undefined; throw error })
  }
  return loading
}
function Widget({ onToken }: { onToken: (token: string) => void }) {
  const { language } = useLanguage()
  const ar = language === 'ar'
  const target = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    let id: string | undefined
    let api: TurnstileApi | undefined
    onToken('')
    setFailed(false)
    void loadTurnstile().then(current => {
      if (!active || !target.current) return
      api = current
      id = current.render(target.current, {
        sitekey: siteKey, theme: 'auto', size: 'flexible', language: ar ? 'ar' : 'fr',
        callback: (token: string) => { if (active) { onToken(token); setFailed(false) } },
        'expired-callback': () => { if (active) onToken('') },
        'timeout-callback': () => { if (active) onToken('') },
        'error-callback': () => { if (active) { onToken(''); setFailed(true) } },
        'refresh-expired': 'auto', 'refresh-timeout': 'auto',
      })
    }).catch(() => { if (active) { onToken(''); setFailed(true) } })
    return () => { active = false; if (api && id) api.remove(id) }
  }, [ar, attempt, onToken])
  return <div className="my-3 min-w-0"><div ref={target} />{failed && <p role="alert" className="text-xs text-rose-500">{ar ? 'تعذر التحقق الأمني.' : 'Vérification de sécurité indisponible.'} <button type="button" className="underline" onClick={() => setAttempt(n => n + 1)}>{ar ? 'إعادة المحاولة' : 'Réessayer'}</button></p>}</div>
}
export function useTeoCaptcha() {
  const [token, setToken] = useState('')
  const [version, setVersion] = useState(0)
  return {
    token: token || undefined,
    ready: !siteKey || Boolean(token),
    widget: siteKey ? <Widget key={version} onToken={setToken} /> : null,
    reset: () => { setToken(''); setVersion(n => n + 1) },
  }
}
export function safeAuthRedirect(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x1f\x7f]/.test(value)) return '/'
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin || url.pathname.startsWith('//')) return '/'
    return url.pathname + url.search + url.hash
  } catch { return '/' }
}
