import { useState, type MouseEvent } from 'react';
import {
  formatCurrencyINR,
  toggleFavoriteVendor,
  deleteVendor,
  VENDOR_CATEGORIES,
  VENDOR_CATEGORY_META,
  VENDOR_STATUSES,
  VENDOR_STATUS_META,
  type Vendor,
  type VendorCategoryValue,
  type VendorStatusValue,
} from './vendorsApi';

interface VendorDirectoryViewProps {
  vendors: Vendor[];
  selectedCategory?: VendorCategoryValue;
  onCategoryChange: (category?: VendorCategoryValue) => void;
  onOpenAddVendor: () => void;
  onOpenEditVendor: (vendor: Vendor) => void;
  onOpenBookingModal: (vendor: Vendor) => void;
  onSelectVendorForProfile: (vendor: Vendor) => void;
  onRefresh: () => void;
}

export function VendorDirectoryView({
  vendors,
  selectedCategory,
  onCategoryChange,
  onOpenAddVendor,
  onOpenEditVendor,
  onOpenBookingModal,
  onSelectVendorForProfile,
  onRefresh,
}: VendorDirectoryViewProps) {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<VendorStatusValue | 'ALL'>('ALL');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredVendors = vendors.filter((v) => {
    if (selectedCategory && v.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && v.status !== selectedStatus) return false;
    if (favoritesOnly && !v.isFavorite) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = v.name.toLowerCase().includes(q);
      const matchContact = v.contactName?.toLowerCase().includes(q) ?? false;
      const matchCity = v.city?.toLowerCase().includes(q) ?? false;
      const matchCategory = VENDOR_CATEGORY_META[v.category]?.label.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchContact && !matchCity && !matchCategory) return false;
    }
    return true;
  });

  const handleToggleFavorite = async (e: MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    try {
      setTogglingId(vendor.id);
      await toggleFavoriteVendor(vendor.id);
      onRefresh();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (e: MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove ${vendor.name}?`)) return;
    try {
      setDeletingId(vendor.id);
      await deleteVendor(vendor.id);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="w-4 h-4 text-[#8c9185] absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search vendors by name, contact, city, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d8d3c9] bg-[#fbfaf7] text-xs text-[#1a1c18] placeholder-[#949a8d] focus:outline-none focus:ring-2 focus:ring-[#8d493a]/30 focus:border-[#8d493a]"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Category Dropdown */}
            <select
              value={selectedCategory || ''}
              onChange={(e) => onCategoryChange((e.target.value as VendorCategoryValue) || undefined)}
              className="px-3 py-2.5 rounded-xl border border-[#d8d3c9] bg-[#fbfaf7] text-xs font-medium text-[#1a1c18] focus:outline-none focus:ring-2 focus:ring-[#8d493a]/30 focus:border-[#8d493a]"
            >
              <option value="">All Categories ({vendors.length})</option>
              {VENDOR_CATEGORIES.map((cat) => {
                const meta = VENDOR_CATEGORY_META[cat];
                const count = vendors.filter((v) => v.category === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {meta.icon} {meta.label} ({count})
                  </option>
                );
              })}
            </select>

            {/* Favorite Filter Toggle */}
            <button
              type="button"
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                favoritesOnly
                  ? 'bg-[#feeceb] text-[#c0392b] border-[#f5c6cb]'
                  : 'bg-[#fbfaf7] text-[#5e6358] border-[#d8d3c9] hover:bg-[#f2efe8]'
              }`}
            >
              <span>{favoritesOnly ? '❤️' : '🤍'}</span>
              <span>Shortlisted Only</span>
            </button>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl border border-[#d8d3c9] bg-[#fbfaf7] p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#8d493a] text-white shadow-sm'
                    : 'text-[#62675c] hover:text-[#1a1c18]'
                }`}
                title="Grid View"
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#8d493a] text-white shadow-sm'
                    : 'text-[#62675c] hover:text-[#1a1c18]'
                }`}
                title="Table View"
              >
                Table
              </button>
            </div>

            {/* Add Vendor Button */}
            <button
              type="button"
              onClick={onOpenAddVendor}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#8d493a] text-xs font-semibold text-white hover:bg-[#72392c] shadow-sm transition-colors"
            >
              <span>+</span>
              <span>Add Vendor</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedStatus === 'ALL'
                ? 'bg-[#1a1c18] text-white'
                : 'bg-[#f5f2ec] text-[#63685d] hover:bg-[#eae5dd]'
            }`}
          >
            All Statuses ({vendors.length})
          </button>
          {VENDOR_STATUSES.map((status) => {
            const count = vendors.filter((v) => v.status === status).length;
            const meta = VENDOR_STATUS_META[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedStatus === status
                    ? 'bg-[#8d493a] text-white'
                    : 'bg-[#f5f2ec] text-[#63685d] hover:bg-[#eae5dd]'
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory Results */}
      {filteredVendors.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#e8e4dc] text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#f7f4ee] flex items-center justify-center text-2xl mx-auto mb-3">
            🔍
          </div>
          <h3 className="text-base font-serif font-bold text-[#1a1c18]">No vendors found</h3>
          <p className="text-xs text-[#7c8075] mt-1 max-w-sm mx-auto">
            {search || selectedCategory || selectedStatus !== 'ALL' || favoritesOnly
              ? 'Try adjusting your search query, status tabs, or category filter.'
              : 'Start building your dream wedding production team by adding vetted vendors.'}
          </p>
          <button
            type="button"
            onClick={onOpenAddVendor}
            className="mt-4 px-4 py-2 rounded-xl bg-[#8d493a] text-xs font-semibold text-white hover:bg-[#72392c] transition-colors"
          >
            + Add First Vendor
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((vendor) => {
            const catMeta = VENDOR_CATEGORY_META[vendor.category];
            const statusMeta = VENDOR_STATUS_META[vendor.status];

            return (
              <div
                key={vendor.id}
                onClick={() => onSelectVendorForProfile(vendor)}
                className="bg-white rounded-2xl border border-[#e8e4dc] overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar with Category & Favorite */}
                  <div className="p-4 pb-3 flex items-center justify-between border-b border-[#f4f2ec]">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${catMeta.bg} ${catMeta.text}`}
                    >
                      <span>{catMeta.icon}</span>
                      <span>{catMeta.label}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusMeta.badge}`}>
                        {statusMeta.label}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(e, vendor)}
                        disabled={togglingId === vendor.id}
                        className="w-7 h-7 rounded-full hover:bg-[#fbf4f0] flex items-center justify-center text-sm transition-colors"
                        title={vendor.isFavorite ? 'Remove favorite' : 'Add to favorite'}
                      >
                        {vendor.isFavorite ? '❤️' : '🤍'}
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="text-base font-serif font-bold text-[#1a1c18] group-hover:text-[#8d493a] transition-colors">
                        {vendor.name}
                      </h4>
                      {vendor.contactName && (
                        <p className="text-xs text-[#70756a] mt-0.5">
                          Contact: <span className="font-medium text-[#2d3129]">{vendor.contactName}</span>
                        </p>
                      )}
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-2 text-[11px] text-[#6b7064] flex-wrap">
                      {vendor.city && (
                        <span className="flex items-center gap-1">
                          📍 {vendor.city}
                          {vendor.state ? `, ${vendor.state}` : ''}
                        </span>
                      )}
                      {vendor.phone && (
                        <span className="flex items-center gap-1">📞 {vendor.phone}</span>
                      )}
                      {vendor.rating && (
                        <span className="flex items-center gap-0.5 font-bold text-[#a66e22]">
                          ⭐ {vendor.rating.toFixed(1)}
                        </span>
                      )}
                      {vendor.priceRange && (
                        <span className="font-semibold text-[#8d493a] px-1.5 py-0.5 bg-[#fbf5f0] rounded">
                          {vendor.priceRange === 'BUDGET'
                            ? '₹'
                            : vendor.priceRange === 'MODERATE'
                              ? '₹₹'
                              : vendor.priceRange === 'PREMIUM'
                                ? '₹₹₹'
                                : '₹₹₹₹'}
                        </span>
                      )}
                    </div>

                    {/* Assigned Ceremonies */}
                    {vendor.events.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {vendor.events.map((ev) => (
                          <span
                            key={ev.id}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#f5f2ec] text-[#555a50]"
                          >
                            🎉 {ev.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Financial Summary */}
                    <div className="pt-2 border-t border-[#f4f2ec] grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="text-[10px] text-[#8c9185]">Contracted</div>
                        <div className="font-semibold text-[#1a1c18]">{formatCurrencyINR(vendor.totalAgreed)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8c9185]">Paid</div>
                        <div className="font-semibold text-[#3b6e45]">{formatCurrencyINR(vendor.totalPaid)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8c9185]">Balance Due</div>
                        <div className="font-semibold text-[#b84e38]">{formatCurrencyINR(vendor.balanceDue)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-3 bg-[#fdfcf9] border-t border-[#f4f2ec] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenBookingModal(vendor);
                    }}
                    className="font-semibold text-[#8d493a] hover:underline"
                  >
                    + Book Ceremony
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditVendor(vendor);
                      }}
                      className="text-[#686d61] hover:text-[#1a1c18] font-medium"
                    >
                      Edit
                    </button>
                    <span className="text-[#d8d3c9]">•</span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, vendor)}
                      disabled={deletingId === vendor.id}
                      className="text-[#b84e38] hover:text-[#912b18] font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf8f4] border-b border-[#e8e4dc] text-[#6b7064] font-semibold">
                <tr>
                  <th className="py-3 px-4">Vendor & Category</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Rating & Tier</th>
                  <th className="py-3 px-4">Ceremonies</th>
                  <th className="py-3 px-4 text-right">Agreed</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f2ec]">
                {filteredVendors.map((vendor) => {
                  const catMeta = VENDOR_CATEGORY_META[vendor.category];
                  const statusMeta = VENDOR_STATUS_META[vendor.status];

                  return (
                    <tr
                      key={vendor.id}
                      onClick={() => onSelectVendorForProfile(vendor)}
                      className="hover:bg-[#faf9f6] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-serif font-bold text-sm text-[#1a1c18] flex items-center gap-1.5">
                          <span>{vendor.name}</span>
                          {vendor.isFavorite && <span>❤️</span>}
                        </div>
                        <div className="text-[11px] text-[#7c8075] mt-0.5 flex items-center gap-1">
                          <span>{catMeta.icon}</span>
                          <span>{catMeta.label}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#2d3129]">{vendor.contactName || '—'}</div>
                        <div className="text-[11px] text-[#8c9185]">{vendor.phone || vendor.email || '—'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#a66e22]">
                          {vendor.rating ? `⭐ ${vendor.rating.toFixed(1)}` : '—'}
                        </div>
                        <div className="text-[11px] text-[#8d493a] font-semibold">{vendor.priceRange || 'Standard'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {vendor.events.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {vendor.events.map((e) => (
                              <span key={e.id} className="px-1.5 py-0.5 rounded text-[10px] bg-[#f5f2ec] text-[#555a50]">
                                {e.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#a4a99d]">Unmapped</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#1a1c18]">
                        {formatCurrencyINR(vendor.totalAgreed)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#3b6e45]">
                        {formatCurrencyINR(vendor.totalPaid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#b84e38]">
                        {formatCurrencyINR(vendor.balanceDue)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusMeta.badge}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenBookingModal(vendor);
                            }}
                            className="text-[#8d493a] hover:underline font-semibold"
                          >
                            Book
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEditVendor(vendor);
                            }}
                            className="text-[#64695e] hover:text-[#1a1c18]"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
