import { cn } from "@/lib/utils";
import { FollowerCard } from "./FollowerCard";
import type { FollowerUI } from "../mappers/follower.mapper";

interface Props {
  items: FollowerUI[];
  state: "loading" | "empty" | "error" | "success";
  error: string | null;
  onRetry?: () => void;
  className?: string;
}

export function FollowersList({ items, state, error, onRetry, className }: Props) {
  if (state === "error" && error) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-1 p-4 text-center", className)}>
        <p className="text-xs font-medium text-danger">Error al cargar seguidores</p>
        <p className="text-xs text-danger">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-1 rounded-md bg-danger px-3 py-1 text-[10px] font-medium text-white">Reintentar</button>
        )}
      </div>
    );
  }
  if (state === "empty" || items.length === 0) {
    return <div className={cn("flex items-center justify-center p-4 text-center", className)}><p className="text-xs text-black-25">Sin seguidores</p></div>;
  }
  return (
    <div className={cn("space-y-2", className)} role="list" aria-label="Seguidores">
      {items.map((item) => <FollowerCard key={item.id} item={item} />)}
    </div>
  );
}
