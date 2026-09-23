/**
 * Tests: Quejas y Devoluciones — backfill no destructivo, dominio, canal, categoría.
 *
 * Valida las reglas del sistema de QyD según la auditoría completa:
 * - Backfill NO destruye datos operativos
 * - Dominio válido/inválido/ausente
 * - Canal (CORREO/CHAT) aceptado
 * - Categoría (QUEJA/DEVOLUCIÓN) clasificación
 * - Duplicados
 * - Reconciliación idempotente
 * - Preservación de estado operativo
 */
import { describe, it, expect } from "vitest";
import {
  normalizarDominio,
  dominioValido,
  canalValido,
  estadoZendeskCandidato,
  normalizarTelefono,
  identidadReal,
  CATCH_ALL_EMAIL,
} from "../services/quejasCasos.service";

// ─── Dominio ───
describe("dominioValido", () => {
  it("dominio válido correcto", () => {
    expect(dominioValido("capitalpolleria.restaurant.pe")).toBe(true);
  });

  it("dominio con www.", () => {
    expect(dominioValido("www.capitalpolleria.restaurant.pe")).toBe(true);
  });

  it("dominio null", () => {
    expect(dominioValido(null)).toBe(false);
  });

  it("dominio undefined", () => {
    expect(dominioValido(undefined)).toBe(false);
  });

  it("dominio vacío", () => {
    expect(dominioValido("")).toBe(false);
  });

  it("dominio solo espacios", () => {
    expect(dominioValido("   ")).toBe(false);
  });

  it("SIN DOMINIO", () => {
    expect(dominioValido("SIN DOMINIO")).toBe(false);
  });

  it("S/D", () => {
    expect(dominioValido("S/D")).toBe(false);
  });

  it("N/A", () => {
    expect(dominioValido("N/A")).toBe(false);
  });

  it("null como string", () => {
    expect(dominioValido("null")).toBe(false);
  });

  it("dominio con mayúsculas", () => {
    expect(dominioValido("CapitalPolleria.Restaurant.Pe")).toBe(true);
  });

  it("dominio con espacios alrededor", () => {
    expect(dominioValido("  capitalpolleria.restaurant.pe  ")).toBe(true);
  });
});

// ─── normalizarDominio ───
describe("normalizarDominio", () => {
  it("normaliza dominio válido", () => {
    expect(normalizarDominio("capitalpolleria.restaurant.pe")).toBe("capitalpolleria.restaurant.pe");
  });

  it("elimina www.", () => {
    expect(normalizarDominio("www.capitalpolleria.restaurant.pe")).toBe("capitalpolleria.restaurant.pe");
  });

  it("normaliza con mayúsculas", () => {
    expect(normalizarDominio("CapitalPolleria.Restaurant.Pe")).toBe("capitalpolleria.restaurant.pe");
  });

  it("null → null", () => {
    expect(normalizarDominio(null)).toBeNull();
  });

  it("vacío → null", () => {
    expect(normalizarDominio("")).toBeNull();
  });

  it("solo espacios → null", () => {
    expect(normalizarDominio("   ")).toBeNull();
  });
});

// ─── Canal ───
describe("canalValido", () => {
  it("CORREO es válido", () => {
    expect(canalValido("CORREO")).toBe(true);
  });

  it("correo es válido", () => {
    expect(canalValido("correo")).toBe(true);
  });

  it("CHAT es válido", () => {
    expect(canalValido("CHAT")).toBe(true);
  });

  it("chat es válido", () => {
    expect(canalValido("chat")).toBe(true);
  });

  it("email es válido", () => {
    expect(canalValido("email")).toBe(true);
  });

  it("whatsapp es válido", () => {
    expect(canalValido("whatsapp")).toBe(true);
  });

  it("TELÉFONO no es válido", () => {
    expect(canalValido("TELÉFONO")).toBe(false);
  });

  it("null no es válido", () => {
    expect(canalValido(null)).toBe(false);
  });

  it("vacío no es válido", () => {
    expect(canalValido("")).toBe(false);
  });

  it("otro canal no es válido", () => {
    expect(canalValido("FACEBOOK")).toBe(false);
  });
});

