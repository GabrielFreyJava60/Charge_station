import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stationsAPI } from '@/api/client';
import { useI18n } from '@/i18n/I18nContext';
import { STATION_FALLBACKS } from '@/i18n/stationFallbacks';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';

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
}

function getLocalized(station: Station, field: 'name' | 'address', langCode: string): string {
  const i18n = field === 'name' ? station.name_i18n : station.address_i18n;
  const fromApi = i18n && typeof i18n === 'object' && i18n[langCode];
  if (fromApi) return fromApi;
  const fallback = STATION_FALLBACKS[station.stationId]?.[field]?.[langCode];
  if (fallback) return fallback;
  return station[field];
}

export default function StationList() {
  const { t, langCode } = useI18n();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    loadStations();
  }, [filter]);

  const loadStations = async () => {
    try {
      const { data } = await stationsAPI.list(filter || undefined);
      setStations(data.stations);
    } catch (err) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div>
          <h1>{t('stations.title')}</h1>
          <p style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{t('stations.subtitle')}</p>
        </div>
        <select
          value={filter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value)}
          style={{ padding: 8, border: '1px solid #ccc', minWidth: 160 }}
        >
          <option value="">{t('stations.filterAll')}</option>
          <option value="ACTIVE">{t('stations.filterActive')}</option>
          <option value="MAINTENANCE">{t('stations.filterMaint')}</option>
          <option value="OUT_OF_ORDER">{t('stations.filterOutOfOrder')}</option>
        </select>
      </div>

      {stations.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', border: '1px solid #ccc' }}>
          <h2 style={{ marginBottom: 8 }}>{t('stations.empty')}</h2>
          <p style={{ fontSize: 14, color: '#666' }}>{t('stations.emptyHint')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {stations.map((station) => (
            <Link
              key={station.stationId}
              to={`/stations/${station.stationId}`}
              style={{ border: '1px solid #ccc', padding: 16, textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 'bold' }}>{getLocalized(station, 'name', langCode)}</h3>
                  <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0' }}>{getLocalized(station, 'address', langCode)}</p>
                </div>
                <StatusBadge status={station.status} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, fontSize: 12 }}>
                <span>{station.totalPorts} {t('stations.ports')}</span>
                <span>{station.powerKw} kW</span>
                <span>${station.tariffPerKwh} {t('stations.perKwh')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
