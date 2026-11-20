import type { PrismaClient } from '../../generated/prisma/client';
import { WebsiteTheme } from '../../generated/prisma/client';
import { AppError } from '../../shared/app-error';
import {
  type UpdateWebsiteInput,
  type PublicRsvpSubmissionInput,
  type LookupRsvpInput,
  type WebsiteContent,
} from './schemas';

export interface WebsiteStats {
  totalGuests: number;
  attendingCount: number;
  pendingCount: number;
  declinedCount: number;
  responseRate: number;
}

export interface WebsiteRsvpMetrics {
  totalGuests: number;
  attending: number;
  declined: number;
  pending: number;
  rsvpRate: number;
}

export interface WebsiteDetailsDTO {
  id: string;
  weddingId: string;
  slug: string;
  theme: WebsiteTheme;
  isPublished: boolean;
  publishedAt: string | null;
  publicUrl: string;
  content: WebsiteContent;
  stats: WebsiteStats;
  rsvpMetrics: WebsiteRsvpMetrics;
  wedding: {
    title: string;
    brideName: string;
    groomName: string;
    weddingDate: string | null;
    location: string | null;
  };
}

export interface PublicWebsiteDTO {
  weddingId: string;
  title: string;
  brideName: string;
  groomName: string;
  weddingDate: string | null;
  location: string | null;
  slug: string;
  templateId: string;
  theme: WebsiteContent['theme'];
  sections: WebsiteContent['sections'];
  settings?: WebsiteContent['settings'];
  content: WebsiteContent;
  wedding: {
    title: string;
    date: string;
    location: string;
  };
  events: Array<{
    id: string;
    name: string;
    startsAt: string | null;
    endsAt: string | null;
    venueName: string | null;
    venueAddress: string | null;
    dressCode: string | null;
  }>;
}

export const TEMPLATE_PRESETS: Record<string, {
  name: string;
  category: string;
  theme: WebsiteContent['theme'];
}> = {
  'royal-heritage': {
    name: 'Royal Heritage',
    category: 'TRADITIONAL & REGAL',
    theme: {
      palette: {
        primary: '#8A4B35',
        secondary: '#C28238',
        background: '#FAF7F2',
        card: '#FFFFFF',
        text: '#1A1C18',
        accent: '#D19B7F',
      },
      typography: {
        headingFont: 'Playfair Display',
        bodyFont: 'Inter',
        headingScale: 'lg',
      },
      buttonStyle: {
        shape: 'pill',
        variant: 'filled',
      },
      cardStyle: {
        borderRadius: 'lg',
        elevation: 'ambient',
      },
      backgroundPattern: 'royal-damask',
    },
  },
  'modern-minimal': {
    name: 'Modern Minimalist',
    category: 'CONTEMPORARY CHIC',
    theme: {
      palette: {
        primary: '#252723',
        secondary: '#556251',
        background: '#FAF8F5',
        card: '#FFFFFF',
        text: '#1F241E',
        accent: '#7C8977',
      },
      typography: {
        headingFont: 'Playfair Display',
        bodyFont: 'Inter',
        headingScale: 'md',
      },
      buttonStyle: {
        shape: 'soft',
        variant: 'filled',
      },
      cardStyle: {
        borderRadius: 'sm',
        elevation: 'flat',
      },
      backgroundPattern: 'none',
    },
  },
  'floral-romance': {
    name: 'Floral Romance',
    category: 'ROMANTIC PASTEL',
    theme: {
      palette: {
        primary: '#B56576',
        secondary: '#6C7D67',
        background: '#FDF8F9',
        card: '#FFFFFF',
        text: '#2B2325',
        accent: '#E2A9B5',
      },
      typography: {
        headingFont: 'Playfair Display',
        bodyFont: 'Inter',
        headingScale: 'lg',
      },
      buttonStyle: {
        shape: 'pill',
        variant: 'soft',
      },
      cardStyle: {
        borderRadius: 'xl',
        elevation: 'ambient',
      },
      backgroundPattern: 'floral-filigree',
    },
  },
  'bohemian-sunset': {
    name: 'Bohemian Sunset',
    category: 'WARM & RUSTIC',
    theme: {
      palette: {
        primary: '#B66E56',
        secondary: '#A66E22',
        background: '#F7F2EB',
        card: '#FFFFFF',
        text: '#2D231E',
        accent: '#D99B77',
      },
      typography: {
        headingFont: 'Playfair Display',
        bodyFont: 'Inter',
        headingScale: 'lg',
      },
      buttonStyle: {
        shape: 'soft',
        variant: 'outline',
      },
      cardStyle: {
        borderRadius: 'md',
        elevation: 'raised',
      },
      backgroundPattern: 'subtle-paper',
    },
  },
};