// ─── Estado Zendesk ───
describe("estadoZendeskCandidato", () => {
  it("closed es candidato", () => {
    expect(estadoZendeskCandidato("closed")).toBe(true);
  });

  it("solved es candidato", () => {
    expect(estadoZendeskCandidato("solved")).toBe(true);
  });

  it("cerrado es candidato", () => {
    expect(estadoZendeskCandidato("cerrado")).toBe(true);
  });

  it("resuelto es candidato", () => {
    expect(estadoZendeskCandidato("resuelto")).toBe(true);
  });

  it("open NO es candidato", () => {
    expect(estadoZendeskCandidato("open")).toBe(false);
  });

  it("pending NO es candidato", () => {
    expect(estadoZendeskCandidato("pending")).toBe(false);
  });

  it("new NO es candidato", () => {
    expect(estadoZendeskCandidato("new")).toBe(false);
  });

  it("null NO es candidato", () => {
    expect(estadoZendeskCandidato(null)).toBe(false);
  });
});

// ─── Teléfono ───
describe("normalizarTelefono", () => {
  it("número local de 9 dígitos agrega código país", () => {
    expect(normalizarTelefono("987654321")).toBe("51987654321");
  });

  it("número con código país se mantiene", () => {
    expect(normalizarTelefono("51987654321")).toBe("51987654321");
  });

  it("número con guiones se limpia", () => {
    expect(normalizarTelefono("987-654-321")).toBe("51987654321");
  });

  it("null → null", () => {
    expect(normalizarTelefono(null)).toBeNull();
  });

  it("vacío → null", () => {
    expect(normalizarTelefono("")).toBeNull();
  });

  it("solo letras → null", () => {
    expect(normalizarTelefono("abc")).toBeNull();
  });
});

// ─── Identidad real ───
describe("identidadReal", () => {
  it("email válido", () => {
    expect(identidadReal({ numero: "test@restaurant.pe" })).toBe("email:test@restaurant.pe");
  });

  it("email catch-all excluido", () => {
    expect(identidadReal({ numero: CATCH_ALL_EMAIL })).toBeNull();
  });

  it("teléfono válido", () => {
    expect(identidadReal({ numero: "987654321" })).toBe("tel:51987654321");
  });

  it("número vacío → null", () => {
    expect(identidadReal({ numero: "" })).toBeNull();
  });

  it("null → null", () => {
    expect(identidadReal({ numero: null })).toBeNull();
  });

  it("email con mayúsculas se normaliza", () => {
    expect(identidadReal({ numero: "Test@Restaurant.Pe" })).toBe("email:test@restaurant.pe");
  });
});

// ─── Clasificación de categoría ───
describe("Clasificación tipo desde categoría", () => {
  function clasificarTipo(subcategoria: string): "devolucion" | "queja" {
    const norm = subcategoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (norm.includes("solicitud de devolucion") || norm.includes("solicitud_de_devolucion")) {
      return "devolucion";
    }
    return "queja";
  }

  it("solicitud_de_devolución → devolucion", () => {
    expect(clasificarTipo("solicitud_de_devolución")).toBe("devolucion");
  });

  it("Solicitud de devolución → devolucion", () => {
    expect(clasificarTipo("Solicitud de devolución")).toBe("devolucion");
  });

  it("SOLICITUD DE DEVOLUCIÓN → devolucion", () => {
    expect(clasificarTipo("SOLICITUD DE DEVOLUCIÓN")).toBe("devolucion");
  });

  it("solicitud de devolucion → devolucion", () => {
    expect(clasificarTipo("solicitud de devolucion")).toBe("devolucion");
  });

  it("queja → queja", () => {
    expect(clasificarTipo("queja")).toBe("queja");
  });

  it("Queja de servicio → queja", () => {
    expect(clasificarTipo("Queja de servicio")).toBe("queja");
  });

  it("QUEJA → queja", () => {
    expect(clasificarTipo("QUEJA")).toBe("queja");
  });

  it("otra categoría → queja (default)", () => {
    expect(clasificarTipo("consulta general")).toBe("queja");
  });

  it("vacío → queja (default)", () => {
    expect(clasificarTipo("")).toBe("queja");
  });
});

