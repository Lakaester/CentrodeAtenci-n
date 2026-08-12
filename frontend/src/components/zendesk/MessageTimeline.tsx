import { useMemo, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ZendeskMensajeFE } from "./useZendesk";

type TipoVisual = "cliente" | "asesor" | "nota_interna" | "evento" | "adjunto";

interface MensajeVisual extends ZendeskMensajeFE {
  tipoVisual: TipoVisual;
}

function clasificar(msg: ZendeskMensajeFE): TipoVisual {
  if (msg.tipo === "sistema") return "evento";
  if (msg.tipo === "agente") return "nota_interna";
  return "cliente";
}

const TIPO_COLOR: Record<TipoVisual, string> = {
  cliente: "text-black-85",
  asesor: "text-primary",
  nota_interna: "text-warning",
  evento: "text-black-25",
  adjunto: "text-black-45",
};

const TIPO_BG: Record<TipoVisual, string> = {
  cliente: "bg-black-5",
  asesor: "bg-primary",
  nota_interna: "bg-warning-5 border border-amber-200",
  evento: "bg-transparent",
  adjunto: "bg-light",
};

function SeparadorDia({ fecha }: { fecha: string }) {
  const d = new Date(fecha);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  let label: string;
  if (d.toDateString() === hoy.toDateString()) label = "Hoy";
  else if (d.toDateString() === ayer.toDateString()) label = "Ayer";
  else label = d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="h-px flex-1 bg-black-10" />
      <span className="shrink-0 text-[10px] font-medium text-black-25 capitalize">{label}</span>
      <div className="h-px flex-1 bg-black-10" />
    </div>
  );
}

export function MessageTimeline({
  mensajes,
  onSearch,
}: {
  mensajes: ZendeskMensajeFE[];
  onSearch?: (q: string) => void;
}) {
  const [busqueda, setBusqueda] = useState("");

  const timeline = useMemo(() => {
    const items: (MensajeVisual | { tipo: "separador"; fecha: string })[] = [];
    let ultimoDia = "";
    for (const msg of mensajes) {
      const dia = msg.timestamp ? new Date(msg.timestamp).toDateString() : "";
      if (dia && dia !== ultimoDia) {
        items.push({ tipo: "separador" as const, fecha: msg.timestamp });
        ultimoDia = dia;
      }
      items.push({ ...msg, tipoVisual: clasificar(msg) });
    }
    return items;
  }, [mensajes]);

  const filtrados = busqueda
    ? timeline.filter((item) => "contenido" in item && item.contenido.toLowerCase().includes(busqueda.toLowerCase()))
    : timeline;

  return (
    <div className="space-y-1">
      {/* Búsqueda interna */}
      <div className="relative mb-2">
        <Search size={11} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-black-25" />
        <input type="text" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); onSearch?.(e.target.value); }}
          placeholder="Buscar en la conversación..."
          className="w-full rounded-md border border-black-10 bg-light py-1 pl-7 pr-2 text-[11px] text-black-85 placeholder:text-black-25 focus:border-[#2563EB] focus:bg-white focus:outline-none"
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="flex h-full items-center justify-center text-[11px] text-black-25 py-8">
          {busqueda ? "Sin resultados en la conversación" : "Sin mensajes"}
        </div>
      ) : (
        filtrados.map((item, i) => {
          if ("tipo" in item && item.tipo === "separador") {
            return <SeparadorDia key={`sep-${i}`} fecha={item.fecha} />;
          }
          const msg = item as MensajeVisual;
          const bg = TIPO_BG[msg.tipoVisual];
          const esEvento = msg.tipoVisual === "evento";
          const esInterna = msg.tipoVisual === "nota_interna";
          const esCliente = msg.tipoVisual === "cliente";

          if (esEvento) {
            return (
              <div key={msg.id} className="flex items-center gap-2 py-1 text-[10px] text-black-25 italic">
                <RefreshCw size={10} />
                <span>{msg.contenido}</span>
                <span className="ml-auto">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={cn("flex gap-2", esInterna ? "flex-row-reverse" : "")}>
              {esInterna && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning-10 text-[9px]">{/* icon */}</div>
              )}
              <div className={cn(
                "max-w-[82%] rounded-lg px-2.5 py-1.5 text-[12px] leading-relaxed",
                bg,
                esInterna ? "rounded-br-sm" : esCliente ? "rounded-bl-sm" : "",
                esInterna && "text-amber-800",
              )}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn("text-[10px] font-medium", TIPO_COLOR[msg.tipoVisual])}>{msg.emisor}</span>
                  <span className="text-[9px] text-black-25">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                  <span className="ml-auto text-[9px] text-black-10">
                    {msg.tipoVisual === "nota_interna" ? "🔒 Nota interna" : "Respuesta pública"}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{msg.contenido}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
