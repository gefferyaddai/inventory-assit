import { lazy, Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// ── Lazy page imports ─────────────────────────────────────────────────────────

const LoginPage    = lazy(() => import('@/pages/LoginPage.jsx'));
const DashboardLayout = lazy(() => import('@/pages/Dashboard/DashboardLayout'));

// Admin pages
const AdminDashboard         = lazy(() => import('@/pages/admin/AdminDashboard.jsx'));
const ProductsPage           = lazy(() => import('@/pages/admin/ProductsPage.jsx'));
const CategoriesPage         = lazy(() => import('@/pages/admin/CategoriesPage.jsx'));
const SuppliersPage          = lazy(() => import('@/pages/admin/SuppliersPage.jsx'));
const WarehousesPage         = lazy(() => import('@/pages/admin/WarehousesPage.jsx'));
const PurchaseOrdersPage     = lazy(() => import('@/pages/admin/PurchaseOrdersPage.jsx'));
const ReorderSuggestionsPage = lazy(() => import('@/pages/admin/ReorderSuggestionsPage.jsx'));
const ReportsPage            = lazy(() => import('@/pages/admin/ReportsPage.jsx'));
const UserManagementPage     = lazy(() => import('@/pages/admin/UserManagementPage.jsx'));

// Clerk pages
const ClerkDashboard         = lazy(() => import('@/pages/clerk/ClerkDashboard.jsx'));
const ClerkInventoryPage     = lazy(() => import('@/pages/clerk/ClerkInventoryPage.jsx'));
const RecordTransactionPage  = lazy(() => import('@/pages/clerk/RecordTransactionPage.jsx'));
const TransactionHistoryPage = lazy(() => import('@/pages/clerk/TransactionHistoryPage.jsx'));

// Shared pages
const ProfilePage = lazy(() => import('@/pages/ProfilePage.jsx'));
const NotFound    = lazy(() => import('@/pages/NotFound.jsx'));

// ── Guards ────────────────────────────────────────────────────────────────────

function RedirectIfAuthed({ children }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/clerk/dashboard'} replace />;
  }
  return children;
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// ── Suspense wrapper ──────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
      Loading…
    </div>
  );
}

function S({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// ── Route definitions ─────────────────────────────────────────────────────────

export const routes = [
  // Public
  {
    path: '/login',
    element: (
      <RedirectIfAuthed>
        <S><LoginPage /></S>
      </RedirectIfAuthed>
    ),
  },

  // Admin — DashboardLayout handles auth + sidebar/header
  {
    path: '/admin',
    element: <S><DashboardLayout requiredRole="admin" /></S>,
    children: [
      { path: 'dashboard',  element: <S><AdminDashboard /></S> },
      { path: 'products',   element: <S><ProductsPage /></S> },
      { path: 'categories', element: <S><CategoriesPage /></S> },
      { path: 'suppliers',  element: <S><SuppliersPage /></S> },
      { path: 'warehouses', element: <S><WarehousesPage /></S> },
      { path: 'orders',     element: <S><PurchaseOrdersPage /></S> },
      { path: 'reorders',   element: <S><ReorderSuggestionsPage /></S> },
      { path: 'reports',    element: <S><ReportsPage /></S> },
      { path: 'users',      element: <S><UserManagementPage /></S> },
    ],
  },

  // Clerk — DashboardLayout handles auth + sidebar/header
  {
    path: '/clerk',
    element: <S><DashboardLayout requiredRole="clerk" /></S>,
    children: [
      { path: 'dashboard',        element: <S><ClerkDashboard /></S> },
      { path: 'inventory',        element: <S><ClerkInventoryPage /></S> },
      { path: 'transactions/new', element: <S><RecordTransactionPage /></S> },
      { path: 'transactions',     element: <S><TransactionHistoryPage /></S> },
    ],
  },

  // Shared
  {
    path: '/profile',
    element: <RequireAuth><S><ProfilePage /></S></RequireAuth>,
  },

  // Root redirect
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },

  // 404
  {
    path: '*',
    element: <S><NotFound /></S>,
  },
];
