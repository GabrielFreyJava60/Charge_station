import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { checkHealth } from '@/store/slices/healthSlice'
import { useAuth } from '@/hooks/useAuth'

const cards = [
  { to: '/stations', label: 'Stations', desc: 'Station list' },
  { to: '/sessions/current', label: 'Charging', desc: 'Active session' },
  { to: '/sessions/history', label: 'History', desc: 'Session archive' },
]

const techCards = [
  { to: '/support/dashboard', label: 'Monitoring', desc: 'Stats' },
]

const adminCards = [
  { to: '/admin/dashboard', label: 'Admin', desc: 'Roles' },
]

export default function Dashboard() {
  const dispatch = useAppDispatch()
  const { response, loading, error, lastChecked } = useAppSelector((state) => state.health)
  const { user, isAdmin, isTechSupport } = useAuth()

  const handleHealthCheck = () => dispatch(checkHealth(undefined))
  const handleFullHealthCheck = () => dispatch(checkHealth({ full: true }))

  const allCards = [
    ...cards,
    ...((isTechSupport || isAdmin) ? techCards : []),
    ...(isAdmin ? adminCards : []),
  ]

  return (
    <div>
      <h1>Hello, {user?.email?.split('@')[0] || 'user'}</h1>
      <p>EV Charging Station Management</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginTop: 24, marginBottom: 24 }}>
        {allCards.map((card) => (
          <Link key={card.to} to={card.to} style={{ border: '1px solid #ccc', padding: 16, textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ margin: 0 }}>{card.label}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>{card.desc}</p>
          </Link>
        ))}
      </div>

      <div style={{ border: '1px solid #ccc', padding: 16 }}>
        <h2>System Health</h2>
        <div style={{ marginTop: 12 }}>
          <button onClick={handleHealthCheck} disabled={loading} style={{ marginRight: 8, padding: '8px 16px' }}>
            {loading ? 'Checking...' : 'Health Check'}
          </button>
          <button onClick={handleFullHealthCheck} disabled={loading} style={{ padding: '8px 16px' }}>
            {loading ? 'Checking...' : 'Full Health Check'}
          </button>
        </div>
        {error && <p style={{ color: '#c00', marginTop: 12 }}>{error as string}</p>}
        {response && (
          <div style={{ marginTop: 12, padding: 8, background: '#f5f5f5', fontSize: 14 }}>
            <span>{(response as { status: string }).status === 'ok' ? 'System OK' : 'Degraded'}</span>
            <span style={{ marginLeft: 8 }}>{(response as { totalResponseTimeMs?: number }).totalResponseTimeMs}ms</span>
            {lastChecked && <p style={{ marginTop: 4, fontSize: 12 }}>Checked: {new Date(lastChecked as string).toLocaleString()}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
