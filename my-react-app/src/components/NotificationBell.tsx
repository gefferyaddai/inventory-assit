import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, RefreshCw, X } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

type NotificationType = "reorder" | "lowstock";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  function getDestination(type: NotificationType): string {
    if (type === "reorder") return "/admin/reorders";
    return user?.role === "admin" || user?.role === "Admin"
      ? "/admin/products"
      : "/clerk/inventory";
  }

  function handleNotificationClick(n: Notification) {
    setOpen(false);
    navigate(getDestination(n.type));
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const data = await api.get("/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silently fail — bell should not break the layout
    }
  }

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const count = notifications.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-semibold leading-none text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {count > 0 && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                {count} new
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                All caught up — no notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleNotificationClick(n)}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      n.type === "reorder"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {n.type === "reorder" ? (
                      <RefreshCw className="h-3.5 w-3.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700">{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 leading-snug">{n.message}</p>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                    className="mt-0.5 shrink-0 text-slate-300 hover:text-slate-500 transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2">
              <button
                onClick={() => setNotifications([])}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Dismiss all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
