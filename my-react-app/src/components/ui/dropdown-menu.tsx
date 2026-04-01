import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type PropsWithChildren,
  type ReactElement,
} from "react";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const context = useContext(DropdownMenuContext);

  if (!context) {
    throw new Error("DropdownMenu components must be used inside DropdownMenu.");
  }

  return context;
}

export function DropdownMenu({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const value = useMemo(() => ({ open, setOpen }), [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <DropdownMenuContext.Provider value={value}>
      <div ref={containerRef} className="relative inline-flex">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
}: PropsWithChildren<{ asChild?: boolean }>) {
  const { open, setOpen } = useDropdownMenuContext();

  if (!isValidElement(children)) {
    return <>{children}</>;
  }

  const child = children as ReactElement<{ onClick?: (event: ReactMouseEvent<HTMLElement>) => void }>;

  return cloneElement(child, {
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      child.props.onClick?.(event);
      setOpen((current) => !current);
    },
  });
}

export function DropdownMenuContent({
  children,
  className = "",
  align = "center",
}: PropsWithChildren<{ align?: "start" | "center" | "end"; className?: string }>) {
  const { open } = useDropdownMenuContext();

  if (!open) return null;

  const alignmentClassName =
    align === "end"
      ? "right-0"
      : align === "start"
        ? "left-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <div
      className={`absolute top-full z-50 mt-2 rounded-md border bg-white p-1 shadow-sm ${alignmentClassName} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className = "",
  asChild = false,
  onClick,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement> & { asChild?: boolean }>) {
  const { setOpen } = useDropdownMenuContext();

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string; onClick?: () => void }>;

    return cloneElement(child, {
      className: `flex min-h-9 items-center rounded-sm px-2 text-sm ${child.props.className ?? ""} ${className}`.trim(),
      onClick: () => {
        child.props.onClick?.();
        setOpen(false);
      },
    });
  }

  return (
    <div
      className={`flex min-h-9 items-center rounded-sm px-2 text-sm ${className}`.trim()}
      onClick={(event) => {
        onClick?.(event);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-slate-200" />;
}
