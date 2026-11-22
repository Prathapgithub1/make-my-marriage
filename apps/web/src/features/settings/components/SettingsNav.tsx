import type { ReactNode } from 'react';
import type { SettingsTab } from '../types';

interface SettingsNavProps {
  activeTab: SettingsTab;
  onSelectTab: (tab: SettingsTab) => void;
  membersCount?: number;
  hasUnsavedChanges?: boolean;
}

interface NavItemDef {
  id: SettingsTab;
  label: string;
  icon: ReactNode;
  badge?: string | number | null;
  isDanger?: boolean;
}

export function SettingsNav({
  activeTab,
  onSelectTab,
  membersCount = 6,
  hasUnsavedChanges = false,
}: SettingsNavProps) {
  const navItems: NavItemDef[] = [
    {
      id: 'profile',
      label: 'General Profile',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      ),
    },
    {
      id: 'members',
      label: 'Workspace Members',
      badge: membersCount,
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
    },
    {
      id: 'roles',
      label: 'Roles & Permissions',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    {
      id: 'privacy',
      label: 'Privacy & Access',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications & Alerts',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
    },
    {
      id: 'export',
      label: 'Workspace Data & Export',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
      ),
    },
    {
      id: 'danger',
      label: 'Danger Zone',
      isDanger: true,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 bg-[#FBF9F5] border-r border-[#ECE7DF] p-3 space-y-1">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;

        if (item.isDanger) {
          return (
            <div key={item.id} className="pt-4 mt-4 border-t border-[#EDE7DF]">
              <button
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#FBEAE8] text-[#C53030] shadow-sm'
                    : 'text-[#C53030]/80 hover:text-[#C53030] hover:bg-[#FDF0EE]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-[#C53030]' : 'text-[#C53030]/80'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              </button>
            </div>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all ${
              isActive
                ? 'bg-[#EFEAE2] text-[#2C1810] font-bold shadow-sm'
                : 'text-[#6B5A51] hover:text-[#2C1810] hover:bg-[#F3EFE9] font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={isActive ? 'text-[#7B341E]' : 'text-[#8C7A70]'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {item.badge !== undefined && item.badge !== null && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E4DDD3] text-[#4A3B32]">
                  {item.badge}
                </span>
              )}
              {isActive && item.id === 'profile' && hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-[#7B341E]" />
              )}
              {isActive && !hasUnsavedChanges && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#7B341E]" />
              )}
            </div>
          </button>
        );
      })}
    </aside>
  );
}
