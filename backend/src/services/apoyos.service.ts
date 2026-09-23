import {
  apoyosRepository,
  type CrearApoyoInput,
  type ActualizarApoyoInput,
} from "../repositories/apoyos.repository";
import { DomainError } from "../core/errors/types";

function validarCrear(input: CrearApoyoInput) {
  if (!input.asesorId?.trim()) throw new DomainError("El asesor es obligatorio", "ASESOR_REQUERIDO");
  if (!input.fecha?.trim()) throw new DomainError("La fecha es obligatoria", "FECHA_REQUERIDA");
  if (!input.categoria?.trim()) throw new DomainError("La categoría es obligatoria", "CATEGORIA_REQUERIDA");
  if (!input.area?.trim()) throw new DomainError("El área es obligatoria", "AREA_REQUERIDA");
}

function parseHora(h: string | Date | null): { h: number; m: number } | null {
  if (!h) return null;
  const s = typeof h === "string" ? h : h.toTimeString().slice(0, 5);
  const parts = s.split(":");
  if (parts.length < 2) return null;
  return { h: parseInt(parts[0], 10), m: parseInt(parts[1], 10) };
}

export const apoyosService = {
  async listar(filtros?: Parameters<typeof apoyosRepository.listar>[0]) {
    return apoyosRepository.listar(filtros);
  },

  async porId(id: string) {
    return apoyosRepository.porId(id);
  },

  async crear(input: CrearApoyoInput, createdBy: string | null) {
    validarCrear(input);
    // Ignorar horaFin y estado del frontend. Siempre crear como PENDIENTE sin hora_fin.
    const { horaFin: _, estado: __, ...rest } = input;
    return apoyosRepository.crear({ ...rest, horaFin: null, estado: "PENDIENTE" }, createdBy);
  },

  async actualizar(id: string, input: ActualizarApoyoInput, updatedBy: string | null) {
    const existente = await apoyosRepository.porId(id);
    if (!existente) throw new DomainError("Apoyo no encontrado", "NO_ENCONTRADO");

    // Determinar hora_fin resultante
    const horaFinInput = input.horaFin !== undefined ? (input.horaFin || null) : undefined;
    const horaFinFinal = horaFinInput !== undefined ? horaFinInput : existente.hora_fin;

    // Validar hora_fin > hora_inicio si se está colocando hora_fin
    if (horaFinFinal && existente.hora_inicio) {
      const hi = parseHora(existente.hora_inicio);
      const hf = parseHora(horaFinFinal);
      if (hi && hf) {
        const diff = (hf.h * 60 + hf.m) - (hi.h * 60 + hi.m);
        if (diff <= 0) {
          throw new DomainError(
            "La hora de fin debe ser posterior a la hora de inicio",
            "HORA_FIN_INVALIDA"
          );
        }
      }
    }

    // Determinar estado final
    let nuevoEstado = existente.estado;

    if (horaFinFinal && existente.estado !== "CERRADO") {
      // Cierre automático: si se coloca hora_fin y no está cerrado → CERRADO
      nuevoEstado = "CERRADO";
    }

    return apoyosRepository.actualizar(id, {
      ...input,
      estado: nuevoEstado,
      cerrar: nuevoEstado === "CERRADO" && existente.estado !== "CERRADO",
    }, updatedBy);
  },

  async cerrar(id: string, closedBy: string | null) {
    const existente = await apoyosRepository.porId(id);
    if (!existente) throw new DomainError("Apoyo no encontrado", "NO_ENCONTRADO");
    if (existente.estado === "CERRADO") {
      throw new DomainError("El apoyo ya está cerrado", "YA_CERRADO");
    }
    return apoyosRepository.cerrar(id, closedBy);
  },

  async eliminar(id: string) {
    const existente = await apoyosRepository.porId(id);
    if (!existente) throw new DomainError("Apoyo no encontrado", "NO_ENCONTRADO");
    return apoyosRepository.eliminar(id);
  },

  async kpis() {
    const porEstado = await apoyosRepository.contarPorEstado();
    const total = Object.values(porEstado).reduce((sum, n) => sum + n, 0);
    return {
      total,
      pendientes: porEstado["PENDIENTE"] ?? 0,
      activos: porEstado["ACTIVO"] ?? 0,
      cerrados: porEstado["CERRADO"] ?? 0,
    };
  },

  async listarAreas() {
    return apoyosRepository.listarAreas();
  },

  async listarAsesores() {
    return apoyosRepository.listarAsesores();
  },

  async listarCategoriasFun() {
    return apoyosRepository.listarCategoriasFun();
  },

  async listarSubcategoriasDeCategoria(categoria: string) {
    return apoyosRepository.listarSubcategoriasDeCategoria(categoria);
  },
};
