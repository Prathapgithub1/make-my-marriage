import type { NotificationPreferences } from '../types';

interface NotificationsSectionProps {
  preferences: NotificationPreferences;
  onTogglePreference: (key: keyof NotificationPreferences) => void;
  isAdmin: boolean;
}

export function NotificationsSection({
  preferences,
  onTogglePreference,
  isAdmin,
}: NotificationsSectionProps) {
  const notificationItems = [
    {
      key: 'dailyDigest' as const,
      title: 'Daily Celebration Digest (Email)',
      description: 'Receive a daily morning summary of newly confirmed RSVPs, pending task deadlines, and budget ledger activity.',
      badge: 'Morning Digest',
    },
    {
      key: 'instantRsvp' as const,
      title: 'Instant Guest RSVP Alerts',
      description: 'Get notified immediately via email whenever a guest accepts or declines ceremony invitations or updates party headcount.',
      badge: 'High Priority',
    },
    {
      key: 'taskDueReminders' as const,
      title: 'Task Due Date Reminders (24h & 48h)',
      description: 'Automated advance reminders for organizers before high-priority checklist deliverables and ceremony items fall due.',
      badge: 'Checklist',
    },
    {
      key: 'paymentReminders' as const,
      title: 'Vendor Installment Reminders',
      description: 'Upcoming payment alerts 3 days prior to vendor contract installment dates and deposit schedules.',
      badge: 'Financial',
    },
    {
      key: 'milestoneAlerts' as const,
      title: 'Attendance Milestone Celebrations',
      description: 'Celebratory notifications when your guest list hits major confirmation milestones (50, 100, 250, 500 guests).',
      badge: 'Celebration',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-5 border-b border-[#EAE4DC]">
        <div className="text-[11px] font-bold tracking-wider text-[#9A6218] uppercase">
          Section 05
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2C1810]">
          Notifications & Celebration Alerts
        </h2>
        <p className="text-xs sm:text-sm text-[#7C6659] mt-0.5">
          Configure event reminders, RSVP digests, and task notification channels.
        </p>
      </div>

      {/* Notification Preferences List */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl divide-y divide-[#EAE4DC] shadow-sm overflow-hidden">
        {notificationItems.map((item) => (
          <div
            key={item.key}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#2C1810]">{item.title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F4EFEA] text-[#7C6659] border border-[#E2DBD0]">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-[#7C6659] max-w-2xl leading-relaxed">
                {item.description}
              </p>
            </div>

            <button
              type="button"
              disabled={!isAdmin}
              onClick={() => onTogglePreference(item.key)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                preferences[item.key] ? 'bg-[#2F6B38]' : 'bg-[#D5CCC0]'
              } disabled:opacity-50 self-end sm:self-auto`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences[item.key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
