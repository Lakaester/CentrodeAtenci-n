interface Props {
  health: { overall: string; healthy: number; total: number };
}

export function HealthWidget({ health }: Props) {
  const colorMap: Record<string, string> = {
    healthy: "bg-success-50", degraded: "bg-warning-50", warning: "bg-orange-500",
    unhealthy: "bg-danger-50", offline: "bg-black-50", unknown: "bg-gray-400",
  };

  return (
    <div className="rounded-lg border border-black-10 bg-white p-3">
      <p className="text-[10px] uppercase tracking-wide text-black-25">Salud del sistema</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${colorMap[health.overall] ?? "bg-gray-400"}`} />
        <span className="text-sm font-semibold text-black-85 capitalize">{health.overall}</span>
        <span className="text-[11px] text-black-45">{health.healthy}/{health.total} checks OK</span>
      </div>
    </div>
  );
}
