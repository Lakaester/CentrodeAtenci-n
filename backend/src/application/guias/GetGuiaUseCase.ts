import type { GuiaResolucion } from "../../domain/guias/types";

export class GetGuiaUseCase {
  constructor(private guias: Map<string, GuiaResolucion>) {}

  execute(id: string): GuiaResolucion | null {
    return this.guias.get(id) ?? null;
  }
}
