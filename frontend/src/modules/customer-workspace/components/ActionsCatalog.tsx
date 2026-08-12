import { FileText, Flag, Monitor, Copy, Search, Wrench } from "lucide-react";
import type { WorkspaceAction } from "../types";

const ACTIONS: WorkspaceAction[] = [
  { id: "logs", label: "Consultar Logs", icon: "file-text", provider: "printer", action: "get-logs", description: "Obtener logs de error del dispositivo" },
  { id: "flags", label: "Feature Flags", icon: "flag", provider: "printer", action: "list-feature-flags", description: "Ver estado de feature flags" },
  { id: "ambiente", label: "Info del equipo", icon: "monitor", provider: "printer", action: "system-info", description: "Información del hardware y software" },
  { id: "copiar", label: "Copiar dominio", icon: "copy", provider: "system", action: "copy-domain", description: "Copiar dominio al portapapeles" },
];

interface Props {
  onAction: (action: WorkspaceAction) => void;
}

const ICON_MAP: Record<string, typeof FileText> = {
  "file-text": FileText,
  "flag": Flag,
  "monitor": Monitor,
  "copy": Copy,
  "search": Search,
  "wrench": Wrench,
};

export function ActionsCatalog({ onAction }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ACTIONS.map((a) => {
        const Icon = ICON_MAP[a.icon] ?? Wrench;
        return (
          <button key={a.id} type="button" onClick={() => onAction(a)}
            className="flex items-center gap-2 rounded-lg border border-black-10 bg-white px-3 py-2.5 text-left text-[11px] hover:bg-light transition-colors">
            <Icon size={14} className="shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-medium text-black-85">{a.label}</p>
              <p className="text-[10px] text-black-45 truncate">{a.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
