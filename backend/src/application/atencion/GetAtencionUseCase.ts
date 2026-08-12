import type { IAtencionRepository } from "../../contracts/atencion/IAtencionRepository";
import { AtencionMapper, type AtencionResponse } from "../../mappers/AtencionMapper";

export class GetAtencionUseCase {
  constructor(private repo: IAtencionRepository) {}

  async execute(id: string): Promise<AtencionResponse | null> {
    const data = await this.repo.findById(id);
    if (!data) return null;
    return AtencionMapper.toResponse(data);
  }
}
