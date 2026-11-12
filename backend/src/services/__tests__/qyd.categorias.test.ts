import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = { $queryRaw: vi.fn(), $executeRaw: vi.fn(), $queryRawUnsafe: vi.fn(), $executeRawUnsafe: vi.fn() };

vi.mock("../../repositories/prisma", () => ({
  prisma: { $transaction: async (fn: (t: unknown) => unknown) => fn(tx) },
}));

vi.mock("../../repositories/quejasDevoluciones.repository", () => ({
  qdRepository: {
    porTicket: vi.fn(),
    porTicketGeneral: vi.fn(),
    crear: vi.fn(),
    registrarAuditoria: vi.fn(),
    asociarInteraccion: vi.fn(),
  },
}));

vi.mock("../qdCaseResolution.service", () => ({
  resolverCadenaTicket: vi.fn(async (ticketId: string) => ({
    ok: true,
    rootTicketId: ticketId,
    cadena: [ticketId],
    eslabones: [{ ticketId, padre: null }],
  })),
  validarCadenaEnTx: vi.fn(async () => ({ ok: true })),
  bloquearRaizTipo: vi.fn(async () => undefined),
  esViolacionUnica: vi.fn(() => false),
}));

import { qdRepository } from "../../repositories/quejasDevoluciones.repository";
import { qdService } from "../quejasDevoluciones.service";
import { clasificarCategoriaQyd, canalValido, dominioValido } from "../quejasCasos.service";

const caso = {
  id: "c1", tipo: "queja" as const, numero: "QUE-1", ticket_id: "t1", ticket_padre_id: null,
  dominio: "wingster.restaurant.pe", pais: null, asesor: null, estado: "Pendiente", resultado: null,
  origen: "CATEGORIZACION", clasificacion: null, caso_cerrado: false, consolidado_en: null, eliminado: false,
};

const base = {
  ticketId: "t1", tipo: "queja" as "queja" | "devolucion", asesor: "ana",
  dominio: "wingster.restaurant.pe", estado: "Pendiente de conciliación", estadoTicket: "closed", canal: "whatsapp",
};

