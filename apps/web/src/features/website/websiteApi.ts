import { apiRequest } from '../../lib/api-client';

/**
 * Resolves the full public wedding website URL.
 * In production, uses the custom domain https://make-my-marriage.shop/w/{slug}.
 * In local development, uses http://localhost:1234/w/{slug}.
 */
export function getPublicWeddingWebsiteUrl(slug: string): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local');
    if (!isLocalhost) {
      return `https://make-my-marriage.shop/w/${slug}`;
    }
    return `${window.location.origin}/w/${slug}`;
  }
  return `https://make-my-marriage.shop/w/${slug}`;
}

export type SectionType =
  | 'HERO'
  | 'COUPLE'
  | 'STORY'
  | 'EVENTS'
  | 'VENUE'
  | 'GALLERY'
  | 'FAMILY'
  | 'TRAVEL'
  | 'RSVP'
  | 'CONTACT'
  | 'FOOTER';

export interface WebsiteSection {
  id: string;
  type: SectionType;
  title: string;
  isEnabled: boolean;
  order: number;
  data: Record<string, any>;
}

export interface ThemePalette {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  accent?: string;
}

export interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
  headingScale?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ThemeButtonStyle {
  shape: 'pill' | 'soft' | 'square';
  variant: 'filled' | 'outline' | 'soft';
}

export interface ThemeCardStyle {
  borderRadius: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  elevation: 'flat' | 'raised' | 'ambient';
}

export interface ThemeCustomization {
  palette: ThemePalette;
  typography: ThemeTypography;
  buttonStyle?: ThemeButtonStyle;
  cardStyle?: ThemeCardStyle;
  backgroundPattern?: 'none' | 'subtle-paper' | 'floral-filigree' | 'royal-damask';
}

export interface WebsiteSettingsMeta {
  title?: string | null;
  tagline?: string | null;
  coupleNamesOverride?: string | null;
  weddingDateOverride?: string | null;
  locationOverride?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  socialImageUrl?: string | null;
  visibility: 'PUBLIC' | 'PASSWORD_PROTECTED' | 'UNLISTED';
  password?: string | null;
  allowOpenRsvp: boolean;
  showCountdown: boolean;
}

export interface WebsiteContent {
  templateId: 'royal-heritage' | 'modern-minimal' | 'floral-romance' | 'bohemian-sunset' | string;
  sections: WebsiteSection[];
  theme: ThemeCustomization;
  settings?: WebsiteSettingsMeta;
}

