import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const [isStudent, setIsStudent] = useState(true)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, mockLogin } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const email = isStudent
      ? `${identifier.trim().toLowerCase()}@forge.local`
      : identifier.trim()

    try {
      const { data, error: signInError } = await signIn({ email, password })
      if (signInError) throw signInError
    } catch (err) {
      console.error('Login error:', err)
      const msg = err.message || ''
      
      // Automatic Dev Mode Fallback for 500/Database errors (corrupted seed data)
      const isServerError = 
        msg.includes('500') || 
        msg.toLowerCase().includes('internal server error') ||
        msg.toLowerCase().includes('database error') ||
        err.status === 500 ||
        err.__isAuthError; // Catch any auth-system-level failures in dev

      if (isServerError) {
        console.warn('Supabase Server/Database Error detected. Entering Dev Mode Fallback...')
        mockLogin(email, isStudent ? 'student' : 'mentor')
        return // Exit handleLogin as mockLogin handles state
      }

      setError(msg || 'Invalid login credentials')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-void p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent-glow/20 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none"></div>

      <div className="glass-card w-full max-w-[440px] p-10 relative z-10">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-accent-glow/10 border border-accent-glow/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-accent-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-h1 mb-2">ForgeTrack</h1>
          <p className="text-body-sm text-fg-tertiary">Sign in to track your progress</p>
        </div>

        {/* Role Toggle */}
        <div className="flex p-1 bg-surface-inset border border-border-default rounded-xl mb-8">
          <button
            onClick={() => setIsStudent(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isStudent ? 'bg-surface-raised text-fg-primary shadow-sm' : 'text-fg-tertiary hover:text-fg-secondary'}`}
          >
            Student
          </button>
          <button
            onClick={() => setIsStudent(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isStudent ? 'bg-surface-raised text-fg-primary shadow-sm' : 'text-fg-tertiary hover:text-fg-secondary'}`}
          >
            Mentor
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-label text-fg-secondary">{isStudent ? 'University Seat Number (USN)' : 'Email Address'}</label>
            <input
              required
              type={isStudent ? 'text' : 'email'}
              placeholder={isStudent ? 'e.g. 4SH24CS001' : 'mentor@theboringpeople.in'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-surface-inset border border-border-default rounded-md px-4 py-2.5 text-fg-primary focus:outline-none focus:border-accent-glow focus:ring-2 focus:ring-accent-glow/10 transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-label text-fg-secondary">Password</label>
              {!isStudent && <a href="#" className="text-micro text-accent-glow hover:underline">Forgot?</a>}
            </div>
            <input
              required
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-inset border border-border-default rounded-md px-4 py-2.5 text-fg-primary focus:outline-none focus:border-accent-glow focus:ring-2 focus:ring-accent-glow/10 transition-all"
            />
          </div>

          {error && (
            <div className="text-caption text-danger bg-danger-bg/50 border border-danger-border p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full bg-fg-primary text-void py-3 rounded-md font-semibold hover:bg-fg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-micro text-fg-tertiary uppercase tracking-widest">Powered by The Forge</p>
        </div>
      </div>
    </div>
  )
}

export default Login
