import type { Herramienta } from "../../domain/herramientas/types";
import type { CreateHerramientaDTO } from "../../dto/HerramientaDTOs";
import { HerramientaMapper } from "../../mappers/HerramientaMapper";

export class CreateHerramientaUseCase {
  constructor(private herramientas: Map<string, Herramienta>) {}
  execute(dto: CreateHerramientaDTO): Herramienta {
    const h = HerramientaMapper.toDomain(dto);
    this.herramientas.set(h.id, h);
    return h;
  }
}
