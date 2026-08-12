import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { FileText, Truck, Grid3X3, Cpu, GraduationCap, ClipboardList, Building2, Headphones, Copy, MessageSquare, HelpCircle } from "lucide-react";
import { FacturacionWorkspace } from "./FacturacionWorkspace";
import { LogisticaWorkspace } from "./LogisticaWorkspace";
import { IntegracionesWorkspace } from "./IntegracionesWorkspace";
import { SoftwareWorkspace } from "./SoftwareWorkspace";
import { CapacitacionWorkspace } from "./CapacitacionWorkspace";
import { GestionWorkspace } from "./GestionWorkspace";
import { AdministrativoWorkspace } from "./AdministrativoWorkspace";
import { OperativoWorkspace } from "./OperativoWorkspace";
import { DuplicadaWorkspace } from "./DuplicadaWorkspace";
import { NoContestoWorkspace } from "./NoContestoWorkspace";
import { SinHomologarWorkspace } from "./SinHomologarWorkspace";

interface CategoryConfig {
  icon: typeof FileText;
  color: string;
  label: string;
  desc: string;
  component: () => ReactNode;
}

export const CATEGORY_REGISTRY: Record<string, CategoryConfig> = {
  "Facturación Electrónica": {
    icon: FileText, color: "text-primary bg-primary-10", label: "Facturación Electrónica", desc: "Gestión de comprobantes, CDT y SUNAT",
    component: FacturacionWorkspace,
  },
  Logística: {
    icon: Truck, color: "text-primary bg-primary-10", label: "Logística", desc: "Inventarios, sincronización y pedidos",
    component: LogisticaWorkspace,
  },
  Integraciones: {
    icon: Grid3X3, color: "text-success bg-success-5", label: "Integraciones", desc: "Conexión con plataformas externas",
    component: IntegracionesWorkspace,
  },
  Software: {
    icon: Cpu, color: "text-purple bg-purple-5", label: "Software", desc: "Versiones, configuraciones y actualizaciones",
    component: SoftwareWorkspace,
  },
  Capacitación: {
    icon: GraduationCap, color: "text-purple bg-purple-5", label: "Capacitación", desc: "Cursos, manuales y material de aprendizaje",
    component: CapacitacionWorkspace,
  },
  Gestión: {
    icon: ClipboardList, color: "text-cyan-600 bg-cyan-50", label: "Gestión", desc: "Trámites, documentos y seguimiento",
    component: GestionWorkspace,
  },
  Administrativo: {
    icon: Building2, color: "text-success bg-success-5", label: "Administrativo", desc: "Pagos, contratos y estado comercial",
    component: AdministrativoWorkspace,
  },
  Configuración: {
    icon: Cpu, color: "text-black-65 bg-black-5", label: "Configuración", desc: "Ajustes del sistema",
    component: SoftwareWorkspace,
  },
  OPERATIVO: {
    icon: Headphones, color: "text-aqua bg-aqua-5", label: "Soporte en Línea", desc: "Derivación a equipo operativo",
    component: OperativoWorkspace,
  },
  DUPLICADA: {
    icon: Copy, color: "text-warning bg-warning-5", label: "Ticket Duplicado", desc: "Ya existe un ticket relacionado",
    component: DuplicadaWorkspace,
  },
  "NO CONTESTÓ": {
    icon: MessageSquare, color: "text-black-65 bg-black-5", label: "Sin respuesta", desc: "Cliente no ha respondido",
    component: NoContestoWorkspace,
  },
  "SIN HOMOLOGAR": {
    icon: HelpCircle, color: "text-danger bg-danger-5", label: "Sin homologar", desc: "Categoría no definida",
    component: SinHomologarWorkspace,
  },
};

export function getCategoryConfig(categoria: string): CategoryConfig {
  return CATEGORY_REGISTRY[categoria] ?? CATEGORY_REGISTRY["SIN HOMOLOGAR"];
}

export function WorkspaceAdaptativo({ categoria }: { categoria: string }) {
  const config = getCategoryConfig(categoria);
  const Icon = config.icon;
  const Component = config.component;

  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-2 rounded-lg border border-black-10 p-3", config.color.split(" ").slice(1).join(" "))}>
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", config.color)}>
          <Icon size={16} />
        </div>
        <div>
          <p className="text-xs font-semibold text-black-85">{config.label}</p>
          <p className="text-[10px] text-black-45">{config.desc}</p>
        </div>
      </div>
      <Component />
    </div>
  );
}

