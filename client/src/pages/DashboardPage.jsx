import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from '../components/Header.jsx'
import ReminderModal from '../components/ReminderModal.jsx'
import Sidebar from '../components/Sidebar.jsx'
import StatsGrid from '../components/StatsGrid.jsx'
import TaskCard from '../components/TaskCard.jsx'
import TaskModal from '../components/TaskModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { dashboardApi, taskApi } from '../services/api.js'

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
  const [activeView, setActiveView] = useState('all') // 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('dueDateAsc') // 'dueDateAsc' | 'dueDateDesc'

  // Modals State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Fetch data from backend
  const loadDashboardData = useCallback(async () => {
    if (!token) return
    setPageError('')

    try {
      const [tasksRes, statsRes] = await Promise.all([
        taskApi.getTasks(token),
        dashboardApi.getStats(token),
      ])
      setTasks(tasksRes.tasks || [])
      setStats(statsRes)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setPageError(err.message || 'Could not load tasks from database. Please check connection.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Extract unique subjects for dropdown
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

        // View Filtering
        if (activeView === 'today') {
          if (isComplete || dueDateObj < startOfToday || dueDateObj > endOfToday) return false
        } else if (activeView === 'upcoming') {
          if (isComplete || dueDateObj <= endOfToday) return false
        } else if (activeView === 'overdue') {
          if (isComplete || dueDateObj >= startOfToday) return false
        } else if (activeView === 'completed') {
          if (!isComplete) return false
        }

        // Dropdown Status Filter
        if (statusFilter) {
          if (statusFilter === 'Completed' && !isComplete) return false
          if (statusFilter === 'Pending' && (task.status !== 'Pending' || isComplete)) return false
          if (statusFilter === 'In Progress' && (task.status !== 'In Progress' || isComplete)) return false
        }

        // Subject Filter
        if (subjectFilter && task.subject !== subjectFilter) {
          return false
        }

        // Priority Filter
        if (priorityFilter && task.priority !== priorityFilter) {
          return false
        }

        // Search Query (title, subject, description)
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

          {/* Filter, Search & Sorting Controls */}
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
                {(!searchQuery && !subjectFilter && !priorityFilter && !statusFilter) && (
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

      {/* Email Deadline Reminder Information & Test Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        token={token}
        userEmail={user?.email}
      />
    </div>
  )
}
