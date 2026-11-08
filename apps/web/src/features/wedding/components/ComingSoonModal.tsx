export interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  category?: string;
}

export function ComingSoonModal({
  isOpen,
  onClose,
  title,
  description,
  category = 'Wedding Suite Feature',
}: ComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1c18]/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-[#d8c2bb]/60 shadow-xl p-6 sm:p-8 text-center overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8a4b35] via-[#d8b68c] to-[#641d36]" />

        {/* Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8a4b35]/10 text-[#8a4b35] text-xs font-semibold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8a4b35] animate-ping" />
          {category}
        </div>

        {/* Title */}
        <h3
          id="coming-soon-title"
          className="font-serif text-2xl font-semibold text-[#1a1c18] mb-2 tracking-tight"
        >
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-[#53433e] leading-relaxed mb-6">{description}</p>

        {/* Roadmap Indicator */}
        <div className="p-3.5 rounded-xl bg-[#fafaf3] border border-[#d8c2bb]/40 text-xs text-[#53433e] mb-6 flex items-center justify-center gap-2">
          <span>✨</span>
          <span>In active development for upcoming release milestone.</span>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-[#8a4b35] hover:bg-[#a8624b] text-white text-sm font-semibold shadow-xs transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
