import type { ZendeskMensajeFE } from "./useZendesk";
import { Clock, MessageSquare, Timer } from "lucide-react";

export function QuickSummary({ mensajes }: { mensajes: ZendeskMensajeFE[] }) {
  if (mensajes.length === 0) return null;

  const clientes = mensajes.filter((m) => m.tipo === "cliente");
  const agentes = mensajes.filter((m) => m.tipo === "agente");
  const primerContacto = mensajes[0];
  const ultimoContacto = mensajes[mensajes.length - 1];

  const primeraRespuesta = agentes.length > 0 ? agentes[0] : null;
  const tiempoPrimeraRespuesta = primerContacto && primeraRespuesta
    ? calcDiff(primerContacto.timestamp, primeraRespuesta.timestamp)
    : null;

  return (
    <div className="flex items-center gap-3 rounded-md bg-light px-2.5 py-1.5 text-[10px] text-black-45">
      <span className="flex items-center gap-1">
        <MessageSquare size={10} />
        {mensajes.length} msgs
      </span>
      <span className="flex items-center gap-1">
        <span className="text-black-10">·</span>
        {clientes.length} cliente · {agentes.length} asesor
      </span>
      {tiempoPrimeraRespuesta && (
        <span className="flex items-center gap-1">
          <Timer size={10} />
          1ra resp. {tiempoPrimeraRespuesta}
        </span>
      )}
      <span className="flex items-center gap-1 ml-auto">
        <Clock size={10} />
        {ultimoContacto.timestamp ? new Date(ultimoContacto.timestamp).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""}
      </span>
    </div>
  );
}

function calcDiff(a: string, b: string): string {
  const diff = Math.abs(new Date(b).getTime() - new Date(a).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "< 1 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m`;
}
