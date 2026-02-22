import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout, isAdmin, isTechSupport } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  const linkClass = (path) =>
    `block px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive(path)
        ? 'bg-green-100 text-green-800'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  const closeMobile = () => setMobileMenuOpen(false);

  const navLinks = (
    <>
      <Link to="/" className={linkClass('/')} onClick={closeMobile}>Главная</Link>
      <Link to="/stations" className={linkClass('/stations')} onClick={closeMobile}>Станции</Link>
      <Link to="/charging" className={linkClass('/charging')} onClick={closeMobile}>Зарядка</Link>
      <Link to="/history" className={linkClass('/history')} onClick={closeMobile}>История</Link>

      {(isTechSupport || isAdmin) && (
        <>
          <div className="hidden md:block w-px bg-gray-300 mx-1 self-stretch" />
          <div className="md:hidden border-t border-gray-200 my-1" />
          <Link to="/tech/errors" className={linkClass('/tech/errors')} onClick={closeMobile}>Ошибки</Link>
          <Link to="/tech/manage" className={linkClass('/tech/manage')} onClick={closeMobile}>Управление</Link>
          <Link to="/tech/stats" className={linkClass('/tech/stats')} onClick={closeMobile}>Статистика</Link>
        </>
      )}

      {isAdmin && (
        <>
          <div className="hidden md:block w-px bg-gray-300 mx-1 self-stretch" />
          <div className="md:hidden border-t border-gray-200 my-1" />
          <Link to="/admin/users" className={linkClass('/admin/users')} onClick={closeMobile}>Пользователи</Link>
          <Link to="/admin/stations" className={linkClass('/admin/stations')} onClick={closeMobile}>Админ станции</Link>
          <Link to="/admin/tariffs" className={linkClass('/admin/tariffs')} onClick={closeMobile}>Тарифы</Link>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 shrink-0">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-bold text-lg text-gray-900 hidden sm:inline">EV Charge</span>
            </Link>

            <div className="hidden lg:flex ml-8 items-center space-x-1">
              {navLinks}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-3">
              <span className="text-sm text-gray-500 truncate max-w-[150px]">
                {user?.email}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                isAdmin ? 'bg-purple-100 text-purple-800'
                : isTechSupport ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
              }`}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-red-600 transition font-medium hidden sm:block"
            >
              Выход
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navLinks}
          </div>
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isAdmin ? 'bg-purple-100 text-purple-800'
                  : isTechSupport ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
                }`}>
                  {user?.role}
                </span>
              </div>
              <button
                onClick={() => { logout(); closeMobile(); }}
                className="text-sm text-red-600 font-medium"
              >
                Выход
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
