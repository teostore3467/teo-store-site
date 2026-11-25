/** Clipboard API with a synchronous mobile-compatible selection fallback. */
export async function copyText(value: string): Promise<void> {
  if (!value.trim()) throw new Error('EMPTY_CLIPBOARD_VALUE')
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const field = document.createElement('textarea')
  field.value = value
  field.readOnly = true
  field.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;opacity:0.01;font-size:16px;pointer-events:none;'
  document.body.appendChild(field)
  try {
    field.focus({preventScroll:true}); field.select(); field.setSelectionRange(0,value.length)
    if (document.execCommand('copy')) return
  } catch { /* use modern API below */ }
  finally { field.remove(); previous?.focus({preventScroll:true}) }
  if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(value); return }
  throw new Error('CLIPBOARD_UNAVAILABLE')
}
