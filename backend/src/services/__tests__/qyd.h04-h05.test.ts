import { describe, it, expect, vi, beforeEach } from "vitest";

interface CasoFake {
  id: string;
  tipo: "devolucion" | "queja";
  numero: string;
  ticket_id: string | null;
  ticket_padre_id: string | null;
  dominio: string | null;
  asesor: string | null;
  estado: string | null;
  eliminado: boolean;
  consolidado_en: string | null;
  caso_cerrado: boolean;
  created_at: Date;
}

interface InteraccionFake {
  id: string;
  caso_id: string;
  ticket_id: string;
  tipo_relacion: string;
  created_by: string | null;
  canal: string | null;
  fecha: Date | null;
}

const db = vi.hoisted(() => ({
  state: {
    casos: [] as CasoFake[],
    interacciones: [] as InteraccionFake[],
    auditorias: [] as unknown[],
  },
  failAudit: false,
  forceUniqueOnce: false,
  forceUniqueWithoutCase: false,
  raceCase: null as CasoFake | null,
  lockCola: Promise.resolve(),
}));

const res = vi.hoisted(() => ({
  resolver: vi.fn(),
  validar: vi.fn(),
  lock: vi.fn(),
  unique: vi.fn(),
}));

function clonarEstado() {
  return structuredClone(db.state);
}

vi.mock("../../repositories/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => {
      let release!: () => void;
      const turno = new Promise<void>((resolve) => { release = resolve; });
      const previo = db.lockCola;
      db.lockCola = previo.then(() => turno);
      await previo;

      const snapshot = clonarEstado();
      try {
        return await fn({});
      } catch (err) {
        db.state = snapshot;
        throw err;
      } finally {
        release();
      }
    }),
  },
}));

vi.mock("../../repositories/quejasDevoluciones.repository", () => {
  function porTicket(ticketId: string, tipo: string): CasoFake | null {
    if (db.raceCase && db.raceCase.ticket_id === ticketId && db.raceCase.tipo === tipo) return db.raceCase;
    return db.state.casos.find((c) => c.ticket_id === ticketId && c.tipo === tipo && !c.eliminado) ?? null;
  }

  function porTicketGeneral(ticketId: string, tipo: string): CasoFake | null {
    if (db.raceCase && db.raceCase.tipo === tipo
      && (db.raceCase.ticket_id === ticketId || db.raceCase.ticket_padre_id === ticketId)) {
      return db.raceCase;
    }
    return db.state.casos.find((c) => c.tipo === tipo && !c.eliminado && (
      c.ticket_id === ticketId
      || c.ticket_padre_id === ticketId
      || db.state.interacciones.some((i) => i.caso_id === c.id && i.ticket_id === ticketId)
    )) ?? null;
  }

  function makeCaso(input: any): CasoFake {
    return {
      id: `c-${db.state.casos.length + 1}`,
      tipo: input.tipo,
      numero: input.tipo === "devolucion" ? "DEV-1" : "QUE-1",
      ticket_id: input.ticketId ?? null,
      ticket_padre_id: input.ticketPadreId ?? null,
      dominio: input.dominio ?? null,
      asesor: input.asesor ?? null,
      estado: input.estado ?? null,
      eliminado: false,
      consolidado_en: null,
      caso_cerrado: input.casoCerrado === true,
      created_at: new Date(),
    };
  }

  return {
    qdRepository: {
      porTicket: vi.fn(async (ticketId: string, tipo: string) => porTicket(ticketId, tipo)),
      porTicketGeneral: vi.fn(async (ticketId: string, tipo: string) => porTicketGeneral(ticketId, tipo)),
      crear: vi.fn(async (input: any) => {
        if (db.forceUniqueOnce) {
          db.forceUniqueOnce = false;
          if (!db.forceUniqueWithoutCase) {
            const carrera = makeCaso(input);
            carrera.id = "c-race";
            db.raceCase = carrera;
          }
          const err: any = new Error("duplicate key qd_casos_ticket_id_tipo_key");
          err.code = "P2002";
          throw err;
        }
        if (porTicket(input.ticketId, input.tipo)) {
          const err: any = new Error("duplicate key qd_casos_ticket_id_tipo_key");
          err.code = "P2002";
          throw err;
        }
        const caso = makeCaso(input);
        db.state.casos.push(caso);
        return caso;
      }),
      asociarInteraccion: vi.fn(async (
        casoId: string,
        ticketId: string,
        usuario: string | null,
        tipoRelacion = "relacionada",
        canal: string | null = null,
        fecha: Date | null = null,
      ) => {
        const existe = db.state.interacciones.some((i) => i.caso_id === casoId && i.ticket_id === ticketId);
        if (existe) return null;
        const row: InteraccionFake = {
          id: `i-${db.state.interacciones.length + 1}`,
          caso_id: casoId,
          ticket_id: ticketId,
          tipo_relacion: tipoRelacion,
          created_by: usuario,
          canal,
          fecha,
        };
        db.state.interacciones.push(row);
        return row;
      }),
      registrarAuditoria: vi.fn(async (...args: unknown[]) => {
        if (db.failAudit) throw new Error("audit boom");
        db.state.auditorias.push(args);
      }),
      regularizarSinDominio: vi.fn(async (casoId: string) => {
        const caso = db.state.casos.find((c) => c.id === casoId);
        if (!caso) return null;
        caso.dominio = "SIN DOMINIO";
        if (!caso.caso_cerrado) caso.estado = "CERRADO";
        caso.caso_cerrado = true;
        return caso;
      }),
    },
  };
});

