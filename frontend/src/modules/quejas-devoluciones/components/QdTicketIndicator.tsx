import { Link } from "react-router-dom";
import { useQdPorTicket } from "@/modules/quejas-devoluciones";

export function QdTicketIndicator({ ticketId }: { ticketId: string | null }) {
  const { data: casos, isLoading } = useQdPorTicket(ticketId);

  if (!ticketId || isLoading) return null;
  if (!casos || casos.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {casos.map((c) => {
        const esPrincipal = c.ticket_id === ticketId;
        return (
          <Link
            key={c.id}
            to="/quejas-devoluciones"
            className="inline-flex items-center gap-1 rounded bg-primary-5 px-1.5 py-0.5 text-[9px] font-medium text-primary hover:bg-primary-10"
            title={esPrincipal ? `Abrir caso ${c.numero}` : `Parte del caso ${c.numero}`}
          >
            {c.tipo === "queja" ? "QUEJA" : "DEVOLUCIÓN"} {c.numero}
            {!esPrincipal && <span className="rounded bg-white/60 px-1 text-[8px] text-black-45">parte de caso</span>}
          </Link>
        );
      })}
    </div>
  );
}