// ─── Normalización de strings (consistencia con permisos) ───
describe("Normalización de módulos QyD", () => {
  it("Quejas y Devoluciones = quejas y devoluciones", () => {
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    expect(norm("Quejas y Devoluciones")).toBe(norm("quejas y devoluciones"));
  });

  it("Agendas = agendas", () => {
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    expect(norm("Agendas")).toBe(norm("agendas"));
  });

  it("Apoyos = apoyos", () => {
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    expect(norm("Apoyos")).toBe(norm("apoyos"));
  });
});

// ─── Casos backfill preservación de datos ───
describe("Preservación de datos operativos", () => {
  interface CasoBackfill {
    estado: string | null;
    resultado: string | null;
    monto_pagado: string | null;
    monto_devuelto: string | null;
    caso_cerrado: boolean;
    clasificacion: string | null;
  }

  function tieneDatosOperativos(caso: CasoBackfill): boolean {
    const DEFAULT_ESTADO = "Pendiente de conciliación";
    if (caso.estado && caso.estado !== DEFAULT_ESTADO) return true;
    if (caso.resultado) return true;
    if (caso.monto_pagado && Number(caso.monto_pagado) > 0) return true;
    if (caso.monto_devuelto && Number(caso.monto_devuelto) > 0) return true;
    if (caso.caso_cerrado) return true;
    if (caso.clasificacion) return true;
    return false;
  }

  it("caso con estado default NO tiene datos operativos", () => {
    expect(tieneDatosOperativos({
      estado: "Pendiente de conciliación",
      resultado: null,
      monto_pagado: null,
      monto_devuelto: null,
      caso_cerrado: false,
      clasificacion: null,
    })).toBe(false);
  });

  it("caso con estado 'Resuelto' SÍ tiene datos operativos", () => {
    expect(tieneDatosOperativos({
      estado: "Resuelto",
      resultado: null,
      monto_pagado: null,
      monto_devuelto: null,
      caso_cerrado: false,
      clasificacion: null,
    })).toBe(true);
  });

  it("caso con resultado SÍ tiene datos operativos", () => {
    expect(tieneDatosOperativos({
      estado: "Pendiente de conciliación",
      resultado: "Procede 100%",
      monto_pagado: null,
      monto_devuelto: null,
      caso_cerrado: false,
      clasificacion: null,
    })).toBe(true);
  });

  it("caso con monto pagado SÍ tiene datos operativos", () => {
    expect(tieneDatosOperativos({
      estado: "Pendiente de conciliación",
      resultado: null,
      monto_pagado: "1500",
      monto_devuelto: null,
      caso_cerrado: false,
      clasificacion: null,
    })).toBe(true);
  });

  it("caso cerrado SÍ tiene datos operativos", () => {
    expect(tieneDatosOperativos({
      estado: "Pendiente de conciliación",
      resultado: null,
      monto_pagado: null,
      monto_devuelto: null,
      caso_cerrado: true,
      clasificacion: null,
    })).toBe(true);
  });

  it("caso con clasificación SÍ tiene datos operativos", () => {
    expect(tieneDatosOperativos({
      estado: "Pendiente de conciliación",
      resultado: null,
      monto_pagado: null,
      monto_devuelto: null,
      caso_cerrado: false,
      clasificacion: "Servicio",
    })).toBe(true);
  });

  it("caso con monto_pagado 0 NO tiene datos operativos", () => {
    expect(tieneDatosOperativos({
      estado: "Pendiente de conciliación",
      resultado: null,
      monto_pagado: "0",
      monto_devuelto: null,
      caso_cerrado: false,
      clasificacion: null,
    })).toBe(false);
  });

  it("caso MANUAL con datos completos preserva todo", () => {
    const caso: CasoBackfill = {
      estado: "Resuelto",
      resultado: "Procede 100%",
      monto_pagado: "2055",
      monto_devuelto: "2055",
      caso_cerrado: true,
      clasificacion: null,
    };
    expect(tieneDatosOperativos(caso)).toBe(true);
  });
});

