import { describe, it, expect, vi, beforeEach } from "vitest";

const estado = vi.hoisted(() => ({
  relaciones: new Map<string, any>(),
  obtenerTicket: vi.fn(),
}));

vi.mock("../../repositories/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(async (strings: TemplateStringsArray, ...vals: unknown[]) => {
      const sql = strings.join(" ");
      if (sql.includes("FROM qd_relaciones_ticket")) {
        const row = estado.relaciones.get(String(vals[0]));
        return row ? [row] : [];
      }
      return [];
    }),
    $executeRaw: vi.fn(async (strings: TemplateStringsArray, ...vals: unknown[]) => {
      const sql = strings.join(" ");
      if (sql.includes("INSERT INTO qd_relaciones_ticket")) {
        const ticketId = String(vals[0]);
        const padre = (vals[1] ?? null) as string | null;
        const tieneFollowups = Boolean(vals[2]);
        const followupsRaw = vals.length > 3 ? vals[3] : "[]";
        const anterior = estado.relaciones.get(ticketId);
        let followups: unknown = null;
        if (tieneFollowups) {
          try {
            followups = typeof followupsRaw === "string" ? JSON.parse(followupsRaw) : [];
          } catch {
            followups = [];
          }
        } else {
          followups = anterior?.followup_ids ?? null;
        }
        estado.relaciones.set(ticketId, {
          ticket_id: ticketId,
          ticket_padre_id: padre,
          followup_ids: followups,
          origen: "zendesk",
          fetched_at: new Date(),
        });
      }
      return 1;
    }),
    $queryRawUnsafe: vi.fn(async (sql: string, ...vals: unknown[]) => {
      if (sql.includes("FROM qd_relaciones_ticket") && sql.includes("IN (")) {
        const ids = vals.map(String);
        return ids.map((id) => estado.relaciones.get(id)).filter(Boolean);
      }
      return [];
    }),
    $executeRawUnsafe: vi.fn(),
  },
}));

vi.mock("../../modules/zendesk/infrastructure/ZendeskClient", () => ({
  ZendeskClient: class {
    obtenerTicket = estado.obtenerTicket;
  },
}));

import { prisma } from "../../repositories/prisma";
import {
  resolverCadenaTicket,
  validarCadenaEnTx,
  bloquearRaizTipo,
  esViolacionUnica,
  QD_MAX_PROFUNDIDAD_CADENA,
  type ResolucionCadenaOk,
} from "../qdCaseResolution.service";

function setRelacion(ticketId: string, padre: string | null, opciones: { origen?: string; fetchedAt?: Date } = {}) {
  estado.relaciones.set(ticketId, {
    ticket_id: ticketId,
    ticket_padre_id: padre,
    followup_ids: [],
    origen: opciones.origen ?? "zendesk",
    fetched_at: opciones.fetchedAt ?? new Date(),
  });
}

function tx() {
  return prisma as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  estado.relaciones.clear();
  estado.obtenerTicket.mockResolvedValue(null);
});

