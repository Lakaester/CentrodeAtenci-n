import { EmptyState } from "@/components/ui/EmptyState";
import { HelpCircle } from "lucide-react";

export default function Ayuda() {
  return (
    <EmptyState
      icon={HelpCircle}
      title="Centro de Ayuda"
      description="Encuentre guías, documentación y soporte para aprovechar COPE al máximo."
      actionLabel="Ver guías"
      onAction={() => {}}
    />
  );
}
