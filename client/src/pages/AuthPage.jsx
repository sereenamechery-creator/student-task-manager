import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthPage() {
  const { login, register, authError, setAuthError } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
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
      errors.email = 'Student email address is required.'
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid student email address.'
    }

    setClientErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setAuthError('')

    const finalPassword = formData.password.trim() || 'student_secure_pass_123'

    try {
      if (mode === 'login') {
        const res = await login(formData.email.trim(), finalPassword)
        if (!res.success && res.message?.includes('incorrect')) {
          const autoName = formData.email.split('@')[0]
          await register(autoName, formData.email.trim(), finalPassword)
        }
      } else {
        await register(formData.name.trim(), formData.email.trim(), finalPassword)
      }
    } catch (_err) {
      // Handled by AuthContext
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickDemoFill = (demoEmail) => {
    setFormData((prev) => ({ ...prev, email: demoEmail }))
    setClientErrors({})
  }

  return (
    <main className="auth-screen">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-brand-header">
            <div className="auth-brand-icon">S</div>
            <h2>Student Task &amp; Deadline Manager</h2>
            <p className="auth-subtitle">
              ICTAK Capstone Project &bull; Student Portal Login
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
              Student Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => handleModeChange('register')}
            >
              New Registration
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
                <span>Student Full Name <strong className="required-star">*</strong></span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Jordan Davis"
                  maxLength={80}
                  autoComplete="name"
                  disabled={isSubmitting}
                  autoFocus
                />
                {clientErrors.name && (
                  <span className="field-error-msg">{clientErrors.name}</span>
                )}
              </label>
            )}

            {/* Login & Email Area */}
            <div className="auth-email-area">
              <label className="form-field">
                <span>Student Email Address <strong className="required-star">*</strong></span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. student@college.edu"
                  maxLength={254}
                  autoComplete="email"
                  disabled={isSubmitting}
                  autoFocus={mode === 'login'}
                />
                {clientErrors.email && (
                  <span className="field-error-msg">{clientErrors.email}</span>
                )}
              </label>

              <div className="demo-fill-row">
                <span>Quick Fill:</span>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickDemoFill('student@test.edu')}
                >
                  student@test.edu
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickDemoFill('alex@university.ac.in')}
                >
                  alex@university.ac.in
                </button>
              </div>
            </div>

            <label className="form-field">
              <span>
                Password{' '}
                <small className="field-hint">(Optional — leave blank for 1-click access)</small>
              </span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Optional or leave blank"
                minLength={8}
                maxLength={128}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                disabled={isSubmitting}
              />
            </label>

            <button
              type="submit"
              className="primary-button auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Logging In...'
                : mode === 'login'
                ? 'Sign In to Student Dashboard'
                : 'Complete Registration & Enter'}
            </button>
          </form>

          <div className="auth-footer-note">
            <p>
              &#128231; Automated email reminders before deadlines are sent to your registered student email address.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
