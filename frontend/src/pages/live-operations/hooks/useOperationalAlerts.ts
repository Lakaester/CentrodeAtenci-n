import { useMemo } from "react";
import { mapAlerts, type AlertUI } from "../mappers/alertMapper";
import { MOCK_ALERT_DTOS } from "../mocks/alerts.mock";
import type { AlertDTO } from "../dto/alert.dto";

export function useOperationalAlerts(dtos?: AlertDTO[]): AlertUI[] {
  const data = dtos ?? MOCK_ALERT_DTOS;
  return useMemo(() => mapAlerts(data), [data]);
}
