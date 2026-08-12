import type { Herramienta } from "../../domain/herramientas/types";

export class GetHerramientaUseCase {
  constructor(private herramientas: Map<string, Herramienta>) {}
  execute(id: string): Herramienta | null {
    return this.herramientas.get(id) ?? null;
  }
}
