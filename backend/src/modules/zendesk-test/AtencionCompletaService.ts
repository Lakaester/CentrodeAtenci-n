import { ZendeskClient } from "../zendesk/infrastructure/ZendeskClient";
import { parseComment, type ContentBlock } from "./ContentParser";
import { PerfLogger } from "./PerfLogger";

interface InlineAttachment {
  id: string;
  nombre: string;
  url: string;
}

interface ComentarioNormalizado {
  id: string;
  contenido: string;
  html: string | null;
  emisor: string;
  tipo: string;
  timestamp: string;
  adjuntos: InlineAttachment[];
  bloques: ContentBlock[];
}

export interface AtencionCompleta {
  ticket: {
    id: string;
    ticketOriginalId: string;
    ticketOriginalStatus: string;
    asunto: string;
    descripcion: string;
    prioridad: string | null;
    tipo: string | null;
    clienteNombre: string;
    clienteEmail: string | null;
    dominio: string | null;
    pais: string | null;
    hasPendingReply: boolean;
    requesterId: number | null;
    assigneeId: number | null;
    createdAt: string;
    updatedAt: string;
    tags: string[];
  };
  comentarios: ComentarioNormalizado[];
  total: number;
  metrica: {
    ticketMs: number;
    comentariosMs: number;
    usuariosMs: number;
    parseMs: number;
    totalMs: number;
  };
  perf: ReturnType<PerfLogger["toJSON"]>;
}

export class AtencionCompletaService {
  private client: ZendeskClient;

  constructor() {
    this.client = new ZendeskClient();
  }

  async obtener(id: number): Promise<AtencionCompleta | null> {
    const log = new PerfLogger();
    const t0 = Date.now();

    // Step 1: Fetch ticket + comments in parallel
    log.start("zendesk.ticket");
    log.start("zendesk.comments");
    const [ticketResult, commentsResult] = await Promise.all([
      this.client.obtenerTicket(id).then((r) => { log.end("zendesk.ticket", { found: !!r }); return r; }),
      this.client.obtenerComentarios(id).then((r) => { log.end("zendesk.comments", { count: r.length }); return r; }),
    ]);
    log.countRequest();
    log.countRequest();

    if (!ticketResult) return null;

    // Step 2: Parse comments with basic info first (don't wait for users)
    log.start("parse.comments");
    const requesterId = ticketResult.requester_id;
    const comentarios: ComentarioNormalizado[] = commentsResult.map((c) => {
      const adjuntosOriginales = c.attachments.map((a: any) => ({
        id: String(a.id), nombre: a.file_name, url: a.content_url, content_type: a.content_type ?? "", size: a.size ?? 0,
      }));
      const parsed = parseComment(c.body, adjuntosOriginales, c.html_body);
      const esInterna = c.public === false;
      return {
        id: String(c.id),
        contenido: parsed.contenido,
        html: parsed.html,
        emisor: `Usuario #${c.author_id}`,
        tipo: c.author_id === requesterId ? "cliente" : (esInterna ? "nota_interna" : "agente"),
        timestamp: c.created_at,
        adjuntos: parsed.adjuntos,
        bloques: parsed.bloques,
      };
    });
    log.end("parse.comments", { comments: comentarios.length, totalAttachments: comentarios.reduce((s, c) => s + c.adjuntos.length, 0) });

    // Step 3: Fetch users in background (deferred — response returned immediately)
    log.start("users.background");
    const userIds = new Set<number>();
    if (ticketResult.requester_id) userIds.add(ticketResult.requester_id);
    for (const c of commentsResult) userIds.add(c.author_id);
    let usuarioMap = new Map<number, { name: string; role: string; email: string }>();
    try {
      const usuarios = await this.client.obtenerUsuarios([...userIds]);
      usuarioMap = new Map(usuarios.map((u) => [u.id, { name: u.name, role: u.role, email: u.email }]));
      // Update emisor names with real data
      for (const c of comentarios) {
        const id = parseInt(c.id);
        const autor = usuarioMap.get(commentsResult.find((cr) => String(cr.id) === c.id)?.author_id ?? 0);
        if (autor) { c.emisor = autor.name; }
      }
    } catch { /* keep fallback names */ }
    log.end("users.background", { fetched: usuarioMap.size });

    // Step 4: Compute hasPendingReply from last public comment
    // Shows "🟠 Pendiente de respuesta" when the last public message was from the client.
    // The ticket status remains "Abierto" — this is NOT a new state, just a turn indicator.
    const hasPendingReply = (() => {
      // Find last public comment (ignore internal notes)
      const publicComments = commentsResult.filter((c) => c.public !== false);
      if (publicComments.length === 0) {
        // No public comments → client just created the ticket
        return ticketResult.status === "new" || ticketResult.status === "open";
      }
      const last = publicComments[publicComments.length - 1];
      // If the last public comment author is the requester → pending reply
      return last.author_id === ticketResult.requester_id;
    })();

    // Step 5: Build response
    log.start("response.build");
    const ticketUser = ticketResult.requester_id ? usuarioMap.get(ticketResult.requester_id) : null;

    // Extract custom fields
    const cfMap = new Map((ticketResult.custom_fields ?? []).map((cf: any) => [cf.id, cf.value]));
    const dominioVal = cfMap.get(40769061038615);
    const paisVal = cfMap.get(1500005211481);
    const dominio = dominioVal && String(dominioVal).trim() ? String(dominioVal).trim() : null;
    const pais = paisVal && String(paisVal).trim() ? String(paisVal).trim() : null;

    const result: AtencionCompleta = {
      ticket: {
        id: String(ticketResult.id),
        ticketOriginalId: String(ticketResult.id),
        ticketOriginalStatus: ticketResult.status,
        asunto: ticketResult.subject,
        descripcion: ticketResult.description,
        prioridad: ticketResult.priority,
        tipo: ticketResult.type,
        clienteNombre: ticketUser?.name ?? "Usuario Zendesk",
        clienteEmail: ticketUser?.email ?? null,
        dominio,
        pais,
        hasPendingReply,
        createdAt: ticketResult.created_at,
        updatedAt: ticketResult.updated_at,
        tags: ticketResult.tags,
        requesterId: ticketResult.requester_id,
        assigneeId: ticketResult.assignee_id,
      },
      comentarios,
      total: comentarios.length,
      metrica: {
        ticketMs: 0, comentariosMs: 0, usuariosMs: 0, parseMs: 0, totalMs: Date.now() - t0,
      },
      perf: log.toJSON(),
    };
    log.end("response.build", { size: JSON.stringify(result).length });

    console.log(log.report(id));
    return result;
  }
}
