import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { checkHealth } from '../store/slices/healthSlice';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { response, loading, error, lastChecked } = useSelector((state) => state.health);
  const { user, isAdmin, isTechSupport } = useAuth();

  const handleHealthCheck = () => dispatch(checkHealth());
  const handleFullHealthCheck = () => {
    dispatch(checkHealth({ full: true }));
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        Добро пожаловать, {user?.email?.split('@')[0] || 'пользователь'}
      </h1>
      <p className="text-gray-500 mb-8">Система управления зарядными станциями для электромобилей</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link to="/stations" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition hover:border-green-300">
          <div className="text-green-600 mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h3 className="font-semibold text-gray-900">Станции</h3>
          <p className="text-sm text-gray-500 mt-1">Просмотр списка зарядных станций</p>
        </Link>

        <Link to="/charging" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition hover:border-blue-300">
          <div className="text-blue-600 mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <h3 className="font-semibold text-gray-900">Текущая зарядка</h3>
          <p className="text-sm text-gray-500 mt-1">Отслеживание активной сессии</p>
        </Link>

        <Link to="/history" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition hover:border-purple-300">
          <div className="text-purple-600 mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="font-semibold text-gray-900">История</h3>
          <p className="text-sm text-gray-500 mt-1">Архив завершённых сессий</p>
        </Link>

        {(isTechSupport || isAdmin) && (
          <Link to="/tech/stats" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition hover:border-orange-300">
            <div className="text-orange-600 mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="font-semibold text-gray-900">Мониторинг</h3>
            <p className="text-sm text-gray-500 mt-1">Статистика нагрузки системы</p>
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin/users" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition hover:border-red-300">
            <div className="text-red-600 mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="font-semibold text-gray-900">Пользователи</h3>
            <p className="text-sm text-gray-500 mt-1">Управление ролями и блокировкой</p>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Проверка работоспособности системы</h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={handleHealthCheck}
            disabled={loading}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium text-sm"
          >
            {loading ? 'Проверка...' : 'Health Check (Gateway)'}
          </button>
          <button
            onClick={handleFullHealthCheck}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium text-sm"
          >
            {loading ? 'Проверка...' : 'Full Health Check (Gateway + Lambda + DB)'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
            <p className="font-medium">Ошибка</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {response && (
          <div className={`border rounded-lg p-4 ${response.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full ${response.status === 'ok' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="font-semibold text-gray-900">
                  Статус: {response.status === 'ok' ? 'OK' : 'Degraded'}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                Время ответа: {response.totalResponseTimeMs}ms
              </span>
            </div>
            <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
            {lastChecked && (
              <p className="text-xs text-gray-500 mt-2">
                Последняя проверка: {new Date(lastChecked).toLocaleString('ru-RU')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
