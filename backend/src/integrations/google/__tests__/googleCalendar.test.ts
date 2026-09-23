import { describe, it, expect, vi, beforeEach } from "vitest";
import { googleCalendarService, CalendarServiceError } from "../googleCalendar.service";

// Mockear prisma y googleapis
vi.mock("../../../repositories/prisma", () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  },
}));

describe("GoogleCalendarService", () => {
  describe("toTimeString", () => {
    it("convierte string HH:MM directamente", () => {
      expect(googleCalendarService.toTimeString("14:30")).toBe("14:30");
    });

    it("trunca string HH:MM:SS a HH:MM", () => {
      expect(googleCalendarService.toTimeString("14:30:00")).toBe("14:30");
    });

    it("convierte Date object (epoch 1970-01-01THH:MM:SSZ) a HH:MM", () => {
      const date = new Date("1970-01-01T15:45:00.000Z");
      expect(googleCalendarService.toTimeString(date)).toBe("15:45");
    });

    it("maneja medianoche correctamente", () => {
      const date = new Date("1970-01-01T00:00:00.000Z");
      expect(googleCalendarService.toTimeString(date)).toBe("00:00");
    });
  });

  describe("buildGoogleDateTime", () => {
    it("construye DateTime con offset -05:00 (America/Lima)", () => {
      const result = googleCalendarService.buildGoogleDateTime("2025-09-15", "14:30");
      expect(result).toBe("2025-09-15T14:30:00-05:00");
    });

    it("maneja Date objects para fecha y hora", () => {
      const fecha = new Date("2025-09-15T00:00:00.000Z");
      const hora = new Date("1970-01-01T18:00:00.000Z");
      const result = googleCalendarService.buildGoogleDateTime(fecha, hora);
      expect(result).toContain("2025-09-15T18:00:00-05:00");
    });

    it("construye DateTime para medianoche", () => {
      const result = googleCalendarService.buildGoogleDateTime("2025-12-25", "00:00");
      expect(result).toBe("2025-12-25T00:00:00-05:00");
    });
  });

  describe("buildEventoFromAgenda", () => {
    it("construye evento completo con extendedProperties", () => {
      const agenda = {
        ticket: "AGD-000010",
        tipo: "REUNION",
        cliente_nombre: "Juan Perez",
        dominio: "restaurant.pe",
        asesor_correo: "asesor@restaurant.pe",
        asesor_nombre: "Carlos Asesor",
        fecha: "2025-09-15",
        hora_inicio: "14:00",
        hora_fin: "15:00",
        descripcion: "Reunion de prueba",
        id: "test-id-123",
      };

      const result = googleCalendarService.buildEventoFromAgenda(agenda);

      expect(result.summary).toBe("[COPE] Reunion — AGD-000010");
      expect(result.startDateTime).toBe("2025-09-15T14:00:00-05:00");
      expect(result.endDateTime).toBe("2025-09-15T15:00:00-05:00");
      expect(result.timeZone).toBe("America/Lima");
      expect(result.attendees).toEqual([{ email: "asesor@restaurant.pe" }]);
      expect(result.location).toBe("restaurant.pe");
      expect(result.description).toContain("Ticket: AGD-000010");
      expect(result.description).toContain("Cliente: Juan Perez");
      expect(result.description).toContain("Asesor: Carlos Asesor (asesor@restaurant.pe)");
      expect(result.description).toContain("Reunion de prueba");
      // ExtendedProperties
      expect(result.extendedProperties).toBeDefined();
      expect(result.extendedProperties!.cope).toBe("true");
      expect(result.extendedProperties!.copeAgendaId).toBe("test-id-123");
    });

    it("incluye cliente como attendee si tiene correo válido", () => {
      const agenda = {
        ticket: "AGD-000014",
        tipo: "REUNION",
        cliente_nombre: "Maria Cliente",
        cliente_correo: "maria@cliente.com",
        dominio: "cliente.com",
        asesor_correo: "asesor@restaurant.pe",
        asesor_nombre: "Carlos",
        fecha: "2025-09-15",
        hora_inicio: "10:00",
        hora_fin: "11:00",
        descripcion: null,
        id: "test-id-456",
      };

      const result = googleCalendarService.buildEventoFromAgenda(agenda);
      expect(result.attendees).toEqual([
        { email: "asesor@restaurant.pe" },
        { email: "maria@cliente.com" },
      ]);
    });

    it("normaliza emails a lowercase y trim", () => {
      const agenda = {
        ticket: "AGD-000015",
        tipo: "REUNION",
        cliente_nombre: null,
        cliente_correo: "  CLIENTE@EXAMPLE.COM  ",
        dominio: null,
        asesor_correo: "ASESOR@RESTAURANT.PE",
        asesor_nombre: "Carlos",
        fecha: "2025-09-15",
        hora_inicio: "10:00",
        hora_fin: "11:00",
        descripcion: null,
      };

      const result = googleCalendarService.buildEventoFromAgenda(agenda);
      expect(result.attendees).toEqual([
        { email: "asesor@restaurant.pe" },
        { email: "cliente@example.com" },
      ]);
    });

    it("no duplica attendee si cliente y asesor tienen el mismo correo", () => {
      const agenda = {
        ticket: "AGD-000016",
        tipo: "REUNION",
        cliente_nombre: null,
        cliente_correo: "asesor@restaurant.pe",
        dominio: null,
        asesor_correo: "asesor@restaurant.pe",
        asesor_nombre: "Carlos",
        fecha: "2025-09-15",
        hora_inicio: "10:00",
        hora_fin: "11:00",
        descripcion: null,
      };

      const result = googleCalendarService.buildEventoFromAgenda(agenda);
      expect(result.attendees).toEqual([{ email: "asesor@restaurant.pe" }]);
    });

    it("no incluye attendee cliente si correo es null o vacío", () => {
      const agenda = {
        ticket: "AGD-000017",
        tipo: "REUNION",
        cliente_nombre: null,
        cliente_correo: null,
        dominio: null,
        asesor_correo: "asesor@restaurant.pe",
        asesor_nombre: "Carlos",
        fecha: "2025-09-15",
        hora_inicio: "10:00",
        hora_fin: "11:00",
        descripcion: null,
      };

      const result = googleCalendarService.buildEventoFromAgenda(agenda);
      expect(result.attendees).toEqual([{ email: "asesor@restaurant.pe" }]);
    });

    it("usa label Capacitacion para tipo CAPACITACION", () => {
      const agenda = {
        ticket: "AGD-000011",
        tipo: "CAPACITACION",
        cliente_nombre: null,
        dominio: null,
        asesor_correo: "asesor@restaurant.pe",
        asesor_nombre: "Carlos",
        fecha: "2025-09-15",
        hora_inicio: "10:00",
        hora_fin: "11:30",
        descripcion: null,
      };

      const result = googleCalendarService.buildEventoFromAgenda(agenda);
      expect(result.summary).toBe("[COPE] Capacitacion — AGD-000011");
    });

    it("maneja Date objects para hora (Prisma TIME columns)", () => {
      const agenda = {
        ticket: "AGD-000012",
        tipo: "REUNION",
        cliente_nombre: null,
        dominio: null,
        asesor_correo: "asesor@restaurant.pe",
        asesor_nombre: "Carlos",
        fecha: new Date("2025-09-15T00:00:00.000Z"),
        hora_inicio: new Date("1970-01-01T16:30:00.000Z"),
        hora_fin: new Date("1970-01-01T17:30:00.000Z"),
        descripcion: null,
      };

      const result = googleCalendarService.buildEventoFromAgenda(agenda);
      expect(result.startDateTime).toBe("2025-09-15T16:30:00-05:00");
      expect(result.endDateTime).toBe("2025-09-15T17:30:00-05:00");
    });

    it("maneja cliente_nombre y dominio null", () => {
      const agenda = {
        ticket: "AGD-000013",
        tipo: "REUNION",
        cliente_nombre: null,
        dominio: null,
        asesor_correo: "asesor@restaurant.pe",
        asesor_nombre: "Carlos",
        fecha: "2025-09-15",
        hora_inicio: "09:00",
        hora_fin: "10:00",
        descripcion: null,
      };

      const result = googleCalendarService.buildEventoFromAgenda(agenda);
      expect(result.description).toContain("Cliente: N/A");
      expect(result.description).toContain("Dominio: N/A");
      expect(result.location).toBeUndefined();
    });
  });

  describe("isConfigured", () => {
    it("retorna false cuando faltan variables de entorno", () => {
      const originalId = process.env.GOOGLE_CLIENT_ID;
      const originalSecret = process.env.GOOGLE_CLIENT_SECRET;
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      expect(googleCalendarService.isConfigured()).toBe(false);

      process.env.GOOGLE_CLIENT_ID = originalId;
      process.env.GOOGLE_CLIENT_SECRET = originalSecret;
    });
  });

  describe("CalendarServiceError", () => {
    it("tiene code, message y status", () => {
      const err = new CalendarServiceError("TEST_ERROR", "Mensaje de prueba", 400);
      expect(err.code).toBe("TEST_ERROR");
      expect(err.message).toBe("Mensaje de prueba");
      expect(err.status).toBe(400);
      expect(err).toBeInstanceOf(Error);
    });
  });
});
