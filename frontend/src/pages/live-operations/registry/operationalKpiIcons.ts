import {
  Activity, Clock, AlertTriangle, Users, Timer, MessageCircle,
  type LucideIcon,
} from "lucide-react";

export const OPERATIONAL_KPI_ICONS: Record<string, LucideIcon> = {
  ticketsActivos: Activity,
  ticketsPendientes: Clock,
  slaEnRiesgo: AlertTriangle,
  asesoresDisponibles: Users,
  tiempoPromedioEspera: Timer,
  conversacionesActivas: MessageCircle,
};

export function getOperationalKpiIcon(key: string): LucideIcon {
  return OPERATIONAL_KPI_ICONS[key] ?? Activity;
}
