import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

export default function PwaStatus({ activeAttempt }) {
  const [online, setOnline] = useState(() => navigator.onLine)
  const [offlineReady, setOfflineReady] = useState(false)
  const [updateReady, setUpdateReady] = useState(false)
  const updateRef = useRef(null)

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine)
    const updateControlledState = () => setOfflineReady(Boolean(navigator.serviceWorker.controller))
    const confirmControlled = () => navigator.serviceWorker.ready.then(updateControlledState).catch(() => setOfflineReady(false))
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    navigator.serviceWorker.addEventListener('controllerchange', updateControlledState)
    updateRef.current = registerSW({
      immediate: true,
      onOfflineReady: confirmControlled,
      onNeedRefresh: () => setUpdateReady(true),
    })
    confirmControlled()
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
      navigator.serviceWorker.removeEventListener('controllerchange', updateControlledState)
    }
  }, [])

  if (!updateReady && online && !offlineReady) return null

  return <aside className="pwa-status" aria-live="polite">
    {!online && <p><strong>Offline</strong> — cases, hints, feedback, and saved progress remain available.</p>}
    {online && offlineReady && !updateReady && <p><strong>Ready offline.</strong> Essential practice content is saved on this device.</p>}
    {updateReady && <div><p><strong>App update available.</strong> Your local progress will be preserved.</p><button type="button" className="secondary-button" disabled={activeAttempt} onClick={() => updateRef.current?.(true)}>{activeAttempt ? 'Finish this attempt to update' : 'Apply update'}</button></div>}
  </aside>
}
