import { useLocation } from 'react-router';

export interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

/**
 * Approved Make My Marriage logo symbol:
 * Features the signature M glyph with rounded pillar caps and the center nestled heart.
 */
export function BrandMark({ compact = false, className = '' }: BrandMarkProps = {}) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 text-[#1a1c18] ${
        compact ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-9 sm:h-9'
      } ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 59"
        fill="currentColor"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6,0h2v1h-2z M56,0h2v1h-2z M3,1h8v1h-8z M53,1h8v1h-8z M2,2h10v1h-10z M52,2h10v1h-10z M1,3h12v1h-12z M51,3h12v1h-12z M1,4h12v1h-12z M51,4h12v1h-12z M0,5h14v1h-14z M50,5h14v1h-14z M0,6h14v1h-14z M23,6h2v1h-2z M39,6h2v1h-2z M50,6h14v1h-14z M0,7h14v1h-14z M21,7h7v1h-7z M36,7h7v1h-7z M50,7h14v1h-14z M0,8h14v1h-14z M20,8h10v1h-10z M34,8h10v1h-10z M50,8h14v1h-14z M0,9h14v1h-14z M19,9h12v1h-12z M33,9h12v1h-12z M50,9h14v1h-14z M0,10h14v1h-14z M19,10h26v1h-26z M50,10h14v1h-14z M0,11h14v1h-14z M19,11h26v1h-26z M50,11h14v1h-14z M0,12h15v1h-15z M19,12h26v1h-26z M49,12h15v1h-15z M0,13h15v1h-15z M20,13h24v1h-24z M49,13h15v1h-15z M0,14h14v1h-14z M15,14h1v1h-1z M20,14h24v1h-24z M48,14h1v1h-1z M50,14h14v1h-14z M0,15h14v1h-14z M15,15h1v1h-1z M21,15h22v1h-22z M48,15h1v1h-1z M50,15h14v1h-14z M0,16h14v1h-14z M15,16h2v1h-2z M22,16h20v1h-20z M47,16h2v1h-2z M50,16h14v1h-14z M0,17h14v1h-14z M15,17h2v1h-2z M23,17h18v1h-18z M47,17h2v1h-2z M50,17h14v1h-14z M0,18h14v1h-14z M15,18h3v1h-3z M24,18h16v1h-16z M46,18h3v1h-3z M50,18h14v1h-14z M0,19h14v1h-14z M15,19h3v1h-3z M25,19h14v1h-14z M46,19h3v1h-3z M50,19h14v1h-14z M0,20h14v1h-14z M16,20h3v1h-3z M26,20h12v1h-12z M45,20h3v1h-3z M50,20h14v1h-14z M0,21h14v1h-14z M16,21h3v1h-3z M27,21h10v1h-10z M45,21h3v1h-3z M50,21h14v1h-14z M0,22h14v1h-14z M16,22h4v1h-4z M28,22h7v1h-7z M44,22h4v1h-4z M50,22h14v1h-14z M0,23h14v1h-14z M16,23h4v1h-4z M30,23h4v1h-4z M43,23h5v1h-5z M50,23h14v1h-14z M0,24h14v1h-14z M16,24h5v1h-5z M31,24h2v1h-2z M43,24h4v1h-4z M50,24h14v1h-14z M0,25h14v1h-14z M17,25h5v1h-5z M42,25h5v1h-5z M50,25h14v1h-14z M0,26h14v1h-14z M17,26h5v1h-5z M42,26h5v1h-5z M50,26h14v1h-14z M0,27h14v1h-14z M17,27h6v1h-6z M41,27h5v1h-5z M50,27h14v1h-14z M0,28h14v1h-14z M18,28h6v1h-6z M40,28h6v1h-6z M50,28h14v1h-14z M0,29h14v1h-14z M18,29h6v1h-6z M40,29h6v1h-6z M50,29h14v1h-14z M0,30h14v1h-14z M19,30h6v1h-6z M39,30h6v1h-6z M50,30h14v1h-14z M0,31h14v1h-14z M19,31h6v1h-6z M38,31h7v1h-7z M50,31h14v1h-14z M0,32h14v1h-14z M19,32h7v1h-7z M38,32h6v1h-6z M50,32h14v1h-14z M0,33h14v1h-14z M20,33h7v1h-7z M37,33h7v1h-7z M50,33h14v1h-14z M0,34h14v1h-14z M20,34h8v1h-8z M36,34h7v1h-7z M50,34h14v1h-14z M0,35h14v1h-14z M21,35h7v1h-7z M36,35h7v1h-7z M50,35h14v1h-14z M0,36h14v1h-14z M21,36h8v1h-8z M35,36h7v1h-7z M50,36h14v1h-14z M0,37h14v1h-14z M22,37h8v1h-8z M34,37h8v1h-8z M50,37h14v1h-14z M0,38h14v1h-14z M23,38h8v1h-8z M33,38h8v1h-8z M50,38h14v1h-14z M0,39h14v1h-14z M23,39h18v1h-18z M50,39h14v1h-14z M0,40h14v1h-14z M24,40h16v1h-16z M50,40h14v1h-14z M0,41h14v1h-14z M25,41h14v1h-14z M50,41h14v1h-14z M0,42h14v1h-14z M25,42h14v1h-14z M50,42h14v1h-14z M0,43h14v1h-14z M26,43h12v1h-12z M50,43h14v1h-14z M0,44h14v1h-14z M27,44h10v1h-10z M50,44h14v1h-14z M0,45h14v1h-14z M28,45h8v1h-8z M50,45h14v1h-14z M0,46h14v1h-14z M29,46h6v1h-6z M50,46h14v1h-14z M0,47h14v1h-14z M30,47h4v1h-4z M50,47h14v1h-14z M0,48h14v1h-14z M31,48h2v1h-2z M50,48h14v1h-14z M0,49h14v1h-14z M50,49h14v1h-14z M0,50h14v1h-14z M50,50h14v1h-14z M0,51h14v1h-14z M50,51h14v1h-14z M0,52h14v1h-14z M50,52h14v1h-14z M0,53h14v1h-14z M50,53h14v1h-14z M0,54h14v1h-14z M50,54h14v1h-14z M0,55h14v1h-14z M50,55h14v1h-14z M0,56h14v1h-14z M50,56h14v1h-14z M0,57h14v1h-14z M50,57h14v1h-14z M0,58h14v1h-14z M50,58h14v1h-14z" />
      </svg>
    </span>
  );
}

