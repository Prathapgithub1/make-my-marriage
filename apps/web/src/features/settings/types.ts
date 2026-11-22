export type SettingsTab =
  | 'profile'
  | 'members'
  | 'roles'
  | 'privacy'
  | 'notifications'
  | 'export'
  | 'danger';

export interface WorkspaceSettingsFormState {
  title: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  timezone: string;
  location: string;
  city: string;
  state: string;
  country: string;
  description: string;
  coverImageKey: string;
}

export interface NotificationPreferences {
  dailyDigest: boolean;
  instantRsvp: boolean;
  taskDueReminders: boolean;
  paymentReminders: boolean;
  milestoneAlerts: boolean;
}

export interface PrivacyPreferences {
  isWebsitePublished: boolean;
  allowGuestUploads: boolean;
  showPublicAttendeeCount: boolean;
}
