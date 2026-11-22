import { Prisma, type PrismaClient } from '../../generated/prisma/client';
import { AppError } from '../../shared/app-error';
import { formatPaiseToDecimal, parseMoneyToPaise, isValidMoneyInput } from '../expenses/money';
import type {
  CreateBookingInput,
  CreateServiceInput,
  CreateVendorInput,
  ListVendorsQuery,
  RecordVendorPaymentInput,
  UpdateBookingInput,
  UpdateServiceInput,
  UpdateVendorInput,
  VendorCategoryValue,
  VendorPriceRangeValue,
  VendorStatusValue,
} from './schemas';

export interface VendorServiceDTO {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  isIncluded: boolean;
}

export interface VendorBookingDTO {
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

export interface VendorPaymentDTO {
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

export interface VendorDTO {
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
  services: VendorServiceDTO[];
  events: Array<{ id: string; name: string }>;
  bookingsCount: number;
  totalAgreed: string;
  totalPaid: string;
  balanceDue: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListVendorsResult {
  vendors: VendorDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export interface VendorsServiceOperations {
  listVendors(userId: string, query: ListVendorsQuery): Promise<ListVendorsResult>;
  getVendor(userId: string, vendorId: string): Promise<VendorDTO>;
  createVendor(userId: string, input: CreateVendorInput): Promise<VendorDTO>;
  updateVendor(userId: string, vendorId: string, input: UpdateVendorInput): Promise<VendorDTO>;
  deleteVendor(userId: string, vendorId: string): Promise<{ deleted: true }>;
  toggleFavorite(userId: string, vendorId: string): Promise<{ isFavorite: boolean }>;
  updateStatus(userId: string, vendorId: string, status: VendorStatusValue): Promise<{ status: VendorStatusValue }>;

  // Services
  createService(userId: string, vendorId: string, input: CreateServiceInput): Promise<VendorServiceDTO>;
  deleteService(userId: string, vendorId: string, serviceId: string): Promise<{ deleted: true }>;

  // Bookings
  listBookings(userId: string): Promise<VendorBookingDTO[]>;
  getBooking(userId: string, bookingId: string): Promise<VendorBookingDTO>;
  createBooking(userId: string, vendorId: string, input: CreateBookingInput): Promise<VendorBookingDTO>;
  updateBooking(userId: string, bookingId: string, input: UpdateBookingInput): Promise<VendorBookingDTO>;
  deleteBooking(userId: string, bookingId: string): Promise<{ deleted: true }>;

  // Payments
  listPayments(userId: string): Promise<VendorPaymentDTO[]>;
  recordPayment(userId: string, bookingId: string, input: RecordVendorPaymentInput): Promise<VendorPaymentDTO>;

  // Dashboard & Analytics
  getDashboardAnalytics(userId: string): Promise<VendorDashboardAnalytics>;
  getComparison(userId: string, vendorIds: string[]): Promise<VendorDTO[]>;
  getCalendar(userId: string): Promise<Array<{
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
  }>>;
}

export function createVendorsService(prisma: PrismaClient | undefined): VendorsServiceOperations {
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

  function mapVendor(
    row: Prisma.VendorGetPayload<{
      include: {
        services: true;
        vendorEvents: { include: { event: { select: { id: true; name: true } } } };
        bookings: { select: { agreedAmount: true; paidAmount: true } };
      };
    }>,
  ): VendorDTO {
    const totalAgreedPaise = row.bookings.reduce(
      (sum, b) => sum + parseMoneyToPaise(b.agreedAmount.toString()),
      0,
    );
    const totalPaidPaise = row.bookings.reduce(
      (sum, b) => sum + parseMoneyToPaise(b.paidAmount.toString()),
      0,
    );
    const balanceDuePaise = Math.max(0, totalAgreedPaise - totalPaidPaise);

    return {
      id: row.id,
      weddingId: row.weddingId,
      name: row.name,
      category: row.category as VendorCategoryValue,
      contactName: row.contactName,
      phone: row.phone,
      email: row.email,
      website: row.website,
      address: row.address,
      city: row.city,
      state: row.state,
      coverImageUrl: row.coverImageUrl,
      description: row.description,
      pricing: row.pricing,
      priceRange: (row.priceRange as VendorPriceRangeValue) ?? null,
      rating: row.rating !== null ? Number(row.rating) : null,
      status: row.status as VendorStatusValue,
      isFavorite: row.isFavorite,
      notes: row.notes,
      services: row.services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: s.price !== null ? formatPaiseToDecimal(parseMoneyToPaise(s.price.toString())) : null,
        isIncluded: s.isIncluded,
      })),
      events: row.vendorEvents.map((ve) => ({
        id: ve.event.id,
        name: ve.event.name,
      })),
      bookingsCount: row.bookings.length,
      totalAgreed: formatPaiseToDecimal(totalAgreedPaise),
      totalPaid: formatPaiseToDecimal(totalPaidPaise),
      balanceDue: formatPaiseToDecimal(balanceDuePaise),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  return {
    async listVendors(userId: string, query: ListVendorsQuery): Promise<ListVendorsResult> {
      const { weddingId } = await resolveCallerWorkspace(userId);
      const where: Prisma.VendorWhereInput = { weddingId };

      if (query.category) where.category = query.category;
      if (query.status) where.status = query.status;
      if (query.priceRange) where.priceRange = query.priceRange;
      if (query.isFavorite !== undefined) where.isFavorite = query.isFavorite;

      if (query.eventId) {
        where.vendorEvents = {
          some: { eventId: query.eventId },
        };
      }

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { contactName: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      const orderBy: Prisma.VendorOrderByWithRelationInput = {};
      if (query.sortBy === 'name') orderBy.name = query.sortOrder;
      else if (query.sortBy === 'createdAt') orderBy.createdAt = query.sortOrder;
      else if (query.sortBy === 'rating') orderBy.rating = query.sortOrder;
      else if (query.sortBy === 'category') orderBy.category = query.sortOrder;
      else if (query.sortBy === 'status') orderBy.status = query.sortOrder;

      const skip = (query.page - 1) * query.limit;
      const db = requireDb();

      const [total, rows] = await Promise.all([
        db.vendor.count({ where }),
        db.vendor.findMany({
          where,
          include: {
            services: true,
            vendorEvents: { include: { event: { select: { id: true, name: true } } } },
            bookings: { select: { agreedAmount: true, paidAmount: true } },
          },
          orderBy: [orderBy, { createdAt: 'desc' }],
          skip,
          take: query.limit,
        }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return {
        vendors: rows.map(mapVendor),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
        },
      };
    },

    async getVendor(userId: string, vendorId: string): Promise<VendorDTO> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);
      const row = await db.vendor.findFirst({
        where: { id: vendorId, weddingId },
        include: {
          services: true,
          vendorEvents: { include: { event: { select: { id: true, name: true } } } },
          bookings: { select: { agreedAmount: true, paidAmount: true } },
        },
      });

      if (!row) {
        throw new AppError(404, 'VENDOR_NOT_FOUND', 'Vendor could not be found.');
      }

      return mapVendor(row);
    },

    async createVendor(userId: string, input: CreateVendorInput): Promise<VendorDTO> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      // Validate eventIds belong to caller's wedding
      if (input.eventIds && input.eventIds.length > 0) {
        const matchingEventsCount = await db.event.count({
          where: { weddingId, id: { in: input.eventIds } },
        });
        if (matchingEventsCount !== input.eventIds.length) {
          throw new AppError(400, 'INVALID_ASSOCIATION', 'One or more assigned events do not belong to this wedding.');
        }
      }

      const row = await db.$transaction(async (tx) => {
        const created = await tx.vendor.create({
          data: {
            weddingId,
            name: input.name,
            category: input.category,
            contactName: input.contactName ?? null,
            phone: input.phone ?? null,
            email: input.email ?? null,
            website: input.website ?? null,
            address: input.address ?? null,
            city: input.city ?? null,
            state: input.state ?? null,
            coverImageUrl: input.coverImageUrl ?? null,
            description: input.description ?? null,
            pricing: input.pricing ?? null,
            priceRange: input.priceRange ?? null,
            rating: input.rating !== undefined && input.rating !== null ? new Prisma.Decimal(input.rating) : null,
            status: input.status,
            isFavorite: input.isFavorite,
            notes: input.notes ?? null,
          },
        });

        if (input.eventIds && input.eventIds.length > 0) {
          await tx.vendorEvent.createMany({
            data: input.eventIds.map((eventId) => ({
              weddingId,
              vendorId: created.id,
              eventId,
            })),
          });
        }

        return tx.vendor.findUniqueOrThrow({
          where: { id: created.id },
          include: {
            services: true,
            vendorEvents: { include: { event: { select: { id: true, name: true } } } },
            bookings: { select: { agreedAmount: true, paidAmount: true } },
          },
        });
      });

      return mapVendor(row);
    },

    async updateVendor(userId: string, vendorId: string, input: UpdateVendorInput): Promise<VendorDTO> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const existing = await db.vendor.findFirst({
        where: { id: vendorId, weddingId },
        select: { id: true },
      });

      if (!existing) {
        throw new AppError(404, 'VENDOR_NOT_FOUND', 'Vendor could not be found.');
      }

      if (input.eventIds && input.eventIds.length > 0) {
        const matchingEventsCount = await db.event.count({
          where: { weddingId, id: { in: input.eventIds } },
        });
        if (matchingEventsCount !== input.eventIds.length) {
          throw new AppError(400, 'INVALID_ASSOCIATION', 'One or more assigned events do not belong to this wedding.');
        }
      }

      const updated = await db.$transaction(async (tx) => {
        const data: Prisma.VendorUpdateInput = {};
        if (input.name !== undefined) data.name = input.name;
        if (input.category !== undefined) data.category = input.category;
        if (input.contactName !== undefined) data.contactName = input.contactName;
        if (input.phone !== undefined) data.phone = input.phone;
        if (input.email !== undefined) data.email = input.email;
        if (input.website !== undefined) data.website = input.website;
        if (input.address !== undefined) data.address = input.address;
        if (input.city !== undefined) data.city = input.city;
        if (input.state !== undefined) data.state = input.state;
        if (input.coverImageUrl !== undefined) data.coverImageUrl = input.coverImageUrl;
        if (input.description !== undefined) data.description = input.description;
        if (input.pricing !== undefined) data.pricing = input.pricing;
        if (input.priceRange !== undefined) data.priceRange = input.priceRange;
        if (input.rating !== undefined) {
          data.rating = input.rating !== null ? new Prisma.Decimal(input.rating) : null;
        }
        if (input.status !== undefined) data.status = input.status;
        if (input.isFavorite !== undefined) data.isFavorite = input.isFavorite;
        if (input.notes !== undefined) data.notes = input.notes;

        await tx.vendor.update({
          where: { id: existing.id },
          data,
        });

        if (input.eventIds !== undefined) {
          await tx.vendorEvent.deleteMany({
            where: { vendorId: existing.id },
          });
          if (input.eventIds.length > 0) {
            await tx.vendorEvent.createMany({
              data: input.eventIds.map((eventId) => ({
                weddingId,
                vendorId: existing.id,
                eventId,
              })),
            });
          }
        }

        return tx.vendor.findUniqueOrThrow({
          where: { id: existing.id },
          include: {
            services: true,
            vendorEvents: { include: { event: { select: { id: true, name: true } } } },
            bookings: { select: { agreedAmount: true, paidAmount: true } },
          },
        });
      });

      return mapVendor(updated);
    },

    async deleteVendor(userId: string, vendorId: string): Promise<{ deleted: true }> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const existing = await db.vendor.findFirst({
        where: { id: vendorId, weddingId },
        select: { id: true },
      });

      if (!existing) {
        throw new AppError(404, 'VENDOR_NOT_FOUND', 'Vendor could not be found.');
      }

      await db.vendor.delete({
        where: { id: existing.id },
      });

      return { deleted: true };
    },

