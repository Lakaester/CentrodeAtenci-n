import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FiltroKey = "todos" | "meta" | "whatsapp" | "correo" | "high" | "low" | "tech" | "sin_atender" | "en_proceso" | "esperando" | "esperando_dev" | "vencidos_sla";

const FILTROS: { key: FiltroKey; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "meta", label: "Meta" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "correo", label: "Correo" },
  { key: "high", label: "High" },
  { key: "low", label: "Low" },
  { key: "tech", label: "Tech" },
  { key: "sin_atender", label: "Sin atender" },
  { key: "en_proceso", label: "En proceso" },
  { key: "esperando", label: "Esperando cliente" },
  { key: "esperando_dev", label: "Esperando DEV" },
  { key: "vencidos_sla", label: "Vencidos SLA" },
];

interface Props {
  activo: FiltroKey;
  onChange: (key: FiltroKey) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function FiltrosRapidos({ activo, onChange, searchValue, onSearchChange }: Props) {
  return (
    <div className="space-y-2 border-b border-black-10 p-3">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-black-25" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por cliente, dominio, ticket..."
          className="w-full rounded-lg border border-black-10 bg-light py-1.5 pl-8 pr-7 text-xs text-black-85 placeholder:text-black-25 focus:border-[#2563EB] focus:bg-white focus:outline-none"
        />
        {searchValue && (
          <button onClick={() => onSearchChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-black-25 hover:text-black-45">
            <X size={12} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              activo === f.key
                ? "bg-primary text-white"
                : "bg-black-5 text-black-45 hover:bg-black-10",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export type { FiltroKey };
