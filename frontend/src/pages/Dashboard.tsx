import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { checkHealth } from '@/store/slices/healthSlice'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'

export default function Dashboard() {
  const dispatch = useAppDispatch()
  const { t } = useI18n()
  const { response, loading, error, lastChecked } = useAppSelector((state) => state.health)
  const { user, isAdmin, isTechSupport } = useAuth()

  const handleHealthCheck = () => dispatch(checkHealth(undefined))
  const handleFullHealthCheck = () => dispatch(checkHealth({ full: true }))

  const cards = [
    { to: '/stations', labelKey: 'dashboard.stations', descKey: 'dashboard.stationsDesc' },
    { to: '/sessions/current', labelKey: 'dashboard.charging', descKey: 'dashboard.chargingDesc' },
    { to: '/sessions/history', labelKey: 'dashboard.history', descKey: 'dashboard.historyDesc' },
  ]
  const techCards = [
    { to: '/support/dashboard', labelKey: 'dashboard.monitoring', descKey: 'dashboard.monitoringDesc' },
  ]
  const adminCards = [
    { to: '/admin/dashboard', labelKey: 'dashboard.admin', descKey: 'dashboard.adminDesc' },
  ]

  const allCards = [
    ...cards,
    ...((isTechSupport || isAdmin) ? techCards : []),
    ...(isAdmin ? adminCards : []),
  ]

  return (
    <div>
      <h1>{t('dashboard.hello')}, {user?.email?.split('@')[0] || t('dashboard.user')}</h1>
      <p>{t('dashboard.subtitle')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginTop: 24, marginBottom: 24 }}>
        {allCards.map((card) => (
          <Link key={card.to} to={card.to} style={{ border: '1px solid #ccc', padding: 16, textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ margin: 0 }}>{t(card.labelKey)}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>{t(card.descKey)}</p>
          </Link>
        ))}
      </div>

      <div style={{ border: '1px solid #ccc', padding: 16 }}>
        <h2>{t('guest.health')}</h2>
        <div style={{ marginTop: 12 }}>
          <button onClick={handleHealthCheck} disabled={loading} style={{ marginRight: 8, padding: '8px 16px' }}>
            {loading ? t('guest.checking') : t('guest.healthCheck')}
          </button>
          <button onClick={handleFullHealthCheck} disabled={loading} style={{ padding: '8px 16px' }}>
            {loading ? t('guest.checking') : t('guest.fullCheck')}
          </button>
        </div>
        {error && <p style={{ color: '#c00', marginTop: 12 }}>{error as string}</p>}
        {response && (
          <div style={{ marginTop: 12, padding: 8, background: '#f5f5f5', fontSize: 14 }}>
            <span>{(response as { status: string }).status === 'ok' ? t('guest.systemOk') : t('guest.degraded')}</span>
            <span style={{ marginLeft: 8 }}>{(response as { totalResponseTimeMs?: number }).totalResponseTimeMs}ms</span>
            {lastChecked && <p style={{ marginTop: 4, fontSize: 12 }}>{t('common.checked')}: {new Date(lastChecked as string).toLocaleString()}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
