import { memo } from "react";
import { cn } from "@/lib/utils";
import { ConversationCard } from "./ConversationCard";
import type { ConversationUI } from "../mappers/conversationMapper";

interface Props {
  items: ConversationUI[];
  state: "loading" | "empty" | "error" | "success";
  error: string | null;
  onRetry?: () => void;
  className?: string;
}

export const ConversationList = memo(function ConversationList({ items, state, error, onRetry, className }: Props) {
  if (state === "error" && error) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-1 p-4 text-center", className)}>
        <p className="text-xs font-medium text-danger">Error al cargar conversaciones</p>
        <p className="text-xs text-danger">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-1 rounded-md bg-danger px-3 py-1 text-[10px] font-medium text-white">
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (state === "empty" || items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-4 text-center", className)}>
        <p className="text-xs text-black-25">Sin conversaciones activas</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)} role="list" aria-label="Conversaciones activas">
      {items.map((item) => (
        <ConversationCard key={item.id} item={item} />
      ))}
    </div>
  );
});
