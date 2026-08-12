import { useState } from "react";
import { Search } from "lucide-react";
import type { DevEvent } from "../types";

interface Props {
  events: DevEvent[];
}

export function EventLog({ events }: Props) {
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? events.filter((e) =>
        e.eventType.toLowerCase().includes(filter.toLowerCase()) ||
        e.provider?.toLowerCase().includes(filter.toLowerCase())
      )
    : events;

  return (
    <div>
      <div className="relative mb-2 max-w-xs">
        <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-black-25" />
        <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por tipo o provider..."
          className="w-full rounded-md border border-black-10 py-1 pl-7 pr-2 text-[11px] focus:border-[#2563EB] focus:outline-none"
        />
      </div>
      <div className="max-h-[70vh] overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-black-25">Sin eventos</p>
        ) : (
          filtered.slice().reverse().map((e) => (
            <div key={e.eventId} className="flex items-center gap-2 rounded border border-black-10 px-2.5 py-1.5 text-[10px] font-mono">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                e.severity === "error" ? "bg-danger-50" : e.severity === "warning" ? "bg-warning-50" : "bg-primary-50"
              }`} />
              <span className="shrink-0 text-black-25">{new Date(e.timestamp).toLocaleTimeString("es-PE")}</span>
              <span className="shrink-0 rounded bg-black-5 px-1 font-medium text-primary">{e.eventType}</span>
              {e.provider && <span className="shrink-0 text-black-45">{e.provider}</span>}
              <span className="ml-auto text-black-25">{e.correlationId.slice(0, 8)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
