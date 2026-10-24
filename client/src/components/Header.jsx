export default function Header({
  activeViewTitle,
  searchQuery,
  onSearchChange,
  onOpenCreateTask,
  onOpenReminderModal,
  onToggleMobileSidebar,
  user,
  onSignOut,
}) {
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ST'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          &#9776;
        </button>
        <div className="breadcrumb">
          <span>Student Portal</span>
          <span className="breadcrumb-separator">/</span>
          <strong>{activeViewTitle}</strong>
        </div>
      </div>

      <div className="topbar-center">
        <div className="search-box">
          <span className="search-icon" aria-hidden="true">&#9906;</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, subject, or notes..."
            aria-label="Search academic tasks"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="reminder-nav-btn"
          onClick={onOpenReminderModal}
          title="Email Reminder Status & Test"
          aria-label="Email reminder settings"
        >
          <span aria-hidden="true">✉️</span> Email Alerts
        </button>

        <button
          type="button"
          className="primary-button quick-add-btn"
          onClick={onOpenCreateTask}
        >
          <span>+</span> Add Task
        </button>

        <div className="user-profile-badge" title={`Signed in as ${user?.name} (${user?.email})`}>
          <div className="top-avatar">{initials}</div>
          <span className="user-email-text">{user?.email}</span>
        </div>

        {onSignOut && (
          <button
            type="button"
            className="signout-header-btn"
            onClick={onSignOut}
            title="Sign out and return to Login screen"
          >
            Sign Out
          </button>
        )}
      </div>
    </header>
  )
}
