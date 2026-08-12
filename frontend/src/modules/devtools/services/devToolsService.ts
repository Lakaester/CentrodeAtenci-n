import { api } from "@/lib/api";

export const devToolsService = {
  async getEventHistory() {
    const res = await api.get("/dev/events/history");
    return res.data.data ?? [];
  },
  async getEventTypes() {
    const res = await api.get("/dev/events/types");
    return res.data.data ?? [];
  },
  async getSubscriptions() {
    const res = await api.get("/dev/events/subscriptions");
    return res.data.data ?? [];
  },
};
