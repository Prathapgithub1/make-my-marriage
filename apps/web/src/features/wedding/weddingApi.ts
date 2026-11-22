import { apiRequest } from '../../lib/api-client';

export type CreateWeddingInput = {
  title: string;
  brideName: string;
  groomName: string;
  weddingDate?: string | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  description?: string | null;
  coverImageKey?: string | null;
};

export type UpdateWeddingInput = Partial<CreateWeddingInput>;

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
  coverImageKey?: string | null;
  coverImageUrl?: string | null;
  role?: 'ADMIN' | 'MANAGER';
  membersCount?: number;
  createdAt?: string;
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
    tasks: { total: number; completed: number; due?: number };
    guests: number;
    rsvps: { pending: number; attending: number; notAttending: number };
    totalExpenseAmount: string;
    vendors: number;
    budget?: {
      totalBudget: string;
      totalPaidAmount: string;
      remainingBudget: string;
      hasBudgetConfigured: boolean;
      expenseCount: number;
    };
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

type Envelope<T> = { data: T; requestId?: string };

export function createWedding(input: CreateWeddingInput): Promise<WeddingDetail> {
  return apiRequest<Envelope<WeddingDetail>>('wedding', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((res) => res.data);
}

export function getWedding(): Promise<WeddingDetail> {
  return apiRequest<Envelope<WeddingDetail>>('wedding').then((res) => res.data);
}

export function updateWedding(input: UpdateWeddingInput): Promise<WeddingDetail> {
  return apiRequest<Envelope<WeddingDetail>>('wedding', {
    method: 'PATCH',
    body: JSON.stringify(input),
  }).then((res) => res.data);
}

export function getCoverUploadUrl(
  fileName: string,
  contentType: string,
  fileSize: number,
): Promise<{ uploadUrl: string; s3ObjectKey: string; uploadHeaders: Record<string, string> }> {
  return apiRequest<
    Envelope<{ uploadUrl: string; s3ObjectKey: string; uploadHeaders: Record<string, string> }>
  >('wedding/cover/upload-url', {
    method: 'POST',
    body: JSON.stringify({ fileName, contentType, fileSize }),
  }).then((res) => res.data);
}

export async function uploadCoverToS3(
  uploadUrl: string,
  file: File,
  headers: Record<string, string> = {},
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      ...headers,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload cover image to cloud storage (${response.status})`);
  }
}

export function deleteWeddingWorkspace(): Promise<{ success: boolean; message: string }> {
  return apiRequest<Envelope<{ success: boolean; message: string }>>('wedding', {
    method: 'DELETE',
  }).then((res) => res.data);
}

export function getDashboard(): Promise<DashboardData> {
  return apiRequest<Envelope<DashboardData>>('dashboard').then((res) => res.data);
}
