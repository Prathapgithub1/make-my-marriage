import type { WebsiteSection } from '../websiteApi';

interface SectionEditorProps {
  section: WebsiteSection;
  onChange: (updatedData: Record<string, any>) => void;
}

export function ContactSectionEditor({ section, onChange }: SectionEditorProps) {
  const data = section.data || {};

  const handleChange = (key: string, value: any) => {
    onChange({
      ...data,
      [key]: value,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Contact Section Headline
        </label>
        <input
          type="text"
          value={data.headline ?? 'Need Assistance? Reach Our Wedding Concierge'}
          onChange={(e) => handleChange('headline', e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Support Message
        </label>
        <textarea
          rows={2}
          value={data.message ?? 'Have questions about directions, accommodations, or special arrangements? Our wedding concierge team is here to assist.'}
          onChange={(e) => handleChange('message', e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
            WhatsApp Hotline / Phone
          </label>
          <input
            type="text"
            value={data.phone ?? '+91 98765 43210'}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
            Support Email
          </label>
          <input
            type="email"
            value={data.email ?? 'celebrate@prathapakshitha.wedding'}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
          />
        </div>
      </div>
    </div>
  );
}

export function FooterSectionEditor({ section, onChange }: SectionEditorProps) {
  const data = section.data || {};

  const handleChange = (key: string, value: any) => {
    onChange({
      ...data,
      [key]: value,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Closing Warm Message / Thank You
        </label>
        <textarea
          rows={2}
          value={data.closingText ?? 'With love, gratitude, and warm anticipation — Prathap & Akshitha'}
          onChange={(e) => handleChange('closingText', e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Wedding Social Hashtag
        </label>
        <input
          type="text"
          value={data.hashtag ?? '#PrathapWedsAkshitha'}
          onChange={(e) => handleChange('hashtag', e.target.value)}
          placeholder="#CoupleHashtag"
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900 font-medium"
        />
      </div>

      <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg">
        <span className="text-sm text-stone-700">Display "Powered by Make My Marriage" Badge</span>
        <input
          type="checkbox"
          checked={data.showBranding ?? true}
          onChange={(e) => handleChange('showBranding', e.target.checked)}
          className="w-4 h-4 text-amber-700 rounded border-stone-300 focus:ring-amber-600"
        />
      </div>
    </div>
  );
}
