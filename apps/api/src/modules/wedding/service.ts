import { randomBytes } from 'node:crypto';
import type { PrismaClient } from '../../generated/prisma/client';
import { WeddingRole, WebsiteTheme } from '../../generated/prisma/client';
import { AppError } from '../../shared/app-error';
import { hashToken } from '../auth/security';
import type { CreateWeddingInput, UpdateWeddingInput } from './schemas';
import { generateWeddingSlug } from './slug';

export interface WeddingServiceOperations {
  createWedding(userId: string, input: CreateWeddingInput): Promise<WeddingDetail>;
  getWeddingByUserId(userId: string): Promise<WeddingDetail>;
  updateWedding(userId: string, input: UpdateWeddingInput): Promise<WeddingDetail>;
  getDashboard(userId: string): Promise<DashboardData>;
}

export type WeddingDetail = {
  id: string;
  title: string;
  brideName: string;
  groomName: string;
  weddingDate: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  description: string | null;
  website: {
    slug: string;
    isPublished: boolean;
  } | null;
  galleryToken?: string | null;
};

export type DashboardData = {
  wedding: {
    id: string;
    title: string;
    brideName: string;
    groomName: string;
    weddingDate: string | null;
    location: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    description: string | null;
  };
  countdown: {
    weddingDate: string | null;
    daysRemaining: number | null;
  };
  summary: {
    events: number;
    tasks: { total: number; completed: number };
    guests: number;
    rsvps: { pending: number; attending: number; notAttending: number };
    totalExpenseAmount: string;
    vendors: number;
  };
  upcomingEvents: Array<{
    id: string;
    name: string;
    startsAt: string;
    venueName: string | null;
  }>;
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    status: string;
  }>;
};