/**
 * Standard dynamic route subtitle mappings as specified by the approved design.
 */
export const ROUTE_SUBTITLES: Record<string, string> = {
  '/': 'WEDDING PLANNING, BEAUTIFULLY ORGANIZED',
  '/login': 'WELCOME BACK',
  '/signin': 'WELCOME BACK',
  '/signup': 'CREATE YOUR ACCOUNT',
  '/register': 'CREATE YOUR ACCOUNT',
  '/verify-email': 'VERIFY YOUR EMAIL',
  '/email-verification': 'VERIFY YOUR EMAIL',
  '/forgot-password': 'RESET YOUR PASSWORD',
  '/reset-password': 'SECURE ACCOUNT RECOVERY',
  '/wedding/setup': 'YOUR WEDDING JOURNEY STARTS HERE',
  '/wedding/onboarding': 'YOUR WEDDING JOURNEY STARTS HERE',
  '/dashboard': 'YOUR WEDDING WORKSPACE',
  '/guests': 'GUEST MANAGEMENT',
  '/wedding/guests': 'GUEST MANAGEMENT',
  '/checklist': 'YOUR WEDDING CHECKLIST',
  '/tasks': 'YOUR WEDDING CHECKLIST',
  '/wedding/checklist': 'YOUR WEDDING CHECKLIST',
  '/wedding/tasks': 'YOUR WEDDING CHECKLIST',
  '/events': 'WEDDING EVENTS',
  '/wedding/events': 'WEDDING EVENTS',
  '/budget': 'WEDDING BUDGET',
  '/expenses': 'WEDDING BUDGET',
  '/wedding/budget': 'WEDDING BUDGET',
  '/wedding/expenses': 'WEDDING BUDGET',
  '/vendors': 'YOUR WEDDING VENDORS',
  '/wedding/vendors': 'YOUR WEDDING VENDORS',
  '/invitations': 'INVITATIONS & RSVPS',
  '/rsvp': 'INVITATIONS & RSVPS',
  '/rsvps': 'INVITATIONS & RSVPS',
  '/wedding/invitations': 'INVITATIONS & RSVPS',
  '/wedding/rsvps': 'INVITATIONS & RSVPS',
  '/website': 'YOUR WEDDING WEBSITE',
  '/wedding/website': 'YOUR WEDDING WEBSITE',
  '/gallery': 'YOUR WEDDING MEMORIES',
  '/photos': 'YOUR WEDDING MEMORIES',
  '/wedding/gallery': 'YOUR WEDDING MEMORIES',
  '/settings': 'WORKSPACE SETTINGS',
  '/settings/members': 'WEDDING TEAM & MEMBERS',
  '/members': 'WEDDING TEAM & MEMBERS',
  '/wedding/members': 'WEDDING TEAM & MEMBERS',
  '/invitations/members': 'ACCEPT WEDDING INVITATION',
  '/wedding/settings': 'WORKSPACE SETTINGS',
};

