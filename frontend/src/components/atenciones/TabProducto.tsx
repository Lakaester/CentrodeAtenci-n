import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ClienteInfo } from "./types";
import { cn } from "@/lib/utils";

interface Props { data: ClienteInfo; loading?: boolean }

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

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black-10">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-[10px] text-black-45">{pct}%</span>
    </div>
  );
}

export function TabProducto({ data, loading }: Props) {
  if (loading) return <div className="space-y-2 p-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-black-10" />)}</div>;
  return (
    <div className="space-y-2 p-3">
      <CollapsibleCard title="Producto">
        <Field label="Producto Principal">{data.productoPrincipal}</Field>
        <Field label="Versión">{data.version}</Field>
        <Field label="Última Sincronización">{data.ultimaSincronizacion}</Field>
        <Field label="Cant. Locales">{data.cantidadLocales}</Field>
        <div className="pt-1">
          <p className="mb-1 text-[10px] font-medium text-black-25">Configuraciones Activas</p>
          <div className="flex flex-wrap gap-1">
            {data.configuracionesActivas.map((c, i) => (
              <span key={i} className="rounded bg-black-5 px-1.5 py-0.5 text-[10px] text-black-45">{c}</span>
            ))}
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Facturación Electrónica">
        <Field label="Estado CDT">
          <span className="rounded bg-success-5 px-1.5 py-0.5 text-[10px] font-medium text-success">{data.estadoCDT}</span>
        </Field>
        <Field label="Vencimiento CDT">{data.fechaVencimientoCDT}</Field>
        <Field label="Certificado">
          <span className="rounded bg-success-5 px-1.5 py-0.5 text-[10px] font-medium text-success">{data.estadoCertificado}</span>
        </Field>
      </CollapsibleCard>

      <CollapsibleCard title="Folios Chile">
        <div className="space-y-1.5">
          <div>
            <div className="flex justify-between text-[10px] text-black-45"><span>Disponibles</span><span className="font-medium text-black-85">{data.foliosDisponibles}</span></div>
            <ProgressBar value={data.foliosDisponibles} max={data.foliosDisponibles + data.foliosConsumidos} color="bg-primary" />
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-black-45"><span>Consumidos</span><span className="font-medium text-black-85">{data.foliosConsumidos}</span></div>
            <ProgressBar value={data.foliosConsumidos} max={data.foliosDisponibles + data.foliosConsumidos} color="bg-primary" />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-black-25">Pendientes</span>
            <span className="font-medium text-black-85">{data.foliosPendientes}</span>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}
