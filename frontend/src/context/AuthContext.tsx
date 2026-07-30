import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authApi, type User } from '../services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (full_name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

function parseUser(): User | null {
  try {
    const raw = localStorage.getItem('spendsense_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(parseUser)
  const [token, setToken] = useState<string | null>(localStorage.getItem('spendsense_token'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) localStorage.setItem('spendsense_token', token)
    else localStorage.removeItem('spendsense_token')
  }, [token])

  const handleAuthResponse = (data: { access_token: string; user: User }) => {
    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('spendsense_token', data.access_token)
    localStorage.setItem('spendsense_user', JSON.stringify(data.user))
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data } = await authApi.login({ email, password })
      handleAuthResponse(data)
    } finally {
      setLoading(false)
    }
  }

  const register = async (full_name: string, email: string, password: string) => {
    setLoading(true)
    try {
      const { data } = await authApi.register({ full_name, email, password })
      handleAuthResponse(data)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('spendsense_token')
    localStorage.removeItem('spendsense_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
