import { apiRequest } from '../../lib/api-client';

export type VendorCategoryValue =
  | 'VENUE'
  | 'CATERING'
  | 'PHOTOGRAPHY'
  | 'VIDEOGRAPHY'
  | 'DECORATION'
  | 'CLOTHING'
  | 'JEWELLERY'
  | 'MAKEUP'
  | 'MUSIC'
  | 'ENTERTAINMENT'
  | 'TRANSPORT'
  | 'TRAVEL'
  | 'INVITATIONS'
  | 'GIFTS'
  | 'OTHER'
  | 'PLANNER'
  | 'FLORIST'
  | 'ACCOMMODATION';

export const VENDOR_CATEGORIES: VendorCategoryValue[] = [
  'VENUE',
  'CATERING',
  'PHOTOGRAPHY',
  'VIDEOGRAPHY',
  'DECORATION',
  'CLOTHING',
  'JEWELLERY',
  'MAKEUP',
  'MUSIC',
  'ENTERTAINMENT',
  'TRANSPORT',
  'TRAVEL',
  'INVITATIONS',
  'GIFTS',
  'OTHER',
  'PLANNER',
  'FLORIST',
  'ACCOMMODATION',
];

export type VendorStatusValue =
  | 'SHORTLISTED'
  | 'CONTACTED'
  | 'NEGOTIATING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';

export const VENDOR_STATUSES: VendorStatusValue[] = [
  'SHORTLISTED',
  'CONTACTED',
  'NEGOTIATING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
];

export type VendorPriceRangeValue = 'BUDGET' | 'MODERATE' | 'PREMIUM' | 'LUXURY';

export const VENDOR_PRICE_RANGES: VendorPriceRangeValue[] = [
  'BUDGET',
  'MODERATE',
  'PREMIUM',
  'LUXURY',
];

export type PaymentMethodValue =
  | 'UPI'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CASH'
  | 'CHEQUE'
  | 'OTHER';

export const PAYMENT_METHODS: PaymentMethodValue[] = [
  'UPI',
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CASH',
  'CHEQUE',
  'OTHER',
];

export interface VendorService {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  isIncluded: boolean;
}

