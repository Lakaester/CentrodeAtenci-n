import { ChartContainer } from "./ChartContainer";
import { ChartRenderer } from "./ChartRenderer";
import type { ChartConfig, ChartState, DonutData } from "./types";

interface Props {
  title: string;
  subtitle?: string;
  data: DonutData[];
  config?: ChartConfig;
  state?: ChartState;
}

export function DonutChart({ title, subtitle, data, config, state }: Props) {
  return (
    <ChartContainer title={title} subtitle={subtitle} {...state}>
      <ChartRenderer data={data} config={{ ...config, variant: "donut" }} />
    </ChartContainer>
  );
}
