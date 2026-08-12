import { RefreshCw } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-end gap-3 border-b border-black-10 bg-white px-6">
      <div className="hidden text-sm text-black-45 sm:block">
        Última actualización: <span className="text-black-85 font-medium">—</span>
      </div>
      <button
        className="flex items-center gap-2 rounded border border-black-10 bg-white px-3 py-2 text-sm text-black-45 hover:text-black-85 transition-colors"
        title="Actualizar"
      >
        <RefreshCw size={16} /> Actualizar
      </button>
    </header>
  );
}