    async toggleFavorite(userId: string, vendorId: string): Promise<{ isFavorite: boolean }> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const existing = await db.vendor.findFirst({
        where: { id: vendorId, weddingId },
        select: { id: true, isFavorite: true },
      });

      if (!existing) {
        throw new AppError(404, 'VENDOR_NOT_FOUND', 'Vendor could not be found.');
      }

      const updated = await db.vendor.update({
        where: { id: existing.id },
        data: { isFavorite: !existing.isFavorite },
        select: { isFavorite: true },
      });

      return { isFavorite: updated.isFavorite };
    },

    async updateStatus(
      userId: string,
      vendorId: string,
      status: VendorStatusValue,
    ): Promise<{ status: VendorStatusValue }> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const existing = await db.vendor.findFirst({
        where: { id: vendorId, weddingId },
        select: { id: true },
      });

      if (!existing) {
        throw new AppError(404, 'VENDOR_NOT_FOUND', 'Vendor could not be found.');
      }

      const updated = await db.vendor.update({
        where: { id: existing.id },
        data: { status },
        select: { status: true },
      });

      return { status: updated.status as VendorStatusValue };
    },

    // Services
    async createService(
      userId: string,
      vendorId: string,
      input: CreateServiceInput,
    ): Promise<VendorServiceDTO> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const vendor = await db.vendor.findFirst({
        where: { id: vendorId, weddingId },
        select: { id: true },
      });

