import * as React from 'react';
import { useState, useRef, useEffect } from 'react';

export interface DashboardHeaderProps {
  userName: string;
  userEmail: string;
  userInitials: string;
  userRole?: string;
  onSignOut: () => void;
  onOpenMobileSidebar?: () => void;
}

export function DashboardHeader({
  userName,
  userEmail,
  userInitials,
  userRole = 'ADMIN',
  onSignOut,
  onOpenMobileSidebar,
}: DashboardHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const normalizedRole =
    userRole.toUpperCase() === 'ADMIN'
      ? 'Admin'
      : userRole.toUpperCase() === 'MANAGER'
        ? 'Manager'
        : 'Organizer';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-[#EAE6E1] sticky top-0 z-40 shadow-2xs">
      <div className="w-full px-4 sm:px-6 md:px-8 h-14 sm:h-15 flex items-center justify-between">
        {/* Left: Mobile hamburger menu toggle */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-[#53433E] hover:bg-[#F4F2EE] hover:text-[#1A1C18] transition-colors"
            aria-label="Open sidebar menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Right: Notifications & User Profile matching Screenshot 1 */}
        <div className="flex items-center gap-4 sm:gap-6 ml-auto">
          {/* Notification Bell with Badge '3' */}
          <button
            type="button"
            className="relative p-2 text-[#53433E] hover:text-[#1A1C18] transition-colors rounded-full hover:bg-[#F4F2EE]"
            aria-label="3 notifications"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#8A4B35] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              3
            </span>
          </button>

          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-3 p-1 rounded-xl hover:bg-[#F4F2EE] transition-colors group cursor-pointer text-left"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              {/* Avatar with Online Indicator */}
              <div className="relative shrink-0">
                <div
                  className="w-9 h-9 rounded-full bg-[#8A4B35] text-white font-semibold text-xs flex items-center justify-center shadow-xs"
                  title={userName}
                >
                  {userInitials || 'AR'}
                </div>
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#556251] ring-2 ring-white"
                  title="Online"
                />
              </div>

              {/* User Name & Dynamic Role Badge */}
              <div className="hidden sm:flex flex-col">
                <span className="text-xs sm:text-sm font-semibold text-[#1A1C18] leading-tight">
                  {userName}
                </span>
                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#EBF2EB] text-[#4A6B4A] w-fit">
                  {normalizedRole}
                </span>
              </div>

              {/* Chevron Down */}
              <svg
                className={`w-4 h-4 text-[#86736D] group-hover:text-[#1A1C18] transition-transform ${isDropdownOpen ? 'rotate-180' : ''
                  }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#EAE6E1] shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2.5 border-b border-[#F4F2EE]">
                  <p className="text-xs font-semibold text-[#1A1C18] truncate">{userName}</p>
                  <p className="text-[11px] text-[#86736D] truncate mt-0.5">{userEmail}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[#EBF2EB] text-[#4A6B4A]">
                    {normalizedRole}
                  </span>
                </div>

                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Direct Sign Out button for screen accessibility and automated testing */}
          <button
            type="button"
            onClick={onSignOut}
            className="text-xs font-medium text-[#53433E] hover:text-[#8A4B35] px-2.5 py-1.5 rounded-lg border border-[#D8C2BB]/40 hover:bg-[#F4F2EE] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
