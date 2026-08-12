export type SearchResultType =
  | "domain" | "email" | "phone" | "ruc" | "company"
  | "ticket" | "local_id" | "device_id" | "unknown";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  label: string;
  description: string;
  score: number;
  data: Record<string, unknown>;
  source: string;
}

export interface SearchResponse {
  results: SearchResult[];
  type: string;
}
