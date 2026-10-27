const responses = [
  { label: 'Attending', count: '142', style: 'attending' },
  { label: 'Declined', count: '18', style: 'declined' },
  { label: 'Awaiting', count: '24', style: 'awaiting' },
];

function GuestResponsesPanel() {
  return (
    <section className="dashboard-card guest-responses" aria-label="Sample guest responses">
      <div className="dashboard-card-heading">
        <h3>Guest Responses</h3>
        <span>184 Total Guests</span>
      </div>
      <div
        className="response-progress"
        role="img"
        aria-label="Sample responses: 142 attending, 18 declined, 24 awaiting"
      >
        <span className="response-attending" />
        <span className="response-declined" />
        <span className="response-awaiting" />
      </div>
      <div className="response-counts">
        {responses.map((response) => (
          <div className="response-count" key={response.label}>
            <strong>{response.count}</strong>
            <span>{response.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function WebsitePreviewCard() {
  return (
    <section className="dashboard-card website-preview-card" aria-label="Sample wedding website">
      <span className="website-card-kicker">PUBLIC WEBSITE</span>
      <strong className="website-sample-url">makemymarriage.com/w/prathap-akshitha</strong>
      <div className="website-card-status">
        <span>Sample preview</span>
        <span className="website-status-mark" aria-hidden="true">
          ↗
        </span>
      </div>
    </section>
  );
}

export function DashboardSummary() {
  return (
    <div className="dashboard-summary">
      <GuestResponsesPanel />
      <WebsitePreviewCard />
    </div>
  );
}
