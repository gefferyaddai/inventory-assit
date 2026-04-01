import { Bell } from "lucide-react";

export function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Notifications"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
    >
      <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
      <span className="absolute -right-0.5 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-semibold leading-none text-white">
        6
      </span>
    </button>
  );
}
