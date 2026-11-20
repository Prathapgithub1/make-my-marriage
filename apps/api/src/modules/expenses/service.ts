import { Prisma, type PrismaClient } from '../../generated/prisma/client';
import { AppError } from '../../shared/app-error';
import { formatPaiseToDecimal, parseMoneyToPaise } from './money';
import type {
  CreateExpenseInput,
  ExpenseCategoryValue,
  ExpensePaymentMethodValue,
  ExpensePaymentStatusValue,
  ListExpensesQuery,
  RecordPaymentInput,
  UpdateExpenseInput,
  UpsertEventBudgetInput,
  UpsertWeddingBudgetInput,
} from './schemas';

export interface ExpenseDTO {
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
  category: ExpenseCategoryValue;
  amount: string;
  paidAmount: string;
  remainingAmount: string;
  currency: string;
  paymentStatus: ExpensePaymentStatusValue;
  paymentMethod: ExpensePaymentMethodValue | null;
  spentAt: string;
  dueDate: string | null;
  paidBy: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListExpensesResult {
  expenses: ExpenseDTO[];
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

export interface WeddingBudgetDTO {
  weddingId: string;
  totalBudget: string;
  currency: string;
  notes: string | null;
  hasBudgetConfigured: boolean;
  updatedAt: string | null;
}

export interface EventBudgetDTO {
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

export interface BudgetOverviewDTO {
  weddingBudget: WeddingBudgetDTO;
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
  eventBudgets: EventBudgetDTO[];
  unassignedEventExpenses: {
    spentAmount: string;
    paidAmount: string;
    pendingAmount: string;
    expenseCount: number;
  };
}

export interface ExpenseAnalyticsDTO {
  summary: BudgetOverviewDTO['summary'] & {
    hasBudgetConfigured: boolean;
    currency: string;
    vendorCount: number;
  };
  byCategory: Array<{
    category: ExpenseCategoryValue;
    count: number;
    totalAmount: string;
    paidAmount: string;
    pendingAmount: string;
    sharePercent: number;
  }>;
  byEvent: EventBudgetDTO[];
  unassignedEventExpenses: BudgetOverviewDTO['unassignedEventExpenses'];
  byPaymentStatus: Array<{
    paymentStatus: ExpensePaymentStatusValue;
    count: number;
    totalAmount: string;
    paidAmount: string;
  }>;
  byPaymentMethod: Array<{
    paymentMethod: ExpensePaymentMethodValue | 'UNSPECIFIED';
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

export interface ExpensesServiceOperations {
  listExpenses(userId: string, query: ListExpensesQuery): Promise<ListExpensesResult>;
  getExpense(userId: string, expenseId: string): Promise<ExpenseDTO>;
  createExpense(userId: string, input: CreateExpenseInput): Promise<ExpenseDTO>;
  updateExpense(userId: string, expenseId: string, input: UpdateExpenseInput): Promise<ExpenseDTO>;
  recordPayment(userId: string, expenseId: string, input: RecordPaymentInput): Promise<ExpenseDTO>;
  deleteExpense(userId: string, expenseId: string): Promise<{ deleted: true }>;
  getBudgetOverview(userId: string): Promise<BudgetOverviewDTO>;
  upsertWeddingBudget(userId: string, input: UpsertWeddingBudgetInput): Promise<WeddingBudgetDTO>;
  upsertEventBudget(
    userId: string,
    eventId: string,
    input: UpsertEventBudgetInput,
  ): Promise<EventBudgetDTO>;
  deleteEventBudget(userId: string, eventId: string): Promise<{ deleted: true }>;
  getSummaryAndAnalytics(userId: string): Promise<ExpenseAnalyticsDTO>;
}

function todayKolkataDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function toUtcDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

const EXPENSE_INCLUDE = {
  event: { select: { id: true, name: true } },
  vendor: { select: { id: true, name: true, category: true } },
  createdByUser: { select: { id: true, displayName: true } },
} satisfies Prisma.ExpenseInclude;

type ExpenseWithRelations = Prisma.ExpenseGetPayload<{ include: typeof EXPENSE_INCLUDE }>;

export function createExpensesService(prisma: PrismaClient | undefined): ExpensesServiceOperations {
  function requireDb(): PrismaClient {
    if (!prisma) {
      throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database is not configured.');
    }
    return prisma;
  }

  async function resolveCallerWorkspace(userId: string) {
    const db = requireDb();
    const membership = await db.weddingMembership.findFirst({
      where: { userId },
      select: { weddingId: true, role: true },
    });

    if (!membership) {
      throw new AppError(404, 'WEDDING_NOT_FOUND', 'Create or join a wedding workspace first.');
    }

    return membership;
  }

  async function validateAssociations(
    weddingId: string,
    refs: { eventId?: string | null; vendorId?: string | null },
  ) {
    const db = requireDb();
    if (refs.eventId) {
      const event = await db.event.findFirst({
        where: { id: refs.eventId, weddingId },
        select: { id: true },
      });
      if (!event) {
        throw new AppError(
          400,
          'INVALID_ASSOCIATION',
          'Selected event does not belong to this wedding.',
          { eventId: 'Selected event could not be found in this wedding.' },
        );
      }
    }

    if (refs.vendorId) {
      const vendor = await db.vendor.findFirst({
        where: { id: refs.vendorId, weddingId },
        select: { id: true },
      });
      if (!vendor) {
        throw new AppError(
          400,
          'INVALID_ASSOCIATION',
          'Selected vendor does not belong to this wedding.',
          { vendorId: 'Selected vendor could not be found in this wedding.' },
        );
      }
    }
  }

  function mapExpense(row: ExpenseWithRelations): ExpenseDTO {
    const amountPaise = parseMoneyToPaise(row.amount.toString());
    const paidPaise = parseMoneyToPaise(row.paidAmount.toString());
    const remainingPaise = Math.max(0, amountPaise - paidPaise);

    return {
      id: row.id,
      weddingId: row.weddingId,
      eventId: row.eventId,
      eventName: row.event?.name ?? null,
      vendorId: row.vendorId,
      vendorName: row.vendor?.name ?? null,
      vendorCategory: row.vendor?.category ?? null,
      createdByUserId: row.createdByUserId,
      createdByName: row.createdByUser?.displayName ?? null,
      title: row.title,
      category: row.category as ExpenseCategoryValue,
      amount: formatPaiseToDecimal(amountPaise),
      paidAmount: formatPaiseToDecimal(paidPaise),
      remainingAmount: formatPaiseToDecimal(remainingPaise),
      currency: row.currency,
      paymentStatus: row.paymentStatus as ExpensePaymentStatusValue,
      paymentMethod: (row.paymentMethod as ExpensePaymentMethodValue | null) ?? null,
      spentAt: toDateString(row.spentAt),
      dueDate: row.dueDate ? toDateString(row.dueDate) : null,
      paidBy: row.paidBy,
      referenceNumber: row.referenceNumber,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async function computeBudgetAndAnalyticsData(weddingId: string) {
    const db = requireDb();
    const [weddingBudgetRow, eventBudgetRows, events, expenses, vendorCount] = await Promise.all([
      db.weddingBudget.findUnique({
        where: { weddingId },
      }),
      db.eventBudget.findMany({
        where: { weddingId },
      }),
      db.event.findMany({
        where: { weddingId },
        orderBy: [{ startsAt: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, startsAt: true, status: true },
      }),
      db.expense.findMany({
        where: { weddingId },
        include: {
          event: { select: { id: true, name: true } },
          vendor: { select: { id: true, name: true, category: true } },
        },
        orderBy: [{ spentAt: 'asc' }, { createdAt: 'asc' }],
      }),
      db.vendor.count({ where: { weddingId } }),
    ]);

    const hasBudgetConfigured = Boolean(weddingBudgetRow);
    const totalBudgetPaise = weddingBudgetRow
      ? parseMoneyToPaise(weddingBudgetRow.totalBudget.toString())
      : 0;
    const currency = weddingBudgetRow?.currency ?? 'INR';

    const eventBudgetByEventId = new Map(eventBudgetRows.map((eb) => [eb.eventId, eb]));

    let totalAllocatedToEventsPaise = 0;
    for (const eb of eventBudgetRows) {
      totalAllocatedToEventsPaise += parseMoneyToPaise(eb.allocatedBudget.toString());
    }

    let totalSpentPaise = 0;
    let totalPaidPaise = 0;
    let activeCount = 0;
    let cancelledCount = 0;
    let cancelledAmountPaise = 0;
    let overdueCount = 0;
    let overdueAmountPaise = 0;

    const categoryMap = new Map<
      ExpenseCategoryValue,
      { count: number; totalPaise: number; paidPaise: number }
    >();
    const eventSpendMap = new Map<
      string,
      { count: number; spentPaise: number; paidPaise: number }
    >();
    const unassignedEventSpend = { count: 0, spentPaise: 0, paidPaise: 0 };
    const statusMap = new Map<
      ExpensePaymentStatusValue,
      { count: number; totalPaise: number; paidPaise: number }
    >();
    const methodMap = new Map<
      ExpensePaymentMethodValue | 'UNSPECIFIED',
      { count: number; totalPaise: number; paidPaise: number }
    >();
    const vendorMap = new Map<
      string,
      {
        vendorId: string | null;
        vendorName: string;
        count: number;
        totalPaise: number;
        paidPaise: number;
      }
    >();
    const monthMap = new Map<string, { count: number; totalPaise: number; paidPaise: number }>();

    for (const exp of expenses) {
      const amtPaise = parseMoneyToPaise(exp.amount.toString());
      const paidPaise = parseMoneyToPaise(exp.paidAmount.toString());
      const status = exp.paymentStatus as ExpensePaymentStatusValue;

      const statusEntry = statusMap.get(status) ?? { count: 0, totalPaise: 0, paidPaise: 0 };
      statusEntry.count += 1;
      statusEntry.totalPaise += amtPaise;
      statusEntry.paidPaise += paidPaise;
      statusMap.set(status, statusEntry);

      if (status === 'CANCELLED') {
        cancelledCount += 1;
        cancelledAmountPaise += amtPaise;
        continue;
      }

      activeCount += 1;
      totalSpentPaise += amtPaise;
      totalPaidPaise += paidPaise;

      if (status === 'OVERDUE') {
        overdueCount += 1;
        overdueAmountPaise += Math.max(0, amtPaise - paidPaise);
      }

      const category = exp.category as ExpenseCategoryValue;
      const catEntry = categoryMap.get(category) ?? { count: 0, totalPaise: 0, paidPaise: 0 };
      catEntry.count += 1;
      catEntry.totalPaise += amtPaise;
      catEntry.paidPaise += paidPaise;
      categoryMap.set(category, catEntry);

      if (exp.eventId) {
        const evtEntry = eventSpendMap.get(exp.eventId) ?? {
          count: 0,
          spentPaise: 0,
          paidPaise: 0,
        };
        evtEntry.count += 1;
        evtEntry.spentPaise += amtPaise;
        evtEntry.paidPaise += paidPaise;
        eventSpendMap.set(exp.eventId, evtEntry);
      } else {
        unassignedEventSpend.count += 1;
        unassignedEventSpend.spentPaise += amtPaise;
        unassignedEventSpend.paidPaise += paidPaise;
      }

      const methodKey: ExpensePaymentMethodValue | 'UNSPECIFIED' =
        (exp.paymentMethod as ExpensePaymentMethodValue | null) ?? 'UNSPECIFIED';
      const methodEntry = methodMap.get(methodKey) ?? { count: 0, totalPaise: 0, paidPaise: 0 };
      methodEntry.count += 1;
      methodEntry.totalPaise += amtPaise;
      methodEntry.paidPaise += paidPaise;
      methodMap.set(methodKey, methodEntry);

      const vendorKey = exp.vendorId ?? '__unassigned__';
      const vendorEntry = vendorMap.get(vendorKey) ?? {
        vendorId: exp.vendorId,
        vendorName: exp.vendor?.name ?? 'Direct / Unassigned',
        count: 0,
        totalPaise: 0,
        paidPaise: 0,
      };
      vendorEntry.count += 1;
      vendorEntry.totalPaise += amtPaise;
      vendorEntry.paidPaise += paidPaise;
      vendorMap.set(vendorKey, vendorEntry);

      const monthKey = toDateString(exp.spentAt).slice(0, 7);
      const monthEntry = monthMap.get(monthKey) ?? { count: 0, totalPaise: 0, paidPaise: 0 };
      monthEntry.count += 1;
      monthEntry.totalPaise += amtPaise;
      monthEntry.paidPaise += paidPaise;
      monthMap.set(monthKey, monthEntry);
    }

    const totalPendingPaise = Math.max(0, totalSpentPaise - totalPaidPaise);
    const remainingBudgetPaise = totalBudgetPaise - totalSpentPaise;
    const isOverBudget = hasBudgetConfigured && totalSpentPaise > totalBudgetPaise;
    const overBudgetAmountPaise = isOverBudget ? totalSpentPaise - totalBudgetPaise : 0;
    const budgetUtilizationPercent =
      totalBudgetPaise > 0 ? Math.round((totalSpentPaise / totalBudgetPaise) * 1000) / 10 : 0;
    const paymentCompletionPercent =
      totalSpentPaise > 0 ? Math.round((totalPaidPaise / totalSpentPaise) * 1000) / 10 : 0;

    const eventBudgets: EventBudgetDTO[] = events.map((event) => {
      const budgetRow = eventBudgetByEventId.get(event.id);
      const allocatedPaise = budgetRow
        ? parseMoneyToPaise(budgetRow.allocatedBudget.toString())
        : 0;
      const spend = eventSpendMap.get(event.id) ?? { count: 0, spentPaise: 0, paidPaise: 0 };
      const pendingPaise = Math.max(0, spend.spentPaise - spend.paidPaise);
      const eventRemainingPaise = allocatedPaise - spend.spentPaise;
      const eventUtilization =
        allocatedPaise > 0 ? Math.round((spend.spentPaise / allocatedPaise) * 1000) / 10 : 0;

      return {
        eventId: event.id,
        eventName: event.name,
        startsAt: event.startsAt ? event.startsAt.toISOString() : null,
        eventStatus: event.status,
        allocatedBudget: formatPaiseToDecimal(allocatedPaise),
        hasAllocatedBudget: Boolean(budgetRow),
        spentAmount: formatPaiseToDecimal(spend.spentPaise),
        paidAmount: formatPaiseToDecimal(spend.paidPaise),
        pendingAmount: formatPaiseToDecimal(pendingPaise),
        remainingBudget: formatPaiseToDecimal(eventRemainingPaise),
        utilizationPercent: eventUtilization,
        isOverBudget: Boolean(budgetRow) && spend.spentPaise > allocatedPaise,
        expenseCount: spend.count,
        notes: budgetRow?.notes ?? null,
      };
    });

    const summary = {
      totalBudget: formatPaiseToDecimal(totalBudgetPaise),
      totalAllocatedToEvents: formatPaiseToDecimal(totalAllocatedToEventsPaise),
      unallocatedBudget: formatPaiseToDecimal(totalBudgetPaise - totalAllocatedToEventsPaise),
      totalSpent: formatPaiseToDecimal(totalSpentPaise),
      totalPaid: formatPaiseToDecimal(totalPaidPaise),
      totalPending: formatPaiseToDecimal(totalPendingPaise),
      remainingBudget: formatPaiseToDecimal(remainingBudgetPaise),
      budgetUtilizationPercent,
      paymentCompletionPercent,
      isOverBudget,
      overBudgetAmount: formatPaiseToDecimal(overBudgetAmountPaise),
      expenseCount: activeCount,
      totalRecordCount: expenses.length,
      cancelledCount,
      cancelledAmount: formatPaiseToDecimal(cancelledAmountPaise),
      overdueCount,
      overdueAmount: formatPaiseToDecimal(overdueAmountPaise),
    };

    const byCategory = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        totalAmount: formatPaiseToDecimal(stats.totalPaise),
        paidAmount: formatPaiseToDecimal(stats.paidPaise),
        pendingAmount: formatPaiseToDecimal(Math.max(0, stats.totalPaise - stats.paidPaise)),
        sharePercent:
          totalSpentPaise > 0 ? Math.round((stats.totalPaise / totalSpentPaise) * 1000) / 10 : 0,
      }))
      .sort((a, b) => parseMoneyToPaise(b.totalAmount) - parseMoneyToPaise(a.totalAmount));

    const byPaymentStatus = Array.from(statusMap.entries()).map(([paymentStatus, stats]) => ({
      paymentStatus,
      count: stats.count,
      totalAmount: formatPaiseToDecimal(stats.totalPaise),
      paidAmount: formatPaiseToDecimal(stats.paidPaise),
    }));

    const byPaymentMethod = Array.from(methodMap.entries())
      .map(([paymentMethod, stats]) => ({
        paymentMethod,
        count: stats.count,
        totalAmount: formatPaiseToDecimal(stats.totalPaise),
        paidAmount: formatPaiseToDecimal(stats.paidPaise),
      }))
      .sort((a, b) => parseMoneyToPaise(b.totalAmount) - parseMoneyToPaise(a.totalAmount));

    const byVendor = Array.from(vendorMap.values())
      .map((stats) => ({
        vendorId: stats.vendorId,
        vendorName: stats.vendorName,
        count: stats.count,
        totalAmount: formatPaiseToDecimal(stats.totalPaise),
        paidAmount: formatPaiseToDecimal(stats.paidPaise),
      }))
      .sort((a, b) => parseMoneyToPaise(b.totalAmount) - parseMoneyToPaise(a.totalAmount));

    const monthlyTrend = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stats]) => ({
        month,
        label: formatMonthLabel(month),
        count: stats.count,
        totalAmount: formatPaiseToDecimal(stats.totalPaise),
        paidAmount: formatPaiseToDecimal(stats.paidPaise),
      }));

    return {
      weddingBudget: {
        weddingId,
        totalBudget: formatPaiseToDecimal(totalBudgetPaise),
        currency,
        notes: weddingBudgetRow?.notes ?? null,
        hasBudgetConfigured,
        updatedAt: weddingBudgetRow ? weddingBudgetRow.updatedAt.toISOString() : null,
      },
      summary: {
        ...summary,
        hasBudgetConfigured,
        currency,
        vendorCount,
      },
      eventBudgets,
      unassignedEventExpenses: {
        spentAmount: formatPaiseToDecimal(unassignedEventSpend.spentPaise),
        paidAmount: formatPaiseToDecimal(unassignedEventSpend.paidPaise),
        pendingAmount: formatPaiseToDecimal(
          Math.max(0, unassignedEventSpend.spentPaise - unassignedEventSpend.paidPaise),
        ),
        expenseCount: unassignedEventSpend.count,
      },
      byCategory,
      byPaymentStatus,
      byPaymentMethod,
      byVendor,
      monthlyTrend,
    };
  }

  return {
    async listExpenses(userId: string, query: ListExpensesQuery): Promise<ListExpensesResult> {
      const { weddingId } = await resolveCallerWorkspace(userId);
      const where: Prisma.ExpenseWhereInput = { weddingId };

      if (query.category) where.category = query.category;
      if (query.eventId === 'unassigned') {
        where.eventId = null;
      } else if (query.eventId) {
        where.eventId = query.eventId;
      }
      if (query.vendorId) where.vendorId = query.vendorId;
      if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
      if (query.paymentMethod) where.paymentMethod = query.paymentMethod;

      if (query.from || query.to) {
        where.spentAt = {
          ...(query.from ? { gte: toUtcDate(query.from) } : {}),
          ...(query.to ? { lte: toUtcDate(query.to) } : {}),
        };
      }

      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { notes: { contains: query.search, mode: 'insensitive' } },
          { paidBy: { contains: query.search, mode: 'insensitive' } },
          { referenceNumber: { contains: query.search, mode: 'insensitive' } },
          { vendor: { name: { contains: query.search, mode: 'insensitive' } } },
          { event: { name: { contains: query.search, mode: 'insensitive' } } },
        ];
      }

      const skip = (query.page - 1) * query.limit;
      const db = requireDb();

      const [total, rows, allMatchingForTotals] = await Promise.all([
        db.expense.count({ where }),
        db.expense.findMany({
          where,
          include: EXPENSE_INCLUDE,
          orderBy: [{ [query.sortBy]: query.sortOrder }, { createdAt: 'desc' }],
          skip,
          take: query.limit,
        }),
        db.expense.findMany({
          where,
          select: { amount: true, paidAmount: true, paymentStatus: true },
        }),
      ]);

      let filteredAmountPaise = 0;
      let filteredPaidPaise = 0;
      for (const item of allMatchingForTotals) {
        if (item.paymentStatus === 'CANCELLED') continue;
        filteredAmountPaise += parseMoneyToPaise(item.amount.toString());
        filteredPaidPaise += parseMoneyToPaise(item.paidAmount.toString());
      }

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return {
        expenses: rows.map(mapExpense),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
        },
        totals: {
          filteredAmount: formatPaiseToDecimal(filteredAmountPaise),
          filteredPaidAmount: formatPaiseToDecimal(filteredPaidPaise),
          filteredRemainingAmount: formatPaiseToDecimal(
            Math.max(0, filteredAmountPaise - filteredPaidPaise),
          ),
        },
      };
    },

