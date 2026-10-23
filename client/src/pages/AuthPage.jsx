import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthPage() {
  const { login, register, authError, setAuthError } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [clientErrors, setClientErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleModeChange = (newMode) => {
    setMode(newMode)
    setClientErrors({})
    setAuthError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (mode === 'register') {
      if (!formData.name.trim()) {
        errors.name = 'Full name is required.'
      } else if (formData.name.trim().length > 80) {
        errors.name = 'Name must be under 80 characters.'
      }
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid academic email address.'
    }

    if (!formData.password) {
      errors.password = 'Password is required.'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must contain at least 8 characters.'
    }

    if (mode === 'register') {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Confirming your password is required.'
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.'
      }
    }

    setClientErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setAuthError('')

    try {
      if (mode === 'login') {
        await login(formData.email.trim(), formData.password)
      } else {
        await register(formData.name.trim(), formData.email.trim(), formData.password)
      }
    } catch (_err) {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-brand-header">
            <div className="auth-brand-icon">S</div>
            <h2>Student Task &amp; Deadline Manager</h2>
            <p className="auth-subtitle">
              ICTAK Capstone Project &bull; Full Stack MERN Application
            </p>
          </div>

          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => handleModeChange('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => handleModeChange('register')}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="auth-error-banner" role="alert">
              <span className="error-icon" aria-hidden="true">&#9888;</span>
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <label className="form-field">
                <span>Full Name <strong className="required-star">*</strong></span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Alex Johnson"
                  maxLength={80}
                  autoComplete="name"
                  disabled={isSubmitting}
                />
                {clientErrors.name && (
                  <span className="field-error-msg">{clientErrors.name}</span>
                )}
              </label>
            )}

            <label className="form-field">
              <span>Email Address <strong className="required-star">*</strong></span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@example.com"
                maxLength={254}
                autoComplete="email"
                disabled={isSubmitting}
              />
              {clientErrors.email && (
                <span className="field-error-msg">{clientErrors.email}</span>
              )}
            </label>

            <label className="form-field">
              <span>Password <strong className="required-star">*</strong></span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                minLength={8}
                maxLength={128}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                disabled={isSubmitting}
              />
              {clientErrors.password && (
                <span className="field-error-msg">{clientErrors.password}</span>
              )}
            </label>

            {mode === 'register' && (
              <label className="form-field">
                <span>Confirm Password <strong className="required-star">*</strong></span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                {clientErrors.confirmPassword && (
                  <span className="field-error-msg">{clientErrors.confirmPassword}</span>
                )}
              </label>
            )}

            <button
              type="submit"
              className="primary-button auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In to Portal'
                : 'Register Student Account'}
            </button>
          </form>

          <div className="auth-footer-note">
            <p>
              &#128274; Private student workspace. Your task records are secured with JWT and bcryptjs.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
