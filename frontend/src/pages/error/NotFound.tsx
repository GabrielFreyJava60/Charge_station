import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/I18nContext'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h1>404</h1>
      <h2>{t('error.pageNotFound')}</h2>
      <p style={{ marginBottom: 24 }}>{t('error.notFound')}</p>
      <Link to="/" style={{ padding: '8px 16px', background: '#333', color: '#fff', textDecoration: 'none' }}>
        {t('common.backToHome')}
      </Link>
    </div>
  )
}
