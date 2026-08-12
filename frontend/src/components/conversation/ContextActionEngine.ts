import { Reply, FileText, UserPlus, ArrowRightLeft, Tags, Bug, ArrowUpRight, type LucideIcon } from "lucide-react";

export interface ContextAction {
  id: string;
  label: string;
  icon: LucideIcon;
  disponible: boolean;
  motivoNoDisponible?: string;
}

interface CategoriaConfig {
  patrones: string[];
  acciones: ContextAction[];
}

const CATEGORIAS: CategoriaConfig[] = [
  {
    patrones: ["facturación", "facturacion", "fe", "cdt", "comprobante", "sunat"],
    acciones: [
      { id: "responder",      label: "Responder",         icon: Reply,        disponible: true },
      { id: "nota_interna",   label: "Nota interna",      icon: FileText,     disponible: true },
      { id: "estado",         label: "Cambiar estado",    icon: ArrowRightLeft, disponible: true },
      { id: "categorizar",    label: "Categorizar",       icon: Tags,         disponible: true },
      { id: "asignar",        label: "Asignar",           icon: UserPlus,     disponible: false, motivoNoDisponible: "Integración Restafact pendiente" },
      { id: "crear_dev",      label: "Crear DEV",         icon: Bug,          disponible: false, motivoNoDisponible: "Integración DEV pendiente" },
    ],
  },
  {
    patrones: ["integración", "integraciones", "pedidosya", "rappi", "uber"],
    acciones: [
      { id: "responder",      label: "Responder",         icon: Reply,        disponible: true },
      { id: "nota_interna",   label: "Nota interna",      icon: FileText,     disponible: true },
      { id: "estado",         label: "Cambiar estado",    icon: ArrowRightLeft, disponible: true },
      { id: "asignar",        label: "Asignar",           icon: UserPlus,     disponible: true },
      { id: "monitor",        label: "Abrir Monitor",     icon: ArrowUpRight, disponible: false, motivoNoDisponible: "Integración Monitor pendiente" },
    ],
  },
  {
    patrones: ["software", "versión", "actualización", "error sistema"],
    acciones: [
      { id: "responder",      label: "Responder",         icon: Reply,        disponible: true },
      { id: "nota_interna",   label: "Nota interna",      icon: FileText,     disponible: true },
      { id: "estado",         label: "Cambiar estado",    icon: ArrowRightLeft, disponible: true },
      { id: "asignar",        label: "Asignar",           icon: UserPlus,     disponible: true },
      { id: "crear_dev",      label: "Crear DEV",         icon: Bug,          disponible: false, motivoNoDisponible: "Integración DEV pendiente" },
    ],
  },
  {
    patrones: ["logística", "logistica", "inventario", "entrega", "envío"],
    acciones: [
      { id: "responder",      label: "Responder",         icon: Reply,        disponible: true },
      { id: "nota_interna",   label: "Nota interna",      icon: FileText,     disponible: true },
      { id: "estado",         label: "Cambiar estado",    icon: ArrowRightLeft, disponible: true },
      { id: "asignar",        label: "Asignar",           icon: UserPlus,     disponible: true },
      { id: "dashboard_log",  label: "Dashboard Log.",    icon: ArrowUpRight, disponible: false, motivoNoDisponible: "Integración Logística pendiente" },
    ],
  },
  {
    patrones: ["administrativo", "contrato", "pago", "factura", "cobro"],
    acciones: [
      { id: "responder",      label: "Responder",         icon: Reply,        disponible: true },
      { id: "nota_interna",   label: "Nota interna",      icon: FileText,     disponible: true },
      { id: "estado",         label: "Cambiar estado",    icon: ArrowRightLeft, disponible: true },
      { id: "asignar",        label: "Asignar",           icon: UserPlus,     disponible: true },
    ],
  },
];

const DEFAULT: ContextAction[] = [
  { id: "responder",      label: "Responder",      icon: Reply,        disponible: true },
  { id: "nota_interna",   label: "Nota interna",   icon: FileText,     disponible: true },
  { id: "estado",         label: "Cambiar estado", icon: ArrowRightLeft, disponible: true },
  { id: "categorizar",    label: "Categorizar",    icon: Tags,         disponible: true },
];

export function getAcciones(categoria: string | null | undefined): ContextAction[] {
  if (!categoria) return DEFAULT;
  const cat = categoria.toLowerCase();
  const config = CATEGORIAS.find((c) => c.patrones.some((p) => cat.includes(p)));
  return config?.acciones ?? DEFAULT;
}
