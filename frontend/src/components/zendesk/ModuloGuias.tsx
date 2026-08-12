import { BookOpen } from "lucide-react";

export function ModuloGuias() {
  return (
    <div className="rounded-lg border border-black-10 bg-white">
      <div className="flex items-center gap-2 border-b border-black-10 px-2.5 py-1.5">
        <BookOpen size={11} className="text-primary" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-black-45">Guías</span>
      </div>
      <div className="px-2.5 py-2 text-[10px] text-black-25">
        No existe una guía disponible.
      </div>
    </div>
  );
}
