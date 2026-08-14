import { facturacionConfigRepository, type ConfigRow } from "../repositories/facturacion.config.repository";
import { DomainError } from "../core/errors/types";

export const facturacionConfigService = {
  async listarEstados(): Promise<ConfigRow[]> {
    return facturacionConfigRepository.listarEstados();
  },

  async listarSubcategorias(): Promise<ConfigRow[]> {
    return facturacionConfigRepository.listarSubcategorias();
  },

  async crearEstado(nombre: string): Promise<ConfigRow> {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) throw new DomainError("El nombre es obligatorio", "NOMBRE_REQUERIDO");
    const existentes = await facturacionConfigRepository.listarEstados();
    if (existentes.some((e) => e.nombre.toLowerCase() === nombreLimpio.toLowerCase())) {
      throw new DomainError("Ya existe un estado con ese nombre", "DUPLICADO");
    }
    return facturacionConfigRepository.crearEstado(nombreLimpio);
  },

  async crearSubcategoria(nombre: string): Promise<ConfigRow> {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) throw new DomainError("El nombre es obligatorio", "NOMBRE_REQUERIDO");
    const existentes = await facturacionConfigRepository.listarSubcategorias();
    if (existentes.some((s) => s.nombre.toLowerCase() === nombreLimpio.toLowerCase())) {
      throw new DomainError("Ya existe una subcategoría con ese nombre", "DUPLICADO");
    }
    return facturacionConfigRepository.crearSubcategoria(nombreLimpio);
  },

  async actualizarEstado(id: string, patch: { nombre?: string; activo?: boolean; orden?: number }) {
    if (patch.nombre !== undefined) {
      const limpio = patch.nombre.trim();
      if (!limpio) throw new DomainError("El nombre es obligatorio", "NOMBRE_REQUERIDO");
      const existentes = await facturacionConfigRepository.listarEstados();
      if (existentes.some((e) => e.id !== id && e.nombre.toLowerCase() === limpio.toLowerCase())) {
        throw new DomainError("Ya existe un estado con ese nombre", "DUPLICADO");
      }
      patch.nombre = limpio;
    }
    const actualizado = await facturacionConfigRepository.actualizarEstado(id, patch);
    if (!actualizado) throw new DomainError("Estado no encontrado", "NO_ENCONTRADO");
    return actualizado;
  },

  async actualizarSubcategoria(id: string, patch: { nombre?: string; activo?: boolean; orden?: number }) {
    if (patch.nombre !== undefined) {
      const limpio = patch.nombre.trim();
      if (!limpio) throw new DomainError("El nombre es obligatorio", "NOMBRE_REQUERIDO");
      const existentes = await facturacionConfigRepository.listarSubcategorias();
      if (existentes.some((s) => s.id !== id && s.nombre.toLowerCase() === limpio.toLowerCase())) {
        throw new DomainError("Ya existe una subcategoría con ese nombre", "DUPLICADO");
      }
      patch.nombre = limpio;
    }
    const actualizado = await facturacionConfigRepository.actualizarSubcategoria(id, patch);
    if (!actualizado) throw new DomainError("Subcategoría no encontrada", "NO_ENCONTRADO");
    return actualizado;
  },

  async desactivarEstado(id: string): Promise<ConfigRow> {
    return this.actualizarEstado(id, { activo: false });
  },

  async desactivarSubcategoria(id: string): Promise<ConfigRow> {
    return this.actualizarSubcategoria(id, { activo: false });
  },
};
