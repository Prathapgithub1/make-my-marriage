import * as React from 'react';
import { useState } from 'react';
import type { DashboardData, UpdateWeddingInput } from '../weddingApi';

export interface EditWeddingDetailsModalProps {
  initialData: DashboardData['wedding'];
  isSubmitting: boolean;
  error?: string;
  onClose: () => void;
  onSave: (values: UpdateWeddingInput) => void;
}

export function EditWeddingDetailsModal({
  initialData,
  isSubmitting,
  error,
  onClose,
  onSave,
}: EditWeddingDetailsModalProps) {
  const [title, setTitle] = useState(initialData.title);
  const [brideName, setBrideName] = useState(initialData.brideName);
  const [groomName, setGroomName] = useState(initialData.groomName);
  const [weddingDate, setWeddingDate] = useState(initialData.weddingDate ?? '');
  const [location, setLocation] = useState(initialData.location ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      brideName,
      groomName,
      weddingDate: weddingDate ? weddingDate : null,
      location: location ? location : null,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-wedding-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-[#d8c2bb]/50 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-3 border-b border-[#e3e3dc]">
          <h3 id="edit-wedding-title" className="font-serif text-xl font-medium text-[#1a1c18]">
            Edit wedding details
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
              htmlFor="edit-title"
            >
              Wedding Name
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1.5 w-full min-h-10 px-3 border border-[#d8c2bb]/70 rounded-lg text-sm text-[#1a1c18] outline-none focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
                htmlFor="edit-bride"
              >
                Partner 1
              </label>
              <input
                id="edit-bride"
                type="text"
                value={brideName}
                onChange={(e) => setBrideName(e.target.value)}
                required
                className="mt-1.5 w-full min-h-10 px-3 border border-[#d8c2bb]/70 rounded-lg text-sm text-[#1a1c18] outline-none focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/10"
              />
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
                htmlFor="edit-groom"
              >
                Partner 2
              </label>
              <input
                id="edit-groom"
                type="text"
                value={groomName}
                onChange={(e) => setGroomName(e.target.value)}
                required
                className="mt-1.5 w-full min-h-10 px-3 border border-[#d8c2bb]/70 rounded-lg text-sm text-[#1a1c18] outline-none focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
                htmlFor="edit-date"
              >
                Wedding Date
              </label>
              <input
                id="edit-date"
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="mt-1.5 w-full min-h-10 px-3 border border-[#d8c2bb]/70 rounded-lg text-sm text-[#1a1c18] outline-none focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/10"
              />
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
                htmlFor="edit-loc"
              >
                Location
              </label>
              <input
                id="edit-loc"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or venue"
                className="mt-1.5 w-full min-h-10 px-3 border border-[#d8c2bb]/70 rounded-lg text-sm text-[#1a1c18] outline-none focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/10"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#e3e3dc]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#d8c2bb] text-xs font-medium text-[#53433e] hover:bg-[#fafaf3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#8a4b35] text-white text-xs font-semibold hover:bg-[#a8624b] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
