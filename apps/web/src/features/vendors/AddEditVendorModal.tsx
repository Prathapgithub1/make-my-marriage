import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createVendor,
  updateVendor,
  VENDOR_CATEGORIES,
  VENDOR_CATEGORY_META,
  VENDOR_STATUSES,
  VENDOR_STATUS_META,
  VENDOR_PRICE_RANGES,
  type CreateVendorPayload,
  type Vendor,
  type VendorCategoryValue,
  type VendorPriceRangeValue,
  type VendorStatusValue,
} from './vendorsApi';
import { getEvents } from '../events/eventsApi';

interface AddEditVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vendor: Vendor) => void;
  vendorToEdit?: Vendor | null;
}

export function AddEditVendorModal({
  isOpen,
  onClose,
  onSuccess,
  vendorToEdit,
}: AddEditVendorModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<VendorCategoryValue>('VENUE');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [pricing, setPricing] = useState('');
  const [priceRange, setPriceRange] = useState<VendorPriceRangeValue | ''>('');
  const [rating, setRating] = useState('4.8');
  const [status, setStatus] = useState<VendorStatusValue>('SHORTLISTED');
  const [isFavorite, setIsFavorite] = useState(false);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch wedding events to map ceremonies
  const { data: eventsData } = useQuery({
    queryKey: ['events'],
    queryFn: () => getEvents({ limit: 50 }),
    enabled: isOpen,
  });

  const weddingEvents = eventsData?.events || [];

  useEffect(() => {
    if (vendorToEdit) {
      setName(vendorToEdit.name);
      setCategory(vendorToEdit.category);
      setContactName(vendorToEdit.contactName || '');
      setPhone(vendorToEdit.phone || '');
      setEmail(vendorToEdit.email || '');
      setWebsite(vendorToEdit.website || '');
      setCity(vendorToEdit.city || '');
      setState(vendorToEdit.state || '');
      setAddress(vendorToEdit.address || '');
      setCoverImageUrl(vendorToEdit.coverImageUrl || '');
      setPricing(vendorToEdit.pricing || '');
      setPriceRange(vendorToEdit.priceRange || '');
      setRating(vendorToEdit.rating !== null ? String(vendorToEdit.rating) : '4.8');
      setStatus(vendorToEdit.status);
      setIsFavorite(vendorToEdit.isFavorite);
      setDescription(vendorToEdit.description || '');
      setNotes(vendorToEdit.notes || '');
      setSelectedEventIds(vendorToEdit.events.map((e) => e.id));
    } else {
      setName('');
      setCategory('VENUE');
      setContactName('');
      setPhone('');
      setEmail('');
      setWebsite('');
      setCity('');
      setState('');
      setAddress('');
      setCoverImageUrl('');
      setPricing('');
      setPriceRange('');
      setRating('4.8');
      setStatus('SHORTLISTED');
      setIsFavorite(false);
      setDescription('');
      setNotes('');
      setSelectedEventIds([]);
    }
    setErrorMessage(null);
  }, [vendorToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleEvent = (id: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Vendor business name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: CreateVendorPayload = {
      name: name.trim(),
      category,
      contactName: contactName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      website: website.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      address: address.trim() || null,
      coverImageUrl: coverImageUrl.trim() || null,
      pricing: pricing.trim() || null,
      priceRange: (priceRange as VendorPriceRangeValue) || null,
      rating: rating ? parseFloat(rating) : null,
      status,
      isFavorite,
      description: description.trim() || null,
      notes: notes.trim() || null,
      eventIds: selectedEventIds,
    };

    try {
      let saved: Vendor;
      if (vendorToEdit) {
        saved = await updateVendor(vendorToEdit.id, payload);
      } else {
        saved = await createVendor(payload);
      }
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save vendor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#EAE6E1]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#EAE6E1]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8D493A] bg-[#8D493A]/10 px-2 py-0.5 rounded-full">
              {vendorToEdit ? 'Edit Partner' : 'New Vendor Partner'}
            </span>
            <h2 className="text-xl font-serif text-[#2C2420] mt-1">
              {vendorToEdit ? `Edit ${vendorToEdit.name}` : 'Curate Vendor Partner'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#7C6856] hover:text-[#2C2420] rounded-full hover:bg-[#EAE6E1] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 text-sm text-[#8D493A] bg-[#8D493A]/10 border border-[#8D493A]/20 rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Business & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vendor-business-name" className="block text-xs font-semibold text-[#544B45] mb-1">
                Vendor Business Name <span className="text-red-500">*</span>
              </label>
              <input
                id="vendor-business-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Lotus Decorators"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
                required
              />
            </div>
            <div>
              <label htmlFor="vendor-category" className="block text-xs font-semibold text-[#544B45] mb-1">
                Primary Category <span className="text-red-500">*</span>
              </label>
              <select
                id="vendor-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as VendorCategoryValue)}
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              >
                {VENDOR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {VENDOR_CATEGORY_META[cat]?.icon} {VENDOR_CATEGORY_META[cat]?.label || cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="contact-person" className="block text-xs font-semibold text-[#544B45] mb-1">Contact Person</label>
              <input
                id="contact-person"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Vikram Sharma"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
            <div>
              <label htmlFor="phone-number" className="block text-xs font-semibold text-[#544B45] mb-1">Phone Number</label>
              <input
                id="phone-number"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold text-[#544B45] mb-1">Email Address</label>
              <input
                id="email-address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. contact@royallotus.in"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
          </div>

          {/* Location & Website */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">City / Hub</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bangalore"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">State / Region</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Karnataka"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Website or Portfolio URL</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
          </div>

          {/* Status, Pricing & Rating */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Pipeline Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatusValue)}
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              >
                {VENDOR_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {VENDOR_STATUS_META[st]?.label || st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Pricing Overview</label>
              <input
                type="text"
                value={pricing}
                onChange={(e) => setPricing(e.target.value)}
                placeholder="e.g. ₹3,50,000 package base"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Price Tier</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as VendorPriceRangeValue | '')}
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              >
                <option value="">Select Tier</option>
                {VENDOR_PRICE_RANGES.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Rating (0 - 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="4.8"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
          </div>

          {/* Image & Favorite */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Cover Image URL</label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
            <div className="pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="w-4 h-4 text-[#8D493A] rounded border-[#DED7CE] focus:ring-[#8D493A]"
                />
                <span className="text-sm font-medium text-[#2C2420]">
                  Mark as Shortlisted / Favorite Partner ⭐
                </span>
              </label>
            </div>
          </div>

          {/* Ceremony Event Associations */}
          {weddingEvents.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-2">
                Ceremony Assignments (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {weddingEvents.map((ev) => {
                  const isSelected = selectedEventIds.includes(ev.id);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => toggleEvent(ev.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-[#8D493A] text-white border-[#8D493A]'
                          : 'bg-white text-[#544B45] border-[#DED7CE] hover:border-[#8D493A]/50'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {ev.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description & Internal Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Description / Services Offered</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Summarize specialties, equipment, packages..."
                className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Private Wedding Team Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Negotiation terms, CAD review status, tasting schedules..."
                className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE6E1]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-[#7C6856] bg-white border border-[#DED7CE] rounded-xl hover:bg-[#F2ECE4] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#8D493A] rounded-xl hover:bg-[#783D30] transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : vendorToEdit ? 'Save Changes' : '+ Add Vendor Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

