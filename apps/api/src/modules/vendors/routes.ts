import { Router, type Request, type Response } from 'express';
import { prisma } from '../../infrastructure/database/pool';
import { AppError } from '../../shared/app-error';
import { parseCookies, SESSION_COOKIE } from '../auth/security';
import {
  authService as defaultAuthService,
  getRequestId,
  requireCsrf,
  requireSameOrigin,
  type AuthOperations,
} from '../auth/routes';
import {
  bookingIdParamSchema,
  comparisonQuerySchema,
  createBookingSchema,
  createServiceSchema,
  createVendorSchema,
  listVendorsQuerySchema,
  recordVendorPaymentSchema,
  serviceIdParamSchema,
  updateBookingSchema,
  updateVendorSchema,
  vendorIdParamSchema,
  VENDOR_STATUSES,
} from './schemas';
import { createVendorsService, type VendorsServiceOperations } from './service';
import { z } from 'zod';

const defaultVendorsService = createVendorsService(prisma);

async function requireAuthUser(req: Request, auth: AuthOperations) {
  const sessionToken = parseCookies(req.header('Cookie'))[SESSION_COOKIE];
  const user = await auth.authenticate(sessionToken);
  if (!user) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
  }
  return user;
}

function formatZodDetails(issues: Array<{ path: PropertyKey[]; message: string }>) {
  return issues.reduce<Record<string, string>>((acc, issue) => {
    const field = issue.path[0];
    if (typeof field === 'string') {
      acc[field] = issue.message;
    }
    return acc;
  }, {});
}

export function createVendorsRouter(
  service: VendorsServiceOperations = defaultVendorsService,
  auth: AuthOperations = defaultAuthService,
) {
  const router = Router();

  // 1. Dashboard analytics
  router.get('/dashboard', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const analytics = await service.getDashboardAnalytics(user.id);
      res.json({
        data: analytics,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 2. Calendar / Schedule
  router.get('/calendar', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const calendar = await service.getCalendar(user.id);
      res.json({
        data: calendar,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 3. Comparison
  router.get('/comparison', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = comparisonQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid comparison query parameters.', formatZodDetails(parsed.error.issues));
      }

      const vendors = await service.getComparison(user.id, parsed.data.vendorIds);
      res.json({
        data: vendors,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 4. Bookings list
  router.get('/bookings', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const bookings = await service.listBookings(user.id);
      res.json({
        data: bookings,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 5. Booking details
  router.get('/bookings/:bookingId', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = bookingIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid booking ID.');
      }

      const booking = await service.getBooking(user.id, paramParsed.data.bookingId);
      res.json({
        data: booking,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 6. Update booking
  router.patch('/bookings/:bookingId', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = bookingIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid booking ID.');
      }

      const parsed = updateBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Check your booking details and try again.', formatZodDetails(parsed.error.issues));
      }

      const updated = await service.updateBooking(user.id, paramParsed.data.bookingId, parsed.data);
      res.json({
        data: updated,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 7. Delete booking
  router.delete('/bookings/:bookingId', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = bookingIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid booking ID.');
      }

      const result = await service.deleteBooking(user.id, paramParsed.data.bookingId);
      res.json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 8. Payments list
  router.get('/payments', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const payments = await service.listPayments(user.id);
      res.json({
        data: payments,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 9. Record payment installment against a booking
  router.post('/bookings/:bookingId/payments', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = bookingIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid booking ID.');
      }

      const parsed = recordVendorPaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Check payment information and try again.', formatZodDetails(parsed.error.issues));
      }

      const payment = await service.recordPayment(user.id, paramParsed.data.bookingId, parsed.data);
      res.status(201).json({
        data: payment,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 10. List vendors
  router.get('/', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = listVendorsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters.', formatZodDetails(parsed.error.issues));
      }

      const result = await service.listVendors(user.id, parsed.data);
      res.json({
        data: result.vendors,
        pagination: result.pagination,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 11. Create vendor
  router.post('/', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = createVendorSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Check your vendor details and try again.', formatZodDetails(parsed.error.issues));
      }

      const vendor = await service.createVendor(user.id, parsed.data);
      res.status(201).json({
        data: vendor,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 12. Get vendor
  router.get('/:vendorId', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = vendorIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid vendor ID.');
      }

      const vendor = await service.getVendor(user.id, paramParsed.data.vendorId);
      res.json({
        data: vendor,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 13. Update vendor
  router.patch('/:vendorId', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = vendorIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid vendor ID.');
      }

      const parsed = updateVendorSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Check your vendor details and try again.', formatZodDetails(parsed.error.issues));
      }

      const vendor = await service.updateVendor(user.id, paramParsed.data.vendorId, parsed.data);
      res.json({
        data: vendor,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 14. Delete vendor
  router.delete('/:vendorId', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = vendorIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid vendor ID.');
      }

      const result = await service.deleteVendor(user.id, paramParsed.data.vendorId);
      res.json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 15. Toggle favorite
  router.patch('/:vendorId/favorite', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = vendorIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid vendor ID.');
      }

      const result = await service.toggleFavorite(user.id, paramParsed.data.vendorId);
      res.json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 16. Update status
  router.patch('/:vendorId/status', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = vendorIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid vendor ID.');
      }

      const bodySchema = z.object({
        status: z.enum(VENDOR_STATUSES),
      });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid vendor status.');
      }

      const result = await service.updateStatus(user.id, paramParsed.data.vendorId, parsed.data.status);
      res.json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 17. Create booking for vendor
  router.post('/:vendorId/bookings', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = vendorIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid vendor ID.');
      }

      const parsed = createBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Check booking details and try again.', formatZodDetails(parsed.error.issues));
      }

      const booking = await service.createBooking(user.id, paramParsed.data.vendorId, parsed.data);
      res.status(201).json({
        data: booking,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 18. Add service package to vendor
  router.post('/:vendorId/services', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = vendorIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid vendor ID.');
      }

      const parsed = createServiceSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Check service details and try again.', formatZodDetails(parsed.error.issues));
      }

      const s = await service.createService(user.id, paramParsed.data.vendorId, parsed.data);
      res.status(201).json({
        data: s,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 19. Delete service
  router.delete('/:vendorId/services/:serviceId', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = serviceIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid vendor or service ID.');
      }

      const result = await service.deleteService(user.id, paramParsed.data.vendorId, paramParsed.data.serviceId);
      res.json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export const vendorsRouter = createVendorsRouter();