      if (!vendor) {
        throw new AppError(404, 'VENDOR_NOT_FOUND', 'Vendor could not be found.');
      }

      let priceDecimal: Prisma.Decimal | null = null;
      if (input.price) {
        if (!isValidMoneyInput(input.price)) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Service price must be a valid positive amount.');
        }
        priceDecimal = new Prisma.Decimal(formatPaiseToDecimal(parseMoneyToPaise(input.price)));
      }

      const service = await db.vendorService.create({
        data: {
          weddingId,
          vendorId: vendor.id,
          name: input.name,
          description: input.description ?? null,
          price: priceDecimal,
          isIncluded: input.isIncluded,
        },
      });

      return {
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price ? formatPaiseToDecimal(parseMoneyToPaise(service.price.toString())) : null,
        isIncluded: service.isIncluded,
      };
    },

    async deleteService(userId: string, vendorId: string, serviceId: string): Promise<{ deleted: true }> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const existing = await db.vendorService.findFirst({
        where: { id: serviceId, vendorId, weddingId },
        select: { id: true },
      });

      if (!existing) {
        throw new AppError(404, 'SERVICE_NOT_FOUND', 'Service could not be found.');
      }

      await db.vendorService.delete({ where: { id: existing.id } });
      return { deleted: true };
    },

    // Bookings & Expense Integration
    async listBookings(userId: string): Promise<VendorBookingDTO[]> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const bookings = await db.vendorBooking.findMany({
        where: { weddingId },
        include: {
          vendor: { select: { name: true, category: true } },
          event: { select: { id: true, name: true } },
          payments: { select: { id: true } },
        },
        orderBy: [{ bookingDate: 'desc' }, { createdAt: 'desc' }],
      });

      return bookings.map((b) => {
        const agreedPaise = parseMoneyToPaise(b.agreedAmount.toString());
        const paidPaise = parseMoneyToPaise(b.paidAmount.toString());
        const balanceDuePaise = Math.max(0, agreedPaise - paidPaise);

        return {
          id: b.id,
          weddingId: b.weddingId,
          vendorId: b.vendorId,
          vendorName: b.vendor.name,
          category: b.vendor.category as VendorCategoryValue,
          eventId: b.eventId,
          eventName: b.event?.name ?? null,
          expenseId: b.expenseId,
          serviceName: b.serviceName,
          status: b.status as VendorStatusValue,
          bookingDate: b.bookingDate ? b.bookingDate.toISOString().slice(0, 10) : null,
          serviceDate: b.serviceDate ? b.serviceDate.toISOString().slice(0, 10) : null,
          agreedAmount: formatPaiseToDecimal(agreedPaise),
          advancePayment: formatPaiseToDecimal(parseMoneyToPaise(b.advancePayment.toString())),
          paidAmount: formatPaiseToDecimal(paidPaise),
          balanceDue: formatPaiseToDecimal(balanceDuePaise),
          contractUrl: b.contractUrl,
          contractRef: b.contractRef,
          notes: b.notes,
          createdAt: b.createdAt.toISOString(),
          updatedAt: b.updatedAt.toISOString(),
          paymentsCount: b.payments.length,
        };
      });
    },

    async getBooking(userId: string, bookingId: string): Promise<VendorBookingDTO> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const b = await db.vendorBooking.findFirst({
        where: { id: bookingId, weddingId },
        include: {
          vendor: { select: { name: true, category: true } },
          event: { select: { id: true, name: true } },
          payments: { select: { id: true } },
        },
      });

      if (!b) {
        throw new AppError(404, 'BOOKING_NOT_FOUND', 'Vendor booking could not be found.');
      }

      const agreedPaise = parseMoneyToPaise(b.agreedAmount.toString());
      const paidPaise = parseMoneyToPaise(b.paidAmount.toString());
      const balanceDuePaise = Math.max(0, agreedPaise - paidPaise);

      return {
        id: b.id,
        weddingId: b.weddingId,
        vendorId: b.vendorId,
        vendorName: b.vendor.name,
        category: b.vendor.category as VendorCategoryValue,
        eventId: b.eventId,
        eventName: b.event?.name ?? null,
        expenseId: b.expenseId,
        serviceName: b.serviceName,
        status: b.status as VendorStatusValue,
        bookingDate: b.bookingDate ? b.bookingDate.toISOString().slice(0, 10) : null,
        serviceDate: b.serviceDate ? b.serviceDate.toISOString().slice(0, 10) : null,
        agreedAmount: formatPaiseToDecimal(agreedPaise),
        advancePayment: formatPaiseToDecimal(parseMoneyToPaise(b.advancePayment.toString())),
        paidAmount: formatPaiseToDecimal(paidPaise),
        balanceDue: formatPaiseToDecimal(balanceDuePaise),
        contractUrl: b.contractUrl,
        contractRef: b.contractRef,
        notes: b.notes,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        paymentsCount: b.payments.length,
      };
    },

    async createBooking(
      userId: string,
      vendorId: string,
      input: CreateBookingInput,
    ): Promise<VendorBookingDTO> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const vendor = await db.vendor.findFirst({
        where: { id: vendorId, weddingId },
        select: { id: true, name: true, category: true },
      });

      if (!vendor) {
        throw new AppError(404, 'VENDOR_NOT_FOUND', 'Vendor could not be found.');
      }

      if (input.eventId) {
        const event = await db.event.findFirst({
          where: { id: input.eventId, weddingId },
          select: { id: true },
        });
        if (!event) {
          throw new AppError(400, 'INVALID_ASSOCIATION', 'Assigned event does not belong to this wedding.');
        }
      }

      if (!isValidMoneyInput(input.agreedAmount)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Agreed amount must be a valid positive amount.');
      }
      const agreedPaise = parseMoneyToPaise(input.agreedAmount);
      if (agreedPaise < 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Agreed amount cannot be negative.');
      }

      const advancePaise = input.advancePayment ? parseMoneyToPaise(input.advancePayment) : 0;
      if (advancePaise < 0 || advancePaise > agreedPaise) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Advance payment must be between 0 and the agreed amount.');
      }

      const bookingDate = input.bookingDate ? new Date(input.bookingDate) : new Date();
      const serviceDate = input.serviceDate ? new Date(input.serviceDate) : null;

      const created = await db.$transaction(async (tx) => {
        // 1. Create or sync Expense if agreed amount > 0
        let expenseId: string | null = null;
        if (agreedPaise > 0) {
          const expensePaymentStatus =
            advancePaise >= agreedPaise
              ? 'PAID'
              : advancePaise > 0
                ? 'PARTIAL'
                : 'PENDING';

          const expense = await tx.expense.create({
            data: {
              weddingId,
              vendorId: vendor.id,
              eventId: input.eventId ?? null,
              createdByUserId: userId,
              title: `${vendor.name} - ${input.serviceName}`,
              category: vendor.category,
              amount: new Prisma.Decimal(formatPaiseToDecimal(agreedPaise)),
              paidAmount: new Prisma.Decimal(formatPaiseToDecimal(advancePaise)),
              currency: 'INR',
              paymentStatus: expensePaymentStatus,
              paymentMethod: advancePaise > 0 ? input.advancePaymentMethod : null,
              spentAt: bookingDate,
              dueDate: serviceDate,
              notes: input.notes ?? `Vendor booking agreement: ${vendor.name}`,
            },
          });
          expenseId = expense.id;
        }

        // 2. Create Booking
        const booking = await tx.vendorBooking.create({
          data: {
            weddingId,
            vendorId: vendor.id,
            eventId: input.eventId ?? null,
            expenseId,
            serviceName: input.serviceName,
            status: input.status,
            bookingDate,
            serviceDate,
            agreedAmount: new Prisma.Decimal(formatPaiseToDecimal(agreedPaise)),
            advancePayment: new Prisma.Decimal(formatPaiseToDecimal(advancePaise)),
            paidAmount: new Prisma.Decimal(formatPaiseToDecimal(advancePaise)),
            contractUrl: input.contractUrl ?? null,
            contractRef: input.contractRef ?? null,
            notes: input.notes ?? null,
          },
          include: {
            vendor: { select: { name: true, category: true } },
            event: { select: { id: true, name: true } },
            payments: { select: { id: true } },
          },
        });

        // 3. Create initial advance Payment record if advance > 0
        if (advancePaise > 0) {
          await tx.vendorPayment.create({
            data: {
              weddingId,
              bookingId: booking.id,
              vendorId: vendor.id,
              expenseId,
              amount: new Prisma.Decimal(formatPaiseToDecimal(advancePaise)),
              paymentDate: bookingDate,
              paymentStatus: 'PAID',
              paymentMethod: input.advancePaymentMethod,
              notes: 'Advance booking retainer deposit',
            },
          });
        }

        // 4. Update vendor status to CONFIRMED if booking is confirmed
        if (input.status === 'CONFIRMED') {
          await tx.vendor.update({
            where: { id: vendor.id },
            data: { status: 'CONFIRMED' },
          });
        }

        return booking;
      });

      const balanceDuePaise = Math.max(0, agreedPaise - advancePaise);
      return {
        id: created.id,
        weddingId: created.weddingId,
        vendorId: created.vendorId,
        vendorName: created.vendor.name,
        category: created.vendor.category as VendorCategoryValue,
        eventId: created.eventId,
        eventName: created.event?.name ?? null,
        expenseId: created.expenseId,
        serviceName: created.serviceName,
        status: created.status as VendorStatusValue,
        bookingDate: created.bookingDate ? created.bookingDate.toISOString().slice(0, 10) : null,
        serviceDate: created.serviceDate ? created.serviceDate.toISOString().slice(0, 10) : null,
        agreedAmount: formatPaiseToDecimal(agreedPaise),
        advancePayment: formatPaiseToDecimal(advancePaise),
        paidAmount: formatPaiseToDecimal(advancePaise),
        balanceDue: formatPaiseToDecimal(balanceDuePaise),
        contractUrl: created.contractUrl,
        contractRef: created.contractRef,
        notes: created.notes,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        paymentsCount: advancePaise > 0 ? 1 : 0,
      };
    },

    async updateBooking(userId: string, bookingId: string, input: UpdateBookingInput): Promise<VendorBookingDTO> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const existing = await db.vendorBooking.findFirst({
        where: { id: bookingId, weddingId },
        include: { vendor: { select: { name: true, category: true } } },
      });

      if (!existing) {
        throw new AppError(404, 'BOOKING_NOT_FOUND', 'Vendor booking could not be found.');
      }

      if (input.eventId) {
        const event = await db.event.findFirst({
          where: { id: input.eventId, weddingId },
          select: { id: true },
        });
        if (!event) {
          throw new AppError(400, 'INVALID_ASSOCIATION', 'Assigned event does not belong to this wedding.');
        }
      }

      const updated = await db.$transaction(async (tx) => {
        const data: Prisma.VendorBookingUpdateInput = {};
        if (input.serviceName !== undefined) data.serviceName = input.serviceName;
        if (input.status !== undefined) data.status = input.status;
        if (input.bookingDate !== undefined) {
          data.bookingDate = input.bookingDate ? new Date(input.bookingDate) : null;
        }
        if (input.serviceDate !== undefined) {
          data.serviceDate = input.serviceDate ? new Date(input.serviceDate) : null;
        }
        if (input.contractUrl !== undefined) data.contractUrl = input.contractUrl;
        if (input.contractRef !== undefined) data.contractRef = input.contractRef;
        if (input.notes !== undefined) data.notes = input.notes;
        if (input.eventId !== undefined) {
          data.event = input.eventId ? { connect: { id: input.eventId } } : { disconnect: true };
        }

        if (input.agreedAmount !== undefined) {
          if (!isValidMoneyInput(input.agreedAmount)) {
            throw new AppError(400, 'VALIDATION_ERROR', 'Agreed amount must be a valid amount.');
          }
          const agreedPaise = parseMoneyToPaise(input.agreedAmount);
          const currentPaidPaise = parseMoneyToPaise(existing.paidAmount.toString());
          if (agreedPaise < currentPaidPaise) {
            throw new AppError(400, 'VALIDATION_ERROR', 'Agreed amount cannot be less than already paid amount.');
          }
          data.agreedAmount = new Prisma.Decimal(formatPaiseToDecimal(agreedPaise));
        }

        const b = await tx.vendorBooking.update({
          where: { id: existing.id },
          data,
          include: {
            vendor: { select: { name: true, category: true } },
            event: { select: { id: true, name: true } },
            payments: { select: { id: true } },
          },
        });

        // Sync linked Expense
        if (existing.expenseId) {
          const expenseUpdate: Prisma.ExpenseUpdateInput = {};
          if (input.serviceName !== undefined) {
            expenseUpdate.title = `${existing.vendor.name} - ${input.serviceName}`;
          }
          if (input.agreedAmount !== undefined) {
            expenseUpdate.amount = new Prisma.Decimal(formatPaiseToDecimal(parseMoneyToPaise(input.agreedAmount)));
          }
          if (input.eventId !== undefined) {
            expenseUpdate.event = input.eventId ? { connect: { id: input.eventId } } : { disconnect: true };
          }
          if (input.status === 'CANCELLED') {
            expenseUpdate.paymentStatus = 'CANCELLED';
          }
          await tx.expense.update({
            where: { id: existing.expenseId },
            data: expenseUpdate,
          });
        }

        return b;
      });

      const agreedPaise = parseMoneyToPaise(updated.agreedAmount.toString());
      const paidPaise = parseMoneyToPaise(updated.paidAmount.toString());
      const balanceDuePaise = Math.max(0, agreedPaise - paidPaise);

      return {
        id: updated.id,
        weddingId: updated.weddingId,
        vendorId: updated.vendorId,
        vendorName: updated.vendor.name,
        category: updated.vendor.category as VendorCategoryValue,
        eventId: updated.eventId,
        eventName: updated.event?.name ?? null,
        expenseId: updated.expenseId,
        serviceName: updated.serviceName,
        status: updated.status as VendorStatusValue,
        bookingDate: updated.bookingDate ? updated.bookingDate.toISOString().slice(0, 10) : null,
        serviceDate: updated.serviceDate ? updated.serviceDate.toISOString().slice(0, 10) : null,
        agreedAmount: formatPaiseToDecimal(agreedPaise),
        advancePayment: formatPaiseToDecimal(parseMoneyToPaise(updated.advancePayment.toString())),
        paidAmount: formatPaiseToDecimal(paidPaise),
        balanceDue: formatPaiseToDecimal(balanceDuePaise),
        contractUrl: updated.contractUrl,
        contractRef: updated.contractRef,
        notes: updated.notes,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        paymentsCount: updated.payments.length,
      };
    },

    async deleteBooking(userId: string, bookingId: string): Promise<{ deleted: true }> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const existing = await db.vendorBooking.findFirst({
        where: { id: bookingId, weddingId },
        select: { id: true, expenseId: true },
      });

      if (!existing) {
        throw new AppError(404, 'BOOKING_NOT_FOUND', 'Vendor booking could not be found.');
      }

      await db.$transaction(async (tx) => {
        if (existing.expenseId) {
          await tx.expense.delete({ where: { id: existing.expenseId } }).catch(() => {});
        }
        await tx.vendorBooking.delete({ where: { id: existing.id } });
      });

      return { deleted: true };
    },

    // Payments Ledger
    async listPayments(userId: string): Promise<VendorPaymentDTO[]> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const rows = await db.vendorPayment.findMany({
        where: { weddingId },
        include: {
          vendor: { select: { name: true } },
        },
        orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
      });

      return rows.map((p) => ({
        id: p.id,
        weddingId: p.weddingId,
        bookingId: p.bookingId,
        vendorId: p.vendorId,
        vendorName: p.vendor.name,
        expenseId: p.expenseId,
        amount: formatPaiseToDecimal(parseMoneyToPaise(p.amount.toString())),
        paymentDate: p.paymentDate.toISOString().slice(0, 10),
        paymentStatus: p.paymentStatus,
        paymentMethod: p.paymentMethod,
        paidBy: p.paidBy,
        referenceNumber: p.referenceNumber,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
      }));
    },

    async recordPayment(
      userId: string,
      bookingId: string,
      input: RecordVendorPaymentInput,
    ): Promise<VendorPaymentDTO> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const booking = await db.vendorBooking.findFirst({
        where: { id: bookingId, weddingId },
        include: { vendor: { select: { id: true, name: true, category: true } } },
      });

      if (!booking) {
        throw new AppError(404, 'BOOKING_NOT_FOUND', 'Vendor booking could not be found.');
      }

      if (!isValidMoneyInput(input.amount)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Payment amount must be a valid positive amount.');
      }
      const paymentPaise = parseMoneyToPaise(input.amount);
      if (paymentPaise <= 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Payment amount must be greater than zero.');
      }

      const agreedPaise = parseMoneyToPaise(booking.agreedAmount.toString());
      const currentPaidPaise = parseMoneyToPaise(booking.paidAmount.toString());
      const newPaidPaise = currentPaidPaise + paymentPaise;

      if (newPaidPaise > agreedPaise) {
        throw new AppError(
          400,
          'OVERPAYMENT_EXCEEDED',
          `Payment of ${formatPaiseToDecimal(paymentPaise)} exceeds the remaining balance of ${formatPaiseToDecimal(
            Math.max(0, agreedPaise - currentPaidPaise),
          )}.`,
        );
      }

      const payment = await db.$transaction(async (tx) => {
        // 1. Insert VendorPayment
        const p = await tx.vendorPayment.create({
          data: {
            weddingId,
            bookingId: booking.id,
            vendorId: booking.vendorId,
            expenseId: booking.expenseId,
            amount: new Prisma.Decimal(formatPaiseToDecimal(paymentPaise)),
            paymentDate: new Date(input.paymentDate),
            paymentStatus: 'PAID',
            paymentMethod: input.paymentMethod,
            paidBy: input.paidBy ?? null,
            referenceNumber: input.referenceNumber ?? null,
            notes: input.notes ?? null,
          },
          include: { vendor: { select: { name: true } } },
        });

        // 2. Update VendorBooking paidAmount
        await tx.vendorBooking.update({
          where: { id: booking.id },
          data: {
            paidAmount: new Prisma.Decimal(formatPaiseToDecimal(newPaidPaise)),
            status: newPaidPaise >= agreedPaise ? 'CONFIRMED' : booking.status,
          },
        });

        // 3. Sync Expense paidAmount & paymentStatus
        if (booking.expenseId) {
          await tx.expense.update({
            where: { id: booking.expenseId },
            data: {
              paidAmount: new Prisma.Decimal(formatPaiseToDecimal(newPaidPaise)),
              paymentStatus: newPaidPaise >= agreedPaise ? 'PAID' : 'PARTIAL',
              paymentMethod: input.paymentMethod,
              paidBy: input.paidBy ?? undefined,
              referenceNumber: input.referenceNumber ?? undefined,
            },
          });
        }

        return p;
      });

      return {
        id: payment.id,
        weddingId: payment.weddingId,
        bookingId: payment.bookingId,
        vendorId: payment.vendorId,
        vendorName: payment.vendor.name,
        expenseId: payment.expenseId,
        amount: formatPaiseToDecimal(paymentPaise),
        paymentDate: payment.paymentDate.toISOString().slice(0, 10),
        paymentStatus: payment.paymentStatus,
        paymentMethod: payment.paymentMethod,
        paidBy: payment.paidBy,
        referenceNumber: payment.referenceNumber,
        notes: payment.notes,
        createdAt: payment.createdAt.toISOString(),
      };
    },

    // Dashboard Analytics matching Stitch reference
    async getDashboardAnalytics(userId: string): Promise<VendorDashboardAnalytics> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const [vendors, bookings, payments, budgetRow] = await Promise.all([
        db.vendor.findMany({
          where: { weddingId },
          select: { id: true, name: true, category: true, status: true, rating: true, isFavorite: true },
        }),
        db.vendorBooking.findMany({
          where: { weddingId },
          include: {
            vendor: { select: { name: true, category: true } },
            event: { select: { name: true } },
          },
          orderBy: [{ serviceDate: 'asc' }, { createdAt: 'desc' }],
        }),
        db.vendorPayment.findMany({
          where: { weddingId },
          include: { vendor: { select: { name: true } } },
          orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
          take: 10,
        }),
        db.weddingBudget.findUnique({
          where: { weddingId },
          select: { totalBudget: true },
        }),
      ]);

      const totalVendors = vendors.length;
      const categoriesSet = new Set(vendors.map((v) => v.category));
      const confirmedVendors = vendors.filter((v) => v.status === 'CONFIRMED' || v.status === 'COMPLETED').length;
      const confirmedPercentage = totalVendors > 0 ? Math.round((confirmedVendors / totalVendors) * 100) : 0;
      const shortlistedVendors = vendors.filter((v) => v.status === 'SHORTLISTED').length;
      const negotiatingVendors = vendors.filter((v) => v.status === 'NEGOTIATING' || v.status === 'CONTACTED').length;
      const pendingSignatures = bookings.filter((b) => !b.contractUrl && b.status !== 'CANCELLED').length;

      const totalAgreedPaise = bookings.reduce(
        (sum, b) => (b.status !== 'CANCELLED' ? sum + parseMoneyToPaise(b.agreedAmount.toString()) : sum),
        0,
      );
      const totalPaidPaise = bookings.reduce(
        (sum, b) => (b.status !== 'CANCELLED' ? sum + parseMoneyToPaise(b.paidAmount.toString()) : sum),
        0,
      );
      const remainingBalancePaise = Math.max(0, totalAgreedPaise - totalPaidPaise);
      const paidPercentage = totalAgreedPaise > 0 ? Math.round((totalPaidPaise / totalAgreedPaise) * 100) : 0;

      // Upcoming in next 14 days
      const now = new Date();
      const next14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const upcoming14DaysPaise = bookings
        .filter((b) => b.serviceDate && b.serviceDate >= now && b.serviceDate <= next14Days && b.status !== 'CANCELLED')
        .reduce((sum, b) => {
          const agreed = parseMoneyToPaise(b.agreedAmount.toString());
          const paid = parseMoneyToPaise(b.paidAmount.toString());
          return sum + Math.max(0, agreed - paid);
        }, 0);

      const budgetCapPaise = budgetRow ? parseMoneyToPaise(budgetRow.totalBudget.toString()) : totalAgreedPaise;

      // Pipeline funnel
      const pipelineCounts: Record<string, number> = {
        SHORTLISTED: vendors.filter((v) => v.status === 'SHORTLISTED').length,
        CONTACTED: vendors.filter((v) => v.status === 'CONTACTED').length,
        NEGOTIATING: vendors.filter((v) => v.status === 'NEGOTIATING').length,
        CONFIRMED: vendors.filter((v) => v.status === 'CONFIRMED').length,
        COMPLETED: vendors.filter((v) => v.status === 'COMPLETED').length,
      };

      const pipelineFunnel = [
        {
          stage: '1',
          label: '1. Shortlisted',
          count: pipelineCounts.SHORTLISTED,
          percentage: totalVendors > 0 ? Math.round((pipelineCounts.SHORTLISTED / totalVendors) * 100) : 0,
        },
        {
          stage: '2',
          label: '2. Initial Contact & Quoting',
          count: pipelineCounts.CONTACTED,
          percentage: totalVendors > 0 ? Math.round((pipelineCounts.CONTACTED / totalVendors) * 100) : 0,
        },
        {
          stage: '3',
          label: '3. Contract Negotiation',
          count: pipelineCounts.NEGOTIATING,
          percentage: totalVendors > 0 ? Math.round((pipelineCounts.NEGOTIATING / totalVendors) * 100) : 0,
        },
        {
          stage: '4',
          label: '4. Confirmed & Retainer Paid',
          count: pipelineCounts.CONFIRMED,
          percentage: totalVendors > 0 ? Math.round((pipelineCounts.CONFIRMED / totalVendors) * 100) : 0,
        },
        {
          stage: '5',
          label: '5. Event Executed & Settled',
          count: pipelineCounts.COMPLETED,
          percentage: totalVendors > 0 ? Math.round((pipelineCounts.COMPLETED / totalVendors) * 100) : 0,
        },
      ];

      // Budget by tier
      const categoryMap = new Map<VendorCategoryValue, { allocatedPaise: number; paidPaise: number; count: number }>();
      for (const b of bookings) {
        if (b.status === 'CANCELLED') continue;
        const cat = b.vendor.category as VendorCategoryValue;
        const curr = categoryMap.get(cat) || { allocatedPaise: 0, paidPaise: 0, count: 0 };
        curr.allocatedPaise += parseMoneyToPaise(b.agreedAmount.toString());
        curr.paidPaise += parseMoneyToPaise(b.paidAmount.toString());
        curr.count += 1;
        categoryMap.set(cat, curr);
      }

      const budgetByTier = Array.from(categoryMap.entries()).map(([cat, val]) => ({
        category: cat,
        label: cat.charAt(0) + cat.slice(1).toLowerCase().replace(/_/g, ' '),
        allocated: formatPaiseToDecimal(val.allocatedPaise),
        paid: formatPaiseToDecimal(val.paidPaise),
        vendorsCount: val.count,
        sharePercent: totalAgreedPaise > 0 ? Math.round((val.allocatedPaise / totalAgreedPaise) * 100) : 0,
      }));

      // Upcoming milestones
      const upcomingMilestones = bookings
        .filter((b) => b.serviceDate && b.status !== 'CANCELLED')
        .slice(0, 5)
        .map((b) => ({
          id: b.id,
          title: b.serviceName,
          vendorName: b.vendor.name,
          category: b.vendor.category as VendorCategoryValue,
          ceremonyName: b.event?.name ?? null,
          serviceDate: b.serviceDate!.toISOString().slice(0, 10),
          status: b.status as VendorStatusValue,
        }));

      // Recent Activity
      const recentActivity: VendorDashboardAnalytics['recentActivity'] = payments.slice(0, 5).map((p) => ({
        id: p.id,
        type: 'PAYMENT_RECORDED',
        title: `Payment of ₹${formatPaiseToDecimal(parseMoneyToPaise(p.amount.toString()))} recorded`,
        vendorName: p.vendor.name,
        timestamp: p.paymentDate.toISOString().slice(0, 10),
        details: p.notes ?? `Payment via ${p.paymentMethod}`,
      }));

      return {
        kpis: {
          totalVendors,
          categoriesCount: categoriesSet.size,
          confirmedVendors,
          confirmedPercentage,
          shortlistedVendors,
          negotiatingVendors,
          pendingSignatures,
          vendorBudgetCap: formatPaiseToDecimal(budgetCapPaise),
          totalAllocated: formatPaiseToDecimal(totalAgreedPaise),
          totalAmountPaid: formatPaiseToDecimal(totalPaidPaise),
          paidPercentage,
          remainingBalance: formatPaiseToDecimal(remainingBalancePaise),
          upcoming14Days: formatPaiseToDecimal(upcoming14DaysPaise),
        },
        pipelineFunnel,
        budgetByTier,
        upcomingMilestones,
        recentActivity,
      };
    },

    async getComparison(userId: string, vendorIds: string[]): Promise<VendorDTO[]> {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const rows = await db.vendor.findMany({
        where: { id: { in: vendorIds }, weddingId },
        include: {
          services: true,
          vendorEvents: { include: { event: { select: { id: true, name: true } } } },
          bookings: { select: { agreedAmount: true, paidAmount: true } },
        },
      });

      return rows.map(mapVendor);
    },

    async getCalendar(userId: string) {
      const db = requireDb();
      const { weddingId } = await resolveCallerWorkspace(userId);

      const [bookings, payments] = await Promise.all([
        db.vendorBooking.findMany({
          where: { weddingId, status: { not: 'CANCELLED' } },
          include: {
            vendor: { select: { name: true, category: true } },
            event: { select: { name: true } },
          },
        }),
        db.vendorPayment.findMany({
          where: { weddingId },
          include: {
            vendor: { select: { name: true, category: true } },
          },
        }),
      ]);

      const items: Array<{
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
      }> = [];

      for (const b of bookings) {
        if (b.serviceDate) {
          items.push({
            id: `service-${b.id}`,
            type: 'SERVICE',
            date: b.serviceDate.toISOString().slice(0, 10),
            vendorId: b.vendorId,
            vendorName: b.vendor.name,
            category: b.vendor.category as VendorCategoryValue,
            title: b.serviceName,
            amount: formatPaiseToDecimal(parseMoneyToPaise(b.agreedAmount.toString())),
            status: b.status,
            ceremonyName: b.event?.name ?? null,
          });
        }
        if (b.bookingDate) {
          items.push({
            id: `booking-${b.id}`,
            type: 'BOOKING',
            date: b.bookingDate.toISOString().slice(0, 10),
            vendorId: b.vendorId,
            vendorName: b.vendor.name,
            category: b.vendor.category as VendorCategoryValue,
            title: `Contract Signed: ${b.serviceName}`,
            amount: formatPaiseToDecimal(parseMoneyToPaise(b.agreedAmount.toString())),
            status: b.status,
            ceremonyName: b.event?.name ?? null,
          });
        }
      }

      for (const p of payments) {
        items.push({
          id: `payment-${p.id}`,
          type: 'PAYMENT_DUE',
          date: p.paymentDate.toISOString().slice(0, 10),
          vendorId: p.vendorId,
          vendorName: p.vendor.name,
          category: p.vendor.category as VendorCategoryValue,
          title: `Payment: ${p.paymentMethod}`,
          amount: formatPaiseToDecimal(parseMoneyToPaise(p.amount.toString())),
          status: p.paymentStatus,
          ceremonyName: null,
        });
      }

      items.sort((a, b) => a.date.localeCompare(b.date));
      return items;
    },
  };
}
