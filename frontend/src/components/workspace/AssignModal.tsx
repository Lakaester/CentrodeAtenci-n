import { useState, useEffect } from "react";
import { Search, X, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Agent {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  avatar: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAssign: (agentId: number) => void;
  currentAssigneeId?: number | null;
}

export function AssignModal({ open, onClose, onAssign, currentAssigneeId }: Props) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get("/zendesk/agents")
      .then((res) => setAgents(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const filtrados = agents.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.nombre.toLowerCase().includes(q) || a.correo.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white border border-black-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
          <h3 className="text-sm font-semibold text-black-85">Asignar responsable</h3>
          <button type="button" onClick={onClose} className="text-black-45 hover:text-black-65">
            <X size={16} />
          </button>
        </div>

        <div className="relative border-b border-black-10 px-3 py-2">
          <Search size={13} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-black-45" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar agente..."
            autoFocus
            className="w-full h-9 rounded border border-black-10 bg-white py-1.5 pl-7 pr-2 text-[12px] text-black-85 placeholder:text-black-25 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="max-h-64 overflow-y-auto p-1">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-[11px] text-black-25">Cargando agentes...</div>
          ) : filtrados.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-[11px] text-black-25">Sin resultados</div>
          ) : (
            filtrados.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => { onAssign(agent.id); onClose(); }}
                className={cn(
                  "flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-[12px] transition-colors",
                  currentAssigneeId === agent.id
                    ? "bg-primary-5 ring-1 ring-primary"
                    : "hover:bg-light",
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-10 text-[11px] font-semibold text-primary">
                  {agent.nombre.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium text-black-85">{agent.nombre}</span>
                    {agent.rol === "admin" && <Shield size={11} className="text-warning" />}
                    {agent.rol === "agent" && <User size={11} className="text-black-45" />}
                  </div>
                  <span className="truncate text-[10px] text-black-45">{agent.correo}</span>
                </div>
                {currentAssigneeId === agent.id && (
                  <span className="text-[9px] font-medium text-primary">Actual</span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="border-t border-black-10 px-3 py-2 text-[9px] text-black-25">
          {agents.length} agentes sincronizados
        </div>
      </div>
    </div>
  );
}
