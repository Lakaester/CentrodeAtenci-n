import { api } from "@/lib/api";

const DEFAULT_DOMAIN = "demo.restaurant.pe";

export const printerService = {
  async listFeatureFlags(dominio: string = DEFAULT_DOMAIN) {
    const res = await api.post("/printer/feature-flags", { dominio });
    return res.data.data;
  },

  async updateFeatureFlag(dominio: string, nombreFlag: string, habilitado: boolean) {
    const res = await api.post("/printer/feature-flags", { dominio, nombreFlag, habilitado });
    return res.data.data;
  },

  async getLogs(dominio: string, numeroLineas: number, tipoArchivo: string) {
    const res = await api.get("/printer/logs", { params: { dominio, numeroLineas, tipoArchivo } });
    return res.data.data;
  },
};
