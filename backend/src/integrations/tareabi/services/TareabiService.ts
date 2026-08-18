/**
 * TareabiService — orquesta las consultas a Tareabi y normaliza la respuesta.
 * Devuelve para un ticket: estado actual, comentarios y historial de cambios.
 */
import { TareabiClient, TareabiHttpError, TareabiInvalidResponse, TareabiTimeout } from "../client/TareabiClient";
import type { TareabiLogEntry, TareabiTicketLogDTO, TareabiDetalle } from "../types";

export type TareabiResult<T> =
  | { status: "success"; data: T }
  | { status: "error"; mensaje: string }
  | { status: "unavailable"; mensaje: string };

interface LogsRequest {
  tareabiId: string;
  ticketbiId: string;
}

export class TareabiService {
  private client = new TareabiClient();

  private mensajeDeError(err: unknown): string {
    if (err instanceof TareabiHttpError) return err.message;
    if (err instanceof TareabiTimeout) return err.message;
    if (err instanceof TareabiInvalidResponse) return err.message;
    const msg = err instanceof Error ? err.message : String(err);
    return `Tareabi no disponible: ${msg}`;
  }

  private parseJsonCampo(valor: string | undefined): Record<string, { oldvalue?: string; newvalue?: string }> | null {
    if (!valor) return null;
    try {
      const parsed = JSON.parse(valor);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  private parseJsonPlano(valor: string | undefined): Record<string, unknown> | null {
    if (!valor) return null;
    try {
      const parsed = JSON.parse(valor);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Estado actual desde un log. El `logtabla_valoractual` trae los campos
   * planos (p. ej. "tarea_estado":"Completo"); el `logtabla_edited` trae
   * {oldvalue,newvalue}. Se prioriza el valoractual plano, con fallback al edited.
   */
  private estadoActualDeLog(log: TareabiLogEntry, campoEstado: string): string | null {
    const plano = this.parseJsonPlano(log.logtabla_valoractual);
    if (plano && plano[campoEstado] != null) return String(plano[campoEstado]);
    const actual = this.parseJsonCampo(log.logtabla_valoractual);
    if (actual && actual[campoEstado]?.newvalue != null) return String(actual[campoEstado].newvalue);
    return null;
  }

  private personaDe(log: TareabiLogEntry): string | null {
    const p = log.personabi;
    if (!p) return null;
    const nombre = [p.personabi_nombres, p.personabi_apellidos].filter(Boolean).join(" ").trim();
    return nombre || null;
  }

  /** Normaliza el historial de una tarea. */
  private normalizarLogsTarea(logs: TareabiLogEntry[]): TareabiTicketLogDTO["tareas"] {
    const porTarea = new Map<string, TareabiLogEntry[]>();
    for (const log of logs) {
      const id = log.logtabla_idregistroalterado ?? log.logtabla_id;
      if (!id) continue;
      if (!porTarea.has(id)) porTarea.set(id, []);
      porTarea.get(id)!.push(log);
    }

    const tareas: TareabiTicketLogDTO["tareas"] = [];
    for (const [tareabiId, entradas] of porTarea) {
      // Estado y comentario del estado final (valoractual plano).
      const ultima = entradas[entradas.length - 1];
      const estado = this.estadoActualDeLog(ultima, "tarea_estado");
      const valorActualPlano = this.parseJsonPlano(ultima.logtabla_valoractual);
      const comentario = (valorActualPlano?.tarea_comentario as string | undefined) ?? null;

      const historial = entradas.map((log) => ({
        fecha: log.logtabla_fecharegistro ?? null,
        persona: this.personaDe(log),
        accion: log.logtabla_proceso ?? null,
        cambios: Object.entries(this.parseJsonCampo(log.logtabla_edited) ?? {})
          .map(([campo, v]) => ({
            campo,
            anterior: v?.oldvalue ?? "",
            nuevo: v?.newvalue ?? "",
          })),
      }));

      tareas.push({ tareabi_id: tareabiId, tarea_estado: estado, tarea_comentario: comentario, responsable: null, historial });
    }
    return tareas;
  }

  /** Logs de un ticket: estado actual del ticket + tareas con comentario e historial. */
  async obtenerLogsPorTicket(req: LogsRequest): Promise<TareabiResult<TareabiTicketLogDTO>> {
    try {
      const envelope = await this.client.obtenerLogs(req.tareabiId, req.ticketbiId);
      if (String(envelope.tipo) === "3") {
        return { status: "error", mensaje: envelope.mensajes?.join(" · ") || "Error en Tareabi" };
      }
      const logsTicket = envelope.data?.logsTicket ?? [];
      const logsTarea = envelope.data?.logsTarea ?? [];
      const ticketUltimo = logsTicket[logsTicket.length - 1];
      const ticketEstado = this.estadoActualDeLog(ticketUltimo, "ticketbi_estado");
      return {
        status: "success",
        data: {
          ticketbi_id: req.ticketbiId,
          ticket_estado_actual: ticketEstado,
          tareas: this.normalizarLogsTarea(logsTarea),
        },
      };
    } catch (err) {
      return { status: "unavailable", mensaje: this.mensajeDeError(err) };
    }
  }

  /** Detalle de una tarea (estado + comentario). */
  async obtenerDetalle(tareabiId: string): Promise<TareabiResult<TareabiDetalle>> {
    try {
      const envelope = await this.client.obtenerDetalle(tareabiId);
      if (String(envelope.tipo) === "3") {
        return { status: "error", mensaje: envelope.mensajes?.join(" · ") || "Error en Tareabi" };
      }
      return { status: "success", data: envelope.data };
    } catch (err) {
      return { status: "unavailable", mensaje: this.mensajeDeError(err) };
    }
  }

  /** Catálogo de estados de tareas (para badges). */
  async obtenerEstados(): Promise<TareabiResult<string[]>> {
    try {
      const envelope = await this.client.obtenerDatosEstaticos();
      const estados = (envelope.data?.estadoList ?? []).map((e) => e.value);
      return { status: "success", data: estados };
    } catch (err) {
      return { status: "unavailable", mensaje: this.mensajeDeError(err) };
    }
  }
}
