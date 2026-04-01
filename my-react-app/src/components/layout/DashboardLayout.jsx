import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AppSidebar from "./AppSidebar";

export default function DashboardLayout({ children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}