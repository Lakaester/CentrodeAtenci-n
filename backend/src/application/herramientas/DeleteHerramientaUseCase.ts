import type { Herramienta } from "../../domain/herramientas/types";

export class DeleteHerramientaUseCase {
  constructor(private herramientas: Map<string, Herramienta>) {}
  execute(id: string): boolean {
    return this.herramientas.delete(id);
  }
}
