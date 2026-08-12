import type { FollowerReason } from "../dto/follower.dto";

export const FOLLOWER_REASON_CONFIG: Record<FollowerReason, { label: string; color: string; priority: number }> = {
  owner:            { label: "Propietario",       color: "text-primary bg-primary-5",       priority: 0 },
  watcher:          { label: "Observador",        color: "text-purple bg-purple-5",   priority: 1 },
  supervisor:       { label: "Supervisor",        color: "text-warning bg-warning-5",     priority: 1 },
  technical:        { label: "Soporte técnico",   color: "text-cyan-600 bg-cyan-50",       priority: 2 },
  "customer-success": { label: "Éxito del cliente", color: "text-success bg-success-5", priority: 2 },
  automation:       { label: "Automatización",    color: "text-black-45 bg-black-5",    priority: 3 },
};

export function getFollowerReasonConfig(r: FollowerReason) {
  return FOLLOWER_REASON_CONFIG[r] ?? FOLLOWER_REASON_CONFIG.watcher;
}
