import { User } from "lucide-react";
import type { ZendeskTicketFE } from "./useZendesk";

function ND() { return <span className="text-black-10 italic">No disponible</span>; }

export function ModuloCliente({ ticket }: { ticket: ZendeskTicketFE }) {
  return (
    <div className="rounded-lg border border-black-10 bg-white">
      <div className="flex items-center gap-2 border-b border-black-10 px-2.5 py-1.5">
        <User size={11} className="text-primary" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-black-45">Cliente</span>
      </div>
      <div className="space-y-1 px-2.5 py-2 text-[10px]">
        <Fila label="Nombre" valor={ticket.clienteNombre} />
        <Fila label="Correo" valor={ticket.clienteEmail ?? null} />
        <Fila label="Dominio" valor={ticket.dominio ?? null} />
        <Fila label="País" valor={ticket.pais ?? null} />
        <Fila label="Categoría" valor={ticket.categoria ?? null} />
        <Fila label="Subcategoría" valor={ticket.subcategoria ?? null} />
        {ticket.etiquetas && ticket.etiquetas.length > 0 && (
          <div className="flex items-start justify-between gap-2">
            <span className="shrink-0 text-black-25">Etiquetas</span>
            <div className="flex flex-wrap justify-end gap-0.5">
              {ticket.etiquetas.map((t) => (
                <span key={t} className="rounded bg-black-5 px-1 py-0.5 text-[8px] text-black-45">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-black-25">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-black-85">{valor ?? <ND />}</span>
    </div>
  );
}
