import { DashboardPlanning } from './DashboardPlanning';
import { DashboardSummary } from './DashboardSummary';
import { HomeIcon } from './HomeIcon';

const sections = [
  { label: 'Overview', icon: 'grid' as const, active: true },
  { label: 'Schedule', icon: 'calendar' as const, active: false },
  { label: 'Guests', icon: 'users' as const, count: '184', active: false },
  { label: 'Budget', icon: 'wallet' as const, active: false },
];

function DashboardNavigation() {
  return (
    <nav className="dashboard-navigation" aria-label="Sample dashboard sections">
      {sections.map((section) => (
        <span
          aria-current={section.active ? 'page' : undefined}
          className={section.active ? 'dashboard-tab is-active' : 'dashboard-tab'}
          key={section.label}
        >
          <HomeIcon name={section.icon} />
          {section.label}
          {section.count && <small>{section.count}</small>}
        </span>
      ))}
    </nav>
  );
}

export function DashboardWorkspace() {
  return (
    <div className="dashboard-workspace">
      <header className="dashboard-heading">
        <div className="dashboard-title-line">
          <h2>Prathap &amp; Akshitha’s Wedding</h2>
          <span aria-hidden="true">·</span>
          <p>Nov 14, 2025</p>
        </div>
        <div className="dashboard-heading-status">
          <span className="countdown-chip">142 days to go</span>
          <span className="preview-chip">Preview</span>
        </div>
      </header>
      <DashboardNavigation />
      <div className="dashboard-content">
        <DashboardSummary />
        <DashboardPlanning />
        <p className="dashboard-disclaimer">
          Illustrative dashboard preview · All names, dates, and figures are placeholders.
        </p>
      </div>
    </div>
  );
}
