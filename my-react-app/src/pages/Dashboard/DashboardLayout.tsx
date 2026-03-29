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
  "/profile": "Profile & Settings",
};

const DashboardLayout = ({ requiredRole }: Props) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== requiredRole && location.pathname !== "/profile") {
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
      <div className="min-h-screen flex w-full bg-[#f3f5f9]">
        <AppSidebar role={user.role} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h2 className="text-sm font-semibold text-foreground hidden sm:block">
                {pageTitle}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground hidden sm:block">
                      {user.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
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
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;