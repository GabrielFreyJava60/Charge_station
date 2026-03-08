import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/I18nContext'

export default function ErrorForbidden() {
  const { t } = useI18n()
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h1>403</h1>
      <h2>{t('error.forbidden')}</h2>
      <p style={{ marginBottom: 24 }}>{t('error.forbiddenDesc')}</p>
      <Link to="/" style={{ padding: '8px 16px', background: '#333', color: '#fff', textDecoration: 'none' }}>
        {t('common.backToHome')}
      </Link>
    </div>
  )
}
