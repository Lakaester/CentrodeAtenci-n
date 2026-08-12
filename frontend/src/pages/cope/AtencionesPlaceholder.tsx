import { EmptyState } from "@/components/ui/EmptyState";
import { Ticket } from "lucide-react";

export default function AtencionesPlaceholder() {
  return (
    <EmptyState
      icon={Ticket}
      title="Sección de Atenciones"
      description="Esta vista estará disponible en una próxima versión. Por ahora, puede usar la Bandeja principal."
      actionLabel="Ir a Bandeja"
      onAction={() => window.location.href = "/atenciones"}
    />
  );
}
