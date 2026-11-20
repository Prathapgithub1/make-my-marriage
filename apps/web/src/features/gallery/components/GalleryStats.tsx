import type { GallerySummary } from '../galleryApi';

interface GalleryStatsProps {
  summary: GallerySummary | undefined;
  isLoading: boolean;
}

export function GalleryStats({ summary, isLoading }: GalleryStatsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-[#f5f2eb] rounded-2xl border border-[#e8dfd5]/60" />
        ))}
      </div>
    );
  }

  // Assume standard tier 5GB storage cap for progress bar visualization
  const maxStorageBytes = 5 * 1024 * 1024 * 1024; // 5 GB
  const storagePercent = Math.min(
    100,
    Math.max(1, Math.round((summary.storageBytesUsed / maxStorageBytes) * 100)),
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Photos */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8dfd5] shadow-xs hover:border-[#8a4b35]/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#86736d]">
            Total Photos
          </span>
          <div className="w-8 h-8 rounded-full bg-[#fbf6f0] text-[#8a4b35] flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <div className="font-serif text-3xl font-semibold text-[#1a1c18]">
          {summary.totalPhotos.toLocaleString()}
        </div>
        <p className="text-[11px] text-[#86736d] mt-1">High-resolution memories</p>
      </div>

      {/* 2. Total Videos */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8dfd5] shadow-xs hover:border-[#8a4b35]/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#86736d]">
            Total Videos
          </span>
          <div className="w-8 h-8 rounded-full bg-[#f4f7f2] text-[#556251] flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <div className="font-serif text-3xl font-semibold text-[#1a1c18]">
          {summary.totalVideos.toLocaleString()}
        </div>
        <p className="text-[11px] text-[#86736d] mt-1">Ceremony &amp; dance reels</p>
      </div>

      {/* 3. Total Albums */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8dfd5] shadow-xs hover:border-[#8a4b35]/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#86736d]">
            Event Albums
          </span>
          <div className="w-8 h-8 rounded-full bg-[#fbf6f0] text-[#8a4b35] flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
        </div>
        <div className="font-serif text-3xl font-semibold text-[#1a1c18]">
          {summary.totalAlbums.toLocaleString()}
        </div>
        <p className="text-[11px] text-[#86736d] mt-1">Organized celebrations</p>
      </div>

      {/* 4. Storage Usage */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8dfd5] shadow-xs hover:border-[#8a4b35]/30 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#86736d]">
            Storage Used
          </span>
          <span className="text-[11px] font-medium text-[#8a4b35] bg-[#8a4b35]/10 px-2 py-0.5 rounded-full">
            {storagePercent}%
          </span>
        </div>
        <div className="font-serif text-2xl font-semibold text-[#1a1c18]">
          {summary.storageFormatted}
        </div>
        <div className="w-full bg-[#f0eae3] h-1.5 rounded-full mt-2.5 overflow-hidden">
          <div
            className="bg-[#8a4b35] h-full rounded-full transition-all duration-500"
            style={{ width: `${storagePercent}%` }}
          />
        </div>
        <p className="text-[10px] text-[#86736d] mt-1.5">Direct AWS S3 encrypted vault</p>
      </div>
    </div>
  );
}
