import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Link } from 'react-router-dom'
import { fetchStats } from '@/store/slices/techSupportSlice'
import type { TechSupportStats } from '@/types'

export default function SupportDashboard() {
  const dispatch = useAppDispatch()
  const { stats, loading, error } = useAppSelector((state) => state.techSupport)

  useEffect(() => {
    dispatch(fetchStats())
  }, [dispatch])

  return (
    <div>
      <h1>Operations Dashboard</h1>
      <p>Active requests, errors, and system overview</p>

      {loading && <p>Loading stats...</p>}

      {error && <p style={{ color: '#c00' }}>{error as string}</p>}

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16, marginTop: 24, marginBottom: 24 }}>
          <div style={{ border: '1px solid #ccc', padding: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#666' }}>Active Sessions</p>
            <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 'bold' }}>{(stats as TechSupportStats).activeSessions ?? '—'}</p>
          </div>
          <div style={{ border: '1px solid #ccc', padding: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#666' }}>Total Stations</p>
            <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 'bold' }}>{(stats as TechSupportStats).totalStations ?? '—'}</p>
          </div>
          <div style={{ border: '1px solid #ccc', padding: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#666' }}>Unresolved Errors</p>
            <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 'bold' }}>{(stats as TechSupportStats).unresolvedErrors ?? '—'}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <Link to="/support/logs" style={{ border: '1px solid #ccc', padding: 16, textDecoration: 'none', color: 'inherit' }}>
          <strong>Error Logs</strong>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>Review and resolve</p>
        </Link>
        <Link to="/support/stations" style={{ border: '1px solid #ccc', padding: 16, textDecoration: 'none', color: 'inherit' }}>
          <strong>Stations</strong>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>Manage modes</p>
        </Link>
        <Link to="/support/sessions" style={{ border: '1px solid #ccc', padding: 16, textDecoration: 'none', color: 'inherit' }}>
          <strong>Active Sessions</strong>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>Monitor sessions</p>
        </Link>
      </div>
    </div>
  )
}
