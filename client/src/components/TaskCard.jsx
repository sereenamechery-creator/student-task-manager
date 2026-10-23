export default function TaskCard({ task, onToggleStatus, onEdit, onDelete }) {
  const isComplete = task.completed || task.status === 'Completed'

  // Format and determine deadline status
  const dueDateObj = new Date(task.dueDate)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
  const endOfTomorrow = new Date(endOfToday.getTime() + 24 * 60 * 60 * 1000)

  let dateLabel = ''
  let dateClass = 'date-normal'

  if (dueDateObj < startOfToday) {
    dateLabel = isComplete ? 'Past Due' : 'Overdue'
    dateClass = isComplete ? 'date-normal' : 'date-overdue'
  } else if (dueDateObj >= startOfToday && dueDateObj <= endOfToday) {
    dateLabel = 'Due Today'
    dateClass = isComplete ? 'date-normal' : 'date-today'
  } else if (dueDateObj > endOfToday && dueDateObj <= endOfTomorrow) {
    dateLabel = 'Due Tomorrow'
    dateClass = 'date-soon'
  } else {
    dateLabel = dueDateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: dueDateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  const priorityClass = `priority-${(task.priority || 'Medium').toLowerCase()}`
  const statusClass = `status-${(task.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`

  return (
    <article className={`task-row ${isComplete ? 'is-complete' : ''}`}>
      <button
        type="button"
        className={`task-check ${isComplete ? 'checked' : ''}`}
        onClick={() => onToggleStatus(task)}
        aria-label={isComplete ? `Reopen task "${task.title}"` : `Mark task "${task.title}" as completed`}
        title={isComplete ? 'Click to reopen' : 'Click to complete'}
      >
        {isComplete ? '✓' : ''}
      </button>

      <div className="task-copy">
        <div className="task-title-row">
          <strong className="task-title">{task.title}</strong>
          <span className="subject-pill">
            <span className="subject-dot" />
            {task.subject || 'General'}
          </span>
        </div>

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
      </div>

      <div className="task-meta">
        <span className={`status-pill ${statusClass}`}>
          {task.status || (isComplete ? 'Completed' : 'Pending')}
        </span>

        <span className={`priority-pill ${priorityClass}`}>
          <span className="priority-dot" />
          {task.priority || 'Medium'}
        </span>

        <span className={`task-date ${dateClass}`} title={`Due: ${dueDateObj.toLocaleDateString()}`}>
          <span className="calendar-icon" aria-hidden="true">&#9635;</span>
          <span>{dateLabel}</span>
        </span>
      </div>

      <div className="task-actions">
        <button
          type="button"
          className="action-btn edit-btn"
          onClick={() => onEdit(task)}
          aria-label={`Edit task "${task.title}"`}
          title="Edit Task"
        >
          Edit
        </button>
        <button
          type="button"
          className="action-btn delete-btn"
          onClick={() => onDelete(task)}
          aria-label={`Delete task "${task.title}"`}
          title="Delete Task"
        >
          Delete
        </button>
      </div>
    </article>
  )
}
