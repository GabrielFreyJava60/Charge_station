import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n/I18nContext'

export default function ErrorSystem() {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h1>500</h1>
      <h2>{t('error.system')}</h2>
      <p style={{ marginBottom: 24 }}>{t('error.systemDesc')}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}>
          {t('common.goBack')}
        </button>
        <button onClick={() => navigate('/')} style={{ padding: '8px 16px', background: '#fff', color: '#333', border: '1px solid #333', cursor: 'pointer' }}>
          {t('common.home')}
        </button>
      </div>
    </div>
  )
}
