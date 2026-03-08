import { useState, useEffect } from 'react';
import { sessionsAPI } from '@/api/client';
import { useI18n } from '@/i18n/I18nContext';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Session {
  sessionId: string;
  stationId: string;
  status: string;
  chargePercent: number;
  energyConsumedKwh: number;
  totalCost: number;
  createdAt: string;
}

export default function SessionHistory() {
  const { t, dateLocale } = useI18n();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data } = await sessionsAPI.getHistory();
      setSessions(data.sessions);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1>{t('history.title')}</h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>{t('history.subtitle')}</p>

      {sessions.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', border: '1px solid #ccc' }}>
          <h2 style={{ marginBottom: 8 }}>{t('history.empty')}</h2>
          <p style={{ fontSize: 14, color: '#666' }}>{t('history.emptyHint')}</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #ccc' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[t('history.session'), t('history.station'), t('history.status'), t('history.charge'), t('history.consumed'), t('history.cost'), t('history.date')].map((header) => (
                    <th key={header} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #ccc', fontSize: 12, color: '#666' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.sessionId} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px 12px', fontSize: 14, fontFamily: 'monospace' }}>{s.sessionId.slice(0, 8)}...</td>
                    <td style={{ padding: '8px 12px', fontSize: 14 }}>{s.stationId}</td>
                    <td style={{ padding: '8px 12px' }}><StatusBadge status={s.status} /></td>
                    <td style={{ padding: '8px 12px', fontSize: 14 }}>{s.chargePercent.toFixed(1)}%</td>
                    <td style={{ padding: '8px 12px', fontSize: 14 }}>{s.energyConsumedKwh.toFixed(2)} kWh</td>
                    <td style={{ padding: '8px 12px', fontSize: 14 }}>${s.totalCost.toFixed(2)}</td>
                    <td style={{ padding: '8px 12px', fontSize: 14, color: '#666' }}>
                      {new Date(s.createdAt).toLocaleDateString(dateLocale, {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}
    </div>
  );
}
