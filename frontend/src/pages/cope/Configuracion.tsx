import { EmptyState } from "@/components/ui/EmptyState";
import { Settings } from "lucide-react";

export default function Configuracion() {
  return (
    <EmptyState
      icon={Settings}
      title="Configuración"
      description="Administre las preferencias del sistema, equipos, canales y parámetros operativos."
      actionLabel="Abrir configuración"
      onAction={() => {}}
    />
  );
}
