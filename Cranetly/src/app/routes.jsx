import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleBasedDashboard } from './components/RoleBasedDashboard';

// Lazy load pages
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const Signup = lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp').then(m => ({ default: m.VerifyOtp })));
const AccountTypeSelection = lazy(() => import('./pages/AccountTypeSelection').then(m => ({ default: m.AccountTypeSelection })));
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const UserProfile = lazy(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfile })));
const VerifyAccount = lazy(() => import('./pages/VerifyAccount').then(m => ({ default: m.VerifyAccount })));
const SettingsNew = lazy(() => import('./pages/SettingsNew').then(m => ({ default: m.SettingsNew })));
const Companies = lazy(() => import('./pages/Companies').then(m => ({ default: m.Companies })));
const Inventory = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const InventoryCompanies = lazy(() => import('./pages/InventoryCompanies').then(m => ({ default: m.InventoryCompanies })));
const CompanyProducts = lazy(() => import('./pages/CompanyProducts').then(m => ({ default: m.CompanyProducts })));
const Messages = lazy(() => import('./pages/Messages').then(m => ({ default: m.Messages })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-gray-600 dark:text-gray-400 text-sm">Loading page...</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForgotPassword />
      </Suspense>
    ),
  },
  {
    path: '/signup',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Signup />
      </Suspense>
    ),
  },
  {
    path: '/signup/verify',
    element: (
      <Suspense fallback={<PageLoader />}>
        <VerifyOtp />
      </Suspense>
    ),
  },
  {
    path: '/signup/account-type',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AccountTypeSelection />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: 'home',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: 'marketplace',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: <RoleBasedDashboard />,
      },
      {
        path: 'inventory',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Inventory />
          </Suspense>
        ),
      },
      {
        path: 'inventory/:companyId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CompanyProducts />
          </Suspense>
        ),
      },
      {
        path: 'inventory-browse',
        element: (
          <Suspense fallback={<PageLoader />}>
            <InventoryCompanies />
          </Suspense>
        ),
      },
      {
        path: 'companies',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Companies />
          </Suspense>
        ),
      },
      {
        path: 'messages',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Messages />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<PageLoader />}>
            <UserProfile />
          </Suspense>
        ),
      },
      {
        path: 'profile/verify',
        element: (
          <Suspense fallback={<PageLoader />}>
            <VerifyAccount />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SettingsNew />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
