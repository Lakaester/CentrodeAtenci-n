import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { InboxItemFE } from "@/components/zendesk/useZendeskInbox";

interface Props {
  tickets: (InboxItemFE & { canal?: string })[];
  activa: string | null;
  onSelect: (id: string) => void;
}

type FiltroCanal = "" | "correo" | "whatsapp";
type FiltroSub = "" | "meta" | "whaticket";

const CANALES_PRINCIPALES: { key: FiltroCanal; label: string }[] = [
  { key: "", label: "Todos" },
  { key: "correo", label: "Correo" },
  { key: "whatsapp", label: "WhatsApp" },
];

const SUBCANALES: { key: FiltroSub; label: string }[] = [
  { key: "", label: "Todos" },
  { key: "meta", label: "Meta" },
  { key: "whaticket", label: "Whatsicket" },
];

const FILTROS_ESTADO: { key: string; label: string }[] = [
  { key: "", label: "Todos" },
  { key: "new", label: "Nuevo" },
  { key: "open", label: "Abierto" },
  { key: "solved_today", label: "Resueltos hoy" },
  { key: "closed_today", label: "Cerrados hoy" },
];

const ESTADO_LABEL_PRINCIPAL: Record<string, string> = {
  new: "Nuevo",
  open: "Abierto",
  pending: "Pendiente",
  solved: "Resuelto",
  closed: "Cerrado",
};

function esHoy(fechaStr: string): boolean {
  if (!fechaStr) return false;
  const d = new Date(fechaStr);
  const hoy = new Date();
  return d.getDate() === hoy.getDate() && d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
}

function formatearHora(fechaStr: string): string {
  if (!fechaStr) return "";
  const d = new Date(fechaStr);
  const ahora = new Date();
  const diffMs = ahora.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const horas = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = horas >= 12 ? "p. m." : "a. m.";
  const h12 = horas % 12 || 12;
  if (esHoy(fechaStr)) return `${h12}:${mins} ${ampm}`;
  const ayer = new Date(ahora);
  ayer.setDate(ayer.getDate() - 1);
  if (d.toDateString() === ayer.toDateString()) return `Ayer ${h12}:${mins} ${ampm}`;
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

function esWhatsapp(canal?: string): boolean {
  return canal === "whatsapp" || canal === "meta" || canal === "whaticket";
}

export function CompactInbox({ tickets, activa, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [canal, setCanal] = useState<FiltroCanal>("");
  const [subc, setSubc] = useState<FiltroSub>("");
  const [estado, setEstado] = useState("");

  const mostrarSubcanales = canal === "whatsapp";

  const filtrados = tickets.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (!t.subject.toLowerCase().includes(q) && !t.requesterName.toLowerCase().includes(q) && !t.ticketId.includes(q)) return false;
    }
    if (canal) {
      if (canal === "whatsapp") {
        if (!esWhatsapp(t.canal)) return false;
      } else if (t.canal !== canal) {
        return false;
      }
    }
    if (mostrarSubcanales && subc && t.canal !== subc) return false;
    if (estado) {
      if (estado === "solved_today" && t.status !== "solved") return false;
      if (estado === "solved_today" && !esHoy(t.updatedAt)) return false;
      if (estado === "closed_today" && t.status !== "closed" && t.status !== "solved") return false;
      if (estado === "closed_today" && !esHoy(t.updatedAt)) return false;
      if (estado === "pending" && t.status !== "pending") return false;
      if (estado === "open" && t.status !== "open") return false;
      if (estado === "new" && t.status !== "new") return false;
    }
    return true;
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-black-10 p-2">
        <div className="relative">
          <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-black-45" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente, asunto o ticket..."
            className="w-full h-8 rounded border border-black-10 bg-white py-1.5 pl-7 pr-2 text-[11px] text-black-85 placeholder:text-black-25 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="mt-1.5 flex gap-1">
          {CANALES_PRINCIPALES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => { setCanal(c.key as FiltroCanal); setSubc(""); }}
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
                canal === c.key ? "bg-primary text-white" : "bg-black-5 text-black-45 hover:bg-black-10",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {mostrarSubcanales && (
          <div className="mt-1 flex gap-1">
            {SUBCANALES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSubc(s.key as FiltroSub)}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                  subc === s.key ? "bg-success text-white" : "bg-success-5 text-success hover:bg-success-10",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-1 flex flex-wrap gap-1">
          {FILTROS_ESTADO.map((e) => (
            <button
              key={e.key}
              type="button"
              onClick={() => setEstado(estado === e.key ? "" : e.key)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                estado === e.key ? "bg-primary text-white" : "bg-black-5 text-black-45 hover:bg-black-10",
              )}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-1.5">
        {filtrados.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[10px] text-black-25">Sin resultados</div>
        ) : (
          filtrados.map((t) => {
            const estaActiva = activa === t.ticketId;
            const isWa = esWhatsapp(t.canal);
            const estadoLabel = ESTADO_LABEL_PRINCIPAL[t.status] ?? t.status;
            return (
              <button
                key={t.ticketId}
                type="button"
                onClick={() => onSelect(t.ticketId)}
                className={cn(
                  "flex w-full gap-2 rounded px-2 py-2 text-left text-[11px] transition-all",
                  estaActiva
                    ? isWa ? "bg-success-5 border border-success-25" : "bg-primary-5"
                    : isWa ? "bg-success-5/50 hover:bg-success-10/50" : "hover:bg-light",
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  isWa ? "bg-success-10 text-success" : "bg-primary-10 text-primary",
                )}>
                  {t.requesterName.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[9px] font-semibold text-primary">#{t.ticketId}</span>
                    <span className="ml-auto shrink-0 text-[9px] text-black-45">{formatearHora(t.createdAt)}</span>
                  </div>
                  <p className="truncate text-[11px] font-medium text-black-85">{t.requesterName}</p>
                  <p className="truncate text-[10px] text-black-45">{t.subject || "Sin asunto"}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-[9px]">
                    {isWa ? (
                      <Badge variant="whatsapp">WhatsApp</Badge>
                    ) : (
                      <Badge variant="correo">Correo</Badge>
                    )}
                    <span className="text-black-25">·</span>
                    <span className="text-black-45">{estadoLabel}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </nav>
    </div>
  );
}
