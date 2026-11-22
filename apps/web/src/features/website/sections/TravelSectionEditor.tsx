import type { WebsiteSection } from '../websiteApi';

interface SectionEditorProps {
  section: WebsiteSection;
  onChange: (updatedData: Record<string, any>) => void;
}

interface Accommodation {
  name: string;
  rating: string;
  distance: string;
  bookingCode?: string;
  notes?: string;
}

export function TravelSectionEditor({ section, onChange }: SectionEditorProps) {
  const data = section.data || {};
  const hotels: Accommodation[] = Array.isArray(data.hotels)
    ? data.hotels
    : [
        {
          name: 'The Leela Palace Bengaluru',
          rating: '5 Star Luxury',
          distance: 'On-site celebration venue',
          bookingCode: 'REDDYRAO25',
          notes: 'Special wedding guest rate reserved under Reddy-Rao block.',
        },
        {
          name: 'ITC Gardenia, Luxury Collection',
          rating: '5 Star',
          distance: '7 km from venue (15 mins drive)',
          bookingCode: 'MMM2025',
          notes: 'Complimentary shuttle service will operate during major ceremonies.',
        },
      ];

  const updateHotel = (index: number, field: keyof Accommodation, value: string) => {
    const updated = [...hotels];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, hotels: updated });
  };

  const addHotel = () => {
    const updated = [
      ...hotels,
      {
        name: 'Hotel Name',
        rating: '4 Star / 5 Star',
        distance: 'Approx 5 km from venue',
        bookingCode: '',
        notes: '',
      },
    ];
    onChange({ ...data, hotels: updated });
  };

  const removeHotel = (index: number) => {
    const updated = hotels.filter((_, i) => i !== index);
    onChange({ ...data, hotels: updated });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Travel & Stay Title
        </label>
        <input
          type="text"
          value={data.title ?? 'Travel & Accommodations'}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Guest Welcome & Shuttle Note
        </label>
        <textarea
          rows={2}
          value={data.shuttleNote ?? 'For out-of-town guests, hotel blocks and airport pickup concierge have been organized.'}
          onChange={(e) => onChange({ ...data, shuttleNote: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Recommended Hotels ({hotels.length})
          </label>
          <button
            type="button"
            onClick={addHotel}
            className="text-xs font-medium text-amber-800 hover:text-amber-900"
          >
            + Add Hotel
          </button>
        </div>

        {hotels.map((h, idx) => (
          <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-600">Hotel #{idx + 1}</span>
              {hotels.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHotel(idx)}
                  className="text-stone-400 hover:text-rose-600 text-xs"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={h.name}
                onChange={(e) => updateHotel(idx, 'name', e.target.value)}
                placeholder="Hotel Name"
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600 font-medium"
              />
              <input
                type="text"
                value={h.distance}
                onChange={(e) => updateHotel(idx, 'distance', e.target.value)}
                placeholder="Distance to venue"
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={h.bookingCode || ''}
                onChange={(e) => updateHotel(idx, 'bookingCode', e.target.value)}
                placeholder="Discount / Block code (optional)"
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
              <input
                type="text"
                value={h.rating}
                onChange={(e) => updateHotel(idx, 'rating', e.target.value)}
                placeholder="Rating / Tier"
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
            <input
              type="text"
              value={h.notes || ''}
              onChange={(e) => updateHotel(idx, 'notes', e.target.value)}
              placeholder="Special instructions, shuttle times..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600 text-stone-600"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
