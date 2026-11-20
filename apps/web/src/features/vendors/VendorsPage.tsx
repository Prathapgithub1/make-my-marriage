import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getVendorDashboard,
  getVendors,
  getVendorBookings,
  getVendorPayments,
  getVendorCalendar,
  type Vendor,
  type VendorBooking,
  type VendorCategoryValue,
  type VendorDashboardAnalytics,
} from './vendorsApi';
import { VendorDashboardView } from './VendorDashboardView';
import { VendorDirectoryView } from './VendorDirectoryView';
import { VendorCategoriesView } from './VendorCategoriesView';
import { VendorProfileDeepDiveView } from './VendorProfileDeepDiveView';
import { VendorPaymentsLedgerView } from './VendorPaymentsLedgerView';
import { VendorComparisonView } from './VendorComparisonView';
import { VendorScheduleTimelineView } from './VendorScheduleTimelineView';
import { AddEditVendorModal } from './AddEditVendorModal';
import { VendorBookingModal } from './VendorBookingModal';
import { RecordVendorPaymentModal } from './RecordVendorPaymentModal';

type VendorTab =
  | 'dashboard'
  | 'directory'
  | 'categories'
  | 'profile'
  | 'ledger'
  | 'comparison'
  | 'timeline';

const TAB_LABELS: Array<{ id: VendorTab; label: string }> = [
  { id: 'dashboard', label: '1. Vendor Dashboard' },
  { id: 'directory', label: '2. Vendor Directory' },
  { id: 'categories', label: '3. 15 Categories' },
  { id: 'profile', label: '4. Vendor Profile Deep Dive' },
  { id: 'ledger', label: '5. Payments & Ledger' },
  { id: 'comparison', label: '6. Side-by-Side Comparison' },
  { id: 'timeline', label: '7. Schedule & Timeline' },
];

