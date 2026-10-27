import { HomeIcon } from '../components/HomeIcon';

const steps = [
  {
    number: '01',
    label: 'SETUP',
    title: 'Create your wedding workspace',
    text: 'Bring your wedding details into one organized space. Customize dates, multi-day schedules, and co-host access.',
    preview: 'Workspace setup',
  },
  {
    number: '02',
    label: 'COORDINATE',
    title: 'Organize the important details',
    text: 'Manage events, tasks, guests, and expenses as your plans take shape. Keep vendor details close at hand.',
    preview: 'Sample schedule',
  },
  {
    number: '03',
    label: 'PUBLISH',
    title: 'Share your wedding experience',
    text: 'Give guests access to relevant event information, invitations, and RSVP through their unique link.',
    preview: 'Guest-facing platform',
  },
];

function StepArtwork({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="step-art setup-art">
        <div className="step-art-title">
          <span>Workspace setup</span>
          <b>Step 2 of 3</b>
        </div>
        <div className="setup-progress">
          <span />
        </div>
        <small>Configuring venues &amp; co-hosts</small>
        <div className="setup-field">
          <HomeIcon name="calendar" />
          <span>Wedding date</span>
          <b>Nov 14, 2025</b>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="step-art schedule-art">
        <span>Sample schedule</span>
        <b>10:00 AM — Baraat arrival</b>
        <b>11:30 AM — Varmala exchange</b>
        <b>7:30 PM — Sangeet &amp; dinner</b>
      </div>
    );
  }

  return (
    <div className="step-art publish-art">
      <span>Guest-facing platform</span>
      <div>
        <HomeIcon name="mail" />
        <b>Digital invitations</b>
      </div>
      <small>Personalized links for each guest</small>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="process-section" id="how-it-works" aria-labelledby="process-title">
      <div className="page-container">
        <header className="section-heading">
          <p className="section-eyebrow">Process Architecture</p>
          <h2 id="process-title">From planning to sharing, made simpler.</h2>
          <p>A calm, linear workflow engineered so nothing falls through the cracks.</p>
        </header>
        <div className="process-grid">
          {steps.map((step, index) => (
            <article className="process-card" key={step.number}>
              <span className="process-number">{step.number}</span>
              <StepArtwork index={index} />
              <p className="process-label">{step.label}</p>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
