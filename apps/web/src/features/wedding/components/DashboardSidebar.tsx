import { useEffect, type ReactNode, type MouseEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { BrandLockup } from '../../../components/BrandMark';

export interface DashboardSidebarProps {
  eventsCount?: number;
  membersCount?: number;
  onOpenComingSoon?: (feature: string, description: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: ReactNode;
  badge?: string | null;
  badgeType?: 'neutral' | 'amber' | 'green';
  isRealRoute: boolean;
  comingSoonDesc?: string;
}

export function DashboardSidebar({
  eventsCount,
  membersCount,
  onOpenComingSoon,
  isMobileOpen = false,
  onCloseMobile,
}: DashboardSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    if (!isMobileOpen || !onCloseMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const mainMenuItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
      isRealRoute: true,
    },
    {
      name: 'Events',
      path: '/events',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      badge: typeof eventsCount === 'number' && eventsCount > 0 ? String(eventsCount) : null,
      badgeType: 'neutral',
      isRealRoute: true,
    },
    {
      name: 'Tasks',
      path: '/tasks',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      badge: '4 Due',
      badgeType: 'amber',
      isRealRoute: true,
      comingSoonDesc: 'Wedding checklist and milestone task delegation are coming soon.',
    },
    {
      name: 'Guests & RSVP',
      path: '/guests',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      badge: '184',
      badgeType: 'neutral',
      isRealRoute: true,
      comingSoonDesc:
        'Guest registry, digital invitation links, and RSVP tracking are launching soon.',
    },
    {
      name: 'Expenses',
      path: '/expenses',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      isRealRoute: true,
      comingSoonDesc: 'Wedding budget management and vendor deposit tracking are in development.',
    },
    {
      name: 'Vendors',
      path: '/vendors',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      isRealRoute: true,
      comingSoonDesc: 'Vendor directory and bookings coordination are coming soon.',
    },
    {
      name: 'Wedding Website',
      path: '/website',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      ),
      badge: 'Live',
      badgeType: 'green',
      isRealRoute: true,
      comingSoonDesc: 'Custom wedding website builder is launching soon.',
    },
    {
      name: 'Gallery',
      path: '/gallery',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      isRealRoute: true,
      comingSoonDesc: 'Photo and memory gallery sharing is coming soon.',
    },
  ];

  const adminItems: NavItem[] = [
    {
      name: 'Settings',
      path: '/settings',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      isRealRoute: true,
      comingSoonDesc: 'Workspace timezone and notification settings are in development.',
    },
    {
      name: 'Wedding Members',
      path: '/settings/members',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      badge: typeof membersCount === 'number' && membersCount > 0 ? String(membersCount) : null,
      badgeType: 'neutral',
      isRealRoute: true,
    },
  ];

  const renderBadge = (item: NavItem) => {
    if (!item.badge) return null;

    if (item.badgeType === 'amber') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3E2] text-[#9A6218] border border-[#F6DDAE]">
          {item.badge}
        </span>
      );
    }

    if (item.badgeType === 'green') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5EB] text-[#2F6B38] border border-[#CDE5D1]">
          {item.badge}
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F2EE] text-[#53433E]">
        {item.badge}
      </span>
    );
  };

  const isItemActive = (itemPath: string, current: string): boolean => {
    if (itemPath === '/dashboard') {
      return current === '/dashboard';
    }
    if (itemPath === '/events') {
      return current.startsWith('/events') || current.startsWith('/wedding/events');
    }
    if (itemPath === '/settings/members') {
      return current.startsWith('/settings/members') || current.startsWith('/members');
    }
    if (itemPath === '/settings') {
      return (
        current === '/settings' ||
        (current.startsWith('/settings') && !current.startsWith('/settings/members'))
      );
    }
    return current === itemPath || (itemPath !== '/' && current.startsWith(itemPath));
  };

  const renderNavList = (items: NavItem[]) => (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = item.isRealRoute && isItemActive(item.path, currentPath);

        const handleClick = (e: MouseEvent) => {
          if (!item.isRealRoute) {
            e.preventDefault();
            onOpenComingSoon?.(
              item.name,
              item.comingSoonDesc || 'This module is in active development.',
            );
          }
          onCloseMobile?.();
        };

        if (item.isRealRoute) {
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                isActive
                  ? 'bg-[#FBF4F0] text-[#8A4B35] font-semibold'
                  : 'text-[#53433E] hover:text-[#1A1C18] hover:bg-[#F4F2EE] font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-[#8A4B35]' : 'text-[#86736D]'}>{item.icon}</span>
                <span>{item.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {renderBadge(item)}
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#8A4B35]" />}
              </div>
            </Link>
          );
        }

        return (
          <button
            key={item.name}
            type="button"
            onClick={handleClick}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#53433E] hover:text-[#1A1C18] hover:bg-[#F4F2EE] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-[#86736D]">{item.icon}</span>
              <span>{item.name}</span>
            </div>

            <div>{renderBadge(item)}</div>
          </button>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <aside className="w-full flex flex-col justify-between min-h-full">
      <div>
        {/* Brand Lockup Header matching Screenshot 1 */}
        <div className="h-14 sm:h-15 px-6 flex items-center border-b border-[#EAE6E1]/70">
          <BrandLockup subtitle="WEDDING PLANNING SUITE" />
        </div>

        {/* Navigation Sections */}
        <nav className="p-4 space-y-6">
          {/* Main Menu */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#86736D]">
              MAIN MENU
            </div>
            {renderNavList(mainMenuItems)}
          </div>

          {/* Administration */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#86736D]">
              ADMINISTRATION
            </div>
            {renderNavList(adminItems)}
          </div>
        </nav>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block w-[270px] shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-[#EAE6E1] bg-white">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen ? (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-[#1a1c18]/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col w-[270px] max-w-xs bg-white shadow-2xl z-10 h-full overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      ) : null}
    </>
  );
}
