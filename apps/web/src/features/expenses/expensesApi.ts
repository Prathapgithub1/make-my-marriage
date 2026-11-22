import { apiRequest } from '../../lib/api-client';

export const EXPENSE_CATEGORIES = [
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
] as const;

export const EXPENSE_PAYMENT_STATUSES = [
  'PENDING',
  'PARTIAL',
  'PAID',
  'OVERDUE',
  'CANCELLED',
] as const;

export const EXPENSE_PAYMENT_METHODS = [
  'UPI',
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CASH',
  'CHEQUE',
  'OTHER',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type ExpensePaymentStatus = (typeof EXPENSE_PAYMENT_STATUSES)[number];
export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number];

export interface ExpenseRecord {
  id: string;
  weddingId: string;
  eventId: string | null;
  eventName: string | null;
  vendorId: string | null;
  vendorName: string | null;
  vendorCategory: string | null;
  createdByUserId: string | null;
  createdByName: string | null;
  title: string;
  category: ExpenseCategory;
  amount: string;
  paidAmount: string;
  remainingAmount: string;
  currency: string;
  paymentStatus: ExpensePaymentStatus;
  paymentMethod: ExpensePaymentMethod | null;
  spentAt: string;
  dueDate: string | null;
  paidBy: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorRecord {
  id: string;
  weddingId: string;
  name: string;
  category: ExpenseCategory;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  expenseCount: number;
  totalSpent: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventBudgetItem {
  eventId: string;
  eventName: string;
  startsAt: string | null;
  eventStatus: string;
  allocatedBudget: string;
  hasAllocatedBudget: boolean;
  spentAmount: string;
  paidAmount: string;
  pendingAmount: string;
  remainingBudget: string;
  utilizationPercent: number;
  isOverBudget: boolean;
  expenseCount: number;
  notes: string | null;
}

export interface BudgetOverview {
  weddingBudget: {
    weddingId: string;
    totalBudget: string;
    currency: string;
    notes: string | null;
    hasBudgetConfigured: boolean;
    updatedAt: string | null;
  };
  summary: {
    totalBudget: string;
    totalAllocatedToEvents: string;
    unallocatedBudget: string;
    totalSpent: string;
    totalPaid: string;
    totalPending: string;
    remainingBudget: string;
    budgetUtilizationPercent: number;
    paymentCompletionPercent: number;
    isOverBudget: boolean;
    overBudgetAmount: string;
    expenseCount: number;
    totalRecordCount: number;
    cancelledCount: number;
    cancelledAmount: string;
    overdueCount: number;
    overdueAmount: string;
  };
  eventBudgets: EventBudgetItem[];
  unassignedEventExpenses: {
    spentAmount: string;
    paidAmount: string;
    pendingAmount: string;
    expenseCount: number;
  };
}

export interface ExpenseAnalytics {
  summary: BudgetOverview['summary'] & {
    hasBudgetConfigured: boolean;
    currency: string;
    vendorCount: number;
  };
  byCategory: Array<{
    category: ExpenseCategory;
    count: number;
    totalAmount: string;
    paidAmount: string;
    pendingAmount: string;
    sharePercent: number;
  }>;
  byEvent: EventBudgetItem[];
  unassignedEventExpenses: BudgetOverview['unassignedEventExpenses'];
  byPaymentStatus: Array<{
    paymentStatus: ExpensePaymentStatus;
    count: number;
    totalAmount: string;
    paidAmount: string;
  }>;
  byPaymentMethod: Array<{
    paymentMethod: ExpensePaymentMethod | 'UNSPECIFIED';
    count: number;
    totalAmount: string;
    paidAmount: string;
  }>;
  byVendor: Array<{
    vendorId: string | null;
    vendorName: string;
    count: number;
    totalAmount: string;
    paidAmount: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    label: string;
    count: number;
    totalAmount: string;
    paidAmount: string;
  }>;
}

export interface ListExpensesResponse {
  expenses: ExpenseRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totals: {
    filteredAmount: string;
    filteredPaidAmount: string;
    filteredRemainingAmount: string;
  };
}

export interface ListExpensesParams {
  category?: ExpenseCategory;
  eventId?: string;
  vendorId?: string;
  paymentStatus?: ExpensePaymentStatus;
  paymentMethod?: ExpensePaymentMethod;
  from?: string;
  to?: string;
  search?: string;
  sortBy?: 'spentAt' | 'amount' | 'paidAmount' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateExpensePayload {
  title: string;
  category: ExpenseCategory;
  amount: string | number;
  paidAmount?: string | number;
  paymentStatus: ExpensePaymentStatus;
  paymentMethod?: ExpensePaymentMethod | null;
  spentAt?: string;
  dueDate?: string | null;
  eventId?: string | null;
  vendorId?: string | null;
  paidBy?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
}

export type UpdateExpensePayload = Partial<CreateExpensePayload>;

export interface RecordPaymentPayload {
  paidAmount: string | number;
  paymentMethod?: ExpensePaymentMethod | null;
  paidBy?: string | null;
  referenceNumber?: string | null;
}

export interface CreateVendorPayload {
  name: string;
  category: ExpenseCategory;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  notes?: string | null;
}

export const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; color: string; pillBg: string; pillText: string }
> = {
  VENUE: {
    label: 'Venue & Stay',
    color: '#8D493A',
    pillBg: 'bg-[#F8ECE8]',
    pillText: 'text-[#8D493A]',
  },
  CATERING: {
    label: 'Catering & Sweets',
    color: '#B86B35',
    pillBg: 'bg-[#FBF1E7]',
    pillText: 'text-[#9F5320]',
  },
  PHOTOGRAPHY: {
    label: 'Photography',
    color: '#556251',
    pillBg: 'bg-[#EEF3EC]',
    pillText: 'text-[#42503F]',
  },
  VIDEOGRAPHY: {
    label: 'Videography',
    color: '#6C7D67',
    pillBg: 'bg-[#EFF5EE]',
    pillText: 'text-[#485A43]',
  },
  DECORATION: {
    label: 'Decor & Florals',
    color: '#C28238',
    pillBg: 'bg-[#FCF3E4]',
    pillText: 'text-[#996018]',
  },
  CLOTHING: {
    label: 'Bridal & Groom Attire',
    color: '#9F4D63',
    pillBg: 'bg-[#FAECF0]',
    pillText: 'text-[#84374C]',
  },
  JEWELLERY: {
    label: 'Jewellery & Gold',
    color: '#C69214',
    pillBg: 'bg-[#FDF6DE]',
    pillText: 'text-[#8D6404]',
  },
  MAKEUP: {
    label: 'Makeup & Mehendi',
    color: '#B56576',
    pillBg: 'bg-[#FAF0F2]',
    pillText: 'text-[#8A4453]',
  },
  MUSIC: {
    label: 'Music & DJ',
    color: '#5E6C84',
    pillBg: 'bg-[#EEF1F5]',
    pillText: 'text-[#425068]',
  },
  ENTERTAINMENT: {
    label: 'Entertainment & Artists',
    color: '#7A5980',
    pillBg: 'bg-[#F3EEF5]',
    pillText: 'text-[#5E4163]',
  },
  TRANSPORT: {
    label: 'Baraat & Transport',
    color: '#4F7A72',
    pillBg: 'bg-[#EAF3F1]',
    pillText: 'text-[#355A53]',
  },
  TRAVEL: {
    label: 'Guest Flights & Travel',
    color: '#3D6B82',
    pillBg: 'bg-[#EAF2F6]',
    pillText: 'text-[#285065]',
  },
  INVITATIONS: {
    label: 'Invitations & Cards',
    color: '#8C6D53',
    pillBg: 'bg-[#F5EFE9]',
    pillText: 'text-[#6A4F38]',
  },
  GIFTS: {
    label: 'Favors & Shagun',
    color: '#A66E22',
    pillBg: 'bg-[#FAF2E4]',
    pillText: 'text-[#845312]',
  },
  OTHER: {
    label: 'Other / Miscellaneous',
    color: '#7A746D',
    pillBg: 'bg-[#F2EFEA]',
    pillText: 'text-[#5E5851]',
  },
};

export const PAYMENT_STATUS_META: Record<
  ExpensePaymentStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  PAID: {
    label: 'Paid in Full',
    badgeClass: 'bg-[#EAF4EA] text-[#2F6B38] border-[#CDE4CE]',
    dotClass: 'bg-[#2F6B38]',
  },
  PARTIAL: {
    label: 'Partial / Advance',
    badgeClass: 'bg-[#FEF4E4] text-[#9A6011] border-[#F4DFBA]',
    dotClass: 'bg-[#B7791F]',
  },
  PENDING: {
    label: 'Pending',
    badgeClass: 'bg-[#F5F2EE] text-[#6B5F57] border-[#E4DDD5]',
    dotClass: 'bg-[#8D7F76]',
  },
  OVERDUE: {
    label: 'Overdue',
    badgeClass: 'bg-[#FDECEA] text-[#A8382B] border-[#F6C8C2]',
    dotClass: 'bg-[#A8382B]',
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeClass: 'bg-[#F3F2F0] text-[#7D7A76] border-[#DFDCD7]',
    dotClass: 'bg-[#9A9691]',
  },
};

export const PAYMENT_METHOD_LABELS: Record<ExpensePaymentMethod | 'UNSPECIFIED', string> = {
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer / NEFT / RTGS',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  CASH: 'Cash',
  CHEQUE: 'Cheque / DD',
  OTHER: 'Other Method',
  UNSPECIFIED: 'Not Specified',
};

export function formatCurrencyINR(amount: string | number, currency = 'INR'): string {
  const numeric = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(numeric)) {
    return '₹0';
  }
  const hasFraction = Math.abs(numeric % 1) > 0.001;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export async function listExpenses(params: ListExpensesParams = {}): Promise<ListExpensesResponse> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      qs.set(key, String(value));
    }
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await apiRequest<{
    data: ExpenseRecord[];
    pagination: ListExpensesResponse['pagination'];
    totals: ListExpensesResponse['totals'];
  }>(`expenses${suffix}`);
  return {
    expenses: res.data,
    pagination: res.pagination,
    totals: res.totals,
  };
}

