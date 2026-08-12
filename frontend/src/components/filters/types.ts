export type FilterValue = string | string[] | [string, string] | undefined;

export interface FilterOption {
  value: string;
  label: string;
}

export type FilterType = "select" | "multi" | "date-range" | "search";

export interface FilterConfig {
  id: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  placeholder?: string;
}

export interface FilterState {
  [id: string]: FilterValue;
}

export type FilterStatus = "idle" | "loading" | "error" | "disabled";

export interface FilterGroupConfig {
  id: string;
  label: string;
  filters: FilterConfig[];
}
