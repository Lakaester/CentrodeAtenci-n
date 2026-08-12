export function IATab() {
  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-black-85">Resumen Inteligente</h2>
      <p className="mt-1 text-[11px] text-black-45">
        Panel de IA. Recibirá un DiagnosisResult con hallazgos, recomendaciones y próximos pasos. Pendiente de implementar.
      </p>
      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-black-10 bg-white p-3">
          <p className="text-[10px] uppercase tracking-wide text-black-25">Hallazgos</p>
          <p className="mt-1 text-[11px] text-black-25 italic">—</p>
        </div>
        <div className="rounded-lg border border-black-10 bg-white p-3">
          <p className="text-[10px] uppercase tracking-wide text-black-25">Recomendaciones</p>
          <p className="mt-1 text-[11px] text-black-25 italic">—</p>
        </div>
        <div className="rounded-lg border border-black-10 bg-white p-3">
          <p className="text-[10px] uppercase tracking-wide text-black-25">Próximos pasos</p>
          <p className="mt-1 text-[11px] text-black-25 italic">—</p>
        </div>
      </div>
    </div>
  );
}
