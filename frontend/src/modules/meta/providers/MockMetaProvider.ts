import type { MetaProvider } from "./MetaProvider";
import type { MetaTicketDTO, MetaTicketResponseDTO, MetaMessageDTO, MetaConversationResponseDTO } from "../dto/meta.dto";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const NAMES = ["Carlos Mendoza", "Ana Torres", "Pedro García", "Lucía Fernández", "Roberto Sánchez", "María Flores", "Jorge Castillo", "Sofía Vega", "Diego Ramos", "Ana Martínez", "Luis Gómez", "Carmen Ruiz", "José López", "Rosa Pérez", "Miguel Ángel", "Laura Silva", "Fernando Castro", "Patricia Ortiz", "Andrés Navarro", "Gabriela Ríos"];
const QUEUES = ["WhatsApp General", "Soporte Técnico", "Ventas", "Facturación", "Postventa"];
const USERS = ["María López", "Carlos Ruiz", "Ana Martínez", "Jorge Castillo", "Sofía Vega"];

const ago = (m: number) => new Date(Date.now() - m * 60000).toISOString();

function generateTickets(count: number): MetaTicketDTO[] {
  return Array.from({ length: count }, (_, i) => {
    const statusIdx = i % 4;
    const status = ["open", "pending", "closed", "group"][statusIdx] as "open" | "pending" | "closed" | "group";
    return {
      id: 10000 + i,
      status,
      lastMessage: [
        "Gracias por su ayuda, quedamos atentos",
        "¿Podría confirmar el horario de atención?",
        "Necesito mi factura electrónica urgente",
        "El enlace de pago no funciona correctamente",
        "Muchas gracias, buen servicio",
        "Solicito información sobre mi plan actual",
        "No he recibido el comprobante aún",
        "¿Puede ayudarme con mi nueva contraseña?",
        "El producto llegó en mal estado",
        "Requiero una cotización para mi empresa",
      ][i % 10],
      updatedAt: ago(i * 15 + 2),
      contact: {
        id: 50000 + i,
        name: NAMES[i % NAMES.length],
        number: `519${String(90000000 + i).slice(0, 8)}`,
        email: i % 3 === 0 ? `contacto${i}@email.com` : null,
        profilePicUrl: null,
      },
      queue: i % 5 !== 0 ? { id: 100 + (i % 5), name: QUEUES[i % 5], color: ["#10B981", "#2563EB", "#F59E0B", "#EF4444", "#8B5CF6"][i % 5] } : null,
      user: i % 3 !== 0 ? { id: 200 + (i % 5), name: USERS[i % 5], email: `asesor${i % 5}@cope.com`, profilePicUrl: null } : null,
      whatsapp: { id: 300, name: "WhatsApp Principal", number: "51999000101" },
      conversationWindow: status === "open" ? { id: 1000 + i, lastInteractionAt: ago(i * 10), expiresAt: ago(-(i % 240)), isExpired: i % 2 === 0 } : null,
    };
  });
}

function generateConversation(ticketId: number): MetaMessageDTO[] {
  const msgs: MetaMessageDTO[] = [];
  const contactName = "Cliente";
  const agentName = "Asesor COPE";
  const count = 5 + (ticketId % 8);

  for (let i = 0; i < count; i++) {
    const fromMe = i % 2 === 0;
    msgs.push({
      id: `msg-${ticketId}-${i}`,
      ticketId,
      body: [
        "Buenos días, necesito ayuda con mi factura",
        "Claro, con gusto le ayudo. ¿Me indica su RUC?",
        "Mi RUC es 20123456789",
        "Gracias, ya encontré su registro. ¿Qué necesita?",
        "Requiero la factura electrónica del mes pasado",
        "En un momento se la envío. ¿A qué correo?",
        "a mi correo registrado por favor",
        "Listo, ya le envié la factura. ¿Algo más?",
        "Sí, también necesito mi comprobante de pago",
        "Deme un momento que lo reviso...",
        "Perfecto, gracias por su paciencia",
        "De nada, quedamos atentos a cualquier consulta",
        "Gracias, buen día",
        "Igualmente, que tenga un excelente día",
      ][i % 14],
      fromMe,
      senderName: fromMe ? agentName : contactName,
      createdAt: ago((count - i) * 2 + 1),
      messageType: "text",
      attachments: [],
      quotedMsgId: null,
      read: fromMe || i < count - 1,
    });
  }
  return msgs;
}

const MOCK_TICKETS = generateTickets(50);

export const mockMetaProvider: MetaProvider = {
  getTickets: async (): Promise<MetaTicketResponseDTO> => {
    await delay(300);
    return { tickets: MOCK_TICKETS, count: MOCK_TICKETS.length, hasMore: false };
  },
  getConversation: async (ticketId: number): Promise<MetaConversationResponseDTO> => {
    await delay(300);
    return { messages: generateConversation(ticketId), hasMore: false };
  },
  sendMessage: async () => { await delay(200); return { ok: true }; },
  closeTicket: async () => { await delay(200); return { ok: true }; },
};
