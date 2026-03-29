import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

export function SidebarProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export function SidebarTrigger(
  props: ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button type="button" aria-label="Toggle sidebar" {...props}>
      Menu
    </button>
  );
}
