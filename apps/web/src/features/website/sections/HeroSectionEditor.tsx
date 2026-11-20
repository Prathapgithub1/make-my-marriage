import type { WebsiteSection } from '../websiteApi';

interface SectionEditorProps {
  section: WebsiteSection;
  onChange: (updatedData: Record<string, any>) => void;
}

export function HeroSectionEditor({ section, onChange }: SectionEditorProps) {
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
          Hero Headline / Greeting
        </label>
        <input
          type="text"
          value={data.headline ?? 'We are getting married!'}
          onChange={(e) => handleChange('headline', e.target.value)}
          placeholder="e.g. We are getting married!"
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Subtitle / Romantic Quote
        </label>
        <textarea
          rows={2}
          value={data.subtitle ?? 'Two souls, one heart, together forever in love and celebration.'}
          onChange={(e) => handleChange('subtitle', e.target.value)}
          placeholder="Enter a romantic quote or heartfelt note to your guests"
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Hero Cover Image URL
        </label>
        <input
          type="url"
          value={data.coverImageUrl ?? ''}
          onChange={(e) => handleChange('coverImageUrl', e.target.value)}
          placeholder="https://images.unsplash.com/photo-1519741497674-611481863552"
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
        <p className="text-xs text-stone-400 mt-1">
          High-resolution landscape photo recommended (1920x1080).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
            Primary Button Label
          </label>
          <input
            type="text"
            value={data.primaryButtonText ?? 'RSVP Now'}
            onChange={(e) => handleChange('primaryButtonText', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
            Secondary Button Label
          </label>
          <input
            type="text"
            value={data.secondaryButtonText ?? 'View Schedule'}
            onChange={(e) => handleChange('secondaryButtonText', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
          />
        </div>
      </div>

      <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-stone-800">Show Countdown Timer</span>
          <p className="text-xs text-stone-400">Displays real-time days, hours, and minutes until the big day</p>
        </div>
        <button
          type="button"
          onClick={() => handleChange('showCountdown', !(data.showCountdown ?? true))}
          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
            data.showCountdown ?? true ? 'bg-amber-700' : 'bg-stone-200'
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
              data.showCountdown ?? true ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
