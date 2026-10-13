const events = [
  { day: '13', title: 'Mehndi Ceremony', details: '4:00 PM  •  The Courtyard Pavilion' },
  { day: '13', title: 'Sangeet & Dinner', details: '7:30 PM  •  Grand Ballroom' },
  { day: '14', title: 'Traditional Ceremony', details: '10:00 AM  •  Lotus Garden Sanctuary' },
];

const checklist = [
  { title: 'Finalize venue walkthrough', status: 'Completed', complete: true },
  { title: 'Select dinner menu', status: '3/5 items', complete: false },
  { title: 'Send RSVP reminders', status: 'Due in 5d', complete: false },
];

function UpcomingEventsPanel() {
  return (
    <section className="dashboard-card events-card" aria-label="Sample upcoming events">
      <div className="dashboard-card-heading">
        <h3>Upcoming Events</h3>
        <span>View itinerary</span>
      </div>
      <div className="event-list">
        {events.map((event) => (
          <div className="dashboard-event" key={event.title}>
            <time dateTime={`2025-11-${event.day}`}>
              <span>NOV</span>
              <strong>{event.day}</strong>
            </time>
            <span className="dashboard-event-details">
              <strong>{event.title}</strong>
              <small>{event.details}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlanningChecklistPanel() {
  return (
    <section className="dashboard-card checklist-card" aria-label="Sample planning checklist">
      <div className="dashboard-card-heading">
        <h3>Planning Checklist</h3>
        <span>68% Done</span>
      </div>
      <div
        className="checklist-progress"
        role="img"
        aria-label="Sample checklist 68 percent complete"
      >
        <span />
      </div>
      <ul className="checklist-items">
        {checklist.map((item) => (
          <li className="checklist-item" key={item.title}>
            <span
              className={item.complete ? 'checklist-box is-complete' : 'checklist-box'}
              aria-hidden="true"
            >
              {item.complete && '✓'}
            </span>
            <span className={item.complete ? 'checklist-task is-complete' : 'checklist-task'}>
              {item.title}
            </span>
            <small>{item.status}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DashboardPlanning() {
  return (
    <div className="dashboard-planning">
      <UpcomingEventsPanel />
      <PlanningChecklistPanel />
    </div>
  );
}
