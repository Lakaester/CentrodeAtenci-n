import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "yellow"
  | "aqua"
  | "purple"
  | "magenta"
  | "whatsapp"
  | "correo"
  | "meta"
  | "zendesk"
  | "highTouch"
  | "lowTouch"
  | "techTouch"
  | "sla"
  | "vencido"
  | "nuevo"
  | "pendiente"
  | "resuelto"
  | "enProceso";

interface Props {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  default: "bg-black-5 text-black-65",
  primary: "bg-primary-5 text-primary",
  success: "bg-success-5 text-success",
  warning: "bg-warning-5 text-warning",
  danger: "bg-danger-5 text-danger",
  yellow: "bg-yellow-5 text-yellow",
  aqua: "bg-aqua-5 text-aqua",
  purple: "bg-purple-5 text-purple",
  magenta: "bg-magenta-5 text-magenta",
  whatsapp: "bg-success-5 text-success",
  correo: "bg-primary-5 text-primary",
  meta: "bg-purple-5 text-purple",
  zendesk: "bg-primary-5 text-primary",
  highTouch: "bg-purple-5 text-purple",
  lowTouch: "bg-aqua-5 text-aqua",
  techTouch: "bg-dark/5 text-dark-45",
  sla: "bg-warning-5 text-warning",
  vencido: "bg-danger-5 text-danger",
  nuevo: "bg-success-5 text-success",
  pendiente: "bg-yellow-5 text-yellow",
  resuelto: "bg-black-5 text-black-65",
  enProceso: "bg-primary-5 text-primary",
};

export function Badge({ variant = "default", children, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
