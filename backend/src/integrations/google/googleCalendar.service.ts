import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../../repositories/prisma";
import crypto from "crypto";

/**
 * Servicio de integración con Google Calendar — OAuth 2.0.
 *
 * Arquitectura:
 *   COPE (fuente de verdad) → GoogleCalendarService → Google Calendar API
 *
 * Autenticación:
 *   OAuth 2.0 con una única cuenta central autorizada.
 *   El calendario central se configura en GOOGLE_CALENDAR_ID.
 *   Los tokens se almacenan en la tabla `google_oauth_tokens`.
 *
 * Variables de entorno requeridas:
 *   GOOGLE_CLIENT_ID         — Client ID de Google Cloud
 *   GOOGLE_CLIENT_SECRET     — Client Secret de Google Cloud
 *   GOOGLE_REDIRECT_URI      — Callback URL (producción o desarrollo)
 *   GOOGLE_CALENDAR_ID       — ID del calendario central (Agendas S.E.)
 *   GOOGLE_CALENDAR_TIMEZONE — Zona horaria del calendario (default: America/Lima)
 */

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const TIMEZONE = process.env.GOOGLE_CALENDAR_TIMEZONE || "America/Lima";

const OAUTH_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:4000/api/gestion/google-calendar/callback";

// ── OAuth State / CSRF Protection ──
// Mapa en memoria: stateToken → { createdAt }
// TTL: 10 minutos. Se limpian automáticamente.
const stateStore = new Map<string, number>();
const STATE_TTL_MS = 10 * 60 * 1000;

function generateState(): string {
  const state = crypto.randomBytes(32).toString("hex");
  stateStore.set(state, Date.now());
  return state;
}

function validateState(state: string | undefined): boolean {
  if (!state) return false;
  const createdAt = stateStore.get(state);
  if (createdAt === undefined) return false;
  stateStore.delete(state); // uso único
  return Date.now() - createdAt < STATE_TTL_MS;
}

// Limpieza periódica de states expirados (cada 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [state, createdAt] of stateStore) {
    if (now - createdAt > STATE_TTL_MS) stateStore.delete(state);
  }
}, 5 * 60 * 1000);

export interface CalendarEventInput {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
  attendees?: { email: string }[];
  location?: string;
  colorId?: string;
  extendedProperties?: Record<string, string>;
}

export interface CalendarEventResult {
  eventId: string;
  htmlLink: string;
  status: string;
  meetLink?: string;
}

export class CalendarServiceError extends Error {
  code: string;
  status?: number;
  constructor(code: string, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new CalendarServiceError(
      "GOOGLE_OAUTH_MISSING",
      "Faltan variables de entorno GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET"
    );
  }
  return new OAuth2Client(clientId, clientSecret, OAUTH_REDIRECT_URI);
}

function getCalendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || "primary";
}

/**
 * Obtiene los tokens almacenados en la BD.
 * Retorna null si no existen tokens.
 */
