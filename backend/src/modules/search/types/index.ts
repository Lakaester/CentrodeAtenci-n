export type SearchType =
  | "domain"
  | "email"
  | "phone"
  | "ruc"
  | "company"
  | "ticket"
  | "local_id"
  | "device_id"
  | "unknown";

export interface SearchResult {
  id: string;
  type: SearchType;
  label: string;
  description: string;
  score: number;
  data: Record<string, unknown>;
  source: string;
}

export interface SearchQuery {
  raw: string;
  detectedType: SearchType;
  normalized: string;
}
