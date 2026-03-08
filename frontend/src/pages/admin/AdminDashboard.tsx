import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'

export default function AdminDashboard() {
  const { t } = useI18n()
  const { user } = useAuth()

  const sections = [
    { to: '/admin/users', labelKey: 'admin.users', descKey: 'admin.usersDesc' },
    { to: '/admin/stations', labelKey: 'admin.stations', descKey: 'admin.stationsDesc' },
    { to: '/admin/tariffs', labelKey: 'admin.tariffs', descKey: 'admin.tariffsDesc' },
    { to: '/support/dashboard', labelKey: 'admin.operations', descKey: 'admin.operationsDesc' },
  ]

  return (
    <div>
      <h1>{t('admin.title')}</h1>
      <p>{t('admin.welcome')}, {user?.email?.split('@')[0]}. {t('admin.subtitle')}.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 24 }}>
        {sections.map(({ to, labelKey, descKey }) => (
          <Link key={to} to={to} style={{ border: '1px solid #ccc', padding: 16, textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ margin: 0 }}>{t(labelKey)}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>{t(descKey)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
