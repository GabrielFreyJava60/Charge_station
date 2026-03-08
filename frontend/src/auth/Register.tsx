import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'

interface RegisterForm {
  email: string
  password: string
  name: string
  phoneNumber: string
}

interface FieldConfig {
  labelKey: string
  name: keyof RegisterForm
  type: string
  placeholderKey: string
  required?: boolean
  minLength?: number
}

export default function Register() {
  const { t } = useI18n()
  const [form, setForm] = useState<RegisterForm>({ email: '', password: '', name: '', phoneNumber: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      await register(form.email, form.password, form.name, form.phoneNumber)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      setError((err as Error).message)
    }
  }

  const fields: FieldConfig[] = [
    { labelKey: 'auth.fullName', name: 'name', type: 'text', placeholderKey: 'auth.namePlaceholder', required: true },
    { labelKey: 'auth.email', name: 'email', type: 'email', placeholderKey: 'auth.emailPlaceholder', required: true },
    { labelKey: 'auth.password', name: 'password', type: 'password', placeholderKey: 'auth.passwordMin', required: true, minLength: 8 },
    { labelKey: 'auth.phoneOptional', name: 'phoneNumber', type: 'text', placeholderKey: 'auth.phonePlaceholder' },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
      <p><Link to="/" style={{ color: '#333' }}>← {t('common.backToHome')}</Link></p>
      <h1>{t('auth.registerTitle')}</h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>{t('auth.registerSubtitle')}</p>

      {error && (
        <p style={{ color: '#c00', marginBottom: 12, padding: 8, border: '1px solid #c00', background: '#fff0f0' }}>{error}</p>
      )}
      {success && (
        <p style={{ color: '#0a0', marginBottom: 12, padding: 8, border: '1px solid #0a0', background: '#f0fff0' }}>{t('auth.success')}</p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fields.map(({ labelKey, name, type, placeholderKey, required, minLength }) => (
          <div key={name}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>{t(labelKey)}</label>
            <input
              name={name}
              type={type}
              value={form[name]}
              onChange={handleChange}
              placeholder={t(placeholderKey)}
              required={required}
              minLength={minLength}
              style={{ width: '100%', padding: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '8px 16px', marginTop: 8, background: '#333', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? t('auth.creating') : t('auth.createAccount')}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14 }}>
        {t('auth.haveAccount')}{' '}
        <Link to="/login" style={{ color: '#333', fontWeight: 'bold' }}>{t('auth.signInLink')}</Link>
      </p>
    </div>
  )
}
