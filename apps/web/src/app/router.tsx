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
          <Route
            path="/guests"
            element={
              <FeaturePlaceholderPage
                feature="Guests & RSVP Management"
                category="GUEST HOSPITALITY"
                description="Centralized wedding guest list, personalized digital invitations, dietary preference collection, and real-time RSVP attendance tracking."
                badge="Next Sprint Priority"
                highlights={[
                  {
                    title: 'Digital RSVP Links',
                    description:
                      'Shareable personalized invitation links with party size and attendance options.',
                  },
                  {
                    title: 'Dietary & Travel Notes',
                    description:
                      'Track meal preferences, flight details, and hotel accommodation requirements.',
                  },
                  {
                    title: 'Event-Level Access',
                    description:
                      'Invite select guests to intimate ceremonies like Haldi or Mehendi while reserving Reception for all.',
                  },
                ]}
              />
            }
          />

          {/* Expenses & Budget */}
          <Route
            path="/expenses"
            element={
              <FeaturePlaceholderPage
                feature="Wedding Expenses & Budget"
                category="FINANCIAL SUITE"
                description="Track venue deposits, vendor payments, shared family contributions, and total wedding expenditure in INR."
                badge="Coming Soon"
                highlights={[
                  {
                    title: 'Category Allocation',
                    description:
                      'Break down budgets by Catering, Decor, Attire, Photography, and Venue hire.',
                  },
                  {
                    title: 'Payment Schedules',
                    description:
                      'Track upcoming installment milestones and record advance token receipts.',
                  },
                  {
                    title: 'Family Contribution Split',
                    description:
                      'Transparently manage expenses paid by bride family, groom family, or couple.',
                  },
                ]}
              />
            }
          />

          {/* Vendors & Partners */}
          <Route
            path="/vendors"
            element={
              <FeaturePlaceholderPage
                feature="Vendors & Partners"
                category="VENDOR DIRECTORY"
                description="Directory of vetted wedding photographers, caterers, makeup artists, decorators, and musicians."
                badge="Coming Soon"
                highlights={[
                  {
                    title: 'Contract Management',
                    description:
                      'Store signed contracts, contact numbers, and service agreements in one place.',
                  },
                  {
                    title: 'Day-of Schedule',
                    description:
                      'Coordinate arrival times and stage setup schedules for every vendor partner.',
                  },
                  {
                    title: 'Vendor Reviews & Quotes',
                    description: 'Compare quotations and track shortlisted vendor portfolios.',
                  },
                ]}
              />
            }
          />

          {/* Wedding Website */}
          <Route
            path="/website"
            element={
              <FeaturePlaceholderPage
                feature="Wedding Website Builder"
                category="DIGITAL CONCIERGE"
                description="Design a bespoke editorial wedding website for your guests with ceremony timelines, hotel recommendations, and love story."
                badge="Live Preview Soon"
                highlights={[
                  {
                    title: 'Editorial Themes',
                    description:
                      'Crafted typography and royal palette themes suited for traditional & destination weddings.',
                  },
                  {
                    title: 'Interactive Maps & Dress Codes',
                    description:
                      'Guide guests with Google Maps venue pins and ceremony dress code suggestions.',
                  },
                  {
                    title: 'Custom Domain & Privacy',
                    description:
                      'Password-protect your wedding website or connect a custom celebration domain.',
                  },
                ]}
              />
            }
          />

          {/* Gallery */}
          <Route
            path="/gallery"
            element={
              <FeaturePlaceholderPage
                feature="Photo & Memory Gallery"
                category="CELEBRATION ARCHIVE"
                description="Private cloud photo gallery for high-resolution ceremony photos, guest uploads, and candid moments."
                badge="Coming Soon"
                highlights={[
                  {
                    title: 'Guest Photo Drops',
                    description:
                      'QR codes at reception tables allowing guests to upload candid moments instantly.',
                  },
                  {
                    title: 'Album Categorization',
                    description:
                      'Separate photo collections for Roka, Sangeet, Wedding, and Reception rituals.',
                  },
                  {
                    title: 'High-Res Cloud Storage',
                    description:
                      'AWS S3 encrypted cloud storage preserving full-resolution memories forever.',
                  },
                ]}
              />
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <FeaturePlaceholderPage
                feature="Workspace Settings"
                category="WORKSPACE CONFIGURATION"
                description="Manage workspace preferences, notification channels, time zones, and wedding privacy rules."
                badge="Settings Hub"
                highlights={[
                  {
                    title: 'Timezone & Localization',
                    description:
                      'Default Asia/Kolkata timezone and Indian wedding celebration presets.',
                  },
                  {
                    title: 'Notification Preferences',
                    description:
                      'WhatsApp and email digest alerts for new RSVP responses and task updates.',
                  },
                  {
                    title: 'Team Permissions',
                    description:
                      'Configure Admin and Manager roles across family members and organizers.',
                  },
                ]}
              />
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
