import { lazy, Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// ── Lazy page imports ─────────────────────────────────────────────────────────

const LoginPage              = lazy(() => import('./pages/Login/Login.jsx'));

// Admin pages
const AdminDashboard         = lazy(() => import('./pages/AdminDashboard/index.jsx'));
const ProductsPage           = lazy(() => import('./pages/Products/index.jsx'));
const CategoriesPage         = lazy(() => import('./pages/Categories/index.jsx'));
const SuppliersPage          = lazy(() => import('./pages/Suppliers/index.jsx'));
const WarehousesPage         = lazy(() => import('./pages/Warehouses/index.jsx'));
const PurchaseOrdersPage     = lazy(() => import('./pages/PurchaseOrders/index.jsx'));
const ReorderSuggestionsPage = lazy(() => import('./pages/ReorderSuggestions/index.jsx'));
const ReportsPage            = lazy(() => import('./pages/Reports/index.jsx'));
const UserManagementPage     = lazy(() => import('./pages/UserManagement/index.jsx'));

// Clerk pages
const ClerkDashboard         = lazy(() => import('./pages/ClerkDashboard/index.jsx'));
const ClerkInventoryPage     = lazy(() => import('./pages/ClerkInventory/index.jsx'));
const RecordTransactionPage  = lazy(() => import('./pages/RecordTransaction/index.jsx'));
const TransactionHistoryPage = lazy(() => import('./pages/TransactionHistory/index.jsx'));

// Shared pages
const ProfilePage            = lazy(() => import('./pages/Profile/index.jsx'));
const NotFound               = lazy(() => import('./pages/NotFound/index.jsx'));

// ── Guards ────────────────────────────────────────────────────────────────────

function RequireAuth({ children, role }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (role && user.role !== role) {
    // Wrong role — redirect to their own dashboard
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/clerk/dashboard'} replace />;
  }
  return children;
}

function RedirectIfAuthed({ children }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/clerk/dashboard'} replace />;
  }
  return children;
}

// ── Fallback ──────────────────────────────────────────────────────────────────

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

  // Admin
  {
    path: '/admin/dashboard',
    element: <RequireAuth role="admin"><S><AdminDashboard /></S></RequireAuth>,
  },
  {
    path: '/admin/products',
    element: <RequireAuth role="admin"><S><ProductsPage /></S></RequireAuth>,
  },
  {
    path: '/admin/categories',
    element: <RequireAuth role="admin"><S><CategoriesPage /></S></RequireAuth>,
  },
  {
    path: '/admin/suppliers',
    element: <RequireAuth role="admin"><S><SuppliersPage /></S></RequireAuth>,
  },
  {
    path: '/admin/warehouses',
    element: <RequireAuth role="admin"><S><WarehousesPage /></S></RequireAuth>,
  },
  {
    path: '/admin/orders',
    element: <RequireAuth role="admin"><S><PurchaseOrdersPage /></S></RequireAuth>,
  },
  {
    path: '/admin/reorders',
    element: <RequireAuth role="admin"><S><ReorderSuggestionsPage /></S></RequireAuth>,
  },
  {
    path: '/admin/reports',
    element: <RequireAuth role="admin"><S><ReportsPage /></S></RequireAuth>,
  },
  {
    path: '/admin/users',
    element: <RequireAuth role="admin"><S><UserManagementPage /></S></RequireAuth>,
  },

  // Clerk
  {
    path: '/clerk/dashboard',
    element: <RequireAuth role="clerk"><S><ClerkDashboard /></S></RequireAuth>,
  },
  {
    path: '/clerk/inventory',
    element: <RequireAuth role="clerk"><S><ClerkInventoryPage /></S></RequireAuth>,
  },
  {
    path: '/clerk/transaction',
    element: <RequireAuth role="clerk"><S><RecordTransactionPage /></S></RequireAuth>,
  },
  {
    path: '/clerk/history',
    element: <RequireAuth role="clerk"><S><TransactionHistoryPage /></S></RequireAuth>,
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
