import { AreaChart } from "@/components/charts";
import type { LineData } from "@/components/charts/types";

interface Props {
  data: LineData;
  state: "loading" | "empty" | "error" | "success";
  error: string | null;
}

export function PerformanceChart({ data, state, error }: Props) {
  return (
    <AreaChart
      title="Evolución del SLA"
      subtitle="Últimos 7 días"
      data={data}
      state={{ isLoading: state === "loading", isEmpty: false, error: state === "error" ? error : null }}
    />
  );
}
