import { Monitor, FileText, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccesosRapidos } from "./AccesosRapidos";

function IntCard({ nombre, estado, ultimaSync }: { nombre: string; estado: string; ultimaSync: string }) {
  const color = estado === "conectado" ? "border-l-emerald-500" : estado === "error" ? "border-l-amber-400" : "border-l-rose-400";
  const label = estado === "conectado" ? "OK" : estado === "error" ? "Error" : "Descon.";
  return (
    <div className={cn("flex items-center justify-between rounded-lg border border-black-10 border-l-4 bg-light p-2.5 text-xs", color)}>
      <div>
        <p className="font-medium text-black-85">{nombre}</p>
        <p className="text-[10px] text-black-25">Última sync: {ultimaSync}</p>
      </div>
      <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-medium", estado === "conectado" ? "text-success bg-success-5" : estado === "error" ? "text-warning bg-warning-5" : "text-danger bg-danger-5")}>{label}</span>
    </div>
  );
}

const MOCK = [
  { nombre: "PedidosYa", estado: "conectado", ultimaSync: "10:30:12" },
  { nombre: "Rappi", estado: "conectado", ultimaSync: "10:29:48" },
  { nombre: "Uber Eats", estado: "error", ultimaSync: "09:15:00" },
  { nombre: "Didi Food", estado: "desconectado", ultimaSync: "—" },
];

export function IntegracionesWorkspace() {
  return (
    <div className="space-y-2 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-3 rounded-lg border border-black-10 bg-light p-2.5">
          <Monitor size={16} className="shrink-0 text-primary" />
          <div><p className="text-[10px] text-black-45">Estado Monitor</p><p className="text-sm font-semibold text-success">Operativo</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-black-10 bg-light p-2.5">
          <FileText size={16} className="shrink-0 text-primary" />
          <div><p className="text-[10px] text-black-45">Pedidos pendientes</p><p className="text-sm font-semibold text-black-85">7</p></div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-medium text-black-45">Integraciones</p>
        {MOCK.map((int, i) => <IntCard key={i} {...int} />)}
      </div>

      <div className="rounded-lg border border-black-10 bg-[#FFF7ED] p-2.5">
        <p className="text-[10px] font-medium text-primary">Errores recientes</p>
        <p className="text-[10px] text-danger">• Uber Eats — timeout en sincronización de menú</p>
        <p className="text-[10px] text-danger">• Didi Food — token de acceso expirado</p>
      </div>

      <div className="rounded-lg border border-black-10 p-2.5">
        <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-black-45">
          <BookOpen size={11} /> NotebookLM Integraciones
        </p>
        <p className="text-[10px] text-black-25">Documentación de APIs y solución de errores de conexión con plataformas.</p>
      </div>

      <div className="rounded-lg border border-black-10 p-2.5">
        <p className="mb-1 text-[10px] font-medium text-black-45">Checklist</p>
        <div className="space-y-1">
          {["Revisar Monitor de integraciones", "Revisar Carta", "Revisar Productos", "Revisar Configuración"].map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-black-5 p-2 text-xs">
              <span className="h-3.5 w-3.5 shrink-0 rounded border border-black-10" />
              <span className="text-black-85">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <AccesosRapidos categoria="Integraciones" />
    </div>
  );
}
