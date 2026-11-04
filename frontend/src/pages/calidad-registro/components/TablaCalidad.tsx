import { useMemo, useState, type ReactNode } from "react";
import { ArrowDownUp, Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CANAL_ORDER, canalLabel, fmtNum, fmtPct, fmtPp, fmtPpAbs, deltaClass } from "../format";
import { exportarTablaCalidad } from "../exportCalidad";
import type { CalidadFila, CalidadMeta, CalidadRegistroResponse } from "../types";

type Vista = "base" | "calidad" | "integral" | "completa";
type Dir = "asc" | "desc";

interface Col {
  key: string;
  label: string;
  align?: "left" | "right";
  sortValue: (r: CalidadFila) => string | number | null;
  render: (r: CalidadFila) => ReactNode;
}

const ORDEN_CANAL: Record<string, number> = {
  TODOS: 0,
  WHATICKET: 1,
  WHATMETA: 2,
  ZENDESK: 3,
};

function Var({
  value,
  goodUp = true,
  formatter = fmtPp,
}: {
  value: number | null;
  goodUp?: boolean;
  formatter?: (v: number | null) => string;
}) {
  return <span className={cn("font-medium", deltaClass(value, goodUp))}>{formatter(value)}</span>;
}

function SortHeader({
  col,
  sortKey,
  dir,
  onSort,
}: {
  col: Col;
  sortKey: string;
  dir: Dir;
  onSort: (key: string) => void;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "cursor-pointer select-none whitespace-nowrap pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-black-45 hover:text-black-85",
        col.align === "right" && "text-right",
      )}
      onClick={() => onSort(col.key)}
      title={`Ordenar por ${col.label}`}
    >
      <span className="inline-flex items-center gap-1">
        {col.label}
        {sortKey === col.key ? (
          <span className="text-primary">{dir === "asc" ? "↑" : "↓"}</span>
        ) : (
          <ArrowDownUp size={11} className="opacity-40" />
        )}
      </span>
    </th>
  );
}

const COL_PERIODO: Col = {
  key: "periodoInicio",
  label: "Periodo",
  sortValue: (r) => r.periodoInicio,
  render: (r) => (
    <div>
      <p className="font-medium text-black-85">{r.periodo}</p>
      <p className="text-[11px] text-black-25">
        {r.periodoInicio} → {r.periodoFin}
      </p>
    </div>
  ),
};

const COL_CANAL: Col = {
  key: "canalLabel",
  label: "Canal",
  sortValue: (r) => ORDEN_CANAL[r.canal] ?? 9,
  render: (r) => (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 text-xs font-semibold",
        r.canal === "TODOS"
          ? "border-black-10 bg-light text-black-85"
          : "border-primary/20 bg-primary-10 text-primary",
      )}
    >
      {r.canalLabel}
    </span>
  ),
};

const COL_TOTAL: Col = {
  key: "total",
  label: "Total",
  align: "right",
  sortValue: (r) => r.total,
  render: (r) => fmtNum(r.total),
};

const COLS_BASE: Col[] = [
  {
    key: "catRegistradas",
    label: "Cat. registradas",
    align: "right",
    sortValue: (r) => r.categorizacion.registradas,
    render: (r) => fmtNum(r.categorizacion.registradas),
  },
  {
    key: "pctCatRegistrada",
    label: "% Cat. registrada",
    align: "right",
    sortValue: (r) => r.categorizacion.pctRegistrada,
    render: (r) => fmtPct(r.categorizacion.pctRegistrada),
  },
  {
    key: "varCatRegistradaPp",
    label: "Var. cat. registrada",
    align: "right",
    sortValue: (r) => r.variacion.catRegistradaPp,
    render: (r) => <Var value={r.variacion.catRegistradaPp} />,
  },
  {
    key: "domInformados",
    label: "Dom. informados",
    align: "right",
    sortValue: (r) => r.dominio.informados,
    render: (r) => fmtNum(r.dominio.informados),
  },
  {
    key: "pctDomInformado",
    label: "% Dom. informado",
    align: "right",
    sortValue: (r) => r.dominio.pctInformado,
    render: (r) => fmtPct(r.dominio.pctInformado),
  },
  {
    key: "varDomInformadoPp",
    label: "Var. dom. informado",
    align: "right",
    sortValue: (r) => r.variacion.domInformadoPp,
    render: (r) => <Var value={r.variacion.domInformadoPp} />,
  },
];

