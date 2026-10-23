import { useEffect, useState } from 'react'

export default function TaskModal({ isOpen, onClose, onSave, task = null, initialDate = '' }) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [status, setStatus] = useState('Pending')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const todayStr = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setSubject(task.subject || 'General')
      setDescription(task.description || '')
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : todayStr)
      setPriority(task.priority || 'Medium')
      setStatus(task.status || (task.completed ? 'Completed' : 'Pending'))
    } else {
      setTitle('')
      setSubject('General')
      setDescription('')
      setDueDate(initialDate || todayStr)
      setPriority('Medium')
      setStatus('Pending')
    }
    setError('')
    setSubmitting(false)
  }, [task, isOpen, initialDate, todayStr])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Task title is required.')
      return
    }

    if (!dueDate) {
      setError('Please select a valid due date.')
      return
    }

    setSubmitting(true)
    try {
      await onSave({
        title: trimmedTitle,
        subject: subject.trim() || 'General',
        description: description.trim(),
        dueDate,
        priority,
        status,
        completed: status === 'Completed',
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save task.')
    } finally {
      setSubmitting(false)
    }
  }

  const commonSubjects = ['General', 'Computer Science', 'Mathematics', 'Software Engineering', 'Database Systems', 'Web Development', 'Physics', 'Project / Lab']

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
    >
      <div className="task-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{task ? 'UPDATE ASSIGNMENT' : 'NEW ACADEMIC TASK'}</p>
            <h2 id="modal-title">{task ? 'Edit Task' : 'Add New Task'}</h2>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={submitting}
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="form-error-banner" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Task Title <strong className="required-star">*</strong></span>
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete Software Architecture Case Study"
              required
              maxLength={160}
              autoFocus
              disabled={submitting}
            />
          </label>

          <div className="form-row">
            <label className="form-field">
              <span>Subject / Category</span>
              <input
                type="text"
                list="subject-suggestions"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Computer Science"
                maxLength={80}
                disabled={submitting}
              />
              <datalist id="subject-suggestions">
                {commonSubjects.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>

            <label className="form-field">
              <span>Due Date <strong className="required-star">*</strong></span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                disabled={submitting}
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span>Priority Level</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={submitting}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </label>

            <label className="form-field">
              <span>Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={submitting}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
          </div>

          <label className="form-field">
            <span>Description / Assignment Notes (Optional)</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key rubric requirements, submission links, or task notes..."
              maxLength={1000}
              disabled={submitting}
            />
            <span className="char-count">{description.length}/1000</span>
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
