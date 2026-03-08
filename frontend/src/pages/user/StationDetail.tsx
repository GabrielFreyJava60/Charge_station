import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { stationsAPI, sessionsAPI } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nContext';
import { STATION_FALLBACKS } from '@/i18n/stationFallbacks';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Port {
  portId: string;
  portNumber: number;
  status: string;
}

interface Station {
  stationId: string;
  name: string;
  address: string;
  name_i18n?: Record<string, string>;
  address_i18n?: Record<string, string>;
  status: string;
  totalPorts: number;
  powerKw: number;
  tariffPerKwh: number;
  latitude: number;
  longitude: number;
  ports?: Port[];
}

function getLocalized(station: Station, field: 'name' | 'address', langCode: string): string {
  const i18n = field === 'name' ? station.name_i18n : station.address_i18n;
  const fromApi = i18n && typeof i18n === 'object' && i18n[langCode];
  if (fromApi) return fromApi;
  const fallback = STATION_FALLBACKS[station.stationId]?.[field]?.[langCode];
  if (fallback) return fallback;
  return station[field];
}

export default function StationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t, langCode } = useI18n();
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [starting, setStarting] = useState<boolean>(false);
  const [battery, setBattery] = useState<number>(60);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadStation();
  }, [id]);

  const loadStation = async () => {
    try {
      const { data } = await stationsAPI.get(id as string);
      setStation(data.station);
    } catch (err) {
      console.error('Failed to load station:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCharging = async (portId: string) => {
    setStarting(true);
    setError('');
    try {
      await sessionsAPI.start({ stationId: id as string, portId, batteryCapacityKwh: battery });
      navigate('/sessions/current');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || t('detail.startError'));
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!station) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h2>{t('detail.notFound')}</h2>
        <button onClick={() => navigate('/stations')} style={{ marginTop: 16, padding: '8px 16px', background: '#fff', border: '1px solid #333', cursor: 'pointer' }}>
          {t('detail.backToList')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate('/stations')} style={{ marginBottom: 24, padding: 0, color: '#333', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
        ← {t('detail.backAll')}
      </button>

      <div style={{ border: '1px solid #ccc', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: '0 0 8px' }}>{getLocalized(station, 'name', langCode)}</h1>
            <p style={{ fontSize: 14, color: '#666', margin: 0 }}>{getLocalized(station, 'address', langCode)}</p>
          </div>
          <StatusBadge status={station.status} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div><p style={{ margin: 0, fontWeight: 'bold' }}>{station.totalPorts}</p><p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>{t('detail.totalPorts')}</p></div>
          <div><p style={{ margin: 0, fontWeight: 'bold' }}>{station.powerKw} kW</p><p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>{t('detail.power')}</p></div>
          <div><p style={{ margin: 0, fontWeight: 'bold' }}>${station.tariffPerKwh}</p><p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>{t('detail.costKwh')}</p></div>
          <div><p style={{ margin: 0, fontWeight: 'bold', fontSize: 12 }}>{station.latitude.toFixed(2)}, {station.longitude.toFixed(2)}</p><p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>{t('detail.coords')}</p></div>
        </div>

        {error && <p style={{ color: '#c00', marginBottom: 16, padding: 8, border: '1px solid #c00', background: '#fff0f0' }}>{error}</p>}

        {isAuthenticated && station.status === 'ACTIVE' && (
          <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ccc' }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>{t('detail.batteryLabel')}</label>
            <input type="number" value={battery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBattery(Number(e.target.value))} min={10} max={200} style={{ padding: 8, border: '1px solid #ccc', width: 100 }} />
            <span style={{ marginLeft: 12, fontSize: 12, color: '#666' }}>{t('detail.batteryHint')}</span>
          </div>
        )}

        {!isAuthenticated && station.status === 'ACTIVE' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, border: '1px solid #ccc', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 14 }}>{t('detail.loginPrompt')}</p>
            <Link to={`/login?redirect=/stations/${id}`} style={{ padding: '8px 16px', background: '#333', color: '#fff', textDecoration: 'none' }}>{t('detail.loginBtn')}</Link>
          </div>
        )}
      </div>

      <h2 style={{ marginBottom: 16 }}>{t('detail.chargingPorts')} ({station.ports?.length || 0})</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {(station.ports || []).map((port) => (
          <div key={port.portId} style={{ border: '1px solid #ccc', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 'bold' }}>{t('detail.port')} #{port.portNumber}</span>
              <StatusBadge status={port.status} />
            </div>
            {port.status === 'FREE' && station.status === 'ACTIVE' ? (
              isAuthenticated ? (
                <button onClick={() => handleStartCharging(port.portId)} disabled={starting} style={{ width: '100%', padding: '8px 16px', background: '#333', color: '#fff', border: 'none', cursor: starting ? 'not-allowed' : 'pointer' }}>
                  {starting ? t('detail.starting') : t('detail.startCharging')}
                </button>
              ) : (
                <Link to={`/login?redirect=/stations/${id}`} style={{ display: 'block', textAlign: 'center', padding: '8px 16px', border: '1px solid #333', textDecoration: 'none', color: '#333' }}>{t('detail.loginRequired')}</Link>
              )
            ) : (
              <button disabled style={{ width: '100%', padding: '8px 16px', background: '#eee', color: '#666', border: '1px solid #ccc', cursor: 'not-allowed' }}>
                {port.status === 'OCCUPIED' ? t('detail.occupied') : t('detail.unavailable')}
              </button>
            )}
          </div>
        ))}
      </div>
      {(!station.ports || station.ports.length === 0) && (
        <div style={{ padding: 24, textAlign: 'center', border: '1px dashed #ccc' }}>{t('detail.noPorts')}</div>
      )}
    </div>
  );
}
