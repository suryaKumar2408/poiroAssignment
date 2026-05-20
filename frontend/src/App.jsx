import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useStore from './store/useStore'
import { getMe } from './api/auth.api'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/Auth'
import Home from './pages/Home'
import BattleRoom from './pages/BattleRoom'

export default function App() {
  const { setUser, setAuthLoading, isAuthenticated } = useStore()

  // ── Check auth on every app load (cookie-based session) ─────────────────────
  useEffect(() => {
    getMe()
      .then(({ data }) => {
        setUser(data.user)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setAuthLoading(false)
      })
  }, [setUser, setAuthLoading])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/home" replace /> : <AuthPage mode="login" />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/home" replace /> : <AuthPage mode="register" />}
        />

        {/* Protected routes */}
        <Route
          path="/home"
          element={<ProtectedRoute><Home /></ProtectedRoute>}
        />
        <Route
          path="/room/:code"
          element={<ProtectedRoute><BattleRoom /></ProtectedRoute>}
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
