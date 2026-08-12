/** @deprecated Este módulo ha sido reemplazado por modules/zendesk-test/. Se eliminará en M2. */
/**
 * DTOs de frontera del ACL Zendesk.
 * Estos son los Ãºnicos tipos que cruzan el ACL hacia COPE.
 * Los modelos internos (ZendeskTicket, ZendeskUser...) nunca se exponen.
 */
import { z } from "zod";

export const ticketZendeskSchema = z.object({
  id: z.string(),
  ticketOriginalId: z.string(),
  ticketOriginalStatus: z.string(),
  asunto: z.string(),
  descripcion: z.string().optional(),
  prioridad: z.string().nullable().optional(),
  tipo: z.string().optional(),
  clienteId: z.string().optional(),
  clienteNombre: z.string(),
  clienteEmail: z.string().optional(),
  clienteTelefono: z.string().optional(),
  pais: z.string().optional(),
  dominio: z.string().optional(),
  categoria: z.string().optional(),
  subcategoria: z.string().optional(),
  etiquetas: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const mensajeZendeskSchema = z.object({
  id: z.string(),
  contenido: z.string(),
  emisor: z.string(),
  tipo: z.enum(["cliente", "agente", "sistema"]),
  timestamp: z.string(),
});

export const clienteZendeskSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  email: z.string().optional(),
  telefono: z.string().optional(),
});

export const bandejaZendeskSchema = z.object({
  tickets: z.array(ticketZendeskSchema),
  total: z.number(),
  pagina: z.number(),
});

export const conversacionZendeskSchema = z.object({
  ticketId: z.string(),
  mensajes: z.array(mensajeZendeskSchema),
  total: z.number(),
});

export type TicketZendeskDTO = z.infer<typeof ticketZendeskSchema>;
export type MensajeZendeskDTO = z.infer<typeof mensajeZendeskSchema>;
export type ClienteZendeskDTO = z.infer<typeof clienteZendeskSchema>;
export type BandejaZendeskDTO = z.infer<typeof bandejaZendeskSchema>;
export type ConversacionZendeskDTO = z.infer<typeof conversacionZendeskSchema>;

