import { useState, useEffect } from 'react';
import { techSupportAPI } from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { LOG_LEVELS, ERROR_LOG_STATUSES } from '../../utils/constants';

export default function ErrorLog() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ level: '', service: '', status: '' });

  useEffect(() => {
    loadErrors();
  }, [filters]);

  const loadErrors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.level) params.level = filters.level;
      if (filters.service) params.service = filters.service;
      if (filters.status) params.status = filters.status;
      const { data } = await techSupportAPI.getErrors(params);
      setErrors(data.errors);
    } catch (err) {
      console.error('Failed to load errors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (errorId, timestamp, newStatus) => {
    try {
      await techSupportAPI.updateErrorStatus(errorId, newStatus, timestamp);
      loadErrors();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Error Log</h1>

      <div className="flex gap-3 mb-6">
        <select
          value={filters.level}
          onChange={(e) => setFilters({ ...filters, level: e.target.value, service: '', status: '' })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">All Levels</option>
          {LOG_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, level: '', service: '' })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">All Statuses</option>
          {ERROR_LOG_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={loadErrors} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
          Refresh
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {errors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No errors found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {errors.map((err) => (
                  <tr key={err.errorId} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><StatusBadge status={err.level} /></td>
                    <td className="px-4 py-3 text-sm">{err.service}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">{err.message}</td>
                    <td className="px-4 py-3"><StatusBadge status={err.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(err.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={err.status}
                        onChange={(e) => handleStatusChange(err.errorId, err.timestamp, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        {ERROR_LOG_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
