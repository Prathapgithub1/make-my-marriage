import { useState } from 'react';
import type { WebsiteDetails } from './websiteApi';

interface WebsiteDashboardViewProps {
  website: WebsiteDetails;
  onNavigateTab: (tab: 'dashboard' | 'editor' | 'templates') => void;
  onOpenSettings: () => void;
  onOpenPublishModal: () => void;
  onTogglePublish: (publish: boolean) => Promise<void>;
}

export function WebsiteDashboardView({
  website,
  onNavigateTab,
  onOpenSettings,
  onOpenPublishModal,
  onTogglePublish,
}: WebsiteDashboardViewProps) {
  const [copied, setCopied] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const { isPublished, slug, publicUrl, content } = website || {};
  const metrics = {
    totalGuests: website?.rsvpMetrics?.totalGuests ?? website?.stats?.totalGuests ?? 0,
    attending: website?.rsvpMetrics?.attending ?? website?.stats?.attendingCount ?? 0,
    declined: website?.rsvpMetrics?.declined ?? website?.stats?.declinedCount ?? 0,
    pending: website?.rsvpMetrics?.pending ?? website?.stats?.pendingCount ?? 0,
    rsvpRate: website?.rsvpMetrics?.rsvpRate ?? website?.stats?.responseRate ?? 0,
  };
  const sections = content?.sections || [];
  const fullPublicUrl =
    publicUrl && publicUrl.startsWith('http')
      ? publicUrl
      : typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        !window.location.hostname.endsWith('.local')
        ? `https://make-my-marriage.shop/w/${slug}`
        : `${typeof window !== 'undefined' ? window.location.origin : 'https://make-my-marriage.shop'}/w/${slug}`;

  const copyUrl = async () => {
    if (typeof navigator !== 'undefined' && fullPublicUrl) {
      try {
        await navigator.clipboard.writeText(fullPublicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch { }
    }
  };

  const enabledSectionsCount = sections.filter((s) => s.isEnabled).length;

  return (
    <div className="space-y-8">
      {/* 1. Top Status & Publishing Hero Banner */}
      <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isPublished
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-stone-100 text-stone-700 border border-stone-200'
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-600 animate-pulse' : 'bg-stone-400'
                  }`}
              />
              {isPublished ? 'Live & Published' : 'Draft Mode (Not Published)'}
            </span>

            <span className="text-xs text-stone-400 font-mono">
              /w/{slug}
            </span>
          </div>

          <h2 className="text-2xl font-serif font-bold text-stone-900">
            {content?.settings?.title ||
              (content?.templateId
                ? `${content.templateId.replace('-', ' ')} Wedding Website`
                : 'Wedding Website')}
          </h2>

          {/* Clean URL display and separate copy button */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-700 max-w-lg">
              <svg className="w-3.5 h-3.5 text-stone-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="truncate select-all">{fullPublicUrl}</span>
            </div>

            <button
              type="button"
              onClick={copyUrl}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${copied
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-stone-900 text-white hover:bg-stone-800'
                }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <a
              href={`/w/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Open in New Tab</span>
            </a>
          </div>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenSettings}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-colors"
          >
            Settings & Domain
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('editor')}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-stone-900 text-white hover:bg-stone-800 shadow-sm transition-colors"
          >
            Launch Visual Editor &rarr;
          </button>

          {isPublished ? (
            <button
              type="button"
              onClick={async () => {
                setIsTogglingPublish(true);
                try {
                  await onTogglePublish(false);
                } finally {
                  setIsTogglingPublish(false);
                }
              }}
              disabled={isTogglingPublish}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              {isTogglingPublish ? 'Unpublishing...' : 'Unpublish Site'}
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                setIsTogglingPublish(true);
                try {
                  await onTogglePublish(true);
                } finally {
                  setIsTogglingPublish(false);
                }
              }}
              disabled={isTogglingPublish}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-800 text-white hover:bg-amber-900 shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isTogglingPublish ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                'Publish Live'
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. RSVP & Visitor Engagement KPIs */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
          Guest RSVP & Response Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs">
            <div className="text-[11px] font-medium text-stone-500">Total Guest List</div>
            <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
              {metrics.totalGuests}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Invited guests</div>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs">
            <div className="text-[11px] font-medium text-emerald-700">Attending</div>
            <div className="text-2xl font-serif font-bold text-emerald-800 mt-1">
              {metrics.attending}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Confirmed attending</div>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs">
            <div className="text-[11px] font-medium text-rose-700">Declined</div>
            <div className="text-2xl font-serif font-bold text-rose-800 mt-1">
              {metrics.declined}
            </div>
            <div className="text-[10px] text-rose-600 mt-0.5">Cannot make it</div>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs">
            <div className="text-[11px] font-medium text-amber-700">Pending</div>
            <div className="text-2xl font-serif font-bold text-amber-800 mt-1">
              {metrics.pending}
            </div>
            <div className="text-[10px] text-amber-600 mt-0.5">Awaiting reply</div>
          </div>

          <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs">
            <div className="text-[11px] font-medium text-stone-500">Response Rate</div>
            <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
              {metrics.rsvpRate}%
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Responses recorded</div>
          </div>
        </div>
      </div>

      {/* 3. Quick Action Tiles */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
          Quick Actions & Design Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onNavigateTab('editor')}
            className="p-5 text-left bg-white border border-stone-200 rounded-2xl hover:border-amber-700/60 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-stone-900 group-hover:text-amber-900">
              Visual Website Editor
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              Customize text, ceremony venues, photos, timeline, and family notes.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('templates')}
            className="p-5 text-left bg-white border border-stone-200 rounded-2xl hover:border-amber-700/60 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-stone-900 group-hover:text-emerald-900">
              Templates Gallery
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              Choose from 4 architectural styles: Royal Heritage, Modern Minimal, and more.
            </p>
          </button>

          <button
            type="button"
            onClick={onOpenPublishModal}
            className="p-5 text-left bg-white border border-stone-200 rounded-2xl hover:border-amber-700/60 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-stone-900 group-hover:text-stone-900">
              Shareable QR Code & Links
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              Generate QR codes for invitations, WhatsApp broadcasts, and print collateral.
            </p>
          </button>
        </div>
      </div>

      {/* 4. Active Sections Status */}
      <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Page Content Breakdown</h3>
            <p className="text-xs text-stone-500">
              {enabledSectionsCount} of {sections.length} sections are currently enabled on your site.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('editor')}
            className="text-xs font-semibold text-amber-800 hover:text-amber-900"
          >
            Manage Sections &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {sections.map((sec) => (
            <div
              key={sec.id}
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${sec.isEnabled
                ? 'border-emerald-200 bg-emerald-50/30 text-stone-800'
                : 'border-stone-200 bg-stone-50 text-stone-400'
                }`}
            >
              <span className="font-medium truncate">{sec.title}</span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${sec.isEnabled ? 'bg-emerald-600' : 'bg-stone-300'
                  }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
