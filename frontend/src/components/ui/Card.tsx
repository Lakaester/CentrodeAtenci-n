import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-black-5 bg-white",
        hover && "transition-colors hover:",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, icon, action, className }: HeaderProps) {
  return (
    <div className={cn("flex items-center justify-between border-b border-black-10 px-5 py-4", className)}>
      <div className="flex items-center gap-3">
        {icon && <div className="text-black-45">{icon}</div>}
        <div>
          {title && <h3 className="text-sm font-semibold text-black-85">{title}</h3>}
          {subtitle && <p className="text-xs text-black-45">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface BodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className }: BodyProps) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

interface FooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: FooterProps) {
  return (
    <div className={cn("border-t border-black-10 px-5 py-3", className)}>
      {children}
    </div>
  );
}
