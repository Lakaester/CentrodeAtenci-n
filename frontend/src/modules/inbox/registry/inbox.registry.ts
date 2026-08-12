import type { InboxChannel, InboxSubChannel } from "../dto/inbox.dto";

export const CHANNEL_CONFIG: Record<InboxChannel, { label: string; icon: string; order: number }> = {
  email:     { label: "Correo",    icon: "📧", order: 0 },
  whatsapp:  { label: "WhatsApp",  icon: "💬", order: 1 },
  chat:      { label: "Chat",      icon: "💬", order: 2 },
  instagram: { label: "Instagram", icon: "📱", order: 3 },
  facebook:  { label: "Facebook",  icon: "📱", order: 4 },
  bot:       { label: "Bot",       icon: "🤖", order: 5 },
  unknown:   { label: "Desconocido", icon: "❓", order: 6 },
};

export const SUBCHANNEL_CONFIG: Record<InboxSubChannel, { label: string; order: number }> = {
  zendesk:   { label: "Zendesk",   order: 0 },
  meta:      { label: "Meta",      order: 1 },
  whaticket: { label: "Whaticket", order: 2 },
  unknown:   { label: "Desconocido", order: 3 },
};
