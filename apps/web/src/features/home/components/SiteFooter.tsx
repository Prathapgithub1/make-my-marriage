import { Link } from 'react-router';
import { BrandMark } from './BrandMark';

const exploreLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#website', label: 'Wedding Website' },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-main">
        <div className="footer-brand-block">
          <Link className="brand" to="/" aria-label="Make My Marriage home">
            <BrandMark />
            <span className="brand-wordmark">Make My Marriage</span>
          </Link>
          <p>The connected workspace for wedding planning and guest coordination.</p>
        </div>
        <nav className="footer-column" aria-label="Explore">
          <strong>Explore</strong>
          {exploreLinks.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <nav className="footer-column" aria-label="For guests">
          <strong>For guests</strong>
          <a href="#guest-experience">Invitations &amp; RSVPs</a>
          <a href="#faqs">FAQs</a>
        </nav>
        <nav className="footer-column" aria-label="Account">
          <strong>Account</strong>
          <Link to="/login">Sign in</Link>
          <a href="#get-started">Get started</a>
        </nav>
      </div>
      <div className="page-container footer-bottom">
        <span>© {new Date().getFullYear()} Make My Marriage</span>
        <span>Wedding plans, thoughtfully organized.</span>
      </div>
    </footer>
  );
}
