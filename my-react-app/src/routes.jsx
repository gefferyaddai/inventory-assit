import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "@/pages/Dashboard/DashboardLayout";

import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ProductsPage from "@/pages/admin/ProductsPage";
import CategoriesPage from "@/pages/admin/CategoriesPage";
import SuppliersPage from "@/pages/admin/SuppliersPage";
import WarehousesPage from "@/pages/admin/WarehousesPage";
import PurchaseOrdersPage from "@/pages/admin/PurchaseOrdersPage";
import ReorderSuggestionsPage from "@/pages/admin/ReorderSuggestionsPage";
import ReportsPage from "@/pages/admin/ReportsPage";
import UserManagementPage from "@/pages/admin/UserManagementPage";

import ClerkDashboard from "@/pages/clerk/ClerkDashboard";
import ClerkInventoryPage from "@/pages/clerk/ClerkInventoryPage";
import RecordTransactionPage from "@/pages/clerk/RecordTransactionPage";
import TransactionHistoryPage from "@/pages/clerk/TransactionHistoryPage";

import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/admin" element={<DashboardLayout requiredRole="admin" />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="orders" element={<PurchaseOrdersPage />} />
        <Route path="reorders" element={<ReorderSuggestionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UserManagementPage />} />
      </Route>

      <Route path="/clerk" element={<DashboardLayout requiredRole="clerk" />}>
        <Route path="dashboard" element={<ClerkDashboard />} />
        <Route path="inventory" element={<ClerkInventoryPage />} />
        <Route path="transactions/new" element={<RecordTransactionPage />} />
        <Route path="transactions" element={<TransactionHistoryPage />} />
      </Route>

      <Route path="/profile" element={<ProfilePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