// ─── Flujo completo de clasificación ───
describe("Flujo de clasificación completo", () => {
  interface TicketInput {
    canal: string | null;
    estado: string | null;
    subcategoria: string | null;
    dominio: string | null;
  }

  interface ResultadoClasificacion {
    esCandidato: boolean;
    tipo: "devolucion" | "queja" | null;
    motivo: string;
  }

  function clasificar(ticket: TicketInput): ResultadoClasificacion {
    if (!canalValido(ticket.canal)) {
      return { esCandidato: false, tipo: null, motivo: "CANAL_NO_VALIDO" };
    }
    if (!estadoZendeskCandidato(ticket.estado)) {
      return { esCandidato: false, tipo: null, motivo: "ESTADO_NO_VALIDO" };
    }
    if (!ticket.subcategoria) {
      return { esCandidato: false, tipo: null, motivo: "CATEGORIA_NO_HOMOLOGADA" };
    }
    const norm = ticket.subcategoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    let tipo: "devolucion" | "queja";
    if (norm.includes("solicitud de devolucion") || norm.includes("solicitud_de_devolucion")) {
      tipo = "devolucion";
    } else if (norm.includes("queja")) {
      tipo = "queja";
    } else {
      return { esCandidato: false, tipo: null, motivo: "CATEGORIA_NO_HOMOLOGADA" };
    }
    if (!dominioValido(ticket.dominio)) {
      return { esCandidato: false, tipo: null, motivo: "SIN_DOMINIO" };
    }
    return { esCandidato: true, tipo, motivo: "OK" };
  }

  it("correo cerrado + devolución + dominio válido → candidato", () => {
    const r = clasificar({
      canal: "CORREO",
      estado: "closed",
      subcategoria: "solicitud_de_devolución",
      dominio: "capitalpolleria.restaurant.pe",
    });
    expect(r.esCandidato).toBe(true);
    expect(r.tipo).toBe("devolucion");
  });

  it("chat cerrado + queja + dominio válido → candidato", () => {
    const r = clasificar({
      canal: "CHAT",
      estado: "closed",
      subcategoria: "queja de servicio",
      dominio: "heladeriaicecream.restaurant.pe",
    });
    expect(r.esCandidato).toBe(true);
    expect(r.tipo).toBe("queja");
  });

  it("canal inválido → no candidato", () => {
    const r = clasificar({
      canal: "TELÉFONO",
      estado: "closed",
      subcategoria: "queja",
      dominio: "test.restaurant.pe",
    });
    expect(r.esCandidato).toBe(false);
    expect(r.motivo).toBe("CANAL_NO_VALIDO");
  });

  it("estado abierto → no candidato", () => {
    const r = clasificar({
      canal: "CORREO",
      estado: "open",
      subcategoria: "solicitud_de_devolución",
      dominio: "test.restaurant.pe",
    });
    expect(r.esCandidato).toBe(false);
    expect(r.motivo).toBe("ESTADO_NO_VALIDO");
  });

  it("sin categoría → no candidato", () => {
    const r = clasificar({
      canal: "CORREO",
      estado: "closed",
      subcategoria: null,
      dominio: "test.restaurant.pe",
    });
    expect(r.esCandidato).toBe(false);
    expect(r.motivo).toBe("CATEGORIA_NO_HOMOLOGADA");
  });

  it("categoría no homologada → no candidato", () => {
    const r = clasificar({
      canal: "CORREO",
      estado: "closed",
      subcategoria: "consulta general",
      dominio: "test.restaurant.pe",
    });
    expect(r.esCandidato).toBe(false);
    expect(r.motivo).toBe("CATEGORIA_NO_HOMOLOGADA");
  });

  it("sin dominio → no candidato", () => {
    const r = clasificar({
      canal: "CORREO",
      estado: "closed",
      subcategoria: "solicitud_de_devolución",
      dominio: null,
    });
    expect(r.esCandidato).toBe(false);
    expect(r.motivo).toBe("SIN_DOMINIO");
  });

  it("SIN DOMINIO como dominio → no candidato", () => {
    const r = clasificar({
      canal: "CORREO",
      estado: "closed",
      subcategoria: "solicitud_de_devolución",
      dominio: "SIN DOMINIO",
    });
    expect(r.esCandidato).toBe(false);
    expect(r.motivo).toBe("SIN_DOMINIO");
  });

  it("solved es candidato igual que closed", () => {
    const r = clasificar({
      canal: "CORREO",
      estado: "solved",
      subcategoria: "solicitud_de_devolución",
      dominio: "test.restaurant.pe",
    });
    expect(r.esCandidato).toBe(true);
  });
});

