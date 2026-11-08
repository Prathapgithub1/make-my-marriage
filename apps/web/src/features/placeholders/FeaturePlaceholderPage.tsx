import type { ReactNode } from 'react';
import { Link } from 'react-router';

export interface FeaturePlaceholderPageProps {
  feature: string;
  category?: string;
  description: string;
  roadmapNotice?: string;
  badge?: string;
  icon?: ReactNode;
  highlights?: Array<{
    title: string;
    description: string;
  }>;
}

export function FeaturePlaceholderPage({
  feature,
  category = 'CONCIERGE MODULE ROADMAP',
  description,
  roadmapNotice = 'Our engineering team is actively building this module according to the approved product requirements.',
  badge = 'Coming in Upcoming Sprint',
  highlights,
}: FeaturePlaceholderPageProps) {
  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 min-w-0">
      {/* Hero Header */}
      <div className="bg-[#FAF9F5] rounded-3xl border border-[#EAE6E1] p-6 sm:p-10 mb-8 shadow-2xs relative overflow-hidden">
        {/* Decorative background outline */}
        <div
          className="absolute -right-8 -top-8 w-48 h-48 border border-[#E8DFD8] rotate-12 pointer-events-none opacity-20 rounded-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5EBE6] text-[#8A4B35] text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A4B35]" />
            <span>{category}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1C18] tracking-tight leading-tight mb-3">
            {feature}
          </h1>

          <p className="text-base sm:text-lg text-[#53433E] leading-relaxed mb-6">{description}</p>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FEF3E2] text-[#9A6218] border border-[#F6DDAE] text-xs font-bold">
              <span>🚀</span>
              <span>{badge}</span>
            </span>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8A4B35] hover:bg-[#723C2A] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Return to Dashboard</span>
            </Link>

            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#D8C2BB] text-[#1A1C18] hover:text-[#8A4B35] hover:border-[#8A4B35] text-xs sm:text-sm font-semibold shadow-2xs transition-all"
            >
              <span>Explore Wedding Events</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Capabilities Preview */}
      <div className="bg-white rounded-2xl border border-[#EAE6E1] p-6 sm:p-8 shadow-2xs">
        <div className="border-b border-[#F4F2EE] pb-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#1A1C18]">
              Planned Capabilities &amp; System Integration
            </h2>
            <p className="text-xs sm:text-sm text-[#86736D] mt-1">{roadmapNotice}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(highlights && highlights.length > 0
            ? highlights
            : [
                {
                  title: 'Real-time Coordination',
                  description:
                    'Automated synchronization across organizers, hosts, and family members.',
                },
                {
                  title: 'Wedding Tenant Isolation',
                  description:
                    'Strict data privacy and encryption ensuring your memories and guests remain private.',
                },
                {
                  title: 'Multi-device Responsiveness',
                  description:
                    'Effortless mobile access and desktop precision designed for the big day.',
                },
              ]
          ).map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#FAF9F5] border border-[#EAE6E1]/70 flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#F5EBE6] text-[#8A4B35] flex items-center justify-center font-bold text-xs mb-3">
                  0{idx + 1}
                </div>
                <h3 className="text-sm font-bold text-[#1A1C18] mb-1">{item.title}</h3>
                <p className="text-xs text-[#605A54] leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