vi.mock("../qdCaseResolution.service", () => ({
  resolverCadenaTicket: res.resolver,
  validarCadenaEnTx: res.validar,
  bloquearRaizTipo: res.lock,
  esViolacionUnica: res.unique,
}));

vi.mock("../quejasCasos.service", () => {
  const PLACEHOLDERS = new Set(["sin dominio", "sindominio", "sinlocal", "s/d", "n/a", "null"]);
  const resolverDominioQyd = (d: string | null | undefined) => {
    const raw = d == null ? "" : String(d).trim();
    if (!raw) return { dominio: "SIN DOMINIO", sinDominio: true, original: null, motivo: "AUSENTE" };
    const v = raw.toLowerCase();
    if (raw.includes("@")) return { dominio: "SIN DOMINIO", sinDominio: true, original: raw, motivo: "EMAIL" };
    if (PLACEHOLDERS.has(v) || v.startsWith("sinlocal") || v.startsWith("sindominio")) {
      return { dominio: "SIN DOMINIO", sinDominio: true, original: raw, motivo: "PLACEHOLDER" };
    }
    return { dominio: v.replace(/^www\./, ""), sinDominio: false, original: raw, motivo: "VALIDO" };
  };
  return {
    resolverDominioQyd,
    DOMINIO_SIN_DOMINIO: "SIN DOMINIO",
    ESTADO_CERRADO: "CERRADO",
    dominioValido: (d: string | null | undefined) => !resolverDominioQyd(d).sinDominio,
    normalizarCanal: (c: string | null | undefined) => {
      if (!c) return null;
      const v = c.trim().toLowerCase();
      if (v === "correo" || v === "email") return "CORREO";
      if (v === "chat") return "CHAT";
      if (v === "whatsapp") return "WHATSAPP";
      return null;
    },
    normalizarDominio: (d: string | null | undefined) => (d ? d.trim().toLowerCase().replace(/^www\./, "") : null),
    reconstruirCasosBackfill: vi.fn(),
    reconciliarCasosQD: vi.fn(),
  };
});

import { prisma } from "../../repositories/prisma";
import { qdRepository } from "../../repositories/quejasDevoluciones.repository";
import { qdService } from "../quejasDevoluciones.service";

const base = {
  ticketId: "34576",
  tipo: "devolucion" as const,
  asesor: "Ana Perez",
  dominio: "cesars.restaurant.pe",
  estado: "Pendiente de conciliación",
  canal: "email",
};

function resolverCadena(rootMap: Record<string, string[]>) {
  res.resolver.mockImplementation(async (ticketId: string) => {
    const cadena = rootMap[ticketId] ?? [ticketId];
    const rootTicketId = cadena[cadena.length - 1];
    const eslabones = cadena.map((t, i) => ({ ticketId: t, padre: cadena[i + 1] ?? null }));
    return { ok: true, rootTicketId, cadena, eslabones };
  });
}

function casoFake(overrides: Partial<CasoFake>): CasoFake {
  return {
    id: "h1",
    tipo: "devolucion",
    numero: "DEV-H1",
    ticket_id: "historico-1",
    ticket_padre_id: null,
    dominio: "cesars.restaurant.pe",
    asesor: "Victor",
    estado: "Pendiente de conciliación",
    eliminado: false,
    consolidado_en: null,
    caso_cerrado: false,
    created_at: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.state = { casos: [], interacciones: [], auditorias: [] };
  db.failAudit = false;
  db.forceUniqueOnce = false;
  db.forceUniqueWithoutCase = false;
  db.raceCase = null;
  db.lockCola = Promise.resolve();
  res.validar.mockResolvedValue({ ok: true });
  res.lock.mockResolvedValue(undefined);
  res.unique.mockImplementation((err: any) => err?.code === "P2002" || err?.code === "23505");
});

