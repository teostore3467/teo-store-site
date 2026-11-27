export function safeAuthRedirect(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x1f\x7f]/.test(value)) return '/'
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin || url.pathname.startsWith('//')) return '/'
    return url.pathname + url.search + url.hash
  } catch { return '/' }
}
