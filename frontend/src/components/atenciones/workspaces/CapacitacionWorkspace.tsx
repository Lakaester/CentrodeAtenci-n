import { BookOpen, Video, FileText, HelpCircle } from "lucide-react";
import { AccesosRapidos } from "./AccesosRapidos";

function Card({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-black-10 bg-light p-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6]">{icon}</div>
      <div>
        <p className="text-xs font-medium text-black-85">{label}</p>
        <p className="text-[10px] text-black-45">{desc}</p>
      </div>
    </div>
  );
}

export function CapacitacionWorkspace() {
  return (
    <div className="space-y-2 p-3">
      <Card icon={<BookOpen size={16} />} label="Cursos sugeridos" desc="Facturación Electrónica Avanzada · Atención al Cliente · Resolución de Conflictos" />
      <Card icon={<Video size={16} />} label="Videos" desc="Cómo usar el Workspace · Gestión de tickets · Reportes básicos" />
      <Card icon={<FileText size={16} />} label="Manual" desc="Manual de usuario COPE v3.2 — disponible para descarga" />
      <Card icon={<HelpCircle size={16} />} label="Preguntas frecuentes" desc="¿Cómo derivar un ticket? · ¿Qué hacer con SLA vencido?" />
      <AccesosRapidos categoria="Capacitación" />
    </div>
  );
}
