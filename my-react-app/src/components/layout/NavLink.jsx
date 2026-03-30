import { NavLink as RouterNavLink } from "react-router-dom";

export default function NavLink({ to, children }) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary text-white"
            : "text-muted hover:bg-accent hover:text-white"
        }`
      }
    >
      {children}
    </RouterNavLink>
  );
}