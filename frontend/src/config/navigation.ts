/**
 * Definición única de los dashboards. La barra lateral y el
 * enrutador se generan a partir de esta lista, así que agregar un
 * dashboard nuevo es cambiar solo este archivo.
 */
import {
  LayoutDashboard, Activity, Users, Tags, Building2,
  MessageCircle, Headphones, TrendingUp, Globe, AlertTriangle, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/reportes",           label: "Resumen",     icon: LayoutDashboard },
  { path: "/reportes/operacion", label: "Operación",   icon: Activity },
  { path: "/reportes/pais",      label: "País",        icon: Globe },
  // SLA integrado en Resumen
  { path: "/reportes/asesores",   label: "Asesores",   icon: Users },
  { path: "/reportes/categorias", label: "Categorías",  icon: Tags },
  { path: "/reportes/clientes",   label: "Clientes",   icon: Building2 },
  { path: "/reportes/whatsapp",   label: "WhatsApp",   icon: MessageCircle },
  { path: "/reportes/zendesk",    label: "Zendesk",    icon: Headphones },
  { path: "/reportes/tendencias", label: "Tendencias",  icon: TrendingUp },
  { path: "/reportes/quejas",    label: "Quejas y Devoluciones", icon: AlertTriangle },
];
