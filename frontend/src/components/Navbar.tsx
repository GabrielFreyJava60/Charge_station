import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function Navbar() {
  const { user, logout, isAdmin, isTechSupport, isAuthenticated } = useAuth()
  const { t } = useI18n()
  const location = useLocation()

  const isActive = (path: string): boolean =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path))

  return (
    <nav style={{ borderBottom: '1px solid #ccc', padding: '12px 24px', background: '#f5f5f5' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Link to="/" style={{ fontWeight: 'bold', textDecoration: 'none', color: 'inherit' }}>
          EV Charge
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/stations" style={{ textDecoration: 'none', color: isActive('/stations') ? '#000' : '#666' }}>{t('nav.stations')}</Link>
          {isAuthenticated && (
            <>
              <Link to="/sessions/current" style={{ textDecoration: 'none', color: isActive('/sessions/current') ? '#000' : '#666' }}>{t('nav.charging')}</Link>
              <Link to="/sessions/history" style={{ textDecoration: 'none', color: isActive('/sessions/history') ? '#000' : '#666' }}>{t('nav.history')}</Link>
            </>
          )}
          {(isTechSupport || isAdmin) && (
            <>
              <Link to="/support/dashboard" style={{ textDecoration: 'none', color: isActive('/support/dashboard') ? '#000' : '#666' }}>{t('nav.dashboard')}</Link>
              <Link to="/support/logs" style={{ textDecoration: 'none', color: isActive('/support/logs') ? '#000' : '#666' }}>{t('nav.logs')}</Link>
              <Link to="/support/stations" style={{ textDecoration: 'none', color: isActive('/support/stations') ? '#000' : '#666' }}>{t('nav.stations')}</Link>
              <Link to="/support/sessions" style={{ textDecoration: 'none', color: isActive('/support/sessions') ? '#000' : '#666' }}>{t('nav.sessions')}</Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link to="/admin/dashboard" style={{ textDecoration: 'none', color: isActive('/admin/dashboard') ? '#000' : '#666' }}>{t('nav.admin')}</Link>
              <Link to="/admin/users" style={{ textDecoration: 'none', color: isActive('/admin/users') ? '#000' : '#666' }}>{t('nav.users')}</Link>
              <Link to="/admin/tariffs" style={{ textDecoration: 'none', color: isActive('/admin/tariffs') ? '#000' : '#666' }}>{t('nav.tariffs')}</Link>
            </>
          )}
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <Link to="/account/profile" style={{ fontSize: 14, textDecoration: 'none', color: '#666' }}>{user?.email}</Link>
              <span style={{ fontSize: 12 }}>{user?.role}</span>
              <button onClick={logout} style={{ padding: '4px 12px', fontSize: 14 }}>{t('nav.signOut')}</button>
            </>
          ) : (
            <>
              <Link to="/register" style={{ padding: '4px 12px', textDecoration: 'none', color: '#333', border: '1px solid #333' }}>{t('nav.register')}</Link>
              <Link to="/login" style={{ padding: '4px 12px', textDecoration: 'none', color: '#fff', background: '#333' }}>{t('nav.signIn')}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
