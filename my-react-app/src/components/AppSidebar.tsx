import {
  BarChart3,
  FolderTree,
  History,
  LayoutDashboard,
  Package,
  PlusCircle,
  RefreshCw,
  ShoppingCart,
  Truck,
  Users,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import logoVar1 from "@/assets/images/logoVar1.png";
import logoVar1Big from "@/assets/images/logoVar1Big.png";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import { reorderSuggestions } from "@/data/mockData";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  role?: string | null;
}

type UserRole = "admin" | "clerk";

type SidebarItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  badge?: number;
};

const pendingReorders = reorderSuggestions.filter(
  (reorder) => reorder.status === "Pending",
).length;

const adminItems: SidebarItem[] = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Categories", url: "/admin/categories", icon: FolderTree },
  { title: "Suppliers", url: "/admin/suppliers", icon: Truck },
  { title: "Warehouses", url: "/admin/warehouses", icon: WarehouseIcon },
  { title: "Purchase Orders", url: "/admin/orders", icon: ShoppingCart },
  {
    title: "Reorder Suggestions",
    url: "/admin/reorders",
    icon: RefreshCw,
    badge: pendingReorders,
  },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
  { title: "User Management", url: "/admin/users", icon: Users },
];

const clerkItems: SidebarItem[] = [
  { title: "Dashboard", url: "/clerk/dashboard", icon: LayoutDashboard },
  { title: "Inventory", url: "/clerk/inventory", icon: Package },
  {
    title: "Record Transaction",
    url: "/clerk/transactions/new",
    icon: PlusCircle,
  },
  { title: "Transaction History", url: "/clerk/transactions", icon: History },
];

export function AppSidebar({ role }: { role: UserRole } & AppSidebarProps) {
  const items = role === "admin" ? adminItems : clerkItems;
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className="bg-[#031f4b] text-white border-r-0 shadow-[inset_-1px_0_0_#12325f]"
    >
      <SidebarHeader
        className={
          collapsed
            ? "flex items-center justify-center border-b border-[#12325f] bg-[#031f4b] p-3"
            : "border-b border-[#12325f] bg-[#031f4b] px-5 py-6"
        }
      >
        <div className="flex items-center gap-3">
          <img
            src={collapsed ? logoVar1 : logoVar1Big}
            alt="Inventory Assist"
            className={collapsed ? "h-8 w-8 object-contain" : "h-9 w-9 object-contain"}
          />
          {!collapsed && (
            <span className="text-[20px] font-semibold tracking-tight text-white">
              Inventory Assist
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={collapsed ? "bg-[#031f4b] py-5" : "bg-[#031f4b] px-3 py-5"}>
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 pb-3 text-xs uppercase tracking-[0.2em] text-[#7f94b5]">
            {!collapsed && "Menu"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    className="p-0 h-auto hover:bg-transparent data-[active=true]:bg-transparent"
                  >
                    <NavLink
                      to={item.url}
                      end
                      className={
                        collapsed
                          ? "flex h-12 w-full items-center justify-center rounded-lg text-[#c7d2e3] transition-colors duration-150 hover:bg-[#0f2b50] hover:text-white"
                          : "flex h-12 w-full items-center gap-3 rounded-lg px-4 text-[16px] font-medium text-[#c7d2e3] transition-colors duration-150 hover:bg-[#0f2b50] hover:text-white"
                      }
                      activeClassName="bg-[#16345d] text-[#1ea0e6]"
                    >
                      <item.icon className={collapsed ? "h-[22px] w-[22px] shrink-0" : "h-5 w-5 shrink-0"} />

                      {!collapsed && (
                        <span className="flex flex-1 items-center justify-between gap-2">
                          <span>{item.title}</span>

                          {"badge" in item && item.badge ? (
                            <Badge className="ml-2 flex h-5 min-w-[20px] items-center justify-center border-0 bg-[#f59e0b] px-1.5 text-[10px] text-white">
                              {item.badge}
                            </Badge>
                          ) : null}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
