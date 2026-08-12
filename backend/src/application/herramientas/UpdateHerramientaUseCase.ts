import type { Herramienta } from "../../domain/herramientas/types";
import type { UpdateHerramientaDTO } from "../../dto/HerramientaDTOs";
import { HerramientaMapper } from "../../mappers/HerramientaMapper";

export class UpdateHerramientaUseCase {
  constructor(private herramientas: Map<string, Herramienta>) {}
  execute(id: string, dto: UpdateHerramientaDTO): Herramienta | null {
    const h = this.herramientas.get(id);
    if (!h) return null;
    const actualizada = HerramientaMapper.applyUpdate(h, dto);
    this.herramientas.set(id, actualizada);
    return actualizada;
  }
}
