import { z } from 'zod';
import { isValidMoneyInput, parseMoneyToPaise } from './money';

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

export type ExpenseCategoryValue = (typeof EXPENSE_CATEGORIES)[number];
export type ExpensePaymentStatusValue = (typeof EXPENSE_PAYMENT_STATUSES)[number];
export type ExpensePaymentMethodValue = (typeof EXPENSE_PAYMENT_METHODS)[number];

export function isValidCalendarDate(val: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const [y, m, d] = val.split('-').map(Number);
  if (!y || !m || !d) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const dateStringSchema = z
  .string()
  .trim()
  .refine(isValidCalendarDate, 'Use a valid calendar date in YYYY-MM-DD format.');

function optionalNullableDateSchema() {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === undefined || val === null) return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine((val) => val === null || isValidCalendarDate(val), {
      message: 'Use a valid calendar date in YYYY-MM-DD format.',
    });
}

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

function optionalUuidSchema(label: string) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === undefined || val === null) return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine((val) => val === null || z.string().uuid().safeParse(val).success, {
      message: `Invalid ${label}.`,
    });
}

const nonNegativeMoneySchema = z
  .union([z.number(), z.string()])
  .refine(isValidMoneyInput, 'Enter a valid non-negative amount with up to 2 decimal places.')
  .transform((val) => parseMoneyToPaise(val));

const positiveMoneySchema = nonNegativeMoneySchema.refine(
  (paise) => paise > 0,
  'Amount must be greater than zero.',
);

export const expenseIdParamSchema = z.object({
  expenseId: z.string().uuid('Invalid expense ID.'),
});

export const eventBudgetParamSchema = z.object({
  eventId: z.string().uuid('Invalid event ID.'),
});

export const createExpenseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Expense title is required.')
      .max(180, 'Title must be 180 characters or fewer.'),
    category: z.enum(EXPENSE_CATEGORIES).default('OTHER'),
    amount: positiveMoneySchema,
    paidAmount: nonNegativeMoneySchema.optional(),
    paymentStatus: z.enum(EXPENSE_PAYMENT_STATUSES).default('PENDING'),
    paymentMethod: z
      .union([z.enum(EXPENSE_PAYMENT_METHODS), z.null(), z.undefined()])
      .transform((v) => v ?? null)
      .optional(),
    spentAt: dateStringSchema.optional(),
    dueDate: optionalNullableDateSchema().optional(),
    eventId: optionalUuidSchema('event ID').optional(),
    vendorId: optionalUuidSchema('vendor ID').optional(),
    paidBy: optionalTrimmedString(120).optional(),
    referenceNumber: optionalTrimmedString(120).optional(),
    notes: optionalTrimmedString(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paidAmount !== undefined && data.paidAmount > data.amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paidAmount'],
        message: 'Paid amount cannot exceed total expense amount.',
      });
    }
    if (
      data.paymentStatus === 'PAID' &&
      data.paidAmount !== undefined &&
      data.paidAmount !== data.amount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paidAmount'],
        message: 'Paid amount must match total amount when status is PAID.',
      });
    }
  });

export const updateExpenseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Expense title is required.')
      .max(180, 'Title must be 180 characters or fewer.')
      .optional(),
    category: z.enum(EXPENSE_CATEGORIES).optional(),
    amount: positiveMoneySchema.optional(),
    paidAmount: nonNegativeMoneySchema.optional(),
    paymentStatus: z.enum(EXPENSE_PAYMENT_STATUSES).optional(),
    paymentMethod: z
      .union([z.enum(EXPENSE_PAYMENT_METHODS), z.null(), z.undefined()])
      .transform((v) => v ?? null)
      .optional(),
    spentAt: dateStringSchema.optional(),
    dueDate: optionalNullableDateSchema().optional(),
    eventId: optionalUuidSchema('event ID').optional(),
    vendorId: optionalUuidSchema('vendor ID').optional(),
    paidBy: optionalTrimmedString(120).optional(),
    referenceNumber: optionalTrimmedString(120).optional(),
    notes: optionalTrimmedString(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.amount !== undefined &&
      data.paidAmount !== undefined &&
      data.paidAmount > data.amount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paidAmount'],
        message: 'Paid amount cannot exceed total expense amount.',
      });
    }
    if (
      data.paymentStatus === 'PAID' &&
      data.amount !== undefined &&
      data.paidAmount !== undefined &&
      data.paidAmount !== data.amount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paidAmount'],
        message: 'Paid amount must match total amount when status is PAID.',
      });
    }
  });

export const recordPaymentSchema = z.object({
  paidAmount: nonNegativeMoneySchema,
  paymentMethod: z
    .union([z.enum(EXPENSE_PAYMENT_METHODS), z.null(), z.undefined()])
    .transform((v) => v ?? null)
    .optional(),
  paidBy: optionalTrimmedString(120).optional(),
  referenceNumber: optionalTrimmedString(120).optional(),
});

export const listExpensesQuerySchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  eventId: z.union([z.string().uuid('Invalid event ID.'), z.literal('unassigned')]).optional(),
  vendorId: z.string().uuid('Invalid vendor ID.').optional(),
  paymentStatus: z.enum(EXPENSE_PAYMENT_STATUSES).optional(),
  paymentMethod: z.enum(EXPENSE_PAYMENT_METHODS).optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  search: z.string().trim().max(120).optional(),
  sortBy: z.enum(['spentAt', 'amount', 'paidAmount', 'createdAt', 'title']).default('spentAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const upsertWeddingBudgetSchema = z.object({
  totalBudget: nonNegativeMoneySchema,
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Currency must be a 3-letter ISO code.')
    .default('INR'),
  notes: optionalTrimmedString(2000).optional(),
});

export const upsertEventBudgetSchema = z.object({
  allocatedBudget: nonNegativeMoneySchema,
  notes: optionalTrimmedString(2000).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
export type UpsertWeddingBudgetInput = z.infer<typeof upsertWeddingBudgetSchema>;
export type UpsertEventBudgetInput = z.infer<typeof upsertEventBudgetSchema>;
