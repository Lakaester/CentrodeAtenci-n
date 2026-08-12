import { Flag } from "lucide-react";
import type { ZendeskTicketFE } from "./useZendesk";

function ND() { return <span className="text-black-10 italic">—</span>; }

const ESTADO_LABEL: Record<string, string> = {
  new: "Nuevo", open: "Abierto", pending: "Pendiente",
  solved: "Resuelto", closed: "Cerrado",
};

export function ModuloResultado({ ticket }: { ticket: ZendeskTicketFE }) {
  return (
    <div className="rounded-lg border border-black-10 bg-white">
      <div className="flex items-center gap-2 border-b border-black-10 px-2.5 py-1.5">
        <Flag size={11} className="text-success" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-black-45">Resultado</span>
      </div>
      <div className="space-y-1 px-2.5 py-2 text-[10px]">
        <Fila label="Categoría" valor={ticket.categoria ?? null} />
        <Fila label="Subcategoría" valor={ticket.subcategoria ?? null} />
        <Fila label="Estado atención" valor={ESTADO_LABEL[ticket.ticketOriginalStatus] ?? ticket.ticketOriginalStatus} />
      </div>
    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-black-25">{label}</span>
      <span className="font-medium text-black-85">{valor ?? <ND />}</span>
    </div>
  );
}