async function getStoredTokens(): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
} | null> {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT access_token, refresh_token, expiry_date FROM google_oauth_tokens WHERE id = 1 LIMIT 1`
  );
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  return {
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    expiry_date: Number(row.expiry_date),
  };
}

/**
 * Almacena o actualiza los tokens en la BD.
 */
async function storeTokens(tokens: {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}): Promise<void> {
  await prisma.$executeRawUnsafe(
    `INSERT INTO google_oauth_tokens (id, access_token, refresh_token, expiry_date, updated_at)
     VALUES (1, $1, $2, $3, NOW())
     ON CONFLICT (id) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, google_oauth_tokens.refresh_token),
       expiry_date = EXCLUDED.expiry_date,
       updated_at = NOW()`,
    tokens.access_token,
    tokens.refresh_token,
    BigInt(tokens.expiry_date)
  );
}

/**
 * Obtiene un cliente OAuth2 autenticado, refrescando el token si es necesario.
 */
async function getAuthenticatedClient(): Promise<OAuth2Client> {
  const oauth2Client = getOAuth2Client();
  const stored = await getStoredTokens();
  if (!stored) {
    throw new CalendarServiceError(
      "GOOGLE_NOT_CONNECTED",
      "Google Calendar no está conectado. Solicite al administrador que autorice la cuenta."
    );
  }

  oauth2Client.setCredentials({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
    expiry_date: stored.expiry_date,
  });

  // Verificar si el token expiró o expirará pronto (5 min de margen)
  const now = Date.now();
  if (stored.expiry_date && now > stored.expiry_date - 5 * 60 * 1000) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await storeTokens({
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || stored.refresh_token,
        expiry_date: credentials.expiry_date!,
      });
      oauth2Client.setCredentials(credentials);
    } catch (err: any) {
      throw new CalendarServiceError(
        "GOOGLE_TOKEN_REFRESH_ERROR",
        `Error al renovar token de Google: ${err.message ?? "desconocido"}`
      );
    }
  }

  return oauth2Client;
}

export const googleCalendarService = {
  /**
   * Verifica si Google Calendar está configurado (OAuth habilitado).
   */
  isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    );
  },

  /**
   * Verifica si hay tokens almacenados (cuenta conectada).
   */
  async isConnected(): Promise<boolean> {
    const tokens = await getStoredTokens();
    return tokens !== null;
  },

  /**
   * Genera la URL de autorización OAuth para iniciar el flujo.
   * Incluye parámetro state para protección CSRF.
   */
  generateAuthUrl(): { url: string; state: string } {
    const oauth2Client = getOAuth2Client();
    const state = generateState();
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
      state,
    });
    return { url, state };
  },

  /**
   * Intercambia el authorization code por tokens y los almacena.
   * Valida el parámetro state para prevenir ataques CSRF.
   */
  async handleCallback(code: string, state?: string): Promise<{ connected: boolean }> {
    if (!validateState(state)) {
      throw new CalendarServiceError(
        "GOOGLE_OAUTH_STATE_INVALID",
        "State inválido o expirado. Intente conectar nuevamente."
      );
    }
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.access_token) {
      throw new CalendarServiceError(
        "GOOGLE_AUTH_FAILED",
        "No se recibió access_token de Google"
      );
    }
    await storeTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || "",
      expiry_date: tokens.expiry_date!,
    });
    return { connected: true };
  },

  /**
   * Desconecta la cuenta de Google (elimina tokens).
   */
  async disconnect(): Promise<void> {
    await prisma.$executeRawUnsafe(`DELETE FROM google_oauth_tokens WHERE id = 1`);
  },

  /**
   * Crea un evento en Google Calendar en el calendario central.
   * Incluye extendedProperties para identificar eventos COPE.
   */
  async crearEvento(evento: CalendarEventInput): Promise<CalendarEventResult> {
    const calendar = await this.getCalendarClient();
    const calendarId = getCalendarId();

    const response = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: evento.summary,
        description: evento.description,
        start: {
          dateTime: evento.startDateTime,
          timeZone: evento.timeZone,
        },
        end: {
          dateTime: evento.endDateTime,
          timeZone: evento.timeZone,
        },
        attendees: evento.attendees,
        location: evento.location,
        colorId: evento.colorId,
        extendedProperties: evento.extendedProperties
          ? { private: evento.extendedProperties }
          : undefined,
        conferenceData: {
          createRequest: {
            requestId: `cope-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const event = response.data;
    if (!event.id) {
      throw new CalendarServiceError(
        "CALENDAR_NO_EVENT_ID",
        "Google Calendar no devolvió un ID de evento"
      );
    }

    return {
      eventId: event.id,
      htmlLink: event.htmlLink ?? "",
      status: event.status ?? "confirmed",
      meetLink: event.conferenceData?.entryPoints?.[0]?.uri ?? undefined,
    };
  },

  /**
   * Actualiza un evento existente en Google Calendar.
   * NO regenera Google Meet (conferenceData solo se envía en creación).
   * Mantiene extendedProperties para identificación COPE.
   */
  async actualizarEvento(
    eventId: string,
    evento: CalendarEventInput
  ): Promise<CalendarEventResult> {
    const calendar = await this.getCalendarClient();
    const calendarId = getCalendarId();

    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: evento.summary,
        description: evento.description,
        start: {
          dateTime: evento.startDateTime,
          timeZone: evento.timeZone,
        },
        end: {
          dateTime: evento.endDateTime,
          timeZone: evento.timeZone,
        },
        attendees: evento.attendees,
        location: evento.location,
        colorId: evento.colorId,
        extendedProperties: evento.extendedProperties
          ? { private: evento.extendedProperties }
          : undefined,
      },
    });

    const event = response.data;
    if (!event.id) {
      throw new CalendarServiceError(
        "CALENDAR_NO_EVENT_ID",
        "Google Calendar no devolvió un ID de evento"
      );
    }

    // Obtener Meet link existente (no regenerado en update)
    const meetLink = event.conferenceData?.entryPoints?.[0]?.uri ?? undefined;

    return {
      eventId: event.id,
      htmlLink: event.htmlLink ?? "",
      status: event.status ?? "confirmed",
      meetLink,
    };
  },

  /**
   * Cancela/elimina un evento de Google Calendar.
   */
  async eliminarEvento(eventId: string): Promise<void> {
    const calendar = await this.getCalendarClient();
    const calendarId = getCalendarId();
    await calendar.events.delete({
      calendarId,
      eventId,
    });
  },

  /**
   * Obtiene un evento por ID (para verificar existencia).
   */
  async obtenerEvento(
    eventId: string
  ): Promise<{ exists: boolean; status?: string; meetLink?: string }> {
    try {
      const calendar = await this.getCalendarClient();
      const calendarId = getCalendarId();
      const response = await calendar.events.get({
        calendarId,
        eventId,
      });
      return {
        exists: true,
        status: response.data.status ?? undefined,
        meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri ?? undefined,
      };
    } catch (err: any) {
      if (err.code === 404) {
        return { exists: false };
      }
      throw err;
    }
  },

