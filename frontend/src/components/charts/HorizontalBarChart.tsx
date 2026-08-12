import { ChartContainer } from "./ChartContainer";
import { ChartRenderer } from "./ChartRenderer";
import type { ChartConfig, ChartState, BarData } from "./types";

interface Props {
  title: string;
  subtitle?: string;
  data: BarData;
  config?: ChartConfig;
  state?: ChartState;
}

export function HorizontalBarChart({ title, subtitle, data, config, state }: Props) {
  return (
    <ChartContainer title={title} subtitle={subtitle} {...state}>
      <ChartRenderer data={data} config={{ ...config, variant: "hbar" }} />
    </ChartContainer>
  );
}