export function VendorsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') as VendorTab | null;
  const [activeTab, setActiveTab] = useState<VendorTab>(
    tabParam && TAB_LABELS.some((t) => t.id === tabParam) ? tabParam : 'dashboard',
  );

  const [selectedCategory, setSelectedCategory] = useState<VendorCategoryValue | undefined>(
    (searchParams.get('category') as VendorCategoryValue) || undefined,
  );
  const [selectedVendorForProfile, setSelectedVendorForProfile] = useState<Vendor | null>(null);

  // Modals state
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(searchParams.get('action') === 'add');
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);
  const [bookingModalVendor, setBookingModalVendor] = useState<Vendor | null>(null);
  const [paymentModalBooking, setPaymentModalBooking] = useState<VendorBooking | null>(null);

  // Synchronize URL parameters
  useEffect(() => {
    const nextTab = searchParams.get('tab') as VendorTab | null;
    if (nextTab && TAB_LABELS.some((t) => t.id === nextTab)) {
      setActiveTab(nextTab);
    }
    const cat = searchParams.get('category') as VendorCategoryValue | null;
    if (cat) {
      setSelectedCategory(cat);
    }
    if (searchParams.get('action') === 'add') {
      setIsAddVendorOpen(true);
    }
  }, [searchParams]);

  const handleTabChange = (tab: VendorTab, category?: VendorCategoryValue) => {
    setActiveTab(tab);
    if (category) {
      setSelectedCategory(category);
      setSearchParams({ tab, category });
    } else {
      setSearchParams({ tab });
    }
  };

  // Queries
  const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchDashboard } = useQuery<
    VendorDashboardAnalytics
  >({
    queryKey: ['vendors-dashboard'],
    queryFn: getVendorDashboard,
    staleTime: 30_000,
  });

  const { data: vendorsData, refetch: refetchVendors } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => getVendors({ limit: 100 }),
    staleTime: 30_000,
  });

  const { data: bookingsData, refetch: refetchBookings } = useQuery({
    queryKey: ['vendors-bookings'],
    queryFn: getVendorBookings,
    staleTime: 30_000,
  });

  const { data: paymentsData, refetch: refetchPayments } = useQuery({
    queryKey: ['vendors-payments'],
    queryFn: getVendorPayments,
    staleTime: 30_000,
  });

  const { data: calendarData, refetch: refetchCalendar } = useQuery({
    queryKey: ['vendors-calendar'],
    queryFn: getVendorCalendar,
    staleTime: 30_000,
  });

  const vendors = vendorsData?.vendors || [];
  const bookings = bookingsData || [];
  const payments = paymentsData || [];
  const timeline = calendarData || [];

  // Keep selected vendor updated when list refreshes
  const activeVendor =
    (selectedVendorForProfile && vendors.find((v) => v.id === selectedVendorForProfile.id)) ||
    selectedVendorForProfile ||
    vendors[0] ||
    null;

  const handleRefreshAll = () => {
    refetchDashboard();
    refetchVendors();
    refetchBookings();
    refetchPayments();
    refetchCalendar();
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleOpenEdit = (vendor: Vendor) => {
    setVendorToEdit(vendor);
    setIsAddVendorOpen(true);
  };

  const handleOpenBooking = (vendor: Vendor) => {
    setBookingModalVendor(vendor);
  };

  const handleOpenPayment = (booking: VendorBooking) => {
    setPaymentModalBooking(booking);
  };

  const handleSelectVendorForProfile = (vendor: Vendor) => {
    setSelectedVendorForProfile(vendor);
    handleTabChange('profile');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Stitch Sub-Nav: VIEW STATE Tabs with Live Sync */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#e8e4dc] pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <span className="text-[11px] font-bold tracking-wider text-[#8c9185] uppercase mr-1 shrink-0">
            VIEW STATE:
          </span>
          {TAB_LABELS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${isActive
                    ? 'bg-[#8d493a] text-white shadow-sm'
                    : 'bg-white border border-[#e8e4dc] text-[#5e6358] hover:bg-[#f7f5ef]'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Live Sync Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e7f2e8] text-[#2e6438] border border-[#cbe4ce] shrink-0 self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-[#3b6e45] animate-pulse" />
          <span>Live Sync Enabled</span>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'dashboard' && (
        <>
          {isDashboardLoading || !dashboardData ? (
            <div className="bg-white rounded-2xl p-16 border border-[#e8e4dc] text-center text-xs text-[#8c9185]">
              <div className="w-8 h-8 border-2 border-[#8d493a] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading vendor intelligence and budget metrics...
            </div>
          ) : (
            <VendorDashboardView
              data={dashboardData}
              onNavigateTab={(tab, cat) => handleTabChange(tab as VendorTab, cat)}
              onOpenAddVendor={() => {
                setVendorToEdit(null);
                setIsAddVendorOpen(true);
              }}
            />
          )}
        </>
      )}

      {activeTab === 'directory' && (
        <VendorDirectoryView
          vendors={vendors}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onOpenAddVendor={() => {
            setVendorToEdit(null);
            setIsAddVendorOpen(true);
          }}
          onOpenEditVendor={handleOpenEdit}
          onOpenBookingModal={handleOpenBooking}
          onSelectVendorForProfile={handleSelectVendorForProfile}
          onRefresh={handleRefreshAll}
        />
      )}

      {activeTab === 'categories' && (
        <VendorCategoriesView
          vendors={vendors}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            handleTabChange('directory', cat);
          }}
        />
      )}

      {activeTab === 'profile' && (
        <>
          {activeVendor ? (
            <VendorProfileDeepDiveView
              vendor={activeVendor}
              allVendors={vendors}
              bookings={bookings}
              payments={payments}
              onSelectVendor={setSelectedVendorForProfile}
              onOpenEditVendor={handleOpenEdit}
              onOpenBookingModal={handleOpenBooking}
              onOpenPaymentModal={handleOpenPayment}
              onRefresh={handleRefreshAll}
              onBackToDirectory={() => handleTabChange('directory')}
            />
          ) : (
            <div className="bg-white rounded-2xl p-16 border border-[#e8e4dc] text-center text-xs text-[#8c9185]">
              No vendors added yet. Add a vendor from the Directory to view their profile.
            </div>
          )}
        </>
      )}

      {activeTab === 'ledger' && (
        <VendorPaymentsLedgerView
          payments={payments}
          bookings={bookings}
          vendors={vendors}
          onOpenRecordPayment={handleOpenPayment}
        />
      )}

      {activeTab === 'comparison' && (
        <VendorComparisonView
          vendors={vendors}
          onSelectVendorForProfile={handleSelectVendorForProfile}
          onOpenBookingModal={handleOpenBooking}
        />
      )}

      {activeTab === 'timeline' && (
        <VendorScheduleTimelineView
          timeline={timeline}
          vendors={vendors}
          onSelectVendorForProfile={handleSelectVendorForProfile}
        />
      )}

      {/* Modals */}
      <AddEditVendorModal
        isOpen={isAddVendorOpen}
        onClose={() => {
          setIsAddVendorOpen(false);
          setVendorToEdit(null);
        }}
        onSuccess={(savedVendor) => {
          setIsAddVendorOpen(false);
          setVendorToEdit(null);
          handleRefreshAll();
          setSelectedVendorForProfile(savedVendor);
        }}
        vendorToEdit={vendorToEdit}
      />

      {bookingModalVendor && (
        <VendorBookingModal
          isOpen={!!bookingModalVendor}
          onClose={() => setBookingModalVendor(null)}
          onSuccess={() => {
            setBookingModalVendor(null);
            handleRefreshAll();
          }}
          vendor={bookingModalVendor}
        />
      )}

      {paymentModalBooking && (
        <RecordVendorPaymentModal
          isOpen={!!paymentModalBooking}
          onClose={() => setPaymentModalBooking(null)}
          onSuccess={() => {
            setPaymentModalBooking(null);
            handleRefreshAll();
          }}
          booking={paymentModalBooking}
        />
      )}
    </div>
  );
}