export async function getExpense(expenseId: string): Promise<ExpenseRecord> {
  const res = await apiRequest<{ data: ExpenseRecord }>(`expenses/${expenseId}`);
  return res.data;
}

export async function createExpense(payload: CreateExpensePayload): Promise<ExpenseRecord> {
  const res = await apiRequest<{ data: ExpenseRecord }>('expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateExpense(
  expenseId: string,
  payload: UpdateExpensePayload,
): Promise<ExpenseRecord> {
  const res = await apiRequest<{ data: ExpenseRecord }>(`expenses/${expenseId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function recordExpensePayment(
  expenseId: string,
  payload: RecordPaymentPayload,
): Promise<ExpenseRecord> {
  const res = await apiRequest<{ data: ExpenseRecord }>(`expenses/${expenseId}/payment`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteExpense(expenseId: string): Promise<{ deleted: boolean }> {
  const res = await apiRequest<{ data: { deleted: boolean } }>(`expenses/${expenseId}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function getBudgetOverview(): Promise<BudgetOverview> {
  const res = await apiRequest<{ data: BudgetOverview }>('expenses/budget');
  return res.data;
}

export async function upsertWeddingBudget(payload: {
  totalBudget: string | number;
  currency?: string;
  notes?: string | null;
}) {
  const res = await apiRequest<{ data: BudgetOverview['weddingBudget'] }>('expenses/budget', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function upsertEventBudget(
  eventId: string,
  payload: { allocatedBudget: string | number; notes?: string | null },
) {
  const res = await apiRequest<{ data: EventBudgetItem }>(`expenses/budget/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteEventBudget(eventId: string) {
  const res = await apiRequest<{ data: { deleted: boolean } }>(
    `expenses/budget/events/${eventId}`,
    {
      method: 'DELETE',
    },
  );
  return res.data;
}

export async function getExpenseAnalytics(): Promise<ExpenseAnalytics> {
  const res = await apiRequest<{ data: ExpenseAnalytics }>('expenses/analytics');
  return res.data;
}

export async function listVendors(params: { search?: string; limit?: number } = {}): Promise<{
  vendors: VendorRecord[];
}> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.limit) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await apiRequest<{ data: VendorRecord[] }>(`vendors${suffix}`);
  return { vendors: res.data };
}

export async function createVendor(payload: CreateVendorPayload): Promise<VendorRecord> {
  const res = await apiRequest<{ data: VendorRecord }>('vendors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}
