import { useEffect, useState } from 'react'
import { reminderApi } from '../services/api.js'

export default function ReminderModal({ isOpen, onClose, token, userEmail }) {
  const [statusData, setStatusData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sendingTest, setSendingTest] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  useEffect(() => {
    if (!isOpen) return

    let active = true
    setLoading(true)
    setFeedback({ type: '', message: '' })

    reminderApi
      .getStatus(token)
      .then((data) => {
        if (active) setStatusData(data)
      })
      .catch((err) => {
        if (active) {
          setFeedback({
            type: 'error',
            message: `Could not retrieve reminder configuration: ${err.message}`,
          })
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, token])

  if (!isOpen) return null

  const handleSendTest = async () => {
    setSendingTest(true)
    setFeedback({ type: '', message: '' })

    try {
      const result = await reminderApi.sendTestEmail(token)
      setFeedback({
        type: 'success',
        message: result.message || `Test reminder delivered to ${userEmail}!`,
      })
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to dispatch test email. Check server/.env configuration.',
      })
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !sendingTest) onClose()
      }}
    >
      <div className="task-modal reminder-modal" role="dialog" aria-modal="true" aria-labelledby="reminder-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">AUTOMATED NOTIFICATIONS</p>
            <h2 id="reminder-title">Email Deadline Reminders</h2>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={sendingTest}
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="modal-loading">Checking email service status...</div>
        ) : (
          <div className="reminder-body">
            <div className={`status-banner ${statusData?.enabled ? 'status-enabled' : 'status-disabled'}`}>
              <div className="status-indicator-dot" />
              <div>
                <strong>{statusData?.enabled ? 'Email Notifications Active' : 'Email Reminders Not Configured'}</strong>
                <p>{statusData?.message}</p>
              </div>
            </div>

            <div className="info-block">
              <h3>How Deadline Reminders Work:</h3>
              <ul>
                <li>
                  <strong>24-Hour Window:</strong> The backend scheduler (node-cron) scans for upcoming deadlines and dispatches a reminder email approximately 24 hours prior to the due date.
                </li>
                <li>
                  <strong>Day-Of Reminder:</strong> Academic tasks due today are highlighted to prevent missed submissions.
                </li>
                <li>
                  <strong>No Duplicates:</strong> Completed tasks never receive reminders, and each task's delivery timestamp is tracked in MongoDB to prevent duplicate emails.
                </li>
                <li>
                  <strong>Target Recipient:</strong> Reminders for your tasks are delivered directly to your registered email: <code>{userEmail}</code>.
                </li>
              </ul>
            </div>

            {!statusData?.enabled && (
              <div className="config-help-box">
                <h4>Setup Instructions (for Mentor / Evaluation):</h4>
                <ol>
                  <li>Open <code>server/.env</code> in your editor.</li>
                  <li>Set <code>EMAIL_USER=your_gmail@gmail.com</code>.</li>
                  <li>Set <code>EMAIL_APP_PASSWORD=your_16_char_app_password</code> (generated via Google Account &gt; Security &gt; App Passwords).</li>
                  <li>Restart the backend server (<code>node src/server.js</code>).</li>
                </ol>
              </div>
            )}

            {feedback.message && (
              <div
                className={`feedback-alert ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
                role="alert"
              >
                {feedback.message}
              </div>
            )}

            <div className="modal-actions reminder-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                disabled={sendingTest}
              >
                Close
              </button>
              {statusData?.enabled && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleSendTest}
                  disabled={sendingTest}
                >
                  {sendingTest ? 'Sending Test...' : 'Send Test Reminder to My Email'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
