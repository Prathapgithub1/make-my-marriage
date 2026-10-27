import { BrandMark } from '../components/BrandMark';
import { HomeIcon } from '../components/HomeIcon';

export function GetStartedSection() {
  return (
    <section className="get-started-section" id="get-started" aria-labelledby="get-started-title">
      <div className="get-started-card">
        <BrandMark />
        <h2 id="get-started-title">Bring your wedding plans together.</h2>
        <p>
          Start with the details that matter and build your wedding experience one step at a time.
        </p>
        <div className="get-started-actions">
          <a className="button" href="/signup">
            Get started <HomeIcon name="arrow" />
          </a>
          <a href="#features">Explore features</a>
        </div>
        <small>Illustrative preview · Sample names and figures are for layout only.</small>
      </div>
    </section>
  );
}
