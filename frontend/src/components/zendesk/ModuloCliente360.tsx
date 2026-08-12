import { Activity } from "lucide-react";

export function ModuloCliente360() {
  return (
    <div className="rounded-lg border border-black-10 bg-white">
      <div className="flex items-center gap-2 border-b border-black-10 px-2.5 py-1.5">
        <Activity size={11} className="text-success" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-black-45">Cliente 360°</span>
      </div>
      <div className="px-2.5 py-2 text-[10px] text-black-25">
        <p>Esperando integración.</p>
        <p className="mt-0.5 text-[9px] text-black-10">Historial · Productos · Tickets DEV · Estado Comercial</p>
      </div>
    </div>
  );
}
