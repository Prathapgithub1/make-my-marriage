import { useState } from 'react';
import { Link } from 'react-router';
import type { PrivacyPreferences } from '../types';

interface PrivacyAccessSectionProps {
  slug?: string | null;
  galleryToken?: string | null;
  isAdmin: boolean;
  preferences: PrivacyPreferences;
  onTogglePreference: (key: keyof PrivacyPreferences) => void;
}

export function PrivacyAccessSection({
  slug,
  galleryToken,
  isAdmin,
  preferences,
  onTogglePreference,
}: PrivacyAccessSectionProps) {
  const [copiedToken, setCopiedToken] = useState(false);

  const websiteUrl = slug ? `${window.location.origin}/w/${slug}` : null;
  const galleryUrl = galleryToken
    ? `${window.location.origin}/gallery?token=${galleryToken}`
    : `${window.location.origin}/gallery`;

  const handleCopyGalleryUrl = () => {
    void navigator.clipboard.writeText(galleryUrl);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-5 border-b border-[#EAE4DC]">
        <div className="text-[11px] font-bold tracking-wider text-[#9A6218] uppercase">
          Section 04
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2C1810]">
          Privacy & Access Controls
        </h2>
        <p className="text-xs sm:text-sm text-[#7C6659] mt-0.5">
          Configure public discovery, guest access codes, and ceremony privacy.
        </p>
      </div>

      {/* Control 1: Wedding Website Privacy */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#2C1810]">Public Wedding Website</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  preferences.isWebsitePublished
                    ? 'bg-[#EAF5EB] text-[#2F6B38] border border-[#CDE5D1]'
                    : 'bg-[#F4F0EA] text-[#7C6659] border border-[#E3DBD0]'
                }`}
              >
                {preferences.isWebsitePublished ? 'Live & Published' : 'Draft / Private'}
              </span>
            </div>
            <p className="text-xs text-[#7C6659]">
              When published, anyone with your custom celebration URL can view ceremony details, dress codes, and submit RSVPs.
            </p>
          </div>

          <button
            type="button"
            disabled={!isAdmin}
            onClick={() => onTogglePreference('isWebsitePublished')}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              preferences.isWebsitePublished ? 'bg-[#2F6B38]' : 'bg-[#D5CCC0]'
            } disabled:opacity-50`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                preferences.isWebsitePublished ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {slug && (
          <div className="pt-3 border-t border-[#EAE4DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-[#5A453A]">
              Public Website URL:{' '}
              <span className="font-mono font-semibold text-[#7B341E] select-all">
                {websiteUrl}
              </span>
            </span>
            <div className="flex gap-2">
              <Link
                to={`/w/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#7B341E] hover:underline font-semibold"
              >
                Preview Site ↗
              </Link>
              <span className="text-[#D3C7B6]">•</span>
              <Link to="/website" className="text-[#9A6218] hover:underline font-semibold">
                Open Website Builder
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Control 2: Guest Cloud Gallery Uploads & Access */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#2C1810]">
                Guest Photo & Video Uploads
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FEF3E2] text-[#9A6218] border border-[#F6DDAE]">
                Cloud S3 Vault
              </span>
            </div>
            <p className="text-xs text-[#7C6659]">
              Allow guests attending your celebration to upload their photos directly from their smartphones via QR code or direct link.
            </p>
          </div>

          <button
            type="button"
            disabled={!isAdmin}
            onClick={() => onTogglePreference('allowGuestUploads')}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              preferences.allowGuestUploads ? 'bg-[#2F6B38]' : 'bg-[#D5CCC0]'
            } disabled:opacity-50`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                preferences.allowGuestUploads ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="pt-3 border-t border-[#EAE4DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-[#5A453A]">
            Guest Gallery Link:{' '}
            <span className="font-mono text-[#2C1810] select-all truncate max-w-xs inline-block align-bottom">
              {galleryUrl}
            </span>
          </span>
          <button
            type="button"
            onClick={handleCopyGalleryUrl}
            className="px-3 py-1 rounded bg-[#FAF8F5] border border-[#D5CCC0] text-xs font-semibold text-[#5A453A] hover:bg-[#F3EFE9]"
          >
            {copiedToken ? '✓ Copied' : 'Copy Gallery Link'}
          </button>
        </div>
      </div>

      {/* Control 3: RSVP Public Attendee Count Privacy */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#2C1810]">
              Display Attendee Counts on Public Portals
            </h3>
            <p className="text-xs text-[#7C6659]">
              When enabled, invited guests can see total confirmed attendee numbers on ceremony cards. Keep disabled for a confidential guest experience.
            </p>
          </div>

          <button
            type="button"
            disabled={!isAdmin}
            onClick={() => onTogglePreference('showPublicAttendeeCount')}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              preferences.showPublicAttendeeCount ? 'bg-[#2F6B38]' : 'bg-[#D5CCC0]'
            } disabled:opacity-50`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                preferences.showPublicAttendeeCount ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
