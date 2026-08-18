import { useMemo, useState } from "react";
import { X, Search, Store } from "lucide-react";
import type { LocalbiHistoriaClinica, LocalbiLocal, ActividadDominio } from "@/modules/localbi";
import { EstadoLocalBadge, fmtMoneda, fmtNps, fmtFecha, nombreLocal, normalizarDominio } from "@/modules/localbi/components/HistoriaClinicaUI";

interface Props {
  ficha: LocalbiHistoriaClinica;
  actividadPorDominio?: Map<string, ActividadDominio>;
  actividadLoading?: boolean;
  onClose: () => void;
}

const MODULOS_MAX = 9;

export function LocalesDrawer({ ficha, actividadPorDominio, actividadLoading, onClose }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");

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
        <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-xs font-semibold text-black-85">Locales de {ficha.unidadnegocio_nombre || ficha.unidadnegocio_id}</h3>
            <p className="text-[9px] text-black-45">{kpis.total} locales · {porDominio.length} dominios</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-black-45 hover:bg-light"><X size={14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* KPIs */}
          <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Kpi label="Total" value={String(kpis.total)} />
            <Kpi label="Precio total" value={fmtMoneda(kpis.precioTotal)} sub={`${kpis.conPrecio} con precio`} />
            <Kpi label="Módulos usados" value={kpis.modulosPromedio != null ? `${(kpis.modulosPromedio / MODULOS_MAX * 100).toFixed(0)}%` : "—"} sub={kpis.modulosPromedio != null ? `${kpis.modulosPromedio.toFixed(1)}/9 prom.` : undefined} />
            <Kpi label="NPS" value={kpis.npsPromedio != null ? kpis.npsPromedio.toFixed(1) : "—"} sub={`${kpis.conNps} locales con NPS`} />
          </div>

          {/* Filtros */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <div className="relative">
              <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-black-45" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Local, ciudad, dirección o plan"
                className="h-7 w-64 rounded border border-black-10 bg-white py-1 pl-7 pr-2 text-[11px] focus:border-primary focus:outline-none"
              />
            </div>
            <select value={estado} onChange={(e) => setEstado(e.target.value)} className="h-7 rounded border border-black-10 px-1.5 text-[10px]">
              <option value="">Todos los estados</option>
              {estadosUnicos.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <span className="text-[9px] text-black-25">{filtrados.length} de {locales.length}</span>
          </div>

          {/* Tabla por dominio */}
          {porDominio.length === 0 ? (
            <p className="py-6 text-center text-[11px] text-black-25">Ningún local coincide con los filtros.</p>
          ) : (
            porDominio.map(([dominio, lista]) => (
              <div key={dominio} className="mb-4">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-primary">
                  <Store size={12} /> {dominio}
                  <span className="font-normal text-black-25">({lista.length})</span>
                </div>
                <div className="overflow-x-auto rounded border border-black-5">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-light text-[9px] uppercase tracking-wider text-black-45">
                        <th className="px-2 py-1.5 font-medium">Local</th>
                        <th className="px-2 py-1.5 font-medium">Ubicación</th>
                        <th className="px-2 py-1.5 font-medium">Estado</th>
                        <th className="px-2 py-1.5 font-medium">Plan</th>
                        <th className="px-2 py-1.5 text-right font-medium">Precio</th>
                        <th className="px-2 py-1.5 text-center font-medium">Módulos</th>
                        <th className="px-2 py-1.5 text-right font-medium">NPS</th>
                        <th className="px-2 py-1.5 text-right font-medium">Atenc.</th>
                        <th className="px-2 py-1.5 font-medium">Últ. atención</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((l) => {
                        const act = actividadPorDominio?.get(normalizarDominio(l.link_dominio || dominio));
                        return (
                        <tr key={l.localbi_id} className="border-t border-black-5 text-[10px] text-black-85">
                          <td className="px-2 py-1.5 font-medium">{nombreLocal(l)}</td>
                          <td className="px-2 py-1.5 text-black-45">
                            {[l.ciudad, l.pais].filter(Boolean).join(", ") || "—"}
                          </td>
                          <td className="px-2 py-1.5"><EstadoLocalBadge estado={l.estado} /></td>
                          <td className="px-2 py-1.5 text-black-45">{l.plan || "—"}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{fmtMoneda(l.precio)}</td>
                          <td className="px-2 py-1.5">
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex h-1.5 w-20 overflow-hidden rounded bg-black-5">
                                <div className="bg-primary" style={{ width: `${Math.min(100, (l.cantidadmodulosusa ?? 0) / MODULOS_MAX * 100)}%` }} />
                              </div>
                              <span className="text-[8px] text-black-45">
                                {l.cantidadmodulosusa ?? 0}/9 · {l.porcentajemodulousa != null ? `${Math.round(l.porcentajemodulousa)}%` : "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <div className="text-[10px] tabular-nums">{fmtNps(l.nps?.llamadabi_nps != null ? Number(l.nps.llamadabi_nps) : null)}</div>
                            {l.nps?.llamadabi_npsproducto != null && (
                              <div className="text-[8px] text-black-25">prod. {l.nps.llamadabi_npsproducto}</div>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-right text-[9px] tabular-nums">
                            {actividadLoading ? "…" : act ? act.resumen.total : <span className="text-black-25">0</span>}
                          </td>
                          <td className="px-2 py-1.5 text-[9px] text-black-45">
                            {actividadLoading ? "…" : act?.resumen.ultima_atencion ? fmtFecha(act.resumen.ultima_atencion) : <span className="text-black-25">—</span>}
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
  return (
    <div className="rounded border border-black-10 bg-light px-2.5 py-2">
      <p className="text-sm font-semibold leading-tight text-black-85">{value}</p>
      <p className="mt-0.5 text-[9px] text-black-45">{label}</p>
      {sub && <p className="text-[8px] text-black-25">{sub}</p>}
    </div>
  );
}
