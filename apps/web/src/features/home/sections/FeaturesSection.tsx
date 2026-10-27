import { HomeIcon, type HomeIconName } from '../components/HomeIcon';
import { FeatureArtwork } from './FeatureArtwork';

const features: Array<{
  number: string;
  icon: HomeIconName;
  title: string;
  description: string;
  artwork: 'budget' | 'guests' | 'website';
}> = [
  {
    number: '01',
    icon: 'calendar',
    title: 'Stay organized',
    description: 'Keep wedding events, tasks, and expenses organized in one workspace.',
    artwork: 'budget',
  },
  {
    number: '02',
    icon: 'users',
    title: 'Coordinate your guests',
    description: 'Manage guest details, invitations, and RSVP responses in one place.',
    artwork: 'guests',
  },
  {
    number: '03',
    icon: 'location',
    title: 'Share your wedding',
    description: 'Give your guests one place to find wedding details and event information.',
    artwork: 'website',
  },
];

export function FeaturesSection() {
  return (
    <section className="features-section" id="features" aria-labelledby="features-title">
      <div className="page-container">
        <header className="section-heading">
          <p className="section-eyebrow">Workspace Modules</p>
          <h2 id="features-title">Everything that brings your wedding together.</h2>
          <p>
            Keep the important details connected, from the first plans to the moments you share with
            your guests.
          </p>
        </header>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <div className="feature-card-heading">
                <span className="feature-icon">
                  <HomeIcon name={feature.icon} />
                </span>
                <span className="feature-number">{feature.number}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <FeatureArtwork kind={feature.artwork} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
