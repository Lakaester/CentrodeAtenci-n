import { useState } from "react";
import { Loader2, Search, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ZendeskTicketFE } from "./useZendesk";

interface Props {
  tickets: ZendeskTicketFE[];
  loading: boolean;
  activa: string | null;
  onSelect: (id: string) => void;
}

const ESTADO_LABEL: Record<string, string> = {
  new: "Nuevo", open: "Abierto", pending: "Pendiente",
  solved: "Resuelto", closed: "Cerrado",
};

const ESTADO_COLOR: Record<string, string> = {
  new: "bg-success-5 text-success",
  open: "bg-primary-5 text-primary",
  pending: "bg-warning-5 text-warning-65",
  solved: "bg-black-5 text-black-65",
  closed: "bg-black-10 text-black-45",
};

export function BandejaZendesk({ tickets, loading, activa, onSelect }: Props) {
  const [search, setSearch] = useState("");

  const filtrados = tickets.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.clienteNombre.toLowerCase().includes(q) ||
      t.ticketOriginalId.includes(q) ||
      t.asunto.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="shrink-0 border-b border-black-10 p-2.5">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-black-25" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, ID o asunto..."
            className="w-full rounded-lg border border-black-10 bg-light py-1.5 pl-8 pr-3 text-xs text-black-85 placeholder:text-black-25 focus:border-[#2563EB] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex h-full items-center justify-center"><Loader2 size={20} className="animate-spin text-black-25" /></div>
        ) : filtrados.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Inbox size={24} className="text-black-10" />
            <p className="text-xs text-black-25">No hay tickets en esta bandeja</p>
          </div>
        ) : (
          filtrados.map((t) => {
            const estaActiva = activa === t.ticketOriginalId;
            const inic = t.clienteNombre.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
            return (
              <button
                key={t.id} onClick={() => onSelect(t.ticketOriginalId)}
                className={cn(
                  "flex w-full flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left text-xs transition-all",
                  estaActiva
                    ? "border-[#2563EB] bg-primary-5 "
                    : "border-black-5 hover:border-black-10 hover:bg-light",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-10 text-[9px] font-semibold text-primary">{inic}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-black-85">{t.clienteNombre}</p>
                    <p className="truncate text-[10px] text-black-45">#{t.ticketOriginalId} · {t.clienteEmail ?? "Sin email"}</p>
                  </div>
                </div>
                <p className="truncate text-[10px] text-black-45">{t.asunto}</p>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", ESTADO_COLOR[t.ticketOriginalStatus] ?? "")}>
                    {ESTADO_LABEL[t.ticketOriginalStatus] ?? t.ticketOriginalStatus}
                  </span>
                  <span className="text-black-25">
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) : ""}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </nav>
    </div>
  );
}
