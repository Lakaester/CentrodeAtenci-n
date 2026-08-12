import { api } from "@/lib/api";

export const operationsService = {
  async getDashboard() {
    const res = await api.get("/operations/dashboard");
    return res.data.data as any;
  },
};
