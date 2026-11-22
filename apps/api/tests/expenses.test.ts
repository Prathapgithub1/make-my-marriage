import express from 'express';
import request from 'supertest';
import { AppError } from '../src/shared/app-error';
import type { AuthOperations } from '../src/modules/auth/routes';
import { createCsrfToken } from '../src/modules/auth/security';
import { createExpensesRouter } from '../src/modules/expenses/routes';
import {
  createExpensesService,
  type BudgetOverviewDTO,
  type ExpenseAnalyticsDTO,
  type ExpenseDTO,
  type ExpensesServiceOperations,
} from '../src/modules/expenses/service';
import { createVendorsRouter } from '../src/modules/vendors/routes';
import {
  createVendorsService,
  type VendorDTO,
  type VendorsServiceOperations,
} from '../src/modules/vendors/service';
import { formatPaiseToDecimal, parseMoneyToPaise } from '../src/modules/expenses/money';

const mockUser = {
  id: '3a986e0b-9d8f-41b1-925a-5ad8d8137652',
  email: 'aisha@example.com',
  displayName: 'Aisha Rao',
};

const WEDDING_ID = '11111111-2222-3333-4444-555555555555';
const EVENT_ID_1 = 'aaaaaaaa-1111-4111-8111-111111111111';
const EVENT_ID_2 = 'aaaaaaaa-2222-4222-8222-222222222222';
const VENDOR_ID_1 = 'bbbbbbbb-1111-4111-8111-111111111111';
const EXPENSE_ID_1 = 'cccccccc-1111-4111-8111-111111111111';

const sampleExpense: ExpenseDTO = {
  id: EXPENSE_ID_1,
  weddingId: WEDDING_ID,
  eventId: EVENT_ID_1,
  eventName: 'Sangeet Night',
  vendorId: VENDOR_ID_1,
  vendorName: 'Royal Heritage Catering',
  vendorCategory: 'CATERING',
  createdByUserId: mockUser.id,
  createdByName: mockUser.displayName,
  title: 'Sangeet Live Counters Advance',
  category: 'CATERING',
  amount: '250000.00',
  paidAmount: '100000.00',
  remainingAmount: '150000.00',
  currency: 'INR',
  paymentStatus: 'PARTIAL',
  paymentMethod: 'BANK_TRANSFER',
  spentAt: '2026-11-10',
  dueDate: '2026-12-01',
  paidBy: 'Aisha Rao',
  referenceNumber: 'NEFT-987654',
  notes: 'Includes chaat and dessert counters',
  createdAt: '2026-11-10T10:00:00.000Z',
  updatedAt: '2026-11-10T10:00:00.000Z',
};