export interface WebsiteDetails {
  id: string;
  weddingId: string;
  slug: string;
  theme: 'CLASSIC' | 'MINIMAL' | 'MODERN';
  isPublished: boolean;
  publishedAt: string | null;
  content: WebsiteContent;
  publicUrl: string;
  rsvpMetrics?: {
    totalGuests: number;
    attending: number;
    declined: number;
    pending: number;
    rsvpRate: number;
  };
  stats?: {
    totalGuests: number;
    attendingCount: number;
    pendingCount: number;
    declinedCount: number;
    responseRate: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplatePreset {
  id: string;
  name: string;
  category: string;
  theme: string;
}

export interface PublicWebsiteDTO {
  id?: string;
  weddingId?: string;
  title?: string;
  brideName?: string;
  groomName?: string;
  weddingDate?: string | null;
  location?: string | null;
  slug: string;
  isPublished?: boolean;
  publishedAt?: string | null;
  templateId?: string;
  theme?: ThemeCustomization;
  sections?: WebsiteSection[];
  settings?: WebsiteSettingsMeta;
  wedding?: {
    title: string;
    date: string;
    location: string;
  };
  content?: WebsiteContent;
  events?: Array<{
    id: string;
    name: string;
    type?: string;
    startTime?: string;
    endTime?: string;
    startsAt?: string | null;
    endsAt?: string | null;
    venueName?: string | null;
    venueAddress?: string | null;
    dressCode?: string | null;
    description?: string;
  }>;
}

export interface PublicRsvpLookupResult {
  found: boolean;
  guest?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    rsvpStatus: 'ATTENDING' | 'DECLINED' | 'PENDING';
    plusOnes: number;
    dietaryRestrictions: string | null;
  };
  events: Array<{
    id: string;
    name: string;
    type: string;
    startTime: string;
    endTime: string;
    attending: boolean;
  }>;
}

export interface SubmitPublicRsvpPayload {
  token?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  rsvpStatus: 'ATTENDING' | 'NOT_ATTENDING';
  attendingCount: number;
  dietaryPreferences?: string | null;
  notes?: string | null;
  selectedEventIds?: string[];
}

function normalizeWebsiteDetails(data: WebsiteDetails): WebsiteDetails {
  if (!data) {
    return {
      id: '',
      weddingId: '',
      slug: '',
      theme: 'CLASSIC',
      isPublished: false,
      publishedAt: null,
      publicUrl: '',
      stats: {
        totalGuests: 0,
        attendingCount: 0,
        pendingCount: 0,
        declinedCount: 0,
        responseRate: 0,
      },
      rsvpMetrics: {
        totalGuests: 0,
        attending: 0,
        declined: 0,
        pending: 0,
        rsvpRate: 0,
      },
      content: {
        templateId: 'royal-heritage',
        sections: [],
        theme: {
          palette: {
            primary: '#883A32',
            secondary: '#4C654D',
            background: '#FAF7F2',
            card: '#FFFFFF',
            text: '#1E1B18',
          },
          typography: {
            headingFont: 'Playfair Display, serif',
            bodyFont: 'Plus Jakarta Sans, sans-serif',
          },
        },
      },
    };
  }

  const totalGuests = data?.rsvpMetrics?.totalGuests ?? data?.stats?.totalGuests ?? 0;
  const attending = data?.rsvpMetrics?.attending ?? data?.stats?.attendingCount ?? 0;
  const declined = data?.rsvpMetrics?.declined ?? data?.stats?.declinedCount ?? 0;
  const pending = data?.rsvpMetrics?.pending ?? data?.stats?.pendingCount ?? 0;
  const rsvpRate = data?.rsvpMetrics?.rsvpRate ?? data?.stats?.responseRate ?? 0;

  const metrics = {
    totalGuests,
    attending,
    declined,
    pending,
    rsvpRate,
  };

  return {
    ...data,
    publicUrl: data.slug ? getPublicWeddingWebsiteUrl(data.slug) : (data.publicUrl || ''),
    rsvpMetrics: metrics,
    stats: data.stats || {
      totalGuests,
      attendingCount: attending,
      declinedCount: declined,
      pendingCount: pending,
      responseRate: rsvpRate,
    },
    content: data.content || {
      templateId: 'royal-heritage',
      sections: [],
      theme: {
        palette: {
          primary: '#883A32',
          secondary: '#4C654D',
          background: '#FAF7F2',
          card: '#FFFFFF',
          text: '#1E1B18',
        },
        typography: {
          headingFont: 'Playfair Display, serif',
          bodyFont: 'Plus Jakarta Sans, sans-serif',
        },
      },
    },
  };
}

export async function getWebsiteSettings(): Promise<WebsiteDetails> {
  const res = await apiRequest<{ data: WebsiteDetails }>('website');
  return normalizeWebsiteDetails(res.data);
}

export async function getAvailableTemplates(): Promise<TemplatePreset[]> {
  const res = await apiRequest<{ data: TemplatePreset[] }>('website/templates');
  return res.data;
}

export async function updateWebsiteSettings(payload: {
  slug?: string;
  theme?: 'CLASSIC' | 'MINIMAL' | 'MODERN';
  templateId?: string;
  isPublished?: boolean;
  content?: Partial<WebsiteContent>;
}): Promise<WebsiteDetails> {
  const res = await apiRequest<{ data: WebsiteDetails }>('website', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return normalizeWebsiteDetails(res.data);
}

export async function publishWebsite(isPublished: boolean = true): Promise<{
  id: string;
  slug: string;
  isPublished: boolean;
  publishedAt: string | null;
  publicUrl: string;
}> {
  const res = await apiRequest<{
    data: {
      id: string;
      slug: string;
      isPublished: boolean;
      publishedAt: string | null;
      publicUrl: string;
    };
  }>('website/publish', {
    method: 'POST',
    body: JSON.stringify({ isPublished }),
  });
  return {
    ...res.data,
    publicUrl: getPublicWeddingWebsiteUrl(res.data.slug),
  };
}

export async function unpublishWebsite(): Promise<{
  id: string;
  slug: string;
  isPublished: boolean;
  publishedAt: string | null;
  publicUrl: string;
}> {
  const res = await apiRequest<{
    data: {
      id: string;
      slug: string;
      isPublished: boolean;
      publishedAt: string | null;
      publicUrl: string;
    };
  }>('website/unpublish', {
    method: 'POST',
  });
  return {
    ...res.data,
    publicUrl: getPublicWeddingWebsiteUrl(res.data.slug),
  };
}

export async function applyWebsiteTemplate(templateId: string): Promise<WebsiteDetails> {
  const res = await apiRequest<{ data: WebsiteDetails }>('website/template', {
    method: 'POST',
    body: JSON.stringify({ templateId }),
  });
  return normalizeWebsiteDetails(res.data);
}

export async function getPublicWebsite(slug: string): Promise<PublicWebsiteDTO> {
  const res = await apiRequest<{ data: PublicWebsiteDTO }>(`public/weddings/${slug}`);
  return res.data;
}

export async function lookupPublicRsvp(
  slug: string,
  query: { token?: string; nameOrEmail?: string },
): Promise<PublicRsvpLookupResult> {
  const res = await apiRequest<{ data: PublicRsvpLookupResult }>(
    `public/weddings/${slug}/rsvp/lookup`,
    {
      method: 'POST',
      body: JSON.stringify(query),
    },
  );
  return res.data;
}

export async function submitPublicRsvp(
  slug: string,
  payload: SubmitPublicRsvpPayload,
): Promise<{ success: boolean; message: string; guestId: string }> {
  const res = await apiRequest<{
    data: { success: boolean; message: string; guestId: string };
  }>(`public/weddings/${slug}/rsvp`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}
