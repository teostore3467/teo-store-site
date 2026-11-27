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
      let timer: number | undefined
      const fail = () => { window.clearTimeout(timer); script.remove(); reject(new Error('Turnstile unavailable')) }
      timer = window.setTimeout(fail, 15000)
      script.setAttribute('data-cfasync', 'false')
      script.onerror = fail
      script.onload = () => { const current = getApi(); if (current) current.ready(() => { window.clearTimeout(timer); resolve(current) }); else fail() }
      document.head.appendChild(script)
    }).catch(error => { loading = undefined; throw error })
  }
  return loading
}
function Widget({ onToken }: { onToken: (token: string) => void }) {
  const { language } = useLanguage()
  const ar = language === 'ar'
  const target = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'pending' | 'verified' | 'failed'>('loading')
  const [errorCode, setErrorCode] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    let id: string | undefined
    let api: TurnstileApi | undefined
    onToken('')
    setStatus('loading')
    setErrorCode('')
    void loadTurnstile().then(current => {
      if (!active || !target.current) return
      api = current
      setStatus('pending')
      id = current.render(target.current, {
        sitekey: siteKey, theme: 'auto', size: target.current.clientWidth < 300 ? 'compact' : 'flexible', appearance: 'always', language: ar ? 'ar' : 'fr',
        callback: (token: string) => { if (active) { onToken(token); setStatus('verified'); setErrorCode('') } },
        'expired-callback': () => { if (active) { onToken(''); setStatus('pending') } },
        'timeout-callback': () => { if (active) { onToken(''); setStatus('pending') } },
        'error-callback': (code: unknown) => { if (active) { onToken(''); setErrorCode(String(code ?? '').replace(/[^0-9]/g, '').slice(0, 10)); setStatus('failed') } },
        'unsupported-callback': () => { if (active) { onToken(''); setErrorCode('BROWSER'); setStatus('failed') } },
        'refresh-expired': 'auto', 'refresh-timeout': 'auto',
      })
    }).catch(() => { if (active) { onToken(''); setErrorCode('LOAD'); setStatus('failed') } })
    return () => { active = false; if (api && id) api.remove(id) }
  }, [ar, attempt, onToken])
  return <div className="my-3 min-w-0 space-y-2"><div ref={target} /><div role="status" aria-live="polite" className="text-xs">{status === 'loading' ? (ar ? 'جارٍ تحميل التحقق الأمني...' : 'Chargement de la vérification…') : status === 'pending' ? (ar ? 'أكمل التحقق الأمني.' : 'Vérification de sécurité en cours…') : status === 'verified' ? (ar ? '✓ تم التحقق الأمني' : '✓ Vérification réussie') : null}</div>{status === 'failed' && <p role="alert" className="text-xs text-rose-500">{ar ? 'تعذر التحقق الأمني.' : 'Vérification de sécurité indisponible.'} {errorCode && <span dir="ltr">({errorCode})</span>} <button type="button" className="underline" onClick={() => setAttempt(n => n + 1)}>{ar ? 'إعادة المحاولة' : 'Réessayer'}</button></p>}</div>
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
