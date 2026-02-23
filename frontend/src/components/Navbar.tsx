import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const BoltIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export default function Navbar() {
  const { user, logout, isAdmin, isTechSupport } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string): boolean =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const linkClass = (path: string): string =>
    isActive(path) ? 'nav-link-active' : 'nav-link';

  const closeMobile = () => setMobileMenuOpen(false);

  const roleColors = isAdmin
    ? 'badge-purple'
    : isTechSupport
      ? 'badge-blue'
      : 'badge-green';

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #30D158, #0A84FF)' }}>
              <BoltIcon />
            </div>
            <span className="font-bold text-lg text-ios-label hidden sm:inline tracking-tight">
              EV Charge
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center space-x-1 bg-ios-fill rounded-2xl px-2 py-1.5">
            <Link to="/" className={linkClass('/')}>Главная</Link>
            <Link to="/stations" className={linkClass('/stations')}>Станции</Link>
            <Link to="/charging" className={linkClass('/charging')}>Зарядка</Link>
            <Link to="/history" className={linkClass('/history')}>История</Link>

            {(isTechSupport || isAdmin) && (
              <>
                <div className="w-px h-5 mx-1 rounded-full" style={{ background: 'rgba(60,60,67,0.15)' }} />
                <Link to="/tech/errors" className={linkClass('/tech/errors')}>Ошибки</Link>
                <Link to="/tech/manage" className={linkClass('/tech/manage')}>Управление</Link>
                <Link to="/tech/stats" className={linkClass('/tech/stats')}>Статистика</Link>
              </>
            )}

            {isAdmin && (
              <>
                <div className="w-px h-5 mx-1 rounded-full" style={{ background: 'rgba(60,60,67,0.15)' }} />
                <Link to="/admin/users" className={linkClass('/admin/users')}>Пользователи</Link>
                <Link to="/admin/stations" className={linkClass('/admin/stations')}>Станции</Link>
                <Link to="/admin/tariffs" className={linkClass('/admin/tariffs')}>Тарифы</Link>
              </>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2.5">
              <span className="text-sm font-medium truncate max-w-[140px]" style={{ color: 'rgba(60,60,67,0.7)' }}>
                {user?.email}
              </span>
              <span className={roleColors}>{user?.role}</span>
            </div>

            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ color: '#FF453A', background: 'rgba(255,69,58,0.08)' }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = 'rgba(255,69,58,0.14)')}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = 'rgba(255,69,58,0.08)')}
            >
              Выход
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200"
              style={{ background: 'rgba(120,120,128,0.1)' }}
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass border-t border-white/50 animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {[
              { to: '/', label: 'Главная' },
              { to: '/stations', label: 'Станции' },
              { to: '/charging', label: 'Зарядка' },
              { to: '/history', label: 'История' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} className={`block ${linkClass(to)}`} onClick={closeMobile}>
                {label}
              </Link>
            ))}

            {(isTechSupport || isAdmin) && (
              <>
                <div className="h-px my-2 rounded-full" style={{ background: 'rgba(60,60,67,0.1)' }} />
                <Link to="/tech/errors" className={`block ${linkClass('/tech/errors')}`} onClick={closeMobile}>Ошибки</Link>
                <Link to="/tech/manage" className={`block ${linkClass('/tech/manage')}`} onClick={closeMobile}>Управление</Link>
                <Link to="/tech/stats" className={`block ${linkClass('/tech/stats')}`} onClick={closeMobile}>Статистика</Link>
              </>
            )}

            {isAdmin && (
              <>
                <div className="h-px my-2 rounded-full" style={{ background: 'rgba(60,60,67,0.1)' }} />
                <Link to="/admin/users" className={`block ${linkClass('/admin/users')}`} onClick={closeMobile}>Пользователи</Link>
                <Link to="/admin/stations" className={`block ${linkClass('/admin/stations')}`} onClick={closeMobile}>Станции</Link>
                <Link to="/admin/tariffs" className={`block ${linkClass('/admin/tariffs')}`} onClick={closeMobile}>Тарифы</Link>
              </>
            )}
          </div>

          <div className="border-t border-white/40 px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ios-label truncate">{user?.email}</p>
              <span className={`${roleColors} mt-1`}>{user?.role}</span>
            </div>
            <button
              onClick={() => { logout(); closeMobile(); }}
              className="text-sm font-semibold px-3 py-1.5 rounded-xl"
              style={{ color: '#FF453A', background: 'rgba(255,69,58,0.1)' }}
            >
              Выход
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
