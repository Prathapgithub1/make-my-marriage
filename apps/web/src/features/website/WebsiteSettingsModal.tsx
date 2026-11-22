import { useState, type FormEvent } from 'react';
import type { WebsiteSettingsMeta } from './websiteApi';

function formatPublicWeddingUrl(slug: string): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local');
    if (!isLocalhost) {
      return `https://make-my-marriage.shop/w/${slug}`;
    }
    return `${window.location.origin}/w/${slug}`;
  }
  return `https://make-my-marriage.shop/w/${slug}`;
}

interface WebsiteSettingsModalProps {
  slug: string;
  settings?: WebsiteSettingsMeta;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: { slug: string; settings: WebsiteSettingsMeta }) => Promise<void>;
}

export function WebsiteSettingsModal({
  slug: initialSlug,
  settings: initialSettings,
  isOpen,
  onClose,
  onSave,
}: WebsiteSettingsModalProps) {
  const [slug, setSlug] = useState(initialSlug);
  const [settings, setSettings] = useState<WebsiteSettingsMeta>({
    title: initialSettings?.title ?? '',
    tagline: initialSettings?.tagline ?? '',
    coupleNamesOverride: initialSettings?.coupleNamesOverride ?? '',
    weddingDateOverride: initialSettings?.weddingDateOverride ?? '',
    locationOverride: initialSettings?.locationOverride ?? '',
    seoTitle: initialSettings?.seoTitle ?? '',
    seoDescription: initialSettings?.seoDescription ?? '',
    socialImageUrl: initialSettings?.socialImageUrl ?? '',
    visibility: initialSettings?.visibility ?? 'PUBLIC',
    password: initialSettings?.password ?? '',
    allowOpenRsvp: initialSettings?.allowOpenRsvp ?? true,
    showCountdown: initialSettings?.showCountdown ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Validate slug
    const cleanSlug = slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      setError('Slug may only contain lowercase letters, numbers, and hyphens (no spaces or special symbols).');
      setIsSaving(false);
      return;
    }

    try {
      await onSave({
        slug: cleanSlug,
        settings,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 text-stone-900 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-900">Website & Domain Settings</h3>
            <p className="text-xs text-stone-500">Configure URL, privacy, and metadata for your celebration site.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* URL Slug */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Custom Website URL
            </label>
            <div className="flex items-center rounded-lg border border-stone-200 bg-stone-50 overflow-hidden focus-within:ring-2 focus-within:ring-amber-600 focus-within:bg-white">
              <span className="px-3 py-2 text-xs text-stone-500 font-mono bg-stone-100 border-r border-stone-200">
                /w/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="prathap-and-akshitha"
                className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none font-mono text-stone-800"
              />
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Shareable link:{' '}
              <span className="font-mono text-amber-900 select-all">
                {formatPublicWeddingUrl(slug || '...')}
              </span>
            </p>
          </div>

          {/* Privacy & Access Control */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
              Privacy & Access
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'PUBLIC', label: 'Public', desc: 'Anyone with the link can view' },
                { id: 'PASSWORD_PROTECTED', label: 'Password', desc: 'Guests enter a PIN/passcode' },
                { id: 'UNLISTED', label: 'Unlisted', desc: 'Hidden from search engines' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, visibility: opt.id as any })}
                  className={`p-3 text-left rounded-xl border text-xs transition-all ${settings.visibility === opt.id
                      ? 'border-amber-800 bg-amber-50/60 ring-2 ring-amber-700/20'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                >
                  <div className="font-semibold text-stone-900">{opt.label}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            {settings.visibility === 'PASSWORD_PROTECTED' && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Guest Access Passcode
                </label>
                <input
                  type="text"
                  value={settings.password || ''}
                  onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                  placeholder="e.g. WEDDING2025"
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            )}
          </div>

          {/* Overrides */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Display Overrides (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Couple Names Override</label>
                <input
                  type="text"
                  value={settings.coupleNamesOverride || ''}
                  onChange={(e) => setSettings({ ...settings, coupleNamesOverride: e.target.value })}
                  placeholder="e.g. Prathap & Akshitha"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Date Override</label>
                <input
                  type="text"
                  value={settings.weddingDateOverride || ''}
                  onChange={(e) => setSettings({ ...settings, weddingDateOverride: e.target.value })}
                  placeholder="e.g. November 24, 2025"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Location Override</label>
              <input
                type="text"
                value={settings.locationOverride || ''}
                onChange={(e) => setSettings({ ...settings, locationOverride: e.target.value })}
                placeholder="e.g. Bangalore Palace, Bengaluru"
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          {/* Social & SEO */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Search & Social Preview (SEO)
            </h4>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">SEO Title</label>
              <input
                type="text"
                value={settings.seoTitle || ''}
                onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
                placeholder="Prathap & Akshitha's Wedding Celebration"
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">SEO / WhatsApp Description</label>
              <textarea
                rows={2}
                value={settings.seoDescription || ''}
                onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
                placeholder="We are getting married! Find ceremony schedule, hotel info, and RSVP online."
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Social Thumbnail Image URL</label>
              <input
                type="url"
                value={settings.socialImageUrl || ''}
                onChange={(e) => setSettings({ ...settings, socialImageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-40"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
