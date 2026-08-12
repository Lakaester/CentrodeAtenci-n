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

function NoteCard({ label, content }: { label: string; content: string }) {
  return (
    <div className="rounded-lg border border-black-10 bg-light p-2.5">
      <p className="text-[9px] font-medium uppercase tracking-wider text-black-25">{label}</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-black-85">{content}</p>
    </div>
  );
}

export function TabNotas({ data, loading }: Props) {
  if (loading) return <div className="space-y-2 p-3">{[1,2,3,4].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-black-10" />)}</div>;
  return (
    <div className="space-y-2 p-3">
      <CollapsibleCard title="Notas">
        <NoteCard label="Notas Internas" content={data.notasInternas} />
      </CollapsibleCard>

      <CollapsibleCard title="Observaciones">
        <NoteCard label="Observaciones" content={data.observaciones} />
      </CollapsibleCard>

      <CollapsibleCard title="Clientes VIP">
        <NoteCard label="Clientes VIP" content={data.clientesVIP} />
      </CollapsibleCard>

      <CollapsibleCard title="Recordatorios">
        <NoteCard label="Recordatorios" content={data.recordatorios} />
      </CollapsibleCard>

      <CollapsibleCard title="Notas Administrativas">
        <NoteCard label="Notas Administrativas" content={data.notasAdministrativas} />
      </CollapsibleCard>
    </div>
  );
}
