import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { useI18n } from './i18n.jsx'

export default function PwaStatus({ activeAttempt }) {
  const { t } = useI18n()
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

  if (!updateReady && online) return null

  return <aside className="pwa-status" aria-live="polite">
    {!online && <p><strong>{t('offline')}</strong> — {t('offlineText')}</p>}
    {updateReady && <div><p><strong>{t('updateAvailable')}</strong> {t('updatePreserve')}</p><button type="button" className="secondary-button" disabled={activeAttempt} onClick={() => updateRef.current?.(true)}>{activeAttempt ? t('finishUpdate') : t('applyUpdate')}</button></div>}
  </aside>
}
