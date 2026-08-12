import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

export default function Clientes() {
  return (
    <EmptyState
      icon={Users}
      title="Clientes"
      description="Gestione la base de clientes, historial de contactos y perfiles desde este módulo."
      actionLabel="Explorar clientes"
      onAction={() => {}}
    />
  );
}
