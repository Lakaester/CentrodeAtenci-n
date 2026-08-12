export type TicketPriority = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";

export interface PriorityConfig {
  level: TicketPriority;
  score: number;
  slaMaxMinutes: number;
  color: string;
}

export const PRIORITY_CONFIG: Record<TicketPriority, PriorityConfig> = {
  BAJA: { level: "BAJA", score: 10, slaMaxMinutes: 2880, color: "text-sky-600" },
  MEDIA: { level: "MEDIA", score: 30, slaMaxMinutes: 1440, color: "text-amber-600" },
  ALTA: { level: "ALTA", score: 60, slaMaxMinutes: 480, color: "text-rose-500" },
  CRITICA: { level: "CRITICA", score: 90, slaMaxMinutes: 120, color: "text-red-600" },
};

export function calculatePriority(score: number): TicketPriority {
  if (score >= 80) return "CRITICA";
  if (score >= 50) return "ALTA";
  if (score >= 20) return "MEDIA";
  return "BAJA";
}
