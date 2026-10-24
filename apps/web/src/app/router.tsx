import { BrowserRouter, Route, Routes } from 'react-router';
import { App } from './App';
import { SignupPage } from '../features/auth/SignupPage';
import { LoginPage } from '../features/auth/LoginPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import {
  DashboardPlaceholder,
  WeddingSetupPlaceholder,
} from '../features/auth/ProtectedWorkspacePlaceholder';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/wedding/setup"
          element={
            <ProtectedRoute requireWedding={false}>
              <WeddingSetupPlaceholder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireWedding>
              <DashboardPlaceholder />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}
