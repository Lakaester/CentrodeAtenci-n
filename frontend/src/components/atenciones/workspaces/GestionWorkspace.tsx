import { ClipboardList, Clock, User, History } from "lucide-react";
import { AccesosRapidos } from "./AccesosRapidos";

function Widget({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-black-10 bg-light p-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#06B6D4]/10 text-[#06B6D4]">{icon}</div>
      <div>
        <p className="text-[10px] text-black-45">{label}</p>
        <p className="text-sm font-semibold text-black-85">{value}</p>
      </div>
    </div>
  );
}

export function GestionWorkspace() {
  return (
    <div className="space-y-2 p-3">
      <div className="grid grid-cols-2 gap-2">
        <Widget icon={<ClipboardList size={16} />} label="Estado trámite" value="En revisión" />
        <Widget icon={<Clock size={16} />} label="Tiempo estimado" value="3 días hábiles" />
        <Widget icon={<ClipboardList size={16} />} label="Pendientes" value="2 documentos" />
        <Widget icon={<User size={16} />} label="Responsable" value="Ana Torres" />
      </div>
      <div className="rounded-lg border border-black-10 bg-light p-2.5">
        <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-black-45">
          <History size={11} /> Últimos movimientos
        </p>
        <div className="space-y-1 text-[10px] text-black-45">
          <p>• 08/07 — Solicitud ingresada</p>
          <p>• 09/07 — Documentación recibida</p>
          <p>• 10/07 — En revisión por Ana Torres</p>
        </div>
      </div>
      <AccesosRapidos categoria="Gestión" />
    </div>
  );
}