    async getExpense(userId: string, expenseId: string): Promise<ExpenseDTO> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);
      const row = await db.expense.findFirst({
        where: { id: expenseId, weddingId },
        include: EXPENSE_INCLUDE,
      });

      if (!row) {
        throw new AppError(404, 'EXPENSE_NOT_FOUND', 'Expense could not be found.');
      }

      return mapExpense(row);
    },

    async createExpense(userId: string, input: CreateExpenseInput): Promise<ExpenseDTO> {
      const { weddingId } = await resolveCallerWorkspace(userId);
      await validateAssociations(weddingId, {
        eventId: input.eventId,
        vendorId: input.vendorId,
      });

      const amountPaise = input.amount;
      let paidPaise = input.paidAmount;
      if (paidPaise === undefined) {
        paidPaise = input.paymentStatus === 'PAID' ? amountPaise : 0;
      }

      if (paidPaise > amountPaise) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Paid amount cannot exceed total amount.', {
          paidAmount: 'Paid amount cannot exceed total expense amount.',
        });
      }

      const spentAtDate = toUtcDate(input.spentAt ?? todayKolkataDateString());
      const dueDate = input.dueDate ? toUtcDate(input.dueDate) : null;

      const db = requireDb();
      const created = await db.expense.create({
        data: {
          weddingId,
          eventId: input.eventId ?? null,
          vendorId: input.vendorId ?? null,
          createdByUserId: userId,
          title: input.title,
          category: input.category,
          amount: formatPaiseToDecimal(amountPaise),
          paidAmount: formatPaiseToDecimal(paidPaise),
          currency: 'INR',
          paymentStatus: input.paymentStatus,
          paymentMethod: input.paymentMethod ?? null,
          spentAt: spentAtDate,
          dueDate,
          paidBy: input.paidBy ?? null,
          referenceNumber: input.referenceNumber ?? null,
          notes: input.notes ?? null,
        },
        include: EXPENSE_INCLUDE,
      });

      return mapExpense(created);
    },

    async updateExpense(
      userId: string,
      expenseId: string,
      input: UpdateExpenseInput,
    ): Promise<ExpenseDTO> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);
      const existing = await db.expense.findFirst({
        where: { id: expenseId, weddingId },
      });

      if (!existing) {
        throw new AppError(404, 'EXPENSE_NOT_FOUND', 'Expense could not be found.');
      }

      await validateAssociations(weddingId, {
        eventId: input.eventId,
        vendorId: input.vendorId,
      });

      const existingAmountPaise = parseMoneyToPaise(existing.amount.toString());
      const existingPaidPaise = parseMoneyToPaise(existing.paidAmount.toString());

      const nextAmountPaise = input.amount ?? existingAmountPaise;
      const nextStatus =
        input.paymentStatus ?? (existing.paymentStatus as ExpensePaymentStatusValue);

      let nextPaidPaise = existingPaidPaise;
      if (input.paidAmount !== undefined) {
        nextPaidPaise = input.paidAmount;
      } else if (input.paymentStatus === 'PAID') {
        nextPaidPaise = nextAmountPaise;
      } else if (input.paymentStatus === 'PENDING' && existing.paymentStatus === 'PAID') {
        nextPaidPaise = 0;
      }

      if (nextPaidPaise > nextAmountPaise) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Paid amount cannot exceed total amount.', {
          paidAmount: 'Paid amount cannot exceed total expense amount.',
        });
      }

      if (
        nextStatus === 'PAID' &&
        input.paidAmount !== undefined &&
        nextPaidPaise !== nextAmountPaise
      ) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Paid amount must equal total amount when marked PAID.',
          { paidAmount: 'Paid amount must match total amount when status is PAID.' },
        );
      }

      const data: Prisma.ExpenseUpdateInput = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.category !== undefined) data.category = input.category;
      if (input.amount !== undefined) data.amount = formatPaiseToDecimal(nextAmountPaise);
      if (
        input.paidAmount !== undefined ||
        (input.paymentStatus === 'PAID' && nextPaidPaise !== existingPaidPaise) ||
        (input.paymentStatus === 'PENDING' && existing.paymentStatus === 'PAID')
      ) {
        data.paidAmount = formatPaiseToDecimal(nextPaidPaise);
      }
      if (input.paymentStatus !== undefined) data.paymentStatus = input.paymentStatus;
      if (input.paymentMethod !== undefined) data.paymentMethod = input.paymentMethod;
      if (input.spentAt !== undefined) data.spentAt = toUtcDate(input.spentAt);
      if (input.dueDate !== undefined)
        data.dueDate = input.dueDate ? toUtcDate(input.dueDate) : null;
      if (input.eventId !== undefined) {
        data.event = input.eventId ? { connect: { id: input.eventId } } : { disconnect: true };
      }
      if (input.vendorId !== undefined) {
        data.vendor = input.vendorId ? { connect: { id: input.vendorId } } : { disconnect: true };
      }
      if (input.paidBy !== undefined) data.paidBy = input.paidBy;
      if (input.referenceNumber !== undefined) data.referenceNumber = input.referenceNumber;
      if (input.notes !== undefined) data.notes = input.notes;

      const updated = await db.expense.update({
        where: { id: existing.id },
        data,
        include: EXPENSE_INCLUDE,
      });

      return mapExpense(updated);
    },

    async recordPayment(
      userId: string,
      expenseId: string,
      input: RecordPaymentInput,
    ): Promise<ExpenseDTO> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);
      const existing = await db.expense.findFirst({
        where: { id: expenseId, weddingId },
      });

      if (!existing) {
        throw new AppError(404, 'EXPENSE_NOT_FOUND', 'Expense could not be found.');
      }

      if (existing.paymentStatus === 'CANCELLED') {
        throw new AppError(
          400,
          'INVALID_EXPENSE_STATE',
          'Cancelled expenses cannot record payments.',
        );
      }

      const amountPaise = parseMoneyToPaise(existing.amount.toString());
      if (input.paidAmount > amountPaise) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Paid amount cannot exceed total amount.', {
          paidAmount: 'Paid amount cannot exceed total expense amount.',
        });
      }

      let derivedStatus: ExpensePaymentStatusValue = 'PENDING';
      if (input.paidAmount === amountPaise) {
        derivedStatus = 'PAID';
      } else if (input.paidAmount > 0) {
        derivedStatus = 'PARTIAL';
      }

      const updated = await db.expense.update({
        where: { id: existing.id },
        data: {
          paidAmount: formatPaiseToDecimal(input.paidAmount),
          paymentStatus: derivedStatus,
          ...(input.paymentMethod !== undefined ? { paymentMethod: input.paymentMethod } : {}),
          ...(input.paidBy !== undefined ? { paidBy: input.paidBy } : {}),
          ...(input.referenceNumber !== undefined
            ? { referenceNumber: input.referenceNumber }
            : {}),
        },
        include: EXPENSE_INCLUDE,
      });

      return mapExpense(updated);
    },

    async deleteExpense(userId: string, expenseId: string): Promise<{ deleted: true }> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);
      const existing = await db.expense.findFirst({
        where: { id: expenseId, weddingId },
        select: { id: true },
      });

      if (!existing) {
        throw new AppError(404, 'EXPENSE_NOT_FOUND', 'Expense could not be found.');
      }

      await db.expense.delete({ where: { id: existing.id } });
      return { deleted: true };
    },

    async getBudgetOverview(userId: string): Promise<BudgetOverviewDTO> {
      const { weddingId } = await resolveCallerWorkspace(userId);
      const data = await computeBudgetAndAnalyticsData(weddingId);

      return {
        weddingBudget: data.weddingBudget,
        summary: {
          totalBudget: data.summary.totalBudget,
          totalAllocatedToEvents: data.summary.totalAllocatedToEvents,
          unallocatedBudget: data.summary.unallocatedBudget,
          totalSpent: data.summary.totalSpent,
          totalPaid: data.summary.totalPaid,
          totalPending: data.summary.totalPending,
          remainingBudget: data.summary.remainingBudget,
          budgetUtilizationPercent: data.summary.budgetUtilizationPercent,
          paymentCompletionPercent: data.summary.paymentCompletionPercent,
          isOverBudget: data.summary.isOverBudget,
          overBudgetAmount: data.summary.overBudgetAmount,
          expenseCount: data.summary.expenseCount,
          totalRecordCount: data.summary.totalRecordCount,
          cancelledCount: data.summary.cancelledCount,
          cancelledAmount: data.summary.cancelledAmount,
          overdueCount: data.summary.overdueCount,
          overdueAmount: data.summary.overdueAmount,
        },
        eventBudgets: data.eventBudgets,
        unassignedEventExpenses: data.unassignedEventExpenses,
      };
    },

    async upsertWeddingBudget(
      userId: string,
      input: UpsertWeddingBudgetInput,
    ): Promise<WeddingBudgetDTO> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);
      const saved = await db.weddingBudget.upsert({
        where: { weddingId },
        create: {
          weddingId,
          totalBudget: formatPaiseToDecimal(input.totalBudget),
          currency: input.currency,
          notes: input.notes ?? null,
        },
        update: {
          totalBudget: formatPaiseToDecimal(input.totalBudget),
          currency: input.currency,
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
      });

      return {
        weddingId: saved.weddingId,
        totalBudget: formatPaiseToDecimal(parseMoneyToPaise(saved.totalBudget.toString())),
        currency: saved.currency,
        notes: saved.notes,
        hasBudgetConfigured: true,
        updatedAt: saved.updatedAt.toISOString(),
      };
    },

    async upsertEventBudget(
      userId: string,
      eventId: string,
      input: UpsertEventBudgetInput,
    ): Promise<EventBudgetDTO> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);
      const event = await db.event.findFirst({
        where: { id: eventId, weddingId },
        select: { id: true },
      });

      if (!event) {
        throw new AppError(404, 'EVENT_NOT_FOUND', 'Event could not be found in this wedding.');
      }

      await db.eventBudget.upsert({
        where: { eventId },
        create: {
          weddingId,
          eventId,
          allocatedBudget: formatPaiseToDecimal(input.allocatedBudget),
          notes: input.notes ?? null,
        },
        update: {
          allocatedBudget: formatPaiseToDecimal(input.allocatedBudget),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
      });

      const overview = await computeBudgetAndAnalyticsData(weddingId);
      const updatedEventBudget = overview.eventBudgets.find((eb) => eb.eventId === eventId);
      if (!updatedEventBudget) {
        throw new AppError(404, 'EVENT_NOT_FOUND', 'Event could not be found in this wedding.');
      }
      return updatedEventBudget;
    },

    async deleteEventBudget(userId: string, eventId: string): Promise<{ deleted: true }> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);
      const existing = await db.eventBudget.findFirst({
        where: { eventId, weddingId },
        select: { id: true },
      });

      if (!existing) {
        throw new AppError(404, 'EVENT_BUDGET_NOT_FOUND', 'Event budget could not be found.');
      }

      await db.eventBudget.delete({ where: { id: existing.id } });
      return { deleted: true };
    },

    async getSummaryAndAnalytics(userId: string): Promise<ExpenseAnalyticsDTO> {
      const { weddingId } = await resolveCallerWorkspace(userId);
      const data = await computeBudgetAndAnalyticsData(weddingId);

      return {
        summary: data.summary,
        byCategory: data.byCategory,
        byEvent: data.eventBudgets,
        unassignedEventExpenses: data.unassignedEventExpenses,
        byPaymentStatus: data.byPaymentStatus,
        byPaymentMethod: data.byPaymentMethod,
        byVendor: data.byVendor,
        monthlyTrend: data.monthlyTrend,
      };
    },
  };
}
