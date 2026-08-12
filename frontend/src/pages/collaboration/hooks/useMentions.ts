import { useMemo } from "react";
import { mapMentions, type MentionUI } from "../mappers/mention.mapper";
import type { MentionDTO } from "../dto/mention.dto";

export function useMentions(dtos?: MentionDTO[]): MentionUI[] {
  const data = dtos ?? [];
  return useMemo(() => mapMentions(data), [data]);
}
