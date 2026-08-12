import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "./Input";

export type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  render: (row: T, index: number) => React.ReactNode;
};

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  pageSize?: number;
  selectable?: boolean;
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
  getId: (row: T) => string;
  expandRow?: (row: T) => React.ReactNode;
  maxHeight?: string;
}

export function DataTable<T>({
  columns,
  data,
  searchable = false,
  searchKeys,
  pageSize = 10,
  selectable = false,
  selectedIds = [],
  onSelect,
  onSelectAll,
  getId,
  expandRow,
  maxHeight = "max-h-[600px]",
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const allSelected = selectedIds.length === data.length && data.length > 0;

  const filtered = useMemo(() => {
    if (!search || !searchKeys?.length) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        const v = row[key];
        return String(v ?? "").toLowerCase().includes(q);
      }),
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = String(a[sortKey as keyof T] ?? "");
      const bVal = String(b[sortKey as keyof T] ?? "");
      const cmp = aVal.localeCompare(bVal, "es", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div>
      {searchable && (
        <div className="mb-3">
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            onClear={() => {
              setSearch("");
              setPage(0);
            }}
            placeholder="Buscar..."
          />
        </div>
      )}

      <div className={cn("overflow-x-auto border border-black-5 rounded-lg", maxHeight, "overflow-y-auto")}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-light">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45">
              {expandRow && <th className="w-10 px-3 py-3" />}
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="h-4 w-4 accent-primary"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3 py-3",
                    col.sortable && "cursor-pointer select-none hover:text-black-85",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable &&
                      (sortKey === col.key ? (
                        sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <ChevronsUpDown size={14} className="opacity-40" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (expandRow ? 1 : 0)}
                  className="py-12 text-center text-sm text-black-25"
                >
                  No se encontraron resultados
                </td>
              </tr>
            ) : (
              paged.map((row, i) => {
                const id = getId(row);
                const isExpanded = expandedId === id;
                const isSelected = selectedIds.includes(id);
                return (
                  <tbody key={id}>
                    <tr
                      className={cn(
                        "border-t border-black-5 transition-colors hover:bg-light",
                        i % 2 === 1 && "bg-light/50",
                        isSelected && "bg-primary-5",
                      )}
                    >
                      {expandRow && (
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : id)}
                            className="text-black-45 hover:text-black-65"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      )}
                      {selectable && (
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelect?.(id)}
                            className="h-4 w-4 accent-primary"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-3 py-2.5 text-black-85",
                            col.align === "right" && "text-right",
                            col.align === "center" && "text-center",
                          )}
                        >
                          {col.render(row, i)}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && expandRow && (
                      <tr className="border-t border-black-5 bg-light">
                        <td colSpan={columns.length + (selectable ? 1 : 0) + 1} className="px-6 py-4">
                          {expandRow(row)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-black-45">
          <span>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} de {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="flex h-8 w-8 items-center justify-center rounded hover:bg-light disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(0, page - 2);
              const idx = start + i;
              if (idx >= totalPages) return null;
              return (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded text-sm",
                    idx === page ? "bg-primary text-white" : "hover:bg-light",
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-8 w-8 items-center justify-center rounded hover:bg-light disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
