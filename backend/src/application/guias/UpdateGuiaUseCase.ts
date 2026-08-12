import type { GuiaResolucion } from "../../domain/guias/types";
import type { UpdateGuiaDTO } from "../../dto/GuiaDTOs";
import { GuiaMapper } from "../../mappers/GuiaMapper";

export class UpdateGuiaUseCase {
  constructor(private guias: Map<string, GuiaResolucion>) {}

  execute(id: string, dto: UpdateGuiaDTO): GuiaResolucion | null {
    const guia = this.guias.get(id);
    if (!guia) return null;
    const actualizada = GuiaMapper.applyUpdate(guia, dto);
    this.guias.set(id, actualizada);
    return actualizada;
  }
}
