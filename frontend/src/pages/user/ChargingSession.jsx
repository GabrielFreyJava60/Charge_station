import { useState, useCallback } from 'react';
import { sessionsAPI } from '../../api/client';
import { usePolling } from '../../hooks/usePolling';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ChargingSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const { data } = await sessionsAPI.getActive();
      setSession(data.session);
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
      <div className="text-center py-16">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-600 mb-2">No Active Session</h2>
        <p className="text-gray-400">Go to a station and start charging your EV</p>
      </div>
    );
  }

  const percent = session.chargePercent || 0;
  const progressColor = percent >= 80 ? 'bg-green-500' : percent >= 50 ? 'bg-blue-500' : 'bg-yellow-500';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Active Charging Session</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">Session ID</p>
            <p className="font-mono text-sm">{session.sessionId}</p>
          </div>
          <StatusBadge status={session.status} />
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative w-48 h-48">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={percent >= 80 ? '#22c55e' : percent >= 50 ? '#3b82f6' : '#eab308'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${percent * 2.64} 264`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{percent.toFixed(1)}%</span>
              <span className="text-sm text-gray-500">charged</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${progressColor}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Energy Consumed</p>
            <p className="text-xl font-bold">{session.energyConsumedKwh.toFixed(2)} kWh</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Current Cost</p>
            <p className="text-xl font-bold text-green-600">${session.totalCost.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Tariff</p>
            <p className="text-xl font-bold">${session.tariffPerKwh}/kWh</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Battery Capacity</p>
            <p className="text-xl font-bold">{session.batteryCapacityKwh} kWh</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
          <span>Station: {session.stationId}</span>
          <span>Port: {session.portId}</span>
        </div>

        {['STARTED', 'IN_PROGRESS'].includes(session.status) && (
          <button
            onClick={handleStop}
            disabled={stopping}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-medium"
          >
            {stopping ? 'Stopping...' : 'Stop Charging'}
          </button>
        )}
      </div>
    </div>
  );
}
