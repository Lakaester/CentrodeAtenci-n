import { useState } from "react";
import type { CustomerWorkspaceData, WorkspaceAction } from "../types";

const MOCK_DATA: CustomerWorkspaceData = {
  dominio: "demo.restaurant.pe",
  empresa: "Restaurant.pe Demo",
  producto: "Printer Pro",
  pais: "Perú",
  estado: "activo",
  ultimaConexion: new Date().toLocaleString("es-PE"),
};

export function useCustomerWorkspace() {
  const [data] = useState<CustomerWorkspaceData>(MOCK_DATA);

  const handleAction = (action: WorkspaceAction) => {
    if (action.action === "copy-domain") {
      navigator.clipboard.writeText(data.dominio);
    } else {
      console.log(`[Workspace] Acción: ${action.provider}/${action.action}`);
    }
  };

  return { data, handleAction };
}
