export type FollowerReason =
  | "owner"
  | "watcher"
  | "supervisor"
  | "technical"
  | "customer-success"
  | "automation";

export interface FollowerDTO {
  id: string;
  ticketId: string;
  user: string;
  role: string;
  followingSince: string;
  reason: FollowerReason;
  notificationsEnabled: boolean;
  status: "activo" | "inactivo";
}
