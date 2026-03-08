import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const sections = [
  { to: '/admin/users', label: 'User Management', desc: 'Change roles, block or delete users' },
  { to: '/admin/stations', label: 'Stations Management', desc: 'Create, edit, commission stations' },
  { to: '/admin/tariffs', label: 'Tariffs Management', desc: 'Configure pricing' },
  { to: '/support/dashboard', label: 'Operations Dashboard', desc: 'Monitor system' },
]

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.email?.split('@')[0]}. Full system control.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 24 }}>
        {sections.map(({ to, label, desc }) => (
          <Link key={to} to={to} style={{ border: '1px solid #ccc', padding: 16, textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ margin: 0 }}>{label}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
