import type { LucideIcon } from "lucide-react";

export const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/atenciones": "Atenciones",
  "/control-facturacion": "Control de Facturación",
  "/clientes": "Clientes",
  "/gestion": "Gestión",
  "/gestion/quejas-devoluciones": "Quejas y Devoluciones",
  "/gestion/apoyos": "Apoyos",
  "/gestion/agendas": "Agendas",
  "/quejas-devoluciones": "Quejas y Devoluciones",
  "/reportes": "Reportes",
  "/reportes/operacion": "Operación",
  "/reportes/pais": "País",
  "/reportes/asesores": "Asesores",
  "/reportes/categorias": "Categorías",
  "/reportes/clientes": "Clientes",
  "/reportes/whatsapp": "WhatsApp",
  "/reportes/zendesk": "Zendesk",
  "/reportes/sla": "SLA",
  "/admin/guias": "Conocimiento",
  "/configuracion": "Configuración",
  "/configuracion/preferencias": "Preferencias",
  "/configuracion/usuarios": "Usuarios",
  "/configuracion/roles": "Roles y Permisos",
  "/configuracion/equipos": "Equipos",
  "/configuracion/atencion": "Atención",
  "/configuracion/facturacion": "Control de Facturación",
  "/configuracion/quejas-devoluciones": "Quejas y Devoluciones",
  "/configuracion/reporteria": "Reportería",
  "/configuracion/conocimiento": "Conocimiento",
  "/configuracion/integraciones": "Integraciones",
  "/configuracion/notificaciones": "Notificaciones",
  "/configuracion/auditoria": "Auditoría",
  "/zendesk": "Zendesk",
  "/ayuda": "Ayuda",
  "/design-system": "Design System",
  "/live-operations": "Operaciones en vivo",
  "/supervisor": "Supervisor",
  "/collaboration": "Colaboración",
  "/infrastructure": "Infraestructura",
  "/incidents": "Incidentes",
  "/releases": "Releases",
  "/queues": "Colas",
  "/billing-health": "Facturación Electrónica",
  "/alerts": "Alertas",
};

export interface SidebarEntry {
  path: string;
  label: string;
  icon: LucideIcon;
}
