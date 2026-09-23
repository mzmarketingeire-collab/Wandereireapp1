import { useEffect, useState } from 'react'

type ClarityFunction = ((command: string, ...args: unknown[]) => void) & { q?: unknown[][] }

declare global {
  interface Window {
    clarity?: ClarityFunction
  }
}

type Consent = 'granted' | 'denied'
const consentKey = 'wander-eire-analytics-consent-v1'
const clarityId = import.meta.env.VITE_CLARITY_ID?.trim()

const queueClarity = () => {
  if (window.clarity) return
  const clarity = ((...args: unknown[]) => {
    clarity.q = clarity.q || []
    clarity.q.push(args)
  }) as ClarityFunction
  window.clarity = clarity
}

const applyConsent = (consent: Consent) => {
  if (!clarityId) return
  queueClarity()
  window.clarity?.('consentv2', {
    ad_Storage: 'denied',
    analytics_Storage: consent,
  })
}

const loadClarity = (consent: Consent) => {
  if (!clarityId) return
  queueClarity()
  applyConsent(consent)
  if (document.querySelector('script[data-wander-clarity]')) return
  const script = document.createElement('script')
  script.async = true
  script.dataset.wanderClarity = clarityId
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(clarityId)}`
  document.head.append(script)
}

export const track = (eventName: string) => window.clarity?.('event', eventName)

export function AnalyticsConsent() {
  const [consent, setConsent] = useState<Consent | null>(() => {
    if (!clarityId) return null
    const stored = localStorage.getItem(consentKey)
    if (stored === 'granted' || stored === 'denied') return stored
    return null
  })

  useEffect(() => {
    if (consent === 'granted') loadClarity(consent)
  }, [consent])

  if (!clarityId) return null

  if (consent) return <button className="analytics-settings" onClick={() => {
    if (consent === 'granted') {
      applyConsent('denied')
      window.clarity?.('consent', false)
    }
    localStorage.removeItem(consentKey)
    setConsent(null)
  }}>Analytics preferences</button>

  const choose = (next: Consent) => {
    localStorage.setItem(consentKey, next)
    setConsent(next)
  }

  return <aside className="analytics-consent" aria-label="Analytics preferences">
    <div><strong>Help improve Wander Éire</strong><p>Allow privacy-conscious usage analytics. Advertising storage stays off.</p></div>
    <div><button onClick={() => choose('denied')}>Decline</button><button className="primary-button" onClick={() => choose('granted')}>Allow analytics</button></div>
  </aside>
}
