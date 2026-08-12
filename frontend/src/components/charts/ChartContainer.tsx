import { cn } from "@/lib/utils";
import { ChartHeader } from "./ChartHeader";
import { BarChart3 } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  error?: string | null;
  loadingHeight?: number;
  className?: string;
}

export function ChartContainer({
  title,
  subtitle,
  action,
  children,
  isLoading,
  isEmpty,
  emptyMessage = "Sin datos disponibles",
  error,
  loadingHeight = 300,
  className,
}: Props) {
  if (error) {
    return (
      <div className={cn("rounded-lg border border-danger-10 bg-danger-5 p-4", className)}>
        <ChartHeader title={title} subtitle={subtitle} action={action} className="mb-3" />
        <div className="flex items-center justify-center" style={{ height: loadingHeight }}>
          <div className="text-center">
            <p className="text-xs font-semibold text-danger">Error al cargar grafico</p>
            <p className="mt-1 text-[10px] text-danger">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn("rounded-lg border border-black-5 bg-white p-4", className)}>
        <ChartHeader title={title} subtitle={subtitle} action={action} className="mb-3" />
        <div className="flex flex-col items-center justify-center gap-2" style={{ height: loadingHeight }}>
          <BarChart3 size={24} className="text-black-10" />
          <p className="text-xs text-black-25">{emptyMessage}</p>
          <p className="text-[10px] text-black-10">Los datos se mostraran aqui cuando esten disponibles</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("animate-pulse rounded-lg border border-black-5 bg-white p-4", className)}>
        <ChartHeader title={title} subtitle={subtitle} action={action} className="mb-3" />
        <div className="rounded bg-black-5" style={{ height: loadingHeight }} />
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-black-5 bg-white p-4", className)}>
      <ChartHeader title={title} subtitle={subtitle} action={action} className="mb-3" />
      {children}
    </div>
  );
}
