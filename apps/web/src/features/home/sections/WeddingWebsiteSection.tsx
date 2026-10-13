import { HomeIcon } from '../components/HomeIcon';

const websiteBenefits = [
  {
    title: 'Personalized invitations',
    detail: 'Give each guest a link to their invitation and RSVP.',
  },
  { title: 'Event details', detail: 'Guests see only the events included in their invitation.' },
  { title: 'Livestream link', detail: 'Show a YouTube livestream when one is configured.' },
];

const sampleEvents = [
  { time: '04:00 PM', name: 'Mehndi Ceremony', venue: 'The Courtyard Pavilion' },
  { time: '07:30 PM', name: 'Sangeet & Dinner', venue: 'Grand Ballroom' },
  { time: '10:00 AM', name: 'Wedding Ceremony', venue: 'Lotus Garden Sanctuary' },
];

function WeddingSitePreview() {
  return (
    <div className="wedding-site-preview" aria-label="Illustrative wedding website preview">
      <div className="site-preview-browser">
        <span className="window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>makemymarriage.com/w/sample-wedding</span>
      </div>
      <div className="site-preview-cover">
        <span className="site-preview-eyebrow">CELEBRATING THE UNION OF</span>
        <h3>
          Prathap <i>&amp;</i> Akshitha
        </h3>
        <p>Saturday, November 14, 2025 · Udaipur, Rajasthan</p>
        <span className="preview-action">VIEW INVITATION</span>
      </div>
      <div className="site-preview-events">
        <div className="site-preview-heading">
          <span>EVENT DETAILS</span>
          <h4>Order of events</h4>
        </div>
        {sampleEvents.map((event) => (
          <div className="site-event-row" key={event.name}>
            <b>{event.time}</b>
            <span>
              <strong>{event.name}</strong>
              <small>{event.venue}</small>
            </span>
          </div>
        ))}
      </div>
      <div className="site-preview-stream">
        <HomeIcon name="play" />
        <span>
          <strong>YouTube livestream</strong>
          <small>Shown when a stream link is configured</small>
        </span>
      </div>
      <p className="preview-caption">Illustrative sample wedding information.</p>
    </div>
  );
}

export function WeddingWebsiteSection() {
  return (
    <section className="website-section" id="website" aria-labelledby="website-title">
      <div className="page-container website-layout">
        <div className="website-copy">
          <p className="section-pill">Guest-facing platform</p>
          <h2 id="website-title">Your wedding, shared beautifully.</h2>
          <p>
            Present your wedding details in one dedicated place, so guests can find the information
            and event details included with their invitation.
          </p>
          <ul className="benefit-list">
            {websiteBenefits.map((benefit) => (
              <li key={benefit.title}>
                <span className="benefit-check">
                  <HomeIcon name="check" />
                </span>
                <span>
                  <strong>{benefit.title}</strong>
                  <small>{benefit.detail}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <WeddingSitePreview />
      </div>
    </section>
  );
}
