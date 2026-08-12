import { RefreshCw, Package, AlertTriangle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccesosRapidos } from "./AccesosRapidos";

function Widget({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-black-10 bg-light p-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-10 text-primary">{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-[10px] text-black-45">{label}</p>
        <p className={cn("text-sm font-semibold", ok === true ? "text-success" : ok === false ? "text-danger" : "text-black-85")}>{value}</p>
      </div>
    </div>
  );
}

const MOCK = {
  sincro: "OK — última: 10:30:12",
  inventarios: "1,284 productos",
  pendientes: 12,
  errores: 2,
};

export function LogisticaWorkspace() {
  return (
    <div className="space-y-2 p-3">
      <div className="grid grid-cols-2 gap-2">
        <Widget icon={<RefreshCw size={16} />} label="Sincronización" value={MOCK.sincro} ok />
        <Widget icon={<Package size={16} />} label="Inventarios" value={MOCK.inventarios} />
        <Widget icon={<AlertTriangle size={16} />} label="Pendientes" value={String(MOCK.pendientes)} ok={MOCK.pendientes === 0} />
        <Widget icon={<AlertTriangle size={16} />} label="Errores" value={String(MOCK.errores)} ok={MOCK.errores === 0} />
      </div>

      <div className="rounded-lg border border-black-10 p-2.5">
        <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-black-45">
          <BookOpen size={11} /> NotebookLM Logística
        </p>
        <p className="text-[10px] text-black-25">Guías de sincronización de inventarios y resolución de errores logísticos.</p>
      </div>

      <div className="rounded-lg border border-black-10 p-2.5">
        <p className="mb-1 text-[10px] font-medium text-black-45">Checklist</p>
        <div className="space-y-1">
          {["Revisar sincronización de inventarios", "Revisar productos", "Revisar configuración", "Revisar pedidos pendientes"].map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-black-5 p-2 text-xs">
              <span className="h-3.5 w-3.5 shrink-0 rounded border border-black-10" />
              <span className="text-black-85">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <AccesosRapidos categoria="Logística" />
    </div>
  );
}
