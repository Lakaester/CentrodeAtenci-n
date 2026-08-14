/** @deprecated Este m�dulo ha sido reemplazado por modules/zendesk-test/. Se eliminar� en M2. */
import { loadZendeskConfig } from "../domain/ZendeskConfig";
import { ZendeskErrorHandler, type ZendeskError } from "../domain/ZendeskErrorHandler";
import type { ZendeskTicket, ZendeskUser, ZendeskComment } from "../domain/ZendeskTypes";
import { z } from "zod";

const zdTicketSchema = z.object({
  id: z.number(),
  subject: z.string(),
  description: z.string().optional().default(""),
  status: z.string(),
  priority: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  requester_id: z.number(),
  assignee_id: z.number().nullable().optional().default(null),
  group_id: z.number().nullable().optional().default(null),
  tags: z.array(z.string()).optional().default([]),
  custom_fields: z.array(z.object({ id: z.number(), value: z.any() })).optional().default([]),
  via: z.object({
    channel: z.string().optional(),
    source: z.object({
      rel: z.string().nullable().optional(),
      from: z.object({
        ticket_id: z.number().nullable().optional(),
        subject: z.string().optional(),
      }).optional(),
    }).optional(),
  }).nullable().optional().default(null),
  followup_ids: z.array(z.number()).optional().default([]),
});

const zdUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional().default(null),
  organization_id: z.number().nullable().optional().default(null),
  role: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

const zdCommentSchema = z.object({
  id: z.number(),
  body: z.string(),
  html_body: z.string().optional(),
  author_id: z.number(),
  type: z.string().nullable().optional(),
  created_at: z.string(),
  public: z.boolean().optional().default(true),
  attachments: z.array(z.object({
    id: z.number(), file_name: z.string(), content_url: z.string(),
  })).optional().default([]),
});

export class ZendeskClient {
  private baseUrl = "";
  private auth = "";
  private configurado = false;
  private static globalUserCache = new Map<number, { name: string; email: string; phone: string | null; role: string; createdAt: string }>();
  private get userCache() { return ZendeskClient.globalUserCache; }
  private lastRequestTime = 0;
  private minRequestGap = 350;

  constructor() {
    const config = loadZendeskConfig();
    this.configurado = !!(config.subdomain && config.email && config.token);
    if (this.configurado) {
      this.baseUrl = `https://${config.subdomain}.zendesk.com/api/v2`;
      this.auth = Buffer.from(`${config.email}/token:${config.token}`).toString("base64");
    }
  }

  /** Warm up connection on server start — makes a lightweight request to establish TLS + auth */
  async warmup(): Promise<void> {
    if (!this.configurado) return;
    try {
      await this.get<any>("/tickets.json?per_page=1");
      console.log("[ZDAPI] Warmup complete");
    } catch {
      // Non-critical
    }
  }

  get estaConfigurado(): boolean {
    return this.configurado;
  }

