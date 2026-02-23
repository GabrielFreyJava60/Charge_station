import { createContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authAPI } from '@/api/client'

export interface User {
  userId: string
  email: string
  role: string
  accessToken?: string
  refreshToken?: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<User>
  register: (email: string, password: string, name: string, phoneNumber?: string) => Promise<unknown>
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
  isTechSupport: boolean
  isUser: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? (JSON.parse(saved) as User) : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
    }
  }, [user])

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await authAPI.login({ email, password })
      localStorage.setItem('accessToken', data.accessToken ?? data.idToken ?? '')
      const userData: User = {
        userId: data.userId,
        email: data.email ?? email,
        role: data.role,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }
      setUser(userData)
      return userData
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        'Login failed'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(
    async (email: string, password: string, name: string, phoneNumber?: string): Promise<unknown> => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await authAPI.register({ email, password, name, phoneNumber })
        return data
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          'Registration failed'
        setError(msg)
        throw new Error(msg)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isTechSupport: user?.role === 'TECH_SUPPORT',
    isUser: user?.role === 'USER',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
