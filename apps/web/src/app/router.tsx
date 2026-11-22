import { BrowserRouter, Route, Routes } from 'react-router';
import { App } from './App';
import { NotFoundPage } from './NotFoundPage';
import { SignupPage } from '../features/auth/SignupPage';
import { LoginPage } from '../features/auth/LoginPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { WeddingSetupPage } from '../features/wedding/WeddingSetupPage';
import { DashboardPage } from '../features/wedding/DashboardPage';
import { MembersPage } from '../features/members/MembersPage';
import { AcceptInvitationPage } from '../features/members/AcceptInvitationPage';
import { EventsPage } from '../features/events/EventsPage';
import { EventDetailPage } from '../features/events/EventDetailPage';
import { TasksPage } from '../features/tasks/TasksPage';
import { GuestsPage } from '../features/guests/GuestsPage';
import { ExpensesPage } from '../features/expenses/ExpensesPage';
import { VendorsPage } from '../features/vendors/VendorsPage';
import { WeddingWebsitePage } from '../features/website/WeddingWebsitePage';
import { PublicWeddingWebsitePage } from '../features/website/PublicWeddingWebsitePage';
import { PublicInvitationPage } from '../features/invitations/PublicInvitationPage';
import { GalleryPage } from '../features/gallery/GalleryPage';
import { WorkspaceSettingsPage } from '../features/settings/WorkspaceSettingsPage';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { FeaturePlaceholderPage } from '../features/placeholders/FeaturePlaceholderPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<App />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invitations/members/:token" element={<AcceptInvitationPage />} />
        <Route path="/invite/:token" element={<PublicInvitationPage />} />
        <Route path="/invitations/:token" element={<PublicInvitationPage />} />
        <Route path="/w/:slug" element={<PublicWeddingWebsitePage />} />
        <Route path="/website/:slug" element={<PublicWeddingWebsitePage />} />

        {/* Wedding Setup (Authenticated without wedding) */}
        <Route
          path="/wedding/setup"
          element={
            <ProtectedRoute requireWedding={false}>
              <WeddingSetupPage />
            </ProtectedRoute>
          }
        />

        {/* Authenticated Application with Persistent Sidebar & Layout */}
        <Route
          element={
            <ProtectedRoute requireWedding>
              <AuthenticatedLayout />
            </ProtectedRoute>
          }
        >
          {/* Main Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Wedding Events Management */}
          <Route path="/events" element={<EventsPage />} />
          <Route path="/wedding/events" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />

          {/* Wedding Team & Members */}
          <Route path="/settings/members" element={<MembersPage />} />
          <Route path="/members" element={<MembersPage />} />

          {/* Tasks & Checklists */}
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/wedding/tasks" element={<TasksPage />} />

          {/* Guests & RSVP */}
          <Route path="/guests" element={<GuestsPage />} />
          <Route path="/wedding/guests" element={<GuestsPage />} />

          {/* Expenses & Budget */}
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/wedding/expenses" element={<ExpensesPage />} />

          {/* Vendors & Partners */}
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/wedding/vendors" element={<VendorsPage />} />

          {/* Wedding Website */}
          <Route path="/website" element={<WeddingWebsitePage />} />
          <Route path="/wedding/website" element={<WeddingWebsitePage />} />

          {/* Gallery */}
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/wedding/gallery" element={<GalleryPage />} />

          {/* Settings */}
          <Route path="/settings" element={<WorkspaceSettingsPage />} />
          <Route path="/wedding/settings" element={<WorkspaceSettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
