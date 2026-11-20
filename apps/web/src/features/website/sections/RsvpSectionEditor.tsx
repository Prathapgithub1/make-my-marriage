import type { WebsiteSection } from '../websiteApi';

interface SectionEditorProps {
  section: WebsiteSection;
  onChange: (updatedData: Record<string, any>) => void;
}

export function RsvpSectionEditor({ section, onChange }: SectionEditorProps) {
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
          RSVP Headline
        </label>
        <input
          type="text"
          value={data.headline ?? 'Kindly Respond by November 10, 2025'}
          onChange={(e) => handleChange('headline', e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Instructions & Warm Message
        </label>
        <textarea
          rows={2}
          value={data.message ?? 'We eagerly look forward to celebrating with you! Please let us know your attendance and any dietary requests.'}
          onChange={(e) => handleChange('message', e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-emerald-900 font-medium text-sm">
          <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Direct Guest & Headcount Sync
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">
          When guests confirm or decline through your wedding website, their responses are automatically synced into your Guest List and Event Attendance tables in real time.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Form Fields Configuration
        </label>
        <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg">
          <span className="text-sm text-stone-700">Collect Dietary Preferences & Allergies</span>
          <input
            type="checkbox"
            checked={data.askDietary ?? true}
            onChange={(e) => handleChange('askDietary', e.target.checked)}
            className="w-4 h-4 text-amber-700 rounded border-stone-300 focus:ring-amber-600"
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg">
          <span className="text-sm text-stone-700">Allow Guests to Leave a Note / Song Request</span>
          <input
            type="checkbox"
            checked={data.allowNotes ?? true}
            onChange={(e) => handleChange('allowNotes', e.target.checked)}
            className="w-4 h-4 text-amber-700 rounded border-stone-300 focus:ring-amber-600"
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg">
          <span className="text-sm text-stone-700">Allow Individual Ceremony Selection</span>
          <input
            type="checkbox"
            checked={data.allowCeremonySelection ?? true}
            onChange={(e) => handleChange('allowCeremonySelection', e.target.checked)}
            className="w-4 h-4 text-amber-700 rounded border-stone-300 focus:ring-amber-600"
          />
        </div>
      </div>
    </div>
  );
}
