import { type ReactNode } from "react";

interface HeatCellProps {
  value: ReactNode;
  intensity: number;
  variant: "green" | "emerald" | "yellow" | "orange" | "red" | "neutral";
  title?: string;
}

const BG: Record<HeatCellProps["variant"], string> = {
  green:    "rgba(209,250,229,{a})",
  emerald:  "rgba(167,243,208,{a})",
  yellow:   "rgba(254,243,199,{a})",
  orange:   "rgba(254,215,170,{a})",
  red:      "rgba(254,205,211,{a})",
  neutral:  "rgba(241,245,249,{a})",
};

export function MetricsHeatCell({ value, intensity, variant, title }: HeatCellProps) {
  const bg = BG[variant].replace("{a}", String(Math.min(1, Math.max(0, intensity))));
  return (
    <td
      title={title}
      className="whitespace-nowrap border-r border-black-5 px-2 py-1 text-right text-[11px] tabular-nums last:border-r-0"
      style={{ backgroundColor: bg }}
    >
      {value ?? <span className="text-black-10">—</span>}
    </td>
  );
}
