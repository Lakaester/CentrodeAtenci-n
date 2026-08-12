import { useMemo } from "react";
import { ConversationProvider, type MensajeGenerico, type MensajeCanal } from "./ConversationTypes";
import { ZendeskConversationProvider } from "./providers/ZendeskProvider";
import { DefaultConversationProvider } from "./providers/DefaultProvider";

const providers: Record<string, ConversationProvider> = {
  zendesk: new ZendeskConversationProvider(),
  default: new DefaultConversationProvider(),
};

function getProvider(canal: MensajeCanal | string): ConversationProvider {
  return providers[canal] ?? providers["default"];
}

function SeparadorDia({ fecha }: { fecha: string }) {
  const d = new Date(fecha);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  let label: string;
  if (d.toDateString() === hoy.toDateString()) label = "Hoy";
  else if (d.toDateString() === ayer.toDateString()) label = "Ayer";
  else label = d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="h-px flex-1 bg-black-10" />
      <span className="shrink-0 text-[10px] font-medium text-black-25 capitalize">{label}</span>
      <div className="h-px flex-1 bg-black-10" />
    </div>
  );
}

interface Props {
  mensajes: MensajeGenerico[];
  canal: MensajeCanal | string;
}

export function ConversationEngine({ mensajes, canal }: Props) {
  const provider = getProvider(canal);

  const timeline = useMemo(() => {
    const items: (MensajeGenerico | { tipo: "separador"; fecha: string })[] = [];
    let ultimoDia = "";
    for (const msg of mensajes) {
      const dia = msg.timestamp ? new Date(msg.timestamp).toDateString() : "";
      if (dia && dia !== ultimoDia) {
        items.push({ tipo: "separador" as const, fecha: msg.timestamp });
        ultimoDia = dia;
      }
      items.push(msg);
    }
    return items;
  }, [mensajes]);

  if (timeline.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[11px] text-black-25 py-8">
        Sin mensajes en la conversación
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {timeline.map((item, i) => {
        if ("tipo" in item && item.tipo === "separador") {
          return <SeparadorDia key={`sep-${i}`} fecha={item.fecha} />;
        }
        const msg = item as MensajeGenerico;
        return (
          <div key={msg.id}>
            {provider.renderizar(msg, i === timeline.length - 1)}
          </div>
        );
      })}
    </div>
  );
}
