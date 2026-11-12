import { describe, expect, it } from "vitest";
import {
  categoriaDesdeSubcategoriaZendesk,
  clasificarTicketZendeskQyd,
  clasificacionQuejaDesdeSubcategoria,
} from "../quejasCasos.service";
import { construirVentanasMensuales } from "../qydZendeskBackfill.service";
import { esFechaISO, fechaLima } from "../../utils/fechaQyd";

describe("backfill QyD — adaptadores y ventanas", () => {
  it("traduce la subcategoría exacta de devolución sin ambigüedad", () => {
    expect(categoriaDesdeSubcategoriaZendesk("solicitud_de_devolución"))
      .toEqual({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución" });
    expect(clasificarTicketZendeskQyd("solicitud_de_devolución"))
      .toEqual({ tipo: "devolucion", categoria: "SOLICITUD_DEVOLUCION" });
    expect(clasificarTicketZendeskQyd("Solicitud de devolución"))
      .toEqual({ tipo: "devolucion", categoria: "SOLICITUD_DEVOLUCION" });
  });

  it("no convierte valores arbitrarios que solo contienen 'solicitud'", () => {
    expect(categoriaDesdeSubcategoriaZendesk("solicitud_de_migración")).toBeNull();
    expect(clasificarTicketZendeskQyd("solicitud_de_migración")).toBeNull();
    expect(clasificarTicketZendeskQyd("solicitud")).toBeNull();
  });

  it("reconoce las hojas de queja y reclamo del catálogo", () => {
    expect(clasificarTicketZendeskQyd("queja_servicio"))
      .toEqual({ tipo: "queja", categoria: "QUEJA" });
    expect(clasificarTicketZendeskQyd("queja_producto"))
      .toEqual({ tipo: "queja", categoria: "QUEJA" });
    expect(clasificarTicketZendeskQyd("reclamo"))
      .toEqual({ tipo: "queja", categoria: "RECLAMO" });
    expect(clasificacionQuejaDesdeSubcategoria("queja", "queja_servicio")).toBe("Servicio");
    expect(clasificacionQuejaDesdeSubcategoria("devolucion", "solicitud_de_devolución")).toBeNull();
  });

  it("divide el rango en ventanas mensuales con fin exclusivo", () => {
    const ventanas = construirVentanasMensuales("2026-07-01", "2026-09-15");
    expect(ventanas).toEqual([
      { desde: "2026-07-01", hastaExclusivo: "2026-08-01" },
      { desde: "2026-08-01", hastaExclusivo: "2026-09-01" },
      { desde: "2026-09-01", hastaExclusivo: "2026-09-16" },
    ]);
  });

  it("convierte timestamps a fecha Lima y valida YYYY-MM-DD", () => {
    expect(fechaLima("2026-07-15T02:30:00Z")).toBe("2026-07-14");
    expect(fechaLima("2026-07-15T12:00:00Z")).toBe("2026-07-15");
    expect(fechaLima("no-es-fecha")).toBeNull();
    expect(esFechaISO("2026-07-15")).toBe(true);
    expect(esFechaISO("2026-02-30")).toBe(false);
    expect(esFechaISO("15/07/2026")).toBe(false);
  });
});
