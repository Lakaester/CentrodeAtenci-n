import { facturacionCasosRepository, type CasoRow } from "../repositories/facturacion.casos.repository";
import { DomainError } from "../core/errors/types";
import ExcelJS from "exceljs";

export const ESTADOS_OPERATIVOS = [
  "PENDIENTE",
  "ASIGNADO",
  "EN_DIAGNOSTICO",
  "EN_SOLUCION",
  "PAUSADO",
  "RESUELTO",
  "NO_RESUELTO",
  "DERIVADO",
  "CANCELADO",
] as const;

export type EstadoOperativo = typeof ESTADOS_OPERATIVOS[number];

/**
 * Máquina de estados operativos del caso.
 * RESUELTO no regresa automáticamente a PENDIENTE (requiere acción explícita).
 */
const TRANSICIONES: Record<string, string[]> = {
  PENDIENTE: ["ASIGNADO"],
  ASIGNADO: ["EN_DIAGNOSTICO", "PAUSADO", "CANCELADO"],
  EN_DIAGNOSTICO: ["EN_SOLUCION", "PAUSADO", "DERIVADO", "CANCELADO"],
  EN_SOLUCION: ["PAUSADO", "DERIVADO", "NO_RESUELTO", "RESUELTO"],
  PAUSADO: ["EN_DIAGNOSTICO", "EN_SOLUCION", "CANCELADO"],
  NO_RESUELTO: ["ASIGNADO", "EN_DIAGNOSTICO"],
  DERIVADO: ["EN_DIAGNOSTICO", "RESUELTO", "NO_RESUELTO"],
  RESUELTO: [],
  CANCELADO: [],
};

function esEstadoValido(estado: string): boolean {
  return (ESTADOS_OPERATIVOS as readonly string[]).includes(estado);
}

