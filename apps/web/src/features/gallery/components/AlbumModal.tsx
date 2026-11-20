import { useState, useEffect, type FormEvent } from 'react';
import type { Album } from '../galleryApi';

interface EventOption {
  id: string;
  name: string;
}

interface AlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string; eventId?: string }) => Promise<void>;
  initialAlbum?: Album | null;
  events?: EventOption[];
}

const PRESET_ALBUMS = [
  'Engagement',
  'Haldi Ceremony',
  'Mehendi & Sangeet',
  'Cocktail Night',
  'Varmala & Pheras',
  'Wedding Reception',
  'Pre-Wedding Shoot',
  'Family Portraits',
];

export function AlbumModal({
  isOpen,
  onClose,
  onSave,
  initialAlbum,
  events = [],
}: AlbumModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAlbum) {
      setName(initialAlbum.name);
      setDescription(initialAlbum.description || '');
      setEventId(initialAlbum.eventId || '');
    } else {
      setName('');
      setDescription('');
      setEventId('');
    }
    setError(null);
  }, [initialAlbum, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an album title.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        eventId: eventId || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save album.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-[#E8DFD5] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-[#8A4B35] flex items-center justify-center shadow-2xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1C18]">
                {initialAlbum ? 'Edit Album' : 'Create New Album'}
              </h2>
              <p className="text-xs text-[#86736D] mt-0.5">
                Organize your high-resolution wedding photos and videos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#EDE7DE] text-[#86736D] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[#FEF0F0] border border-[#FADBD8] text-[#C0392B] text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4.5">
          {/* Preset Chips (only when creating a new album) */}
          {!initialAlbum && (
            <div>
              <label className="block text-xs font-bold text-[#86736D] uppercase tracking-wider mb-2">
                Quick Ceremony Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ALBUMS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setName(preset)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all cursor-pointer ${name === preset
                        ? 'bg-[#8A4B35] text-white border-[#8A4B35] shadow-2xs font-medium'
                        : 'bg-[#FAF8F5] text-[#5A4942] border-[#E8DFD5] hover:bg-[#F2ECE4]'
                      }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Album Title */}
          <div>
            <label className="block text-xs font-bold text-[#1A1C18] uppercase tracking-wider mb-1.5">
              Album Name <span className="text-[#8A4B35]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sangeet Celebrations"
              maxLength={160}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C2BB] bg-[#FAF8F5] text-sm text-[#1A1C18] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8A4B35]/20 focus:border-[#8A4B35] transition-all"
            />
          </div>

          {/* Event Association */}
          {events.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#1A1C18] uppercase tracking-wider mb-1.5">
                Link to Ceremony / Event (Optional)
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C2BB] bg-[#FAF8F5] text-sm text-[#1A1C18] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8A4B35]/20 focus:border-[#8A4B35] transition-all"
              >
                <option value="">No linked event</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#1A1C18] uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A few words about this album..."
              rows={3}
              maxLength={1000}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C2BB] bg-[#FAF8F5] text-sm text-[#1A1C18] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8A4B35]/20 focus:border-[#8A4B35] transition-all resize-none"
            />
          </div>

          <div className="pt-3.5 flex items-center justify-end gap-2.5 border-t border-[#F0EAE3]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4.5 py-2 text-xs font-semibold text-[#5A4942] hover:text-[#1A1C18] hover:bg-[#FAF8F5] rounded-xl border border-[#D8C2BB] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5.5 py-2 text-xs font-semibold text-white bg-[#8A4B35] hover:bg-[#723C2A] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialAlbum ? 'Update Album' : 'Create Album'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
