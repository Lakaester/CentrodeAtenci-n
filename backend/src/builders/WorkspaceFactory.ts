import { WorkspaceRegistry } from "./WorkspaceRegistry";
import { FacturacionWorkspaceBuilder } from "./FacturacionWorkspaceBuilder";
import { IntegracionesWorkspaceBuilder } from "./IntegracionesWorkspaceBuilder";
import type { Ticket } from "../domain/tickets/Ticket";
import type { WorkspaceEspecializadoData } from "./WorkspaceContext";

const MATCH_RULES: { keyword: string; tipo: string }[] = [
  { keyword: "facturación", tipo: "Facturación Electrónica" },
  { keyword: "integración", tipo: "Integraciones" },
  { keyword: "integraciones", tipo: "Integraciones" },
  { keyword: "pedidosya", tipo: "Integraciones" },
  { keyword: "rappi", tipo: "Integraciones" },
  { keyword: "uber", tipo: "Integraciones" },
  { keyword: "didi", tipo: "Integraciones" },
];

export class WorkspaceFactory {
  static inicializado = false;

  static inicializar(): void {
    if (WorkspaceFactory.inicializado) return;
    WorkspaceRegistry.registrar(new FacturacionWorkspaceBuilder());
    WorkspaceRegistry.registrar(new IntegracionesWorkspaceBuilder());
    WorkspaceFactory.inicializado = true;
  }

  static async construir(ticket: Ticket): Promise<WorkspaceEspecializadoData | null> {
    WorkspaceFactory.inicializar();
    const categoria = (ticket.categoriaFinal ?? ticket.categoriaSugerida ?? "").toLowerCase();

    for (const rule of MATCH_RULES) {
      if (categoria.includes(rule.keyword)) {
        const builder = WorkspaceRegistry.obtener(rule.tipo);
        if (builder) return builder.construir(ticket);
      }
    }

    const builder = WorkspaceRegistry.obtener(categoria);
    if (builder) return builder.construir(ticket);

    return null;
  }
}
