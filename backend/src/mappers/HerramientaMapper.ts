import type { Herramienta } from "../domain/herramientas/types";
import type { CreateHerramientaDTO, UpdateHerramientaDTO } from "../dto/HerramientaDTOs";

export class HerramientaMapper {
  static toDomain(dto: CreateHerramientaDTO): Herramienta {
    const ahora = new Date().toISOString();
    return {
      id: `HERR-${Date.now()}`,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      icono: dto.icono,
      color: dto.color,
      categoria: dto.categoria,
      urlBase: dto.urlBase,
      parametros: dto.parametros,
      tipo: dto.tipo,
      estado: dto.estado,
      orden: dto.orden,
      visible: dto.visible,
      tiposAtencion: dto.tiposAtencion,
      responsable: dto.responsable,
      createdAt: ahora,
      updatedAt: ahora,
    };
  }

  static applyUpdate(h: Herramienta, dto: UpdateHerramientaDTO): Herramienta {
    return {
      ...h,
      ...(dto.nombre !== undefined && { nombre: dto.nombre }),
      ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
      ...(dto.icono !== undefined && { icono: dto.icono }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.categoria !== undefined && { categoria: dto.categoria }),
      ...(dto.urlBase !== undefined && { urlBase: dto.urlBase }),
      ...(dto.parametros !== undefined && { parametros: dto.parametros }),
      ...(dto.tipo !== undefined && { tipo: dto.tipo }),
      ...(dto.estado !== undefined && { estado: dto.estado }),
      ...(dto.orden !== undefined && { orden: dto.orden }),
      ...(dto.visible !== undefined && { visible: dto.visible }),
      ...(dto.tiposAtencion !== undefined && { tiposAtencion: dto.tiposAtencion }),
      ...(dto.responsable !== undefined && { responsable: dto.responsable }),
      updatedAt: new Date().toISOString(),
    };
  }
}
