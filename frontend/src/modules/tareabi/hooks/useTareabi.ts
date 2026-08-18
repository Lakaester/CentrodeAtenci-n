import { useQuery } from "@tanstack/react-query";
import { tareabiService } from "../services/tareabiService";
import type { TareabiTicketLog } from "../types";

const KEY = ["tareabi"];

export function useTareabiLogs(tareabiId: string | null, ticketbiId: string | null) {
  return useQuery({
    queryKey: [...KEY, "logs", tareabiId, ticketbiId],
    queryFn: () => tareabiService.logs(tareabiId as string, ticketbiId as string),
    enabled: Boolean(tareabiId && ticketbiId),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });
}

export function useTareabiDetalle(tareabiId: string | null) {
  return useQuery({
    queryKey: [...KEY, "detalle", tareabiId],
    queryFn: () => tareabiService.detalle(tareabiId as string),
    enabled: Boolean(tareabiId),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });
}

export type { TareabiTicketLog };