export function buildDefaultSections(brideName: string, groomName: string, weddingDateStr: string | null): WebsiteContent['sections'] {
  return [
    {
      id: 'sec-hero',
      type: 'HERO',
      title: 'Hero Welcome',
      isEnabled: true,
      order: 0,
      data: {
        tagline: 'Together with their families, invite you to celebrate their wedding',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=80',
        primaryButtonText: 'RSVP for Celebrations',
        secondaryButtonText: 'View Ceremonies',
        showCountdown: true,
      },
    },
    {
      id: 'sec-couple',
      type: 'COUPLE',
      title: 'The Couple',
      isEnabled: true,
      order: 1,
      data: {
        bride: {
          name: brideName || 'Akshitha Rao',
          role: 'The Bride',
          bio: 'Architect, lover of classical dance, temple architectures, and early morning chai.',
          photoUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        },
        groom: {
          name: groomName || 'Prathap Reddy',
          role: 'The Groom',
          bio: 'Software engineer, avid Himalayan trekker, and curator of vintage Indian vinyl records.',
          photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
        },
        quote: '"In you, I have found the love of my life and my closest friend."',
      },
    },
    {
      id: 'sec-story',
      type: 'STORY',
      title: 'Our Love Story',
      isEnabled: true,
      order: 2,
      data: {
        title: 'How Our Journey Began',
        subtitle: 'From a chance meeting over pour-over coffee to a lifetime of adventures.',
        milestones: [
          {
            title: 'The First Encounter',
            date: 'October 14, 2023',
            description: 'Met over pour-over coffee at a quaint Bangalore cafe and talked until closing time.',
            photoUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80',
          },
          {
            title: 'The Sunrise at Nandi Hills',
            date: 'May 20, 2024',
            description: 'Watched the sunrise above the mist and realized this journey was meant to be forever.',
            photoUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=600&q=80',
          },
          {
            title: 'Underneath the Stars',
            date: 'December 24, 2024',
            description: 'Underneath a canopy of fairy lights by the lake, surrounded by roses, she said yes!',
            photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
          },
        ],
      },
    },
    {
      id: 'sec-events',
      type: 'EVENTS',
      title: 'Ceremonies & Schedule',
      isEnabled: true,
      order: 3,
      data: {
        syncWithEventsModule: true,
        title: 'Wedding Celebrations & Rituals',
        subtitle: 'Join us across all auspicious ceremonies as we unite in sacred matrimony.',
      },
    },
    {
      id: 'sec-venue',
      type: 'VENUE',
      title: 'Venue & Directions',
      isEnabled: true,
      order: 4,
      data: {
        venueName: 'The Royal Palace Courtyard & Gardens',
        address: 'Palace Grounds, Jayamahal Road, Bengaluru, Karnataka 560006',
        city: 'Bengaluru',
        mapUrl: 'https://maps.google.com/?q=Bangalore+Palace',
        valetParking: true,
        checkInNote: 'Dedicated concierge and valet available at Gate 4 from 10:00 AM onwards.',
        imageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
      },
    },
    {
      id: 'sec-gallery',
      type: 'GALLERY',
      title: 'Photo Gallery',
      isEnabled: true,
      order: 5,
      data: {
        title: 'Moments Captured in Time',
        subtitle: 'A glimpse into our happiest pre-wedding memories and celebrations.',
        photos: [
          {
            url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
            caption: 'Sunset in Udaipur',
          },
          {
            url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
            caption: 'The Engagement Ring',
          },
          {
            url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
            caption: 'Haldi Colors',
          },
          {
            url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
            caption: 'Heritage Courtyard',
          },
        ],
      },
    },
    {
      id: 'sec-family',
      type: 'FAMILY',
      title: 'Family & Wedding Party',
      isEnabled: true,
      order: 6,
      data: {
        title: 'Our Beloved Families & Entourage',
        subtitle: 'The pillars of love and joy who made our dream wedding possible.',
        members: [
          { name: 'Smt. & Shri Rao', relation: "Bride's Parents", photoUrl: '' },
          { name: 'Smt. & Shri Reddy', relation: "Groom's Parents", photoUrl: '' },
          { name: 'Sneha Rao', relation: 'Maid of Honour', photoUrl: '' },
          { name: 'Karthik Reddy', relation: 'Best Man', photoUrl: '' },
        ],
      },
    },
    {
      id: 'sec-travel',
      type: 'TRAVEL',
      title: 'Travel & Accommodations',
      isEnabled: true,
      order: 7,
      data: {
        title: 'Guest Hospitality & Stay Details',
        airport: 'Kempegowda International Airport (BLR) — 32 km from venue',
        railway: 'KSR Bengaluru City Junction (SBC) — 6 km from venue',
        hotel: 'ITC Windsor / Taj West End — special guest booking code: MMM2028',
        weatherAdvice: 'Evenings in Bangalore are pleasantly cool (~20°C). Light wraps recommended for outdoor Sangeet.',
      },
    },
    {
      id: 'sec-rsvp',
      type: 'RSVP',
      title: 'Guest RSVP Form',
      isEnabled: true,
      order: 8,
      data: {
        title: 'Kindly Honour Us with Your Presence',
        subtitle: 'Please confirm your attendance so we may reserve your seats and feast preferences.',
        deadlineDate: weddingDateStr ? `Before ${weddingDateStr}` : 'Please RSVP promptly',
        allowOpenRsvp: true,
        collectDietary: true,
      },
    },
    {
      id: 'sec-contact',
      type: 'CONTACT',
      title: 'Contact & Gift Wishes',
      isEnabled: true,
      order: 9,
      data: {
        coordinatorName: 'Wedding Concierge Team',
        phone: '+91 98765 43210',
        email: 'concierge@makemymarriage.com',
        giftPolicy: 'Your presence, blessings, and warm smiles are the greatest gift. No boxed gifts, please.',
      },
    },
    {
      id: 'sec-footer',
      type: 'FOOTER',
      title: 'Footer',
      isEnabled: true,
      order: 10,
      data: {
        hashtag: '#PrathapFoundHisAkshi',
        closingMessage: 'With boundless love and gratitude, we cannot wait to celebrate with you.',
      },
    },
  ];
}

