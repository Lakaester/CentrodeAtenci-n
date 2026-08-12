import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "outline" | "ghost" | "secondary" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-85 disabled:opacity-50",
  outline: "bg-primary-5 text-primary border border-primary hover:bg-primary-10 disabled:opacity-50",
  ghost: "bg-transparent text-black-85 hover:bg-light disabled:opacity-50",
  secondary: "bg-primary text-white hover:bg-primary-85 disabled:opacity-50",
  danger: "bg-danger text-white hover:bg-danger-85 disabled:opacity-50",
  success: "bg-success text-white hover:bg-success-85 disabled:opacity-50",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded gap-1.5",
  md: "h-10 px-4 text-sm rounded gap-2",
  lg: "h-12 px-6 text-base rounded gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors truncate",
        variantStyles[variant],
        sizeStyles[size],
        loading && "cursor-wait",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" />}
      {children}
    </button>
  );
}
