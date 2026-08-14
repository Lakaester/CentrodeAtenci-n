import { useState, useEffect } from "react";

function fmt(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

interface Props {
  startedAt: string;
  pausas: { started_at: string; finished_at: string | null }[];
  finishedAt?: string | null;
  pausada: boolean;
}

export function Cronometro({ startedAt, pausas, finishedAt, pausada }: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (pausada || finishedAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [pausada, finishedAt]);

  const ahora = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  const start = new Date(startedAt).getTime();
  const bruta = Math.max(0, ahora - start);

  let pausadaMs = 0;
  for (const p of pausas) {
    const fin = p.finished_at ? new Date(p.finished_at).getTime() : Date.now();
    pausadaMs += Math.max(0, fin - new Date(p.started_at).getTime());
  }
  const efectiva = Math.max(0, bruta - pausadaMs);

  return (
    <div className="text-center">
      <div className="font-mono text-2xl font-semibold text-black-85">{fmt(efectiva)}</div>
      <div className="mt-0.5 text-[9px] text-black-25">tiempo activo</div>
    </div>
  );
}
