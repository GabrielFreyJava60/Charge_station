import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { checkHealth } from '@/store/slices/healthSlice'

const STUB_STATIONS = [
  { id: '1', name: 'Central Hub', address: 'Main St, 123', status: 'ACTIVE', ports: 4, power: 50, tariff: 0.25 },
  { id: '2', name: 'Airport Fast', address: 'Airport Blvd, 456', status: 'ACTIVE', ports: 2, power: 150, tariff: 0.35 },
  { id: '3', name: 'Park Station', address: 'Park Ave, 789', status: 'MAINTENANCE', ports: 6, power: 22, tariff: 0.20 },
]

export default function GuestPage() {
  const dispatch = useAppDispatch()
  const { response, loading, error, lastChecked } = useAppSelector((state) => state.health)

  const handleHealthCheck = () => dispatch(checkHealth(undefined))
  const handleFullHealthCheck = () => dispatch(checkHealth({ full: true }))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ios-label tracking-tight">EV Charge</h1>
        <p className="text-base mt-1" style={{ color: 'rgba(60,60,67,0.55)' }}>
          Browse charging stations. Sign in to start charging.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to="/login"
          className="px-5 py-2.5 rounded-xl font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #30D158, #0A84FF)' }}
        >
          Sign In
        </Link>
        <Link
          to="/register"
          className="px-5 py-2.5 rounded-xl font-semibold transition-all"
          style={{ color: 'rgba(60,60,67,0.8)', background: 'rgba(120,120,128,0.1)' }}
        >
          Register
        </Link>
      </div>

      <div className="glass rounded-3xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-ios-label mb-4">System Health</h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={handleHealthCheck}
            disabled={loading}
            className="btn-ios-primary disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Health Check'}
          </button>
          <button
            onClick={handleFullHealthCheck}
            disabled={loading}
            className="btn-ios-blue disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Full Health Check'}
          </button>
        </div>
        {error && (
          <div className="px-4 py-3 rounded-2xl text-sm mb-4" style={{ background: 'rgba(255,69,58,0.1)', color: '#FF453A' }}>
            {error}
          </div>
        )}
        {response && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(28,28,30,0.9)', color: '#30D158' }}>
            <div className="px-4 py-3 flex justify-between items-center">
              <span>{(response as { status: string }).status === 'ok' ? 'System OK' : 'Degraded'}</span>
              <span className="text-sm opacity-80">{(response as { totalResponseTimeMs?: number }).totalResponseTimeMs}ms</span>
            </div>
            {lastChecked && (
              <p className="text-xs px-4 py-2 opacity-70">Checked: {new Date(lastChecked as string).toLocaleString()}</p>
            )}
          </div>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ios-label">Charging Stations (stub)</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(60,60,67,0.55)' }}>Sample data. Sign in for full list.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STUB_STATIONS.map((s) => (
          <div key={s.id} className="glass rounded-3xl p-5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-ios-label">{s.name}</h3>
              <span
                className="text-xs px-2 py-0.5 rounded-lg"
                style={{
                  background: s.status === 'ACTIVE' ? 'rgba(48,209,88,0.15)' : 'rgba(255,159,10,0.15)',
                  color: s.status === 'ACTIVE' ? '#30D158' : '#FF9F0A',
                }}
              >
                {s.status}
              </span>
            </div>
            <p className="text-sm mb-3" style={{ color: 'rgba(60,60,67,0.6)' }}>{s.address}</p>
            <p className="text-xs" style={{ color: 'rgba(60,60,67,0.5)' }}>
              {s.ports} ports · {s.power} kW · ${s.tariff}/kWh
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
