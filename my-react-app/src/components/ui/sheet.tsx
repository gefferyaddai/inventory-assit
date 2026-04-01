import * as React from "react";
import { cn } from "@/lib/utils";

type SheetContextValue = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within Sheet.");
  }

  return context;
}

function Sheet({
  open = false,
  onOpenChange,
  children,
}: React.PropsWithChildren<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { side?: "left" | "right" | "top" | "bottom" }
>(({ className, side = "right", children, ...props }, ref) => {
  const { open, onOpenChange } = useSheetContext();

  if (!open) {
    return null;
  }

  const sideClassName =
    side === "left"
      ? "left-0 top-0 h-full"
      : side === "right"
        ? "right-0 top-0 h-full"
        : side === "top"
          ? "left-0 top-0 w-full"
          : "bottom-0 left-0 w-full";

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-950/40"
        onClick={() => onOpenChange?.(false)}
      />
      <div
        ref={ref}
        className={cn("absolute z-10 shadow-lg", sideClassName, className)}
        {...props}
      >
        {children}
      </div>
    </div>
  );
});
SheetContent.displayName = "SheetContent";

export { Sheet, SheetContent };