/**
   * Extrae "HH:MM" de un valor TIME devuelto por Prisma (string | Date).
   * Las columnas TIME de PostgreSQL se devuelven como Date objects (epoch 1970-01-01THH:MM:SSZ).
   */
  toTimeString(v: string | Date): string {
    if (typeof v === "string") return v.substring(0, 5);
    const iso = v.toISOString();
    return iso.substring(11, 16);
  },

  /**
   * Construye "YYYY-MM-DDTHH:MM:SS-05:00" para Google Calendar API.
   * Si la fecha ya trae zona horaria, la respeta.
   */
  buildGoogleDateTime(fecha: string | Date, hora: string | Date): string {
    const fechaStr = typeof fecha === "string"
      ? fecha
      : fecha.toISOString().split("T")[0];
    const horaStr = this.toTimeString(hora);
    // Usar offset de TIMEZONE en lugar de "Z" para evitar problemas de zona horaria
    if (TIMEZONE === "America/Lima") {
      return `${fechaStr}T${horaStr}:00-05:00`;
    }
    // Fallback: usar UTC
    return `${fechaStr}T${horaStr}:00Z`;
  },

  /**
   * Construye el input de Calendar a partir de datos de Agenda.
   * Incluye extendedProperties para identificar eventos COPE.
   * Incluye asesor y cliente como attendees.
   */
  buildEventoFromAgenda(agenda: {
    ticket: string;
    tipo: string;
    cliente_nombre: string | null;
    cliente_correo?: string | null;
    dominio: string | null;
    asesor_correo: string;
    asesor_nombre: string;
    fecha: string | Date;
    hora_inicio: string | Date;
    hora_fin: string | Date;
    descripcion: string | null;
    id?: string;
  }): CalendarEventInput {
    const tipoLabel = agenda.tipo === "REUNION" ? "Reunion" : "Capacitacion";
    const summary = `[COPE] ${tipoLabel} — ${agenda.ticket}`;

    const startDateTime = this.buildGoogleDateTime(agenda.fecha, agenda.hora_inicio);
    const endDateTime = this.buildGoogleDateTime(agenda.fecha, agenda.hora_fin);

    const descriptionLines = [
      `Ticket: ${agenda.ticket}`,
      `Cliente: ${agenda.cliente_nombre || "N/A"}`,
      `Dominio: ${agenda.dominio || "N/A"}`,
      `Asesor: ${agenda.asesor_nombre} (${agenda.asesor_correo})`,
      `Tipo: ${tipoLabel}`,
    ];
    if (agenda.descripcion) descriptionLines.push(``, agenda.descripcion);

    // Attendees: asesor siempre + cliente si tiene correo válido
    const attendees: { email: string }[] = [];
    if (agenda.asesor_correo) {
      attendees.push({ email: agenda.asesor_correo.toLowerCase().trim() });
    }
    if (agenda.cliente_correo && agenda.cliente_correo.includes("@")) {
      const clienteEmail = agenda.cliente_correo.toLowerCase().trim();
      if (!attendees.some((a) => a.email === clienteEmail)) {
        attendees.push({ email: clienteEmail });
      }
    }

    // ExtendedProperties para identificación COPE
    const extendedProperties: Record<string, string> = { cope: "true" };
    if (agenda.id) {
      extendedProperties.copeAgendaId = agenda.id;
    }

    return {
      summary,
      description: descriptionLines.join("\n"),
      startDateTime,
      endDateTime,
      timeZone: TIMEZONE,
      attendees: attendees.length > 0 ? attendees : undefined,
      location: agenda.dominio ?? undefined,
      extendedProperties,
    };
  },

  /**
   * Retorna un cliente de Calendar autenticado.
   * (Método interno, se llama desde crearEvento/actualizarEvento/etc.)
   */
  async getCalendarClient(): Promise<calendar_v3.Calendar> {
    const authClient = await getAuthenticatedClient();
    return google.calendar({ version: "v3", auth: authClient });
  },

  /**
   * Retorna información del calendario configurado (para diagnóstico).
   */
  async getCalendarInfo(): Promise<{
    calendarId: string;
    timezone: string;
    summary?: string;
    description?: string;
    accessRole?: string;
  }> {
    const calendar = await this.getCalendarClient();
    const calendarId = getCalendarId();
    try {
      const response = await calendar.calendarList.get({ calendarId });
      return {
        calendarId,
        timezone: TIMEZONE,
        summary: response.data.summary ?? undefined,
        description: response.data.description ?? undefined,
        accessRole: response.data.accessRole ?? undefined,
      };
    } catch (err: any) {
      if (err.code === 404) {
        throw new CalendarServiceError(
          "CALENDAR_NOT_FOUND",
          `Calendario no encontrado: ${calendarId}. Verifique GOOGLE_CALENDAR_ID.`
        );
      }
      throw err;
    }
  },

  /**
   * Verifica disponibilidad usando FreeBusy API.
   * Retorna los rangos ocupados en el rango dado.
   */
  async verificarDisponibilidad(
    desde: string,
    hasta: string
  ): Promise<{ busy: { start: string; end: string }[] }> {
    const calendar = await this.getCalendarClient();
    const calendarId = getCalendarId();

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: desde,
        timeMax: hasta,
        timeZone: TIMEZONE,
        items: [{ id: calendarId }],
      },
    });

    const calendars = response.data.calendars;
    const calData = calendars?.[calendarId];
    const busy = (calData?.busy ?? []).map((b) => ({
      start: b.start ?? "",
      end: b.end ?? "",
    }));

    return { busy };
  },

  /**
   * Reconcilia un evento en Google Calendar con los datos de COPE.
   * Compara el evento actual con lo esperado y corrige si difiere.
   * Retorna la acción realizada sin tocar la BD (eso es responsabilidad del caller).
   */
  async reconcileAgenda(
    calendarEventId: string,
    agendaData: {
      ticket: string;
      tipo: string;
      cliente_nombre: string | null;
      dominio: string | null;
      asesor_correo: string;
      asesor_nombre: string;
      fecha: string | Date;
      hora_inicio: string | Date;
      hora_fin: string | Date;
      descripcion: string | null;
    }
  ): Promise<{ action: "synced" | "corrected" | "missing" }> {
    const existing = await this.obtenerEvento(calendarEventId);
    if (!existing.exists) {
      return { action: "missing" };
    }

    const expected = this.buildEventoFromAgenda(agendaData);

    const calendar = await this.getCalendarClient();
    const calendarId = getCalendarId();
    const googleEvent = await calendar.events.get({
      calendarId,
      eventId: calendarEventId,
    });

    const currentSummary = googleEvent.data.summary ?? "";
    const currentStart = googleEvent.data.start?.dateTime ?? "";
    const currentEnd = googleEvent.data.end?.dateTime ?? "";

    if (currentSummary !== expected.summary || currentStart !== expected.startDateTime || currentEnd !== expected.endDateTime) {
      const result = await this.actualizarEvento(calendarEventId, expected);
      return { action: "corrected" };
    }

    return { action: "synced" };
  },
};
