import { cn } from "@/lib/utils";

const CHANNELS: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  zendesk:  { label: "Zendesk",  icon: "✉", bg: "bg-black-5",    text: "text-black-45" },
  meta:     { label: "Meta",     icon: "🟢", bg: "bg-success-5",   text: "text-success" },
  whaticket:{ label: "Whaticket",icon: "💬", bg: "bg-success-5",   text: "text-success" },
  chat:     { label: "Chat",     icon: "🎧", bg: "bg-primary-5",      text: "text-primary" },
  llamada:  { label: "Llamada",  icon: "📞", bg: "bg-purple-5",    text: "text-purple" },
  correo:   { label: "Correo",   icon: "📧", bg: "bg-warning-5",     text: "text-warning-65" },
};

export function ChannelBadge({ canal, size = "sm" }: { canal: string; size?: "sm" | "md" }) {
  const ch = CHANNELS[canal] ?? { label: canal, icon: "🔌", bg: "bg-black-5", text: "text-black-45" };
  const s = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-1";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded font-medium", s, ch.bg, ch.text)}>
      <span>{ch.icon}</span>
      <span>{ch.label}</span>
    </span>
  );
}

export function ChannelDot({ canal }: { canal: string }) {
  const ch = CHANNELS[canal] ?? { label: canal, icon: "🔌", bg: "bg-black-5", text: "text-black-45" };
  return (
    <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-[10px]", ch.bg)} title={ch.label}>
      {ch.icon}
    </span>
  );
}

export const CANALES_DISPONIBLES = [
  { id: "zendesk",  label: "Zendesk",  disponible: true  },
  { id: "meta",     label: "Meta",     disponible: false },
  { id: "whaticket",label: "Whaticket", disponible: false },
  { id: "chat",     label: "Chat",     disponible: false },
  { id: "correo",   label: "Correo",   disponible: false },
];
