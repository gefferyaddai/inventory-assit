import type { HTMLAttributes, PropsWithChildren } from "react";

export function Avatar({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden rounded-full ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function AvatarFallback({
  children,
  className = "",
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement>>) {
  return (
    <span
      className={`inline-flex h-full w-full items-center justify-center rounded-full ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}