describe("qdCaseResolution — H-04 resolución de raíz y cadena", () => {
  it("ticket sin padre → es su propia raíz", async () => {
    setRelacion("33967", null);
    const r = await resolverCadenaTicket("33967");
    expect(r).toMatchObject({ ok: true, rootTicketId: "33967", cadena: ["33967"] });
  });

  it("cadena directa 34576 → 33967 → raíz 33967", async () => {
    setRelacion("34576", "33967");
    setRelacion("33967", null);
    const r = await resolverCadenaTicket("34576");
    expect(r).toMatchObject({
      ok: true,
      rootTicketId: "33967",
      cadena: ["34576", "33967"],
      eslabones: [
        { ticketId: "34576", padre: "33967" },
        { ticketId: "33967", padre: null },
      ],
    });
  });

  it("cadena profunda transitiva hasta la raíz", async () => {
    setRelacion("50003", "50002");
    setRelacion("50002", "50001");
    setRelacion("50001", null);
    const r = await resolverCadenaTicket("50003");
    expect(r).toMatchObject({
      ok: true,
      rootTicketId: "50001",
      cadena: ["50003", "50002", "50001"],
    });
  });

  it("usa el padre observado en Zendesk y evita una segunda consulta del ticket actual", async () => {
    setRelacion("33967", null);
    const r = await resolverCadenaTicket("34576", { padreConocido: "33967" });
    expect(estado.obtenerTicket).not.toHaveBeenCalledWith(34576);
    expect(r).toMatchObject({ ok: true, rootTicketId: "33967", cadena: ["34576", "33967"] });
  });

  it("conserva los followup_ids observados al fijar la relación", async () => {
    setRelacion("33967", null);
    await resolverCadenaTicket("34576", { padreConocido: "33967", followupIds: ["34577"] });
    expect(estado.relaciones.get("34576")).toMatchObject({
      ticket_padre_id: "33967",
      followup_ids: ["34577"],
    });
  });

  it("ciclo A → B → A → PENDIENTE_RELACION", async () => {
    setRelacion("A", "B");
    setRelacion("B", "A");
    const r = await resolverCadenaTicket("A");
    expect(r).toMatchObject({ ok: false, motivo: "PENDIENTE_RELACION" });
    expect(r.ok ? "" : r.detalle).toContain("ciclo");
  });

  it("más de 20 niveles → PENDIENTE_RELACION", async () => {
    for (let i = 0; i < QD_MAX_PROFUNDIDAD_CADENA + 1; i++) {
      setRelacion(String(i), String(i + 1));
    }
    const r = await resolverCadenaTicket("0");
    expect(r).toMatchObject({ ok: false, motivo: "PENDIENTE_RELACION" });
    expect(r.ok ? "" : r.detalle).toContain("profundidad");
  });

  it("relación ausente y Zendesk no disponible → PENDIENTE_RELACION", async () => {
    estado.obtenerTicket.mockResolvedValue(null);
    const r = await resolverCadenaTicket("99999");
    expect(r).toMatchObject({ ok: false, motivo: "PENDIENTE_RELACION" });
  });

  it("relación no_disponible fuerza refresco desde Zendesk", async () => {
    setRelacion("70001", "70000", { origen: "no_disponible" });
    setRelacion("70000", null);
    estado.obtenerTicket.mockResolvedValue({
      id: 70001,
      via: { source: { rel: "follow_up", from: { ticket_id: 70000 } } },
      followup_ids: [],
    });
    const r = await resolverCadenaTicket("70001");
    expect(estado.obtenerTicket).toHaveBeenCalledWith(70001);
    expect(r).toMatchObject({ ok: true, rootTicketId: "70000" });
  });

  it("caché vencida se refresca desde Zendesk", async () => {
    setRelacion("80001", "80000", { fetchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000) });
    setRelacion("80009", null);
    estado.obtenerTicket.mockResolvedValue({
      id: 80001,
      via: { source: { rel: "follow_up", from: { ticket_id: 80009 } } },
      followup_ids: [],
    });
    const r = await resolverCadenaTicket("80001");
    expect(estado.obtenerTicket).toHaveBeenCalledWith(80001);
    expect(r).toMatchObject({ ok: true, cadena: ["80001", "80009"] });
  });

  it("advisory lock determinista por raíz + tipo", async () => {
    const llamado = vi.fn(async () => []);
    const fakeTx = { $queryRaw: llamado } as any;
    await bloquearRaizTipo(fakeTx, "33967", "devolucion");
    expect(llamado).toHaveBeenCalledTimes(1);
    const [strings, ...vals] = llamado.mock.calls[0] as unknown as [TemplateStringsArray, ...unknown[]];
    const sql = strings.join(" ");
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("hashtext");
    expect(sql).toContain("::text");
    expect(vals).toEqual(["33967", "devolucion"]);
  });

  it("identifica solo la violación UNIQUE de (ticket_id, tipo)", () => {
    expect(esViolacionUnica({
      code: "P2002",
      meta: { target: ["ticket_id", "tipo"] },
    })).toBe(true);
    expect(esViolacionUnica({
      code: "P2002",
      meta: { target: ["id"] },
    })).toBe(false);
    expect(esViolacionUnica({
      code: "P2010",
      meta: { code: "23505", message: "Key (ticket_id, tipo)=(1, devolucion) already exists." },
    })).toBe(true);
    expect(esViolacionUnica({
      code: "P2010",
      meta: { code: "23505", message: "Key (id)=(abc) already exists." },
    })).toBe(false);
    expect(esViolacionUnica({
      code: "23505",
      message: 'duplicate key value violates unique constraint "qd_casos_ticket_id_tipo_key"',
    })).toBe(true);
    expect(esViolacionUnica(new Error("duplicate key"))).toBe(false);
  });

  it("no sobrescribe una relación válida si Zendesk responde incompleto", async () => {
    setRelacion("71001", "71000", { fetchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000) });
    estado.relaciones.get("71001").followup_ids = ["71002"];
    estado.obtenerTicket.mockResolvedValue({});

    const r = await resolverCadenaTicket("71001");

    expect(r).toMatchObject({ ok: false, motivo: "PENDIENTE_RELACION" });
    expect(estado.relaciones.get("71001")).toMatchObject({
      ticket_padre_id: "71000",
      followup_ids: ["71002"],
    });
  });

  it("conserva followup_ids existentes si Zendesk no informa ese campo", async () => {
    setRelacion("72001", "72000", { fetchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000) });
    estado.relaciones.get("72001").followup_ids = ["72002"];
    setRelacion("72000", null);
    estado.obtenerTicket.mockResolvedValue({
      via: { source: { rel: "follow_up", from: { ticket_id: 72000 } } },
    });

    const r = await resolverCadenaTicket("72001");

    expect(r).toMatchObject({ ok: true, rootTicketId: "72000" });
    expect(estado.relaciones.get("72001")).toMatchObject({
      ticket_padre_id: "72000",
      followup_ids: ["72002"],
    });
  });

  it("persiste cada eslabón resuelto para que FOR UPDATE tenga filas reales", async () => {
    estado.obtenerTicket.mockImplementation(async (id: number) => (
      id === 90001
        ? { via: { source: { rel: "follow_up", from: { ticket_id: 90000 } } }, followup_ids: [] }
        : { via: { source: { rel: null, from: {} } }, followup_ids: [] }
    ));

    const r = await resolverCadenaTicket("90001") as ResolucionCadenaOk;

    expect(r).toMatchObject({ ok: true, rootTicketId: "90000", cadena: ["90001", "90000"] });
    expect(estado.relaciones.get("90001")).toMatchObject({ ticket_padre_id: "90000" });
    expect(estado.relaciones.get("90000")).toMatchObject({ ticket_padre_id: null });
    await expect(validarCadenaEnTx(tx(), r)).resolves.toEqual({ ok: true });
  });

  it("una relación nueva insertada después de la resolución → rechaza", async () => {
    setRelacion("73001", null);
    const r = await resolverCadenaTicket("73001") as ResolucionCadenaOk;
    setRelacion("73001", "73999");

    const v = await validarCadenaEnTx(tx(), r);

    expect(v.ok).toBe(false);
    expect(v.ok ? "" : v.detalle).toContain("cambió");
  });

  it("validación transaccional: cadena sin cambios → ok", async () => {
    setRelacion("34576", "33967");
    setRelacion("33967", null);
    const r = await resolverCadenaTicket("34576") as ResolucionCadenaOk;
    await expect(validarCadenaEnTx(tx(), r)).resolves.toEqual({ ok: true });
  });

  it("validación transaccional: padre cambiado → rechaza", async () => {
    setRelacion("34576", "33967");
    setRelacion("33967", null);
    const r = await resolverCadenaTicket("34576") as ResolucionCadenaOk;
    setRelacion("34576", "34999");
    const v = await validarCadenaEnTx(tx(), r);
    expect(v.ok).toBe(false);
    expect(v.ok ? "" : v.detalle).toContain("cambió");
  });

  it("validación transaccional: relación eliminada → rechaza", async () => {
    setRelacion("34576", "33967");
    setRelacion("33967", null);
    const r = await resolverCadenaTicket("34576") as ResolucionCadenaOk;
    estado.relaciones.delete("33967");
    const v = await validarCadenaEnTx(tx(), r);
    expect(v.ok).toBe(false);
    expect(v.ok ? "" : v.detalle).toContain("desapareció");
  });

  it("validación transaccional: relación no verificada → rechaza", async () => {
    setRelacion("34576", "33967");
    setRelacion("33967", null);
    const r = await resolverCadenaTicket("34576") as ResolucionCadenaOk;
    setRelacion("33967", null, { origen: "no_disponible" });
    const v = await validarCadenaEnTx(tx(), r);
    expect(v.ok).toBe(false);
    expect(v.ok ? "" : v.detalle).toContain("no está verificada");
  });
});
