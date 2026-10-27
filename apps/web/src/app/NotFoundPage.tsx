import { Link } from 'react-router';
import { BrandLockup } from '../components/BrandMark';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#fafaf3] text-[#1a1c18] antialiased">
      <header className="w-full bg-white border-b border-[#e3e3dc]/60">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a4b35]"
          >
            <BrandLockup />
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-xs font-semibold text-[#53433e] hover:text-[#8a4b35] transition-colors"
            >
              Sign In
            </Link>
            <Link to="/signup" className="button button-small">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-12 md:py-20">
        <div className="max-w-lg w-full text-center bg-white border border-[#d8c2bb]/50 rounded-2xl p-8 sm:p-12 shadow-[0_4px_24px_rgba(37,39,35,0.03)]">
          <div className="w-12 h-12 rounded-xl bg-[#8a4b35]/10 border border-[#8a4b35]/20 mx-auto flex items-center justify-center text-[#8a4b35] font-serif font-bold text-xl mb-6">
            404
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4f4ed] text-[#556251] text-xs font-semibold mb-4 border border-[#d8c2bb]/40">
            Page Not Found
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#1a1c18] font-medium tracking-tight mb-3">
            Looking for a different celebration?
          </h1>

          <p className="text-sm sm:text-base text-[#53433e] leading-relaxed mb-8">
            The page you requested could not be located. It may have moved, or the link may be
            outdated.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/" className="button w-full sm:w-auto">
              Return to Home
            </Link>
            <Link to="/login" className="button button-secondary w-full sm:w-auto">
              Go to Sign In
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full bg-[#fafaf3] border-t border-[#e3e3dc] py-6">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[#53433e]">
          <span>© 2025 Make My Marriage. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-[#8a4b35] transition-colors">
              Home
            </Link>
            <Link to="/login" className="hover:text-[#8a4b35] transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-[#8a4b35] transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
