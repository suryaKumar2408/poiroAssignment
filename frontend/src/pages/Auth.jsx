import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useStore from '../store/useStore'
import { login, register } from '../api/auth.api'
import './Auth.css'

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate()
  const setUser = useStore((s) => s.setUser)

  const isLogin = mode === 'login'

  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setError('')
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password }

      const fn = isLogin ? login : register
      const { data } = await fn(payload)
      setUser(data.user)
      navigate('/home', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-glow-1" />
      <div className="auth-glow-2" />

      <div className="auth-card fade-in">
        {/* Logo / Brand */}
        <div className="auth-brand">
          <div className="auth-logo">⚡</div>
          <h1 className="glow-text">PoiroAssignment</h1>
          <p className="text-secondary text-sm">Real-time AI Battle Room Platform</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <Link
            to="/login"
            className={`auth-tab ${isLogin ? 'auth-tab--active' : ''}`}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className={`auth-tab ${!isLogin ? 'auth-tab--active' : ''}`}
          >
            Register
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="auth-field">
              <label className="auth-label">Username</label>
              <input
                className="input"
                type="text"
                name="username"
                placeholder="e.g. lightning_coder"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="input"
              type="password"
              name="password"
              placeholder={isLogin ? 'Your password' : 'Min 6 characters'}
              value={form.password}
              onChange={handleChange}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          <button
            className="btn btn-primary btn-lg w-full"
            type="submit"
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> {isLogin ? 'Signing in...' : 'Creating account...'}</>
              : isLogin ? 'Sign In' : 'Create Account'
            }
          </button>
        </form>

        <p className="auth-footer text-secondary text-sm">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link to={isLogin ? '/register' : '/login'}>
            {isLogin ? 'Register' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  )
}
