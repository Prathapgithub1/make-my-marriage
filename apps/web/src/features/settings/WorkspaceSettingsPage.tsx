import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  getWedding,
  updateWedding,
  getDashboard,
  type WeddingDetail,
  type DashboardData,
} from '../wedding/weddingApi';
import type {
  SettingsTab,
  WorkspaceSettingsFormState,
  NotificationPreferences,
  PrivacyPreferences,
} from './types';
import { SettingsHeader } from './components/SettingsHeader';
import { SettingsNav } from './components/SettingsNav';
import { GeneralProfileSection } from './components/GeneralProfileSection';
import { WorkspaceMembersSection } from './components/WorkspaceMembersSection';
import { RolesPermissionsSection } from './components/RolesPermissionsSection';
import { PrivacyAccessSection } from './components/PrivacyAccessSection';
import { NotificationsSection } from './components/NotificationsSection';
import { WorkspaceDataExportSection } from './components/WorkspaceDataExportSection';
import { DangerZoneSection } from './components/DangerZoneSection';

const DEFAULT_FORM_STATE: WorkspaceSettingsFormState = {
  title: '',
  brideName: '',
  groomName: '',
  weddingDate: '',
  timezone: 'Asia/Kolkata',
  location: '',
  city: '',
  state: '',
  country: 'India',
  description: '',
  coverImageKey: '',
};

