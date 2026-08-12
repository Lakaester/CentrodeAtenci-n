import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

const ALIGN_CLASSES = {
  left: "justify-start",
  right: "justify-end",
  center: "justify-center",
};

export function WidgetActions({ children, align = "right", className }: Props) {
  return (
    <div className={cn("flex items-center gap-2", ALIGN_CLASSES[align], className)}>
      {children}
    </div>
  );
}
