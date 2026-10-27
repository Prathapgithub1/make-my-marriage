import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { BrandLockup } from './BrandMark';
import { HomeIcon } from './HomeIcon';

const navigationItems = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#website', label: 'Wedding Website' },
  { href: '#guest-experience', label: 'Guest Experience' },
  { href: '#faqs', label: 'FAQs' },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeMenu = () => setMenuOpen(false);

  function handleMenuKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      closeMenu();
      menuButton.current?.focus();
    }
  }

  return (
    <header className="site-header" onKeyDown={handleMenuKeyDown}>
      <div className="site-header-inner">
        <Link className="brand" to="/" aria-label="Make My Marriage home" onClick={closeMenu}>
          <BrandLockup />
        </Link>
        <button
          ref={menuButton}
          aria-controls="primary-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <HomeIcon name="menu" />
        </button>
        <nav
          aria-label="Main navigation"
          className={`primary-navigation${menuOpen ? ' is-open' : ''}`}
          id="primary-navigation"
        >
          {navigationItems.map((item) => (
            <a href={item.href} key={item.href} onClick={closeMenu}>
              {item.label}
            </a>
          ))}
          <Link className="sign-in-link" to="/login" onClick={closeMenu}>
            Sign in
          </Link>
          <a className="button button-small" href="#get-started" onClick={closeMenu}>
            Get started <HomeIcon name="arrow" />
          </a>
        </nav>
      </div>
    </header>
  );
}
