export function RolesPermissionsSection() {
  const permissionsList = [
    {
      module: 'Workspace Identity & Settings',
      description: 'Update couple names, wedding date, venue, cover banner, and celebration story',
      admin: true,
      manager: false,
    },
    {
      module: 'Ceremony Schedule & Events',
      description: 'Create, reschedule, edit dress codes, and manage ceremony schedules',
      admin: true,
      manager: true,
    },
    {
      module: 'Guest List & RSVP Tracking',
      description: 'Add attendees, send invitations, import spreadsheets, and record RSVPs',
      admin: true,
      manager: true,
    },
    {
      module: 'Checklists & Task Allocation',
      description: 'Assign tasks, update priorities, track due dates, and mark completions',
      admin: true,
      manager: true,
    },
    {
      module: 'Budget, Expenses & Ledger',
      description: 'Set ceremony budget limits, add expenses, and log payment installments',
      admin: true,
      manager: false,
    },
    {
      module: 'Vendor Directory & Bookings',
      description: 'Review quotes, manage vendor bookings, schedule production calls, and track agreements',
      admin: true,
      manager: true,
    },
    {
      module: 'Wedding Website Publishing',
      description: 'Select themes, edit section contents, and toggle public live status',
      admin: true,
      manager: false,
    },
    {
      module: 'Photo & Video Cloud Gallery',
      description: 'Create albums, upload media, download full-resolution assets, and delete files',
      admin: true,
      manager: true,
    },
    {
      module: 'Team Members & Invitations',
      description: 'Invite new co-hosts, modify team permissions, and revoke active memberships',
      admin: true,
      manager: false,
    },
    {
      module: 'Danger Zone & Workspace Deletion',
      description: 'Permanently delete this wedding celebration and purge associated database records',
      admin: true,
      manager: false,
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-5 border-b border-[#EAE4DC]">
        <div className="text-[11px] font-bold tracking-wider text-[#9A6218] uppercase">
          Section 03
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2C1810]">
          Roles & Access Permissions
        </h2>
        <p className="text-xs sm:text-sm text-[#7C6659] mt-0.5">
          Understand capabilities and boundaries between wedding organizers and team members.
        </p>
      </div>

      {/* Role Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Admin Card */}
        <div className="bg-[#FAF8F5] border-2 border-[#7B341E]/30 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#7B341E]/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7B341E] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              👑
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2C1810]">Wedding Administrator</h3>
              <span className="text-[11px] text-[#7B341E] font-semibold uppercase tracking-wider">
                Full Workspace Control
              </span>
            </div>
          </div>

          <p className="text-xs text-[#5A453A] leading-relaxed">
            Reserved for the couple, lead wedding planners, and primary decision makers. Administrators hold full authority over workspace configuration, financial budgets, website publishing, and team member management.
          </p>

          <ul className="text-xs text-[#5A453A] space-y-1.5 pt-2 border-t border-[#E8E2D8]">
            <li className="flex items-center gap-2">
              <span className="text-[#2F6B38] font-bold">✓</span> Modify workspace identity and settings
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2F6B38] font-bold">✓</span> Manage budgets, payments, and financial ledgers
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2F6B38] font-bold">✓</span> Invite, elevate, or remove team members
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2F6B38] font-bold">✓</span> Publish wedding website and manage privacy
            </li>
          </ul>
        </div>

        {/* Manager Card */}
        <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FEF3E2] text-[#9A6218] flex items-center justify-center font-bold text-xs border border-[#F6DDAE]">
              📋
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2C1810]">Wedding Manager</h3>
              <span className="text-[11px] text-[#9A6218] font-semibold uppercase tracking-wider">
                Operational Planning
              </span>
            </div>
          </div>

          <p className="text-xs text-[#5A453A] leading-relaxed">
            Ideal for family members, ceremony coordinators, decorators, and assistants. Managers collaborate on logistics, check in guests, track tasks, and upload photos without access to sensitive financial ledgers.
          </p>

          <ul className="text-xs text-[#5A453A] space-y-1.5 pt-2 border-t border-[#E8E2D8]">
            <li className="flex items-center gap-2">
              <span className="text-[#2F6B38] font-bold">✓</span> Coordinate ceremonies, timings, and venues
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2F6B38] font-bold">✓</span> Manage guest list and record RSVPs
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2F6B38] font-bold">✓</span> Assign and complete preparation tasks
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#C53030] font-bold">✕</span> Restricted from modifying workspace budget or members
            </li>
          </ul>
        </div>
      </div>

      {/* Granular Permission Matrix Table */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-[#FAF8F5] border-b border-[#E8E2D8]">
          <h3 className="text-sm font-bold text-[#2C1810]">Module Capabilities Matrix</h3>
          <p className="text-xs text-[#7C6659] mt-0.5">
            Granular breakdown of system actions available to each workspace role.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E8E2D8] text-[#5A453A] font-bold">
              <tr>
                <th className="py-3 px-5">Capability / Domain</th>
                <th className="py-3 px-5 w-32 text-center">Administrator</th>
                <th className="py-3 px-5 w-32 text-center">Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4DC]">
              {permissionsList.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="py-3 px-5">
                    <div className="font-bold text-[#2C1810]">{item.module}</div>
                    <div className="text-[11px] text-[#7C6659]">{item.description}</div>
                  </td>
                  <td className="py-3 px-5 text-center">
                    {item.admin ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#EAF5EB] text-[#2F6B38] font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="text-[#A13A28] font-bold">—</span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-center">
                    {item.manager ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#EAF5EB] text-[#2F6B38] font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FBEAE8] text-[#C53030]">
                        No Access
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
