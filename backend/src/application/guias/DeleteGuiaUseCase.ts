import type { GuiaResolucion } from "../../domain/guias/types";

export class DeleteGuiaUseCase {
  constructor(private guias: Map<string, GuiaResolucion>) {}

  execute(id: string): boolean {
    const guia = this.guias.get(id);
    if (!guia) return false;
    if (guia.estado === "publicada") return false;
    return this.guias.delete(id);
  }
}
