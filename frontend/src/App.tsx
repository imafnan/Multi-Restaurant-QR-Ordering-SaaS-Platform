import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThankYou } from './pages/ThankYou';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { RestaurantMenuStub } from './pages/RestaurantMenuStub';
import { RestaurantAdminLayout } from './layouts/RestaurantAdminLayout';
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { RestaurantCategories } from './pages/RestaurantCategories';
import { RestaurantItems } from './pages/RestaurantItems';
import { RestaurantSettings } from './pages/RestaurantSettings';
import { RestaurantOrders } from './pages/RestaurantOrders';
import { RestaurantAnalysis } from './pages/RestaurantAnalysis';
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
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public landing page */}
              <Route path="/" element={<ThankYou />} />

              {/* Authentication routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Restaurant Portal & QR Menu Portal */}
              <Route path="/:slug" element={<RestaurantMenuStub />} />

              {/* Restaurant Admin Module */}
              <Route
                path="/restaurant-admin/:slug"
                element={
                  <RestaurantAdminLayout>
                    <RestaurantDashboard />
                  </RestaurantAdminLayout>
                }
              />
              <Route
                path="/restaurant-admin/:slug/categories"
                element={
                  <RestaurantAdminLayout>
                    <RestaurantCategories />
                  </RestaurantAdminLayout>
                }
              />
              <Route
                path="/restaurant-admin/:slug/items"
                element={
                  <RestaurantAdminLayout>
                    <RestaurantItems />
                  </RestaurantAdminLayout>
                }
              />
              <Route
                path="/restaurant-admin/:slug/settings"
                element={
                  <RestaurantAdminLayout>
                    <RestaurantSettings />
                  </RestaurantAdminLayout>
                }
              />
              <Route
                path="/restaurant-admin/:slug/orders"
                element={
                  <RestaurantAdminLayout>
                    <RestaurantOrders />
                  </RestaurantAdminLayout>
                }
              />
              <Route
                path="/restaurant-admin/:slug/analysis"
                element={
                  <RestaurantAdminLayout>
                    <RestaurantAnalysis />
                  </RestaurantAdminLayout>
                }
              />


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
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
