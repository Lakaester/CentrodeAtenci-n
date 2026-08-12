import type { FollowerDTO } from "../dto/follower.dto";
const n = Date.now();

export const MOCK_FOLLOWER_DTOS: FollowerDTO[] = [
  { id: "F-001", ticketId: "Q-003", user: "María López",   role: "Asesor",     followingSince: new Date(n - 1 * 86400000).toISOString(),  reason: "owner",            notificationsEnabled: true,  status: "activo" },
  { id: "F-002", ticketId: "Q-003", user: "Carlos Ruiz",    role: "Asesor",     followingSince: new Date(n - 2 * 86400000).toISOString(),  reason: "watcher",          notificationsEnabled: true,  status: "activo" },
  { id: "F-003", ticketId: "C-001", user: "Ana Martínez",   role: "Asesor",     followingSince: new Date(n - 3 * 86400000).toISOString(),  reason: "owner",            notificationsEnabled: true,  status: "activo" },
  { id: "F-004", ticketId: "C-001", user: "Supervisor",     role: "Supervisor", followingSince: new Date(n - 4 * 86400000).toISOString(),  reason: "supervisor",       notificationsEnabled: false, status: "activo" },
  { id: "F-005", ticketId: "S-001", user: "Jorge Castillo", role: "Asesor",     followingSince: new Date(n - 5 * 86400000).toISOString(),  reason: "owner",            notificationsEnabled: true,  status: "activo" },
  { id: "F-006", ticketId: "S-001", user: "María López",    role: "Asesor",     followingSince: new Date(n - 6 * 86400000).toISOString(),  reason: "technical",        notificationsEnabled: true,  status: "activo" },
  { id: "F-007", ticketId: "Q-001", user: "Sofía Vega",     role: "Asesor",     followingSince: new Date(n - 7 * 86400000).toISOString(),  reason: "customer-success", notificationsEnabled: false, status: "activo" },
  { id: "F-008", ticketId: "C-002", user: "Carlos Ruiz",    role: "Asesor",     followingSince: new Date(n - 10 * 86400000).toISOString(), reason: "watcher",          notificationsEnabled: true,  status: "inactivo" },
  { id: "F-009", ticketId: "Q-005", user: "Ana Martínez",   role: "Asesor",     followingSince: new Date(n - 14 * 86400000).toISOString(), reason: "owner",            notificationsEnabled: true,  status: "activo" },
  { id: "F-010", ticketId: "Q-005", user: "Supervisor",     role: "Supervisor", followingSince: new Date(n - 20 * 86400000).toISOString(), reason: "supervisor",       notificationsEnabled: true,  status: "activo" },
];
