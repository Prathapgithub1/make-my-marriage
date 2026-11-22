import { z } from 'zod';

export const VENDOR_CATEGORIES = [
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
] as const;

export type VendorCategoryValue = (typeof VENDOR_CATEGORIES)[number];

export const VENDOR_STATUSES = [
  'SHORTLISTED',
  'CONTACTED',
  'NEGOTIATING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type VendorStatusValue = (typeof VENDOR_STATUSES)[number];

export const VENDOR_PRICE_RANGES = ['BUDGET', 'MODERATE', 'PREMIUM', 'LUXURY'] as const;
export type VendorPriceRangeValue = (typeof VENDOR_PRICE_RANGES)[number];

export const PAYMENT_METHODS = [
  'UPI',
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CASH',
  'CHEQUE',
  'OTHER',
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];

function optionalTrimmedString(maxLen: number) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === undefined || val === null) return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine((val) => val === null || val.length <= maxLen, {
      message: `Must be ${maxLen} characters or fewer.`,
    });
}

export function isValidCalendarDate(val: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const [yearStr, monthStr, dayStr] = val.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (year < 1900 || year > 2200) return false;
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth;
}

export const vendorIdParamSchema = z.object({
  vendorId: z.string().uuid('Invalid vendor ID.'),
});

export const bookingIdParamSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID.'),
});

export const serviceIdParamSchema = z.object({
  vendorId: z.string().uuid('Invalid vendor ID.'),
  serviceId: z.string().uuid('Invalid service ID.'),
});

export const createVendorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vendor name is required.')
    .max(160, 'Vendor name must be 160 characters or fewer.'),
  category: z.enum(VENDOR_CATEGORIES).default('OTHER'),
  contactName: optionalTrimmedString(120).optional(),
  phone: optionalTrimmedString(30).optional(),
  email: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === undefined || val === null) return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine((val) => val === null || z.string().email().max(255).safeParse(val).success, {
      message: 'Enter a valid email address.',
    })
    .optional(),
  website: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === undefined || val === null) return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine(
      (val) => {
        if (val === null) return true;
        if (val.length > 500) return false;
        try {
          const parsed = new URL(val);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Website must be a valid http or https URL.' },
    )
    .optional(),
  address: optionalTrimmedString(500).optional(),
  city: optionalTrimmedString(120).optional(),
  state: optionalTrimmedString(120).optional(),
  coverImageUrl: optionalTrimmedString(1000).optional(),
  description: optionalTrimmedString(4000).optional(),
  pricing: optionalTrimmedString(200).optional(),
  priceRange: z.enum(VENDOR_PRICE_RANGES).optional().nullable(),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  status: z.enum(VENDOR_STATUSES).default('SHORTLISTED'),
  isFavorite: z.boolean().default(false),
  notes: optionalTrimmedString(2000).optional(),
  eventIds: z.array(z.string().uuid('Invalid event ID.')).optional().default([]),
});

export const updateVendorSchema = createVendorSchema.partial();

export const listVendorsQuerySchema = z.object({
  category: z.enum(VENDOR_CATEGORIES).optional(),
  status: z.enum(VENDOR_STATUSES).optional(),
  priceRange: z.enum(VENDOR_PRICE_RANGES).optional(),
  isFavorite: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
  eventId: z.string().uuid().optional(),
  search: z.string().trim().max(120).optional(),
  sortBy: z.enum(['name', 'createdAt', 'rating', 'category', 'status']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const createBookingSchema = z.object({
  eventId: z.string().uuid('Invalid event ID.').optional().nullable(),
  serviceName: z
    .string()
    .trim()
    .min(1, 'Service name is required.')
    .max(180, 'Service name must be 180 characters or fewer.'),
  status: z.enum(VENDOR_STATUSES).default('SHORTLISTED'),
  bookingDate: z
    .string()
    .trim()
    .refine(isValidCalendarDate, { message: 'Booking date must be a valid YYYY-MM-DD date.' })
    .optional()
    .nullable(),
  serviceDate: z
    .string()
    .trim()
    .refine(isValidCalendarDate, { message: 'Service date must be a valid YYYY-MM-DD date.' })
    .optional()
    .nullable(),
  agreedAmount: z.union([z.number(), z.string()]).transform((v) => String(v).trim()),
  advancePayment: z
    .union([z.number(), z.string()])
    .transform((v) => String(v).trim())
    .optional()
    .default('0'),
  advancePaymentMethod: z.enum(PAYMENT_METHODS).optional().default('BANK_TRANSFER'),
  contractUrl: optionalTrimmedString(1000).optional(),
  contractRef: optionalTrimmedString(120).optional(),
  notes: optionalTrimmedString(2000).optional(),
});

export const updateBookingSchema = createBookingSchema.partial();

export const recordVendorPaymentSchema = z.object({
  amount: z.union([z.number(), z.string()]).transform((v) => String(v).trim()),
  paymentDate: z
    .string()
    .trim()
    .refine(isValidCalendarDate, { message: 'Payment date must be a valid YYYY-MM-DD date.' }),
  paymentMethod: z.enum(PAYMENT_METHODS).default('BANK_TRANSFER'),
  paidBy: optionalTrimmedString(120).optional(),
  referenceNumber: optionalTrimmedString(120).optional(),
  notes: optionalTrimmedString(2000).optional(),
});

export const createServiceSchema = z.object({
  name: z.string().trim().min(1, 'Service name is required.').max(160),
  description: optionalTrimmedString(1000).optional(),
  price: z
    .union([z.number(), z.string()])
    .transform((v) => String(v).trim())
    .optional()
    .nullable(),
  isIncluded: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

export const comparisonQuerySchema = z.object({
  vendorIds: z
    .string()
    .transform((val) => val.split(',').map((id) => id.trim()))
    .pipe(z.array(z.string().uuid()).min(2, 'Select at least 2 vendors to compare.').max(4)),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type ListVendorsQuery = z.infer<typeof listVendorsQuerySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type RecordVendorPaymentInput = z.infer<typeof recordVendorPaymentSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
