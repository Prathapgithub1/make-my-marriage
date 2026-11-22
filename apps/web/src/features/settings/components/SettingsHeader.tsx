import type { WeddingDetail } from '../../wedding/weddingApi';

interface SettingsHeaderProps {
  wedding: WeddingDetail | null;
  daysRemaining: number | null;
  userDisplayName?: string | null;
  userRole?: 'ADMIN' | 'MANAGER';
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onOpenNotifications?: () => void;
}

export function SettingsHeader({
  wedding,
  daysRemaining,
  userDisplayName,
  userRole = 'ADMIN',
  isDirty,
  isSaving,
  onSave,
  onDiscard,
  onOpenNotifications,
}: SettingsHeaderProps) {
  // Format wedding date for pill
  const formattedDate = wedding?.weddingDate
    ? new Date(wedding.weddingDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date not set';

  // Format couple title
  const coupleTitle =
    wedding?.title ||
    (wedding?.brideName && wedding?.groomName
      ? `${wedding.brideName} & ${wedding.groomName}'s Wedding`
      : 'Your Wedding Workspace');

  // Derive initials
  const initials = userDisplayName
    ? userDisplayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AR';

  return (
    <div className="bg-[#FAF8F5] border-b border-[#E8E3DC] px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left side: Context, Title and Meta Badges */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-[#9A6218] uppercase">
            <span>Workspace & Configuration</span>
            <span className="text-[#D3C7B6]">•</span>
            <span>Settings Console</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C1810] tracking-tight">
              {coupleTitle}
            </h1>

            {/* Countdown Badge */}
            {typeof daysRemaining === 'number' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF5EB] text-[#2F6B38] border border-[#CDE5D1]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B38] animate-pulse" />
                {daysRemaining > 0 ? `${daysRemaining} Days to Go` : 'Celebration Day!'}
              </span>
            )}

            {/* Date Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F4F0EA] text-[#5A453A] border border-[#E3DBD0]">
              <svg
                className="w-3.5 h-3.5 text-[#9A6218]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formattedDate}
            </span>

            {/* Location Badge */}
            {wedding?.location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F4F0EA] text-[#5A453A] border border-[#E3DBD0]">
                <svg
                  className="w-3.5 h-3.5 text-[#9A6218]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="truncate max-w-[200px]">{wedding.location}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right side: Actions, Save / Discard, User Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Alert Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2 text-[#7C6659] hover:text-[#2C1810] hover:bg-[#EFEAE2] rounded-full transition-colors"
            title="Celebration Notifications"
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
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#7B341E] text-white text-[10px] font-bold flex items-center justify-center">
              3
            </span>
          </button>

          {/* Help Circle */}
          <button
            type="button"
            className="p-2 text-[#7C6659] hover:text-[#2C1810] hover:bg-[#EFEAE2] rounded-full transition-colors"
            title="Settings Help & Guide"
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

          {/* Discard Button */}
          <button
            type="button"
            onClick={onDiscard}
            disabled={!isDirty || isSaving}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              isDirty && !isSaving
                ? 'text-[#6B5A51] hover:text-[#2C1810] hover:bg-[#EAE4DC]'
                : 'text-[#B8AEA3] cursor-not-allowed'
            }`}
          >
            Discard
          </button>

          {/* Save Changes Button */}
          <button
            type="button"
            onClick={onSave}
            disabled={!isDirty || isSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all ${
              isDirty && !isSaving
                ? 'bg-[#7B341E] hover:bg-[#642917] text-white active:scale-95'
                : 'bg-[#965A4B] text-white/70 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white"
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
                Saving...
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
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
                Save Changes
              </>
            )}
          </button>

          {/* User Profile Badge */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#E2DBD1]">
            <div className="w-8 h-8 rounded-full bg-[#F6D5CC] text-[#7B341E] font-bold text-xs flex items-center justify-center border border-[#EDBEB2]">
              {initials}
            </div>
            <div className="text-left text-xs leading-tight">
              <div className="font-semibold text-[#2C1810]">
                {userDisplayName || 'Akshitha Rao'}
              </div>
              <div className="text-[11px] text-[#7C6659]">
                {userRole === 'ADMIN' ? 'Host & Admin' : 'Planner & Manager'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
