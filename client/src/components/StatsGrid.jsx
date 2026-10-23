export default function StatsGrid({ stats }) {
  const {
    total = 0,
    pending = 0,
    inProgress = 0,
    completed = 0,
    overdue = 0,
    dueToday = 0,
    completionRate = 0,
  } = stats || {}

  return (
    <section className="summary-grid" aria-label="Task statistics overview">
      <article className="summary-card">
        <div className="summary-top">
          <span>Total Tasks</span>
          <span className="summary-icon indigo" aria-hidden="true">&#9776;</span>
        </div>
        <strong className="summary-number">{total.toString().padStart(2, '0')}</strong>
        <span className="summary-caption">across all subjects</span>
      </article>

      <article className="summary-card">
        <div className="summary-top">
          <span>Due Today</span>
          <span className="summary-icon amber" aria-hidden="true">&#9719;</span>
        </div>
        <strong className="summary-number">{dueToday.toString().padStart(2, '0')}</strong>
        <span className="summary-caption">requires attention today</span>
      </article>

      <article className="summary-card">
        <div className="summary-top">
          <span>Overdue</span>
          <span className="summary-icon red" aria-hidden="true">&#9888;</span>
        </div>
        <strong className="summary-number">{overdue.toString().padStart(2, '0')}</strong>
        <span className="summary-caption">{overdue > 0 ? 'missed deadlines' : 'all caught up!'}</span>
      </article>

      <article className="summary-card">
        <div className="summary-top">
          <span>In Progress</span>
          <span className="summary-icon blue" aria-hidden="true">&#8635;</span>
        </div>
        <strong className="summary-number">{inProgress.toString().padStart(2, '0')}</strong>
        <span className="summary-caption">actively working</span>
      </article>

      <article className="summary-card">
        <div className="summary-top">
          <span>Completed</span>
          <span className="summary-icon green" aria-hidden="true">&#10003;</span>
        </div>
        <strong className="summary-number">{completed.toString().padStart(2, '0')}</strong>
        <span className="summary-caption">finished assignments</span>
      </article>

      <article className="summary-card progress-card">
        <div className="summary-top">
          <span>Completion Rate</span>
          <span className="summary-icon purple" aria-hidden="true">&#10532;</span>
        </div>
        <div className="progress-line">
          <strong className="summary-number">
            {completionRate}<small>%</small>
          </strong>
          <span>{completed} of {total} done</span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
          />
        </div>
      </article>
    </section>
  )
}