export function buildDefaultContent(brideName: string, groomName: string, weddingDateStr: string | null): WebsiteContent {
  const defaultTemplate = TEMPLATE_PRESETS['royal-heritage'];
  return {
    templateId: 'royal-heritage',
    theme: defaultTemplate.theme,
    sections: buildDefaultSections(brideName, groomName, weddingDateStr),
    settings: {
      title: `${brideName} & ${groomName}'s Royal Wedding`,
      tagline: 'An Auspicious Celebration of Sacred Love',
      coupleNamesOverride: null,
      weddingDateOverride: null,
      locationOverride: null,
      seoTitle: `${brideName} & ${groomName}'s Wedding Website`,
      seoDescription: `Join us in celebrating the wedding of ${brideName} and ${groomName}. Ceremonies, venue details, and RSVP.`,
      socialImageUrl: null,
      visibility: 'PUBLIC',
      password: null,
      allowOpenRsvp: true,
      showCountdown: true,
    },
  };
}

export function createWebsiteService(database: PrismaClient) {
  async function findUserWedding(userId: string) {
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

    if (!membership?.wedding) {
      throw new AppError(404, 'NOT_FOUND', 'Wedding workspace not found.');
    }

    return membership.wedding;
  }

  return {
    async getWebsite(userId: string): Promise<WebsiteDetailsDTO> {
      const wedding = await findUserWedding(userId);
      let website = wedding.websiteSettings;

      if (!website) {
        // Fallback: create default website settings if not already created
        const baseSlug = `${wedding.brideName}-${wedding.groomName}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        const slug = `${baseSlug || 'wedding'}-${Date.now().toString(36)}`;
        const defaultContent = buildDefaultContent(
          wedding.brideName,
          wedding.groomName,
          wedding.weddingDate ? wedding.weddingDate.toISOString().split('T')[0] : null,
        );

        website = await database.websiteSettings.create({
          data: {
            weddingId: wedding.id,
            slug,
            theme: WebsiteTheme.CLASSIC,
            isPublished: false,
            content: defaultContent as unknown as object,
          },
        });
      }

      // Compute RSVP statistics from actual guests in database
      const guests = await database.guest.findMany({
        where: { weddingId: wedding.id },
        select: {
          id: true,
          rsvpStatus: true,
          attendingCount: true,
        },
      });

      const totalGuests = guests.length;
      let attendingCount = 0;
      let pendingCount = 0;
      let declinedCount = 0;

      for (const g of guests) {
        if (g.rsvpStatus === 'ATTENDING') {
          attendingCount += Math.max(g.attendingCount, 1);
        } else if (g.rsvpStatus === 'NOT_ATTENDING') {
          declinedCount += 1;
        } else {
          pendingCount += 1;
        }
      }

      const totalResponses = totalGuests - pendingCount;
      const responseRate = totalGuests > 0 ? Math.round((totalResponses / totalGuests) * 100) : 0;

      const dateStr = wedding.weddingDate ? wedding.weddingDate.toISOString().split('T')[0] : null;
      let content = website.content as unknown as WebsiteContent | null;

      if (!content || !content.sections || content.sections.length === 0) {
        content = buildDefaultContent(wedding.brideName, wedding.groomName, dateStr);
      }

      return {
        id: website.id,
        weddingId: wedding.id,
        slug: website.slug,
        theme: website.theme,
        isPublished: website.isPublished,
        publishedAt: website.publishedAt ? website.publishedAt.toISOString() : null,
        publicUrl: `/w/${website.slug}`,
        content,
        stats: {
          totalGuests,
          attendingCount,
          pendingCount,
          declinedCount,
          responseRate,
        },
        rsvpMetrics: {
          totalGuests,
          attending: attendingCount,
          declined: declinedCount,
          pending: pendingCount,
          rsvpRate: responseRate,
        },
        wedding: {
          title: wedding.title,
          brideName: wedding.brideName,
          groomName: wedding.groomName,
          weddingDate: dateStr,
          location: wedding.city ? `${wedding.city}, ${wedding.state || ''}`.trim() : wedding.location,
        },
      };
    },

    async updateWebsite(userId: string, input: UpdateWebsiteInput): Promise<WebsiteDetailsDTO> {
      const wedding = await findUserWedding(userId);
      const existing = wedding.websiteSettings;

      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Website settings not found.');
      }

      if (input.slug && input.slug !== existing.slug) {
        const slugExists = await database.websiteSettings.findUnique({
          where: { slug: input.slug },
        });
        if (slugExists && slugExists.id !== existing.id) {
          throw new AppError(409, 'SLUG_ALREADY_EXISTS', 'This custom website URL is already claimed.');
        }
      }

      const currentContent = (existing.content as unknown as WebsiteContent) || buildDefaultContent(
        wedding.brideName,
        wedding.groomName,
        wedding.weddingDate ? wedding.weddingDate.toISOString().split('T')[0] : null,
      );

      const mergedContent: WebsiteContent = {
        templateId: input.templateId || input.content?.templateId || currentContent.templateId || 'royal-heritage',
        theme: input.content?.theme || currentContent.theme,
        sections: input.content?.sections || currentContent.sections,
        settings: {
          title: currentContent.settings?.title ?? null,
          tagline: currentContent.settings?.tagline ?? null,
          coupleNamesOverride: currentContent.settings?.coupleNamesOverride ?? null,
          weddingDateOverride: currentContent.settings?.weddingDateOverride ?? null,
          locationOverride: currentContent.settings?.locationOverride ?? null,
          seoTitle: currentContent.settings?.seoTitle ?? null,
          seoDescription: currentContent.settings?.seoDescription ?? null,
          socialImageUrl: currentContent.settings?.socialImageUrl ?? null,
          visibility: input.content?.settings?.visibility ?? currentContent.settings?.visibility ?? 'PUBLIC',
          password: input.content?.settings?.password ?? currentContent.settings?.password ?? null,
          allowOpenRsvp: input.content?.settings?.allowOpenRsvp ?? currentContent.settings?.allowOpenRsvp ?? true,
          showCountdown: input.content?.settings?.showCountdown ?? currentContent.settings?.showCountdown ?? true,
          ...input.content?.settings,
        },
      };

      const updated = await database.websiteSettings.update({
        where: { id: existing.id },
        data: {
          ...(input.slug ? { slug: input.slug } : {}),
          ...(input.theme ? { theme: input.theme as WebsiteTheme } : {}),
          ...(input.isPublished !== undefined
            ? {
                isPublished: input.isPublished,
                publishedAt: input.isPublished ? (existing.publishedAt || new Date()) : null,
              }
            : {}),
          content: mergedContent as unknown as object,
        },
      });

      // Return refreshed details
      return this.getWebsite(userId);
    },

    async publishWebsite(userId: string, isPublished: boolean): Promise<WebsiteDetailsDTO> {
      const wedding = await findUserWedding(userId);
      const existing = wedding.websiteSettings;

      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Website settings not found.');
      }

      await database.websiteSettings.update({
        where: { id: existing.id },
        data: {
          isPublished,
          publishedAt: isPublished ? new Date() : null,
        },
      });

      return this.getWebsite(userId);
    },

    async applyTemplate(userId: string, templateId: string): Promise<WebsiteDetailsDTO> {
      const wedding = await findUserWedding(userId);
      const existing = wedding.websiteSettings;

      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Website settings not found.');
      }

      const preset = TEMPLATE_PRESETS[templateId];
      if (!preset) {
        throw new AppError(400, 'INVALID_TEMPLATE', `Template "${templateId}" does not exist.`);
      }

      const currentContent = (existing.content as unknown as WebsiteContent) || buildDefaultContent(
        wedding.brideName,
        wedding.groomName,
        wedding.weddingDate ? wedding.weddingDate.toISOString().split('T')[0] : null,
      );

      const updatedContent: WebsiteContent = {
        ...currentContent,
        templateId: templateId as WebsiteContent['templateId'],
        theme: preset.theme,
      };

      await database.websiteSettings.update({
        where: { id: existing.id },
        data: {
          content: updatedContent as unknown as object,
        },
      });

      return this.getWebsite(userId);
    },

    async getPublicWebsite(slug: string): Promise<PublicWebsiteDTO> {
      const website = await database.websiteSettings.findUnique({
        where: { slug },
        include: {
          wedding: {
            include: {
              events: {
                where: { status: { not: 'CANCELLED' } },
                orderBy: { startsAt: 'asc' },
              },
            },
          },
        },
      });

      if (!website || !website.isPublished) {
        throw new AppError(404, 'NOT_FOUND', 'Wedding website not found or not currently published.');
      }

      const wedding = website.wedding;
      const dateStr = wedding.weddingDate ? wedding.weddingDate.toISOString().split('T')[0] : null;
      let content = website.content as unknown as WebsiteContent | null;

      if (!content || !content.sections) {
        content = buildDefaultContent(wedding.brideName, wedding.groomName, dateStr);
      }

      const cleanContent: WebsiteContent = {
        templateId: (content.templateId as WebsiteContent['templateId']) || 'royal-heritage',
        theme: content.theme,
        sections: content.sections.filter((s) => s.isEnabled),
        settings: content.settings || {
          title: wedding.title,
          tagline: 'Join us in celebrating our wedding',
          visibility: 'PUBLIC',
          allowOpenRsvp: true,
          showCountdown: true,
        },
      };

      return {
        weddingId: wedding.id,
        title: cleanContent.settings?.title || wedding.title,
        brideName: cleanContent.settings?.coupleNamesOverride?.split('&')[0]?.trim() || wedding.brideName,
        groomName: cleanContent.settings?.coupleNamesOverride?.split('&')[1]?.trim() || wedding.groomName,
        weddingDate: cleanContent.settings?.weddingDateOverride || dateStr,
        location: cleanContent.settings?.locationOverride || wedding.city || wedding.location,
        slug: website.slug,
        templateId: cleanContent.templateId,
        theme: cleanContent.theme,
        sections: cleanContent.sections,
        settings: cleanContent.settings,
        content: cleanContent,
        wedding: {
          title: cleanContent.settings?.title || wedding.title,
          date: cleanContent.settings?.weddingDateOverride || dateStr || '',
          location: cleanContent.settings?.locationOverride || wedding.city || wedding.location || '',
        },
        events: wedding.events.map((e) => ({
          id: e.id,
          name: e.name,
          startsAt: e.startsAt ? e.startsAt.toISOString() : null,
          endsAt: e.endsAt ? e.endsAt.toISOString() : null,
          venueName: e.venueName,
          venueAddress: e.venueAddress,
          dressCode: e.dressCode,
        })),
      };
    },

    async lookupPublicRsvp(slug: string, input: LookupRsvpInput) {
      const website = await database.websiteSettings.findUnique({
        where: { slug },
        include: { wedding: true },
      });

      if (!website || !website.isPublished) {
        throw new AppError(404, 'NOT_FOUND', 'Wedding website not found.');
      }

      const weddingId = website.weddingId;

      if (input.token) {
        const guest = await database.guest.findFirst({
          where: {
            weddingId,
            OR: [
              { invitationToken: input.token },
              { invitationTokenHash: input.token },
            ],
          },
          include: {
            guestEvents: {
              include: { event: true },
            },
          },
        });

        if (guest) {
          return {
            found: true,
            guest: {
              id: guest.id,
              name: guest.name,
              email: guest.email,
              phone: guest.phone,
              rsvpStatus: guest.rsvpStatus,
              attendingCount: guest.attendingCount,
              maxGuests: guest.maxGuests,
              notes: guest.notes,
              invitedEvents: guest.guestEvents.map((ge) => ({
                id: ge.event.id,
                name: ge.event.name,
                startsAt: ge.event.startsAt ? ge.event.startsAt.toISOString() : null,
                venueName: ge.event.venueName,
              })),
            },
          };
        }
      }

      if (input.nameOrEmail) {
        const query = input.nameOrEmail.trim().toLowerCase();
        const guests = await database.guest.findMany({
          where: {
            weddingId,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          include: {
            guestEvents: {
              include: { event: true },
            },
          },
          take: 5,
        });

        if (guests.length > 0) {
          return {
            found: true,
            guests: guests.map((guest) => ({
              id: guest.id,
              name: guest.name,
              email: guest.email,
              rsvpStatus: guest.rsvpStatus,
              attendingCount: guest.attendingCount,
              maxGuests: guest.maxGuests,
              invitedEvents: guest.guestEvents.map((ge) => ({
                id: ge.event.id,
                name: ge.event.name,
                startsAt: ge.event.startsAt ? ge.event.startsAt.toISOString() : null,
                venueName: ge.event.venueName,
              })),
            })),
          };
        }
      }

      return { found: false, guest: null, guests: [] };
    },

    async submitPublicRsvp(slug: string, payload: PublicRsvpSubmissionInput) {
      const website = await database.websiteSettings.findUnique({
        where: { slug },
        include: { wedding: true },
      });

      if (!website || !website.isPublished) {
        throw new AppError(404, 'NOT_FOUND', 'Wedding website not found.');
      }

      const weddingId = website.weddingId;
      let matchedGuest = null;

      if (payload.token) {
        matchedGuest = await database.guest.findFirst({
          where: {
            weddingId,
            OR: [
              { invitationToken: payload.token },
              { invitationTokenHash: payload.token },
            ],
          },
        });
      }

      if (!matchedGuest && payload.email) {
        matchedGuest = await database.guest.findFirst({
          where: {
            weddingId,
            email: { equals: payload.email, mode: 'insensitive' },
          },
        });
      }

      if (!matchedGuest && payload.name) {
        matchedGuest = await database.guest.findFirst({
          where: {
            weddingId,
            name: { equals: payload.name.trim(), mode: 'insensitive' },
          },
        });
      }

      const notesCombined = [
        payload.notes,
        payload.dietaryPreferences ? `Dietary: ${payload.dietaryPreferences}` : null,
      ]
        .filter(Boolean)
        .join(' | ');

      let savedGuest: {
        id: string;
        rsvpStatus: 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING';
        attendingCount: number;
      };

      if (matchedGuest) {
        // Update existing guest record
        const count = payload.rsvpStatus === 'ATTENDING'
          ? Math.max(1, Math.min(payload.attendingCount, matchedGuest.maxGuests || 10))
          : 0;

        savedGuest = await database.guest.update({
          where: { id: matchedGuest.id },
          data: {
            rsvpStatus: payload.rsvpStatus,
            attendingCount: count,
            notes: notesCombined || matchedGuest.notes,
            rsvpRespondedAt: new Date(),
            ...(payload.phone && !matchedGuest.phone ? { phone: payload.phone } : {}),
            ...(payload.email && !matchedGuest.email ? { email: payload.email } : {}),
          },
        });
      } else {
        // Create new guest record from open RSVP
        const count = payload.rsvpStatus === 'ATTENDING' ? Math.max(1, payload.attendingCount) : 0;
        savedGuest = await database.guest.create({
          data: {
            weddingId,
            name: payload.name.trim(),
            email: payload.email || null,
            phone: payload.phone || null,
            maxGuests: Math.max(1, count),
            attendingCount: count,
            rsvpStatus: payload.rsvpStatus,
            notes: notesCombined || null,
            rsvpRespondedAt: new Date(),
          },
        });

        // If specific events were selected, link guest events
        if (payload.selectedEventIds && payload.selectedEventIds.length > 0) {
          await database.guestEvent.createMany({
            data: payload.selectedEventIds.map((eventId) => ({
              guestId: savedGuest.id,
              eventId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return {
        success: true,
        message: payload.rsvpStatus === 'ATTENDING'
          ? 'Thank you! Your RSVP has been confirmed. We look forward to celebrating together!'
          : 'Thank you for letting us know. You will be missed in our celebrations.',
        guestId: savedGuest.id,
        rsvpStatus: savedGuest.rsvpStatus,
        attendingCount: savedGuest.attendingCount,
      };
    },
  };
}

export type WebsiteServiceOperations = ReturnType<typeof createWebsiteService>;
