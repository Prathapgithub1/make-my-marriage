import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createGuest,
  updateGuest,
  type GuestSummary,
  type CreateGuestPayload,
  type UpdateGuestPayload,
} from './guestsApi';
import { listEvents, type WeddingEvent } from '../events/eventsApi';

export interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestToEdit?: GuestSummary | null;
  onSuccess?: () => void;
}

export function GuestModal({
  isOpen,
  onClose,
  guestToEdit,
  onSuccess,
}: GuestModalProps) {
  const isEditing = Boolean(guestToEdit);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [maxGuests, setMaxGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch wedding events for multi-event assignment
  const { data: eventsResponse } = useQuery<{ events: WeddingEvent[] }>({
    queryKey: ['events', 'all'],
    queryFn: () => listEvents({ limit: 100 }),
    enabled: isOpen,
  });

  const availableEvents = eventsResponse?.events ?? [];

  useEffect(() => {
    if (guestToEdit) {
      setName(guestToEdit.name);
      setEmail(guestToEdit.email ?? '');
      setPhone(guestToEdit.phone ?? '');
      setMaxGuests(guestToEdit.maxGuests ?? 1);
      setNotes(guestToEdit.notes ?? '');
      setSelectedEventIds(guestToEdit.invitedEvents?.map((e) => e.id) ?? []);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setMaxGuests(1);
      setNotes('');
      // By default when creating new guest, preselect all planned events if available
      if (availableEvents.length > 0) {
        setSelectedEventIds(availableEvents.map((e) => e.id));
      } else {
        setSelectedEventIds([]);
      }
    }
    setFormError(null);
  }, [guestToEdit, isOpen, availableEvents.length]);

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId],
    );
  };

  const selectAllEvents = () => {
    setSelectedEventIds(availableEvents.map((e) => e.id));
  };

  const deselectAllEvents = () => {
    setSelectedEventIds([]);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      setFormError(null);
      if (!name.trim()) {
        throw new Error('Guest name is required.');
      }
      if (maxGuests < 1) {
        throw new Error('Maximum guests must be at least 1.');
      }

      if (isEditing && guestToEdit) {
        const payload: UpdateGuestPayload = {
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          maxGuests,
          notes: notes.trim() || null,
          invitedEventIds: selectedEventIds,
        };
        return updateGuest(guestToEdit.id, payload);
      } else {
        const payload: CreateGuestPayload = {
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          maxGuests,
          notes: notes.trim() || null,
          invitedEventIds: selectedEventIds,
        };
        return createGuest(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guestDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onSuccess?.();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to save guest.';
      setFormError(msg);
    },
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-[#EAE6E1] shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EAE6E1] flex items-center justify-between bg-[#FAF9F5]">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1C18]">
              {isEditing ? 'Edit Guest Details' : 'Add New Guest'}
            </h2>
            <p className="text-xs text-[#716B64] mt-0.5">
              Assign invited ceremonies, party capacity, and contact info
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#716B64] hover:bg-[#EAE6E1] hover:text-[#1A1C18] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {formError && (
            <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#FADBD8] text-[#C0392B] text-xs font-medium">
              {formError}
            </div>
          )}

          {/* Guest Name */}
          <div>
            <label htmlFor="guest-name-input" className="block text-xs font-bold text-[#1A1C18] uppercase tracking-wider mb-1.5">
              Guest / Family Name <span className="text-[#8D493A]">*</span>
            </label>
            <input
              id="guest-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Sharma & Family"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C2BB] text-xs text-[#1A1C18] focus:border-[#8D493A] focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/15 transition-all"
            />
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#1A1C18] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh.sharma@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C2BB] text-xs text-[#1A1C18] focus:border-[#8D493A] focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/15 transition-all"
              />
              <span className="text-[11px] text-[#86736D] mt-1 block">
                Required for email invitation
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1C18] uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C2BB] text-xs text-[#1A1C18] focus:border-[#8D493A] focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/15 transition-all"
              />
              <span className="text-[11px] text-[#86736D] mt-1 block">
                Useful for WhatsApp invite sharing
              </span>
            </div>
          </div>

          {/* Maximum Allowed Guests Capacity */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EAE6E1]">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-[#1A1C18] uppercase tracking-wider block">
                  Party Capacity (Max Guests Allowed)
                </label>
                <p className="text-[11px] text-[#716B64] mt-0.5">
                  The maximum number of attendees this invitation allows (1–10,000)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMaxGuests((prev) => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-lg border border-[#D8C2BB] bg-white text-[#1A1C18] font-bold text-sm flex items-center justify-center hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  title="Decrease"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(Math.max(1, Number(e.target.value) || 1))}
                  className="w-14 text-center py-1.5 rounded-lg border border-[#D8C2BB] bg-white text-xs font-bold text-[#1A1C18] focus:border-[#8D493A] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setMaxGuests((prev) => prev + 1)}
                  className="w-8 h-8 rounded-lg border border-[#D8C2BB] bg-white text-[#1A1C18] font-bold text-sm flex items-center justify-center hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  title="Increase"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Event Assignments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#1A1C18] uppercase tracking-wider block">
                Invited Ceremonies &amp; Events
              </label>
              {availableEvents.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#8D493A]">
                  <button
                    type="button"
                    onClick={selectAllEvents}
                    className="hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-[#D8C2BB]">•</span>
                  <button
                    type="button"
                    onClick={deselectAllEvents}
                    className="hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {availableEvents.length === 0 ? (
              <div className="p-3.5 rounded-xl border border-dashed border-[#D8C2BB] text-center text-xs text-[#716B64]">
                No events created yet. You can still invite guests to the wedding in general.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {availableEvents.map((event) => {
                  const isChecked = selectedEventIds.includes(event.id);
                  return (
                    <label
                      key={event.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isChecked
                          ? 'border-[#8D493A] bg-[#FDFBF7]'
                          : 'border-[#EAE6E1] bg-white hover:border-[#D8C2BB]'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEventSelection(event.id)}
                        className="mt-0.5 accent-[#8D493A] w-4 h-4 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="font-semibold text-[#1A1C18] flex items-center justify-between">
                          <span>{event.name}</span>
                          {event.startsAt && (
                            <span className="text-[11px] font-normal text-[#86736D]">
                              {new Date(event.startsAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        {event.venueName && (
                          <p className="text-[11px] text-[#716B64] truncate mt-0.5">
                            📍 {event.venueName}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#1A1C18] uppercase tracking-wider mb-1.5">
              Internal Notes / Dietary Preferences
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Vegetarian only, needs airport pickup arrangement"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C2BB] text-xs text-[#1A1C18] focus:border-[#8D493A] focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/15 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#EAE6E1] bg-[#FAF9F5] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-xl border border-[#D8C2BB] text-xs font-semibold text-[#716B64] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="px-5 py-2 rounded-xl bg-[#8D493A] hover:bg-[#723B2F] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            {mutation.isPending ? 'Saving...' : isEditing ? 'Update Guest' : 'Save Guest'}
          </button>
        </div>
      </div>
    </div>
  );
}

