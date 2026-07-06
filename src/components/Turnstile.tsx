import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void }
      ) => string
      reset: (widgetId?: string) => void
    }
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

export function Turnstile({ onVerify }: { onVerify: (token: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const onVerifyRef = useRef(onVerify)
  onVerifyRef.current = onVerify

  useEffect(() => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
    if (!siteKey || !containerRef.current) return

    function renderWidget() {
      if (!window.turnstile || !containerRef.current || widgetId.current) return
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onVerifyRef.current(token),
        'expired-callback': () => onVerifyRef.current(null),
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
      if (!existing) {
        const script = document.createElement('script')
        script.src = SCRIPT_SRC
        script.async = true
        script.onload = renderWidget
        document.head.appendChild(script)
      } else {
        existing.addEventListener('load', renderWidget)
      }
    }
  }, [])

  return <div ref={containerRef} />
}
