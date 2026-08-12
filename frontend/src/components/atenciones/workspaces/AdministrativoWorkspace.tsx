import { DollarSign, FileText, TrendingUp, Briefcase } from "lucide-react";
import { AccesosRapidos } from "./AccesosRapidos";

function Widget({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-black-10 bg-light p-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">{icon}</div>
      <div>
        <p className="text-[10px] text-black-45">{label}</p>
        <p className="text-sm font-semibold text-black-85">{value}</p>
      </div>
    </div>
  );
}

export function AdministrativoWorkspace() {
  return (
    <div className="space-y-2 p-3">
      <div className="grid grid-cols-2 gap-2">
        <Widget icon={<DollarSign size={16} />} label="Pagos" value="S/ 890.00/mes" />
        <Widget icon={<FileText size={16} />} label="Contratos" value="Plan Base + FE" />
        <Widget icon={<TrendingUp size={16} />} label="LTV" value="S/ 24,850" />
        <Widget icon={<Briefcase size={16} />} label="Estado comercial" value="Activo" />
      </div>
      <div className="rounded-lg border border-black-10 bg-light p-2.5">
        <p className="text-[10px] font-medium text-black-45">Últimos pagos</p>
        <div className="mt-1 space-y-0.5 text-[10px] text-black-45">
          <p>• 01/07/2025 — S/ 890.00 — Pagado</p>
          <p>• 01/06/2025 — S/ 890.00 — Pagado</p>
          <p>• 01/05/2025 — S/ 890.00 — Pagado</p>
        </div>
      </div>
      <AccesosRapidos categoria="Administrativo" />
    </div>
  );
}
