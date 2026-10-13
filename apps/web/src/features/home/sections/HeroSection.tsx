import { DashboardPreview } from '../components/DashboardPreview';
import { HomeIcon } from '../components/HomeIcon';

export function HeroSection() {
  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <div className="hero-inner page-container">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <i /> Wedding Planning, Made Simpler
          </p>
          <h1 id="hero-title">One place for every part of your wedding.</h1>
          <p className="hero-description">
            Bring your wedding plans together, keep track of the details, and make it easier for
            your guests to stay informed.
          </p>
          <div className="hero-actions">
            <a className="button" href="#get-started">
              Get started <HomeIcon name="arrow" />
            </a>
            <a className="button button-secondary" href="#features">
              Explore features
            </a>
          </div>
          <p className="hero-promise">
            <HomeIcon name="check" />
            Your wedding plans, thoughtfully organized.
          </p>
          <div className="hero-proof" aria-label="Illustrative placeholder metrics">
            <div>
              <strong>4,200+</strong>
              <span>Celebrations organized</span>
            </div>
            <span className="hero-proof-divider" aria-hidden="true" />
            <div>
              <strong>99.4%</strong>
              <span>Guest RSVP response rate</span>
            </div>
            <p>Illustrative placeholders only; these are not verified product metrics.</p>
          </div>
        </div>
        <div className="hero-visual">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
