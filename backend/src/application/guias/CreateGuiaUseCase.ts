import type { GuiaResolucion } from "../../domain/guias/types";
import type { CreateGuiaDTO } from "../../dto/GuiaDTOs";
import { GuiaMapper } from "../../mappers/GuiaMapper";

export class CreateGuiaUseCase {
  private guias: Map<string, GuiaResolucion>;

  constructor(guias: Map<string, GuiaResolucion>) {
    this.guias = guias;
  }

  execute(dto: CreateGuiaDTO): GuiaResolucion {
    const guia = GuiaMapper.toDomain(dto);
    this.guias.set(guia.id, guia);
    return guia;
  }
}
