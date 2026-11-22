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

// Curated royal heritage celebration backdrops
const PALACE_PRESETS = [
  {
    name: 'Bangalore Palace',
    city: 'Bengaluru, Karnataka',
    url: 'https://images.unsplash.com/photo-1544833058-e70f6ca2a63f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'The Oberoi Udaivilas',
    city: 'Udaipur, Rajasthan',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Rambagh Palace Heritage',
    city: 'Jaipur, Rajasthan',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Taj Falaknuma Grandeur',
    city: 'Hyderabad, Telangana',
    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
  },
];

export function GeneralProfileSection({
  formState,
  onChangeField,
  isAdmin,
  coverImageUrl,
}: GeneralProfileSectionProps) {
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active cover preview: either uploaded S3 URL, preset URL, or luxury default
  const activeCoverSrc =
    coverImageUrl ||
    (formState.coverImageKey?.startsWith('http') ? formState.coverImageKey : null) ||
    PALACE_PRESETS[0].url;

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
      setShowCoverModal(false);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload cover banner to cloud storage.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectPreset = (url: string) => {
    onChangeField('coverImageKey', url);
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
            Master celebration identity, wedding ceremony schedule, and default cover aesthetics.
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
        <div className="relative w-full h-56 sm:h-72 rounded-xl overflow-hidden border border-[#D9D0C3] shadow-inner group">
          <img
            src={activeCoverSrc}
            alt="Wedding Celebration Cover"
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />

          {/* Dark luxury gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 pointer-events-none" />

          {/* Bottom Left Monogram Overlay */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 text-white space-y-1">
            <h4 className="text-lg sm:text-2xl font-serif font-bold drop-shadow-md">
              {formState.brideName && formState.groomName
                ? `${formState.brideName} & ${formState.groomName} Nuptials`
                : formState.title || 'Wedding Nuptials'}
            </h4>
            <p className="text-xs text-white/80 drop-shadow">
              Recommended 1200×400px • Max 15MB (JPG, WebP)
            </p>
          </div>

          {/* Bottom Right Change Cover Button */}
          {isAdmin && (
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
              <button
                type="button"
                onClick={() => setShowCoverModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/90 hover:bg-white text-[#2C1810] text-xs font-semibold shadow-lg backdrop-blur-sm transition-all active:scale-95"
              >
                <svg
                  className="w-4 h-4 text-[#7B341E]"
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

      {/* Card 2: Wedding Identity & Couple Details */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#2C1810]">Wedding Identity & Couple Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5A453A] mb-1">
              Wedding Workspace Name <span className="text-[#C53030]">*</span>
            </label>
            <input
              type="text"
              value={formState.title}
              disabled={!isAdmin}
              onChange={(e) => onChangeField('title', e.target.value)}
              placeholder="e.g. Prathap & Akshitha's Wedding"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A453A] mb-1">
              Partner 1 (Bride / Groom) <span className="text-[#C53030]">*</span>
            </label>
            <input
              type="text"
              value={formState.brideName}
              disabled={!isAdmin}
              onChange={(e) => onChangeField('brideName', e.target.value)}
              placeholder="e.g. Akshitha Rao"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A453A] mb-1">
              Partner 2 (Groom / Bride) <span className="text-[#C53030]">*</span>
            </label>
            <input
              type="text"
              value={formState.groomName}
              disabled={!isAdmin}
              onChange={(e) => onChangeField('groomName', e.target.value)}
              placeholder="e.g. Prathap"
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
              Celebration Timezone
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
              Controls calendar notifications, reminder dispatches, and public invitation times.
            </p>
          </div>
        </div>
      </div>

      {/* Card 4: Primary Celebration Venue & Location */}
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
              placeholder="e.g. Bangalore Palace Grounds, Sankey Road"
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
              placeholder="e.g. Bengaluru"
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
              placeholder="e.g. Karnataka"
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
              placeholder="e.g. India"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
            />
          </div>
        </div>
      </div>

      {/* Card 5: Story & Celebration Description */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#2C1810]">Celebration Story & Welcome Message</h3>

        <div>
          <label className="block text-xs font-semibold text-[#5A453A] mb-1">
            Story / Welcome Notes
          </label>
          <textarea
            rows={4}
            value={formState.description}
            disabled={!isAdmin}
            onChange={(e) => onChangeField('description', e.target.value)}
            placeholder="Share a heartfelt message with guests, family, and team members..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
          />
        </div>
      </div>

      {/* Change Cover Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-[#E8E2D8] animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4DC]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#2C1810]">
                  Select Master Celebration Cover
                </h3>
                <p className="text-xs text-[#7C6659]">
                  Upload a photo from your computer or choose from royal destination presets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCoverModal(false)}
                className="p-1 rounded-lg text-[#8C7A70] hover:text-[#2C1810] hover:bg-[#F4EFEA]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Upload from device */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#5A453A] uppercase tracking-wider">
                Option 1: Upload from Device
              </h4>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D5CCC0] hover:border-[#7B341E] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#FAF8F5] hover:bg-[#F5F0E8]"
              >
                <svg
                  className="w-8 h-8 text-[#9A6218] mx-auto mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-xs font-semibold text-[#2C1810]">
                  {isUploading ? 'Uploading to cloud storage...' : 'Click to browse wedding cover photo'}
                </p>
                <p className="text-[11px] text-[#8C7A70] mt-0.5">
                  JPG, PNG, WebP up to 15MB
                </p>
              </div>

              {uploadError && (
                <p className="text-xs text-[#C53030] font-medium">{uploadError}</p>
              )}
            </div>

            {/* Presets Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#5A453A] uppercase tracking-wider">
                Option 2: Curated Heritage Palaces
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {PALACE_PRESETS.map((preset) => (
                  <div
                    key={preset.name}
                    onClick={() => handleSelectPreset(preset.url)}
                    className="relative group rounded-lg overflow-hidden border border-[#D5CCC0] cursor-pointer hover:border-[#7B341E] transition-all"
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2 flex flex-col justify-end text-white">
                      <div className="text-xs font-bold truncate">{preset.name}</div>
                      <div className="text-[10px] text-white/80 truncate">{preset.city}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#EAE4DC]">
              <button
                type="button"
                onClick={() => setShowCoverModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-[#5A453A] hover:bg-[#F3EFE9]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
