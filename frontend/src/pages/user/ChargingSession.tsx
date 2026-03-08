import { useState, useCallback } from 'react';
import { sessionsAPI } from '@/api/client';
import { usePolling } from '@/hooks/usePolling';
import { useI18n } from '@/i18n/I18nContext';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Session {
  sessionId: string;
  status: string;
  chargePercent: number;
  energyConsumedKwh: number;
  totalCost: number;
  tariffPerKwh: number;
  batteryCapacityKwh: number;
  stationId: string;
  portId: string;
}

export default function ChargingSession() {
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [stopping, setStopping] = useState<boolean>(false);

  const fetchSession = useCallback(async () => {
    try {
      const { data } = await sessionsAPI.getActive();
      const newSession: Session | null = data.session;
      setSession(newSession);
    } catch (err) {
      console.error('Failed to fetch active session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchSession, 3000, true);

  const handleStop = async () => {
    if (!session) return;
    setStopping(true);
    try {
      await sessionsAPI.stop(session.sessionId);
      fetchSession();
    } catch (err) {
      console.error('Failed to stop session:', err);
    } finally {
      setStopping(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!session) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h2>{t('charging.noSession')}</h2>
        <p style={{ fontSize: 14, color: '#666', marginTop: 8 }}>{t('charging.noSessionHint')}</p>
      </div>
    );
  }

  const percent = session.chargePercent || 0;
  const isCharging = ['STARTED', 'IN_PROGRESS'].includes(session.status);
  const isComplete = session.status === 'COMPLETED';

  return (
    <div>
      <h1>{isCharging ? t('charging.active') : isComplete ? t('charging.complete') : t('charging.session')}</h1>

      <div style={{ border: '1px solid #ccc', padding: 24, maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{t('charging.sessionId')}</p>
            <p style={{ margin: '4px 0 0', fontSize: 14, fontFamily: 'monospace' }}>{session.sessionId?.slice(0, 12)}...</p>
          </div>
          <StatusBadge status={session.status} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 36, fontWeight: 'bold', margin: 0 }}>{percent.toFixed(1)}%</p>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>{t('charging.charged')}</p>
        </div>

        <div style={{ marginBottom: 24, height: 8, background: '#eee', overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, height: '100%', background: '#333' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div style={{ padding: 12, border: '1px solid #ccc' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{t('charging.consumed')}</p>
            <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>{session.energyConsumedKwh.toFixed(2)} kWh</p>
          </div>
          <div style={{ padding: 12, border: '1px solid #ccc' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{t('charging.cost')}</p>
            <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>${session.totalCost.toFixed(2)}</p>
          </div>
          <div style={{ padding: 12, border: '1px solid #ccc' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{t('charging.tariff')}</p>
            <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>${session.tariffPerKwh}/kWh</p>
          </div>
          <div style={{ padding: 12, border: '1px solid #ccc' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{t('charging.capacity')}</p>
            <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>{session.batteryCapacityKwh} kWh</p>
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
          {t('charging.station')}: {session.stationId?.slice(0, 8)}... · {t('charging.port')}: {session.portId}
        </p>

        {isCharging && (
          <button
            onClick={handleStop}
            disabled={stopping}
            style={{ width: '100%', padding: '8px 16px', background: '#c00', color: '#fff', border: 'none', cursor: stopping ? 'not-allowed' : 'pointer' }}
          >
            {stopping ? t('charging.stopping') : t('charging.stopCharging')}
          </button>
        )}
      </div>
    </div>
  );
}