export const facturacionCasosService = {
  async crearOConsultarPorDominio(dominio: string, datos?: { ruc?: string | null; proveedor?: string | null; unidadNegocioId?: string | null; clienteNombre?: string | null }, usuario: string | null = null) {
    const caso = await facturacionCasosRepository.crearOConsultarPorDominio(dominio, datos);
    // Si el caso no existía, se acaba de crear (PENDIENTE): auditar.
    const existe = await facturacionCasosRepository.porId(caso.id);
    if (existe?.created_at.getTime() >= Date.now() - 2000) {
      await facturacionCasosRepository.registrarAuditoria({
        entidad: "caso", entidadId: caso.id, accion: "CASO_CREADO",
        asesor: usuario, detalle: `Caso creado para dominio ${caso.dominio} (PENDIENTE)`,
      });
    }
    return caso;
  },

  async obtenerCaso(id: string) {
    const caso = await facturacionCasosRepository.porId(id);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    const [snapshots, asignaciones, vinculados, auditoria] = await Promise.all([
      facturacionCasosRepository.snapshots(id),
      facturacionCasosRepository.asignaciones(id),
      facturacionCasosRepository.intervencionesDelCaso(id),
      facturacionCasosRepository.auditoriaDeCaso(id),
    ]);
    return { caso, snapshots, asignaciones, intervenciones: vinculados, auditoria };
  },

  async obtenerCasoPorDominio(dominio: string) {
    // Crea el caso si no existe (PENDIENTE) — persistencia del dominio en COPE.
    const caso = await facturacionCasosRepository.crearOConsultarPorDominio(dominio);
    return this.obtenerCaso(caso.id);
  },

  async listarCasos(filtros: Record<string, string | undefined>, limite = 200) {
    return facturacionCasosRepository.listar({
      desde: filtros.desde,
      hasta: filtros.hasta,
      asesor: filtros.asesor,
      proveedor: filtros.proveedor,
      dominio: filtros.dominio,
      ruc: filtros.ruc,
      estado: filtros.estado,
      categoria: filtros.categoria,
      subcategoria: filtros.subcategoria,
      resultado: filtros.resultado,
    }, limite);
  },

  /**
   * Asignar (o reasignar) asesor a un caso.
   * PENDIENTE → ASIGNADO automáticamente en la primera asignación.
   * Las reasignaciones quedan como historial (no se borran).
   */
  async asignarCaso(casoId: string, asesor: string, usuario: string | null) {
    if (!asesor || !asesor.trim()) throw new DomainError("Asesor requerido", "ASESOR_REQUERIDO");
    const caso = await facturacionCasosRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");

    const anteriorAsesor = caso.asesor_actual;
    const esReasignacion = anteriorAsesor != null && anteriorAsesor !== asesor;

    // Primera asignación desde PENDIENTE → ASIGNADO
    let nuevoEstado = caso.estado_operativo;
    if (caso.estado_operativo === "PENDIENTE") nuevoEstado = "ASIGNADO";

    await facturacionCasosRepository.actualizarCaso(casoId, {
      asesor_actual: asesor.trim(),
      fecha_asignacion: new Date(),
      asignado_por: usuario ?? null,
    });
    if (nuevoEstado !== caso.estado_operativo) {
      await facturacionCasosRepository.actualizarCaso(casoId, { estado_operativo: nuevoEstado });
    }
    await facturacionCasosRepository.registrarAsignacion(casoId, asesor.trim(), usuario);

    await facturacionCasosRepository.registrarAuditoria({
      entidad: "caso", entidadId: casoId,
      accion: esReasignacion ? "CASO_REASIGNADO" : "CASO_ASIGNADO",
      asesor: usuario,
      anterior: anteriorAsesor,
      nuevo: asesor.trim(),
      detalle: esReasignacion
        ? `Reasignado de ${anteriorAsesor} a ${asesor.trim()}`
        : `Asignado a ${asesor.trim()}`,
    });

    return facturacionCasosRepository.porId(casoId);
  },

  /** Cambiar estado operativo respetando la máquina de estados. */
  async cambiarEstadoOperativo(casoId: string, estado: string, usuario: string | null) {
    if (!esEstadoValido(estado)) {
      throw new DomainError(`Estado operativo inválido: ${estado}`, "ESTADO_INVALIDO");
    }
    const caso = await facturacionCasosRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");

    if (caso.estado_operativo === estado) {
      return caso;
    }

    // RESUELTO no puede volver a PENDIENTE; y solo se permite manualmente con confirmación.
    const permitidas = TRANSICIONES[caso.estado_operativo] ?? [];
    if (!permitidas.includes(estado)) {
      throw new DomainError(
        `Transición no permitida: ${caso.estado_operativo} → ${estado}`,
        "TRANSICION_NO_PERMITIDA",
      );
    }

    await facturacionCasosRepository.registrarAuditoria({
      entidad: "caso", entidadId: casoId, accion: "ESTADO_CAMBIADO",
      asesor: usuario, anterior: caso.estado_operativo, nuevo: estado,
      detalle: `${caso.estado_operativo} → ${estado}`,
    });
    return facturacionCasosRepository.actualizarCaso(casoId, { estado_operativo: estado });
  },

  /**
   * Registrar snapshot diario y actualizar los datos del caso.
   * Reglas:
   *  - UPSERT por (caso, día): no borra días anteriores.
   *  - Los valores iniciales solo se fijan la primera vez (no se sobrescriben).
   *  - Si total = 0 → el caso puede pasar a RESUELTO (confirmación de resolución).
   *  - Si total > 0 → el caso permanece operativo (nunca RESUELTO por snapshot con pendientes).
   */
  async registrarSnapshot(datos: { casoId: string; facturas: number | null; boletas: number | null; total?: number | null; origen: string; usuario: string | null }) {
    const caso = await facturacionCasosRepository.porId(datos.casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");

    const total = datos.total ?? ((datos.facturas ?? 0) + (datos.boletas ?? 0));
    const snapshot = await facturacionCasosRepository.registrarSnapshot({
      casoId: datos.casoId,
      facturas: datos.facturas,
      boletas: datos.boletas,
      total,
      origen: datos.origen,
      usuario: datos.usuario,
    });

    // Actualizar datos del caso.
    const patch: Record<string, unknown> = {
      ultimas_facturas: datos.facturas,
      ultimas_boletas: datos.boletas,
      ultimo_total: total,
      ultima_deteccion: new Date(),
    };
    // Valores iniciales: solo la primera vez (facturas_iniciales nulo).
    if (caso.facturas_iniciales == null) {
      patch.facturas_iniciales = datos.facturas;
      patch.boletas_iniciales = datos.boletas;
      patch.total_inicial = total;
      patch.primera_deteccion = new Date();
    }
    await facturacionCasosRepository.actualizarCaso(datos.casoId, patch);

    await facturacionCasosRepository.registrarAuditoria({
      entidad: "caso", entidadId: datos.casoId, accion: "SNAPSHOT_REGISTRADO",
      asesor: datos.usuario, detalle: `Snapshot ${datos.origen}: FV=${datos.facturas ?? 0} BV=${datos.boletas ?? 0} total=${total}`,
    });

    // Regla de resolución: solo con total = 0 confirmado.
    let estadoNuevo = caso.estado_operativo;
    if (total === 0 && caso.estado_operativo !== "RESUELTO") {
      estadoNuevo = "RESUELTO";
      await facturacionCasosRepository.registrarAuditoria({
        entidad: "caso", entidadId: datos.casoId, accion: "ESTADO_CAMBIADO",
        asesor: datos.usuario, anterior: caso.estado_operativo, nuevo: "RESUELTO",
        detalle: "Resolución confirmada por snapshot (total = 0)",
      });
      await facturacionCasosRepository.actualizarCaso(datos.casoId, { estado_operativo: "RESUELTO" });
    }

    return { snapshot, estadoOperativo: estadoNuevo };
  },

  async obtenerSnapshots(casoId: string) {
    const caso = await facturacionCasosRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    return facturacionCasosRepository.snapshots(casoId);
  },

  /** Historial global por dominio/filtros: responde aunque el dominio ya no esté en el BI. */
  async obtenerHistorialGlobal(filtros: Record<string, string | undefined>, limite = 200) {
    const casos = await this.listarCasos(filtros, limite);
    return Promise.all(casos.map((c) => facturacionCasosRepository.porId(c.id)));
  },

  async cambiarCategoria(casoId: string, categoriaId: string | null, subcategoriaId: string | null, usuario: string | null) {
    const caso = await facturacionCasosRepository.porId(casoId);
    if (!caso) throw new DomainError("Caso no encontrado", "NO_ENCONTRADO");
    if (categoriaId) {
      const cats = await facturacionCasosRepository.listarCategorias();
      if (!cats.some((c) => c.id === categoriaId)) throw new DomainError("Categoría inválida", "CATEGORIA_INVALIDA");
    }
    if (subcategoriaId) {
      const subs = await facturacionCasosRepository.listarSubcategoriasDeCategoria(categoriaId ?? "");
      if (!subs.some((s) => s.id === subcategoriaId)) throw new DomainError("Subcategoría inválida", "SUBCATEGORIA_INVALIDA");
    }
    if (caso.categoria_id !== categoriaId) {
      await facturacionCasosRepository.registrarAuditoria({
        entidad: "caso", entidadId: casoId, accion: "CATEGORIA_CAMBIADA",
        asesor: usuario, anterior: caso.categoria_id, nuevo: categoriaId,
      });
    }
    if (caso.subcategoria_id !== subcategoriaId) {
      await facturacionCasosRepository.registrarAuditoria({
        entidad: "caso", entidadId: casoId, accion: "SUBCATEGORIA_CAMBIADA",
        asesor: usuario, anterior: caso.subcategoria_id, nuevo: subcategoriaId,
      });
    }
    return facturacionCasosRepository.actualizarCaso(casoId, { categoria_id: categoriaId, subcategoria_id: subcategoriaId });
  },

  /** Exporta el histórico de casos a Excel respetando los filtros activos. */
  async exportarExcel(filtros: Record<string, string | undefined>, usuario: string | null) {
    const casos = await this.listarCasos(filtros, 1000);

    const wb = new ExcelJS.Workbook();
    wb.creator = "COPE";
    const ws = wb.addWorksheet("Casos");

    ws.columns = [
      { header: "Dominio", key: "dominio", width: 30 },
      { header: "Cliente", key: "cliente", width: 20 },
      { header: "RUC", key: "ruc", width: 14 },
      { header: "Proveedor", key: "proveedor", width: 18 },
      { header: "Estado", key: "estado", width: 18 },
      { header: "Categoría", key: "categoria", width: 22 },
      { header: "Subcategoría", key: "subcategoria", width: 22 },
      { header: "Facturas iniciales", key: "facturasIniciales", width: 14 },
      { header: "Boletas iniciales", key: "boletasIniciales", width: 14 },
      { header: "Total inicial", key: "totalInicial", width: 12 },
      { header: "Facturas últimas", key: "ultimasFacturas", width: 14 },
      { header: "Boletas últimas", key: "ultimasBoletas", width: 14 },
      { header: "Total actual", key: "ultimoTotal", width: 12 },
      { header: "Asesor", key: "asesor", width: 16 },
      { header: "Fecha asignación", key: "fechaAsignacion", width: 16 },
      { header: "Primera detección", key: "primeraDeteccion", width: 16 },
      { header: "Última detección", key: "ultimaDeteccion", width: 16 },
      { header: "Última gestión", key: "ultimaGestion", width: 16 },
    ];
    ws.getRow(1).font = { bold: true };

    const fmtF = (d: Date | string | null | undefined) => {
      if (!d) return "";
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
    };

    for (const c of casos) {
      ws.addRow({
        dominio: c.dominio,
        cliente: c.cliente_nombre ?? "",
        ruc: c.ruc ?? "",
        proveedor: c.proveedor ?? "",
        estado: c.estado_operativo,
        categoria: c.categoria_nombre ?? "",
        subcategoria: c.subcategoria_nombre ?? "",
        facturasIniciales: c.facturas_iniciales ?? "",
        boletasIniciales: c.boletas_iniciales ?? "",
        totalInicial: c.total_inicial ?? "",
        ultimasFacturas: c.ultimas_facturas ?? "",
        ultimasBoletas: c.ultimas_boletas ?? "",
        ultimoTotal: c.ultimo_total ?? "",
        asesor: c.asesor_actual ?? "",
        fechaAsignacion: fmtF(c.fecha_asignacion),
        primeraDeteccion: fmtF(c.primera_deteccion),
        ultimaDeteccion: fmtF(c.ultima_deteccion),
        ultimaGestion: "",
      });
    }

    const buffer = await wb.xlsx.writeBuffer();

    await facturacionCasosRepository.registrarAuditoria({
      entidad: "exportacion", entidadId: null, accion: "EXPORTACION_EXCEL",
      asesor: usuario,
      detalle: `Exportación de ${casos.length} casos`,
      nuevo: JSON.stringify(filtros),
    });

    const nombre = `ControlFacturacion_${new Date().toISOString().slice(0, 10)}.xlsx`;
    return { buffer: Buffer.from(buffer), nombre, total: casos.length };
  },
};
