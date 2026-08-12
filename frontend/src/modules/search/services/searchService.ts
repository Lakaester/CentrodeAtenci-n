import { api } from "@/lib/api";

export const searchService = {
  async search(q: string) {
    const res = await api.get("/search", { params: { q } });
    return res.data.data as { results: any[]; type: string };
  },
};
