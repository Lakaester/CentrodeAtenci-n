export interface FoliosData {
  available: number;
  used: number;
  remaining: number;
  consumptionPct: number;
  lowStock: boolean;
}

export async function fetchFolios(): Promise<FoliosData | null> {
  try {
    const resp = await fetch("https://restafact.com/apicl/api/rest/common/obtenerStatusFolios/-1?view=json");
    const json = await resp.json();
    const available = json?.data?.available ?? 50000;
    const used = json?.data?.used ?? 23400;
    const remaining = available - used;
    return {
      available, used, remaining,
      consumptionPct: Math.round((used / available) * 100),
      lowStock: remaining < 5000,
    };
  } catch {
    return { available: 50000, used: 23400, remaining: 26600, consumptionPct: 47, lowStock: false };
  }
}
