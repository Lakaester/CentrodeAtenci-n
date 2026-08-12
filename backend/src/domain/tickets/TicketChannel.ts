export type ExternalChannel = "whaticket" | "meta" | "zendesk" | "correo" | "api";
export type InternalChannel = "whatsapp" | "meta" | "zendesk" | "correo" | "api";

export interface ChannelConfig {
  channel: InternalChannel;
  displayName: string;
  slaDefaultMinutes: number;
}

export const CHANNEL_CONFIG: Record<ExternalChannel, ChannelConfig> = {
  whaticket: { channel: "whatsapp", displayName: "WhatsApp (Whaticket)", slaDefaultMinutes: 15 },
  meta: { channel: "meta", displayName: "Meta (WhatsApp/Instagram)", slaDefaultMinutes: 15 },
  zendesk: { channel: "zendesk", displayName: "Zendesk", slaDefaultMinutes: 1440 },
  correo: { channel: "correo", displayName: "Correo electrónico", slaDefaultMinutes: 1440 },
  api: { channel: "api", displayName: "API externa", slaDefaultMinutes: 60 },
};