const sampleBudgetOverview: BudgetOverviewDTO = {
  weddingBudget: {
    weddingId: WEDDING_ID,
    totalBudget: '2500000.00',
    currency: 'INR',
    notes: 'Total celebration target',
    hasBudgetConfigured: true,
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  summary: {
    totalBudget: '2500000.00',
    totalAllocatedToEvents: '1500000.00',
    unallocatedBudget: '1000000.00',
    totalSpent: '250000.00',
    totalPaid: '100000.00',
    totalPending: '150000.00',
    remainingBudget: '2250000.00',
    budgetUtilizationPercent: 10,
    paymentCompletionPercent: 40,
    isOverBudget: false,
    overBudgetAmount: '0.00',
    expenseCount: 1,
    totalRecordCount: 1,
    cancelledCount: 0,
    cancelledAmount: '0.00',
    overdueCount: 0,
    overdueAmount: '0.00',
  },
  eventBudgets: [],
  unassignedEventExpenses: {
    spentAmount: '0.00',
    paidAmount: '0.00',
    pendingAmount: '0.00',
    expenseCount: 0,
  },
};

const sampleAnalytics: ExpenseAnalyticsDTO = {
  summary: {
    ...sampleBudgetOverview.summary,
    hasBudgetConfigured: true,
    currency: 'INR',
    vendorCount: 1,
  },
  byCategory: [
    {
      category: 'CATERING',
      count: 1,
      totalAmount: '250000.00',
      paidAmount: '100000.00',
      pendingAmount: '150000.00',
      sharePercent: 100,
    },
  ],
  byEvent: [],
  unassignedEventExpenses: sampleBudgetOverview.unassignedEventExpenses,
  byPaymentStatus: [
    {
      paymentStatus: 'PARTIAL',
      count: 1,
      totalAmount: '250000.00',
      paidAmount: '100000.00',
    },
  ],
  byPaymentMethod: [
    {
      paymentMethod: 'BANK_TRANSFER',
      count: 1,
      totalAmount: '250000.00',
      paidAmount: '100000.00',
    },
  ],
  byVendor: [
    {
      vendorId: VENDOR_ID_1,
      vendorName: 'Royal Heritage Catering',
      count: 1,
      totalAmount: '250000.00',
      paidAmount: '100000.00',
    },
  ],
  monthlyTrend: [
    {
      month: '2026-11',
      label: 'Nov 2026',
      count: 1,
      totalAmount: '250000.00',
      paidAmount: '100000.00',
    },
  ],
};

const sampleVendor: VendorDTO = {
  id: VENDOR_ID_1,
  weddingId: WEDDING_ID,
  name: 'Royal Heritage Catering',
  category: 'CATERING',
  contactName: 'Vikram Singh',
  phone: '+91 9876543210',
  email: 'bookings@royalheritage.in',
  website: 'https://royalheritage.in',
  address: null,
  city: 'Bengaluru',
  state: 'Karnataka',
  coverImageUrl: null,
  description: null,
  pricing: null,
  priceRange: 'PREMIUM',
  rating: 4.9,
  status: 'CONFIRMED',
  isFavorite: true,
  notes: 'Preferred banquet partner',
  services: [],
  events: [],
  bookingsCount: 1,
  totalAgreed: '250000.00',
  totalPaid: '250000.00',
  balanceDue: '0.00',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

function buildTestApp(
  expenseOverrides: Partial<ExpensesServiceOperations> = {},
  vendorOverrides: Partial<VendorsServiceOperations> = {},
) {
  const expensesService: ExpensesServiceOperations = {
    listExpenses: jest.fn(async () => ({
      expenses: [sampleExpense],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      totals: {
        filteredAmount: '250000.00',
        filteredPaidAmount: '100000.00',
        filteredRemainingAmount: '150000.00',
      },
    })),
    getExpense: jest.fn(async () => sampleExpense),
    createExpense: jest.fn(async () => sampleExpense),
    updateExpense: jest.fn(async () => sampleExpense),
    recordPayment: jest.fn(async () => ({
      ...sampleExpense,
      paidAmount: '250000.00',
      remainingAmount: '0.00',
      paymentStatus: 'PAID' as const,
    })),
    deleteExpense: jest.fn(async () => ({ deleted: true as const })),
    getBudgetOverview: jest.fn(async () => sampleBudgetOverview),
    upsertWeddingBudget: jest.fn(async () => sampleBudgetOverview.weddingBudget),
    upsertEventBudget: jest.fn(async (_userId, eventId) => ({
      eventId,
      eventName: 'Sangeet Night',
      startsAt: '2026-12-10T18:00:00.000Z',
      eventStatus: 'PLANNED',
      allocatedBudget: '600000.00',
      hasAllocatedBudget: true,
      spentAmount: '250000.00',
      paidAmount: '100000.00',
      pendingAmount: '150000.00',
      remainingBudget: '350000.00',
      utilizationPercent: 41.7,
      isOverBudget: false,
      expenseCount: 1,
      notes: null,
    })),
    deleteEventBudget: jest.fn(async () => ({ deleted: true as const })),
    getSummaryAndAnalytics: jest.fn(async () => sampleAnalytics),
    ...expenseOverrides,
  };

  const vendorsService: VendorsServiceOperations = {
    listVendors: jest.fn(async () => ({
      vendors: [sampleVendor],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    })),
    getVendor: jest.fn(async () => sampleVendor),
    createVendor: jest.fn(async () => sampleVendor),
    updateVendor: jest.fn(async () => sampleVendor),
    deleteVendor: jest.fn(async () => ({ deleted: true as const })),
    toggleFavorite: jest.fn(async () => ({ isFavorite: true })),
    updateStatus: jest.fn(async () => ({ status: 'CONFIRMED' as const })),
    createService: jest.fn(),
    deleteService: jest.fn(async () => ({ deleted: true as const })),
    listBookings: jest.fn(async () => []),
    getBooking: jest.fn(),
    createBooking: jest.fn(),
    updateBooking: jest.fn(),
    deleteBooking: jest.fn(async () => ({ deleted: true as const })),
    listPayments: jest.fn(async () => []),
    recordPayment: jest.fn(),
    getDashboardAnalytics: jest.fn(),
    getComparison: jest.fn(async () => [sampleVendor]),
    getCalendar: jest.fn(async () => []),
    ...vendorOverrides,
  };

  const authService: AuthOperations = {
    createCsrfToken,
    signup: jest.fn(),
    login: jest.fn(),
    authenticate: jest.fn(async (token) => (token === 'valid-session' ? mockUser : null)),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    consumeRateLimit: jest.fn(async () => true),
  };

  const app = express();
  app.use(express.json());
  app.use('/api/v1/expenses', createExpensesRouter(expensesService, authService));
  app.use('/api/v1/vendors', createVendorsRouter(vendorsService, authService));
  app.use(
    (err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
      void next;
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          error: {
            code: err.code,
            message: err.message,
            ...(err.details ? { details: err.details } : {}),
          },
          requestId: 'test-req-id',
        });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Boom' } });
    },
  );

  return { app, expensesService, vendorsService };
}

