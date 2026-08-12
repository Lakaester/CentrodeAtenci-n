import { Cpu, Settings, RefreshCw, AlertTriangle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccesosRapidos } from "./AccesosRapidos";

function Widget({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-black-10 bg-light p-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6366F1]/10 text-[#6366F1]">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-black-45">{label}</p>
        <p className={cn("text-sm font-semibold", ok === true ? "text-success" : ok === false ? "text-danger" : "text-black-85")}>{value}</p>
      </div>
    </div>
  );
}

export function SoftwareWorkspace() {
  return (
    <div className="space-y-2 p-3">
      <div className="grid grid-cols-2 gap-2">
        <Widget icon={<Cpu size={16} />} label="Versión" value="v3.2.1 (build 2847)" />
        <Widget icon={<Settings size={16} />} label="Opciones activas" value="12" />
        <Widget icon={<RefreshCw size={16} />} label="Actualizaciones" value="2 pendientes" ok={false} />
        <Widget icon={<AlertTriangle size={16} />} label="Errores conocidos" value="3 reportados" ok={false} />
      </div>
      <div className="rounded-lg border border-black-10 p-2.5">
        <p className="mb-1 text-[10px] font-medium text-black-45">Configuraciones activas</p>
        <div className="flex flex-wrap gap-1">
          {["FE", "SMS", "API REST", "Multi-local", "Logística", "Dashboard"].map((c, i) => (
            <span key={i} className="rounded bg-black-5 px-1.5 py-0.5 text-[9px] text-black-45">{c}</span>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-black-10 p-2.5">
        <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-black-45">
          <BookOpen size={11} /> NotebookLM Software
        </p>
        <p className="text-[10px] text-black-25">Documentación técnica, changelogs y guías de actualización.</p>
      </div>
      <div className="rounded-lg border border-black-10 p-2.5">
        <p className="mb-1 text-[10px] font-medium text-black-45">Checklist</p>
        <div className="space-y-1">
          {["Revisar versión instalada", "Revisar actualizaciones pendientes", "Revisar configuración", "Revisar errores conocidos"].map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-black-5 p-2 text-xs">
              <span className="h-3.5 w-3.5 shrink-0 rounded border border-black-10" />
              <span className="text-black-85">{item}</span>
            </div>
          ))}
        </div>
      </div>
      <AccesosRapidos categoria="Software" />
    </div>
  );
}
