import { useMemo } from "react";
import { Users, AlertTriangle, Eye, FileText, Clock, PlusCircle } from "lucide-react";
import { mapActions, type SupervisorActionUI } from "../mappers/supervisorActionMapper";
import { MOCK_ACTION_DTOS } from "../mocks/supervisorActions.mock";
import type { SupervisorActionDTO } from "../dto/supervisor-action.dto";
import type { LucideIcon } from "lucide-react";

export interface ResolvedAction extends SupervisorActionUI {
  Icon: LucideIcon;
}

const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  alertTriangle: AlertTriangle,
  eye: Eye,
  fileText: FileText,
  clock: Clock,
  plusCircle: PlusCircle,
};

function resolveIcon(key: string): LucideIcon {
  return ICON_MAP[key] ?? FileText;
}

export function useSupervisorActions(dtos?: SupervisorActionDTO[]): ResolvedAction[] {
  const data = dtos ?? MOCK_ACTION_DTOS;

  return useMemo(() => {
    return mapActions(data).map((a) => ({
      ...a,
      Icon: resolveIcon(a.iconKey),
    }));
  }, [data]);
}
