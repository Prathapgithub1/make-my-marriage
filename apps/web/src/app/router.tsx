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

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/wedding/setup"
          element={
            <ProtectedRoute requireWedding={false}>
              <WeddingSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireWedding>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/members"
          element={
            <ProtectedRoute requireWedding>
              <MembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute requireWedding>
              <MembersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/invitations/members/:token" element={<AcceptInvitationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