export function calculateDaysRemaining(
  weddingDate: Date | string | null,
  timeZone = 'Asia/Kolkata',
): number | null {
  if (!weddingDate) return null;
  const target = typeof weddingDate === 'string' ? new Date(weddingDate) : weddingDate;
  if (isNaN(target.getTime())) return null;

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const [currentYear, currentMonth, currentDay] = formatter.format(now).split('-').map(Number);
  const todayUtc = Date.UTC(currentYear, currentMonth - 1, currentDay);

  let targetYear: number;
  let targetMonth: number;
  let targetDay: number;

  if (typeof weddingDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(weddingDate)) {
    const [y, m, d] = weddingDate.slice(0, 10).split('-').map(Number);
    targetYear = y;
    targetMonth = m;
    targetDay = d;
  } else {
    const targetParts = formatter.format(target).split('-').map(Number);
    targetYear = targetParts[0];
    targetMonth = targetParts[1];
    targetDay = targetParts[2];
  }

  const targetUtc = Date.UTC(targetYear, targetMonth - 1, targetDay);
  return Math.ceil((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

export function createWeddingService(db: PrismaClient | undefined): WeddingServiceOperations {
  function requireDatabase(): PrismaClient {
    if (!db) {
      throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database connection is unavailable.');
    }
    return db;
  }

  async function findUniqueSlug(
    database: PrismaClient,
    brideName: string,
    groomName: string,
    dateStr?: string | null,
  ): Promise<string> {
    const baseSlug = generateWeddingSlug(brideName, groomName, dateStr);
    let candidate = baseSlug;
    let counter = 1;

    while (counter < 50) {
      const existing = await database.websiteSettings.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing) return candidate;
      counter += 1;
      candidate = `${baseSlug}-${counter}`;
    }
    return `${baseSlug}-${Date.now().toString(36)}`;
  }

  return {
    async createWedding(userId: string, input: CreateWeddingInput): Promise<WeddingDetail> {
      const database = requireDatabase();

      // Enforce PRD V1: One user can belong to only one wedding
      const existingMembership = await database.weddingMembership.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (existingMembership) {
        throw new AppError(
          409,
          'ALREADY_HAS_WEDDING',
          'You already belong to a wedding workspace. A user can only belong to one wedding in V1.',
        );
      }

      const weddingDateObj = input.weddingDate ? new Date(input.weddingDate) : null;
      const slug = await findUniqueSlug(
        database,
        input.brideName,
        input.groomName,
        input.weddingDate,
      );
      const galleryToken = randomBytes(32).toString('base64url');
      const galleryTokenHash = hashToken(galleryToken);

      const executeCreation = async (targetSlug: string) => {
        return database.$transaction(async (tx) => {
          const wedding = await tx.wedding.create({
            data: {
              title: input.title,
              brideName: input.brideName,
              groomName: input.groomName,
              weddingDate: weddingDateObj,
              location: input.location ?? null,
              city: input.city ?? null,
              state: input.state ?? null,
              country: input.country ?? null,
              description: input.description ?? null,
              createdByUserId: userId,
            },
          });

          await tx.weddingMembership.create({
            data: {
              weddingId: wedding.id,
              userId,
              role: WeddingRole.ADMIN,
            },
          });

          const website = await tx.websiteSettings.create({
            data: {
              weddingId: wedding.id,
              slug: targetSlug,
              theme: WebsiteTheme.CLASSIC,
              isPublished: false,
            },
          });

          await tx.galleryAccessToken.create({
            data: {
              weddingId: wedding.id,
              tokenHash: galleryTokenHash,
            },
          });

          return { wedding, website };
        });
      };

      let created;
      try {
        created = await executeCreation(slug);
      } catch (err: unknown) {
        // Concurrency safeguard: if slug collision occurs under high concurrency, retry with a unique timestamp suffix
        if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
          const uniqueFallbackSlug = `${slug}-${Date.now().toString(36)}`;
          created = await executeCreation(uniqueFallbackSlug);
        } else {
          throw err;
        }
      }

      return {
        id: created.wedding.id,
        title: created.wedding.title,
        brideName: created.wedding.brideName,
        groomName: created.wedding.groomName,
        weddingDate: created.wedding.weddingDate
          ? created.wedding.weddingDate.toISOString().slice(0, 10)
          : null,
        location: created.wedding.location,
        city: created.wedding.city,
        state: created.wedding.state,
        country: created.wedding.country,
        description: created.wedding.description,
        website: {
          slug: created.website.slug,
          isPublished: created.website.isPublished,
        },
        galleryToken,
      };
    },

    async getWeddingByUserId(userId: string): Promise<WeddingDetail> {
      const database = requireDatabase();
      const membership = await database.weddingMembership.findUnique({
        where: { userId },
        include: {
          wedding: {
            include: {
              websiteSettings: true,
            },
          },
        },
      });

      if (!membership || !membership.wedding) {
        throw new AppError(404, 'NOT_FOUND', 'You do not belong to a wedding workspace.');
      }

      const w = membership.wedding;
      return {
        id: w.id,
        title: w.title,
        brideName: w.brideName,
        groomName: w.groomName,
        weddingDate: w.weddingDate ? w.weddingDate.toISOString().slice(0, 10) : null,
        location: w.location,
        city: w.city,
        state: w.state,
        country: w.country,
        description: w.description,
        website: w.websiteSettings
          ? {
              slug: w.websiteSettings.slug,
              isPublished: w.websiteSettings.isPublished,
            }
          : null,
      };
    },

    async updateWedding(userId: string, input: UpdateWeddingInput): Promise<WeddingDetail> {
      const database = requireDatabase();
      const membership = await database.weddingMembership.findUnique({
        where: { userId },
        select: { weddingId: true, role: true },
      });

      if (!membership) {
        throw new AppError(404, 'NOT_FOUND', 'You do not belong to a wedding workspace.');
      }

      if (membership.role !== WeddingRole.ADMIN) {
        throw new AppError(
          403,
          'FORBIDDEN',
          'Only wedding administrators can modify wedding details.',
        );
      }

      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.brideName !== undefined) updateData.brideName = input.brideName;
      if (input.groomName !== undefined) updateData.groomName = input.groomName;
      if (input.weddingDate !== undefined) {
        updateData.weddingDate = input.weddingDate ? new Date(input.weddingDate) : null;
      }
      if (input.location !== undefined) updateData.location = input.location;
      if (input.city !== undefined) updateData.city = input.city;
      if (input.state !== undefined) updateData.state = input.state;
      if (input.country !== undefined) updateData.country = input.country;
      if (input.description !== undefined) updateData.description = input.description;

      const updated = await database.wedding.update({
        where: { id: membership.weddingId },
        data: updateData,
        include: { websiteSettings: true },
      });

      return {
        id: updated.id,
        title: updated.title,
        brideName: updated.brideName,
        groomName: updated.groomName,
        weddingDate: updated.weddingDate ? updated.weddingDate.toISOString().slice(0, 10) : null,
        location: updated.location,
        city: updated.city,
        state: updated.state,
        country: updated.country,
        description: updated.description,
        website: updated.websiteSettings
          ? {
              slug: updated.websiteSettings.slug,
              isPublished: updated.websiteSettings.isPublished,
            }
          : null,
      };
    },

    async getDashboard(userId: string): Promise<DashboardData> {
      const database = requireDatabase();
      const membership = await database.weddingMembership.findUnique({
        where: { userId },
        include: { wedding: true },
      });

      if (!membership || !membership.wedding) {
        throw new AppError(404, 'NOT_FOUND', 'You do not belong to a wedding workspace.');
      }

      const w = membership.wedding;
      const weddingDateStr = w.weddingDate ? w.weddingDate.toISOString().slice(0, 10) : null;
      const daysRemaining = calculateDaysRemaining(w.weddingDate);

      // Honest counts: V1 schema has 0 records until each module is populated
      return {
        wedding: {
          id: w.id,
          title: w.title,
          brideName: w.brideName,
          groomName: w.groomName,
          weddingDate: weddingDateStr,
          location: w.location,
          city: w.city,
          state: w.state,
          country: w.country,
          description: w.description,
        },
        countdown: {
          weddingDate: weddingDateStr,
          daysRemaining,
        },
        summary: {
          events: 0,
          tasks: { total: 0, completed: 0 },
          guests: 0,
          rsvps: { pending: 0, attending: 0, notAttending: 0 },
          totalExpenseAmount: '0.00',
          vendors: 0,
        },
        upcomingEvents: [],
        upcomingTasks: [],
      };
    },
  };
}
