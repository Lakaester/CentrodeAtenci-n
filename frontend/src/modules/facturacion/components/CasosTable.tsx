import type { FacturacionCaso } from "@/modules/facturacion";
import { CasoBadge } from "./CasoBadge";
import { cn } from "@/lib/utils";

function fmtFecha(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

interface Props {
  casos: FacturacionCaso[];
  onAbrir: (caso: FacturacionCaso) => void;
  vacioMsg?: string;
  loading?: boolean;
}

export function CasosTable({ casos, onAbrir, vacioMsg = "No hay casos que coincidan con los filtros.", loading }: Props) {
  if (loading) {
    return <div className="p-6 text-center text-[11px] text-black-25">Cargando casos…</div>;
  }
  if (casos.length === 0) {
    return <div className="p-6 text-center text-[11px] text-black-25">{vacioMsg}</div>;
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="border-b border-black-10 text-[9px] uppercase tracking-wider text-black-45">
            <th className="px-3 py-2 font-medium">Dominio</th>
            <th className="px-3 py-2 font-medium">Cliente</th>
            <th className="px-3 py-2 font-medium">RUC</th>
            <th className="px-3 py-2 font-medium">Proveedor</th>
            <th className="px-3 py-2 text-right font-medium">Pendientes</th>
            <th className="px-3 py-2 font-medium">Estado</th>
            <th className="px-3 py-2 font-medium">Categoría</th>
            <th className="px-3 py-2 font-medium">Subcategoría</th>
            <th className="px-3 py-2 font-medium">Asesor</th>
            <th className="px-3 py-2 font-medium">Últ. detección</th>
            <th className="px-3 py-2 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {casos.map((c) => (
            <tr key={c.id} onClick={() => onAbrir(c)} className="cursor-pointer border-b border-black-5 hover:bg-light">
              <td className="px-3 py-1.5 text-[11px] font-medium text-primary">{c.dominio}</td>
              <td className="px-3 py-1.5 text-[10px] text-black-85">{c.cliente_nombre || "—"}</td>
              <td className="px-3 py-1.5 font-mono text-[10px] text-black-45">{c.ruc || "—"}</td>
              <td className="px-3 py-1.5 text-[10px] text-black-45">{c.proveedor || "—"}</td>
              <td className="px-3 py-1.5 text-right">
                {c.ultimo_total != null ? (
                  <div className="inline-flex items-center gap-1.5">
                    <span className={cn("text-[11px] font-semibold", (c.ultimo_total ?? 0) > 0 ? "text-danger" : "text-black-45")}>
                      {c.ultimo_total}
                    </span>
                    {(c.ultimas_facturas != null || c.ultimas_boletas != null) && (
                      <span className="text-[8px] text-black-25">
                        F:{c.ultimas_facturas ?? 0} B:{c.ultimas_boletas ?? 0}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-black-25">—</span>
                )}
              </td>
              <td className="px-3 py-1.5"><CasoBadge estado={c.estado_operativo} /></td>
              <td className="px-3 py-1.5 text-[10px] text-black-45">{c.categoria_nombre || "—"}</td>
              <td className="px-3 py-1.5 text-[10px] text-black-45">{c.subcategoria_nombre || "—"}</td>
              <td className="px-3 py-1.5 text-[10px] text-black-85">{c.asesor_actual || "—"}</td>
              <td className="px-3 py-1.5 text-[10px] text-black-45">{fmtFecha(c.ultima_deteccion)}</td>
              <td className="px-3 py-1.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onAbrir(c); }}
                  className="rounded border border-black-10 px-2 py-0.5 text-[10px] text-primary hover:bg-primary-5"
                >
                  Abrir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
