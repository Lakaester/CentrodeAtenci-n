import { useMemo } from "react";
import { mapQueueItems, type QueueItemUI } from "../mappers/queueMapper";
import { MOCK_QUEUE_DTOS } from "../mocks/queue.mock";
import type { QueueItemDTO } from "../dto/queue.dto";

export function useQueue(dtos?: QueueItemDTO[]): QueueItemUI[] {
  const data = dtos ?? MOCK_QUEUE_DTOS;
  return useMemo(() => mapQueueItems(data), [data]);
}
