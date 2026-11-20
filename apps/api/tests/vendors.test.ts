import express from 'express';
import request from 'supertest';
import { AppError } from '../src/shared/app-error';
import type { AuthOperations } from '../src/modules/auth/routes';
import { createCsrfToken } from '../src/modules/auth/security';
import { createVendorsRouter } from '../src/modules/vendors/routes';
import {
  createVendorsService,
  type VendorDTO,
  type VendorBookingDTO,
  type VendorPaymentDTO,
  type VendorDashboardAnalytics,
  type VendorsServiceOperations,
} from '../src/modules/vendors/service';

const mockUser = {
  id: '3a986e0b-9d8f-41b1-925a-5ad8d8137652',
  email: 'aisha@example.com',
  displayName: 'Aisha Rao',
};

const WEDDING_ID = '11111111-2222-3333-4444-555555555555';
const VENDOR_ID_1 = 'bbbbbbbb-1111-4111-8111-111111111111';
const BOOKING_ID_1 = 'cccccccc-1111-4111-8111-111111111111';
const EVENT_ID_1 = 'aaaaaaaa-1111-4111-8111-111111111111';

const sampleVendor: VendorDTO = {
  id: VENDOR_ID_1,
  weddingId: WEDDING_ID,
  name: 'Royal Heritage Decorators',
  category: 'DECORATION',
  contactName: 'Vikram Singh',
  phone: '+91 9876543210',
  email: 'vikram@royaldecor.in',
  website: 'https://royaldecor.in',
  address: 'MG Road, Central Palace',
  city: 'Bangalore',
  state: 'Karnataka',
  coverImageUrl: 'https://images.unsplash.com/photo-decor.jpg',
  description: 'Luxury royal mandap and floral styling experts.',
  pricing: '₹3,50,000 package base',
  priceRange: 'PREMIUM',
  rating: 4.9,
  status: 'CONFIRMED',
  isFavorite: true,
  notes: 'Mandap CAD design approved by couple.',
  services: [
    {
      id: 'dddddddd-1111-4111-8111-111111111111',
      name: 'Grand Stage & Mandap Setup',
      description: 'Includes stage rigging, crystal chandeliers and floral arch',
      price: '250000.00',
      isIncluded: true,
    },
  ],
  events: [{ id: EVENT_ID_1, name: 'Sangeet & Wedding' }],
  bookingsCount: 1,
  totalAgreed: '250000.00',
  totalPaid: '100000.00',
  balanceDue: '150000.00',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

const sampleBooking: VendorBookingDTO = {
  id: BOOKING_ID_1,
  weddingId: WEDDING_ID,
  vendorId: VENDOR_ID_1,
  vendorName: 'Royal Heritage Decorators',
  category: 'DECORATION',
  eventId: EVENT_ID_1,
  eventName: 'Sangeet & Wedding',
  expenseId: 'eeeeeeee-1111-4111-8111-111111111111',
  serviceName: 'Stage & Mandap Decor',
  status: 'CONFIRMED',
  bookingDate: '2026-11-05',
  serviceDate: '2026-11-24',
  agreedAmount: '250000.00',
  advancePayment: '100000.00',
  paidAmount: '100000.00',
  balanceDue: '150000.00',
  contractUrl: 'https://storage.mmm.in/contracts/decor-agreement.pdf',
  contractRef: 'RHD-2026-001',
  notes: 'Advance paid via NEFT',
  createdAt: '2026-11-05T10:00:00.000Z',
  updatedAt: '2026-11-05T10:00:00.000Z',
  paymentsCount: 1,
};

const samplePayment: VendorPaymentDTO = {
  id: 'ffffffff-1111-4111-8111-111111111111',
  weddingId: WEDDING_ID,
  bookingId: BOOKING_ID_1,
  vendorId: VENDOR_ID_1,
  vendorName: 'Royal Heritage Decorators',
  expenseId: 'eeeeeeee-1111-4111-8111-111111111111',
  amount: '100000.00',
  paymentDate: '2026-11-05',
  paymentStatus: 'PAID',
  paymentMethod: 'BANK_TRANSFER',
  paidBy: 'Aisha Rao',
  referenceNumber: 'NEFT-987654321',
  notes: 'Advance booking retainer',
  createdAt: '2026-11-05T10:00:00.000Z',
};

const sampleDashboard: VendorDashboardAnalytics = {
  kpis: {
    totalVendors: 16,
    categoriesCount: 8,
    confirmedVendors: 11,
    confirmedPercentage: 69,
    shortlistedVendors: 4,
    negotiatingVendors: 2,
    pendingSignatures: 2,
    vendorBudgetCap: '3250000.00',
    totalAllocated: '2680000.00',
    totalAmountPaid: '1980000.00',
    paidPercentage: 74,
    remainingBalance: '700000.00',
    upcoming14Days: '320000.00',
  },
  pipelineFunnel: [
    { stage: '1', label: '1. Shortlisted', count: 4, percentage: 25 },
    { stage: '2', label: '2. Initial Contact & Quoting', count: 3, percentage: 19 },
    { stage: '3', label: '3. Contract Negotiation', count: 2, percentage: 13 },
    { stage: '4', label: '4. Confirmed & Retainer Paid', count: 11, percentage: 69 },
    { stage: '5', label: '5. Event Executed & Settled', count: 0, percentage: 0 },
  ],
  budgetByTier: [
    {
      category: 'VENUE',
      label: 'Venues & Palaces',
      allocated: '1500000.00',
      paid: '1500000.00',
      vendorsCount: 2,
      sharePercent: 56,
    },
  ],
  upcomingMilestones: [
    {
      id: BOOKING_ID_1,
      title: 'Stage & Mandap Setup',
      vendorName: 'Royal Heritage Decorators',
      category: 'DECORATION',
      ceremonyName: 'Sangeet & Wedding',
      serviceDate: '2026-11-24',
      status: 'CONFIRMED',
    },
  ],
  recentActivity: [
    {
      id: samplePayment.id,
      type: 'PAYMENT_RECORDED',
      title: 'Payment of ₹1,00,000 recorded',
      vendorName: 'Royal Heritage Decorators',
      timestamp: '2026-11-05',
      details: 'Payment via BANK_TRANSFER',
    },
  ],
};

function buildTestApp(vendorOverrides: Partial<VendorsServiceOperations> = {}) {
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
    createService: jest.fn(async () => sampleVendor.services[0]),
    deleteService: jest.fn(async () => ({ deleted: true as const })),
    listBookings: jest.fn(async () => [sampleBooking]),
    getBooking: jest.fn(async () => sampleBooking),
    createBooking: jest.fn(async () => sampleBooking),
    updateBooking: jest.fn(async () => sampleBooking),
    deleteBooking: jest.fn(async () => ({ deleted: true as const })),
    listPayments: jest.fn(async () => [samplePayment]),
    recordPayment: jest.fn(async () => samplePayment),
    getDashboardAnalytics: jest.fn(async () => sampleDashboard),
    getComparison: jest.fn(async () => [sampleVendor]),
    getCalendar: jest.fn(async () => [
      {
        id: 'service-1',
        type: 'SERVICE' as const,
        date: '2026-11-24',
        vendorId: VENDOR_ID_1,
        vendorName: 'Royal Heritage Decorators',
        category: 'DECORATION' as const,
        title: 'Stage & Mandap Setup',
        amount: '250000.00',
        status: 'CONFIRMED',
        ceremonyName: 'Sangeet & Wedding',
      },
    ]),
    ...vendorOverrides,
  };

  const authService: AuthOperations = {
    createCsrfToken: jest.fn(() => 'token'),
    authenticate: jest.fn(async (token?: string) => (token === 'valid_session' ? mockUser : null)),
    signup: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    consumeRateLimit: jest.fn(async () => true),
  };

  const app = express();
  app.use(express.json());
  app.use('/api/v1/vendors', createVendorsRouter(vendorsService, authService));

  // Error handler
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal error' } });
    },
  );

  return { app, vendorsService, authService };
}

