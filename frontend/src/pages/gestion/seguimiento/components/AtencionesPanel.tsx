import { useState } from "react";
import { ExternalLink, History } from "lucide-react";
import { Badge } from "@/components/ui";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { useAtenciones } from "@/modules/clientes-seguimiento/hooks";
import type { SeguimientoAtencion } from "@/modules/clientes-seguimiento/types";
import { fmtDuracion } from "@/modules/clientes-seguimiento/utils";

function CanalBadge({ canal }: { canal: string }) {
  const c = canal.toUpperCase();
  const variant = c.includes("WHAT") ? "whatsapp" : c.includes("ZENDESK") || c.includes("CORREO") ? "correo" : "default";
  return <Badge variant={variant}>{canal}</Badge>;
}

export function AtencionesPanel({ casoId }: { casoId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAtenciones(casoId, page, true);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-black-5" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger-5 px-3 py-2 text-xs text-danger">
        No se pudo cargar el historial de atenciones.
      </div>
    );
  }

  if (!data?.rows.length) {
    return (
      <EmptyState
        icon={History}
        title="Sin atenciones finalizadas"
        description="El cliente no tiene atenciones cerradas o resueltas en la ventana consultada."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-black-45">
        Historial completo de atenciones finalizadas del cliente. El conteo “Atenc. 30 d” del
        encabezado corresponde a la ventana de detección.
      </p>
      <div className="overflow-hidden rounded-xl border border-black-10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-black-5/70 text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
              <tr>
                <th className="px-3 py-2">Ticket</th>
                <th className="px-3 py-2">Canal</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Subcategoría</th>
                <th className="px-3 py-2">Asesor</th>
                <th className="px-3 py-2 text-right">Tiempo</th>
                <th className="px-3 py-2 text-center">SLA</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.rows.map((a: SeguimientoAtencion) => (
                <tr key={`${a.ticket}-${a.fecha}`} className="border-t border-black-5 align-top">
                  <td className="px-3 py-2.5 font-mono text-xs text-black-85">#{a.ticket}</td>
                  <td className="px-3 py-2.5">
                    <CanalBadge canal={a.canal} />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-black-65">{a.fecha}</td>
                  <td className="px-3 py-2.5 text-xs text-black-85">{a.categoria}</td>
                  <td className="px-3 py-2.5 text-xs text-black-65">{a.subcategoria}</td>
                  <td className="px-3 py-2.5 text-xs text-black-65">{a.asesor}</td>
                  <td className="px-3 py-2.5 text-right text-xs tabular-nums text-black-85">
                    {fmtDuracion(a.tiempo)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {a.cumpleSla == null ? (
                      <span className="text-xs text-black-25">—</span>
                    ) : (
                      <span title={`Umbral del canal: ${a.umbral} min`}>
                        <Badge variant={a.cumpleSla ? "success" : "danger"}>
                          {a.cumpleSla ? "Cumple" : "Fuera"}
                        </Badge>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {a.urlTicket ? (
                      <a
                        href={a.urlTicket}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        Zendesk <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-[11px] text-black-25">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        pagina={data.page}
        total={data.total}
        porPagina={data.pageSize}
        onCambiar={setPage}
        etiqueta="atenciones"
      />
    </div>
  );
}
