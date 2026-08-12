import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ClienteInfo, TipoCliente, EstadoCliente } from "./types";
import { TIPO_CLIENTE_LABELS, ESTADO_CLIENTE_LABELS } from "./types";
import { cn } from "@/lib/utils";

interface Props { data: ClienteInfo; loading?: boolean }

const TC_COLOR: Record<TipoCliente, string> = {
  high_touch: "text-purple bg-purple-5 border-purple-200",
  low_touch: "text-aqua bg-aqua-5 border-sky-200",
  tech_touch: "text-black-65 bg-black-5 border-slate-200",
};

const EST_COLOR: Record<EstadoCliente, string> = {
  activo: "text-success bg-success-5 border-emerald-200",
  suspendido: "text-warning bg-warning-5 border-amber-200",
  baja: "text-danger bg-danger-5 border-rose-200",
};

function CollapsibleCard({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div className="rounded-lg border border-black-10">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-black-45">
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
        {title}
      </button>
      {open && <div className="space-y-2 px-3 pb-3">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-black-25">{label}</span>
      <span className="text-right font-medium text-black-85">{children}</span>
    </div>
  );
}

export function TabGeneral({ data, loading }: Props) {
  if (loading) return <div className="space-y-2 p-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-black-10" />)}</div>;
  return (
    <div className="space-y-2 p-3">
      <CollapsibleCard title="Datos del Cliente">
        <Field label="Nombre">{data.nombre}</Field>
        <Field label="Dominio">{data.dominio}</Field>
        <Field label="Teléfono">{data.telefono}</Field>
        <Field label="Correo">{data.correo}</Field>
        <Field label="País">{data.pais}</Field>
        <Field label="RUC">{data.ruc}</Field>
        <Field label="Tipo">
          <span className={cn("inline-block rounded-md border px-2 py-0.5 text-[10px] font-medium", TC_COLOR[data.tipoCliente])}>
            {TIPO_CLIENTE_LABELS[data.tipoCliente]}
          </span>
        </Field>
      </CollapsibleCard>

      <CollapsibleCard title="Cuenta">
        <Field label="Fecha Alta">{data.fechaAlta}</Field>
        <Field label="Tiempo Cliente">{data.tiempoCliente}</Field>
        <Field label="LTV">{data.ltv}</Field>
        <Field label="Estado">
          <span className={cn("inline-block rounded-md border px-2 py-0.5 text-[10px] font-medium", EST_COLOR[data.estado])}>
            {ESTADO_CLIENTE_LABELS[data.estado]}
          </span>
        </Field>
      </CollapsibleCard>
    </div>
  );
}