export function WorkspaceSettingsPage() {
  const { session, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Server data
  const [wedding, setWedding] = useState<WeddingDetail | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [initialFormState, setInitialFormState] =
    useState<WorkspaceSettingsFormState>(DEFAULT_FORM_STATE);
  const [formState, setFormState] = useState<WorkspaceSettingsFormState>(DEFAULT_FORM_STATE);

  // Preferences State
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    dailyDigest: true,
    instantRsvp: true,
    taskDueReminders: true,
    paymentReminders: true,
    milestoneAlerts: true,
  });

  const [privacyPrefs, setPrivacyPrefs] = useState<PrivacyPreferences>({
    isWebsitePublished: false,
    allowGuestUploads: true,
    showPublicAttendeeCount: false,
  });

  // Action status
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [membersCount, setMembersCount] = useState<number>(1);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return (
      formState.title !== initialFormState.title ||
      formState.brideName !== initialFormState.brideName ||
      formState.groomName !== initialFormState.groomName ||
      formState.weddingDate !== initialFormState.weddingDate ||
      formState.timezone !== initialFormState.timezone ||
      formState.location !== initialFormState.location ||
      formState.city !== initialFormState.city ||
      formState.state !== initialFormState.state ||
      formState.country !== initialFormState.country ||
      formState.description !== initialFormState.description ||
      formState.coverImageKey !== initialFormState.coverImageKey
    );
  }, [formState, initialFormState]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [weddingData, dashboardData] = await Promise.all([
        getWedding(),
        getDashboard().catch(() => null),
      ]);

      setWedding(weddingData);
      setDashboard(dashboardData);
      setMembersCount(weddingData.membersCount ?? 1);

      const loadedState: WorkspaceSettingsFormState = {
        title: weddingData.title || '',
        brideName: weddingData.brideName || '',
        groomName: weddingData.groomName || '',
        weddingDate: weddingData.weddingDate || '',
        timezone: 'Asia/Kolkata',
        location: weddingData.location || '',
        city: weddingData.city || '',
        state: weddingData.state || '',
        country: weddingData.country || 'India',
        description: weddingData.description || '',
        coverImageKey: weddingData.coverImageKey || '',
      };

      setInitialFormState(loadedState);
      setFormState(loadedState);

      if (weddingData.website) {
        setPrivacyPrefs((prev) => ({
          ...prev,
          isWebsitePublished: weddingData.website?.isPublished ?? false,
        }));
      }
    } catch {
      setError('Failed to load workspace settings. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleChangeField = <K extends keyof WorkspaceSettingsFormState>(
    field: K,
    value: WorkspaceSettingsFormState[K],
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleDiscard = () => {
    setFormState(initialFormState);
  };

  const handleSave = async () => {
    if (!isDirty || isSaving) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(null);
    try {
      const updated = await updateWedding({
        title: formState.title.trim(),
        brideName: formState.brideName.trim(),
        groomName: formState.groomName.trim(),
        weddingDate: formState.weddingDate || null,
        location: formState.location.trim() || null,
        city: formState.city.trim() || null,
        state: formState.state.trim() || null,
        country: formState.country.trim() || null,
        description: formState.description.trim() || null,
        coverImageKey: formState.coverImageKey || null,
      });

      setWedding(updated);

      const newLoadedState: WorkspaceSettingsFormState = {
        title: updated.title || '',
        brideName: updated.brideName || '',
        groomName: updated.groomName || '',
        weddingDate: updated.weddingDate || '',
        timezone: formState.timezone,
        location: updated.location || '',
        city: updated.city || '',
        state: updated.state || '',
        country: updated.country || '',
        description: updated.description || '',
        coverImageKey: updated.coverImageKey || '',
      };

      setInitialFormState(newLoadedState);
      setFormState(newLoadedState);
      setSaveSuccess('Workspace settings saved and synchronized successfully!');

      // Refresh auth session so global headers update
      await refreshSession();

      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workspace settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotification = (key: keyof NotificationPreferences) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaveSuccess(`Updated ${key} notification preference.`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleTogglePrivacy = (key: keyof PrivacyPreferences) => {
    setPrivacyPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaveSuccess(`Updated celebration privacy setting.`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const isAdmin = wedding?.role
    ? wedding.role === 'ADMIN'
    : (session?.membership?.role ?? 'ADMIN') === 'ADMIN';

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-3 text-center">
          <svg className="animate-spin h-8 w-8 text-[#7B341E]" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <div className="text-xs font-semibold text-[#5A453A]">
            Loading Workspace Settings Console...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col">
      {/* Top Breadcrumb & Status Header */}
      <SettingsHeader
        wedding={wedding}
        daysRemaining={dashboard?.countdown?.daysRemaining ?? null}
        userDisplayName={session?.user?.displayName || 'Organizer'}
        userRole={wedding?.role || (session?.membership?.role as 'ADMIN' | 'MANAGER') || 'ADMIN'}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onOpenNotifications={() => setActiveTab('notifications')}
      />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Left Sub-Navigation */}
        <SettingsNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          membersCount={membersCount}
          hasUnsavedChanges={isDirty}
        />

        {/* Right Section Content */}
        <main className="flex-1 p-6 md:p-8 max-w-4xl">
          {saveSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-[#EAF5EB] border border-[#CDE5D1] text-[#2F6B38] text-xs font-medium flex items-center justify-between shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">✓</span>
                <span>{saveSuccess}</span>
              </div>
              <button
                onClick={() => setSaveSuccess(null)}
                className="text-[#2F6B38] hover:opacity-75 font-bold"
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#FBEAE8] border border-[#F5C2BC] text-[#C53030] text-xs font-medium flex items-center justify-between shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">⚠️</span>
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-[#C53030] hover:opacity-75 font-bold"
              >
                ×
              </button>
            </div>
          )}

          {activeTab === 'profile' && (
            <GeneralProfileSection
              formState={formState}
              onChangeField={handleChangeField}
              isAdmin={isAdmin}
              coverImageUrl={wedding?.coverImageUrl}
            />
          )}

          {activeTab === 'members' && (
            <WorkspaceMembersSection
              currentUserId={session?.user?.id}
              isAdmin={isAdmin}
              onMembersCountChange={setMembersCount}
            />
          )}

          {activeTab === 'roles' && <RolesPermissionsSection />}

          {activeTab === 'privacy' && (
            <PrivacyAccessSection
              slug={wedding?.website?.slug}
              galleryToken={wedding?.galleryToken}
              isAdmin={isAdmin}
              preferences={privacyPrefs}
              onTogglePreference={handleTogglePrivacy}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsSection
              preferences={notificationPrefs}
              onTogglePreference={handleToggleNotification}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'export' && (
            <WorkspaceDataExportSection
              weddingTitle={wedding?.title || 'wedding-workspace'}
            />
          )}

          {activeTab === 'danger' && (
            <DangerZoneSection
              weddingTitle={wedding?.title || 'Wedding Workspace'}
              isAdmin={isAdmin}
            />
          )}
        </main>
      </div>
    </div>
  );
}