describe("qdService.crearDesdeCategorizacion — H-04/H-05", () => {
  it("caso A real: 34576 → raíz 33967, un solo caso con la cadena completa", async () => {
    resolverCadena({ "34576": ["34576", "33967"], "33967": ["33967"] });

    const r = await qdService.crearDesdeCategorizacion(base, "Ana Perez (usr-ana)");

    expect(r).toMatchObject({ creado: true, reutilizado: false, caso: { ticket_id: "33967" } });
    expect(qdRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ ticketId: "33967", ticketPadreId: null, origen: "CATEGORIZACION" }),
      expect.anything(),
    );
    expect(res.lock).toHaveBeenCalledWith(expect.anything(), "33967", "devolucion");
    expect(res.validar).toHaveBeenCalled();
    expect(db.state.interacciones).toEqual(expect.arrayContaining([
      expect.objectContaining({ ticket_id: "33967", tipo_relacion: "principal" }),
      expect.objectContaining({ ticket_id: "34576", tipo_relacion: "relacionada" }),
    ]));
  });

  it("ticket independiente 34618 → su propio expediente", async () => {
    resolverCadena({ "34618": ["34618"] });
    const r = await qdService.crearDesdeCategorizacion({ ...base, ticketId: "34618" }, "Ana");
    expect(r).toMatchObject({ creado: true, caso: { ticket_id: "34618" } });
    expect(db.state.casos).toHaveLength(1);
  });

  it("H-05: dos tickets del mismo dominio sin relación → dos expedientes", async () => {
    resolverCadena({ "100": ["100"], "200": ["200"] });
    const a = await qdService.crearDesdeCategorizacion({ ...base, ticketId: "100" }, "Ana");
    const b = await qdService.crearDesdeCategorizacion({ ...base, ticketId: "200" }, "Ana");
    expect(a.creado).toBe(true);
    expect(b.creado).toBe(true);
    expect(db.state.casos).toHaveLength(2);
    expect(qdRepository.crear).toHaveBeenCalledTimes(2);
  });

  it("H-05: queja + devolución del mismo hilo → un expediente por tipo", async () => {
    resolverCadena({ "300": ["300"] });
    const queja = await qdService.crearDesdeCategorizacion({ ...base, ticketId: "300", tipo: "queja" }, "Ana");
    const devo = await qdService.crearDesdeCategorizacion({ ...base, ticketId: "300", tipo: "devolucion" }, "Ana");
    expect(queja.creado).toBe(true);
    expect(devo.creado).toBe(true);
    expect(db.state.casos.map((c) => c.tipo).sort()).toEqual(["devolucion", "queja"]);
    expect(res.lock).toHaveBeenCalledWith(expect.anything(), "300", "queja");
    expect(res.lock).toHaveBeenCalledWith(expect.anything(), "300", "devolucion");
  });

  it("solo usa el padre observado si la lectura del ticket fue verificada", async () => {
    resolverCadena({ "34576": ["34576", "33967"], "33967": ["33967"] });

    await qdService.crearDesdeCategorizacion({
      ...base,
      ticketPadreId: "33967",
      followupIds: ["34577"],
      relacionVerificada: false,
    }, "Ana");

    expect(res.resolver).toHaveBeenCalledWith("34576", {});
  });

  it("pasa padre y followup_ids cuando la relación fue verificada", async () => {
    resolverCadena({ "34576": ["34576", "33967"], "33967": ["33967"] });

    await qdService.crearDesdeCategorizacion({
      ...base,
      ticketPadreId: "33967",
      followupIds: ["34577"],
      relacionVerificada: true,
    }, "Ana");

    expect(res.resolver).toHaveBeenCalledWith("34576", {
      padreConocido: "33967",
      followupIds: ["34577"],
    });
  });

  it("permitirZendesk:false se propaga al resolver sin API", async () => {
    resolverCadena({ "34576": ["34576"] });
    await qdService.crearDesdeCategorizacion({ ...base, permitirZendesk: false }, "Ana");
    expect(res.resolver).toHaveBeenCalledWith("34576", { permitirZendesk: false });
  });

  it("relación no resuelta → PENDIENTE_RELACION y no crea ni abre transacción", async () => {
    res.resolver.mockResolvedValue({ ok: false, motivo: "PENDIENTE_RELACION", detalle: "sin datos" });
    const r = await qdService.crearDesdeCategorizacion(base, "Ana");
    expect(r).toMatchObject({ creado: false, caso: null, motivoNoCreacion: "PENDIENTE_RELACION" });
    expect(qdRepository.crear).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("la cadena cambió entre resolución y transacción → PENDIENTE_RELACION sin crear", async () => {
    resolverCadena({ "34576": ["34576", "33967"], "33967": ["33967"] });
    res.validar.mockResolvedValue({ ok: false, detalle: "cambió" });
    const r = await qdService.crearDesdeCategorizacion(base, "Ana");
    expect(r).toMatchObject({ creado: false, caso: null, motivoNoCreacion: "PENDIENTE_RELACION" });
    expect(qdRepository.crear).not.toHaveBeenCalled();
    expect(db.state.interacciones).toHaveLength(0);
    expect(db.state.auditorias).toHaveLength(0);
  });

  it("reutiliza un caso existente de la cadena sin crear ni actualizar qd_casos", async () => {
    resolverCadena({ "34576": ["34576", "33967"], "33967": ["33967"] });
    db.state.casos.push(casoFake({ id: "h1", ticket_id: "33967" }));

    const r = await qdService.crearDesdeCategorizacion(base, "Ana");

    expect(r).toMatchObject({ creado: false, reutilizado: true, caso: { id: "h1" } });
    expect(qdRepository.crear).not.toHaveBeenCalled();
    expect(db.state.casos).toHaveLength(1);
    expect(db.state.interacciones).toEqual([
      expect.objectContaining({ caso_id: "h1", ticket_id: "34576", tipo_relacion: "relacionada" }),
    ]);
  });

  it("caso histórico sin principal: nunca agrega una interacción principal", async () => {
    resolverCadena({ "34576": ["34576", "33967"], "33967": ["33967"] });
    db.state.casos.push(casoFake({ id: "h1", ticket_id: "historico-1", ticket_padre_id: "33967" }));

    const r = await qdService.crearDesdeCategorizacion(base, "Ana");

    expect(r).toMatchObject({ reutilizado: true, caso: { id: "h1" } });
    const principales = db.state.interacciones.filter((i) => i.tipo_relacion === "principal");
    expect(principales).toHaveLength(0);
    expect(qdRepository.crear).not.toHaveBeenCalled();
  });

  it("20 casos históricos sin principal permanecen sin principal", async () => {
    const roots: Record<string, string[]> = {};
    for (let i = 0; i < 20; i++) {
      roots[`t-${i}`] = [`t-${i}`, `root-${i}`];
      db.state.casos.push(casoFake({
        id: `h-${i}`,
        ticket_id: `hist-${i}`,
        ticket_padre_id: `root-${i}`,
      }));
    }
    resolverCadena(roots);

    for (let i = 0; i < 20; i++) {
      const r = await qdService.crearDesdeCategorizacion({ ...base, ticketId: `t-${i}` }, "Ana");
      expect(r.reutilizado).toBe(true);
    }

    expect(qdRepository.crear).not.toHaveBeenCalled();
    expect(db.state.casos).toHaveLength(20);
    expect(db.state.interacciones.filter((i) => i.tipo_relacion === "principal")).toHaveLength(0);
  });

  it("idempotencia secuencial: dos llamadas al mismo ticket → un solo caso", async () => {
    resolverCadena({ "34576": ["34576", "33967"], "33967": ["33967"] });
    const a = await qdService.crearDesdeCategorizacion(base, "Ana");
    const b = await qdService.crearDesdeCategorizacion(base, "Ana");
    expect(a.creado).toBe(true);
    expect(b.reutilizado).toBe(true);
    expect(db.state.casos).toHaveLength(1);
    expect(qdRepository.crear).toHaveBeenCalledTimes(1);
  });

  it("concurrencia: dos procesos con la misma raíz → un solo expediente", async () => {
    resolverCadena({ "34576": ["34576", "33967"], "33967": ["33967"] });
    const [a, b] = await Promise.all([
      qdService.crearDesdeCategorizacion(base, "Ana"),
      qdService.crearDesdeCategorizacion(base, "Ana"),
    ]);
    expect(a.caso?.id).toBe("c-1");
    expect(b.caso?.id).toBe("c-1");
    expect(db.state.casos).toHaveLength(1);
    expect(qdRepository.crear).toHaveBeenCalledTimes(1);
    expect(res.lock).toHaveBeenCalledTimes(2);
  });

  it("violación UNIQUE por carrera → reconsulta y reutiliza, no lanza 500", async () => {
    resolverCadena({ "34576": ["34576", "33967"], "33967": ["33967"] });
    db.forceUniqueOnce = true;

    const r = await qdService.crearDesdeCategorizacion(base, "Ana");

    expect(r).toMatchObject({ reutilizado: true, caso: { id: "c-race" } });
    expect(db.state.casos).toHaveLength(0); // la transacción revirtió; el caso ganador es externo
  });

  it("si el UNIQUE de expediente no encuentra ganador, propaga CONFLICTO_CONCURRENCIA", async () => {
    resolverCadena({ "34576": ["34576", "33967"], "33967": ["33967"] });
    db.forceUniqueOnce = true;
    db.forceUniqueWithoutCase = true;

    await expect(qdService.crearDesdeCategorizacion(base, "Ana"))
      .rejects.toMatchObject({ code: "CONFLICTO_CONCURRENCIA" });
    expect(db.state.casos).toHaveLength(0);
  });

  it("atomicidad: si falla la auditoría, no queda caso ni interacción", async () => {
    resolverCadena({ "34576": ["34576", "33967"], "33967": ["33967"] });
    db.failAudit = true;

    await expect(qdService.crearDesdeCategorizacion(base, "Ana")).rejects.toThrow("audit boom");
    expect(db.state.casos).toHaveLength(0);
    expect(db.state.interacciones).toHaveLength(0);
    expect(db.state.auditorias).toHaveLength(0);
  });

  it("SIN DOMINIO: crea con dominio SIN DOMINIO, estado CERRADO y auditoría del valor original", async () => {
    resolverCadena({ "40000": ["40000"] });
    const r = await qdService.crearDesdeCategorizacion({
      ...base, ticketId: "40000", dominio: null, dominioOriginal: null,
    }, "Ana");

    expect(r.creado).toBe(true);
    expect(qdRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ dominio: "SIN DOMINIO", estado: "CERRADO", casoCerrado: true }),
      expect.anything(),
    );
    expect(db.state.auditorias).toEqual(expect.arrayContaining([
      expect.arrayContaining(["dominio_sin_dominio"]),
      expect.arrayContaining(["estado_sin_dominio"]),
    ]));
  });

  it("SIN DOMINIO: un correo no se acepta como dominio y se conserva el original", async () => {
    resolverCadena({ "40001": ["40001"] });
    const r = await qdService.crearDesdeCategorizacion({
      ...base, ticketId: "40001", dominio: "munanqui@gmail.com",
    }, "Ana");

    expect(r.creado).toBe(true);
    expect(qdRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ dominio: "SIN DOMINIO", estado: "CERRADO" }),
      expect.anything(),
    );
    expect(db.state.auditorias).toEqual(expect.arrayContaining([
      expect.arrayContaining(["dominio_sin_dominio", "dominio", "munanqui@gmail.com", "SIN DOMINIO"]),
    ]));
  });

  it("SIN DOMINIO: reutiliza un expediente existente sin modificar estado ni dominio", async () => {
    db.state.casos.push(casoFake({
      id: "h-sin", ticket_id: "50000", dominio: null, estado: "Pendiente de conciliación",
    }));
    const r = await qdService.crearDesdeCategorizacion({
      ...base, ticketId: "50000", dominio: null,
    }, "Ana");

    expect(r.reutilizado).toBe(true);
    expect(qdRepository.crear).not.toHaveBeenCalled();
    expect(db.state.casos[0]).toMatchObject({
      dominio: null, estado: "Pendiente de conciliación", caso_cerrado: false,
    });
  });

  it("SIN DOMINIO: si el expediente existente ya tiene dominio real, no lo destruye", async () => {
    db.state.casos.push(casoFake({
      id: "h-real", ticket_id: "50001", dominio: "cliente.restaurant.pe",
      estado: "Resuelto", caso_cerrado: true,
    }));
    const r = await qdService.crearDesdeCategorizacion({
      ...base, ticketId: "50001", dominio: null,
    }, "Ana");

    expect(r.reutilizado).toBe(true);
    expect(db.state.casos[0]).toMatchObject({
      dominio: "cliente.restaurant.pe", estado: "Resuelto", caso_cerrado: true,
    });
  });
});
