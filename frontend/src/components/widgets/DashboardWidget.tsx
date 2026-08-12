import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";
import { WidgetHeader } from "./WidgetHeader";
import { WidgetFooter } from "./WidgetFooter";
import type { WidgetState } from "./types";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  state?: WidgetState;
  emptyMessage?: string;
  error?: string | null;
  minHeight?: number;
  scroll?: boolean;
  className?: string;
}

export function DashboardWidget({
  title,
  subtitle,
  action,
  children,
  footer,
  state = "success",
  emptyMessage = "Sin informacion disponible",
  error,
  minHeight = 160,
  scroll,
  className,
}: Props) {
  if (state === "loading") {
    return (
      <div
        className={cn(
          "animate-pulse rounded-lg border border-black-5 bg-white p-4",
          className,
        )}
        style={{ minHeight }}
        role="status"
        aria-label="Cargando widget"
      >
        <div className="mb-4 h-4 w-2/3 rounded bg-black-5" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-black-5" />
          <div className="h-3 w-5/6 rounded bg-black-5" />
          <div className="h-3 w-3/4 rounded bg-black-5" />
        </div>
      </div>
    );
  }

  if (state === "error" && error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-danger-10 bg-danger-5 p-4 text-center",
          className,
        )}
        style={{ minHeight }}
      >
        <p className="text-xs font-semibold text-danger">Error</p>
        <p className="text-[10px] text-danger">{error}</p>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-black-5 bg-white p-4 text-center",
          className,
        )}
        style={{ minHeight }}
      >
        <WidgetHeader title={title} subtitle={subtitle} action={action} className="mb-1" />
        <Inbox size={24} className="text-black-10" />
        <p className="text-xs text-black-25">{emptyMessage}</p>
        <p className="text-[10px] text-black-10">Los datos se mostraran aqui cuando esten disponibles</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-black-5 bg-white p-4",
        className,
      )}
    >
      <WidgetHeader title={title} subtitle={subtitle} action={action} />
      <div className={cn("mt-3 flex-1", scroll && "max-h-64 overflow-y-auto")}>
        {children}
      </div>
      {footer && <WidgetFooter>{footer}</WidgetFooter>}
    </div>
  );
}
