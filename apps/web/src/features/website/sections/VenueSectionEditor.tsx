import type { WebsiteSection } from '../websiteApi';

interface SectionEditorProps {
  section: WebsiteSection;
  onChange: (updatedData: Record<string, any>) => void;
}

export function VenueSectionEditor({ section, onChange }: SectionEditorProps) {
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
          Venue Headline
        </label>
        <input
          type="text"
          value={data.headline ?? 'The Royal Celebration Destination'}
          onChange={(e) => handleChange('headline', e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Venue Name
        </label>
        <input
          type="text"
          value={data.venueName ?? 'The Leela Palace & Gardens'}
          onChange={(e) => handleChange('venueName', e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Address & City
        </label>
        <textarea
          rows={2}
          value={data.address ?? '23 Old Airport Road, HAL 2nd Stage, Kodihalli, Bengaluru, Karnataka 560008'}
          onChange={(e) => handleChange('address', e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Google Maps / Direction URL
        </label>
        <input
          type="url"
          value={data.mapUrl ?? 'https://maps.google.com'}
          onChange={(e) => handleChange('mapUrl', e.target.value)}
          placeholder="https://maps.google.com/?q=..."
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Venue Photo URL
        </label>
        <input
          type="url"
          value={data.photoUrl ?? ''}
          onChange={(e) => handleChange('photoUrl', e.target.value)}
          placeholder="https://images.unsplash.com/photo-1544161515-4ab6ce6db874"
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
            Valet & Parking Information
          </label>
          <input
            type="text"
            value={data.parkingInfo ?? 'Complimentary valet parking available at North Gate.'}
            onChange={(e) => handleChange('parkingInfo', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
            Airport Distance
          </label>
          <input
            type="text"
            value={data.airportDistance ?? '42 km (approx 60 mins from KIA Airport)'}
            onChange={(e) => handleChange('airportDistance', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
          />
        </div>
      </div>
    </div>
  );
}
