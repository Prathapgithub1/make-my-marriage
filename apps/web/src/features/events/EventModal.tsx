import { useState, useEffect, type FormEvent } from 'react';
import {
  createEvent,
  updateEvent,
  EVENT_NAME_PRESETS,
  DRESS_CODE_SUGGESTIONS,
  CURATED_COVER_PRESETS,
  type WeddingEvent,
  type EventStatus,
  type CreateEventInput,
} from './eventsApi';
import { ApiRequestError } from '../../lib/api-client';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: WeddingEvent | null;
  onSuccess: (event: WeddingEvent) => void;
}

function parseIsoToInputs(isoString: string | null): { date: string; time: string } {
  if (!isoString) return { date: '', time: '' };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: '', time: '' };
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    // If exact midnight 00:00, it was saved without a specified time component
    const isMidnight = d.getHours() === 0 && d.getMinutes() === 0;
    const time = isMidnight ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return { date, time };
  } catch {
    return { date: '', time: '' };
  }
}

function combineDateAndTime(dateStr: string, timeStr: string): string | null {
  if (!dateStr) return null;
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr ? timeStr.split(':').map(Number) : [0, 0];
    const d = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

export function EventModal({ isOpen, onClose, eventToEdit, onSuccess }: EventModalProps) {
  const isEditing = Boolean(eventToEdit);

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [description, setDescription] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [coverImageKey, setCoverImageKey] = useState('');
  const [status, setStatus] = useState<EventStatus>('PLANNED');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (eventToEdit) {
      setName(eventToEdit.name ?? '');
      const startParsed = parseIsoToInputs(eventToEdit.startsAt);
      const endParsed = parseIsoToInputs(eventToEdit.endsAt);
      setDate(startParsed.date || endParsed.date || '');
      setStartTime(startParsed.time || '');
      setEndTime(endParsed.time || '');
      setVenueName(eventToEdit.venueName ?? '');
      setVenueAddress(eventToEdit.venueAddress ?? '');
      setDescription(eventToEdit.description ?? '');
      setDressCode(eventToEdit.dressCode ?? '');
      setCoverImageKey(eventToEdit.coverImageKey ?? '');
      setStatus(eventToEdit.status ?? 'PLANNED');
    } else {
      setName('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setVenueName('');
      setVenueAddress('');
      setDescription('');
      setDressCode('');
      setCoverImageKey('');
      setStatus('PLANNED');
    }
    setErrorMessage(null);
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Event name is required and cannot be blank.');
      return;
    }
    if (trimmedName.length > 160) {
      setErrorMessage('Event name cannot exceed 160 characters.');
      return;
    }

    const startsAtIso = date ? combineDateAndTime(date, startTime) : null;
    const endsAtIso = date && endTime ? combineDateAndTime(date, endTime) : null;

    if (startsAtIso && endsAtIso) {
      if (new Date(endsAtIso) < new Date(startsAtIso)) {
        setErrorMessage('Event end time cannot be earlier than start time.');
        return;
      }
    }

    const payload: CreateEventInput = {
      name: trimmedName,
      startsAt: startsAtIso,
      endsAt: endsAtIso,
      venueName: venueName.trim() || null,
      venueAddress: venueAddress.trim() || null,
      description: description.trim() || null,
      dressCode: dressCode.trim() || null,
      coverImageKey: coverImageKey.trim() || null,
      status,
    };

    setSubmitting(true);
    try {
      let saved: WeddingEvent;
      if (isEditing && eventToEdit) {
        saved = await updateEvent(eventToEdit.id, payload);
      } else {
        saved = await createEvent(payload);
      }
      onSuccess(saved);
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred while saving the event. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-[#e5e3dc] overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e5e3dc] flex items-center justify-between bg-[#fafaf7]">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1c1d1b]">
              {isEditing ? 'Edit Wedding Event' : 'Add New Wedding Event'}
            </h2>
            <p className="text-xs sm:text-sm text-[#5c5d59] mt-0.5">
              {isEditing
                ? 'Update ceremony details, venue, or schedule.'
                : 'Schedule a celebration ceremony, dinner, or ritual.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7a7c77] hover:text-[#1c1d1b] hover:bg-[#edebe4] transition-colors"
          >
            <span className="sr-only">Close</span>✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-medium">
              {errorMessage}
            </div>
          )}

          {/* Event Name & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="eventName"
                className="block text-xs font-semibold text-[#1c1d1b] uppercase tracking-wider"
              >
                Event Name <span className="text-[#851321]">*</span>
              </label>
              <span className="text-[11px] text-[#7a7c77]">{name.length}/160</span>
            </div>

            {/* Presets Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {EVENT_NAME_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setName(preset)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                    name === preset
                      ? 'bg-[#8a4b35] text-white border-[#8a4b35] font-semibold shadow-xs'
                      : 'bg-[#fafaf5] text-[#5c5d59] border-[#d8c2bb]/70 hover:border-[#8a4b35] hover:text-[#1c1d1b]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              id="eventName"
              type="text"
              required
              maxLength={160}
              placeholder="e.g. Sangeet & Musical Night or Custom Ceremony"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8c2bb] focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/20 outline-none text-sm text-[#1c1d1b] bg-white transition-all placeholder:text-[#a09e99]"
            />
          </div>

          {/* Date, Start Time & End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="eventDate"
                className="block text-xs font-semibold text-[#1c1d1b] uppercase tracking-wider mb-1"
              >
                Event Date
              </label>
              <input
                id="eventDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#d8c2bb] focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/20 outline-none text-sm text-[#1c1d1b] bg-white"
              />
            </div>
            <div>
              <label
                htmlFor="startTime"
                className="block text-xs font-semibold text-[#1c1d1b] uppercase tracking-wider mb-1"
              >
                Start Time
              </label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#d8c2bb] focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/20 outline-none text-sm text-[#1c1d1b] bg-white"
              />
            </div>
            <div>
              <label
                htmlFor="endTime"
                className="block text-xs font-semibold text-[#1c1d1b] uppercase tracking-wider mb-1"
              >
                End Time
              </label>
              <input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#d8c2bb] focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/20 outline-none text-sm text-[#1c1d1b] bg-white"
              />
            </div>
          </div>

          {/* Status & Dress Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="eventStatus"
                className="block text-xs font-semibold text-[#1c1d1b] uppercase tracking-wider mb-1"
              >
                Event Status
              </label>
              <select
                id="eventStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#d8c2bb] focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/20 outline-none text-sm text-[#1c1d1b] bg-white"
              >
                <option value="PLANNED">Planned (Draft)</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="dressCode"
                className="block text-xs font-semibold text-[#1c1d1b] uppercase tracking-wider mb-1"
              >
                Dress Code
              </label>
              <input
                id="dressCode"
                type="text"
                maxLength={120}
                placeholder="e.g. Royal Traditional, Pastel Festive"
                value={dressCode}
                onChange={(e) => setDressCode(e.target.value)}
                list="dress-code-list"
                className="w-full px-3 py-2 rounded-xl border border-[#d8c2bb] focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/20 outline-none text-sm text-[#1c1d1b] bg-white placeholder:text-[#a09e99]"
              />
              <datalist id="dress-code-list">
                {DRESS_CODE_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Venue Details */}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="venueName"
                className="block text-xs font-semibold text-[#1c1d1b] uppercase tracking-wider mb-1"
              >
                Venue Name
              </label>
              <input
                id="venueName"
                type="text"
                maxLength={200}
                placeholder="e.g. The Grand Palace Courtyard or Poolside Lawn"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#d8c2bb] focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/20 outline-none text-sm text-[#1c1d1b] bg-white placeholder:text-[#a09e99]"
              />
            </div>
            <div>
              <label
                htmlFor="venueAddress"
                className="block text-xs font-semibold text-[#1c1d1b] uppercase tracking-wider mb-1"
              >
                Venue Address & Landmarks
              </label>
              <input
                id="venueAddress"
                type="text"
                maxLength={500}
                placeholder="e.g. 42 Heritage Road, Civil Lines, Jaipur, Rajasthan"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#d8c2bb] focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/20 outline-none text-sm text-[#1c1d1b] bg-white placeholder:text-[#a09e99]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-xs font-semibold text-[#1c1d1b] uppercase tracking-wider mb-1"
            >
              Description / Host Notes
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Share ceremony highlights, rituals, dinner schedule, or parking notes for guests..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8c2bb] focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/20 outline-none text-sm text-[#1c1d1b] bg-white placeholder:text-[#a09e99]"
            />
          </div>

          {/* Cover Image Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#1c1d1b] uppercase tracking-wider mb-2">
              Event Cover Photo
            </label>

            {/* Presets selector */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {CURATED_COVER_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setCoverImageKey(preset.url)}
                  className={`group relative aspect-4/3 rounded-lg overflow-hidden border-2 transition-all ${
                    coverImageKey === preset.url
                      ? 'border-[#8a4b35] ring-2 ring-[#8a4b35]/30 shadow-xs'
                      : 'border-transparent hover:border-[#d8c2bb]'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-end p-1 text-[9px] text-white font-medium truncate">
                    {preset.label.split(' ')[0]}
                  </div>
                </button>
              ))}
            </div>

            {/* Direct URL / Key input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Or paste custom image URL / S3 object key"
                value={coverImageKey}
                onChange={(e) => setCoverImageKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[#d8c2bb] text-xs text-[#1c1d1b] placeholder:text-[#a09e99]"
              />
              {coverImageKey && (
                <button
                  type="button"
                  onClick={() => setCoverImageKey('')}
                  className="text-xs text-[#8a4b35] hover:underline shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#e5e3dc] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-[#d8c2bb] text-sm font-medium text-[#5c5d59] hover:bg-[#fafaf5] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#8a4b35] hover:bg-[#723c2a] text-white text-sm font-semibold shadow-xs hover:shadow transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{isEditing ? 'Save Changes' : 'Create Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
