import { DashboardWorkspace } from './DashboardWorkspace';

export function DashboardPreview() {
  return (
    <section className="dashboard-preview" aria-label="Illustrative wedding dashboard preview">
      <div className="dashboard-topbar">
        <div className="window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>make-my-marriage.app</span>
        <span className="demo-label">DEMO</span>
      </div>
      <DashboardWorkspace />
    </section>
  );
}
