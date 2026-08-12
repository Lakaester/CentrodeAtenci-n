import type { IAtencionRepository, FiltrosAtencion } from "../../contracts/atencion/IAtencionRepository";
import { AtencionMapper, type AtencionResponse } from "../../mappers/AtencionMapper";

export class ListAtencionesUseCase {
  constructor(private repo: IAtencionRepository) {}

  async execute(filtros?: FiltrosAtencion): Promise<{ items: AtencionResponse[]; total: number }> {
    const result = await this.repo.findAll(filtros);
    return {
      items: result.items.map((d) => AtencionMapper.toResponse(d)),
      total: result.total,
    };
  }
}
