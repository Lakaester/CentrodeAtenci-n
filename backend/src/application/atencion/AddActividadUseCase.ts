import type { IAtencionRepository } from "../../contracts/atencion/IAtencionRepository";
import { AtencionMapper, type AtencionResponse } from "../../mappers/AtencionMapper";
import type { AddActividadDTO } from "../../dto/AtencionDTOs";
import { Atencion } from "../../domain/atencion/Atencion";
import { Actividad } from "../../domain/atencion/Actividad";

export class AddActividadUseCase {
  constructor(private repo: IAtencionRepository) {}

  async execute(atencionId: string, dto: AddActividadDTO): Promise<AtencionResponse | null> {
    const data = await this.repo.findById(atencionId);
    if (!data) return null;

    const atencion = new Atencion(data);
    const actividad = new Actividad({
      id: `act_${Date.now()}`,
      tipo: dto.tipo,
      subtipo: dto.subtipo as any,
      fecha: new Date().toISOString(),
      autor: dto.autor,
      autorId: dto.autorId,
      descripcion: dto.descripcion,
      origen: dto.origen,
      resultado: dto.resultado ?? "ok",
      observaciones: dto.observaciones,
      metadata: dto.metadata,
    });

    atencion.agregarActividad(actividad);
    await this.repo.save(atencion.toJSON());
    return AtencionMapper.toResponse(atencion.toJSON());
  }
}
