import { api } from "@/lib/api";

export interface LicenseInfo {
  type: string;
  status: string;
  expiresAt: string | null;
}

export async function fetchLicenses(): Promise<LicenseInfo[]> {
  try {
    const { data } = await api.get("/dashboard/supervisor", { params: {} });
    return Array.isArray(data?.data?.acciones) ? data.data.acciones.slice(0, 5) : [];
  } catch {
    return [];
  }
}