const COLS_CALIDAD: Col[] = [
  {
    key: "catHomologadas",
    label: "Cat. homologadas",
    align: "right",
    sortValue: (r) => r.categorizacion.homologadas,
    render: (r) => fmtNum(r.categorizacion.homologadas),
  },
  {
    key: "pctCatHomologada",
    label: "% Cat. homologada",
    align: "right",
    sortValue: (r) => r.categorizacion.pctHomologada,
    render: (r) => fmtPct(r.categorizacion.pctHomologada),
  },
  {
    key: "brechaHomologacionPp",
    label: "Brecha homologación",
    align: "right",
    sortValue: (r) => r.categorizacion.brechaHomologacionPp,
    render: (r) => (
      <Var
        value={r.categorizacion.brechaHomologacionPp}
        goodUp={false}
        formatter={fmtPpAbs}
      />
    ),
  },
  {
    key: "domValidos",
    label: "Dom. válidos",
    align: "right",
    sortValue: (r) => r.dominio.validos,
    render: (r) => fmtNum(r.dominio.validos),
  },
  {
    key: "pctDomValido",
    label: "% Dom. válido",
    align: "right",
    sortValue: (r) => r.dominio.pctValido,
    render: (r) => fmtPct(r.dominio.pctValido),
  },
  {
    key: "brechaDominioPp",
    label: "Brecha dominio",
    align: "right",
    sortValue: (r) => r.dominio.brechaDominioPp,
    render: (r) => (
      <Var value={r.dominio.brechaDominioPp} goodUp={false} formatter={fmtPpAbs} />
    ),
  },
  {
    key: "pctIntegral",
    label: "% Integral",
    align: "right",
    sortValue: (r) => r.integral.pctCumplimientoIntegral,
    render: (r) => (
      <span className="font-semibold text-black-85">
        {fmtPct(r.integral.pctCumplimientoIntegral)}
      </span>
    ),
  },
];

const COLS_INTEGRAL: Col[] = [
  {
    key: "cumpleAmbas",
    label: "Cumple ambas",
    align: "right",
    sortValue: (r) => r.integral.cumpleAmbas,
    render: (r) => fmtNum(r.integral.cumpleAmbas),
  },
  {
    key: "soloCategoriaHomologada",
    label: "Solo categoría homologada",
    align: "right",
    sortValue: (r) => r.integral.soloCategoriaHomologada,
    render: (r) => fmtNum(r.integral.soloCategoriaHomologada),
  },
  {
    key: "soloDominioValido",
    label: "Solo dominio válido",
    align: "right",
    sortValue: (r) => r.integral.soloDominioValido,
    render: (r) => fmtNum(r.integral.soloDominioValido),
  },
  {
    key: "ningunaCondicion",
    label: "Ninguna condición",
    align: "right",
    sortValue: (r) => r.integral.ningunaCondicion,
    render: (r) => fmtNum(r.integral.ningunaCondicion),
  },
];

function columnas(vista: Vista): Col[] {
  if (vista === "base") return [COL_PERIODO, COL_CANAL, COL_TOTAL, ...COLS_BASE];
  if (vista === "calidad") return [COL_PERIODO, COL_CANAL, COL_TOTAL, ...COLS_CALIDAD];
  if (vista === "integral") return [COL_PERIODO, COL_CANAL, COL_TOTAL, ...COLS_INTEGRAL];
  return [COL_PERIODO, COL_CANAL, COL_TOTAL, ...COLS_BASE, ...COLS_CALIDAD, ...COLS_INTEGRAL];
}

