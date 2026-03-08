import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchAllSessions, forceStopSession } from '@/store/slices/sessionsSlice'
import { useI18n } from '@/i18n/I18nContext'
import type { Session } from '@/types'

export default function SupportSessions() {
  const dispatch = useAppDispatch()
  const { t } = useI18n()
  const { allSessions, loading, error } = useAppSelector((state) => state.sessions)

  useEffect(() => {
    dispatch(fetchAllSessions('ACTIVE'))
  }, [dispatch])

  const handleForceStop = (sessionId: string) => {
    if (window.confirm(t('supportSessions.forceStopConfirm'))) {
      dispatch(forceStopSession(sessionId))
    }
  }

  return (
    <div>
      <h1>{t('supportSessions.title')}</h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>{t('supportSessions.subtitle')}</p>

      {loading && <p>{t('supportSessions.loading')}</p>}

      {error && <p style={{ color: '#c00', padding: 8, border: '1px solid #c00' }}>{error as string}</p>}

      {!loading && !error && allSessions.length === 0 && (
        <div style={{ padding: 24, border: '1px solid #ccc', textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold' }}>{t('supportSessions.empty')}</p>
          <p style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{t('supportSessions.emptyHint')}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {allSessions.map((session: Session) => (
          <div key={session.sessionId} style={{ border: '1px solid #ccc', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <p style={{ fontWeight: 'bold', margin: 0 }}>{session.sessionId}</p>
              <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0' }}>
                {t('supportSessions.station')}: {session.stationId} · {t('supportSessions.port')}: {session.portId}
              </p>
              <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>
                {session.energyConsumedKwh?.toFixed(2) ?? '0.00'} kWh · {session.totalCost?.toFixed(2) ?? '0.00'} ₽
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, padding: '4px 8px', background: '#e8f5e9', border: '1px solid #ccc' }}>
                {t(`status.${session.status}`)}
              </span>
              <button
                onClick={() => handleForceStop(session.sessionId)}
                style={{ padding: '4px 12px', fontSize: 12, background: '#fff', color: '#c00', border: '1px solid #c00', cursor: 'pointer' }}
              >
                {t('supportSessions.forceStop')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
