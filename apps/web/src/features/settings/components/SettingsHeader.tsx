import type { WeddingDetail } from '../../wedding/weddingApi';

interface SettingsHeaderProps {
  wedding: WeddingDetail | null;
  userDisplayName?: string | null;
  userRole?: 'ADMIN' | 'MANAGER';
  isDirty: boolean;
  isSaving: boolean;
  isAdmin?: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onOpenNotifications?: () => void;
  onOpenHelp?: () => void;
}

export function SettingsHeader({
  wedding,
  userDisplayName,
  userRole = 'ADMIN',
  isDirty,
  isSaving,
  isAdmin = true,
  onSave,
  onDiscard,
  onOpenNotifications,
  onOpenHelp,
}: SettingsHeaderProps) {
  // Title for the workspace
  const workspaceTitle = wedding?.title || 'Workspace Settings';

  // Derive initials
  const initials = userDisplayName
    ? userDisplayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'WM';

  return (
    <div className="bg-[#FAF8F5] border-b border-[#E8E3DC] px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left side: Context, Title and Workspace Status Badges */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-[#9A6218] uppercase">
            <span>Workspace & Configuration</span>
            <span className="text-[#D3C7B6]">•</span>
            <span>Settings Console</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C1810] tracking-tight">
              {workspaceTitle}
            </h1>

            {/* Active Workspace Status Pill */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF5EB] text-[#2F6B38] border border-[#CDE5D1]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B38]" />
              Active Workspace
            </span>

            {/* Role Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F4F0EA] text-[#5A453A] border border-[#E3DBD0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9A6218]" />
              {userRole === 'ADMIN' ? 'Administrator' : 'Manager'}
            </span>
          </div>
        </div>

        {/* Right side: Action Group (Discard / Save), Tools, and Profile Pill */}
        <div className="flex items-center gap-3">
          {/* Notification Alert Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2 text-[#7C6659] hover:text-[#2C1810] hover:bg-[#EFEAE2] rounded-full transition-colors"
            title="Configure Workspace Notifications"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#7B341E]" />
          </button>

          {/* Help Circle */}
          <button
            type="button"
            onClick={onOpenHelp}
            className="p-2 text-[#7C6659] hover:text-[#2C1810] hover:bg-[#EFEAE2] rounded-full transition-colors"
            title="Workspace Settings Guide & Support"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* Button Group: Discard and Save Changes */}
          <div className="flex items-center gap-2 border-l border-[#E5DFD6] pl-3">
            {/* Discard Button (Subtle Outline) */}
            <button
              type="button"
              onClick={onDiscard}
              disabled={!isDirty || isSaving}
              className={`inline-flex items-center justify-center px-4 h-9 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isDirty && !isSaving
                  ? 'border border-[#D5CCC0] text-[#5A453A] bg-white hover:bg-[#F5EFE6] hover:text-[#2C1810] shadow-sm active:scale-[0.98]'
                  : 'border border-[#EAE4DC] text-[#B8AEA3] bg-transparent cursor-not-allowed shadow-none'
              }`}
            >
              Discard
            </button>

            {/* Save Changes Button (Primary Action) */}
            <button
              type="button"
              onClick={onSave}
              disabled={!isDirty || isSaving || !isAdmin}
              title={!isAdmin ? 'Administrator privileges required to save changes' : undefined}
              className={`inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg text-xs font-semibold shadow-sm transition-all duration-150 ${
                isDirty && !isSaving && isAdmin
                  ? 'bg-[#7B341E] hover:bg-[#652714] text-white active:scale-[0.98] hover:shadow'
                  : 'bg-[#E3DDD5] text-[#9A8D83] border border-[#D8D0C5] cursor-not-allowed shadow-none'
              }`}
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5 text-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#E5DFD6]">
            <div className="w-8 h-8 rounded-full bg-[#EFE9DF] text-[#7B341E] border border-[#DCD5C9] font-bold text-xs flex items-center justify-center">
              {initials}
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-semibold text-[#2C1810]">
                {userDisplayName || 'Workspace User'}
              </div>
              <div className="text-[10px] text-[#7C6659]">
                {userRole === 'ADMIN' ? 'Host & Admin' : 'Workspace Manager'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
