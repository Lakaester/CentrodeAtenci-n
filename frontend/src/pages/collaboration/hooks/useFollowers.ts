import { useMemo } from "react";
import { mapFollowers, type FollowerUI } from "../mappers/follower.mapper";
import type { FollowerDTO } from "../dto/follower.dto";

export function useFollowers(dtos?: FollowerDTO[]): FollowerUI[] {
  const data = dtos ?? [];
  return useMemo(() => mapFollowers(data), [data]);
}
