import { ArrowUpRight, TrendingUp } from "lucide-react";
import type { GerencialResponse } from "../dto/dashboard.dto";
import { fmtInt } from "../utils/format";
import { CHART } from "@/lib/chartPalette";
import { cn } from "@/lib/utils";

type FilterKind = "categoria" | "subcategoria" | "dominio" | "pais" | "canal";

interface Props {
  distribuciones: GerencialResponse["distribuciones"];
  total: number;
  onFilter: (kind: FilterKind, value: string) => void;
}

interface ListProps {
  title: string;
  subtitle: string;
  items: { etiqueta: string; total: number }[];
  total: number;
  kind: FilterKind;
  onFilter: (kind: FilterKind, value: string) => void;
  growth?: Map<string, number>;
  barColor?: string;
}

function List({ title, subtitle, items, total, kind, onFilter, growth, barColor = CHART.brand }: ListProps) {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <div className="rounded-xl border border-black-5 bg-black-5 p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-semibold text-black-85">{title}</h3>
        <span className="text-[9px] uppercase tracking-[0.08em] text-black-25">{subtitle}</span>
      </div>
      {items.length === 0 ? (
        <p className="py-5 text-center text-[10px] text-black-25">Sin datos en el periodo.</p>
      ) : (
        <div className="space-y-1">
          {items.map((item, idx) => {
            const pct = total > 0 ? (item.total / total) * 100 : 0;
            const g = growth?.get(item.etiqueta);
            return (
              <button
                key={`${title}-${item.etiqueta}`}
                type="button"
                onClick={() => onFilter(kind, item.etiqueta)}
                title={`Filtrar por ${item.etiqueta}`}
                className="group w-full rounded-md px-1 py-1 text-left hover:bg-white"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-3 shrink-0 text-[9px] tabular-nums text-black-25">{idx + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[10.5px] font-medium text-black-85 group-hover:text-primary">
                    {item.etiqueta}
                  </span>
                  {g != null && g > 10 && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[8.5px] font-semibold text-warning">
                      <TrendingUp size={9} /> {g.toFixed(0)}%
                    </span>
                  )}
                  <span className="shrink-0 text-[9.5px] tabular-nums text-black-85">{fmtInt(item.total)}</span>
                  <span className="w-9 shrink-0 text-right text-[9px] tabular-nums text-black-25">{pct.toFixed(1)}%</span>
                  <ArrowUpRight size={10} className="shrink-0 text-transparent group-hover:text-primary" />
                </div>
                <div className="ml-[18px] mt-0.5 h-1 overflow-hidden rounded-full bg-black-5">
                  <div
                    className="h-full rounded-full opacity-80"
                    style={{ width: `${Math.max(2, (item.total / max) * 100)}%`, backgroundColor: barColor }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CausesPanel({ distribuciones, total, onFilter }: Props) {
  const prevCat = new Map(distribuciones.categoriaAnterior.map((c) => [c.etiqueta, c.total]));
  const dominios = distribuciones.dominio.filter(
    (d) => !/^sin\s*(dato|dominio)$/i.test(d.etiqueta) && d.etiqueta.includes("."),
  );
  const growth = new Map<string, number>();
  for (const c of distribuciones.categoria) {
    const anterior = prevCat.get(c.etiqueta) ?? 0;
    if (anterior >= 10) growth.set(c.etiqueta, ((c.total - anterior) / anterior) * 100);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <List
          title="Categorías con mayor volumen"
          subtitle="clic para filtrar"
          items={distribuciones.categoria.slice(0, 8)}
          total={total}
          kind="categoria"
          onFilter={onFilter}
          growth={growth}
        />
        <List
          title="Subcategorías recurrentes"
          subtitle="clic para filtrar"
          items={distribuciones.subcategoria.slice(0, 8)}
          total={total}
          kind="subcategoria"
          onFilter={onFilter}
          barColor={CHART.charcoal}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <List
          title="Cliente / dominio"
          subtitle="mayor incidencia"
          items={dominios.slice(0, 8)}
          total={total}
          kind="dominio"
          onFilter={onFilter}
          barColor={CHART.muted}
        />
        <List
          title="Países"
          subtitle="volumen"
          items={distribuciones.pais.slice(0, 8)}
          total={total}
          kind="pais"
          onFilter={onFilter}
          barColor={CHART.primary}
        />
        <div className="rounded-xl border border-black-5 bg-black-5 p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-[11px] font-semibold text-black-85">Canal y tipo de cliente</h3>
            <span className="text-[9px] uppercase tracking-[0.08em] text-black-25">clic para filtrar</span>
          </div>
          <div className="space-y-1">
            {distribuciones.canal.map((c) => (
              <button
                key={c.etiqueta}
                type="button"
                onClick={() => onFilter("canal", c.etiqueta)}
                className="flex w-full items-center justify-between rounded-md px-1 py-1 text-[10.5px] hover:bg-white"
              >
                <span className="font-medium text-black-85">{c.etiqueta}</span>
                <span className="tabular-nums text-black-85">
                  {fmtInt(c.total)} <span className="text-[9px] text-black-25">{total > 0 ? ((c.total / total) * 100).toFixed(1) : 0}%</span>
                </span>
              </button>
            ))}
            <div className="my-1.5 border-t border-black-5" />
            {distribuciones.tipoCliente
              .filter((t) => t.etiqueta !== "Sin dato")
              .slice(0, 5)
              .map((t) => (
                <div key={t.etiqueta} className="flex items-center justify-between px-1 py-0.5 text-[10px] text-black-45">
                  <span>{t.etiqueta}</span>
                  <span className="tabular-nums">{fmtInt(t.total)}</span>
                </div>
              ))}
          </div>
          <p className={cn("mt-2 text-[9px] leading-4 text-black-25", distribuciones.tipoCliente.length === 0 && "hidden")}>
            Producto/módulo no está disponible como campo en la vista; se documenta como brecha.
          </p>
        </div>
      </div>
    </div>
  );
}