export function TablaCalidad({
  data,
  meta,
}: {
  data: CalidadRegistroResponse;
  meta: CalidadMeta;
}) {
  const [vista, setVista] = useState<Vista>("completa");
  const [canalFiltro, setCanalFiltro] = useState("TODOS");
  const [texto, setTexto] = useState("");
  const [ocultarVacios, setOcultarVacios] = useState(false);
  const [sortKey, setSortKey] = useState("periodoInicio");
  const [dir, setDir] = useState<Dir>("desc");

  const cols = useMemo(() => columnas(vista), [vista]);

  const filas = useMemo(() => {
    const q = texto.trim().toLowerCase();
    let out = data.tabla.filter((f) => {
      if (canalFiltro === "CONSOLIDADO" && f.canal !== "TODOS") return false;
      if (
        canalFiltro !== "TODOS" &&
        canalFiltro !== "CONSOLIDADO" &&
        f.canal !== canalFiltro
      ) {
        return false;
      }
      if (ocultarVacios && f.total === 0) return false;
      if (q && !`${f.periodo} ${f.canalLabel}`.toLowerCase().includes(q)) return false;
      return true;
    });

    const col = cols.find((c) => c.key === sortKey) ?? COL_PERIODO;
    out = [...out].sort((a, b) => {
      const av = col.sortValue(a);
      const bv = col.sortValue(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string" && typeof bv === "string") {
        return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return dir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return out;
  }, [data.tabla, cols, sortKey, dir, canalFiltro, texto, ocultarVacios]);

  const onSort = (key: string) => {
    if (key === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDir("desc");
    }
  };

  const selectCanal = [
    { value: "TODOS", label: "Todos los canales" },
    { value: "CONSOLIDADO", label: "Consolidado" },
    ...CANAL_ORDER.map((c) => ({ value: c, label: canalLabel(c) })),
  ];

  return (
    <div className="rounded-2xl border border-black-10 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-black-85">Evolución histórica</h3>
          <p className="mt-0.5 text-xs text-black-25">
            {filas.length} fila(s) · Consolidado deduplicado · Variaciones en puntos porcentuales
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={vista}
            onChange={(e) => setVista(e.target.value as Vista)}
            className="rounded border border-black-10 bg-white px-2 py-1.5 text-xs text-black-85"
          >
            <option value="completa">Vista completa</option>
            <option value="base">Indicadores base</option>
            <option value="calidad">Calidad</option>
            <option value="integral">Cumplimiento integral</option>
          </select>
          <select
            value={canalFiltro}
            onChange={(e) => setCanalFiltro(e.target.value)}
            className="rounded border border-black-10 bg-white px-2 py-1.5 text-xs text-black-85"
          >
            {selectCanal.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-black-45">
            <input
              type="checkbox"
              checked={ocultarVacios}
              onChange={(e) => setOcultarVacios(e.target.checked)}
            />
            Ocultar periodos sin atenciones
          </label>
          <button
            onClick={() => exportarTablaCalidad(filas, meta)}
            disabled={!filas.length}
            className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-primary/40"
          >
            <Download size={13} /> Exportar tabla
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Search size={14} className="text-black-25" />
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Filtrar por periodo o canal…"
          className="w-full max-w-sm rounded border border-black-10 bg-white px-2 py-1.5 text-xs text-black-85"
        />
      </div>

      {filas.length === 0 ? (
        <p className="py-10 text-center text-sm text-black-25">
          No hay filas que cumplan los filtros seleccionados.
        </p>
      ) : (
        <div className="max-h-[620px] overflow-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="text-left">
                {cols.map((col) => (
                  <SortHeader
                    key={col.key}
                    col={col}
                    sortKey={sortKey}
                    dir={dir}
                    onSort={onSort}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr
                  key={`${f.periodoInicio}-${f.canal}`}
                  className={cn(
                    "border-t border-black-5 transition-colors hover:bg-light [&:nth-child(even)]:bg-light/60",
                    f.canal === "TODOS" && "bg-light/80 font-medium",
                  )}
                >
                  {cols.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "py-2.5 pr-4 text-black-85",
                        col.align === "right" && "text-right tabular-nums",
                      )}
                    >
                      {col.render(f)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
