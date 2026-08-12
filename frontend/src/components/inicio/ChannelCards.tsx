import { MessageCircle, Mail, Layers } from "lucide-react";
import type { ChannelData, ChannelGroup } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  data: ChannelGroup;
}

function ChannelCard({ icon, label, data, accentColor }: { icon: React.ReactNode; label: string; data: ChannelData; accentColor: string }) {
  return (
    <div className="rounded-xl border border-black-10 bg-white p-5  transition-colors">
      <div className="mb-4 flex items-center gap-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", accentColor)}>
          {icon}
        </div>
        <h4 className="text-sm font-semibold text-black-85">{label}</h4>
        {data.trend != null && (
          <span className={cn("ml-auto text-xs font-medium", data.trend > 0 ? "text-danger" : "text-success")}>
            {data.trend > 0 ? "+" : ""}{data.trend}%
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-black-25">Pendientes</p>
          <p className="mt-0.5 font-semibold text-black-85">{data.pendientes}</p>
        </div>
        <div>
          <p className="text-xs text-black-25">SLA</p>
          <p className={cn("mt-0.5 font-semibold", data.sla >= 90 ? "text-success" : "text-danger")}>
            {data.sla}%
          </p>
        </div>
        <div>
          <p className="text-xs text-black-25">Mayor Espera</p>
          <p className="mt-0.5 font-semibold text-black-85">{data.mayorEspera}</p>
        </div>
        <div>
          <p className="text-xs text-black-25">Volumen Hoy</p>
          <p className="mt-0.5 font-semibold text-black-85">{data.volumenDia}</p>
        </div>
      </div>
    </div>
  );
}

export function ChannelCards({ data }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <ChannelCard
        icon={<MessageCircle size={16} className="text-success" />}
        label="WhatsApp"
        data={data.whatsapp}
        accentColor="bg-success-5"
      />
      <ChannelCard
        icon={<Mail size={16} className="text-primary" />}
        label="Correo (Zendesk)"
        data={data.correo}
        accentColor="bg-primary-5"
      />
      <ChannelCard
        icon={<Layers size={16} className="text-primary" />}
        label="Consolidado"
        data={data.consolidado}
        accentColor="bg-orange-50"
      />
    </div>
  );
}
