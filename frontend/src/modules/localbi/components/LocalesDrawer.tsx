import { useMemo, useState } from "react";
import { X, Search, Store } from "lucide-react";
import type { LocalbiHistoriaClinica, LocalbiLocal, ActividadDominio } from "@/modules/localbi";
import {
  EstadoLocalBadge,
  fmtMoneda,
  fmtNps,
  fmtFecha,
  nombreLocal,
  useHistoriaDensity,
} from "@/modules/localbi/components/HistoriaClinicaUI";
import { normalizeDomain } from "@/domain/normalizacion";
import { cn } from "@/lib/utils";
import {
  MODULOS_LOCALBI_TOTAL,
  barraModulosLocalbi,
  etiquetaModulosLocalbi,
  numeroModulosLocalbi,
} from "../utils/modulosLocalbi";

interface Props {
  ficha: LocalbiHistoriaClinica;
  actividadPorDominio?: Map<string, ActividadDominio>;
  actividadLoading?: boolean;
  onClose: () => void;
}

export function LocalesDrawer({ ficha, actividadPorDominio, actividadLoading, onClose }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const comfortable = useHistoriaDensity() === "comfortable";

  const locales = useMemo<LocalbiLocal[]>(
    () => (ficha.dominios ?? []).flatMap((d) => (d.locales ?? []).map((l) => ({ ...l, link_dominio: l.link_dominio || d.dominio }))),
    [ficha],
  );

  const estadosUnicos = useMemo(() => [...new Set(locales.map((l) => l.estado).filter(Boolean))].sort(), [locales]);

  const kpis = useMemo(() => {
    const total = locales.length;
    const conPrecio = locales.filter((l) => l.precio != null);
    const precioTotal = conPrecio.reduce((acc, l) => acc + (l.precio ?? 0), 0);
    const conModulos = locales.filter((l) => l.cantidadmodulosusa != null);
    const modulosPromedio = conModulos.length ? conModulos.reduce((a, l) => a + (l.cantidadmodulosusa ?? 0), 0) / conModulos.length : null;
    const conNps = locales.filter((l) => l.nps?.llamadabi_nps != null);
    const npsPromedio = conNps.length ? conNps.reduce((a, l) => a + Number(l.nps?.llamadabi_nps), 0) / conNps.length : null;
    return { total, precioTotal, conPrecio: conPrecio.length, modulosPromedio, conNps: conNps.length, npsPromedio };
  }, [locales]);

  const filtrados = locales.filter((l) => {
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      const hayado = [l.nombre, l.ciudad, l.direccion, l.plan, l.link_dominio].some((v) => (v ?? "").toLowerCase().includes(q));
      if (!hayado) return false;
    }
    if (estado && l.estado !== estado) return false;
    return true;
  });

  const porDominio = useMemo(() => {
    const map = new Map<string, LocalbiLocal[]>();
    for (const l of filtrados) {
      const d = l.link_dominio || "Sin dominio";
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(l);
    }
    return [...map.entries()];
  }, [filtrados]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-black-10 bg-white">
        <div className="flex items-center justify-between border-b border-black-10 px-5 py-4">
          <div className="min-w-0">
            <h3 className={comfortable ? "truncate text-[18px] font-semibold text-black-85" : "truncate text-xs font-semibold text-black-85"}>
              Locales de {ficha.unidadnegocio_nombre || ficha.unidadnegocio_id}
            </h3>
            <p className={comfortable ? "mt-0.5 text-[13px] text-black-65" : "text-[9px] text-black-45"}>
              {kpis.total} locales · {porDominio.length} dominios
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-black-45 hover:bg-light"><X size={comfortable ? 18 : 14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* KPIs */}
          <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Kpi label="Total" value={String(kpis.total)} />
            <Kpi label="Precio total" value={fmtMoneda(kpis.precioTotal)} sub={`${kpis.conPrecio} con precio`} />
            <Kpi label="Módulos LocalBI" value={kpis.modulosPromedio != null ? `${(kpis.modulosPromedio / MODULOS_LOCALBI_TOTAL * 100).toFixed(0)}%` : "—"} sub={kpis.modulosPromedio != null ? `${kpis.modulosPromedio.toFixed(1)}/${MODULOS_LOCALBI_TOTAL} prom. · agregado` : undefined} />
            <Kpi label="NPS" value={kpis.npsPromedio != null ? kpis.npsPromedio.toFixed(1) : "—"} sub={`${kpis.conNps} locales con NPS`} />
          </div>

          {/* Filtros */}
          <div className={cn("mb-4 flex flex-wrap items-center", comfortable ? "gap-2" : "gap-1.5")}>
            <div className="relative">
              <Search size={comfortable ? 15 : 12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-black-45" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Local, ciudad, dirección o plan"
                className={cn(
                  "rounded-md border border-black-10 bg-white pl-8 pr-3 focus:border-primary focus:outline-none",
                  comfortable ? "h-9 w-72 text-[13px]" : "h-7 w-64 py-1 pl-7 pr-2 text-[11px]",
                )}
              />
            </div>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className={cn("rounded-md border border-black-10 text-black-65", comfortable ? "h-9 px-2 text-[13px]" : "h-7 px-1.5 text-[10px]")}
            >
              <option value="">Todos los estados</option>
              {estadosUnicos.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <span className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-25"}>
              {filtrados.length} de {locales.length}
            </span>
          </div>

          {/* Tabla por dominio */}
          {porDominio.length === 0 ? (
            <p className="py-6 text-center text-[11px] text-black-25">Ningún local coincide con los filtros.</p>
          ) : (
            porDominio.map(([dominio, lista]) => (
              <div key={dominio} className="mb-5">
                <div className={cn("mb-2 flex items-center font-semibold text-primary", comfortable ? "gap-2 text-[14px]" : "gap-1.5 text-[10px]")}>
                  <Store size={comfortable ? 16 : 12} /> {normalizeDomain(dominio)}
                  <span className="font-normal text-black-45">({lista.length})</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-black-10">
                  <table className={cn("w-full border-collapse text-left", comfortable && "min-w-[900px]")}>
                    <thead>
                      <tr className={cn("bg-black-5 uppercase tracking-wider text-black-65", comfortable ? "text-[12px]" : "text-[9px] text-black-45")}>
                        <th className={cn("font-semibold", comfortable ? "px-3 py-2.5" : "px-2 py-1.5 font-medium")}>Local</th>
                        <th className={cn("font-semibold", comfortable ? "px-3 py-2.5" : "px-2 py-1.5 font-medium")}>Ubicación</th>
                        <th className={cn("font-semibold", comfortable ? "px-3 py-2.5" : "px-2 py-1.5 font-medium")}>Estado</th>
                        <th className={cn("font-semibold", comfortable ? "px-3 py-2.5" : "px-2 py-1.5 font-medium")}>Plan</th>
                        <th className={cn("text-right font-semibold", comfortable ? "px-3 py-2.5" : "px-2 py-1.5 font-medium")}>Precio</th>
                        <th className={cn("text-center font-semibold", comfortable ? "px-3 py-2.5" : "px-2 py-1.5 font-medium")}>Módulos</th>
                        <th className={cn("text-right font-semibold", comfortable ? "px-3 py-2.5" : "px-2 py-1.5 font-medium")}>NPS</th>
                        <th className={cn("text-right font-semibold", comfortable ? "px-3 py-2.5" : "px-2 py-1.5 font-medium")}>Atenc.</th>
                        <th className={cn("font-semibold", comfortable ? "px-3 py-2.5" : "px-2 py-1.5 font-medium")}>Últ. atención</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((l) => {
                        const act = actividadPorDominio?.get(normalizeDomain(l.link_dominio || dominio));
                        const cantidadModulos = numeroModulosLocalbi(l.cantidadmodulosusa);
                        const porcentajeModulos = numeroModulosLocalbi(l.porcentajemodulousa);
                        const barraModulos = barraModulosLocalbi(cantidadModulos, porcentajeModulos);
                        return (
                        <tr key={l.localbi_id} className={cn("border-t border-black-10 text-black-85", comfortable ? "text-[13px]" : "text-[10px]")}>
                          <td className={cn("font-medium", comfortable ? "px-3 py-3" : "px-2 py-1.5")}>{nombreLocal(l)}</td>
                          <td className={cn("text-black-65", comfortable ? "px-3 py-3" : "px-2 py-1.5 text-black-45")}>
                            {[l.ciudad, l.pais].filter(Boolean).join(", ") || "—"}
                          </td>
                          <td className={comfortable ? "px-3 py-3" : "px-2 py-1.5"}><EstadoLocalBadge estado={l.estado} /></td>
                          <td className={cn("text-black-65", comfortable ? "px-3 py-3" : "px-2 py-1.5 text-black-45")}>{l.plan || "—"}</td>
                          <td className={cn("text-right tabular-nums", comfortable ? "px-3 py-3" : "px-2 py-1.5")}>{fmtMoneda(l.precio)}</td>
                          <td className={comfortable ? "px-3 py-3" : "px-2 py-1.5"}>
                            <div className="flex flex-col items-center gap-1">
                              <div className={cn("overflow-hidden rounded bg-black-5", comfortable ? "h-2 w-24" : "h-1.5 w-20")}>
                                <div className="bg-primary" style={{ width: `${barraModulos}%` }} />
                              </div>
                              <span className={comfortable ? "text-[11px] text-black-45" : "text-[8px] text-black-45"}>
                                {etiquetaModulosLocalbi(cantidadModulos, porcentajeModulos)}
                              </span>
                            </div>
                          </td>
                          <td className={cn("text-right", comfortable ? "px-3 py-3" : "px-2 py-1.5")}>
                            <div className={cn("tabular-nums", comfortable ? "text-[13px]" : "text-[10px]")}>{fmtNps(l.nps?.llamadabi_nps != null ? Number(l.nps.llamadabi_nps) : null)}</div>
                            {l.nps?.llamadabi_npsproducto != null && (
                              <div className={comfortable ? "text-[10px] text-black-45" : "text-[8px] text-black-25"}>prod. {l.nps.llamadabi_npsproducto}</div>
                            )}
                          </td>
                          <td className={cn("text-right tabular-nums", comfortable ? "px-3 py-3 text-[13px]" : "px-2 py-1.5 text-[9px]")}>
                            {actividadLoading ? "…" : act ? act.resumen.total : <span className="text-black-45">0</span>}
                          </td>
                          <td className={cn("text-black-65", comfortable ? "px-3 py-3 text-[13px]" : "px-2 py-1.5 text-[9px] text-black-45")}>
                            {actividadLoading ? "…" : act?.resumen.ultima_atencion ? fmtFecha(act.resumen.ultima_atencion) : <span className="text-black-45">—</span>}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const comfortable = useHistoriaDensity() === "comfortable";
  return (
    <div className={cn("rounded-lg border border-black-10", comfortable ? "bg-white px-4 py-3" : "bg-light px-2.5 py-2")}>
      <p className={cn("leading-tight text-black-85", comfortable ? "text-[24px] font-bold" : "text-sm font-semibold")}>{value}</p>
      <p className={cn(comfortable ? "mt-1 text-[13px] text-black-65" : "mt-0.5 text-[9px] text-black-45")}>{label}</p>
      {sub && <p className={cn(comfortable ? "text-[12px] text-black-45" : "text-[8px] text-black-25")}>{sub}</p>}
    </div>
  );
}
