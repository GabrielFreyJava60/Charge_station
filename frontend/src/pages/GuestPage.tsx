import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { checkHealth } from '@/store/slices/healthSlice'
import { useI18n } from '@/i18n/I18nContext'

const STUB_STATIONS = [
  { id: '1', name: 'Central Hub', address: 'Main St, 123', status: 'ACTIVE', ports: 4, power: 50, tariff: 0.25 },
  { id: '2', name: 'Airport Fast', address: 'Airport Blvd, 456', status: 'ACTIVE', ports: 2, power: 150, tariff: 0.35 },
  { id: '3', name: 'Park Station', address: 'Park Ave, 789', status: 'MAINTENANCE', ports: 6, power: 22, tariff: 0.20 },
]

export default function GuestPage() {
  const dispatch = useAppDispatch()
  const { t } = useI18n()
  const { response, loading, error, lastChecked } = useAppSelector((state) => state.health)

  const handleHealthCheck = () => dispatch(checkHealth(undefined))
  const handleFullHealthCheck = () => dispatch(checkHealth({ full: true }))

  return (
    <div>
      <h1>{t('guest.title')}</h1>
      <p>{t('guest.subtitle')}</p>

      <div style={{ marginTop: 16, marginBottom: 24 }}>
        <Link to="/login" style={{ marginRight: 8, padding: '8px 16px', background: '#333', color: '#fff', textDecoration: 'none' }}>
          {t('guest.signIn')}
        </Link>
        <Link to="/register" style={{ padding: '8px 16px', border: '1px solid #333', textDecoration: 'none', color: '#333' }}>
          {t('guest.register')}
        </Link>
      </div>

      <div style={{ border: '1px solid #ccc', padding: 16, marginBottom: 24 }}>
        <h2>{t('guest.health')}</h2>
        <div style={{ marginTop: 12 }}>
          <button onClick={handleHealthCheck} disabled={loading} style={{ marginRight: 8, padding: '8px 16px' }}>
            {loading ? t('guest.checking') : t('guest.healthCheck')}
          </button>
          <button onClick={handleFullHealthCheck} disabled={loading} style={{ padding: '8px 16px' }}>
            {loading ? t('guest.checking') : t('guest.fullCheck')}
          </button>
        </div>
        {error && <p style={{ color: '#c00', marginTop: 12 }}>{error}</p>}
        {response && (
          <div style={{ marginTop: 12, padding: 8, background: '#f5f5f5', fontSize: 14 }}>
            <span>{(response as { status: string }).status === 'ok' ? t('guest.systemOk') : t('guest.degraded')}</span>
            <span style={{ marginLeft: 8 }}>{(response as { totalResponseTimeMs?: number }).totalResponseTimeMs}ms</span>
            {lastChecked && <p style={{ marginTop: 4, fontSize: 12 }}>{t('common.checked')}: {new Date(lastChecked as string).toLocaleString()}</p>}
          </div>
        )}
      </div>

      <h2>{t('guest.stationsStub')}</h2>
      <p>{t('guest.stubHint')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
        {STUB_STATIONS.map((s) => (
          <div key={s.id} style={{ border: '1px solid #ccc', padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>{s.name}</strong>
              <span style={{ fontSize: 12 }}>{t(`status.${s.status}`)}</span>
            </div>
            <p style={{ fontSize: 14, margin: 0 }}>{s.address}</p>
            <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{s.ports} {t('guest.ports')} · {s.power} kW · ${s.tariff}/kWh</p>
          </div>
        ))}
      </div>
    </div>
  )
}
