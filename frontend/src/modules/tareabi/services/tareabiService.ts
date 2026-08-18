import { api } from "@/lib/api";
import type { TareabiTicketLog, TareabiDetalleTarea } from "../types";

export const tareabiService = {
  /** Logs de una tarea + su ticket (proxy COPE → Tareabi real). */
  async logs(tareabiId: string, ticketbiId: string): Promise<TareabiTicketLog> {
    const res = await api.post(`/tareabi/logs/${encodeURIComponent(tareabiId)}/${encodeURIComponent(ticketbiId)}`);
    return res.data.data;
  },

  async detalle(tareabiId: string): Promise<TareabiDetalleTarea> {
    const res = await api.get(`/tareabi/detalle/${encodeURIComponent(tareabiId)}`);
    return res.data.data;
  },

  async estados(): Promise<string[]> {
    const res = await api.get("/tareabi/estados");
    return res.data.data ?? [];
  },
};
