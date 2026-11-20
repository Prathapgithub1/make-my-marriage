import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiRequestError } from '../../lib/api-client';
import { listEvents } from '../events/eventsApi';
import {
  CATEGORY_META,
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PAYMENT_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
  deleteEventBudget,
  formatCurrencyINR,
  formatShortDate,
  getBudgetOverview,
  getExpenseAnalytics,
  listExpenses,
  listVendors,
  recordExpensePayment,
  upsertEventBudget,
  type EventBudgetItem,
  type ExpenseCategory,
  type ExpensePaymentMethod,
  type ExpensePaymentStatus,
  type ExpenseRecord,
} from './expensesApi';
import { ExpenseModal } from './ExpenseModal';
import { ExpenseDetailModal } from './ExpenseDetailModal';
import { BudgetModal } from './BudgetModal';
import { ExpenseAnalyticsCharts } from './ExpenseAnalyticsCharts';

type ExpensesTab = 'ledger' | 'budgets' | 'analytics';

function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function ExpensesPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as ExpensesTab | null) ?? 'ledger';
  const [activeTab, setActiveTab] = useState<ExpensesTab>(
    ['ledger', 'budgets', 'analytics'].includes(initialTab) ? initialTab : 'ledger',
  );

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | ''>('');
  const [eventFilter, setEventFilter] = useState<string>(searchParams.get('eventId') ?? '');
  const [vendorFilter, setVendorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpensePaymentStatus | ''>('');
  const [methodFilter, setMethodFilter] = useState<ExpensePaymentMethod | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState<'spentAt' | 'amount' | 'paidAmount' | 'title'>('spentAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(searchParams.get('action') === 'add');
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [detailExpense, setDetailExpense] = useState<ExpenseRecord | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(searchParams.get('action') === 'budget');

  // Inline event budget editor state
  const [editingEventBudgetId, setEditingEventBudgetId] = useState<string | null>(null);
  const [eventBudgetAmount, setEventBudgetAmount] = useState('');
  const [eventBudgetNotes, setEventBudgetNotes] = useState('');
  const [savingEventBudget, setSavingEventBudget] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'ledger' || tabParam === 'budgets' || tabParam === 'analytics') {
      setActiveTab(tabParam);
    }
    const actionParam = searchParams.get('action');
    if (actionParam === 'add') {
      setEditingExpense(null);
      setExpenseModalOpen(true);
    } else if (actionParam === 'budget') {
      setBudgetModalOpen(true);
    }
    const eventParam = searchParams.get('eventId');
    if (eventParam) {
      setEventFilter(eventParam);
    }
  }, [searchParams]);

  const expensesQuery = useQuery({
    queryKey: [
      'expenses',
      {
        search,
        categoryFilter,
        eventFilter,
        vendorFilter,
        statusFilter,
        methodFilter,
        fromDate,
        toDate,
        sortBy,
        sortOrder,
        page,
      },
    ],
    queryFn: () =>
      listExpenses({
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        eventId: eventFilter || undefined,
        vendorId: vendorFilter || undefined,
        paymentStatus: statusFilter || undefined,
        paymentMethod: methodFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 12,
      }),
  });

  const budgetQuery = useQuery({
    queryKey: ['expenses-budget'],
    queryFn: getBudgetOverview,
  });

  const analyticsQuery = useQuery({
    queryKey: ['expenses-analytics'],
    queryFn: getExpenseAnalytics,
  });

  const eventsQuery = useQuery({
    queryKey: ['events', 'dropdown'],
    queryFn: () => listEvents({ limit: 100 }),
  });

  const vendorsQuery = useQuery({
    queryKey: ['vendors', 'dropdown'],
    queryFn: () => listVendors({ limit: 100 }),
  });

  function refreshAllFinancialData() {
    void queryClient.invalidateQueries({ queryKey: ['expenses'] });
    void queryClient.invalidateQueries({ queryKey: ['expenses-budget'] });
    void queryClient.invalidateQueries({ queryKey: ['expenses-analytics'] });
    void queryClient.invalidateQueries({ queryKey: ['vendors'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }

  function switchTab(nextTab: ExpensesTab) {
    setActiveTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    nextParams.delete('action');
    setSearchParams(nextParams, { replace: true });
  }

  function clearFilters() {
    setSearch('');
    setCategoryFilter('');
    setEventFilter('');
    setVendorFilter('');
    setStatusFilter('');
    setMethodFilter('');
    setFromDate('');
    setToDate('');
    setSortBy('spentAt');
    setSortOrder('desc');
    setPage(1);
  }

  async function handleQuickMarkPaid(expense: ExpenseRecord) {
    setMarkingPaidId(expense.id);
    setBannerError(null);
    try {
      await recordExpensePayment(expense.id, {
        paidAmount: expense.amount,
        paymentMethod: expense.paymentMethod,
      });
      refreshAllFinancialData();
    } catch (err) {
      setBannerError(err instanceof ApiRequestError ? err.message : 'Unable to mark expense paid.');
    } finally {
      setMarkingPaidId(null);
    }
  }

  function startEditingEventBudget(evt: EventBudgetItem) {
    setEditingEventBudgetId(evt.eventId);
    setEventBudgetAmount(evt.hasAllocatedBudget ? String(Number(evt.allocatedBudget)) : '');
    setEventBudgetNotes(evt.notes ?? '');
    setBannerError(null);
  }

  async function handleSaveEventBudget(eventId: string) {
    const val = Number(eventBudgetAmount);
    if (eventBudgetAmount === '' || !Number.isFinite(val) || val < 0) {
      setBannerError('Please enter a valid non-negative ceremony budget.');
      return;
    }
    setSavingEventBudget(true);
    setBannerError(null);
    try {
      await upsertEventBudget(eventId, {
        allocatedBudget: eventBudgetAmount.trim(),
        notes: eventBudgetNotes.trim() || null,
      });
      setEditingEventBudgetId(null);
      refreshAllFinancialData();
    } catch (err) {
      setBannerError(
        err instanceof ApiRequestError ? err.message : 'Could not update ceremony budget.',
      );
    } finally {
      setSavingEventBudget(false);
    }
  }

  async function handleRemoveEventBudget(eventId: string) {
    setSavingEventBudget(true);
    setBannerError(null);
    try {
      await deleteEventBudget(eventId);
      setEditingEventBudgetId(null);
      refreshAllFinancialData();
    } catch (err) {
      setBannerError(
        err instanceof ApiRequestError ? err.message : 'Could not remove ceremony budget.',
      );
    } finally {
      setSavingEventBudget(false);
    }
  }

  async function handleExportCsv() {
    try {
      const fullList = await listExpenses({ limit: 100, sortBy: 'spentAt', sortOrder: 'desc' });
      const headers = [
        'Title',
        'Category',
        'Ceremony',
        'Vendor',
        'Status',
        'Method',
        'Total Amount (INR)',
        'Paid Amount (INR)',
        'Balance Due (INR)',
        'Spent Date',
        'Due Date',
        'Paid By',
        'Reference',
        'Notes',
      ];
      const rows = fullList.expenses.map((exp) =>
        [
          exp.title,
          CATEGORY_META[exp.category]?.label ?? exp.category,
          exp.eventName ?? 'General Wedding',
          exp.vendorName ?? 'Direct / Unassigned',
          PAYMENT_STATUS_META[exp.paymentStatus]?.label ?? exp.paymentStatus,
          PAYMENT_METHOD_LABELS[exp.paymentMethod ?? 'UNSPECIFIED'],
          exp.amount,
          exp.paidAmount,
          exp.remainingAmount,
          exp.spentAt,
          exp.dueDate ?? '',
          exp.paidBy ?? '',
          exp.referenceNumber ?? '',
          exp.notes ?? '',
        ]
          .map(escapeCsvCell)
          .join(','),
      );

      const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wedding-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setBannerError('Unable to export CSV right now.');
    }
  }

  const budgetOverview = budgetQuery.data;
  const analytics = analyticsQuery.data;
  const summary = budgetOverview?.summary ?? analytics?.summary;
  const events = (eventsQuery.data?.events ?? []).map((e) => ({ id: e.id, name: e.name }));
  const vendors = vendorsQuery.data?.vendors ?? [];
  const expensesList = expensesQuery.data?.expenses ?? [];
  const pagination = expensesQuery.data?.pagination ?? {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  };
  const filteredTotals = expensesQuery.data?.totals;

  const hasBudgetConfigured = budgetOverview?.weddingBudget.hasBudgetConfigured ?? false;
  const utilizationBarWidth = Math.min(100, summary?.budgetUtilizationPercent ?? 0);

  const hasActiveFilters = Boolean(
    search ||
    categoryFilter ||
    eventFilter ||
    vendorFilter ||
    statusFilter ||
    methodFilter ||
    fromDate ||
    toDate,
  );

  return (
    <>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5ECE8] text-[#8D493A] text-xs font-semibold tracking-wide mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8D493A]" />
              <span>Financial Concierge & Ledger</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1C18] tracking-tight">
              Expenses & Budget Management
            </h1>
            <p className="text-sm text-[#5C5D59] mt-1">
              Plan your total celebration budget, track ceremony allocations, and manage vendor
              installments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setBudgetModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white border border-[#DED8D0] text-sm font-semibold text-[#1A1C18] hover:bg-[#FAF8F5] shadow-2xs transition-colors cursor-pointer"
            >
              {hasBudgetConfigured ? 'Edit Total Budget' : 'Set Wedding Budget'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#8D493A] text-white text-sm font-semibold hover:bg-[#763B2E] shadow-xs transition-colors cursor-pointer"
            >
              + Add Expense
            </button>
          </div>
        </div>

        {bannerError && (
          <div className="rounded-2xl bg-[#FDECEA] border border-[#F6C8C2] px-4 py-3 text-sm text-[#A8382B] flex items-center justify-between">
            <span>{bannerError}</span>
            <button
              type="button"
              onClick={() => setBannerError(null)}
              className="text-xs font-semibold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Over Budget / Overdue Alerts */}
        {summary?.isOverBudget && (
          <div className="rounded-2xl bg-[#FDECEA] border border-[#F6C8C2] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#A8382B]">
                Over Wedding Budget by {formatCurrencyINR(summary.overBudgetAmount)}
              </p>
              <p className="text-xs text-[#7D2C22] mt-0.5">
                Total committed spend ({formatCurrencyINR(summary.totalSpent)}) has exceeded your
                target cap of {formatCurrencyINR(summary.totalBudget)}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBudgetModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#F6C8C2] text-xs font-semibold text-[#A8382B] hover:bg-[#FFF8F7] shrink-0 cursor-pointer"
            >
              Review Budget Cap
            </button>
          </div>
        )}

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#EAE6E1] p-5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#86736D]">
              <span>Total Wedding Budget</span>
              <span className="w-7 h-7 rounded-lg bg-[#F5EFE9] flex items-center justify-center text-sm">
                🎯
              </span>
            </div>
            <p className="font-serif text-2xl sm:text-[26px] font-bold text-[#1A1C18] mt-2">
              {hasBudgetConfigured && summary
                ? formatCurrencyINR(summary.totalBudget)
                : 'Not Set Yet'}
            </p>
            <p className="text-xs text-[#6B5F57] mt-1">
              {summary
                ? `${formatCurrencyINR(summary.totalAllocatedToEvents)} allocated across events`
                : 'Click Set Wedding Budget to configure'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAE6E1] p-5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#86736D]">
              <span>Total Committed Spend</span>
              <span className="w-7 h-7 rounded-lg bg-[#F8ECE8] flex items-center justify-center text-sm">
                🧾
              </span>
            </div>
            <p className="font-serif text-2xl sm:text-[26px] font-bold text-[#1A1C18] mt-2">
              {formatCurrencyINR(summary?.totalSpent ?? '0')}
            </p>
            <p className="text-xs text-[#6B5F57] mt-1">
              {summary?.expenseCount ?? 0} active{' '}
              {(summary?.expenseCount ?? 0) === 1 ? 'expense' : 'expenses'}
              {(summary?.cancelledCount ?? 0) > 0
                ? ` · ${summary?.cancelledCount} cancelled excluded`
                : ''}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAE6E1] p-5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#556251]">
              <span>Amount Paid</span>
              <span className="w-7 h-7 rounded-lg bg-[#EAF4EA] flex items-center justify-center text-sm">
                ✓
              </span>
            </div>
            <p className="font-serif text-2xl sm:text-[26px] font-bold text-[#2F6B38] mt-2">
              {formatCurrencyINR(summary?.totalPaid ?? '0')}
            </p>
            <p className="text-xs text-[#6B5F57] mt-1">
              {summary?.paymentCompletionPercent ?? 0}% settled ·{' '}
              {formatCurrencyINR(summary?.totalPending ?? '0')} pending
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAE6E1] p-5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#A66E22]">
              <span>Remaining Budget</span>
              <span className="w-7 h-7 rounded-lg bg-[#FEF4E4] flex items-center justify-center text-sm">
                ⚖
              </span>
            </div>
            <p
              className={`font-serif text-2xl sm:text-[26px] font-bold mt-2 ${
                summary?.isOverBudget ? 'text-[#A8382B]' : 'text-[#1A1C18]'
              }`}
            >
              {hasBudgetConfigured && summary ? formatCurrencyINR(summary.remainingBudget) : '—'}
            </p>
            <p className="text-xs text-[#6B5F57] mt-1">
              {hasBudgetConfigured && summary
                ? `${summary.budgetUtilizationPercent}% of total cap committed`
                : 'Set a total budget to track remaining balance'}
            </p>
          </div>
        </div>

        {/* Budget Progress Bar */}
        {hasBudgetConfigured && summary && (
          <div className="bg-white rounded-2xl border border-[#EAE6E1] p-4 sm:p-5 shadow-2xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#1A1C18]">
                Overall Budget Utilization ({summary.budgetUtilizationPercent}%)
              </span>
              <span className="text-[#5C5D59]">
                {formatCurrencyINR(summary.totalSpent)} committed of{' '}
                {formatCurrencyINR(summary.totalBudget)}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-[#EFECE7] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  summary.isOverBudget
                    ? 'bg-[#A8382B]'
                    : summary.budgetUtilizationPercent >= 85
                      ? 'bg-[#B7791F]'
                      : 'bg-[#556251]'
                }`}
                style={{ width: `${utilizationBarWidth}%` }}
              />
            </div>
          </div>
        )}

        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE6E1] pb-3">
          <div className="flex flex-wrap items-center gap-2" role="tablist">
            {(
              [
                { id: 'ledger', label: 'Expenses Ledger' },
                { id: 'budgets', label: 'Budget Planner' },
                { id: 'analytics', label: 'Reports & Analytics' },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => switchTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#8D493A] text-white shadow-xs'
                      : 'bg-white text-[#5C5D59] border border-[#EAE6E1] hover:text-[#1A1C18] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'ledger' && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#DED8D0] text-xs font-semibold text-[#1A1C18] hover:bg-[#FAF8F5] cursor-pointer"
            >
              ⬇ Export CSV
            </button>
          )}
        </div>

        {/* TAB 1: EXPENSES LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="bg-white rounded-2xl border border-[#EAE6E1] p-4 shadow-2xs space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4">
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search title, vendor, ceremony, or reference..."
                    aria-label="Search expenses"
                    className="w-full rounded-xl bg-[#FAF8F5] border border-[#DED8D0] px-3.5 py-2 text-sm text-[#1A1C18] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value as ExpenseCategory | '');
                      setPage(1);
                    }}
                    aria-label="Filter by category"
                    className="w-full rounded-xl bg-[#FAF8F5] border border-[#DED8D0] px-3 py-2 text-sm text-[#1A1C18]"
                  >
                    <option value="">All Categories</option>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_META[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <select
                    value={eventFilter}
                    onChange={(e) => {
                      setEventFilter(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter by ceremony"
                    className="w-full rounded-xl bg-[#FAF8F5] border border-[#DED8D0] px-3 py-2 text-sm text-[#1A1C18]"
                  >
                    <option value="">All Ceremonies</option>
                    <option value="unassigned">General Wedding</option>
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as ExpensePaymentStatus | '');
                      setPage(1);
                    }}
                    aria-label="Filter by payment status"
                    className="w-full rounded-xl bg-[#FAF8F5] border border-[#DED8D0] px-3 py-2 text-sm text-[#1A1C18]"
                  >
                    <option value="">All Statuses</option>
                    {EXPENSE_PAYMENT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {PAYMENT_STATUS_META[st].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <select
                    value={`${sortBy}:${sortOrder}`}
                    onChange={(e) => {
                      const [by, ord] = e.target.value.split(':') as [
                        'spentAt' | 'amount' | 'paidAmount' | 'title',
                        'asc' | 'desc',
                      ];
                      setSortBy(by);
                      setSortOrder(ord);
                      setPage(1);
                    }}
                    aria-label="Sort expenses"
                    className="w-full rounded-xl bg-[#FAF8F5] border border-[#DED8D0] px-3 py-2 text-sm text-[#1A1C18]"
                  >
                    <option value="spentAt:desc">Newest Date</option>
                    <option value="spentAt:asc">Oldest Date</option>
                    <option value="amount:desc">Highest Amount</option>
                    <option value="amount:asc">Lowest Amount</option>
                    <option value="title:asc">Title (A-Z)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={vendorFilter}
                    onChange={(e) => {
                      setVendorFilter(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter by vendor"
                    className="rounded-lg bg-[#FAF8F5] border border-[#DED8D0] px-2.5 py-1.5 text-xs text-[#1A1C18]"
                  >
                    <option value="">All Vendors</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={methodFilter}
                    onChange={(e) => {
                      setMethodFilter(e.target.value as ExpensePaymentMethod | '');
                      setPage(1);
                    }}
                    aria-label="Filter by payment method"
                    className="rounded-lg bg-[#FAF8F5] border border-[#DED8D0] px-2.5 py-1.5 text-xs text-[#1A1C18]"
                  >
                    <option value="">All Payment Methods</option>
                    {EXPENSE_PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[#86736D]">From</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setPage(1);
                      }}
                      aria-label="From date"
                      className="rounded-lg bg-[#FAF8F5] border border-[#DED8D0] px-2 py-1 text-xs"
                    />
                    <span className="text-[#86736D]">To</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setPage(1);
                      }}
                      aria-label="To date"
                      className="rounded-lg bg-[#FAF8F5] border border-[#DED8D0] px-2 py-1 text-xs"
                    />
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-xs font-semibold text-[#8D493A] hover:underline cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {filteredTotals && (
                  <div className="text-[#5C5D59]">
                    Matching Total:{' '}
                    <span className="font-semibold text-[#1A1C18]">
                      {formatCurrencyINR(filteredTotals.filteredAmount)}
                    </span>{' '}
                    · Paid:{' '}
                    <span className="font-semibold text-[#2F6B38]">
                      {formatCurrencyINR(filteredTotals.filteredPaidAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Ledger List */}
            {expensesQuery.isLoading ? (
              <div className="bg-white rounded-2xl border border-[#EAE6E1] p-12 text-center text-sm text-[#5C5D59]">
                Loading wedding expense ledger...
              </div>
            ) : expensesQuery.isError ? (
              <div className="bg-white rounded-2xl border border-[#F6C8C2] p-8 text-center text-sm text-[#A8382B]">
                Unable to load expenses. Please refresh and try again.
              </div>
            ) : expensesList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-[#D8C2BB] p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#F5EFE9] text-[#8D493A] flex items-center justify-center text-xl mx-auto">
                  💳
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1A1C18]">
                  {hasActiveFilters ? 'No matching expenses found' : 'No expenses recorded yet'}
                </h3>
                <p className="text-xs sm:text-sm text-[#5C5D59] max-w-md mx-auto">
                  {hasActiveFilters
                    ? 'Try widening your filters or clearing search keywords.'
                    : 'Start logging venue deposits, catering advances, and decor contracts to keep every rupee accounted for.'}
                </p>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 rounded-xl border border-[#DED8D0] text-xs font-semibold text-[#1A1C18] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExpense(null);
                      setExpenseModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#8D493A] text-white text-sm font-semibold hover:bg-[#763B2E] cursor-pointer"
                  >
                    + Log First Expense
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-2xl border border-[#EAE6E1] shadow-2xs overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#EAE6E1] bg-[#FAF8F5] text-[11px] uppercase tracking-wider text-[#86736D]">
                        <th className="py-3.5 px-4 font-semibold">Expense</th>
                        <th className="py-3.5 px-4 font-semibold">Ceremony & Vendor</th>
                        <th className="py-3.5 px-4 font-semibold">Date</th>
                        <th className="py-3.5 px-4 font-semibold">Status</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Paid / Due</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F2EE] text-sm">
                      {expensesList.map((exp) => {
                        const catMeta = CATEGORY_META[exp.category] ?? CATEGORY_META.OTHER;
                        const statusMeta =
                          PAYMENT_STATUS_META[exp.paymentStatus] ?? PAYMENT_STATUS_META.PENDING;
                        return (
                          <tr key={exp.id} className="hover:bg-[#FAF8F5]/70 transition-colors">
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => setDetailExpense(exp)}
                                className="font-semibold text-[#1A1C18] hover:text-[#8D493A] text-left cursor-pointer"
                              >
                                {exp.title}
                              </button>
                              <div className="mt-1">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${catMeta.pillBg} ${catMeta.pillText}`}
                                >
                                  {catMeta.label}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-[#4A4640]">
                              <p className="font-medium text-[#1A1C18]">
                                {exp.eventName ?? 'General Wedding'}
                              </p>
                              <p className="text-[#86736D] mt-0.5">
                                {exp.vendorName ?? 'Direct / Unassigned'}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-[#5C5D59] whitespace-nowrap">
                              <p>{formatShortDate(exp.spentAt)}</p>
                              {exp.dueDate && (
                                <p className="text-[11px] text-[#86736D]">
                                  Due {formatShortDate(exp.dueDate)}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.badgeClass}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`}
                                />
                                {statusMeta.label}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-semibold text-[#1A1C18] whitespace-nowrap">
                              {formatCurrencyINR(exp.amount)}
                            </td>
                            <td className="py-3.5 px-4 text-right text-xs whitespace-nowrap">
                              <p className="font-semibold text-[#2F6B38]">
                                {formatCurrencyINR(exp.paidAmount)}
                              </p>
                              {Number(exp.remainingAmount) > 0 && (
                                <p className="text-[#8D493A]">
                                  Due {formatCurrencyINR(exp.remainingAmount)}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {exp.paymentStatus !== 'PAID' &&
                                  exp.paymentStatus !== 'CANCELLED' && (
                                    <button
                                      type="button"
                                      disabled={markingPaidId === exp.id}
                                      onClick={() => handleQuickMarkPaid(exp)}
                                      className="px-2.5 py-1 rounded-lg bg-[#EAF4EA] text-[#2F6B38] text-xs font-semibold hover:bg-[#D7ECD7] disabled:opacity-60 cursor-pointer"
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                <button
                                  type="button"
                                  onClick={() => setDetailExpense(exp)}
                                  className="px-2.5 py-1 rounded-lg border border-[#EAE6E1] text-xs font-medium text-[#5C5D59] hover:text-[#1A1C18] hover:bg-white cursor-pointer"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingExpense(exp);
                                    setExpenseModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-[#EAE6E1] text-xs font-medium text-[#5C5D59] hover:text-[#1A1C18] hover:bg-white cursor-pointer"
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

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {expensesList.map((exp) => {
                    const catMeta = CATEGORY_META[exp.category] ?? CATEGORY_META.OTHER;
                    const statusMeta =
                      PAYMENT_STATUS_META[exp.paymentStatus] ?? PAYMENT_STATUS_META.PENDING;
                    return (
                      <div
                        key={exp.id}
                        className="bg-white rounded-2xl border border-[#EAE6E1] p-4 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <button
                              type="button"
                              onClick={() => setDetailExpense(exp)}
                              className="font-semibold text-[#1A1C18] text-left"
                            >
                              {exp.title}
                            </button>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${catMeta.pillBg} ${catMeta.pillText}`}
                              >
                                {catMeta.label}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusMeta.badgeClass}`}
                              >
                                {statusMeta.label}
                              </span>
                            </div>
                          </div>
                          <span className="font-serif text-lg font-bold text-[#1A1C18] shrink-0">
                            {formatCurrencyINR(exp.amount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#6B5F57]">
                          <span>
                            {exp.eventName ?? 'General'} · {formatShortDate(exp.spentAt)}
                          </span>
                          <span className="text-[#2F6B38] font-medium">
                            Paid {formatCurrencyINR(exp.paidAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F4F2EE]">
                          <button
                            type="button"
                            onClick={() => setDetailExpense(exp)}
                            className="px-3 py-1.5 rounded-lg border border-[#EAE6E1] text-xs font-medium text-[#1A1C18]"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExpense(exp);
                              setExpenseModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#8D493A] text-white text-xs font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 text-xs text-[#5C5D59]">
                    <span>
                      Page {pagination.page} of {pagination.totalPages} ({pagination.total}{' '}
                      expenses)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={pagination.page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#DED8D0] font-medium disabled:opacity-50 cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#DED8D0] font-medium disabled:opacity-50 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: BUDGET PLANNER */}
        {activeTab === 'budgets' && (
          <div className="space-y-6">
            {/* Overall Wedding Budget Card */}
            <div className="bg-white rounded-2xl border border-[#EAE6E1] p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8D493A]">
                  Master Wedding Financial Plan
                </p>
                <h2 className="font-serif text-2xl font-bold text-[#1A1C18]">
                  {hasBudgetConfigured && budgetOverview
                    ? `${formatCurrencyINR(budgetOverview.weddingBudget.totalBudget)} Target Cap`
                    : 'No Master Wedding Budget Configured'}
                </h2>
                <p className="text-xs sm:text-sm text-[#5C5D59] max-w-2xl">
                  {budgetOverview?.weddingBudget.notes ||
                    'Set an overall ceiling and allocate individual targets for each ceremony so you always know how much headroom remains.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <div className="px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6E1] text-xs">
                  <span className="text-[#86736D] block">Unallocated Pool</span>
                  <span className="font-serif text-base font-bold text-[#1A1C18]">
                    {formatCurrencyINR(budgetOverview?.summary.unallocatedBudget ?? '0')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBudgetModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#8D493A] text-white text-sm font-semibold hover:bg-[#763B2E] cursor-pointer"
                >
                  {hasBudgetConfigured ? 'Update Total Cap' : 'Set Total Budget'}
                </button>
              </div>
            </div>

            {/* Event-by-Event Budget Grid */}
            <div className="space-y-3">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1A1C18]">
                  Ceremony Budget Allocations
                </h3>
                <p className="text-xs sm:text-sm text-[#5C5D59]">
                  Assign spending ceilings per wedding ceremony and monitor live burn rate.
                </p>
              </div>

              {(budgetOverview?.eventBudgets ?? []).length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-[#D8C2BB] p-10 text-center text-sm text-[#5C5D59]">
                  Create wedding ceremonies in Events first to allocate event-specific budgets.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(budgetOverview?.eventBudgets ?? []).map((evt) => {
                    const isEditingThis = editingEventBudgetId === evt.eventId;
                    const barWidth = Math.min(100, evt.utilizationPercent);

                    return (
                      <div
                        key={evt.eventId}
                        className="bg-white rounded-2xl border border-[#EAE6E1] p-5 shadow-2xs space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif text-lg font-bold text-[#1A1C18]">
                                {evt.eventName}
                              </h4>
                              {evt.isOverBudget && (
                                <span className="px-2 py-0.5 rounded-full bg-[#FDECEA] text-[#A8382B] text-[10px] font-semibold">
                                  Over Budget
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#86736D]">
                              {evt.expenseCount} {evt.expenseCount === 1 ? 'expense' : 'expenses'} ·
                              Paid {formatCurrencyINR(evt.paidAmount)}
                            </p>
                          </div>

                          {!isEditingThis && (
                            <button
                              type="button"
                              onClick={() => startEditingEventBudget(evt)}
                              className="px-3 py-1.5 rounded-xl border border-[#DED8D0] text-xs font-semibold text-[#1A1C18] hover:bg-[#FAF8F5] cursor-pointer"
                            >
                              {evt.hasAllocatedBudget ? 'Adjust Cap' : 'Set Cap'}
                            </button>
                          )}
                        </div>

                        {isEditingThis ? (
                          <div className="bg-[#FAF8F5] rounded-xl border border-[#EAE6E1] p-3.5 space-y-3">
                            <div>
                              <label
                                htmlFor={`event-budget-${evt.eventId}`}
                                className="block text-[11px] font-semibold uppercase tracking-wider text-[#5C5D59] mb-1"
                              >
                                Allocated Budget (₹ INR)
                              </label>
                              <input
                                id={`event-budget-${evt.eventId}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={eventBudgetAmount}
                                onChange={(e) => setEventBudgetAmount(e.target.value)}
                                placeholder="500000"
                                className="w-full rounded-xl bg-white border border-[#DED8D0] px-3 py-2 text-sm font-semibold"
                              />
                            </div>
                            <input
                              type="text"
                              value={eventBudgetNotes}
                              onChange={(e) => setEventBudgetNotes(e.target.value)}
                              placeholder="Allocation note (optional)"
                              className="w-full rounded-xl bg-white border border-[#DED8D0] px-3 py-2 text-xs"
                            />
                            <div className="flex items-center justify-between gap-2">
                              {evt.hasAllocatedBudget ? (
                                <button
                                  type="button"
                                  disabled={savingEventBudget}
                                  onClick={() => handleRemoveEventBudget(evt.eventId)}
                                  className="text-xs text-[#A8382B] font-medium hover:underline cursor-pointer"
                                >
                                  Clear Budget
                                </button>
                              ) : (
                                <span />
                              )}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingEventBudgetId(null)}
                                  className="px-3 py-1.5 rounded-lg text-xs text-[#5C5D59] hover:bg-[#EFECE7] cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={savingEventBudget}
                                  onClick={() => handleSaveEventBudget(evt.eventId)}
                                  className="px-4 py-1.5 rounded-lg bg-[#8D493A] text-white text-xs font-semibold hover:bg-[#763B2E] disabled:opacity-60 cursor-pointer"
                                >
                                  {savingEventBudget ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-[#86736D] block">Allocated</span>
                                <span className="font-semibold text-[#1A1C18]">
                                  {evt.hasAllocatedBudget
                                    ? formatCurrencyINR(evt.allocatedBudget)
                                    : 'Unset'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#86736D] block">Spent</span>
                                <span className="font-semibold text-[#8D493A]">
                                  {formatCurrencyINR(evt.spentAmount)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#86736D] block">Remaining</span>
                                <span
                                  className={`font-semibold ${
                                    evt.isOverBudget ? 'text-[#A8382B]' : 'text-[#2F6B38]'
                                  }`}
                                >
                                  {evt.hasAllocatedBudget
                                    ? formatCurrencyINR(evt.remainingBudget)
                                    : '—'}
                                </span>
                              </div>
                            </div>

                            {evt.hasAllocatedBudget && (
                              <div className="space-y-1">
                                <div className="h-2 rounded-full bg-[#EFECE7] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      evt.isOverBudget
                                        ? 'bg-[#A8382B]'
                                        : evt.utilizationPercent >= 85
                                          ? 'bg-[#B7791F]'
                                          : 'bg-[#556251]'
                                    }`}
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                                <p className="text-[11px] text-[#6B5F57] text-right">
                                  {evt.utilizationPercent}% utilized
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* General Wedding Expenses Summary */}
              {budgetOverview && budgetOverview.unassignedEventExpenses.expenseCount > 0 && (
                <div className="bg-white rounded-2xl border border-[#EAE6E1] p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="font-serif text-base font-bold text-[#1A1C18]">
                      General Wedding Expenses (Not Tied to a Specific Event)
                    </h4>
                    <p className="text-xs text-[#6B5F57]">
                      Attire, jewellery, invitations, shared hospitality, and miscellaneous charges
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-serif text-lg font-bold text-[#1A1C18]">
                      {formatCurrencyINR(budgetOverview.unassignedEventExpenses.spentAmount)}
                    </p>
                    <p className="text-[#2F6B38]">
                      Paid {formatCurrencyINR(budgetOverview.unassignedEventExpenses.paidAmount)} (
                      {budgetOverview.unassignedEventExpenses.expenseCount} items)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REPORTS & ANALYTICS */}
        {activeTab === 'analytics' && analytics && (
          <ExpenseAnalyticsCharts analytics={analytics} onExportCsv={handleExportCsv} />
        )}
      </div>

      {/* Modals */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSaved={() => refreshAllFinancialData()}
        expense={editingExpense}
        events={events}
        vendors={vendors}
        defaultEventId={eventFilter && eventFilter !== 'unassigned' ? eventFilter : null}
        onVendorCreated={() => void queryClient.invalidateQueries({ queryKey: ['vendors'] })}
      />

      <ExpenseDetailModal
        expense={detailExpense}
        isOpen={Boolean(detailExpense)}
        onClose={() => setDetailExpense(null)}
        onEdit={(exp) => {
          setEditingExpense(exp);
          setExpenseModalOpen(true);
        }}
        onUpdated={(updated) => {
          setDetailExpense(updated);
          refreshAllFinancialData();
        }}
        onDeleted={() => refreshAllFinancialData()}
      />

      <BudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        onSaved={() => refreshAllFinancialData()}
        overview={budgetOverview}
      />
    </>
  );
}
