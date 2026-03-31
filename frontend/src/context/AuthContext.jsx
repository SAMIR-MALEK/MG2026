import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then(r => { setUser(r.data.user); localStorage.setItem('user', JSON.stringify(r.data.user)) })
        .catch(() => { localStorage.clear(); setUser(null) })
        .finally(() => setLoading(false))
    } else setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const logout = () => { localStorage.clear(); setUser(null) }

  return (
    <Ctx.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'ADMIN', isBureau: user?.role === 'BUREAU' }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
