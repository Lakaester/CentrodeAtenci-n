import type { IAtencionRepository } from "../../contracts/atencion/IAtencionRepository";
import { AtencionMapper, type AtencionResponse } from "../../mappers/AtencionMapper";
import type { FinalizarAtencionDTO } from "../../dto/AtencionDTOs";
import { Atencion } from "../../domain/atencion/Atencion";
import { ResultadoAtencion } from "../../domain/atencion/Resultado";

export class FinalizarAtencionUseCase {
  constructor(private repo: IAtencionRepository) {}

  async execute(atencionId: string, dto: FinalizarAtencionDTO): Promise<AtencionResponse | null> {
    const data = await this.repo.findById(atencionId);
    if (!data) return null;

    const atencion = new Atencion(data);
    const resultado = new ResultadoAtencion({
      tipo: dto.resultado,
      resumen: dto.resumen,
      fecha: new Date().toISOString(),
      herramientasUtilizadas: dto.herramientasUtilizadas ?? [],
      lecciones: dto.lecciones ?? [],
      accionRealizada: dto.accionRealizada,
      observaciones: dto.observaciones,
    });

    atencion.setResultado(resultado);
    await this.repo.save(atencion.toJSON());
    return AtencionMapper.toResponse(atencion.toJSON());
  }
}
