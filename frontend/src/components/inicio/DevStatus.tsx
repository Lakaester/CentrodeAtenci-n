import { Inbox, Code2, ClipboardCheck, GitMerge } from "lucide-react";
import type { DevStatus as DevStatusType } from "./types";

interface Props {
  data: DevStatusType;
}

function DevCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-black-10 bg-white p-4  transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#6366F1]/10 text-[#6366F1]">
        {icon}
      </div>
      <div>
        <p className={color ? `text-2xl font-bold tracking-tight ${color}` : "text-2xl font-bold tracking-tight text-black-85"}>
          {value}
        </p>
        <p className="text-xs text-black-45">{label}</p>
      </div>
    </div>
  );
}

export function DevStatus({ data }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <DevCard icon={<Inbox size={18} />} label="Pendientes" value={String(data.pendientes)} />
      <DevCard icon={<Code2 size={18} />} label="En Desarrollo" value={String(data.enDesarrollo)} color="text-purple" />
      <DevCard icon={<ClipboardCheck size={18} />} label="QA" value={String(data.qa)} color="text-warning" />
      <DevCard icon={<GitMerge size={18} />} label="Cerrados Hoy" value={String(data.cerradosHoy)} color="text-success" />
    </div>
  );
}
