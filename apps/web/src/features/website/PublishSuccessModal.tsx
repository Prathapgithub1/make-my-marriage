import { useState } from 'react';

interface PublishSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicUrl: string;
  coupleNames: string;
}

export function PublishSuccessModal({
  isOpen,
  onClose,
  publicUrl,
  coupleNames,
}: PublishSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullUrl = publicUrl.startsWith('http')
    ? publicUrl
    : typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      !window.location.hostname.endsWith('.local')
    ? `https://make-my-marriage.shop${publicUrl.startsWith('/') ? '' : '/'}${publicUrl}`
    : `${typeof window !== 'undefined' ? window.location.origin : 'https://make-my-marriage.shop'}${
        publicUrl.startsWith('/') ? '' : '/'
      }${publicUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = encodeURIComponent(
    `We are delighted to invite you to celebrate our wedding! Please visit our wedding website for ceremony schedules and RSVP: ${fullUrl}`,
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-stone-900 shadow-2xl space-y-6 relative text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Celebration icon badge */}
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            Website is Live & Published
          </span>
          <h3 className="text-2xl font-serif font-bold text-stone-900 mt-3">
            Your Wedding Website is Ready!
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Guests can now explore ceremonies, hotel recommendations, and submit their RSVPs.
          </p>
        </div>

        {/* Shareable Link Box */}
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-stone-700 truncate text-left select-all">{fullUrl}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 shrink-0 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Clean SVG QR code vector representation */}
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl inline-block mx-auto space-y-2">
          <div className="w-36 h-36 bg-white p-2 rounded-lg border border-stone-200 flex items-center justify-center shadow-inner">
            <svg className="w-full h-full text-stone-800" viewBox="0 0 100 100" fill="currentColor">
              {/* Corner 1 */}
              <rect x="5" y="5" width="28" height="28" rx="4" fill="currentColor" />
              <rect x="9" y="9" width="20" height="20" rx="2" fill="white" />
              <rect x="13" y="13" width="12" height="12" rx="1" fill="currentColor" />
              {/* Corner 2 */}
              <rect x="67" y="5" width="28" height="28" rx="4" fill="currentColor" />
              <rect x="71" y="9" width="20" height="20" rx="2" fill="white" />
              <rect x="75" y="13" width="12" height="12" rx="1" fill="currentColor" />
              {/* Corner 3 */}
              <rect x="5" y="67" width="28" height="28" rx="4" fill="currentColor" />
              <rect x="9" y="71" width="20" height="20" rx="2" fill="white" />
              <rect x="13" y="75" width="12" height="12" rx="1" fill="currentColor" />
              {/* Data matrix dots pattern */}
              <rect x="38" y="10" width="6" height="6" />
              <rect x="48" y="10" width="6" height="6" />
              <rect x="58" y="15" width="5" height="5" />
              <rect x="10" y="38" width="6" height="6" />
              <rect x="20" y="48" width="6" height="6" />
              <rect x="38" y="38" width="7" height="7" rx="1" fill="#883A32" />
              <rect x="48" y="48" width="7" height="7" rx="1" fill="#883A32" />
              <rect x="58" y="38" width="7" height="7" rx="1" fill="#883A32" />
              <rect x="38" y="58" width="7" height="7" rx="1" fill="#883A32" />
              <rect x="75" y="45" width="6" height="6" />
              <rect x="85" y="55" width="6" height="6" />
              <rect x="45" y="75" width="6" height="6" />
              <rect x="55" y="85" width="6" height="6" />
              <rect x="70" y="70" width="10" height="10" />
              <rect x="85" y="85" width="8" height="8" />
            </svg>
          </div>
          <span className="text-[11px] text-stone-500 font-medium block">
            Scan for instant mobile RSVP
          </span>
        </div>

        {/* Quick Share Buttons */}
        <div className="flex gap-2">
          <a
            href={`https://api.whatsapp.com/send?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Share on WhatsApp</span>
          </a>
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900 flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>View Live Site</span>
          </a>
        </div>
      </div>
    </div>
  );
}
