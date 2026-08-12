import type { LucideIcon } from "lucide-react";

export const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/atenciones": "Atenciones",
  "/clientes": "Clientes",
  "/reportes": "Reportes",
  "/reportes/operacion": "Operacion",
  "/reportes/pais": "Pais",
  "/reportes/asesores": "Asesores",
  "/reportes/categorias": "Categorias",
  "/reportes/clientes": "Clientes",
  "/reportes/whatsapp": "WhatsApp",
  "/reportes/zendesk": "Zendesk",
  "/reportes/tendencias": "Tendencias",
  "/reportes/sla": "SLA",
  "/admin/guias": "Conocimiento",
  "/configuracion": "Configuracion",
  "/zendesk": "Zendesk",
  "/ayuda": "Ayuda",
  "/design-system": "Design System",
  "/live-operations": "Operaciones en vivo",
  "/supervisor": "Supervisor",
  "/collaboration": "Colaboracion",
  "/infrastructure": "Infraestructura",
  "/incidents": "Incidentes",
  "/releases": "Releases",
  "/queues": "Colas",
  "/billing-health": "Facturacion Electronica",
  "/alerts": "Alertas",
};

export interface SidebarEntry {
  path: string;
  label: string;
  icon: LucideIcon;
}
