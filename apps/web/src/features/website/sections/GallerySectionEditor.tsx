import { useState } from 'react';
import type { WebsiteSection } from '../websiteApi';

interface SectionEditorProps {
  section: WebsiteSection;
  onChange: (updatedData: Record<string, any>) => void;
}

interface GalleryImage {
  url: string;
  caption?: string;
}

export function GallerySectionEditor({ section, onChange }: SectionEditorProps) {
  const data = section.data || {};
  const images: GalleryImage[] = Array.isArray(data.images)
    ? data.images
    : [
        {
          url: 'https://images.unsplash.com/photo-1519741497674-611481863552',
          caption: 'Pre-wedding photoshoot in Jaipur',
        },
        {
          url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a',
          caption: 'The golden hour moments',
        },
        {
          url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc',
          caption: 'Sunset by the lakeside',
        },
      ];

  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');

  const addImage = () => {
    if (!newUrl.trim()) return;
    const updated = [...images, { url: newUrl.trim(), caption: newCaption.trim() }];
    onChange({ ...data, images: updated });
    setNewUrl('');
    setNewCaption('');
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange({ ...data, images: updated });
  };

  const updateCaption = (index: number, caption: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], caption };
    onChange({ ...data, images: updated });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Gallery Section Title
        </label>
        <input
          type="text"
          value={data.title ?? 'Memories & Captured Moments'}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Description
        </label>
        <textarea
          rows={2}
          value={data.subtitle ?? 'A glimpse of our favorite adventures, laughter, and cherished memories.'}
          onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      {/* Add Image Form */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700">Add New Photo</h4>
        <div className="space-y-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Image URL (e.g. Unsplash or direct CDN link)"
            className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              placeholder="Photo caption (optional)"
              className="flex-1 px-3 py-2 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
            <button
              type="button"
              onClick={addImage}
              disabled={!newUrl.trim()}
              className="px-4 py-2 text-xs font-medium bg-stone-800 text-white rounded-md hover:bg-stone-900 disabled:opacity-40"
            >
              Add Photo
            </button>
          </div>
        </div>
      </div>

      {/* Images List */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Curated Photos ({images.length})
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="p-3 bg-white border border-stone-200 rounded-lg flex flex-col justify-between gap-2"
            >
              <div className="h-28 bg-stone-100 rounded overflow-hidden relative group">
                <img
                  src={img.url}
                  alt={img.caption || `Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 bg-stone-900/80 text-white rounded-full hover:bg-rose-600 transition-colors"
                  title="Remove image"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                value={img.caption || ''}
                onChange={(e) => updateCaption(idx, e.target.value)}
                placeholder="Caption..."
                className="w-full px-2 py-1 text-xs border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
