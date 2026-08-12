import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { Chip, MultiSelect } from "@/components/filters/FilterChip";
import { countActive, type DashboardFilters } from "@/lib/filters";
import { cn } from "@/lib/utils";

interface Opciones {
  canal: string[];
  subcanal: string[];
  pais: string[];
  asesor: string[];
  categoria: string[];
  subcategoria: string[];
  dominio: string[];
  estado: string[];
  tipoCliente: string[];
  rangoAtencion: string[];
}

async function fetchOpciones(): Promise<Opciones> {
  const { data } = await api.get("/dashboard/opciones");
  return data.data as Opciones;
}

const CAMPOS: { key: keyof DashboardFilters; label: string; opt: keyof Opciones }[] = [
  { key: "subcanal", label: "Subcanal", opt: "subcanal" },
  { key: "pais", label: "País", opt: "pais" },
  { key: "asesor", label: "Asesor", opt: "asesor" },
  { key: "categoria", label: "Categoría", opt: "categoria" },
  { key: "subcategoria", label: "Subcategoría", opt: "subcategoria" },
  { key: "dominio", label: "Dominio", opt: "dominio" },
];

/** Convierte "YYYY-MM-DD HH:mm" a "YYYY-MM-DDTHH:mm" para input datetime-local */
const toInput = (v: string | undefined) => v?.replace(" ", "T") ?? "";
/** Convierte "YYYY-MM-DDTHH:mm" de vuelta a "YYYY-MM-DD HH:mm" */
const fromInput = (v: string) => v.replace("T", " ");

export function FilterBar() {
  const { filters, setFilters, clear } = useFilters();
  const [draft, setDraft] = useState<DashboardFilters>(filters);
  const { data: opciones } = useQuery({ queryKey: ["opciones"], queryFn: fetchOpciones });

  const toggle = (key: keyof DashboardFilters, value: string) => {
    setDraft((d) => {
      const cur = (d[key] as string[] | undefined) ?? [];
      const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
      return { ...d, [key]: next.length ? next : undefined };
    });
  };
  const setScalar = (key: keyof DashboardFilters, value: string) =>
    setDraft((d) => ({ ...d, [key]: value || undefined }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(filters);
  const activos = countActive(filters);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-black-5 bg-light px-6 py-3">
      <Chip label="Período" count={draft.fechaHoraInicio || draft.fechaHoraFin ? 1 : 0}>
        <div className="space-y-2">
          <label className="block text-xs text-black-45">
            Desde
            <input
              type="datetime-local"
              value={toInput(draft.fechaHoraInicio)}
              onChange={(e) => setScalar("fechaHoraInicio", e.target.value ? fromInput(e.target.value) : "")}
              className="mt-1 block w-full rounded border border-black-10 bg-white px-2 py-1 text-sm text-black-85"
            />
          </label>
          <label className="block text-xs text-black-45">
            Hasta
            <input
              type="datetime-local"
              value={toInput(draft.fechaHoraFin)}
              onChange={(e) => setScalar("fechaHoraFin", e.target.value ? fromInput(e.target.value) : "")}
              className="mt-1 block w-full rounded border border-black-10 bg-white px-2 py-1 text-sm text-black-85"
            />
          </label>
        </div>
      </Chip>

      {CAMPOS.map((c) => (
        <Chip key={c.key} label={c.label} count={(draft[c.key] as string[] | undefined)?.length ?? 0}>
          <MultiSelect
            options={opciones?.[c.opt] ?? []}
            selected={(draft[c.key] as string[] | undefined) ?? []}
            onToggle={(v) => toggle(c.key, v)}
          />
        </Chip>
      ))}

      <div className="ml-auto flex items-center gap-2">
        {activos > 0 ? (
          <span className="text-xs text-black-45">{activos} filtro(s) activo(s)</span>
        ) : null}
        <button
          onClick={() => {
            setDraft({});
            clear();
          }}
          className="rounded border border-black-10 bg-white px-3 py-1.5 text-sm text-black-45 hover:text-black-85"
        >
          Limpiar
        </button>
        <button
          onClick={() => setFilters(draft)}
          disabled={!dirty}
          className={cn(
            "rounded px-4 py-1.5 text-sm font-medium text-white",
            dirty ? "bg-primary" : "cursor-not-allowed bg-primary/40",
          )}
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
