import * as React from "react";
import { cn } from "@/lib/utils";

type TooltipContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error("Tooltip components must be used within Tooltip.");
  }

  return context;
}

function TooltipProvider({ children }: React.PropsWithChildren<{ delayDuration?: number }>) {
  return <>{children}</>;
}

function Tooltip({ children }: React.PropsWithChildren) {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      {children}
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({
  asChild,
  children,
}: React.PropsWithChildren<{ asChild?: boolean }>) {
  const { setOpen } = useTooltipContext();

  if (!React.isValidElement(children)) {
    return <>{children}</>;
  }

  const child = children as React.ReactElement<{
    onMouseEnter?: React.MouseEventHandler<HTMLElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLElement>;
    onFocus?: React.FocusEventHandler<HTMLElement>;
    onBlur?: React.FocusEventHandler<HTMLElement>;
  }>;

  if (asChild) {
    return React.cloneElement(child, {
      onMouseEnter: (event) => {
        child.props.onMouseEnter?.(event);
        setOpen(true);
      },
      onMouseLeave: (event) => {
        child.props.onMouseLeave?.(event);
        setOpen(false);
      },
      onFocus: (event) => {
        child.props.onFocus?.(event);
        setOpen(true);
      },
      onBlur: (event) => {
        child.props.onBlur?.(event);
        setOpen(false);
      },
    });
  }

  return <span>{children}</span>;
}

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
  }
>(({ className, hidden, children, ...props }, ref) => {
  const { open } = useTooltipContext();

  if (!open || hidden) {
    return null;
  }

  return (
    <div
      ref={ref}
      role="tooltip"
      className={cn(
        "z-50 rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