describe('Vendors Management REST API & Service', () => {
  const csrfToken = createCsrfToken();
  const validHeaders = {
    Cookie: `mmm_session=valid_session; mmm_csrf=${csrfToken}`,
    'X-CSRF-Token': csrfToken,
    Origin: 'http://localhost:3000',
  };

  describe('Vendor CRUD Operations', () => {
    it('rejects unauthenticated requests to list vendors', async () => {
      const { app } = buildTestApp();
      const res = await request(app).get('/api/v1/vendors');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('lists vendors with pagination and filters', async () => {
      const { app, vendorsService } = buildTestApp();
      const res = await request(app)
        .get('/api/v1/vendors?category=DECORATION&status=CONFIRMED&isFavorite=true')
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Royal Heritage Decorators');
      expect(vendorsService.listVendors).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ category: 'DECORATION', status: 'CONFIRMED', isFavorite: true }),
      );
    });

    it('creates a new vendor with event associations', async () => {
      const { app, vendorsService } = buildTestApp();
      const res = await request(app)
        .post('/api/v1/vendors')
        .set(validHeaders)
        .send({
          name: 'Royal Heritage Decorators',
          category: 'DECORATION',
          city: 'Bangalore',
          contactName: 'Vikram Singh',
          pricing: '₹3,50,000 package',
          priceRange: 'PREMIUM',
          rating: 4.9,
          status: 'CONFIRMED',
          eventIds: [EVENT_ID_1],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Royal Heritage Decorators');
      expect(vendorsService.createVendor).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ name: 'Royal Heritage Decorators', category: 'DECORATION' }),
      );
    });

    it('rejects vendor creation when CSRF token is missing', async () => {
      const { app } = buildTestApp();
      const res = await request(app)
        .post('/api/v1/vendors')
        .set({ Cookie: 'mmm_session=valid_session', Origin: 'http://localhost:3000' })
        .send({ name: 'Test Vendor', category: 'OTHER' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_REJECTED');
    });

    it('fetches vendor details by ID', async () => {
      const { app, vendorsService } = buildTestApp();
      const res = await request(app)
        .get(`/api/v1/vendors/${VENDOR_ID_1}`)
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(VENDOR_ID_1);
      expect(res.body.data.rating).toBe(4.9);
      expect(vendorsService.getVendor).toHaveBeenCalledWith(mockUser.id, VENDOR_ID_1);
    });

    it('updates vendor details', async () => {
      const { app, vendorsService } = buildTestApp();
      const res = await request(app)
        .patch(`/api/v1/vendors/${VENDOR_ID_1}`)
        .set(validHeaders)
        .send({
          pricing: '₹4,00,000 updated',
          status: 'CONFIRMED',
        });

      expect(res.status).toBe(200);
      expect(vendorsService.updateVendor).toHaveBeenCalledWith(
        mockUser.id,
        VENDOR_ID_1,
        expect.objectContaining({ pricing: '₹4,00,000 updated', status: 'CONFIRMED' }),
      );
    });

    it('toggles favorite status of a vendor', async () => {
      const { app, vendorsService } = buildTestApp();
      const res = await request(app)
        .patch(`/api/v1/vendors/${VENDOR_ID_1}/favorite`)
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.isFavorite).toBe(true);
      expect(vendorsService.toggleFavorite).toHaveBeenCalledWith(mockUser.id, VENDOR_ID_1);
    });

    it('deletes a vendor', async () => {
      const { app, vendorsService } = buildTestApp();
      const res = await request(app)
        .delete(`/api/v1/vendors/${VENDOR_ID_1}`)
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
      expect(vendorsService.deleteVendor).toHaveBeenCalledWith(mockUser.id, VENDOR_ID_1);
    });
  });

  describe('Vendor Bookings & Expense Integration', () => {
    it('creates a booking for a vendor with agreed amount and advance payment', async () => {
      const { app, vendorsService } = buildTestApp();
      const res = await request(app)
        .post(`/api/v1/vendors/${VENDOR_ID_1}/bookings`)
        .set(validHeaders)
        .send({
          serviceName: 'Stage & Mandap Decor',
          eventId: EVENT_ID_1,
          bookingDate: '2026-11-05',
          serviceDate: '2026-11-24',
          agreedAmount: '250000.00',
          advancePayment: '100000.00',
          advancePaymentMethod: 'BANK_TRANSFER',
          contractRef: 'RHD-2026-001',
          status: 'CONFIRMED',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.serviceName).toBe('Stage & Mandap Decor');
      expect(res.body.data.agreedAmount).toBe('250000.00');
      expect(res.body.data.advancePayment).toBe('100000.00');
      expect(vendorsService.createBooking).toHaveBeenCalledWith(
        mockUser.id,
        VENDOR_ID_1,
        expect.objectContaining({ serviceName: 'Stage & Mandap Decor' }),
      );
    });

    it('records a payment installment against a booking', async () => {
      const { app, vendorsService } = buildTestApp();
      const res = await request(app)
        .post(`/api/v1/vendors/bookings/${BOOKING_ID_1}/payments`)
        .set(validHeaders)
        .send({
          amount: '100000.00',
          paymentDate: '2026-11-05',
          paymentMethod: 'BANK_TRANSFER',
          paidBy: 'Aisha Rao',
          referenceNumber: 'NEFT-987654321',
          notes: 'Advance booking retainer',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe('100000.00');
      expect(res.body.data.paidBy).toBe('Aisha Rao');
      expect(vendorsService.recordPayment).toHaveBeenCalledWith(
        mockUser.id,
        BOOKING_ID_1,
        expect.objectContaining({ amount: '100000.00', paymentMethod: 'BANK_TRANSFER' }),
      );
    });
  });

  describe('Vendor Dashboard & Stitch Visualizations', () => {
    it('returns comprehensive dashboard analytics matching Stitch KPIs and pipeline funnel', async () => {
      const { app } = buildTestApp();
      const res = await request(app)
        .get('/api/v1/vendors/dashboard')
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.kpis.totalVendors).toBe(16);
      expect(res.body.data.kpis.confirmedVendors).toBe(11);
      expect(res.body.data.kpis.vendorBudgetCap).toBe('3250000.00');
      expect(res.body.data.kpis.totalAmountPaid).toBe('1980000.00');
      expect(res.body.data.pipelineFunnel).toHaveLength(5);
      expect(res.body.data.upcomingMilestones).toHaveLength(1);
    });

    it('returns side-by-side comparison data for shortlisted vendors', async () => {
      const { app, vendorsService } = buildTestApp();
      const res = await request(app)
        .get(`/api/v1/vendors/comparison?vendorIds=${VENDOR_ID_1},${BOOKING_ID_1}`)
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(vendorsService.getComparison).toHaveBeenCalledWith(mockUser.id, [VENDOR_ID_1, BOOKING_ID_1]);
    });

    it('returns vendor schedule and calendar events', async () => {
      const { app } = buildTestApp();
      const res = await request(app)
        .get('/api/v1/vendors/calendar')
        .set(validHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe('SERVICE');
      expect(res.body.data[0].date).toBe('2026-11-24');
    });
  });
});
