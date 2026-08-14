import type { LucideIcon } from "lucide-react";

export const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/atenciones": "Atenciones",
  "/control-facturacion": "Control de Facturacion",
  "/clientes": "Clientes",
  "/quejas-devoluciones": "Quejas y Devoluciones",
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
  "/configuracion/preferencias": "Preferencias",
  "/configuracion/usuarios": "Usuarios",
  "/configuracion/roles": "Roles y Permisos",
  "/configuracion/equipos": "Equipos",
  "/configuracion/atencion": "Atencion",
  "/configuracion/facturacion": "Control de Facturacion",
  "/configuracion/quejas-devoluciones": "Quejas y Devoluciones",
  "/configuracion/reporteria": "Reporteria",
  "/configuracion/conocimiento": "Conocimiento",
  "/configuracion/integraciones": "Integraciones",
  "/configuracion/notificaciones": "Notificaciones",
  "/configuracion/auditoria": "Auditoria",
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
