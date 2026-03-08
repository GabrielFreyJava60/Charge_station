import { useAuth } from '@/hooks/useAuth'

export default function Profile() {
  const { user, logout } = useAuth()

  return (
    <div>
      <h1>Profile</h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>Your account details</p>

      <div style={{ border: '1px solid #ccc', padding: 24, maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #ccc' }}>
          <div style={{ width: 48, height: 48, background: '#333', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 'bold' }}>
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{user?.email}</p>
            <span style={{ fontSize: 12, padding: '2px 8px', border: '1px solid #ccc', display: 'inline-block', marginTop: 4 }}>{user?.role}</span>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 4px' }}>Email</p>
          <p style={{ margin: 0, fontSize: 14 }}>{user?.email ?? '—'}</p>
        </div>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 4px' }}>User ID</p>
          <p style={{ margin: 0, fontSize: 14, fontFamily: 'monospace' }}>{user?.userId ?? '—'}</p>
        </div>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 4px' }}>Role</p>
          <p style={{ margin: 0, fontSize: 14 }}>{user?.role ?? '—'}</p>
        </div>

        <button onClick={logout} style={{ padding: '8px 16px', background: '#fff', color: '#c00', border: '1px solid #c00', cursor: 'pointer', width: '100%' }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
