import { cn } from "@/lib/utils";
import { TimelineCard } from "./TimelineCard";
import type { TimelineUI } from "../mappers/timeline.mapper";

interface Props {
  items: TimelineUI[];
  state: "loading" | "empty" | "error" | "success";
  error: string | null;
  onRetry?: () => void;
  className?: string;
}

export function TimelineList({ items, state, error, onRetry, className }: Props) {
  if (state === "error" && error) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-1 p-4 text-center", className)}>
        <p className="text-xs font-medium text-danger">Error al cargar timeline</p>
        <p className="text-xs text-danger">{error}</p>
        {onRetry && <button onClick={onRetry} className="mt-1 rounded-md bg-danger px-3 py-1 text-[10px] font-medium text-white">Reintentar</button>}
      </div>
    );
  }
  if (state === "empty" || items.length === 0) {
    return <div className={cn("flex items-center justify-center p-4 text-center", className)}><p className="text-xs text-black-25">Sin eventos</p></div>;
  }
  return (
    <div className={cn("space-y-0", className)} role="list" aria-label="Línea de tiempo">
      {items.map((item) => <TimelineCard key={item.id} item={item} />)}
    </div>
  );
}
