import { Plug, RefreshCw } from "lucide-react";
import { useFacturacionSource } from "@/modules/facturacion";
import { cn } from "@/lib/utils";

function EstadoBadge({ estado, label }: { estado: "ok" | "no" | "off" | "warn"; label: string }) {
  const cls = estado === "ok" ? "bg-success-5 text-success" : estado === "no" ? "bg-warning-5 text-warning-65" : estado === "warn" ? "bg-yellow-5 text-yellow" : "bg-black-5 text-black-45";
  return <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", cls)}>{label}</span>;
}

export default function IntegracionesConfig() {
  const { data: source, isLoading: sourceLoading, refetch: refetchSource } = useFacturacionSource();

  // Localbi: health propio (se consume si existe; aquí usamos el mismo mecanismo del módulo localbi).
  // Facturación: usa el endpoint source/status existente.
  const localbiEstado = { estado: "no" as const, label: "No configurado" };
  const facturacionEstado =
    sourceLoading ? { estado: "warn" as const, label: "Consultando…" }
    : source?.estado === "DISPONIBLE" ? { estado: "ok" as const, label: "Conectado" }
    : source?.estado === "ERROR" ? { estado: "no" as const, label: "No disponible" }
    : { estado: "no" as const, label: "No configurado" };

  const integraciones = [
    { nombre: "LocalBI", desc: "Historia Clínica del cliente", estado: localbiEstado, key: "localbi" },
    { nombre: "Facturación", desc: "Fuente de documentos pendientes (facturacionbi)", estado: facturacionEstado, key: "facturacion" },
    { nombre: "Zendesk", desc: "Tickets y atención por correo", estado: { estado: "off" as const, label: "No disponible" }, key: "zendesk" },
    { nombre: "WhatsApp", desc: "Mensajería por WhatsApp", estado: { estado: "off" as const, label: "No disponible" }, key: "whatsapp" },
  ];

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-black-85"><Plug size={15} className="text-primary" /> Integraciones</h2>
            <p className="mt-0.5 text-xs text-black-45">Estado de conexión de los servicios externos de COPE.</p>
          </div>
          <button type="button" onClick={() => refetchSource()} className="inline-flex items-center gap-1.5 rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-light">
            <RefreshCw size={12} /> Refrescar
          </button>
        </div>

        <div className="space-y-2">
          {integraciones.map((it) => (
            <div key={it.key} className="flex items-center justify-between gap-2 rounded-lg border border-black-10 bg-white p-3">
              <div>
                <p className="text-[12px] font-semibold text-black-85">{it.nombre}</p>
                <p className="mt-0.5 text-[10px] text-black-45">{it.desc}</p>
              </div>
              <EstadoBadge estado={it.estado.estado} label={it.estado.label} />
            </div>
          ))}
        </div>

        <p className="mt-4 text-[10px] text-black-25">
          No se muestran credenciales ni tokens. El estado refleja lo que los servicios existentes de COPE pueden reportar.
        </p>
      </div>
    </div>
  );
}
