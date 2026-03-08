import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'

export default function Login() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err: unknown) {
      setError((err as Error).message)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
      <p><Link to="/" style={{ color: '#333' }}>← {t('common.backToHome')}</Link></p>
      <h1>{t('auth.loginTitle')}</h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>{t('auth.loginSubtitle')}</p>

      {error && (
        <p style={{ color: '#c00', marginBottom: 12, padding: 8, border: '1px solid #c00', background: '#fff0f0' }}>{error}</p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>{t('auth.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>{t('auth.password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
            required
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '8px 16px', marginTop: 8, background: '#333', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14 }}>
        {t('auth.noAccount')}{' '}
        <Link to="/register" style={{ color: '#333', fontWeight: 'bold' }}>{t('auth.registerLink')}</Link>
      </p>

      <div style={{ marginTop: 24, padding: 12, border: '1px solid #ccc', fontSize: 12, color: '#666' }}>
        <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>{t('auth.devMode')}</p>
        <p style={{ margin: 0 }}>user@test.com / admin@test.com / tech@test.com</p>
        <p style={{ margin: 0 }}>{t('auth.anyPassword')}</p>
      </div>
    </div>
  )
}
