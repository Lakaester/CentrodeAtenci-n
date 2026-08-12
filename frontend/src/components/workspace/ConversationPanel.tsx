import { useRef, useEffect, memo } from "react";
import { ConversationMessage } from "./ConversationMessage";
import type { TicketComentario } from "@/hooks/useTicketDetail";

interface Props {
  comentarios: TicketComentario[];
  loading: boolean;
}

export const ConversationPanel = memo(function ConversationPanel({ comentarios, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && comentarios.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comentarios, loading]);

  if (loading) return null;

  if (comentarios.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-[11px] text-black-25">
        Sin mensajes en este ticket
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2.5 overflow-y-auto px-2 py-3">
      {comentarios.map((msg) => (
        <ConversationMessage key={msg.id} msg={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
});
