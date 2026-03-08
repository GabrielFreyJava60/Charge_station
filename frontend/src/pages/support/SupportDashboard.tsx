import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Link } from 'react-router-dom'
import { fetchStats } from '@/store/slices/techSupportSlice'
import { useI18n } from '@/i18n/I18nContext'
import type { TechSupportStats } from '@/types'

export default function SupportDashboard() {
  const dispatch = useAppDispatch()
  const { t } = useI18n()
  const { stats, loading, error } = useAppSelector((state) => state.techSupport)

  useEffect(() => {
    dispatch(fetchStats())
  }, [dispatch])

  return (
    <div>
      <h1>{t('support.title')}</h1>
      <p>{t('support.subtitle')}</p>

      {loading && <p>{t('support.loading')}</p>}

      {error && <p style={{ color: '#c00' }}>{error as string}</p>}

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16, marginTop: 24, marginBottom: 24 }}>
          <div style={{ border: '1px solid #ccc', padding: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#666' }}>{t('support.activeSessions')}</p>
            <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 'bold' }}>{(stats as TechSupportStats).activeSessions ?? '—'}</p>
          </div>
          <div style={{ border: '1px solid #ccc', padding: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#666' }}>{t('support.totalStations')}</p>
            <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 'bold' }}>{(stats as TechSupportStats).totalStations ?? '—'}</p>
          </div>
          <div style={{ border: '1px solid #ccc', padding: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#666' }}>{t('support.unresolvedErrors')}</p>
            <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 'bold' }}>{(stats as TechSupportStats).unresolvedErrors ?? '—'}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <Link to="/support/logs" style={{ border: '1px solid #ccc', padding: 16, textDecoration: 'none', color: 'inherit' }}>
          <strong>{t('support.errorLogs')}</strong>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>{t('support.errorLogsDesc')}</p>
        </Link>
        <Link to="/support/stations" style={{ border: '1px solid #ccc', padding: 16, textDecoration: 'none', color: 'inherit' }}>
          <strong>{t('support.stations')}</strong>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>{t('support.stationsDesc')}</p>
        </Link>
        <Link to="/support/sessions" style={{ border: '1px solid #ccc', padding: 16, textDecoration: 'none', color: 'inherit' }}>
          <strong>{t('support.sessions')}</strong>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>{t('support.sessionsDesc')}</p>
        </Link>
      </div>
    </div>
  )
}