export interface Vendor {
  id: string;
  weddingId: string;
  name: string;
  category: VendorCategoryValue;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  coverImageUrl: string | null;
  description: string | null;
  pricing: string | null;
  priceRange: VendorPriceRangeValue | null;
  rating: number | null;
  status: VendorStatusValue;
  isFavorite: boolean;
  notes: string | null;
  services: VendorService[];
  events: Array<{ id: string; name: string }>;
  bookingsCount: number;
  totalAgreed: string;
  totalPaid: string;
  balanceDue: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorBooking {
  id: string;
  weddingId: string;
  vendorId: string;
  vendorName: string;
  category: VendorCategoryValue;
  eventId: string | null;
  eventName: string | null;
  expenseId: string | null;
  serviceName: string;
  status: VendorStatusValue;
  bookingDate: string | null;
  serviceDate: string | null;
  agreedAmount: string;
  advancePayment: string;
  paidAmount: string;
  balanceDue: string;
  contractUrl: string | null;
  contractRef: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  paymentsCount: number;
}

export interface VendorPayment {
  id: string;
  weddingId: string;
  bookingId: string | null;
  vendorId: string;
  vendorName: string;
  expenseId: string | null;
  amount: string;
  paymentDate: string;
  paymentStatus: string;
  paymentMethod: string;
  paidBy: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface VendorDashboardAnalytics {
  kpis: {
    totalVendors: number;
    categoriesCount: number;
    confirmedVendors: number;
    confirmedPercentage: number;
    shortlistedVendors: number;
    negotiatingVendors: number;
    pendingSignatures: number;
    vendorBudgetCap: string;
    totalAllocated: string;
    totalAmountPaid: string;
    paidPercentage: number;
    remainingBalance: string;
    upcoming14Days: string;
  };
  pipelineFunnel: Array<{
    stage: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  budgetByTier: Array<{
    category: VendorCategoryValue;
    label: string;
    allocated: string;
    paid: string;
    vendorsCount: number;
    sharePercent: number;
  }>;
  upcomingMilestones: Array<{
    id: string;
    title: string;
    vendorName: string;
    category: VendorCategoryValue;
    ceremonyName: string | null;
    serviceDate: string;
    status: VendorStatusValue;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'BOOKING_CREATED' | 'PAYMENT_RECORDED' | 'STATUS_UPDATED' | 'VENDOR_ADDED';
    title: string;
    vendorName: string;
    timestamp: string;
    details: string;
  }>;
}

export interface ListVendorsParams {
  category?: VendorCategoryValue;
  status?: VendorStatusValue;
  priceRange?: VendorPriceRangeValue;
  isFavorite?: boolean;
  eventId?: string;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'rating' | 'category' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateVendorPayload {
  name: string;
  category: VendorCategoryValue;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  coverImageUrl?: string | null;
  description?: string | null;
  pricing?: string | null;
  priceRange?: VendorPriceRangeValue | null;
  rating?: number | null;
  status?: VendorStatusValue;
  isFavorite?: boolean;
  notes?: string | null;
  eventIds?: string[];
}

export interface CreateBookingPayload {
  eventId?: string | null;
  serviceName: string;
  status?: VendorStatusValue;
  bookingDate?: string | null;
  serviceDate?: string | null;
  agreedAmount: string;
  advancePayment?: string;
  advancePaymentMethod?: PaymentMethodValue;
  contractUrl?: string | null;
  contractRef?: string | null;
  notes?: string | null;
}

export interface RecordVendorPaymentPayload {
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethodValue;
  paidBy?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface CreateServicePayload {
  name: string;
  description?: string | null;
  price?: string | null;
  isIncluded?: boolean;
}

export const VENDOR_CATEGORY_META: Record<
  VendorCategoryValue,
  { label: string; icon: string; bg: string; text: string }
> = {
  VENUE: { label: 'Venues & Palaces', icon: '🏰', bg: 'bg-[#F2ECE4]', text: 'text-[#8D493A]' },
  CATERING: { label: 'Royal Catering', icon: '🍽️', bg: 'bg-[#F9EFE6]', text: 'text-[#A66E22]' },
  PHOTOGRAPHY: { label: 'Photo & Cinema', icon: '📷', bg: 'bg-[#EBF2EB]', text: 'text-[#4A6B53]' },
  VIDEOGRAPHY: { label: 'Videography', icon: '🎥', bg: 'bg-[#E8F0F3]', text: 'text-[#2D5A72]' },
  DECORATION: { label: 'Mandap & Florals', icon: '🌺', bg: 'bg-[#FDF0EE]', text: 'text-[#B84E38]' },
  CLOTHING: { label: 'Bridal & Groom Wear', icon: '👗', bg: 'bg-[#F5EDF3]', text: 'text-[#7D4166]' },
  JEWELLERY: { label: 'Fine Jewellery', icon: '💎', bg: 'bg-[#FFF8E6]', text: 'text-[#9A7415]' },
  MAKEUP: { label: 'Makeup & Hair', icon: '💄', bg: 'bg-[#FDF2F4]', text: 'text-[#A13A58]' },
  MUSIC: { label: 'Music & Symphony', icon: '🎵', bg: 'bg-[#EEF1F7]', text: 'text-[#3B5480]' },
  ENTERTAINMENT: { label: 'Live Entertainment', icon: '🎭', bg: 'bg-[#F6EBF8]', text: 'text-[#6A3982]' },
  TRANSPORT: { label: 'Luxury Transport', icon: '🚗', bg: 'bg-[#EFF2F5]', text: 'text-[#44566C]' },
  TRAVEL: { label: 'Guest Hospitality & Travel', icon: '✈️', bg: 'bg-[#E9F3F2]', text: 'text-[#296860]' },
  INVITATIONS: { label: 'Stationery & Invites', icon: '💌', bg: 'bg-[#F7EFE9]', text: 'text-[#875535]' },
  GIFTS: { label: 'Hampers & Favors', icon: '🎁', bg: 'bg-[#FEF6E8]', text: 'text-[#996316]' },
  OTHER: { label: 'Other Services', icon: '✨', bg: 'bg-[#EFEFEF]', text: 'text-[#505050]' },
  PLANNER: { label: 'Wedding Production', icon: '📋', bg: 'bg-[#F0EBE5]', text: 'text-[#684C38]' },
  FLORIST: { label: 'Exotic Florals', icon: '🌸', bg: 'bg-[#FDF0F3]', text: 'text-[#9E3F57]' },
  ACCOMMODATION: { label: 'Resorts & Stays', icon: '🏨', bg: 'bg-[#E9F0EC]', text: 'text-[#3E654C]' },
};

export const VENDOR_STATUS_META: Record<
  VendorStatusValue,
  { label: string; badge: string; dot: string }
> = {
  SHORTLISTED: { label: 'Shortlisted', badge: 'bg-[#F4EFEA] text-[#7C6856]', dot: 'bg-[#B09B86]' },
  CONTACTED: { label: 'Contacted', badge: 'bg-[#EBF2F7] text-[#2F6182]', dot: 'bg-[#3C82B1]' },
  NEGOTIATING: { label: 'Negotiating', badge: 'bg-[#FEF5E7] text-[#A66E22]', dot: 'bg-[#E09924]' },
  CONFIRMED: { label: 'Confirmed & Booked', badge: 'bg-[#EBF4EC] text-[#3B6E45]', dot: 'bg-[#4CAF50]' },
  COMPLETED: { label: 'Executed & Settled', badge: 'bg-[#E8EDF2] text-[#40566B]', dot: 'bg-[#607D8B]' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-[#FDF0EE] text-[#B84E38]', dot: 'bg-[#D32F2F]' },
};

export function formatCurrencyINR(amountStrOrNum: string | number | null | undefined): string {
  if (amountStrOrNum === null || amountStrOrNum === undefined) return '₹0';
  const num = typeof amountStrOrNum === 'number' ? amountStrOrNum : parseFloat(amountStrOrNum);
  if (Number.isNaN(num)) return '₹0';

  const parts = num.toFixed(2).split('.');
  const intPart = parts[0];
  const decPart = parts[1];

  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return decPart === '00' ? `₹${formattedInt}` : `₹${formattedInt}.${decPart}`;
}

export function formatShortDate(isoStringOrDate: string | null | undefined): string {
  if (!isoStringOrDate) return '—';
  try {
    const d = new Date(isoStringOrDate);
    if (Number.isNaN(d.getTime())) return isoStringOrDate;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoStringOrDate;
  }
}

// API Callers
export async function getVendors(params: ListVendorsParams = {}): Promise<{
  vendors: Vendor[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.status) query.set('status', params.status);
  if (params.priceRange) query.set('priceRange', params.priceRange);
  if (params.isFavorite !== undefined) query.set('isFavorite', String(params.isFavorite));
  if (params.eventId) query.set('eventId', params.eventId);
  if (params.search) query.set('search', params.search);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const endpoint = `vendors${qs ? `?${qs}` : ''}`;
  const res = await apiRequest<{ data: Vendor[]; pagination: any }>(endpoint, { method: 'GET' });
  return {
    vendors: res.data,
    pagination: res.pagination,
  };
}

export async function getVendor(vendorId: string): Promise<Vendor> {
  const res = await apiRequest<{ data: Vendor }>(`vendors/${vendorId}`, { method: 'GET' });
  return res.data;
}

export async function createVendor(payload: CreateVendorPayload): Promise<Vendor> {
  const res = await apiRequest<{ data: Vendor }>('vendors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateVendor(vendorId: string, payload: Partial<CreateVendorPayload>): Promise<Vendor> {
  const res = await apiRequest<{ data: Vendor }>(`vendors/${vendorId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteVendor(vendorId: string): Promise<{ deleted: true }> {
  const res = await apiRequest<{ data: { deleted: true } }>(`vendors/${vendorId}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function toggleFavoriteVendor(vendorId: string): Promise<{ isFavorite: boolean }> {
  const res = await apiRequest<{ data: { isFavorite: boolean } }>(`vendors/${vendorId}/favorite`, {
    method: 'PATCH',
  });
  return res.data;
}

export async function updateVendorStatus(vendorId: string, status: VendorStatusValue): Promise<{ status: VendorStatusValue }> {
  const res = await apiRequest<{ data: { status: VendorStatusValue } }>(`vendors/${vendorId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data;
}

// Services
export async function createVendorService(vendorId: string, payload: CreateServicePayload): Promise<VendorService> {
  const res = await apiRequest<{ data: VendorService }>(`vendors/${vendorId}/services`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteVendorService(vendorId: string, serviceId: string): Promise<{ deleted: true }> {
  const res = await apiRequest<{ data: { deleted: true } }>(`vendors/${vendorId}/services/${serviceId}`, {
    method: 'DELETE',
  });
  return res.data;
}

// Bookings
export async function getVendorBookings(): Promise<VendorBooking[]> {
  const res = await apiRequest<{ data: VendorBooking[] }>('vendors/bookings', { method: 'GET' });
  return res.data;
}

export async function createVendorBooking(vendorId: string, payload: CreateBookingPayload): Promise<VendorBooking> {
  const res = await apiRequest<{ data: VendorBooking }>(`vendors/${vendorId}/bookings`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateVendorBooking(bookingId: string, payload: Partial<CreateBookingPayload>): Promise<VendorBooking> {
  const res = await apiRequest<{ data: VendorBooking }>(`vendors/bookings/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteVendorBooking(bookingId: string): Promise<{ deleted: true }> {
  const res = await apiRequest<{ data: { deleted: true } }>(`vendors/bookings/${bookingId}`, {
    method: 'DELETE',
  });
  return res.data;
}

// Payments
export async function getVendorPayments(): Promise<VendorPayment[]> {
  const res = await apiRequest<{ data: VendorPayment[] }>('vendors/payments', { method: 'GET' });
  return res.data;
}

export async function recordVendorPayment(bookingId: string, payload: RecordVendorPaymentPayload): Promise<VendorPayment> {
  const res = await apiRequest<{ data: VendorPayment }>(`vendors/bookings/${bookingId}/payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

// Dashboard, Comparison & Calendar
export async function getVendorDashboard(): Promise<VendorDashboardAnalytics> {
  const res = await apiRequest<{ data: VendorDashboardAnalytics }>('vendors/dashboard', { method: 'GET' });
  return res.data;
}

export async function getVendorComparison(vendorIds: string[]): Promise<Vendor[]> {
  const res = await apiRequest<{ data: Vendor[] }>(`vendors/comparison?vendorIds=${vendorIds.join(',')}`, {
    method: 'GET',
  });
  return res.data;
}

export async function getVendorCalendar(): Promise<Array<{
  id: string;
  type: 'SERVICE' | 'BOOKING' | 'PAYMENT_DUE';
  date: string;
  vendorId: string;
  vendorName: string;
  category: VendorCategoryValue;
  title: string;
  amount: string | null;
  status: string;
  ceremonyName: string | null;
}>> {
  const res = await apiRequest<{ data: any }>('vendors/calendar', { method: 'GET' });
  return res.data;
}

