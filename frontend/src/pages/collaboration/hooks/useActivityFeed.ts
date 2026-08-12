import { useMemo } from "react";
import { mapActivities, type ActivityUI } from "../mappers/activity.mapper";
import type { ActivityDTO } from "../dto/activity.dto";

export function useActivityFeed(dtos?: ActivityDTO[]): ActivityUI[] {
  const data = dtos ?? [];
  return useMemo(() => mapActivities(data), [data]);
}