function authHeaders(csrfToken = createCsrfToken()) {
  return {
    Origin: 'http://localhost:1234',
    Cookie: `mmm_session=valid-session; mmm_csrf=${csrfToken}`,
    'X-CSRF-Token': csrfToken,
  };
}

describe('Money arithmetic precision utilities', () => {
  it('parses and formats exact monetary amounts without floating point drift', () => {
    expect(parseMoneyToPaise('1845000.50')).toBe(184500050);
    expect(parseMoneyToPaise('0.10') + parseMoneyToPaise('0.20')).toBe(30);
    expect(formatPaiseToDecimal(30)).toBe('0.30');
    expect(formatPaiseToDecimal(-150050)).toBe('-1500.50');
  });
});

describe('Expenses & Budgets REST API Router', () => {
  it('rejects unauthenticated requests across expenses, budgets, and vendors', async () => {
    const { app } = buildTestApp();
    const res1 = await request(app).get('/api/v1/expenses');
    const res2 = await request(app).get('/api/v1/expenses/budget');
    const res3 = await request(app).get('/api/v1/vendors');

    expect(res1.status).toBe(401);
    expect(res2.status).toBe(401);
    expect(res3.status).toBe(401);
  });

  it('enforces CSRF protection on mutating endpoints', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/v1/expenses')
      .set('Origin', 'http://localhost:1234')
      .set('Cookie', 'mmm_session=valid-session')
      .send({ title: 'Flowers', amount: 15000 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_REJECTED');
  });

  it('creates an expense with validated payload and returns 201', async () => {
    const { app, expensesService } = buildTestApp();

    const res = await request(app).post('/api/v1/expenses').set(authHeaders()).send({
      title: 'Sangeet Live Counters Advance',
      category: 'CATERING',
      amount: 250000,
      paidAmount: 100000,
      paymentStatus: 'PARTIAL',
      paymentMethod: 'BANK_TRANSFER',
      spentAt: '2026-11-10',
      dueDate: '2026-12-01',
      eventId: EVENT_ID_1,
      vendorId: VENDOR_ID_1,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Sangeet Live Counters Advance');
    expect(expensesService.createExpense).toHaveBeenCalledWith(
      mockUser.id,
      expect.objectContaining({
        amount: 25000000,
        paidAmount: 10000000,
        paymentStatus: 'PARTIAL',
      }),
    );
  });

  it('rejects negative/zero expense amounts, paidAmount > amount, and invalid dates', async () => {
    const { app } = buildTestApp();
    const headers = authHeaders();

    const zeroAmount = await request(app)
      .post('/api/v1/expenses')
      .set(headers)
      .send({ title: 'Zero item', amount: 0 });
    expect(zeroAmount.status).toBe(400);
    expect(zeroAmount.body.error.code).toBe('VALIDATION_ERROR');

    const overPaid = await request(app).post('/api/v1/expenses').set(headers).send({
      title: 'Overpaid item',
      amount: 5000,
      paidAmount: 6000,
      paymentStatus: 'PARTIAL',
    });
    expect(overPaid.status).toBe(400);
    expect(overPaid.body.error.details.paidAmount).toMatch(/cannot exceed/i);

    const invalidDate = await request(app).post('/api/v1/expenses').set(headers).send({
      title: 'Bad Date',
      amount: 5000,
      spentAt: '2026-02-30',
    });
    expect(invalidDate.status).toBe(400);
  });

  it('validates UUID route parameters on expense and event budget endpoints', async () => {
    const { app } = buildTestApp();
    const headers = authHeaders();

    const badExpense = await request(app).get('/api/v1/expenses/not-a-uuid').set(headers);
    expect(badExpense.status).toBe(400);

    const badEventBudget = await request(app)
      .put('/api/v1/expenses/budget/events/invalid-id')
      .set(headers)
      .send({ allocatedBudget: 500000 });
    expect(badEventBudget.status).toBe(400);
  });

  it('records installment payments and upserts wedding/event budgets', async () => {
    const { app, expensesService } = buildTestApp();
    const headers = authHeaders();

    const payRes = await request(app)
      .patch(`/api/v1/expenses/${EXPENSE_ID_1}/payment`)
      .set(headers)
      .send({ paidAmount: 250000, paymentMethod: 'UPI' });

    expect(payRes.status).toBe(200);
    expect(payRes.body.data.paymentStatus).toBe('PAID');

    const budgetRes = await request(app)
      .put('/api/v1/expenses/budget')
      .set(headers)
      .send({ totalBudget: 3000000, currency: 'INR', notes: 'Updated total' });

    expect(budgetRes.status).toBe(200);
    expect(expensesService.upsertWeddingBudget).toHaveBeenCalledWith(
      mockUser.id,
      expect.objectContaining({ totalBudget: 300000000, currency: 'INR' }),
    );

    const eventBudgetRes = await request(app)
      .put(`/api/v1/expenses/budget/events/${EVENT_ID_1}`)
      .set(headers)
      .send({ allocatedBudget: 600000 });

    expect(eventBudgetRes.status).toBe(200);
    expect(eventBudgetRes.body.data.allocatedBudget).toBe('600000.00');
  });

  it('returns analytics summary and vendors CRUD responses', async () => {
    const { app } = buildTestApp();
    const headers = authHeaders();

    const analyticsRes = await request(app).get('/api/v1/expenses/analytics').set(headers);
    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.data.byCategory).toHaveLength(1);
    expect(analyticsRes.body.data.byVendor[0].vendorName).toBe('Royal Heritage Catering');

    const vendorRes = await request(app)
      .post('/api/v1/vendors')
      .set(headers)
      .send({ name: 'Floral Artisans', category: 'DECORATION', phone: '+91 9811122233' });
    expect(vendorRes.status).toBe(201);
  });
});

describe('Expenses & Vendors Service Business Logic & Tenant Isolation', () => {
  function createMockPrisma() {
    const expensesRows = [
      {
        id: EXPENSE_ID_1,
        weddingId: WEDDING_ID,
        eventId: EVENT_ID_1,
        vendorId: VENDOR_ID_1,
        createdByUserId: mockUser.id,
        title: 'Venue Booking',
        category: 'VENUE',
        amount: { toString: () => '1200000.00' },
        paidAmount: { toString: () => '500000.00' },
        currency: 'INR',
        paymentStatus: 'PARTIAL',
        paymentMethod: 'BANK_TRANSFER',
        spentAt: new Date('2026-11-05T00:00:00.000Z'),
        dueDate: new Date('2026-12-01T00:00:00.000Z'),
        paidBy: 'Aisha',
        referenceNumber: 'UTR-101',
        notes: null,
        createdAt: new Date('2026-11-05T10:00:00.000Z'),
        updatedAt: new Date('2026-11-05T10:00:00.000Z'),
        event: { id: EVENT_ID_1, name: 'Wedding Ceremony' },
        vendor: { id: VENDOR_ID_1, name: 'Udaipur Palace', category: 'VENUE' },
        createdByUser: { id: mockUser.id, displayName: mockUser.displayName },
      },
      {
        id: 'cccccccc-2222-4222-8222-222222222222',
        weddingId: WEDDING_ID,
        eventId: EVENT_ID_1,
        vendorId: null,
        createdByUserId: mockUser.id,
        title: 'Cancelled Florist Deposit',
        category: 'DECORATION',
        amount: { toString: () => '300000.00' },
        paidAmount: { toString: () => '0.00' },
        currency: 'INR',
        paymentStatus: 'CANCELLED',
        paymentMethod: null,
        spentAt: new Date('2026-11-06T00:00:00.000Z'),
        dueDate: null,
        paidBy: null,
        referenceNumber: null,
        notes: null,
        createdAt: new Date('2026-11-06T10:00:00.000Z'),
        updatedAt: new Date('2026-11-06T10:00:00.000Z'),
        event: { id: EVENT_ID_1, name: 'Wedding Ceremony' },
        vendor: null,
        createdByUser: { id: mockUser.id, displayName: mockUser.displayName },
      },
    ];

    const prismaMock = {
      weddingMembership: {
        findFirst: jest.fn(async () => ({ weddingId: WEDDING_ID, role: 'ADMIN' })),
      },
      weddingBudget: {
        findUnique: jest.fn(async () => ({
          id: 'wb-1',
          weddingId: WEDDING_ID,
          totalBudget: { toString: () => '1000000.00' },
          currency: 'INR',
          notes: 'Initial cap',
          createdAt: new Date('2026-11-01T00:00:00.000Z'),
          updatedAt: new Date('2026-11-01T00:00:00.000Z'),
        })),
      },
      eventBudget: {
        findMany: jest.fn(async () => [
          {
            id: 'eb-1',
            weddingId: WEDDING_ID,
            eventId: EVENT_ID_1,
            allocatedBudget: { toString: () => '1000000.00' },
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
        findFirst: jest.fn(async () => null),
      },
      event: {
        findFirst: jest.fn(async ({ where }: { where: { id: string; weddingId: string } }) =>
          where.id === EVENT_ID_1 && where.weddingId === WEDDING_ID ? { id: EVENT_ID_1 } : null,
        ),
        findMany: jest.fn(async () => [
          {
            id: EVENT_ID_1,
            name: 'Wedding Ceremony',
            startsAt: new Date('2026-12-15T18:00:00.000Z'),
            status: 'CONFIRMED',
          },
          {
            id: EVENT_ID_2,
            name: 'Haldi',
            startsAt: new Date('2026-12-14T10:00:00.000Z'),
            status: 'PLANNED',
          },
        ]),
      },
      vendor: {
        findFirst: jest.fn(async () => null),
        count: jest.fn(async () => 1),
      },
      expense: {
        findMany: jest.fn(async () => expensesRows),
        findFirst: jest.fn(async ({ where }: { where: { id: string; weddingId: string } }) =>
          where.id === EXPENSE_ID_1 && where.weddingId === WEDDING_ID ? expensesRows[0] : null,
        ),
        update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          ...expensesRows[0],
          ...data,
          amount: expensesRows[0].amount,
          paidAmount: { toString: () => String(data.paidAmount ?? '1200000.00') },
        })),
      },
    };

    return prismaMock;
  }

  it('excludes cancelled expenses from totals and detects over-budget condition accurately', async () => {
    const prismaMock = createMockPrisma();
    const service = createExpensesService(prismaMock as never);

    const analytics = await service.getSummaryAndAnalytics(mockUser.id);

    expect(analytics.summary.totalBudget).toBe('1000000.00');
    expect(analytics.summary.totalSpent).toBe('1200000.00'); // cancelled 300k excluded
    expect(analytics.summary.totalPaid).toBe('500000.00');
    expect(analytics.summary.totalPending).toBe('700000.00');
    expect(analytics.summary.remainingBudget).toBe('-200000.00');
    expect(analytics.summary.isOverBudget).toBe(true);
    expect(analytics.summary.overBudgetAmount).toBe('200000.00');
    expect(analytics.summary.budgetUtilizationPercent).toBe(120);
    expect(analytics.summary.cancelledCount).toBe(1);
    expect(analytics.summary.cancelledAmount).toBe('300000.00');
    expect(analytics.byEvent[0].isOverBudget).toBe(true);
    expect(analytics.byEvent[0].remainingBudget).toBe('-200000.00');
  });

  it('prevents cross-wedding event/vendor associations when creating expenses', async () => {
    const prismaMock = createMockPrisma();
    const service = createExpensesService(prismaMock as never);

    await expect(
      service.createExpense(mockUser.id, {
        title: 'Cross-tenant hijack attempt',
        category: 'DECORATION',
        amount: 5000000,
        paymentStatus: 'PENDING',
        eventId: 'dddddddd-9999-4999-8999-999999999999',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_ASSOCIATION',
    });
  });

  it('rejects recording payment exceeding total expense amount and transitions status automatically', async () => {
    const prismaMock = createMockPrisma();
    const service = createExpensesService(prismaMock as never);

    await expect(
      service.recordPayment(mockUser.id, EXPENSE_ID_1, {
        paidAmount: 130000000,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });

    const settled = await service.recordPayment(mockUser.id, EXPENSE_ID_1, {
      paidAmount: 120000000,
      paymentMethod: 'UPI',
    });
    expect(settled.paymentStatus).toBe('PAID');
    expect(settled.remainingAmount).toBe('0.00');
  });

  it('returns 404 when accessing another wedding vendor or deleting missing vendor', async () => {
    const prismaMock = createMockPrisma();
    const vendorsService = createVendorsService(prismaMock as never);

    await expect(
      vendorsService.getVendor(mockUser.id, '99999999-9999-4999-8999-999999999999'),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'VENDOR_NOT_FOUND',
    });
  });
});
