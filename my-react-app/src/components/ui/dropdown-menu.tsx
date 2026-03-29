import type { HTMLAttributes, PropsWithChildren } from "react";

export function DropdownMenu({ children }: PropsWithChildren) {
  return <div className="relative inline-flex">{children}</div>;
}

export function DropdownMenuTrigger({
  children,
}: PropsWithChildren<{ asChild?: boolean }>) {
  return <>{children}</>;
}

export function DropdownMenuContent({
  children,
  className = "",
}: PropsWithChildren<{ align?: "start" | "center" | "end"; className?: string }>) {
  return (
    <div className={`mt-2 rounded-md border bg-white p-1 shadow-sm ${className}`.trim()}>
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className = "",
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement> & { asChild?: boolean }>) {
  return (
    <div
      className={`flex min-h-9 items-center rounded-sm px-2 text-sm ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-slate-200" />;
}
