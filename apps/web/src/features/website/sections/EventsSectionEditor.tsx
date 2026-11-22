import type { WebsiteSection } from '../websiteApi';

interface SectionEditorProps {
  section: WebsiteSection;
  onChange: (updatedData: Record<string, any>) => void;
}

export function EventsSectionEditor({ section, onChange }: SectionEditorProps) {
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
          Section Headline
        </label>
        <input
          type="text"
          value={data.headline ?? 'Ceremonies & Celebrations'}
          onChange={(e) => handleChange('headline', e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Section Subtitle / Guest Guidance
        </label>
        <textarea
          rows={2}
          value={data.subtitle ?? 'Join us across three unforgettable days of rituals, feasts, and dancing.'}
          onChange={(e) => handleChange('subtitle', e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-amber-900 font-medium text-sm">
          <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Live Wedding Events Sync
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          Your wedding website automatically pulls confirmed ceremony dates, venue details, and dress codes directly from your Make My Marriage Events schedule.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Display Toggles
        </label>
        <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg">
          <span className="text-sm text-stone-700">Show Dress Code Advice</span>
          <input
            type="checkbox"
            checked={data.showDressCode ?? true}
            onChange={(e) => handleChange('showDressCode', e.target.checked)}
            className="w-4 h-4 text-amber-700 rounded border-stone-300 focus:ring-amber-600"
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg">
          <span className="text-sm text-stone-700">Show Venue Maps & Directions Button</span>
          <input
            type="checkbox"
            checked={data.showDirections ?? true}
            onChange={(e) => handleChange('showDirections', e.target.checked)}
            className="w-4 h-4 text-amber-700 rounded border-stone-300 focus:ring-amber-600"
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg">
          <span className="text-sm text-stone-700">Display Ceremonies Chronologically</span>
          <input
            type="checkbox"
            checked={data.sortByDate ?? true}
            onChange={(e) => handleChange('sortByDate', e.target.checked)}
            className="w-4 h-4 text-amber-700 rounded border-stone-300 focus:ring-amber-600"
          />
        </div>
      </div>
    </div>
  );
}
