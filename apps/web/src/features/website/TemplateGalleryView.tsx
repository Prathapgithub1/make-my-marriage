import { useState } from 'react';
import type { WebsiteDetails } from './websiteApi';

interface TemplateGalleryViewProps {
  currentTemplateId: string;
  onApplyTemplate: (templateId: string) => Promise<void>;
  onLaunchEditor: () => void;
}

interface TemplateCardData {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  previewImage: string;
  colors: string[];
  fontName: string;
}

const TEMPLATES: TemplateCardData[] = [
  {
    id: 'royal-heritage',
    name: 'Royal Heritage',
    category: 'TRADITIONAL & PALACE',
    tagline: 'Regal, editorial, and richly textured',
    description:
      'Inspired by grand Indian royal celebrations. Features deep crimson, gold accents, refined Playfair typography, and ceremonial timelines.',
    previewImage:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    colors: ['#883A32', '#4C654D', '#C29B38', '#FAF7F2'],
    fontName: 'Playfair Display + Plus Jakarta',
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    category: 'CONTEMPORARY & URBAN',
    tagline: 'Clean lines, bold negative space, and Swiss clarity',
    description:
      'Sleek typography-driven layout tailored for contemporary destination weddings, chic rooftop ceremonies, and intimate guest lists.',
    previewImage:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    colors: ['#1C1917', '#78716C', '#2563EB', '#FAFAF9'],
    fontName: 'Inter Pure Sans',
  },
  {
    id: 'floral-romance',
    name: 'Floral Romance',
    category: 'GARDEN & BOTANICAL',
    tagline: 'Romantic dusky rose with poetic typography',
    description:
      'Soft pastels, delicate botanical borders, and timeless serif typography suited for daytime garden soirees and whimsical vineyard vows.',
    previewImage:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
    colors: ['#B76E79', '#7D8471', '#D4A373', '#FFF9F9'],
    fontName: 'Cormorant Garamond + Plus Jakarta',
  },
  {
    id: 'bohemian-sunset',
    name: 'Bohemian Sunset',
    category: 'DESTINATION & COASTAL',
    tagline: 'Earthy terracotta, warm sand, and sunset gold',
    description:
      'Earthy warmth and celebratory free spirit designed for beach destinations, sunset pheras, and bohemian beachside gatherings.',
    previewImage:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    colors: ['#C86446', '#D4A373', '#E07A5F', '#FDF8F5'],
    fontName: 'Cinzel Serif + Lato',
  },
];

export function TemplateGalleryView({
  currentTemplateId,
  onApplyTemplate,
  onLaunchEditor,
}: TemplateGalleryViewProps) {
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateCardData | null>(null);

  const handleApply = async (templateId: string) => {
    setApplyingId(templateId);
    try {
      await onApplyTemplate(templateId);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-amber-50/60 border border-amber-200/60 rounded-2xl">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
            Curated Themes
          </span>
          <h2 className="text-xl font-serif font-bold text-stone-900">
            Choose Your Wedding Website Template
          </h2>
          <p className="text-xs text-stone-600 max-w-xl">
            Switching templates instantly adapts your typography, color harmony, and section styling while preserving all your entered photos, ceremony schedules, and custom text.
          </p>
        </div>
        <button
          type="button"
          onClick={onLaunchEditor}
          className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-amber-800 text-white hover:bg-amber-900 shrink-0 shadow-sm transition-colors"
        >
          Open Design Editor &rarr;
        </button>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TEMPLATES.map((tmpl) => {
          const isCurrent = currentTemplateId === tmpl.id;
          const isApplying = applyingId === tmpl.id;

          return (
            <div
              key={tmpl.id}
              className={`rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                isCurrent
                  ? 'border-amber-800 ring-2 ring-amber-700/20 bg-amber-50/20 shadow-md'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
              }`}
            >
              {/* Image Preview */}
              <div className="relative h-56 bg-stone-100 overflow-hidden group">
                <img
                  src={tmpl.previewImage}
                  alt={tmpl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <div className="text-white space-y-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200">
                      {tmpl.category}
                    </span>
                    <h3 className="text-xl font-serif font-bold">{tmpl.name}</h3>
                  </div>
                </div>

                {isCurrent && (
                  <div className="absolute top-3 right-3 bg-amber-800 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
                    Active Design
                  </div>
                )}
              </div>

              {/* Template Details */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-medium text-stone-700">{tmpl.fontName}</span>
                    <div className="flex items-center gap-1">
                      {tmpl.colors.map((c, i) => (
                        <span
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-stone-200 shadow-xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed font-light">
                    {tmpl.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(tmpl)}
                    className="text-xs font-semibold text-stone-600 hover:text-stone-900"
                  >
                    View Details
                  </button>

                  {isCurrent ? (
                    <button
                      type="button"
                      onClick={onLaunchEditor}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800"
                    >
                      Customize in Editor
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isApplying}
                      onClick={() => handleApply(tmpl.id)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-40"
                    >
                      {isApplying ? 'Applying...' : 'Apply Template'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Detail Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-stone-900 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setPreviewTemplate(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="h-44 rounded-2xl overflow-hidden bg-stone-100">
              <img
                src={previewTemplate.previewImage}
                alt={previewTemplate.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800">
                {previewTemplate.category}
              </span>
              <h3 className="text-xl font-serif font-bold text-stone-900 mt-0.5">
                {previewTemplate.name}
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                {previewTemplate.description}
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-stone-700">
                <span className="font-semibold">Typography:</span>
                <span>{previewTemplate.fontName}</span>
              </div>
              <div className="flex justify-between items-center text-stone-700">
                <span className="font-semibold">Palette:</span>
                <div className="flex gap-1.5">
                  {previewTemplate.colors.map((c, i) => (
                    <span
                      key={i}
                      className="w-4 h-4 rounded-full border border-stone-300"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = previewTemplate.id;
                  setPreviewTemplate(null);
                  await handleApply(id);
                }}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-amber-800 text-white hover:bg-amber-900"
              >
                Apply This Design
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
