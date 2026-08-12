import { useMemo } from "react";
import { mapTimeline, type TimelineUI } from "../mappers/timeline.mapper";
import type { TimelineDTO } from "../dto/timeline.dto";

export function useTimeline(dtos?: TimelineDTO[]): TimelineUI[] {
  const data = dtos ?? [];
  return useMemo(() => mapTimeline(data), [data]);
}