describe("FIX QYD realtime — categorías y gate (12 casos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (qdRepository.porTicket as any).mockResolvedValue(null);
    (qdRepository.porTicketGeneral as any).mockResolvedValue(null);
    (qdRepository.crear as any).mockResolvedValue(caso);
    (qdRepository.registrarAuditoria as any).mockResolvedValue(undefined);
  });

  it("1. queja + cerrado → tipo queja", () => {
    expect(clasificarCategoriaQyd("Queja")).toEqual({ tipo: "queja", categoria: "QUEJA" });
  });
  it("2. reclamo + cerrado → tipo queja", () => {
    expect(clasificarCategoriaQyd("RECLAMO")).toEqual({ tipo: "queja", categoria: "RECLAMO" });
  });
  it("3. solicitud de devolución + cerrado → tipo devolucion", () => {
    expect(clasificarCategoriaQyd("Solicitud de Devolución")).toEqual({ tipo: "devolucion", categoria: "SOLICITUD_DEVOLUCION" });
    expect(clasificarCategoriaQyd("DEVOLUCION")).toEqual({ tipo: "devolucion", categoria: "SOLICITUD_DEVOLUCION" });
  });
  it("4. queja y devolución + cerrado → caso (tipo queja)", () => {
    expect(clasificarCategoriaQyd("QUEJA Y DEVOLUCION")).toEqual({ tipo: "queja", categoria: "QUEJA_Y_DEVOLUCION" });
    // variantes de acentos/case/separadores
    expect(clasificarCategoriaQyd("  Queja_y_Devolución  ")).toEqual({ tipo: "queja", categoria: "QUEJA_Y_DEVOLUCION" });
  });
  it("5. categoría no QyD → null", () => {
    expect(clasificarCategoriaQyd("Consulta general")).toBeNull();
    expect(clasificarCategoriaQyd("Soporte")).toBeNull();
  });
  it("5b. QUEJA FORMAL → queja", () => {
    expect(clasificarCategoriaQyd("QUEJA FORMAL")).toEqual({ tipo: "queja", categoria: "QUEJA" });
    expect(clasificarCategoriaQyd("Queja formal")).toEqual({ tipo: "queja", categoria: "QUEJA" });
  });
  it("5c. DEVOLUCIÓN + Solicitud de devolución tiene prioridad exacta", () => {
    expect(clasificarCategoriaQyd("DEVOLUCIÓN", "solicitud_de_devolución"))
      .toEqual({ tipo: "devolucion", categoria: "SOLICITUD_DEVOLUCION" });
    expect(clasificarCategoriaQyd("DEVOLUCION", "solicitud_de_devolucion"))
      .toEqual({ tipo: "devolucion", categoria: "SOLICITUD_DEVOLUCION" });
  });
  it("5d. no convierte categorías arbitrarias por una subcategoría parcial", () => {
    expect(clasificarCategoriaQyd("Soporte", "solicitud_de_devolución")).toBeNull();
    expect(clasificarCategoriaQyd("Soporte", "solicitud")).toBeNull();
    expect(clasificarCategoriaQyd("GESTIÓN", "solicitud_de_devolución"))
      .toEqual({ tipo: "devolucion", categoria: "SOLICITUD_DEVOLUCION" });
    expect(clasificarCategoriaQyd("QUEJA Y DEVOLUCIÓN", "solicitud_de_devolución"))
      .toEqual({ tipo: "queja", categoria: "QUEJA_Y_DEVOLUCION" });
  });
  it("6/7. QyD + abierto/pendiente → también crea (el estado no bloquea)", async () => {
    for (const s of ["open", "pending", "Pendiente de conciliación"]) {
      const r = await qdService.crearDesdeCategorizacion({ ...base, estadoTicket: s }, "ana");
      expect(r.creado).toBe(true);
      expect(r.motivoNoCreacion).toBeUndefined();
    }
  });
  it("8/12. ticket existente → ALREADY_EXISTS (reutilizado), idempotente en repetición", async () => {
    (qdRepository.porTicketGeneral as any).mockResolvedValue(caso);
    const a = await qdService.crearDesdeCategorizacion({ ...base }, "ana");
    const b = await qdService.crearDesdeCategorizacion({ ...base }, "ana");
    expect(a.reutilizado).toBe(true);
    expect(b.reutilizado).toBe(true);
    expect(qdRepository.crear).not.toHaveBeenCalled();
  });
  it("9/10. canal válido y canal inválido", () => {
    expect(canalValido("correo")).toBe(true);
    expect(canalValido("email")).toBe(true);
    expect(canalValido("chat")).toBe(true);
    expect(canalValido("whatsapp")).toBe(true);
    expect(canalValido("WHATSAPP")).toBe(true);
    expect(canalValido("zendesk")).toBe(false);
    expect(canalValido(null)).toBe(false);
  });
  it("9b. canal ausente → PENDIENTE_CANAL (no asume CORREO)", async () => {
    const r = await qdService.crearDesdeCategorizacion({ ...base, canal: null }, "ana");
    expect(r.creado).toBe(false);
    expect(r.motivoNoCreacion).toBe("PENDIENTE_CANAL");
  });
  it("11. dominio inválido → crea SIN DOMINIO + CERRADO (no bloquea)", async () => {
    const r = await qdService.crearDesdeCategorizacion({ ...base, dominio: null }, "ana");
    expect(r.creado).toBe(true);
    expect(r.motivoNoCreacion).toBeUndefined();
    expect(qdRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ dominio: "SIN DOMINIO", estado: "CERRADO", casoCerrado: true }),
      expect.anything(),
    );
    expect(dominioValido(null)).toBe(false);
    expect(dominioValido("munanqui@gmail.com")).toBe(false);
    expect(dominioValido("sindominio.restaurant.pe")).toBe(false);
    expect(dominioValido("sinlocal.restaurant.pe")).toBe(false);
    expect(dominioValido("cliente.restaurant.pe")).toBe(true);
  });
  it("creación efectiva: closed + QyD + dominio → CREATED", async () => {
    const r = await qdService.crearDesdeCategorizacion({ ...base, estilo: undefined } as any, "ana");
    expect(r.creado).toBe(true);
    expect(qdRepository.crear).toHaveBeenCalled();
    expect(qdRepository.registrarAuditoria).toHaveBeenCalled();
  });
});