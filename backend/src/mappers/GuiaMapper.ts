import type { GuiaResolucion } from "../domain/guias/types";
import type { CreateGuiaDTO, UpdateGuiaDTO } from "../dto/GuiaDTOs";

export class GuiaMapper {
  static toDomain(dto: CreateGuiaDTO): GuiaResolucion {
    const ahora = new Date().toISOString();
    return {
      id: `GUIA-${Date.now()}`,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      tipoAtencion: dto.tipoAtencion,
      responsable: dto.responsable,
      etiquetas: dto.etiquetas,
      objetivo: dto.objetivo,
      informacionNecesaria: dto.informacionNecesaria,
      posiblesCausas: dto.posiblesCausas,
      procesoRecomendado: dto.procesoRecomendado,
      herramientas: dto.herramientas,
      buenasPracticas: dto.buenasPracticas,
      criteriosResolucion: dto.criteriosResolucion,
      documentos: dto.documentos,
      workspaces: dto.workspaces,
      estado: "borrador",
      version: "1.0",
      versiones: [{ version: "1.0", estado: "borrador", creadoEn: ahora, creadoPor: dto.responsable, cambios: "Versión inicial" }],
      createdAt: ahora,
      updatedAt: ahora,
    };
  }

  static applyUpdate(guia: GuiaResolucion, dto: UpdateGuiaDTO): GuiaResolucion {
    const ahora = new Date().toISOString();
    const cambios = dto.cambios ?? "Actualización";

    const nuevaVersion = (() => {
      if (dto.estado === "publicada" && guia.estado !== "publicada") {
        const parts = guia.version.split(".").map(Number);
        return `${parts[0] + 1}.0`;
      }
      if (Object.keys(dto).length > 1) {
        const parts = guia.version.split(".").map(Number);
        return `${parts[0]}.${parts[1] + 1}`;
      }
      return guia.version;
    })();

    return {
      ...guia,
      ...(dto.titulo !== undefined && { titulo: dto.titulo }),
      ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
      ...(dto.tipoAtencion !== undefined && { tipoAtencion: dto.tipoAtencion }),
      ...(dto.responsable !== undefined && { responsable: dto.responsable }),
      ...(dto.etiquetas !== undefined && { etiquetas: dto.etiquetas }),
      ...(dto.objetivo !== undefined && { objetivo: dto.objetivo }),
      ...(dto.informacionNecesaria !== undefined && { informacionNecesaria: dto.informacionNecesaria }),
      ...(dto.posiblesCausas !== undefined && { posiblesCausas: dto.posiblesCausas }),
      ...(dto.procesoRecomendado !== undefined && { procesoRecomendado: dto.procesoRecomendado }),
      ...(dto.herramientas !== undefined && { herramientas: dto.herramientas }),
      ...(dto.buenasPracticas !== undefined && { buenasPracticas: dto.buenasPracticas }),
      ...(dto.criteriosResolucion !== undefined && { criteriosResolucion: dto.criteriosResolucion }),
      ...(dto.estado !== undefined && { estado: dto.estado, ...(dto.estado === "publicada" && { publishedAt: ahora }) }),
      ...(dto.cambios !== undefined && {}),
      version: nuevaVersion,
      updatedAt: ahora,
      versiones: [
        ...(nuevaVersion !== guia.version ? [{ version: nuevaVersion, estado: dto.estado ?? guia.estado, creadoEn: ahora, creadoPor: dto.responsable ?? guia.responsable, cambios }] : []),
        ...guia.versiones,
      ],
    };
  }

  static toResponse(guia: GuiaResolucion) {
    return guia;
  }
}
