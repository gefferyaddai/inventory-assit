interface AppSidebarProps {
  role?: string | null;
}

export function AppSidebar({ role }: AppSidebarProps) {
  return (
    <aside className="w-64 shrink-0 border-r bg-white p-4">
      <div className="text-sm font-semibold">Sidebar</div>
      <div className="mt-2 text-xs text-slate-500">
        Role: {role ?? "unknown"}
      </div>
    </aside>
  );
}
