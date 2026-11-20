import type { WebsiteSection } from '../websiteApi';

interface SectionEditorProps {
  section: WebsiteSection;
  onChange: (updatedData: Record<string, any>) => void;
}

export function CoupleSectionEditor({ section, onChange }: SectionEditorProps) {
  const data = section.data || {};
  const groom = data.groom || {};
  const bride = data.bride || {};

  const handleGroomChange = (key: string, value: any) => {
    onChange({
      ...data,
      groom: {
        ...groom,
        [key]: value,
      },
    });
  };

  const handleBrideChange = (key: string, value: any) => {
    onChange({
      ...data,
      bride: {
        ...bride,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Section Subheading */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Section Subheading / Lead
        </label>
        <input
          type="text"
          value={data.subheading ?? 'Meet the Bride & Groom'}
          onChange={(e) => onChange({ ...data, subheading: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      {/* Groom Details */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
        <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-600"></span> Groom Profile
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Full Name</label>
            <input
              type="text"
              value={groom.name ?? 'Prathap Reddy'}
              onChange={(e) => handleGroomChange('name', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Title / Profession</label>
            <input
              type="text"
              value={groom.title ?? 'Architect & Design Enthusiast'}
              onChange={(e) => handleGroomChange('title', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Photo URL</label>
          <input
            type="url"
            value={groom.photoUrl ?? ''}
            onChange={(e) => handleGroomChange('photoUrl', e.target.value)}
            placeholder="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
            className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Bio / Story</label>
          <textarea
            rows={2}
            value={groom.bio ?? 'Passionate traveler, music lover, and coffee enthusiast.'}
            onChange={(e) => handleGroomChange('bio', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>
      </div>

      {/* Bride Details */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
        <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Bride Profile
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Full Name</label>
            <input
              type="text"
              value={bride.name ?? 'Akshitha Rao'}
              onChange={(e) => handleBrideChange('name', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Title / Profession</label>
            <input
              type="text"
              value={bride.title ?? 'Creative Director & Painter'}
              onChange={(e) => handleBrideChange('title', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Photo URL</label>
          <input
            type="url"
            value={bride.photoUrl ?? ''}
            onChange={(e) => handleBrideChange('photoUrl', e.target.value)}
            placeholder="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
            className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Bio / Story</label>
          <textarea
            rows={2}
            value={bride.bio ?? 'Lover of art, classical dance, and starry weekend drives.'}
            onChange={(e) => handleBrideChange('bio', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>
      </div>
    </div>
  );
}
