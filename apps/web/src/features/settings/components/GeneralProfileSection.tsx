import { useState, useRef, type ChangeEvent } from 'react';
import type { WorkspaceSettingsFormState } from '../types';
import { getCoverUploadUrl, uploadCoverToS3 } from '../../wedding/weddingApi';

interface GeneralProfileSectionProps {
  formState: WorkspaceSettingsFormState;
  onChangeField: <K extends keyof WorkspaceSettingsFormState>(
    field: K,
    value: WorkspaceSettingsFormState[K],
  ) => void;
  isAdmin: boolean;
  coverImageUrl?: string | null;
}

export function GeneralProfileSection({
  formState,
  onChangeField,
  isAdmin,
  coverImageUrl,
}: GeneralProfileSectionProps) {
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imgLoadError, setImgLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active cover preview: uploaded S3 pre-signed URL or directly stored URL
  const activeCoverSrc =
    !imgLoadError &&
    (coverImageUrl ||
      (formState.coverImageKey?.startsWith('http') ? formState.coverImageKey : null));

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Please select a valid JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Cover image size must not exceed 15MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const { uploadUrl, s3ObjectKey, uploadHeaders } = await getCoverUploadUrl(
        file.name,
        file.type,
        file.size,
      );

      await uploadCoverToS3(uploadUrl, file, uploadHeaders);
      onChangeField('coverImageKey', s3ObjectKey);
      setImgLoadError(false);
      setShowCoverModal(false);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload cover banner to cloud storage.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveCover = () => {
    onChangeField('coverImageKey', '');
    setImgLoadError(false);
    setShowCoverModal(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-[#EAE4DC]">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-[#9A6218] uppercase">
            Section 01
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2C1810]">
            General Information
          </h2>
          <p className="text-xs sm:text-sm text-[#7C6659] mt-0.5">
            Workspace identity, celebration schedule, and visual aesthetics.
          </p>
        </div>

        <div className="self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF5EB] text-[#2F6B38] border border-[#CDE5D1]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B38]" />
            Live & Synchronized
          </span>
        </div>
      </div>

      {/* Card 1: Master Celebration Cover & Monogram Banner */}
      <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#2C1810]">
            Master Celebration Cover & Monogram Banner
          </h3>
          <span className="text-[11px] text-[#8C7A70]">Visual Banner</span>
        </div>

        {/* Banner Frame */}
        <div className="relative w-full h-52 sm:h-64 rounded-xl overflow-hidden border border-[#D9D0C3] shadow-inner group">
          {activeCoverSrc ? (
            <img
              src={activeCoverSrc}
              alt="Celebration Cover"
              onError={() => setImgLoadError(true)}
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            /* Clean luxury terracotta gradient placeholder when no image is uploaded */
            <div className="w-full h-full bg-gradient-to-br from-[#4A2013] via-[#632918] to-[#8A3F2A] flex flex-col items-center justify-center text-white/90 p-6 relative">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2 text-white/80">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-xs font-semibold tracking-wide">
                No custom cover banner uploaded
              </p>
              <p className="text-[11px] text-white/60 mt-0.5">
                Upload a 1200×400px banner for your workspace and wedding portal
              </p>
            </div>
          )}

          {/* Dark luxury gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

          {/* Bottom Left Monogram Overlay */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 text-white space-y-0.5">
            <h4 className="text-base sm:text-xl font-serif font-bold drop-shadow-md">
              {formState.title || 'Wedding Workspace'}
            </h4>
            <p className="text-[11px] text-white/80 drop-shadow">
              Recommended 1200×400px • Max 15MB (JPG, WebP)
            </p>
          </div>

          {/* Bottom Right Change Cover Button */}
          {isAdmin && (
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
              <button
                type="button"
                onClick={() => setShowCoverModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-[#2C1810] text-xs font-semibold shadow-md backdrop-blur-sm transition-all active:scale-95"
              >
                <svg
                  className="w-3.5 h-3.5 text-[#7B341E]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Change Cover</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Workspace Identity & Couple Details */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#2C1810]">Workspace Identity & Couple Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5A453A] mb-1">
              Workspace Name <span className="text-[#C53030]">*</span>
            </label>
            <input
              type="text"
              value={formState.title}
              disabled={!isAdmin}
              onChange={(e) => onChangeField('title', e.target.value)}
              placeholder="Workspace name"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A453A] mb-1">
              Partner 1 <span className="text-[#C53030]">*</span>
            </label>
            <input
              type="text"
              value={formState.brideName}
              disabled={!isAdmin}
              onChange={(e) => onChangeField('brideName', e.target.value)}
              placeholder="Partner 1 name"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A453A] mb-1">
              Partner 2 <span className="text-[#C53030]">*</span>
            </label>
            <input
              type="text"
              value={formState.groomName}
              disabled={!isAdmin}
              onChange={(e) => onChangeField('groomName', e.target.value)}
              placeholder="Partner 2 name"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
            />
          </div>
        </div>
      </div>

      {/* Card 3: Ceremony Schedule & Timezone */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#2C1810]">Ceremony Date & Localization</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5A453A] mb-1">
              Main Ceremony Date
            </label>
            <input
              type="date"
              value={formState.weddingDate}
              disabled={!isAdmin}
              onChange={(e) => onChangeField('weddingDate', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
            />
            <p className="text-[11px] text-[#8C7A70] mt-1">
              Used for dashboard countdowns, guest invitations, and website schedule.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A453A] mb-1">
              Workspace Timezone
            </label>
            <select
              value={formState.timezone}
              disabled={!isAdmin}
              onChange={(e) => onChangeField('timezone', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST — Indian Standard Time, UTC+05:30)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST — Gulf Standard Time, UTC+04:00)</option>
              <option value="Europe/London">Europe/London (GMT/BST, UTC+00:00)</option>
              <option value="America/New_York">America/New_York (EST/EDT, UTC-05:00)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT, UTC-08:00)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+08:00)</option>
            </select>
            <p className="text-[11px] text-[#8C7A70] mt-1">
              Controls notification triggers and reminder dispatches.
            </p>
          </div>
        </div>
      </div>

      {/* Card 4: Primary Celebration Venue & Destination */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#2C1810]">Celebration Venue & Destination</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#5A453A] mb-1">
              Primary Venue Name / Address
            </label>
            <input
              type="text"
              value={formState.location}
              disabled={!isAdmin}
              onChange={(e) => onChangeField('location', e.target.value)}
              placeholder="Primary venue or address (optional)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A453A] mb-1">City</label>
            <input
              type="text"
              value={formState.city}
              disabled={!isAdmin}
              onChange={(e) => onChangeField('city', e.target.value)}
              placeholder="City (optional)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A453A] mb-1">State / Province</label>
            <input
              type="text"
              value={formState.state}
              disabled={!isAdmin}
              onChange={(e) => onChangeField('state', e.target.value)}
              placeholder="State / Province (optional)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A453A] mb-1">Country</label>
            <input
              type="text"
              value={formState.country}
              disabled={!isAdmin}
              onChange={(e) => onChangeField('country', e.target.value)}
              placeholder="Country"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
            />
          </div>
        </div>
      </div>

      {/* Card 5: Story & Welcome Notes */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#2C1810]">Workspace Description & Story</h3>

        <div>
          <label className="block text-xs font-semibold text-[#5A453A] mb-1">
            Story / Welcome Notes
          </label>
          <textarea
            rows={4}
            value={formState.description}
            disabled={!isAdmin}
            onChange={(e) => onChangeField('description', e.target.value)}
            placeholder="Workspace description or notes..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
          />
        </div>
      </div>

      {/* Change Cover Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4DC]">
              <h3 className="text-base font-serif font-bold text-[#2C1810]">
                Workspace Cover Banner
              </h3>
              <button
                type="button"
                onClick={() => setShowCoverModal(false)}
                className="text-[#8C7A70] hover:text-[#2C1810] p-1 rounded-lg hover:bg-[#FAF8F5]"
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <div className="p-3 text-xs bg-[#FDF2F2] border border-[#F8D7DA] text-[#C53030] rounded-lg">
                {uploadError}
              </div>
            )}

            {/* Upload Area */}
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D5CCC0] hover:border-[#7B341E] bg-[#FAF8F5] hover:bg-[#F7F2EB] p-8 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-[#EAE4DC] group-hover:bg-[#7B341E]/10 flex items-center justify-center text-[#7B341E] transition-colors">
                  {isUploading ? (
                    <svg className="animate-spin h-6 w-6 text-[#7B341E]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2C1810]">
                    {isUploading ? 'Uploading to cloud storage...' : 'Click to select and upload custom banner'}
                  </div>
                  <div className="text-[11px] text-[#7C6659] mt-0.5">
                    Supports JPG, PNG, WebP up to 15MB
                  </div>
                </div>
              </div>

              {formState.coverImageKey && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="text-xs font-semibold text-[#C53030] hover:text-[#9B2C2C] hover:underline"
                  >
                    Remove Current Banner
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#EAE4DC]">
              <button
                type="button"
                onClick={() => setShowCoverModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#D5CCC0] text-[#5A453A] hover:bg-[#FAF8F5]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
