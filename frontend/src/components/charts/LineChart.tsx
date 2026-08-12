import { ChartContainer } from "./ChartContainer";
import { ChartRenderer } from "./ChartRenderer";
import type { ChartConfig, ChartState, LineData } from "./types";

interface Props {
  title: string;
  subtitle?: string;
  data: LineData;
  config?: ChartConfig;
  state?: ChartState;
}

export function LineChart({ title, subtitle, data, config, state }: Props) {
  return (
    <ChartContainer title={title} subtitle={subtitle} {...state}>
      <ChartRenderer data={data} config={{ ...config, variant: "line" }} />
    </ChartContainer>
  );
}
