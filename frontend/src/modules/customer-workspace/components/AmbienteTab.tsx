import { ActionsCatalog } from "./ActionsCatalog";
import type { WorkspaceAction } from "../types";

interface Props {
  onAction: (action: WorkspaceAction) => void;
}

export function AmbienteTab({ onAction }: Props) {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-sm font-semibold text-black-85">Ambiente</h2>
      <p className="text-[11px] text-black-45">Acciones disponibles para este cliente.</p>
      <ActionsCatalog onAction={onAction} />
    </div>
  );
}