  async listarTickets(params?: { status?: string; assigneeId?: string; page?: number }): Promise<{ tickets: ZendeskTicket[]; total: number }> {
    this.verificarConfig();
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.assigneeId) query.set("assignee_id", params.assigneeId);
    if (params?.page) query.set("page", String(params.page));
    const data = await this.get<any>(`/tickets.json?${query}`);
    const tickets = (data.tickets ?? []).map((t: any) => zdTicketSchema.parse(t));
    return { tickets, total: data.count ?? tickets.length };
  }

  async searchTickets(query_str: string, limit = 100): Promise<{ tickets: ZendeskTicket[]; total: number }> {
    this.verificarConfig();
    const query = new URLSearchParams({ query: query_str, sort: "updated_at", order: "desc" });
    if (limit) query.set("per_page", String(Math.min(limit, 100)));
    const data = await this.get<any>(`/search.json?${query}`);
    const tickets = (data.results ?? []).map((t: any) => zdTicketSchema.parse(t));
    return { tickets, total: data.count ?? tickets.length };
  }

  async obtenerTicket(id: number): Promise<ZendeskTicket | null> {
    this.verificarConfig();
    try {
      const data = await this.get<any>(`/tickets/${id}.json`);
      return zdTicketSchema.parse(data.ticket);
    } catch {
      return null;
    }
  }

  async obtenerComentarios(ticketId: number): Promise<ZendeskComment[]> {
    this.verificarConfig();
    const data = await this.get<any>(`/tickets/${ticketId}/comments.json`);
    return (data.comments ?? []).map((c: any) => zdCommentSchema.parse(c));
  }

  async obtenerUsuario(id: number): Promise<ZendeskUser | null> {
    const cached = this.userCache.get(id);
    if (cached) {
      return { id, name: cached.name, email: cached.email, phone: cached.phone, role: cached.role as any, created_at: cached.createdAt, updated_at: cached.createdAt, organization_id: null };
    }
    this.verificarConfig();
    try {
      const data = await this.get<any>(`/users/${id}.json`);
      const parsed = zdUserSchema.parse(data.user);
      this.userCache.set(id, { name: parsed.name, email: parsed.email, phone: parsed.phone, role: parsed.role, createdAt: parsed.created_at });
      return parsed;
    } catch {
      return null;
    }
  }

  async obtenerUsuarios(ids: number[]): Promise<ZendeskUser[]> {
    if (ids.length === 0) return [];
    const uncached = ids.filter((id) => !this.userCache.has(id));
    if (uncached.length > 0) {
      this.verificarConfig();
      const query = new URLSearchParams({ ids: uncached.join(",") });
      try {
        const data = await this.get<any>(`/users/show_many.json?${query}`);
        for (const u of data.users ?? []) {
          try {
            const parsed = zdUserSchema.parse(u);
            this.userCache.set(u.id, { name: parsed.name, email: parsed.email, phone: parsed.phone, role: parsed.role, createdAt: parsed.created_at });
          } catch { /* skip invalid */ }
        }
      } catch {
        // If rate limited, return cached data only
      }
    }
    const result: ZendeskUser[] = [];
    for (const id of ids) {
      const cached = this.userCache.get(id);
      if (cached) {
        result.push({ id, name: cached.name, email: cached.email, phone: cached.phone, role: cached.role as any, created_at: cached.createdAt, updated_at: cached.createdAt, organization_id: null });
      }
    }
    return result;
  }

  async obtenerCamposPersonalizados(): Promise<{ id: number; title: string; type: string }[]> {
    this.verificarConfig();
    const data = await this.get<any>("/ticket_fields.json");
    return (data.ticket_fields ?? []).map((f: any) => ({
      id: f.id, title: f.title, type: f.type,
    }));
  }

  async listarVistas(): Promise<{ id: number; title: string; active: boolean }[]> {
    this.verificarConfig();
    const data = await this.get<any>("/views.json");
    return (data.views ?? []).map((v: any) => ({
      id: v.id, title: v.title, active: v.active,
    }));
  }

  async obtenerTicketsDeVista(viewId: number, page?: number): Promise<{ tickets: ZendeskTicket[]; total: number; viewTitle: string }> {
    this.verificarConfig();
    const query = new URLSearchParams();
    if (page) query.set("page", String(page));
    const ticketsData = await this.get<any>(`/views/${viewId}/tickets.json?${query}`);
    const tickets = (ticketsData.tickets ?? []).map((t: any) => zdTicketSchema.parse(t));
    return { tickets, total: ticketsData.count ?? tickets.length, viewTitle: `View #${viewId}` };
  }

  async listarTicketsPorSolicitante(requesterId: number): Promise<{ tickets: ZendeskTicket[]; total: number }> {
    this.verificarConfig();
    const query = new URLSearchParams({ requester_id: String(requesterId) });
    const data = await this.get<any>(`/tickets.json?${query}`);
    const tickets = (data.tickets ?? []).map((t: any) => zdTicketSchema.parse(t));
    return { tickets, total: data.count ?? tickets.length };
  }

  async listarAgentes(): Promise<ZendeskUser[]> {
    this.verificarConfig();
    const data = await this.get<any>("/users.json?role[]=agent&role[]=admin");
    return (data.users ?? []).map((u: any) => zdUserSchema.parse(u));
  }

  async agregarComentario(ticketId: number, body: string, isPublic: boolean): Promise<ZendeskTicket | null> {
    this.verificarConfig();
    const data = await this.put<any>(`/tickets/${ticketId}.json`, {
      ticket: { comment: { body, public: isPublic } },
    });
    const parsed = zdTicketSchema.safeParse(data.ticket);
    if (!parsed.success) {
      console.error(`[ZDAPI] Schema validation error in agregarComentario:`, parsed.error.issues);
      return null;
    }
    return parsed.data;
  }

  /** Upload a file to Zendesk and return the upload token */
  async subirArchivo(fileBuffer: Buffer, filename: string, contentType: string): Promise<string | null> {
    this.verificarConfig();
    try {
      const url = `${this.baseUrl}/uploads.json?filename=${encodeURIComponent(filename)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${this.auth}`,
          "Content-Type": "application/binary",
        },
        body: fileBuffer,
      });
      if (!response.ok) {
        console.error(`[ZDAPI] Upload error ${response.status}: ${await response.text()}`);
        return null;
      }
      const data = await response.json();
      return data.upload?.token ?? null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ZDAPI] Error uploading file ${filename}: ${msg}`);
      return null;
    }
  }

  /** Reply with attachments, optionally change status */
  async responderYResolver(
    ticketId: number,
    body: string,
    uploadTokens: string[],
    nuevoStatus?: string,
  ): Promise<ZendeskTicket | null> {
    this.verificarConfig();
    try {
      const payload: any = {
        ticket: {
          comment: { body, public: true },
        },
      };
      if (uploadTokens.length > 0) {
        payload.ticket.comment.uploads = uploadTokens;
      }
      if (nuevoStatus) {
        payload.ticket.status = nuevoStatus;
      }
      const data = await this.put<any>(`/tickets/${ticketId}.json`, payload);
      const parsed = zdTicketSchema.safeParse(data.ticket);
      if (!parsed.success) {
        console.error(`[ZDAPI] Schema validation error in responderYResolver:`, parsed.error.issues);
        return null;
      }
      return parsed.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ZDAPI] Error in responderYResolver #${ticketId}: ${msg}`);
      return null;
    }
  }

  async asignarTicket(ticketId: number, assigneeId: number): Promise<ZendeskTicket | null> {
    this.verificarConfig();
    try {
      const data = await this.put<any>(`/tickets/${ticketId}.json`, {
        ticket: { assignee_id: assigneeId },
      });
      return zdTicketSchema.parse(data.ticket);
    } catch { return null; }
  }

  async cambiarEstado(ticketId: number, status: string): Promise<ZendeskTicket | null> {
    this.verificarConfig();
    const data = await this.put<any>(`/tickets/${ticketId}.json`, {
      ticket: { status },
    });
    const parsed = zdTicketSchema.safeParse(data.ticket);
    if (!parsed.success) {
      console.error(`[ZDAPI] Schema validation error in cambiarEstado:`, parsed.error.issues);
      return null;
    }
    return parsed.data;
  }

  async actualizarCampos(ticketId: number, fields: { id: number; value: string }[]): Promise<ZendeskTicket | null> {
    this.verificarConfig();
    const data = await this.put<any>(`/tickets/${ticketId}.json`, {
      ticket: { custom_fields: fields },
    });
    const parsed = zdTicketSchema.safeParse(data.ticket);
    if (!parsed.success) {
      console.error(`[ZDAPI] Schema validation error in actualizarCampos:`, parsed.error.issues);
      return null;
    }
    return parsed.data;
  }

  async obtenerOrganizacion(id: number): Promise<{ id: number; name: string } | null> {
    this.verificarConfig();
    try {
      const data = await this.get<any>(`/organizations/${id}.json`);
      return { id: data.organization.id, name: data.organization.name };
    } catch {
      return null;
    }
  }

  private async put<T>(path: string, body: unknown, retries = 3): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const start = Date.now();
    for (let attempt = 0; attempt <= retries; attempt++) {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Basic ${this.auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const elapsed = Date.now() - start;
        const data = await response.json();
        console.log(`[ZendeskAPI] PUT ${path} — ${response.status} — ${elapsed}ms`);
        return data;
      }
      if (response.status === 429 && attempt < retries) {
        const wait = Math.min(2000 * Math.pow(2, attempt), 10000);
        console.log(`[ZDAPI] PUT rate limited, waiting ${wait}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      await this.handleError(response);
      break;
    }
    throw new Error("Max retries exceeded");
  }

  private rateLimitedUntil = 0;

  private rateLimitBucket = { tokens: 30, lastRefill: Date.now(), maxTokens: 30 };
  private consecutiveRateLimits = 0;

  private async get<T>(path: string, retries = 3): Promise<T> {
    // Token bucket rate limiter (30 requests / 60s = 1 per 2s average)
    this.refillBucket();
    if (this.rateLimitBucket.tokens <= 0) {
      const wait = 2000;
      console.log(`[ZDAPI] Bucket empty, waiting ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
      this.refillBucket();
    }
    this.rateLimitBucket.tokens--;

    // Cooldown from previous rate limit
    const now = Date.now();
    if (now < this.rateLimitedUntil) {
      const wait = Math.min(this.rateLimitedUntil - now, 15000);
      console.log(`[ZDAPI] Cooldown ${Math.round(wait / 1000)}s`);
      await new Promise((r) => setTimeout(r, wait));
    }

    // Pacing between requests
    const elapsedSinceLast = Date.now() - this.lastRequestTime;
    if (elapsedSinceLast < this.minRequestGap) {
      await new Promise((r) => setTimeout(r, this.minRequestGap - elapsedSinceLast));
    }

    const url = `${this.baseUrl}${path}`;
    const reqStart = Date.now();
    for (let attempt = 0; attempt <= retries; attempt++) {
      this.lastRequestTime = Date.now();
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${this.auth}`,
          "Content-Type": "application/json",
        },
      });
      const status = response.status;
      if (response.ok) {
        this.consecutiveRateLimits = 0;
        const data = await response.json();
        const elapsed = Date.now() - reqStart;
        console.log(`[ZDAPI] ${status} ${path} — ${elapsed}ms`);
        return data;
      }
      if (status === 429) {
        this.consecutiveRateLimits++;
        const wait = Math.min(2000 * this.consecutiveRateLimits, 10000);
        this.rateLimitedUntil = Date.now() + 20000; // Global cooldown
        console.log(`[ZDAPI] 429 ${path} — attempt ${attempt + 1}/${retries} — waiting ${wait}ms`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        console.log(`[ZDAPI] 429 ${path} — RATE LIMIT EXCEEDED after ${Date.now() - reqStart}ms`);
        throw ZendeskErrorHandler.errorRateLimit();
      }
      console.log(`[ZDAPI] ${status} ${path} — ${Date.now() - reqStart}ms — ERROR`);
      await this.handleError(response);
      break;
    }
    throw new Error("Max retries exceeded");
  }

  private refillBucket(): void {
    const now = Date.now();
    const elapsed = (now - this.rateLimitBucket.lastRefill) / 1000;
    const refill = Math.floor(elapsed * (this.rateLimitBucket.maxTokens / 60));
    if (refill > 0) {
      this.rateLimitBucket.tokens = Math.min(this.rateLimitBucket.maxTokens, this.rateLimitBucket.tokens + refill);
      this.rateLimitBucket.lastRefill = now;
    }
  }

  private async handleError(response: Response): Promise<never> {
    if (response.status === 429) throw ZendeskErrorHandler.errorRateLimit();
    if (response.status === 401) throw ZendeskErrorHandler.errorNoConfigurado();
    if (response.status >= 500) throw ZendeskErrorHandler.errorRed();
    const body = await response.text().catch(() => "");
    throw ZendeskErrorHandler.errorDesconocido(new Error(body || response.statusText));
  }

  private verificarConfig(): void {
    if (!this.configurado) throw ZendeskErrorHandler.errorNoConfigurado();
  }
}

