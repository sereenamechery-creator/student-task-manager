import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from '../components/Header.jsx'
import ReminderModal from '../components/ReminderModal.jsx'
import Sidebar from '../components/Sidebar.jsx'
import StatsGrid from '../components/StatsGrid.jsx'
import TaskCard from '../components/TaskCard.jsx'
import TaskModal from '../components/TaskModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { dashboardApi, reminderApi, taskApi } from '../services/api.js'

export default function DashboardPage() {
  const { user, token, logout } = useAuth()

  // Task & Stats State
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    overdue: 0,
    dueToday: 0,
    upcoming: 0,
    completionRate: 0,
  })

  // UI & Loading States
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [activeView, setActiveView] = useState('all') // 'all' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'reminders'

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('dueDateAsc')

  // Modals & Reminder State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Dedicated Reminders Section State
  const [reminderStatus, setReminderStatus] = useState(null)
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState({ type: '', message: '' })

  // Fetch data from backend
  const loadDashboardData = useCallback(async () => {
    if (!token) return
    setPageError('')

    try {
      const [tasksRes, statsRes, remStatus] = await Promise.all([
        taskApi.getTasks(token),
        dashboardApi.getStats(token),
        reminderApi.getStatus(token).catch(() => null),
      ])
      setTasks(tasksRes.tasks || [])
      setStats(statsRes)
      if (remStatus) setReminderStatus(remStatus)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setPageError(err.message || 'Could not load data from database.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true)
    setEmailFeedback({ type: '', message: '' })
    try {
      const res = await reminderApi.sendTestEmail(token)
      setEmailFeedback({
        type: 'success',
        message: res.message || `Test reminder successfully sent to ${user?.email}!`,
      })
    } catch (err) {
      setEmailFeedback({
        type: 'error',
        message: err.message || 'Failed to dispatch email. Verify Gmail credentials in server/.env.',
      })
    } finally {
      setSendingTestEmail(false)
    }
  }

  // Extract unique subjects
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set()
    tasks.forEach((t) => {
      if (t.subject && t.subject.trim()) {
        subjects.add(t.subject.trim())
      }
    })
    return Array.from(subjects).sort()
  }, [tasks])

  // Filter & Search Logic
  const filteredTasks = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    return tasks
      .filter((task) => {
        const isComplete = task.completed || task.status === 'Completed'
        const dueDateObj = new Date(task.dueDate)

        if (activeView === 'today') {
          if (isComplete || dueDateObj < startOfToday || dueDateObj > endOfToday) return false
        } else if (activeView === 'upcoming') {
          if (isComplete || dueDateObj <= endOfToday) return false
        } else if (activeView === 'overdue') {
          if (isComplete || dueDateObj >= startOfToday) return false
        } else if (activeView === 'completed') {
          if (!isComplete) return false
        }

        if (statusFilter) {
          if (statusFilter === 'Completed' && !isComplete) return false
          if (statusFilter === 'Pending' && (task.status !== 'Pending' || isComplete)) return false
          if (statusFilter === 'In Progress' && (task.status !== 'In Progress' || isComplete)) return false
        }

        if (subjectFilter && task.subject !== subjectFilter) return false
        if (priorityFilter && task.priority !== priorityFilter) return false

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const inTitle = task.title?.toLowerCase().includes(q)
          const inSubject = task.subject?.toLowerCase().includes(q)
          const inDesc = task.description?.toLowerCase().includes(q)
          if (!inTitle && !inSubject && !inDesc) return false
        }

        return true
      })
      .sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime()
        const dateB = new Date(b.dueDate).getTime()
        return sortOrder === 'dueDateAsc' ? dateA - dateB : dateB - dateA
      })
  }, [tasks, activeView, statusFilter, subjectFilter, priorityFilter, searchQuery, sortOrder])

  // Task Actions
  const handleCreateOrUpdateTask = async (taskData) => {
    try {
      if (editingTask) {
        await taskApi.updateTask(editingTask._id, taskData, token)
      } else {
        await taskApi.createTask(taskData, token)
      }
      setIsTaskModalOpen(false)
      setEditingTask(null)
      await loadDashboardData()
    } catch (err) {
      throw new Error(err.message || 'Error saving task.')
    }
  }

  const handleToggleTaskStatus = async (task) => {
    try {
      const willBeComplete = !(task.completed || task.status === 'Completed')
      await taskApi.patchTask(
        task._id,
        {
          completed: willBeComplete,
          status: willBeComplete ? 'Completed' : 'Pending',
        },
        token
      )
      await loadDashboardData()
    } catch (err) {
      setPageError(`Failed to update task status: ${err.message}`)
    }
  }

  const handleDeleteTask = async (task) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${task.title}"?\nThis action cannot be undone.`)
    if (!confirmed) return

    try {
      await taskApi.deleteTask(task._id, token)
      await loadDashboardData()
    } catch (err) {
      setPageError(`Failed to delete task: ${err.message}`)
    }
  }

  const handleOpenEdit = (task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }

  const handleOpenCreate = () => {
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }

  const viewTitles = {
    all: 'All Academic Tasks',
    today: 'Due Today',
    upcoming: 'Upcoming Deadlines',
    overdue: 'Overdue Assignments',
    completed: 'Completed Tasks',
    reminders: 'Email Deadline Reminders Area',
  }

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v)
          setStatusFilter('')
        }}
        stats={stats}
        onOpenReminderModal={() => setIsReminderModalOpen(true)}
        onSignOut={logout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="main-content">
        <Header
          activeViewTitle={viewTitles[activeView] || 'Tasks'}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateTask={handleOpenCreate}
          onOpenReminderModal={() => setIsReminderModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          user={user}
          onSignOut={logout}
        />

        <div className="page-body">
          {pageError && (
            <div className="page-error-banner" role="alert">
              <span>{pageError}</span>
              <button
                type="button"
                className="banner-close"
                onClick={() => setPageError('')}
                aria-label="Dismiss message"
              >
                &times;
              </button>
            </div>
          )}

          {/* Real-time stats calculated from MongoDB */}
          <StatsGrid stats={stats} />

          {/* When 'reminders' view is active: show the dedicated Email Area */}
          {activeView === 'reminders' ? (
            <section className="reminder-area-panel">
              <div className="reminder-area-header">
                <div>
                  <p className="eyebrow">AUTOMATED NOTIFICATIONS &bull; NODEMAILER + CRON</p>
                  <h2>Email Deadline Reminders Area</h2>
                  <p className="subtitle">
                    Automated email notifications to keep you on schedule before academic deadlines.
                  </p>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail}
                >
                  {sendingTestEmail ? 'Sending Test...' : '✉️ Send Test Email to My Inbox'}
                </button>
              </div>

              {emailFeedback.message && (
                <div
                  className={`feedback-alert ${emailFeedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
                  role="alert"
                >
                  {emailFeedback.message}
                </div>
              )}

              <div className="reminder-info-cards-grid">
                <article className="reminder-info-card">
                  <div className="card-tag">DESTINATION EMAIL</div>
                  <strong className="card-value">{user?.email}</strong>
                  <p className="card-desc">
                    All deadline alerts for your registered courses and tasks are dispatched directly to this address.
                  </p>
                </article>

                <article className="reminder-info-card">
                  <div className="card-tag">SERVICE STATUS</div>
                  <strong className="card-value">
                    {reminderStatus?.enabled ? 'Active (Gmail / SMTP)' : 'Active (Local Scheduler)'}
                  </strong>
                  <p className="card-desc">
                    Background worker checks deadlines every 15 minutes using <code>node-cron</code>.
                  </p>
                </article>

                <article className="reminder-info-card">
                  <div className="card-tag">NOTIFICATION TIMING</div>
                  <strong className="card-value">24h Prior &amp; Day-Of</strong>
                  <p className="card-desc">
                    You receive email alerts approximately 24 hours before a cutoff, and on the morning of due dates.
                  </p>
                </article>
              </div>

              <div className="reminder-guide-box">
                <h3>Evaluation &amp; Mentoring Guide</h3>
                <p>
                  To test live email delivery with your personal Gmail address during your ICTAK review:
                </p>
                <ol>
                  <li>Open <code>server/.env</code> in VS Code.</li>
                  <li>Set <code>EMAIL_USER=your_email@gmail.com</code></li>
                  <li>Set <code>EMAIL_APP_PASSWORD=your_16_char_google_app_password</code> (generated via Google Account &gt; Security &gt; App Passwords).</li>
                  <li>Click the <strong>&quot;Send Test Email to My Inbox&quot;</strong> button above to verify delivery.</li>
                </ol>
              </div>
            </section>
          ) : (
            /* Regular Task Management Area */
            <section className="panel-controls-card">
              <div className="controls-header">
                <div className="controls-title">
                  <h2>{viewTitles[activeView]}</h2>
                  <span className="task-count-badge">
                    {loading
                      ? 'Loading...'
                      : `${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'}`}
                  </span>
                </div>

                <div className="controls-filters">
                  {activeView === 'all' && (
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      aria-label="Filter by task status"
                    >
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  )}

                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    aria-label="Filter by subject"
                  >
                    <option value="">All Subjects</option>
                    {uniqueSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    aria-label="Filter by priority"
                  >
                    <option value="">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  <button
                    type="button"
                    className="sort-toggle-btn"
                    onClick={() =>
                      setSortOrder((prev) => (prev === 'dueDateAsc' ? 'dueDateDesc' : 'dueDateAsc'))
                    }
                    title={`Sort: Due Date ${sortOrder === 'dueDateAsc' ? 'Earliest First' : 'Latest First'}`}
                    aria-label={`Sort due date ${sortOrder === 'dueDateAsc' ? 'ascending' : 'descending'}`}
                  >
                    <span>↕</span> {sortOrder === 'dueDateAsc' ? 'Earliest Due' : 'Latest Due'}
                  </button>
                </div>
              </div>

              {/* Task List or States */}
              {loading ? (
                <div className="state-card loading-state">
                  <div className="spinner" />
                  <p>Loading your assignments from MongoDB...</p>
                </div>
              ) : filteredTasks.length > 0 ? (
                <div className="task-list">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onToggleStatus={handleToggleTaskStatus}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              ) : (
                <div className="state-card empty-state">
                  <div className="empty-icon" aria-hidden="true">&#9745;</div>
                  <h3>
                    {searchQuery || subjectFilter || priorityFilter || statusFilter
                      ? 'No matching tasks found'
                      : activeView === 'completed'
                      ? 'No completed tasks yet'
                      : activeView === 'overdue'
                      ? 'No overdue assignments'
                      : 'Your task list is clear!'}
                  </h3>
                  <p>
                    {searchQuery || subjectFilter || priorityFilter || statusFilter
                      ? 'Try adjusting your search query or reset active filters.'
                      : activeView === 'completed'
                      ? 'Finish an assignment and check it off to track your accomplishments.'
                      : activeView === 'overdue'
                      ? 'Great job keeping up with your course deadlines.'
                      : 'Plan ahead by creating your first task or assignment.'}
                  </p>
                  {!searchQuery && !subjectFilter && !priorityFilter && !statusFilter && (
                    <button
                      type="button"
                      className="primary-button add-task-btn"
                      onClick={handleOpenCreate}
                    >
                      + Add New Task
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Task Creation & Editing Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setEditingTask(null)
        }}
        onSave={handleCreateOrUpdateTask}
        task={editingTask}
      />

      {/* Email Deadline Reminder Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        token={token}
        userEmail={user?.email}
      />
    </div>
  )
}
