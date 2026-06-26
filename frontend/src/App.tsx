import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThankYou } from './pages/ThankYou';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { RestaurantMenuStub } from './pages/RestaurantMenuStub';
import { RestaurantAdminStub } from './pages/RestaurantAdminStub';
import { DashboardLayout } from './layouts/DashboardLayout';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { AllUsers } from './pages/AllUsers';
import { Payments } from './pages/Payments';
import { Settings } from './pages/Settings';
import { SmsSimulator } from './pages/SmsSimulator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<ThankYou />} />

            {/* Authentication routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Restaurant Portal & QR Menu Stubs */}
            <Route path="/restaurant-admin/:slug" element={<RestaurantAdminStub />} />
            <Route path="/:slug" element={<RestaurantMenuStub />} />

            {/* Super Admin Protected Module */}
            <Route
              path="/super-admin"
              element={
                <DashboardLayout>
                  <SuperAdminDashboard />
                </DashboardLayout>
              }
            />
            <Route
              path="/super-admin/users"
              element={
                <DashboardLayout>
                  <AllUsers />
                </DashboardLayout>
              }
            />
            <Route
              path="/super-admin/payments"
              element={
                <DashboardLayout>
                  <Payments />
                </DashboardLayout>
              }
            />
            <Route
              path="/super-admin/settings"
              element={
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              }
            />
            <Route
              path="/super-admin/sms"
              element={
                <DashboardLayout>
                  <SmsSimulator />
                </DashboardLayout>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
