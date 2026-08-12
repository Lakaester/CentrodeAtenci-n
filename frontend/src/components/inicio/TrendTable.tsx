import type { TrendRow } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  data: TrendRow[];
}

export function TrendTable({ data }: Props) {
  if (!data.length) return null;

  const sorted = [...data].sort((a, b) => b.hoy - a.hoy);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45">
            <th className="pb-2 pr-4">Categoría</th>
            <th className="pb-2 pr-4 text-right">Hoy</th>
            <th className="pb-2 text-right">Variación</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.categoria} className={cn("border-t border-black-5", i % 2 === 0 && "bg-light")}>
              <td className="py-2.5 pr-4 text-black-85">{row.categoria}</td>
              <td className="py-2.5 pr-4 text-right font-medium text-black-85">{row.hoy}</td>
              <td className="py-2.5 text-right">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    row.variacion > 0
                      ? "text-danger"
                      : row.variacion < 0
                        ? "text-success"
                        : "text-black-45",
                  )}
                >
                  {row.variacion > 0 ? "+" : ""}{row.variacion}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
