import type { IAtencionRepository } from "../../contracts/atencion/IAtencionRepository";
import { AtencionMapper, type AtencionResponse } from "../../mappers/AtencionMapper";
import type { CreateAtencionDTO } from "../../dto/AtencionDTOs";

export class CreateAtencionUseCase {
  constructor(private repo: IAtencionRepository) {}

  async execute(dto: CreateAtencionDTO): Promise<AtencionResponse> {
    const id = `ATC-${Date.now()}`;
    const data = AtencionMapper.toDomain(dto, id);
    const saved = await this.repo.save(data);
    return AtencionMapper.toResponse(saved);
  }
}
