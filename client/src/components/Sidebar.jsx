export default function Sidebar({
  user,
  activeView,
  onSelectView,
  stats,
  onOpenReminderModal,
  onSignOut,
  isOpenMobile,
  onCloseMobile,
}) {
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ST'

  const navItems = [
    { id: 'all', label: 'All Tasks', icon: '📋', count: stats?.total || 0 },
    { id: 'today', label: 'Due Today', icon: '⏱', count: stats?.dueToday || 0 },
    { id: 'upcoming', label: 'Upcoming', icon: '📅', count: stats?.upcoming || 0 },
    { id: 'overdue', label: 'Overdue', icon: '⚠️', count: stats?.overdue || 0 },
    { id: 'completed', label: 'Completed', icon: '✅', count: stats?.completed || 0 },
    { id: 'reminders', label: 'Email Reminders', icon: '✉️', count: 'Alerts' },
  ]

  const handleNavClick = (viewId) => {
    onSelectView(viewId)
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <>
      {isOpenMobile && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${isOpenMobile ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo-wrap">
            <span className="brand-mark">S</span>
          </div>
          <div className="brand-text">
            <strong>StudentFlow</strong>
            <span className="brand-sub">Task & Deadline Hub</span>
          </div>
        </div>

        <div className="profile-badge">
          <div className="avatar" aria-hidden="true">{initials}</div>
          <div className="profile-details">
            <strong className="profile-name" title={user?.name}>{user?.name}</strong>
            <span className="profile-email" title={user?.email}>{user?.email}</span>
          </div>
        </div>

        <p className="nav-heading">ACADEMIC VIEWS</p>
        <nav className="navigation" aria-label="Task category navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              <span className="nav-count">{item.count}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="reminder-settings-trigger"
            onClick={() => handleNavClick('reminders')}
          >
            <span className="reminder-icon" aria-hidden="true">🔔</span>
            <div className="reminder-text">
              <strong>Email Reminders Area</strong>
              <span>Automated 24h Alerts</span>
            </div>
          </button>

          <button
            type="button"
            className="signout-button"
            onClick={onSignOut}
            title="Log out and return to the Login / Email screen"
          >
            <span aria-hidden="true">↪</span> Sign Out (Back to Login)
          </button>
        </div>
      </aside>
    </>
  )
}
