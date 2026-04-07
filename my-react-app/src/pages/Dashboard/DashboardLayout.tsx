import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserRole = "admin" | "clerk";

interface Props {
  requiredRole: UserRole;
}

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/suppliers": "Suppliers",
  "/admin/warehouses": "Warehouses",
  "/admin/orders": "Purchase Orders",
  "/admin/reorders": "Reorder Suggestions",
  "/admin/reports": "Reports",
  "/admin/users": "User Management",
  "/clerk/dashboard": "Dashboard",
  "/clerk/inventory": "Inventory",
  "/clerk/transactions/new": "Record Transaction",
  "/clerk/transactions": "Transaction History",
  "/admin/profile": "Profile & Settings",
  "/clerk/profile": "Profile & Settings",
};

const DashboardLayout = ({ requiredRole }: Props) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  const profilePath = `/${user.role}/profile`;
  if (user.role !== requiredRole && location.pathname !== profilePath) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin/dashboard" : "/clerk/dashboard"}
        replace
      />
    );
  }

  const pageTitle = pageTitles[location.pathname] || "Inventory Assist";
  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />

      <div className="flex-1 flex flex-col min-w-0 bg-[#f3f5f9]">
          <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-card pl-6 pr-14">
            <div className="flex items-center gap-4 pr-2">
              <SidebarTrigger />
              <h2 className="text-[17px] font-semibold text-slate-800">
                {pageTitle}
              </h2>
            </div>

            <div className="flex items-center gap-4 pr-3">
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="inline-flex h-9 max-w-[180px] items-center gap-2 self-center rounded-full px-2 hover:bg-slate-100"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-[#0f1c3a] text-xs font-semibold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden truncate leading-none text-[14px] font-semibold text-slate-700 sm:block">
                      {user.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="mr-2 w-44">
                  <DropdownMenuItem asChild>
                    <Link to={`/${user.role}/profile`} className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Profile & Settings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 overflow-auto bg-muted/30">
            <Outlet />
          </main>
        </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