export const DEFAULT_BRAND_SUBTITLE = 'WEDDING PLANNING, BEAUTIFULLY ORGANIZED';

/**
 * Resolves the appropriate brand subtitle given a pathname and optional explicit override.
 */
export function getPageSubtitle(pathname: string, explicitSubtitle?: string): string {
  if (explicitSubtitle !== undefined && explicitSubtitle.trim().length > 0) {
    return explicitSubtitle;
  }

  if (!pathname || pathname === '/') {
    return ROUTE_SUBTITLES['/'];
  }

  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  // 1. Exact match
  if (ROUTE_SUBTITLES[normalized]) {
    return ROUTE_SUBTITLES[normalized];
  }

  // 2. Prefix match for nested routes
  const sortedKeys = Object.keys(ROUTE_SUBTITLES)
    .filter((k) => k !== '/')
    .sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (normalized.startsWith(key)) {
      return ROUTE_SUBTITLES[key];
    }
  }

  return DEFAULT_BRAND_SUBTITLE;
}

/**
 * Hook to retrieve dynamic subtitle based on current router location.
 */
export function usePageSubtitle(explicitSubtitle?: string): string {
  let pathname = '/';
  try {
    const location = useLocation();
    if (location?.pathname) {
      pathname = location.pathname;
    }
  } catch {
    if (typeof window !== 'undefined' && window.location?.pathname) {
      pathname = window.location.pathname;
    }
  }

  return getPageSubtitle(pathname, explicitSubtitle);
}

export interface BrandLockupProps {
  subtitle?: string;
  compact?: boolean;
  className?: string;
  hideSubtitle?: boolean;
}

/**
 * Consistent brand lockup combining the approved M-and-heart logo mark,
 * "Make My Marriage" wordmark, and the dynamic per-page subtitle.
 */
export function BrandLockup({
  subtitle,
  compact = false,
  className = '',
  hideSubtitle = false,
}: BrandLockupProps) {
  const dynamicSubtitle = usePageSubtitle(subtitle);

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <BrandMark compact={compact} />
      <div className="flex flex-col justify-center min-w-0">
        <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-[#1a1c18] leading-tight whitespace-nowrap">
          Make My Marriage
        </span>
        {!hideSubtitle && (
          <span className="text-[10px] sm:text-[10.5px] font-sans font-semibold uppercase tracking-[0.16em] text-[#53433e] leading-tight mt-1 whitespace-nowrap">
            {dynamicSubtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export const BrandHeader = BrandLockup;
export const BrandLogo = BrandLockup;
export const Brand = BrandLockup;