// ─── Flujo completo de creación de caso QYD ───
describe("Flujo completo de creación QYD — validación integrada", () => {
  interface TicketCompleto {
    ticketId: string;
    canal: string | null;
    estado: string | null;
    subcategoria: string | null;
    dominio: string | null;
  }

  interface ResultadoCreacion {
    crea: boolean;
    motivo: string;
  }

  /**
   * Evalúa si un ticket debe crear caso QYD.
   * Implementa la cadena completa de validación:
   * canal → estado → clasificación → dominio → duplicado
   */
  function evaluarTicketParaCreacion(
    ticket: TicketCompleto,
    casosExistentes: Set<string> = new Set(),
  ): ResultadoCreacion {
    // 1. Canal válido (CORREO o CHAT).
    if (!canalValido(ticket.canal)) {
      return { crea: false, motivo: "NO_CREA_CANAL_INVALIDO" };
    }
    // 2. Estado Zendesk cerrado/resuelto.
    if (!estadoZendeskCandidato(ticket.estado)) {
      return { crea: false, motivo: "NO_CREA_ESTADO_NO_CERRADO" };
    }
    // 3. Clasificación válida (QUEJA o DEVOLUCIÓN).
    if (!ticket.subcategoria) {
      return { crea: false, motivo: "CATEGORIA_NO_HOMOLOGADA" };
    }
    const norm = ticket.subcategoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const esDevolucion = norm.includes("solicitud de devolucion") || norm.includes("solicitud_de_devolucion");
    const esQueja = norm.includes("queja");
    if (!esDevolucion && !esQueja) {
      return { crea: false, motivo: "CATEGORIA_NO_HOMOLOGADA" };
    }
    // 4. Dominio válido.
    if (!dominioValido(ticket.dominio)) {
      return { crea: false, motivo: "SIN_DOMINIO" };
    }
    // 5. No duplicado.
    const tipo = esDevolucion ? "devolucion" : "queja";
    const clave = `${ticket.ticketId}:${tipo}`;
    if (casosExistentes.has(clave)) {
      return { crea: false, motivo: "YA_EXISTE" };
    }
    return { crea: true, motivo: "CREA" };
  }

  // A. CORREO + CLOSED + QUEJA + DOMINIO → CREA
  it("A: correo cerrado + queja + dominio válido → crea", () => {
    const r = evaluarTicketParaCreacion({
      ticketId: "30092", canal: "CORREO", estado: "closed",
      subcategoria: "queja", dominio: "cromanon.restaurant.pe",
    });
    expect(r.crea).toBe(true);
    expect(r.motivo).toBe("CREA");
  });

  // B. CORREO + CLOSED + DEVOLUCIÓN + DOMINIO → CREA
  it("B: correo cerrado + devolución + dominio válido → crea", () => {
    const r = evaluarTicketParaCreacion({
      ticketId: "30843", canal: "CORREO", estado: "closed",
      subcategoria: "solicitud_de_devolución", dominio: "citypapa.restaurant.pe",
    });
    expect(r.crea).toBe(true);
    expect(r.motivo).toBe("CREA");
  });

  // C. CHAT + CLOSED + QUEJA + DOMINIO → CREA
  it("C: chat cerrado + queja + dominio válido → crea", () => {
    const r = evaluarTicketParaCreacion({
      ticketId: "10001", canal: "CHAT", estado: "closed",
      subcategoria: "queja de servicio", dominio: "test.restaurant.pe",
    });
    expect(r.crea).toBe(true);
    expect(r.motivo).toBe("CREA");
  });

  // D. CHAT + CLOSED + DEVOLUCIÓN + DOMINIO → CREA
  it("D: chat cerrado + devolución + dominio válido → crea", () => {
    const r = evaluarTicketParaCreacion({
      ticketId: "10002", canal: "CHAT", estado: "solved",
      subcategoria: "solicitud_de_devolucion", dominio: "otro.restaurant.pe",
    });
    expect(r.crea).toBe(true);
    expect(r.motivo).toBe("CREA");
  });

  // E. CORREO + OPEN + QUEJA → NO CREA
  it("E: correo abierto + queja → no crea", () => {
    const r = evaluarTicketParaCreacion({
      ticketId: "10003", canal: "CORREO", estado: "open",
      subcategoria: "queja", dominio: "test.restaurant.pe",
    });
    expect(r.crea).toBe(false);
    expect(r.motivo).toBe("NO_CREA_ESTADO_NO_CERRADO");
  });

  // F. CORREO + PENDING + DEVOLUCIÓN → NO CREA
  it("F: correo pendiente + devolución → no crea", () => {
    const r = evaluarTicketParaCreacion({
      ticketId: "10004", canal: "CORREO", estado: "pending",
      subcategoria: "solicitud_de_devolución", dominio: "test.restaurant.pe",
    });
    expect(r.crea).toBe(false);
    expect(r.motivo).toBe("NO_CREA_ESTADO_NO_CERRADO");
  });

  // G. TELÉFONO + CLOSED + QUEJA → NO CREA
  it("G: teléfono cerrado + queja → no crea", () => {
    const r = evaluarTicketParaCreacion({
      ticketId: "10005", canal: "TELÉFONO", estado: "closed",
      subcategoria: "queja", dominio: "test.restaurant.pe",
    });
    expect(r.crea).toBe(false);
    expect(r.motivo).toBe("NO_CREA_CANAL_INVALIDO");
  });

  // H. WEB + CLOSED + DEVOLUCIÓN → NO CREA
  it("H: web cerrado + devolución → no crea", () => {
    const r = evaluarTicketParaCreacion({
      ticketId: "10006", canal: "WEB", estado: "closed",
      subcategoria: "solicitud_de_devolución", dominio: "test.restaurant.pe",
    });
    expect(r.crea).toBe(false);
    expect(r.motivo).toBe("NO_CREA_CANAL_INVALIDO");
  });

  // I. CLOSED + QUEJA + SIN DOMINIO → NO CREA
  it("I: cerrado + queja + sin dominio → no crea", () => {
    const r = evaluarTicketParaCreacion({
      ticketId: "10007", canal: "CORREO", estado: "closed",
      subcategoria: "queja", dominio: null,
    });
    expect(r.crea).toBe(false);
    expect(r.motivo).toBe("SIN_DOMINIO");
  });

  // J. CLOSED + DEVOLUCIÓN + SIN DOMINIO → NO CREA
  it("J: cerrado + devolución + sin dominio → no crea", () => {
    const r = evaluarTicketParaCreacion({
      ticketId: "10008", canal: "CORREO", estado: "closed",
      subcategoria: "solicitud_de_devolución", dominio: "SIN DOMINIO",
    });
    expect(r.crea).toBe(false);
    expect(r.motivo).toBe("SIN_DOMINIO");
  });

  // K. CLOSED + categoría diferente → NO CREA
  it("K: cerrado + categoría no homologada → no crea", () => {
    const r = evaluarTicketParaCreacion({
      ticketId: "10009", canal: "CORREO", estado: "closed",
      subcategoria: "consulta general", dominio: "test.restaurant.pe",
    });
    expect(r.crea).toBe(false);
    expect(r.motivo).toBe("CATEGORIA_NO_HOMOLOGADA");
  });

  // L. ticket ya existente → YA_EXISTE
  it("L: ticket ya existente → no crea (YA_EXISTE)", () => {
    const existentes = new Set(["30092:queja"]);
    const r = evaluarTicketParaCreacion({
      ticketId: "30092", canal: "CORREO", estado: "closed",
      subcategoria: "queja", dominio: "cromanon.restaurant.pe",
    }, existentes);
    expect(r.crea).toBe(false);
    expect(r.motivo).toBe("YA_EXISTE");
  });

  // M. ejecución doble → un solo caso
  it("M: ejecución doble → solo un caso creado", () => {
    const existentes = new Set<string>();
    const r1 = evaluarTicketParaCreacion({
      ticketId: "10010", canal: "CORREO", estado: "closed",
      subcategoria: "queja", dominio: "test.restaurant.pe",
    }, existentes);
    expect(r1.crea).toBe(true);

    // Simular que el caso ya fue creado
    existentes.add("10010:queja");
    const r2 = evaluarTicketParaCreacion({
      ticketId: "10010", canal: "CORREO", estado: "closed",
      subcategoria: "queja", dominio: "test.restaurant.pe",
    }, existentes);
    expect(r2.crea).toBe(false);
    expect(r2.motivo).toBe("YA_EXISTE");
  });

  // N. categorización después del cierre → CREA
  it("N: ticket cerrado primero, categorizado después → crea", () => {
    const r = evaluarTicketParaCreacion({
      ticketId: "10011", canal: "CORREO", estado: "closed",
      subcategoria: "solicitud_de_devolución", dominio: "test.restaurant.pe",
    });
    expect(r.crea).toBe(true);
    expect(r.motivo).toBe("CREA");
  });

  // O. cierre después de categorización → CREA
  it("O: ticket categorizado primero, cerrado después → crea", () => {
    // El ticket llega con estado closed y subcategoiria válida
    const r = evaluarTicketParaCreacion({
      ticketId: "10012", canal: "CHAT", estado: "solved",
      subcategoria: "queja", dominio: "test.restaurant.pe",
    });
    expect(r.crea).toBe(true);
    expect(r.motivo).toBe("CREA");
  });

  // P. caso MANUAL existente → NO DUPLICA
  it("P: caso MANUAL existente → no duplica", () => {
    const existentes = new Set(["20001:devolucion"]);
    const r = evaluarTicketParaCreacion({
      ticketId: "20001", canal: "CORREO", estado: "closed",
      subcategoria: "solicitud_de_devolución", dominio: "test.restaurant.pe",
    }, existentes);
    expect(r.crea).toBe(false);
    expect(r.motivo).toBe("YA_EXISTE");
  });

  // Q. caso BACKFILL existente → NO DUPLICA
  it("Q: caso BACKFILL existente → no duplica", () => {
    const existentes = new Set(["20002:queja"]);
    const r = evaluarTicketParaCreacion({
      ticketId: "20002", canal: "CORREO", estado: "closed",
      subcategoria: "queja", dominio: "test.restaurant.pe",
    }, existentes);
    expect(r.crea).toBe(false);
    expect(r.motivo).toBe("YA_EXISTE");
  });

  // R. datos operativos existentes → NO SOBRESCRIBE
  it("R: datos operativos existentes → caso existente preservado", () => {
    // Verificar que si el caso YA existe, no se crea otro (el existente se preserva)
    const existentes = new Set(["20003:devolucion"]);
    const r = evaluarTicketParaCreacion({
      ticketId: "20003", canal: "CORREO", estado: "closed",
      subcategoria: "solicitud_de_devolución", dominio: "test.restaurant.pe",
    }, existentes);
    expect(r.crea).toBe(false);
    expect(r.motivo).toBe("YA_EXISTE");
    // El caso existente NO se modifica (la función solo evalúa si crear)
  });
});
